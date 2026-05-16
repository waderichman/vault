import { Pressable, Text, View } from 'react-native';
import { styles } from './styles';

export function SegmentedOptions<T extends string>({ options, value, setValue }: { options: T[]; value: T; setValue: (value: T) => void }) {
  return (
    <View style={styles.segmented}>
      {options.map((option) => {
        const selected = value === option;
        return (
          <Pressable key={option} style={[styles.segmentButton, selected && styles.segmentButtonActive]} onPress={() => setValue(option)}>
            <Text style={[styles.segmentText, selected && styles.segmentTextActive]}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
