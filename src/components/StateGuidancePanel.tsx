import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { getStateRequirementProfile } from '../data/stateRequirements';
import { styles } from './styles';
import { InfoLine } from './InfoLine';
import { SectionTitle } from './SectionTitle';

export function StateGuidancePanel({ stateCode }: { stateCode?: string }) {
  const profile = getStateRequirementProfile(stateCode);

  if (!profile) {
    return (
      <View style={styles.panel}>
        <SectionTitle title="State Context" />
        <Text style={styles.rowSub}>Choose a directive state to organize documents by jurisdiction.</Text>
      </View>
    );
  }

  return (
    <View style={styles.panel}>
      <SectionTitle title="State Context" />
      <InfoLine label="State" value={profile.stateName} />
      <InfoLine label="Use" value={profile.jurisdictionLabel} />
      <InfoLine label="Legal status" value={profile.legalStatus} />
      <View style={styles.statusGrid}>
        {profile.documentRequirements.map((document) => (
          <View key={document.id} style={styles.statusPill}>
            <Ionicons name="document-text-outline" size={15} color="#0f766e" />
            <Text style={styles.statusText}>{document.label}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.rowSub}>{profile.guidanceNote}</Text>
      <Text style={styles.tinyText}>Optional reference: {profile.sourceLabel}</Text>
      <Text style={styles.tinyText}>POLST source: {profile.polstSourceLabel}</Text>
    </View>
  );
}
