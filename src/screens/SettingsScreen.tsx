import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, linkWithCredential } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { FeatureRow } from '../components/FeatureRow';
import { Header } from '../components/Header';
import { InfoLine } from '../components/InfoLine';
import { SectionTitle } from '../components/SectionTitle';
import { StateChecklistPanel } from '../components/StateChecklistPanel';
import { StateGuidancePanel } from '../components/StateGuidancePanel';
import { StatePicker } from '../components/StatePicker';
import { styles } from '../components/styles';
import { backupVaultKeyWithPassphrase, restoreVaultKeyWithPassphrase } from '../lib/documentKeys';
import { firebaseAuth } from '../lib/firebase';
import { VaultData } from '../types/vault';

WebBrowser.maybeCompleteAuthSession();

const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const googleAndroidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const googleIosUrlScheme = googleIosClientId ? `com.googleusercontent.apps.${googleIosClientId.replace('.apps.googleusercontent.com', '')}` : undefined;

export function SettingsScreen({
  vault,
  updateVault,
  resetVault,
  userEmail,
  onSignOut,
}: {
  vault: VaultData;
  updateVault: (patch: Partial<VaultData>) => void;
  resetVault: () => void;
  userEmail: string | null;
  onSignOut: () => void;
}) {
  const [recoveryPhrase, setRecoveryPhrase] = useState('');
  const [isRecoveryWorking, setIsRecoveryWorking] = useState(false);
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [googleRequest, googleResponse, promptGoogleSignIn] = Google.useIdTokenAuthRequest(
    {
      clientId: googleWebClientId || googleIosClientId || googleAndroidClientId || 'missing-google-client-id',
      webClientId: googleWebClientId,
      iosClientId: googleIosClientId,
      androidClientId: googleAndroidClientId,
      selectAccount: true,
    },
    {
      native: googleIosUrlScheme ? `${googleIosUrlScheme}:/oauthredirect` : undefined,
    },
  );
  const googleConfigured = Boolean(googleWebClientId || (Platform.OS === 'ios' && googleIosClientId) || (Platform.OS === 'android' && googleAndroidClientId));
  const hasGoogleProvider = firebaseAuth.currentUser?.providerData.some((provider) => provider.providerId === 'google.com') ?? false;

  const backupVaultKey = async () => {
    setIsRecoveryWorking(true);
    try {
      await backupVaultKeyWithPassphrase(recoveryPhrase);
      setRecoveryPhrase('');
      Alert.alert('Recovery enabled', 'Your vault key backup was updated for this account.');
    } catch (error) {
      Alert.alert('Recovery setup failed', error instanceof Error ? error.message : 'Could not back up the vault key.');
    } finally {
      setIsRecoveryWorking(false);
    }
  };

  const restoreVaultKey = async () => {
    setIsRecoveryWorking(true);
    try {
      await restoreVaultKeyWithPassphrase(recoveryPhrase);
      setRecoveryPhrase('');
      Alert.alert('Vault key restored', 'This device can now open documents protected by your vault key.');
    } catch (error) {
      Alert.alert('Recovery failed', error instanceof Error ? error.message : 'Could not restore the vault key.');
    } finally {
      setIsRecoveryWorking(false);
    }
  };

  const linkGoogle = async () => {
    if (!googleConfigured || !googleRequest) {
      Alert.alert('Google sign-in unavailable', 'Add Google OAuth client IDs to .env first.');
      return;
    }

    setIsLinkingGoogle(true);
    await promptGoogleSignIn();
  };

  useEffect(() => {
    if (googleResponse?.type !== 'success') {
      return;
    }

    const idToken = googleResponse.params.id_token;
    const currentUser = firebaseAuth.currentUser;

    if (!idToken || !currentUser) {
      setIsLinkingGoogle(false);
      return;
    }

    linkWithCredential(currentUser, GoogleAuthProvider.credential(idToken))
      .then(() => Alert.alert('Google connected', 'You can now sign in to this same account with Google.'))
      .catch((error) => {
        Alert.alert('Could not connect Google', formatAuthError(error));
      })
      .finally(() => setIsLinkingGoogle(false));
  }, [googleResponse]);

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Header title="Settings" subtitle="MVP vault configuration" />
      <View style={styles.panel}>
        <Text style={styles.inputLabel}>Vault owner</Text>
        <TextInput style={styles.input} value={vault.memberName} onChangeText={(memberName) => updateVault({ memberName })} />
        <Text style={styles.inputLabel}>Directive state</Text>
        <StatePicker
          value={vault.directiveStateCode}
          onChange={(state) => updateVault({ directiveState: state.name, directiveStateCode: state.code })}
        />
      </View>
      <StateGuidancePanel stateCode={vault.directiveStateCode} />
      <StateChecklistPanel vault={vault} />
      <View style={styles.panel}>
        <SectionTitle title="Security Model" />
        <FeatureRow icon="scan-outline" title="Biometric unlock" detail="Wired with expo-local-authentication when hardware is available." />
        <FeatureRow icon="lock-closed-outline" title="Local PDF encryption" detail="New uploads are encrypted into app storage before backend upload." />
        <FeatureRow icon="key-outline" title="Recovery phrase" detail="Protects the vault key backup used to restore document access on another device." />
        <FeatureRow icon="list-outline" title="Audit log" detail="Vault changes are logged locally." />
      </View>
      <View style={styles.panel}>
        <SectionTitle title="Vault Recovery" />
        <Text style={styles.rowSub}>Set or update the phrase used to restore encrypted documents on a new phone. It is saved securely on this phone for normal sign-ins.</Text>
        <Text style={styles.inputLabel}>Recovery phrase</Text>
        <TextInput
          autoCapitalize="none"
          onChangeText={setRecoveryPhrase}
          placeholder="At least 12 characters"
          secureTextEntry
          style={styles.input}
          value={recoveryPhrase}
        />
        <Pressable style={styles.secondaryButton} disabled={isRecoveryWorking} onPress={backupVaultKey}>
          <Text style={styles.secondaryButtonText}>{isRecoveryWorking ? 'Working...' : 'Back Up Vault Key'}</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} disabled={isRecoveryWorking} onPress={restoreVaultKey}>
          <Text style={styles.secondaryButtonText}>Restore Vault Key</Text>
        </Pressable>
      </View>
      <View style={styles.panel}>
        <SectionTitle title="Account Sign-In" />
        <InfoLine label="Email" value={userEmail ?? 'Unknown Firebase user'} />
        <InfoLine label="Google" value={hasGoogleProvider ? 'Connected' : 'Not connected'} />
        {!hasGoogleProvider && (
          <Pressable style={styles.secondaryButton} disabled={!googleConfigured || !googleRequest || isLinkingGoogle} onPress={linkGoogle}>
            <Ionicons name="logo-google" size={20} color="#0f766e" />
            <Text style={styles.secondaryButtonText}>{isLinkingGoogle ? 'Connecting...' : 'Connect Google Sign-In'}</Text>
          </Pressable>
        )}
      </View>
      <View style={styles.panel}>
        <SectionTitle title="Secure Upload Pipeline" />
        <InfoLine label="Signed in as" value={userEmail ?? 'Unknown Firebase user'} />
        <InfoLine label="Selected PDFs" value={`${vault.documents.filter((document) => document.localUri).length}`} />
        <InfoLine label="Encrypted locally" value={`${vault.documents.filter((document) => document.encryptedLocalUri).length}`} />
        <InfoLine label="Queued for backend" value={`${vault.documents.filter((document) => document.uploadStatus === 'Encrypted locally' || document.uploadStatus === 'Encrypted upload queued').length}`} />
        <InfoLine label="Backend adapter" value="Firebase Storage + Firestore" />
      </View>
      <View style={styles.panel}>
        <SectionTitle title="Subscription" />
        <InfoLine label="Client plan" value="$49/year" />
        <InfoLine label="Family plan" value="$99/year" />
        <InfoLine label="Attorney plan" value="$99/month" />
      </View>
      <View style={styles.panel}>
        <SectionTitle title="About" />
        <InfoLine label="App" value="AdvanceVault MVP" />
        <Text style={styles.rowSub}>AdvanceVault stores local vault records, encrypts selected PDFs before upload, and keeps Firebase documents scoped to the signed-in user.</Text>
      </View>
      <View style={styles.panel}>
        <SectionTitle title="Contact" />
        <InfoLine label="Support" value="support@example.com" />
        <Text style={styles.rowSub}>Use this contact for product support and issue reports. Replace this with the production support inbox before release.</Text>
      </View>
      <View style={styles.panel}>
        <SectionTitle title="Disclaimer" />
        <Text style={styles.rowSub}>AdvanceVault is not a law firm, medical provider, or emergency service. Information in the app is educational and does not replace advice from an attorney, clinician, or qualified professional. Users are responsible for executing documents according to applicable state requirements.</Text>
      </View>
      <Pressable style={styles.dangerButton} onPress={resetVault}>
        <Text style={styles.dangerButtonText}>Reset Vault Data</Text>
      </Pressable>
      <Pressable style={styles.secondaryButton} onPress={onSignOut}>
        <Text style={styles.secondaryButtonText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

function formatAuthError(error: unknown) {
  if (typeof error === 'object' && error && 'code' in error && typeof error.code === 'string') {
    switch (error.code) {
      case 'auth/credential-already-in-use':
        return 'That Google account is already connected to another AdvanceVault account.';
      case 'auth/provider-already-linked':
        return 'Google is already connected to this account.';
      case 'auth/email-already-in-use':
      case 'auth/account-exists-with-different-credential':
        return 'That email is already connected to another sign-in method.';
      case 'auth/network-request-failed':
        return 'Network request failed. Check the device connection and Firebase setup.';
      case 'auth/operation-not-allowed':
        return 'Enable Google sign-in in Firebase Authentication first.';
    }
  }

  return error instanceof Error ? error.message : 'Authentication failed.';
}
