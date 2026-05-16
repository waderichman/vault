import { Text } from 'react-native';
import { styles } from './styles';

export function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}
