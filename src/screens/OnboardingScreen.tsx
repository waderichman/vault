import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FeatureRow } from '../components/FeatureRow';
import { StateGuidancePanel } from '../components/StateGuidancePanel';
import { StatePicker } from '../components/StatePicker';
import { styles } from '../components/styles';
import { VaultData } from '../types/vault';

export function OnboardingScreen({ onComplete }: { onComplete: (patch: Partial<VaultData>) => void }) {
  const [memberName, setMemberName] = useState('');
  const [directiveState, setDirectiveState] = useState('');
  const [directiveStateCode, setDirectiveStateCode] = useState<string | undefined>();

  const createVault = () => {
    const name = memberName.trim();
    const state = directiveState.trim();

    if (!name || !state) {
      Alert.alert('Vault details needed', 'Enter the vault owner name and directive state.');
      return;
    }

    onComplete({
      onboarded: true,
      memberName: name,
      directiveState: state,
      directiveStateCode,
      auditLog: [{ id: 'audit-created', message: 'Vault created', createdAt: 'Just now' }],
    });
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
        <FeatureRow icon="document-lock-outline" title="Core directives" detail="Proxy, HIPAA authorization, and living will in one focused vault." />
        <FeatureRow icon="checkmark-done-circle-outline" title="Document status" detail="Track signed, witnessed, notarized, attorney-reviewed, and active status when known." />
        <FeatureRow icon="alert-circle-outline" title="Emergency controls" detail="Trusted contacts can approve or deny access requests inside the app." />
        <Pressable style={styles.primaryButton} onPress={createVault}>
          <Ionicons name="add-circle-outline" size={20} color="#ffffff" />
          <Text style={styles.primaryButtonText}>Create My Vault</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
