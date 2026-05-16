# AdvanceVault

React Native TypeScript MVP for Expo Go.

AdvanceVault is a secure, state-specific emergency vault for advance health care directives:

- Health Care Surrogate / Health Care Proxy
- HIPAA Authorization
- Living Will / Declaration
- Attorney verification status
- Break-glass access workflow
- Trusted contacts and attorney office metadata
- Local persistence with AsyncStorage
- Local biometric/passcode unlock with Expo Local Authentication
- PDF selection with Expo Document Picker

## Run With Expo Go

Install dependencies:

```bash
npm install
```

Start Expo:

```bash
npm start
```

Then scan the Expo Go QR code shown in your terminal.

## Firebase Setup

Copy `.env.example` to `.env` and fill in:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=
```

Enable these Firebase services:

- Authentication with the Email/Password provider
- Authentication with the Google provider, plus Google OAuth client IDs for any platform you test
- Firestore Database
- Firebase Storage

Then restart Expo with:

```bash
npx expo start --clear
```

Document detail will show **Upload Encrypted Blob** for locally encrypted PDFs. Uploaded files are written to Firebase Storage under `vaults/{uid}/documents/`, and metadata is written to Firestore under `users/{uid}/directiveDocuments/`.

## State Guidance

The app asks for a directive state during onboarding and stores both the display name and state code. Current state guidance uses source-linked, conservative categories and marks detailed legal requirements as needing legal review. Do not ship state-specific witness, notary, or form-validity claims until they are verified against official state materials or reviewed by counsel.

## Notes

This version intentionally avoids custom native code so it works in Expo Go. It now has local persistence, editable contacts/settings, PDF-backed add-document flow, in-app access request approvals, and a local audit log.

Selected PDFs are encrypted locally into app document storage before they are added to the vault record. Firebase Storage receives only encrypted `.enc` blobs, and Firestore stores the document metadata. See `SECURE_STORAGE.md` for the production storage plan.

Next production steps:

1. Add Firebase Auth and user-owned vault records.
2. Upload encrypted `.enc` files with server-authorized storage paths.
3. Add attorney dashboard and verification records.
4. Add emergency web route for controlled access requests.
5. Add notification delivery for trusted-contact approvals.
