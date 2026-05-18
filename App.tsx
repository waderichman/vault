import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { TabBar } from './src/components/tab-bar';
import { styles } from './src/components/styles';
import { defaultVault } from './src/data/defaultVault';
import { authenticate } from './src/lib/auth';
import { clearCloudDocuments, loadCloudDocuments, mergeCloudDocuments } from './src/lib/cloudDocuments';
import { hasLocalVaultKey, restoreVaultKeyFromSavedPassphrase } from './src/lib/documentKeys';
import { firebaseAuth } from './src/lib/firebase';
import { makeId } from './src/lib/ids';
import { upsertUserProfile } from './src/lib/userProfile';
import { clearVault, loadVault, saveVault } from './src/lib/vaultStorage';
import { AuthScreen } from './src/screens/AuthScreen';
import { LoadingScreen } from './src/screens/LoadingScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { PeopleScreen } from './src/screens/PeopleScreen';
import { RecoveryScreen } from './src/screens/RecoveryScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { UnlockScreen } from './src/screens/UnlockScreen';
import { VaultScreen } from './src/screens/VaultScreen';
import { Tab, VaultData } from './src/types/vault';

export default function App() {
  return (
    <SafeAreaProvider>
      <AdvanceVaultApp />
    </SafeAreaProvider>
  );
}

function AdvanceVaultApp() {
  const [unlocked, setUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('vault');
  const [vault, setVault] = useState<VaultData>(defaultVault);
  const [loaded, setLoaded] = useState(false);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [vaultKeyReady, setVaultKeyReady] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, (nextUser) => {
      setUser(nextUser);
      setUnlocked(false);
      setActiveTab('vault');
      setVaultKeyReady(true);
      setAuthLoaded(true);
      if (nextUser) {
        upsertUserProfile(nextUser).catch((error) => {
          console.warn('Could not save user profile', error);
        });
      }
    });
  }, []);

  useEffect(() => {
    if (!user) {
      setVault(defaultVault);
      setLoaded(false);
      return;
    }

    setLoaded(false);
    loadVault(user.uid)
      .then(async (localVault) => {
        const mergedVault = mergeCloudDocuments(localVault, await loadCloudDocuments(user.uid));
        const hasCloudEncryptedDocuments = mergedVault.documents.some(
          (document) => document.remoteStoragePath || document.wrappedEncryptionKey || document.uploadStatus === 'Uploaded encrypted blob',
        );
        let keyReady = true;

        if (hasCloudEncryptedDocuments) {
          keyReady = await hasLocalVaultKey();

          if (!keyReady) {
            try {
              keyReady = await restoreVaultKeyFromSavedPassphrase();
            } catch (error) {
              console.warn('Could not restore vault key from saved phrase', error);
            }
          }
        }

        setVaultKeyReady(keyReady);
        return mergedVault;
      })
      .then(setVault)
      .finally(() => setLoaded(true));
  }, [user]);

  useEffect(() => {
    if (loaded && user) {
      saveVault(user.uid, vault);
    }
  }, [loaded, user, vault]);

  const updateVault = (patch: Partial<VaultData>) => {
    setVault((current) => ({ ...current, ...patch }));
  };

  const addAudit = (message: string) => {
    setVault((current) => ({
      ...current,
      auditLog: [{ id: makeId('audit'), message, createdAt: 'Just now' }, ...current.auditLog],
    }));
  };

  const resetVault = () => {
    Alert.alert('Reset vault?', 'This clears this account’s document records from this device and Firebase.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          if (user) {
            await clearCloudDocuments(user.uid).catch((error) => {
              console.warn('Could not clear cloud documents', error);
            });
            await clearVault(user.uid);
          }
          setVault(defaultVault);
          setUnlocked(false);
        },
      },
    ]);
  };

  const signOutUser = async () => {
    await signOut(firebaseAuth);
  };

  if (!authLoaded) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (!loaded) {
    return <LoadingScreen />;
  }

  if (!unlocked) {
    return <UnlockScreen onUnlock={() => authenticate(setUnlocked)} />;
  }

  if (!vaultKeyReady) {
    return <RecoveryScreen onRestored={() => setVaultKeyReady(true)} />;
  }

  if (!vault.onboarded) {
    return <OnboardingScreen onComplete={updateVault} />;
  }

  return (
    <SafeAreaView style={styles.shell}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        {activeTab === 'vault' && <VaultScreen vault={vault} setVault={setVault} addAudit={addAudit} defaultUploader={user.email ?? user.displayName ?? ''} />}
        {activeTab === 'people' && <PeopleScreen vault={vault} setVault={setVault} addAudit={addAudit} />}
        {activeTab === 'settings' && (
          <SettingsScreen vault={vault} updateVault={updateVault} resetVault={resetVault} userEmail={user.email} onSignOut={signOutUser} />
        )}
      </View>
      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </SafeAreaView>
  );
}
