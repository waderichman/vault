# Secure Storage Plan

AdvanceVault should never upload raw PDFs in production.

## Current MVP

The Expo app now:

- Picks a signed PDF with `expo-document-picker`.
- Reads the PDF inside the app.
- Encrypts the PDF payload locally.
- Writes an encrypted `.enc` file into Expo app document storage.
- Stores document metadata, encrypted file path, encrypted size, key reference, and fingerprint locally.

This proves the app flow, but it is not the final production key model.

## Production Model

1. Generate a random per-document encryption key on the client.
2. Encrypt the PDF before upload.
3. Upload only the encrypted blob to storage.
4. Save metadata in the database.
5. Wrap the document key using a server/KMS key or authorized recipient public keys.
6. Release decrypt capability only after the access policy approves it.

## Firebase MVP Collections

The current mobile upload adapter writes document metadata to this Firestore collection:

```text
directiveDocuments/{documentId}
```

Each record includes:

```json
{
  "id": "doc-example",
  "vaultId": "demo-member-name",
  "memberName": "Demo Member",
  "type": "Health Care Surrogate",
  "state": "Florida",
  "signedDate": "2026-05-10",
  "uploaded_by": "Attorney Office",
  "storagePath": "vaults/demo-member-name/documents/doc-example.enc",
  "encryptedSize": 12345,
  "encryptionKeyRef": "local-key-example",
  "fingerprint": "abcdef1234567890",
  "isActive": true,
  "statuses": ["Attorney-uploaded", "Signed", "Active directive"]
}
```

## Firebase Storage

Store encrypted blobs only:

```text
vaults/{vaultId}/documents/{documentId}.enc
```

No public bucket access. Use Firebase Auth-backed rules or server-issued upload/download capabilities before production release.

Example development-only rules while testing with a temporary Firebase project:

```text
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    match /vaults/{vaultId}/documents/{documentId} {
      allow read, write: if true;
    }
  }
}

service cloud.firestore {
  match /databases/{database}/documents {
    match /directiveDocuments/{documentId} {
      allow read, write: if true;
    }
  }
}
```

Do not ship those rules. Production rules should require an authenticated user, bind vault records to that user, and authorize emergency access through a separate approval flow.

## Emergency Access Rule

Emergency access should be approved inside the app by trusted contacts or attorney-authorized users. Do not expose document URLs or decryption keys publicly.
