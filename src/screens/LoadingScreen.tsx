import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../components/styles';

export function LoadingScreen() {
  return (
    <SafeAreaView style={styles.shell}>
      <View style={styles.centerScreen}>
        <Ionicons name="shield-checkmark" size={44} color="#0f766e" />
        <Text style={styles.cardTitle}>Loading vault...</Text>
      </View>
    </SafeAreaView>
  );
}
