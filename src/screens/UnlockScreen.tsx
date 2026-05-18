import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../components/styles';

export function UnlockScreen({ onUnlock }: { onUnlock: () => void }) {
  return (
    <SafeAreaView style={styles.shell}>
      <StatusBar style="dark" />
      <View style={styles.unlockScreen}>
        <View style={styles.lockIcon}>
          <Ionicons name="shield-checkmark" size={48} color="#0f766e" />
        </View>
        <Text style={styles.heroTitle}>AdvanceVault</Text>
        <Text style={styles.heroCopy}>Secure storage for advance health care directives.</Text>
        <Pressable style={styles.primaryButton} onPress={onUnlock}>
          <Ionicons name="scan-outline" size={20} color="#ffffff" />
          <Text style={styles.primaryButtonText}>Unlock Vault</Text>
        </Pressable>
        <Text style={styles.disclaimer}>Uses Expo local authentication when your device supports it.</Text>
      </View>
    </SafeAreaView>
  );
}
