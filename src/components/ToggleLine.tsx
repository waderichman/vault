import { Switch, Text, View } from 'react-native';
import { styles } from './styles';

export function ToggleLine({ label, value, setValue }: { label: string; value: boolean; setValue: (value: boolean) => void }) {
  return (
    <View style={styles.toggleLine}>
      <Text style={styles.rowTitle}>{label}</Text>
      <Switch value={value} onValueChange={setValue} trackColor={{ true: '#99f6e4', false: '#cbd5e1' }} thumbColor={value ? '#0f766e' : '#f8fafc'} />
    </View>
  );
}
