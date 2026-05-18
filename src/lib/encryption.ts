import CryptoJS from 'crypto-js';
import * as DocumentPicker from 'expo-document-picker';
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';
import { DirectiveDocument } from '../types/vault';
import { loadDocumentKey, saveDocumentKey, unwrapDocumentKey, wrapDocumentKey } from './documentKeys';
import { firebaseAuth } from './firebase';
import { downloadEncryptedDocumentPayload } from './secureUpload';
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
  const encryptionKeyHex = encryptionKey.toString(CryptoJS.enc.Hex);
  await saveDocumentKey(keyId, encryptionKeyHex);
  const wrappedKey = await wrapDocumentKey(encryptionKeyHex);

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
    ...wrappedKey,
    encryptionFingerprint: fingerprint,
  };
}

export async function decryptDocumentToPdf(document: DirectiveDocument) {
  if (!document.encryptionKeyId) {
    throw new Error('This document is missing its local encryption key reference.');
  }

  if (!FileSystem.documentDirectory) {
    throw new Error('App document storage is not available on this device.');
  }

  const keyHex = await resolveDocumentKey(document);

  const encryptedPayload = await readEncryptedPayload(document);
  const parsed = JSON.parse(encryptedPayload) as { iv: string; ciphertext: string };
  const decrypted = CryptoJS.AES.decrypt(
    { ciphertext: CryptoJS.enc.Base64.parse(parsed.ciphertext) } as CryptoJS.lib.CipherParams,
    CryptoJS.enc.Hex.parse(keyHex),
    {
      iv: CryptoJS.enc.Hex.parse(parsed.iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    },
  );
  const base64Pdf = decrypted.toString(CryptoJS.enc.Utf8);

  if (!base64Pdf) {
    throw new Error('Could not decrypt this document.');
  }

  const viewDirectory = `${FileSystem.cacheDirectory ?? FileSystem.documentDirectory}decrypted-directives/`;
  const directoryInfo = await FileSystem.getInfoAsync(viewDirectory);

  if (!directoryInfo.exists) {
    await FileSystem.makeDirectoryAsync(viewDirectory, { intermediates: true });
  }

  const fileName = makeSafeFileName(document.fileName ?? `${document.type}.pdf`).replace(/\.enc$/i, '');
  const pdfUri = `${viewDirectory}${fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`}`;

  await FileSystem.writeAsStringAsync(pdfUri, base64Pdf, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return pdfUri;
}

async function resolveDocumentKey(document: DirectiveDocument) {
  if (!document.encryptionKeyId) {
    throw new Error('This document is missing its local encryption key reference.');
  }

  const localKey = await loadDocumentKey(document.encryptionKeyId);

  if (localKey) {
    return localKey;
  }

  if (document.wrappedEncryptionKey && document.wrappedEncryptionKeyIv) {
    const recoveredKey = await unwrapDocumentKey(document.wrappedEncryptionKey, document.wrappedEncryptionKeyIv);
    await saveDocumentKey(document.encryptionKeyId, recoveredKey);
    return recoveredKey;
  }

  throw new Error('The decryption key is not available on this device.');
}

async function readEncryptedPayload(document: DirectiveDocument) {
  if (document.encryptedLocalUri) {
    try {
      return await FileSystem.readAsStringAsync(document.encryptedLocalUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    } catch {
      // Fall through to Firebase Storage when the local cache/document URI is no longer readable.
    }
  }

  const remoteStoragePath = document.remoteStoragePath ?? getDefaultRemoteStoragePath(document);

  if (remoteStoragePath) {
    return downloadEncryptedDocumentPayload(remoteStoragePath);
  }

  throw new Error('This encrypted document is not readable on this device. Re-upload or restore it from Firebase first.');
}

function getDefaultRemoteStoragePath(document: DirectiveDocument) {
  const userId = firebaseAuth.currentUser?.uid;
  return userId && document.uploadStatus === 'Uploaded encrypted blob' ? `vaults/${userId}/documents/${document.id}.enc` : null;
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
