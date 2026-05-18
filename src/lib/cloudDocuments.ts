import { collection, deleteDoc, getDocs } from 'firebase/firestore';
import { firestore } from './firebase';
import { deleteEncryptedDocument } from './secureUpload';
import { DirectiveDocument, DirectiveDocumentType, VaultData, VerificationStatus } from '../types/vault';

const documentTypes: DirectiveDocumentType[] = ['Health Care Surrogate', 'HIPAA Authorization', 'Living Will', 'POLST / MOLST / POST'];
const verificationStatuses: VerificationStatus[] = [
  'Attorney-uploaded',
  'Uploaded by user',
  'Signed',
  'Witnessed',
  'Notarized',
  'Attorney-reviewed',
  'Active directive',
  'Superseded',
];
const defaultStatuses: VerificationStatus[] = ['Uploaded by user', 'Active directive'];

export async function loadCloudDocuments(userId: string) {
  const snapshot = await getDocs(collection(firestore, 'users', userId, 'directiveDocuments'));

  return snapshot.docs.map((item) => {
    const data = item.data();
    const type = documentTypes.includes(data.type) ? data.type : 'Living Will';
    const statuses: VerificationStatus[] = Array.isArray(data.statuses)
      ? data.statuses.filter((status: unknown): status is VerificationStatus => verificationStatuses.includes(status as VerificationStatus))
      : defaultStatuses;

    return {
      id: typeof data.id === 'string' ? data.id : item.id,
      type,
      state: typeof data.state === 'string' ? data.state : '',
      signedDate: typeof data.signedDate === 'string' ? data.signedDate : '',
      uploadedBy: typeof data.uploaded_by === 'string' ? data.uploaded_by : 'Unknown uploader',
      statuses: statuses.length > 0 ? statuses : defaultStatuses,
      isActive: typeof data.isActive === 'boolean' ? data.isActive : true,
      fileName: typeof data.fileName === 'string' ? data.fileName : undefined,
      encryptedSize: typeof data.encryptedSize === 'number' ? data.encryptedSize : undefined,
      encryptionKeyId: typeof data.encryptionKeyRef === 'string' ? data.encryptionKeyRef : undefined,
      wrappedEncryptionKey: typeof data.wrappedEncryptionKey === 'string' ? data.wrappedEncryptionKey : undefined,
      wrappedEncryptionKeyIv: typeof data.wrappedEncryptionKeyIv === 'string' ? data.wrappedEncryptionKeyIv : undefined,
      keyWrapAlg: typeof data.keyWrapAlg === 'string' ? data.keyWrapAlg : undefined,
      encryptionFingerprint: typeof data.fingerprint === 'string' ? data.fingerprint : undefined,
      remoteStoragePath: typeof data.storagePath === 'string' ? data.storagePath : undefined,
      uploadStatus: 'Uploaded encrypted blob',
    } satisfies DirectiveDocument;
  });
}

export async function clearCloudDocuments(userId: string) {
  const snapshot = await getDocs(collection(firestore, 'users', userId, 'directiveDocuments'));

  await Promise.all(
    snapshot.docs.map(async (item) => {
      const storagePath = item.data().storagePath;

      if (typeof storagePath === 'string') {
        await deleteEncryptedDocument(storagePath).catch((error) => {
          console.warn('Could not delete encrypted storage object', error);
        });
      }

      await deleteDoc(item.ref);
    }),
  );
}

export function mergeCloudDocuments(localVault: VaultData, cloudDocuments: DirectiveDocument[]) {
  if (cloudDocuments.length === 0) {
    return localVault;
  }

  const localById = new Map(localVault.documents.map((document) => [document.id, document]));
  const mergedCloudDocuments = cloudDocuments.map((cloudDocument) => {
    const localDocument = localById.get(cloudDocument.id);

    return {
      ...cloudDocument,
      localUri: localDocument?.localUri,
      encryptedLocalUri: localDocument?.encryptedLocalUri,
      fileSize: localDocument?.fileSize,
      fileName: localDocument?.fileName ?? cloudDocument.fileName,
      remoteStoragePath: cloudDocument.remoteStoragePath ?? localDocument?.remoteStoragePath,
      wrappedEncryptionKey: cloudDocument.wrappedEncryptionKey ?? localDocument?.wrappedEncryptionKey,
      wrappedEncryptionKeyIv: cloudDocument.wrappedEncryptionKeyIv ?? localDocument?.wrappedEncryptionKeyIv,
      keyWrapAlg: cloudDocument.keyWrapAlg ?? localDocument?.keyWrapAlg,
    };
  });
  const cloudIds = new Set(cloudDocuments.map((document) => document.id));
  const localOnlyDocuments = localVault.documents.filter((document) => !cloudIds.has(document.id));
  const firstCloudDocument = cloudDocuments[0];

  return {
    ...localVault,
    onboarded: localVault.onboarded || cloudDocuments.length > 0,
    memberName: localVault.memberName || '',
    directiveState: localVault.directiveState || firstCloudDocument?.state || '',
    documents: [...mergedCloudDocuments, ...localOnlyDocuments],
  };
}
