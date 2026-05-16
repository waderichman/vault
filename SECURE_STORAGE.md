# Secure Storage Plan

AdvanceVault should never upload raw PDFs in production.

## Current MVP

The Expo app now:

- Requires Firebase email/password sign-in before local vault unlock.
- Picks a signed PDF with `expo-document-picker`.
- Reads the PDF inside the app.
- Encrypts the PDF payload locally.
- Writes an encrypted `.enc` file into Expo app document storage.
- Uploads the encrypted `.enc` blob to Firebase Storage under the signed-in user.
- Stores document metadata, encrypted file path, encrypted size, key reference, and fingerprint in Firestore under the signed-in user.

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
users/{uid}/directiveDocuments/{documentId}
```

Each record includes:

```json
{
  "id": "doc-example",
  "vaultId": "firebase-user-uid",
  "ownerUid": "firebase-user-uid",
  "memberName": "Demo Member",
  "type": "Health Care Surrogate",
  "state": "Florida",
  "signedDate": "2026-05-10",
  "uploaded_by": "Attorney Office",
  "storagePath": "vaults/firebase-user-uid/documents/doc-example.enc",
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

Example authenticated-user rules for the current MVP:

```text
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    match /vaults/{uid}/documents/{documentId} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/directiveDocuments/{documentId} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

Production rules should also validate document fields, enforce immutable owner IDs, and authorize emergency access through a separate approval flow.

## Emergency Access Rule

Emergency access should be approved inside the app by trusted contacts or attorney-authorized users. Do not expose document URLs or decryption keys publicly.

## State-Specific Legal Content

Advance directive requirements vary by state. The app should store a normalized state code with each vault and each uploaded document metadata record. State-specific rules such as witness count, notary requirements, statutory form language, reciprocity, POLST/MOLST handling, and revocation rules should come from official state materials or attorney-reviewed content before production release.

The current app intentionally treats state profiles as source-linked guidance, not verified legal advice.
