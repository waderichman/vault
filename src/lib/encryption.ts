import CryptoJS from 'crypto-js';
import * as DocumentPicker from 'expo-document-picker';
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';
import { makeId } from './ids';

export async function encryptPickedPdf(asset: DocumentPicker.DocumentPickerAsset) {
  if (!asset.uri) {
    throw new Error('The selected file did not include a readable URI.');
  }

  if (!FileSystem.documentDirectory) {
    throw new Error('Secure app document storage is not available on this device.');
  }

  const vaultDirectory = `${FileSystem.documentDirectory}encrypted-directives/`;
  const directoryInfo = await FileSystem.getInfoAsync(vaultDirectory);

  if (!directoryInfo.exists) {
    await FileSystem.makeDirectoryAsync(vaultDirectory, { intermediates: true });
  }

  const base64Pdf = await FileSystem.readAsStringAsync(asset.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const encryptionKey = bytesToWordArray(Crypto.getRandomBytes(32));
  const iv = bytesToWordArray(Crypto.getRandomBytes(16));
  const keyId = makeId('local-key');
  const encrypted = CryptoJS.AES.encrypt(base64Pdf, encryptionKey, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  const encryptedPayload = JSON.stringify({
    v: 1,
    alg: 'AES-CBC',
    iv: iv.toString(CryptoJS.enc.Hex),
    ciphertext: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
  });
  const encryptedLocalUri = `${vaultDirectory}${makeSafeFileName(asset.name)}.${keyId}.enc`;

  await FileSystem.writeAsStringAsync(encryptedLocalUri, encryptedPayload, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const encryptedInfo = await FileSystem.getInfoAsync(encryptedLocalUri);
  const fingerprint = CryptoJS.SHA256(encryptedPayload).toString(CryptoJS.enc.Hex).slice(0, 16);

  return {
    encryptedLocalUri,
    encryptedSize: encryptedInfo.exists && 'size' in encryptedInfo ? encryptedInfo.size : undefined,
    encryptionKeyId: keyId,
    encryptionFingerprint: fingerprint,
  };
}

function makeSafeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9.-]/g, '-').replace(/-+/g, '-').slice(0, 80) || 'directive.pdf';
}

function bytesToWordArray(bytes: Uint8Array) {
  const words: number[] = [];

  for (let index = 0; index < bytes.length; index += 1) {
    const byte = bytes[index] ?? 0;
    words[index >>> 2] = (words[index >>> 2] ?? 0) | (byte << (24 - (index % 4) * 8));
  }

  return CryptoJS.lib.WordArray.create(words, bytes.length);
}
