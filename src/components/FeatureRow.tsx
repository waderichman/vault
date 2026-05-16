import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { styles } from './styles';

export function FeatureRow({
  icon,
  title,
  detail,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  detail: string;
}) {
  return (
    <View style={styles.featureRow}>
      <Ionicons name={icon} size={24} color="#0f766e" />
      <View style={styles.featureText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub}>{detail}</Text>
      </View>
    </View>
  );
}
