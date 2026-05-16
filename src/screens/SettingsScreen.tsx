import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { FeatureRow } from '../components/FeatureRow';
import { Header } from '../components/Header';
import { InfoLine } from '../components/InfoLine';
import { SectionTitle } from '../components/SectionTitle';
import { styles } from '../components/styles';
import { VaultData } from '../types/vault';

export function SettingsScreen({
  vault,
  updateVault,
  resetVault,
}: {
  vault: VaultData;
  updateVault: (patch: Partial<VaultData>) => void;
  resetVault: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Header title="Settings" subtitle="MVP vault configuration" />
      <View style={styles.panel}>
        <Text style={styles.inputLabel}>Vault owner</Text>
        <TextInput style={styles.input} value={vault.memberName} onChangeText={(memberName) => updateVault({ memberName })} />
        <Text style={styles.inputLabel}>Directive state</Text>
        <TextInput style={styles.input} value={vault.directiveState} onChangeText={(directiveState) => updateVault({ directiveState })} />
      </View>
      <View style={styles.panel}>
        <SectionTitle title="Attorney Office" />
        <Text style={styles.inputLabel}>Firm</Text>
        <TextInput style={styles.input} value={vault.attorneyFirm} onChangeText={(attorneyFirm) => updateVault({ attorneyFirm })} />
        <Text style={styles.inputLabel}>Attorney</Text>
        <TextInput style={styles.input} value={vault.attorneyName} onChangeText={(attorneyName) => updateVault({ attorneyName })} />
        <Text style={styles.inputLabel}>Phone</Text>
        <TextInput style={styles.input} value={vault.attorneyPhone} onChangeText={(attorneyPhone) => updateVault({ attorneyPhone })} />
        <Text style={styles.inputLabel}>Email</Text>
        <TextInput style={styles.input} value={vault.attorneyEmail} onChangeText={(attorneyEmail) => updateVault({ attorneyEmail })} autoCapitalize="none" />
      </View>
      <View style={styles.panel}>
        <SectionTitle title="Security Model" />
        <FeatureRow icon="scan-outline" title="Biometric unlock" detail="Wired with expo-local-authentication when hardware is available." />
        <FeatureRow icon="lock-closed-outline" title="Local PDF encryption" detail="New uploads are encrypted into app storage before backend upload." />
        <FeatureRow icon="list-outline" title="Audit log" detail="Emergency approvals and vault changes are logged locally." />
      </View>
      <View style={styles.panel}>
        <SectionTitle title="Secure Upload Pipeline" />
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
      <Pressable style={styles.dangerButton} onPress={resetVault}>
        <Text style={styles.dangerButtonText}>Reset Demo Data</Text>
      </Pressable>
    </ScrollView>
  );
}
