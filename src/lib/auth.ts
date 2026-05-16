import { Alert } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

export async function authenticate(setUnlocked: (value: boolean) => void) {
  const canAuthenticate = await LocalAuthentication.hasHardwareAsync();

  if (!canAuthenticate) {
    setUnlocked(true);
    return;
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Unlock AdvanceVault',
    fallbackLabel: 'Use passcode',
    cancelLabel: 'Cancel',
  });

  if (result.success) {
    setUnlocked(true);
  } else {
    Alert.alert('Vault locked', 'Authentication was canceled.');
  }
}
