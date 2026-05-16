import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FeatureRow } from '../components/FeatureRow';
import { styles } from '../components/styles';

export function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  return (
    <SafeAreaView style={styles.shell}>
      <ScrollView contentContainerStyle={styles.onboarding}>
        <Text style={styles.heroTitle}>When you cannot speak, this speaks for you.</Text>
        <Text style={styles.heroCopy}>Store verified health care proxies, HIPAA authorizations, and living wills so the right people can act fast.</Text>
        <FeatureRow icon="document-lock-outline" title="Core directives" detail="Proxy, HIPAA authorization, and living will in one focused vault." />
        <FeatureRow icon="checkmark-done-circle-outline" title="Document authenticity" detail="Attorney-uploaded, signed, witnessed, reviewed, and active status." />
        <FeatureRow icon="alert-circle-outline" title="Emergency controls" detail="Trusted contacts can approve or deny access requests inside the app." />
        <Pressable style={styles.primaryButton} onPress={onComplete}>
          <Ionicons name="add-circle-outline" size={20} color="#ffffff" />
          <Text style={styles.primaryButtonText}>Create My Vault</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
