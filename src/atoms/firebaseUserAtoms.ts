import { atom } from 'jotai';
import type firebaseType from 'firebase';
import animals from '../scripts/animals';
import { signInAnonymously } from '../scripts/firebaseUtils';
import firebase from 'firebase/app';
import { connectionRefAtom } from './firebaseAtoms';
import { shouldUseEmulator } from '../components/WorkspaceInitializer';
import { displayNameAtom } from './userSettings';
import ReactDOM from 'react-dom';

const baseFirebaseUserAtom = atom<firebaseType.User | null>(null);
export const firebaseUserAtom = atom(
  get => get(baseFirebaseUserAtom),
  (_get, set, user: firebaseType.User | null) => {
    set(baseFirebaseUserAtom, user);
    if (user) {
      let displayName = user.displayName;
      if (!displayName) {
        displayName =
          'Anonymous ' + animals[Math.floor(animals.length * Math.random())];
        user.updateProfile({ displayName });
      }
      set(displayNameAtom, displayName);
    } else {
      set(displayNameAtom, '');
    }
  }
);
firebaseUserAtom.onMount = setAtom => {
  const unsubscribe = firebase.auth().onAuthStateChanged(user => {
    // for some reason, batched updates is needed. otherwise components will rerender
    // before the display name atom is set.
    ReactDOM.unstable_batchedUpdates(() => {
      setAtom(user);
    });
    if (!user) {
      signInAnonymously();
    }
  });

  return () => {
    unsubscribe();
  };
};

/**
 * This is set to a callback function when the modal asking the user
 * to confirm overriding their local data after signing in is shown.
 *
 * If the user clicks OK, the callback function is called, and after
 * the returned promise resolves, the atom is set to null.
 *
 * Otherwise, it is reset to null.
 */
export const confirmOverrideDataCallbackAtom = atom<
  (() => Promise<any>) | null
>(null);

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
    // a function returns a function because we want to set the atom to a callback function
    // but if you pass a function into set() then jotai will use the function *return* value
    // as the value of the atom
    set(confirmOverrideDataCallbackAtom, () => () =>
      firebase.auth().signInWithPopup(provider)
    );
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
          // a function returns a function because we want to set the atom to a callback function
          // but if you pass a function into set() then jotai will use the function *return* value
          // as the value of the atom
          set(confirmOverrideDataCallbackAtom, () => () =>
            firebase.auth().signInWithCredential(error.credential)
          );
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
