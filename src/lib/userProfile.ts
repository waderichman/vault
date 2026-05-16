import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { firestore } from './firebase';

export async function upsertUserProfile(user: User) {
  await setDoc(
    doc(firestore, 'users', user.uid),
    {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      providerIds: user.providerData.map((provider) => provider.providerId),
      lastSignedInAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
}
