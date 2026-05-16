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
        <SectionTitle title="State Guidance" />
        <Text style={styles.rowSub}>Choose a directive state to show state-aware document guidance.</Text>
      </View>
    );
  }

  return (
    <View style={styles.panel}>
      <SectionTitle title="State Guidance" />
      <InfoLine label="State" value={profile.stateName} />
      <InfoLine label="Review status" value={profile.reviewStatus} />
      <View style={styles.statusGrid}>
        {profile.recommendedDocuments.map((document) => (
          <View key={document} style={styles.statusPill}>
            <Ionicons name="document-text-outline" size={15} color="#0f766e" />
            <Text style={styles.statusText}>{document}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.rowSub}>{profile.guidanceNote}</Text>
      <Text style={styles.tinyText}>Source: {profile.sourceLabel}</Text>
    </View>
  );
}
