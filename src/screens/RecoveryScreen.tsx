import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../components/Header';
import { styles } from '../components/styles';
import { restoreVaultKeyWithPassphrase } from '../lib/documentKeys';

export function RecoveryScreen({ onRestored }: { onRestored: () => void }) {
  const [recoveryPhrase, setRecoveryPhrase] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);

  const restore = async () => {
    const phrase = recoveryPhrase.trim();

    if (phrase.length < 12) {
      Alert.alert('Recovery phrase needed', 'Enter the recovery phrase you created for this vault.');
      return;
    }

    setIsRestoring(true);
    try {
      await restoreVaultKeyWithPassphrase(phrase);
      setRecoveryPhrase('');
      onRestored();
    } catch (error) {
      Alert.alert('Recovery failed', error instanceof Error ? error.message : 'Could not restore the vault key.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <SafeAreaView style={styles.shell}>
      <ScrollView contentContainerStyle={styles.onboarding}>
        <Header title="Restore Documents" subtitle="Enter your recovery phrase once on this phone." />
        <View style={styles.panel}>
          <Ionicons name="key-outline" size={28} color="#0f766e" />
          <Text style={styles.rowSub}>
            This lets the app open your encrypted documents on this device. After this, it is saved in secure phone storage for future sign-ins.
          </Text>
          <Text style={styles.inputLabel}>Recovery phrase</Text>
          <TextInput
            autoCapitalize="none"
            onChangeText={setRecoveryPhrase}
            placeholder="Your recovery phrase"
            secureTextEntry
            style={styles.input}
            value={recoveryPhrase}
          />
        </View>
        <Pressable style={styles.primaryButton} disabled={isRestoring} onPress={restore}>
          <Ionicons name={isRestoring ? 'hourglass-outline' : 'lock-open-outline'} size={20} color="#ffffff" />
          <Text style={styles.primaryButtonText}>{isRestoring ? 'Restoring...' : 'Continue'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
