import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FeatureRow } from '../components/FeatureRow';
import { StateGuidancePanel } from '../components/StateGuidancePanel';
import { StatePicker } from '../components/StatePicker';
import { styles } from '../components/styles';
import { backupVaultKeyWithPassphrase } from '../lib/documentKeys';
import { VaultData } from '../types/vault';

export function OnboardingScreen({ onComplete }: { onComplete: (patch: Partial<VaultData>) => void }) {
  const [memberName, setMemberName] = useState('');
  const [directiveState, setDirectiveState] = useState('');
  const [directiveStateCode, setDirectiveStateCode] = useState<string | undefined>();
  const [recoveryPhrase, setRecoveryPhrase] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const createVault = async () => {
    const name = memberName.trim();
    const state = directiveState.trim();
    const phrase = recoveryPhrase.trim();

    if (!name || !state) {
      Alert.alert('Vault details needed', 'Enter the vault owner name and directive state.');
      return;
    }

    if (phrase.length < 12) {
      Alert.alert('Recovery phrase needed', 'Create a recovery phrase with at least 12 characters.');
      return;
    }

    setIsCreating(true);
    try {
      await backupVaultKeyWithPassphrase(phrase);
      onComplete({
        onboarded: true,
        memberName: name,
        directiveState: state,
        directiveStateCode,
        auditLog: [{ id: 'audit-created', message: 'Vault created with recovery enabled', createdAt: 'Just now' }],
      });
    } catch (error) {
      Alert.alert('Could not create recovery backup', error instanceof Error ? error.message : 'Try again before creating your vault.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <SafeAreaView style={styles.shell}>
      <ScrollView contentContainerStyle={styles.onboarding}>
        <Text style={styles.heroTitle}>When you cannot speak, this speaks for you.</Text>
        <Text style={styles.heroCopy}>Store health care proxies, HIPAA authorizations, and living wills so the right people can act fast.</Text>
        <View style={styles.panel}>
          <Text style={styles.inputLabel}>Vault owner</Text>
          <TextInput style={styles.input} value={memberName} onChangeText={setMemberName} placeholder="Full legal name" />
          <Text style={styles.inputLabel}>Directive state</Text>
          <StatePicker
            value={directiveStateCode}
            onChange={(state) => {
              setDirectiveStateCode(state.code);
              setDirectiveState(state.name);
            }}
          />
        </View>
        <StateGuidancePanel stateCode={directiveStateCode} />
        <View style={styles.panel}>
          <Text style={styles.inputLabel}>Recovery phrase</Text>
          <TextInput
            autoCapitalize="none"
            onChangeText={setRecoveryPhrase}
            placeholder="At least 12 characters"
            secureTextEntry
            style={styles.input}
            value={recoveryPhrase}
          />
          <Text style={styles.rowSub}>Use this phrase to open your encrypted documents after reinstalling the app or getting a new phone. It is saved securely on this phone for normal sign-ins.</Text>
        </View>
        <FeatureRow icon="document-lock-outline" title="Core directives" detail="Proxy, HIPAA authorization, and living will in one focused vault." />
        <FeatureRow icon="checkmark-done-circle-outline" title="Document status" detail="Track signed, witnessed, notarized, attorney-reviewed, and active status when known." />
        <FeatureRow icon="people-outline" title="Trusted contacts" detail="Keep family, attorney, or clinician contact details alongside the vault." />
        <Pressable style={styles.primaryButton} disabled={isCreating} onPress={createVault}>
          <Ionicons name="add-circle-outline" size={20} color="#ffffff" />
          <Text style={styles.primaryButtonText}>{isCreating ? 'Creating Vault...' : 'Create My Vault'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
