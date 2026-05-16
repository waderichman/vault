import AsyncStorage from '@react-native-async-storage/async-storage';
import { defaultVault } from '../data/defaultVault';
import { VaultData } from '../types/vault';

const STORAGE_KEY = 'advance-vault:v1';

export async function loadVault() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? ({ ...defaultVault, ...JSON.parse(raw) } as VaultData) : defaultVault;
}

export async function saveVault(vault: VaultData) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(vault));
}

export async function clearVault() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
