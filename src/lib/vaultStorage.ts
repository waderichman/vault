import AsyncStorage from '@react-native-async-storage/async-storage';
import { defaultVault } from '../data/defaultVault';
import { VaultData } from '../types/vault';

const STORAGE_KEY_PREFIX = 'advance-vault:v1';

export async function loadVault(userId: string) {
  const raw = await AsyncStorage.getItem(storageKey(userId));
  return raw ? ({ ...defaultVault, ...JSON.parse(raw) } as VaultData) : defaultVault;
}

export async function saveVault(userId: string, vault: VaultData) {
  await AsyncStorage.setItem(storageKey(userId), JSON.stringify(vault));
}

export async function clearVault(userId: string) {
  await AsyncStorage.removeItem(storageKey(userId));
}

function storageKey(userId: string) {
  return `${STORAGE_KEY_PREFIX}:${userId}`;
}
