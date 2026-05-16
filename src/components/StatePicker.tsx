import { Pressable, Text, View } from 'react-native';
import { styles } from './styles';
import { UsStateCode, usStates } from '../data/usStates';

export function StatePicker({
  value,
  onChange,
}: {
  value?: string;
  onChange: (state: { code: UsStateCode; name: string }) => void;
}) {
  return (
    <View style={styles.stateGrid}>
      {usStates.map((state) => {
        const selected = value === state.code;

        return (
          <Pressable key={state.code} style={[styles.stateButton, selected && styles.segmentButtonActive]} onPress={() => onChange(state)}>
            <Text style={[styles.stateCode, selected && styles.segmentTextActive]}>{state.code}</Text>
            <Text style={[styles.stateName, selected && styles.segmentTextActive]}>{state.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
