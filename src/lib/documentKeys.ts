import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import CryptoJS from 'crypto-js';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { firebaseAuth, firestore } from './firebase';

const keychainOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

function storageKey(keyId: string) {
  return `advance-vault.document-key.${keyId}`;
}

function vaultStorageKey(userId: string) {
  return `advance-vault.vault-key.${userId}`;
}

function recoveryPhraseStorageKey(userId: string) {
  return `advance-vault.recovery-phrase.${userId}`;
}

export async function saveDocumentKey(keyId: string, keyHex: string) {
  await SecureStore.setItemAsync(storageKey(keyId), keyHex, keychainOptions);
}

export async function loadDocumentKey(keyId: string) {
  return SecureStore.getItemAsync(storageKey(keyId), keychainOptions);
}

export async function getOrCreateVaultKey() {
  const userId = firebaseAuth.currentUser?.uid;

  if (!userId) {
    throw new Error('Sign in before creating encrypted document keys.');
  }

  const key = vaultStorageKey(userId);
  const existing = await SecureStore.getItemAsync(key, keychainOptions);

  if (existing) {
    return existing;
  }

  const vaultKeyHex = bytesToWordArray(Crypto.getRandomBytes(32)).toString(CryptoJS.enc.Hex);
  await SecureStore.setItemAsync(key, vaultKeyHex, keychainOptions);
  return vaultKeyHex;
}

export async function loadVaultKey() {
  const userId = firebaseAuth.currentUser?.uid;

  if (!userId) {
    throw new Error('Sign in before loading encrypted document keys.');
  }

  return SecureStore.getItemAsync(vaultStorageKey(userId), keychainOptions);
}

export async function hasLocalVaultKey() {
  return Boolean(await loadVaultKey());
}

export async function wrapDocumentKey(documentKeyHex: string) {
  const vaultKeyHex = await getOrCreateVaultKey();
  const iv = bytesToWordArray(Crypto.getRandomBytes(16));
  const encrypted = CryptoJS.AES.encrypt(documentKeyHex, CryptoJS.enc.Hex.parse(vaultKeyHex), {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return {
    wrappedEncryptionKey: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
    wrappedEncryptionKeyIv: iv.toString(CryptoJS.enc.Hex),
    keyWrapAlg: 'AES-CBC',
  };
}

export async function unwrapDocumentKey(wrappedEncryptionKey: string, wrappedEncryptionKeyIv: string) {
  const vaultKeyHex = await loadVaultKey();

  if (!vaultKeyHex) {
    throw new Error('Vault key recovery is needed before opening this document.');
  }

  const decrypted = CryptoJS.AES.decrypt(
    { ciphertext: CryptoJS.enc.Base64.parse(wrappedEncryptionKey) } as CryptoJS.lib.CipherParams,
    CryptoJS.enc.Hex.parse(vaultKeyHex),
    {
      iv: CryptoJS.enc.Hex.parse(wrappedEncryptionKeyIv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    },
  );
  const documentKeyHex = decrypted.toString(CryptoJS.enc.Utf8);

  if (!documentKeyHex) {
    throw new Error('Could not recover the document key.');
  }

  return documentKeyHex;
}

export async function backupVaultKeyWithPassphrase(passphrase: string) {
  const userId = firebaseAuth.currentUser?.uid;

  if (!userId) {
    throw new Error('Sign in before backing up your vault key.');
  }

  const trimmed = passphrase.trim();

  if (trimmed.length < 12) {
    throw new Error('Use a recovery phrase with at least 12 characters.');
  }

  const vaultKeyHex = await getOrCreateVaultKey();
  const salt = bytesToWordArray(Crypto.getRandomBytes(16)).toString(CryptoJS.enc.Hex);
  const iv = bytesToWordArray(Crypto.getRandomBytes(16));
  const iterations = 150000;
  const wrappingKey = deriveRecoveryKey(trimmed, salt, iterations);
  const encrypted = CryptoJS.AES.encrypt(vaultKeyHex, wrappingKey, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  await setDoc(
    doc(firestore, 'users', userId),
    {
      vaultKeyBackup: {
        wrappedVaultKey: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
        wrappedVaultKeyIv: iv.toString(CryptoJS.enc.Hex),
        salt,
        iterations,
        kdf: 'PBKDF2-SHA256',
        alg: 'AES-CBC',
        updatedAt: serverTimestamp(),
      },
    },
    { merge: true },
  );

  await saveRecoveryPhrase(userId, trimmed);
}

export async function restoreVaultKeyWithPassphrase(passphrase: string) {
  const userId = firebaseAuth.currentUser?.uid;

  if (!userId) {
    throw new Error('Sign in before restoring your vault key.');
  }

  const userDoc = await getDoc(doc(firestore, 'users', userId));
  const backup = userDoc.data()?.vaultKeyBackup as
    | {
        wrappedVaultKey?: string;
        wrappedVaultKeyIv?: string;
        salt?: string;
        iterations?: number;
      }
    | undefined;

  if (!backup?.wrappedVaultKey || !backup.wrappedVaultKeyIv || !backup.salt || !backup.iterations) {
    throw new Error('No recovery backup is available for this account.');
  }

  const wrappingKey = deriveRecoveryKey(passphrase.trim(), backup.salt, backup.iterations);
  const decrypted = CryptoJS.AES.decrypt(
    { ciphertext: CryptoJS.enc.Base64.parse(backup.wrappedVaultKey) } as CryptoJS.lib.CipherParams,
    wrappingKey,
    {
      iv: CryptoJS.enc.Hex.parse(backup.wrappedVaultKeyIv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    },
  );
  const vaultKeyHex = decrypted.toString(CryptoJS.enc.Utf8);

  if (!vaultKeyHex) {
    throw new Error('Recovery phrase did not unlock this vault.');
  }

  await SecureStore.setItemAsync(vaultStorageKey(userId), vaultKeyHex, keychainOptions);
  await saveRecoveryPhrase(userId, passphrase.trim());
}

export async function restoreVaultKeyFromSavedPassphrase() {
  const userId = firebaseAuth.currentUser?.uid;

  if (!userId) {
    throw new Error('Sign in before restoring your vault key.');
  }

  const savedPhrase = await SecureStore.getItemAsync(recoveryPhraseStorageKey(userId), keychainOptions);

  if (!savedPhrase) {
    return false;
  }

  await restoreVaultKeyWithPassphrase(savedPhrase);
  return true;
}

async function saveRecoveryPhrase(userId: string, passphrase: string) {
  await SecureStore.setItemAsync(recoveryPhraseStorageKey(userId), passphrase, keychainOptions);
}

function deriveRecoveryKey(passphrase: string, saltHex: string, iterations: number) {
  return CryptoJS.PBKDF2(passphrase, CryptoJS.enc.Hex.parse(saltHex), {
    keySize: 256 / 32,
    iterations,
    hasher: CryptoJS.algo.SHA256,
  });
}

function bytesToWordArray(bytes: Uint8Array) {
  const words: number[] = [];

  for (let index = 0; index < bytes.length; index += 1) {
    const byte = bytes[index] ?? 0;
    words[index >>> 2] = (words[index >>> 2] ?? 0) | (byte << (24 - (index % 4) * 8));
  }

  return CryptoJS.lib.WordArray.create(words, bytes.length);
}
