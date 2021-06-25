import { atom } from 'jotai';
import type firebaseType from 'firebase';
import { userNameAtom } from './userSettings';
import animals from '../scripts/animals';
import { signInAnonymously } from '../scripts/firebaseUtils';
import firebase from 'firebase/app';
import { connectionRefAtom } from './firebaseAtoms';
import { shouldUseEmulator } from '../components/WorkspaceInitializer';

const baseFirebaseUserAtom = atom<firebaseType.User | null>(null);
export const firebaseUserAtom = atom(
  get => get(baseFirebaseUserAtom),
  (get, set, user: firebaseType.User | null) => {
    set(baseFirebaseUserAtom, user);
    if (user) {
      let name =
        'Anonymous ' + animals[Math.floor(animals.length * Math.random())];
      if (!user.displayName) {
        user.updateProfile({ displayName: name });
      } else {
        name = user.displayName;
      }
      set(userNameAtom, name);
    } else {
      set(userNameAtom, null);
    }
  }
);
firebaseUserAtom.onMount = setAtom => {
  const unsubscribe = firebase.auth().onAuthStateChanged(user => {
    setAtom(user);
    if (!user) {
      signInAnonymously();
    }
  });

  return () => {
    unsubscribe();
  };
};

export const signInWithGoogleAtom = atom(null, (get, set, _) => {
  const provider = new firebase.auth.GoogleAuthProvider();
  const prevUser = firebase.auth().currentUser;

  // Remove user from user list before signing in
  const prevConnectionRef = get(connectionRefAtom);
  if (prevConnectionRef) set(connectionRefAtom, null);

  if (shouldUseEmulator) {
    // Note: for some reason firebase emulator does not work with `linkWithPopup`
    // so we're just going to always sign up with popup instead.
    // To test `linkWithPopup`, go to `src/components/WorkspaceInitializer.tsx`, find `shouldUseEmulator`,
    // and set that to false.
    firebase.auth().signInWithPopup(provider);
  } else {
    prevUser
      ?.linkWithPopup(provider)
      .then(result => {
        // linked successfully
        const newName = result.user?.providerData[0]?.displayName;
        if (newName)
          firebase.auth().currentUser!.updateProfile({ displayName: newName });
      })
      .catch(error => {
        if (error.code === 'auth/credential-already-in-use') {
          // user already has an account. Sign in to that account and override our data.
          firebase.auth().signInWithCredential(error.credential);
        } else {
          alert('Error signing in: ' + error);
          if (prevConnectionRef) set(connectionRefAtom, prevConnectionRef);
        }
      });
  }
});

export const signOutAtom = atom(null, (_, set) => {
  set(connectionRefAtom, null);
  firebase.auth().signOut();
});
