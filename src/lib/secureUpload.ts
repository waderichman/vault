import * as FileSystem from 'expo-file-system/legacy';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getStateRequirementProfile } from '../data/stateRequirements';
import { firebaseAuth, firestore, isFirebaseConfigured } from './firebase';
import { DirectiveDocument, VaultData } from '../types/vault';

export async function uploadEncryptedDocument({
  vault,
  document,
  onStorageUploaded,
}: {
  vault: VaultData;
  document: DirectiveDocument;
  onStorageUploaded?: () => void;
}) {
  if (!isFirebaseConfigured) {
    throw new Error('Add your EXPO_PUBLIC_FIREBASE_* values to .env before uploading.');
  }

  if (!document.encryptedLocalUri) {
    throw new Error('This document has not been encrypted locally yet.');
  }

  const user = firebaseAuth.currentUser;

  if (!user) {
    throw new Error('Sign in before uploading encrypted documents.');
  }

  const vaultId = user.uid;
  const storagePath = `vaults/${vaultId}/documents/${document.id}.enc`;
  const stateProfile = getStateRequirementProfile(vault.directiveStateCode);

  await uploadEncryptedFile(document.encryptedLocalUri, storagePath);
  onStorageUploaded?.();

  await withTimeout(
    setDoc(doc(firestore, 'users', user.uid, 'directiveDocuments', document.id), {
      id: document.id,
      vaultId,
      ownerUid: user.uid,
      memberName: vault.memberName,
      type: document.type,
      state: document.state,
      stateCode: vault.directiveStateCode ?? null,
      jurisdictionLabel: stateProfile?.jurisdictionLabel ?? null,
      legalStatus: stateProfile?.legalStatus ?? 'Not legal advice',
      stateSourceUrl: stateProfile?.sourceUrl ?? null,
      signedDate: document.signedDate || null,
      uploaded_by: document.uploadedBy,
      storagePath,
      encryptedSize: document.encryptedSize ?? null,
      encryptionKeyRef: document.encryptionKeyId ?? 'local-demo-key',
      wrappedEncryptionKey: document.wrappedEncryptionKey ?? null,
      wrappedEncryptionKeyIv: document.wrappedEncryptionKeyIv ?? null,
      keyWrapAlg: document.keyWrapAlg ?? null,
      fingerprint: document.encryptionFingerprint ?? 'missing-fingerprint',
      isActive: document.isActive,
      statuses: document.statuses,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    }),
    15000,
    'Encrypted file uploaded, but Firestore metadata did not finish saving. Check Firestore rules, then retry.',
  );

  return storagePath;
}

function makeVaultId(memberName: string) {
  return memberName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'local-demo-vault';
}

async function uploadEncryptedFile(fileUri: string, storagePath: string) {
  const storageBucket = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  const token = await firebaseAuth.currentUser?.getIdToken();

  if (!storageBucket) {
    throw new Error('Missing EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET in .env.');
  }

  if (!token) {
    throw new Error('Sign in before uploading encrypted documents.');
  }

  const bucketsToTry = [storageBucket];
  const legacyBucket = projectId ? `${projectId}.appspot.com` : null;

  if (legacyBucket && !bucketsToTry.includes(legacyBucket)) {
    bucketsToTry.push(legacyBucket);
  }

  const errors: string[] = [];

  for (const bucket of bucketsToTry) {
    const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o?uploadType=media&name=${encodeURIComponent(storagePath)}`;
    const response = await FileSystem.uploadAsync(uploadUrl, fileUri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: {
        Authorization: `Firebase ${token}`,
        'Content-Type': 'application/octet-stream',
      },
    });

    if (response.status >= 200 && response.status < 300) {
      return;
    }

    errors.push(`${bucket}: ${response.status} ${response.body}`);
  }

  throw new Error(`Firebase Storage upload failed. Tried ${bucketsToTry.join(', ')}. ${errors.join(' | ')}`);
}

export async function downloadEncryptedDocumentPayload(storagePath: string) {
  const storageBucket = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const token = await firebaseAuth.currentUser?.getIdToken();

  if (!storageBucket) {
    throw new Error('Missing EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET in .env.');
  }

  if (!token) {
    throw new Error('Sign in before opening encrypted documents.');
  }

  const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${encodeURIComponent(storagePath)}?alt=media`;
  const response = await fetch(downloadUrl, {
    headers: {
      Authorization: `Firebase ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Firebase Storage download failed (${response.status}).`);
  }

  return response.text();
}

export async function deleteEncryptedDocument(storagePath: string) {
  const storageBucket = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const token = await firebaseAuth.currentUser?.getIdToken();

  if (!storageBucket || !token) {
    return;
  }

  const deleteUrl = `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${encodeURIComponent(storagePath)}`;

  await fetch(deleteUrl, {
    method: 'DELETE',
    headers: {
      Authorization: `Firebase ${token}`,
    },
  });
}

function withTimeout<T>(promise: Promise<T>, milliseconds: number, message: string) {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(message)), milliseconds);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timeout));
  });
}
