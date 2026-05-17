import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { FeatureRow } from '../components/FeatureRow';
import { Header } from '../components/Header';
import { InfoLine } from '../components/InfoLine';
import { SectionTitle } from '../components/SectionTitle';
import { StateChecklistPanel } from '../components/StateChecklistPanel';
import { StateGuidancePanel } from '../components/StateGuidancePanel';
import { StatePicker } from '../components/StatePicker';
import { styles } from '../components/styles';
import { VaultData } from '../types/vault';

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
        <Text style={styles.dangerButtonText}>Reset Demo Data</Text>
      </Pressable>
      <Pressable style={styles.secondaryButton} onPress={onSignOut}>
        <Text style={styles.secondaryButtonText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}
