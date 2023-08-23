import { atom } from 'jotai';
import firebase from 'firebase/app';
import { ConnectionContextType } from '../context/ConnectionContext';
import { SHOULD_USE_FIREBASE_EMULATOR } from '../dev_constants';

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

export const signInWithGoogleAtom = atom(
  null,
  (get, set, connectionContext: ConnectionContextType) => {
    const provider = new firebase.auth.GoogleAuthProvider();
    const prevUser = firebase.auth().currentUser;

    // Remove user from user list before signing in
    const prevConnectionRefs = connectionContext.getConnectionRefs();
    connectionContext.clearConnectionRefs();

    if (SHOULD_USE_FIREBASE_EMULATOR) {
      // Note: for some reason firebase emulator does not work with `linkWithPopup`
      // so we're just going to always sign up with popup instead.
      // To test `linkWithPopup`, go to `src/dev_constants.ts`, find `shouldUseFirebaseEmulatorInDev`,
      // and set that to false.
      // a function returns a function because we want to set the atom to a callback function
      // but if you pass a function into set() then jotai will use the function *return* value
      // as the value of the atom
      set(
        confirmOverrideDataCallbackAtom,
        () => () => firebase.auth().signInWithPopup(provider)
      );
    } else {
      prevUser
        ?.linkWithPopup(provider)
        .then(result => {
          // linked successfully
          const newName = result.user?.providerData[0]?.displayName;
          if (newName)
            firebase
              .auth()
              .currentUser!.updateProfile({ displayName: newName });
        })
        .catch(error => {
          if (error.code === 'auth/credential-already-in-use') {
            // user already has an account. Sign in to that account and override our data.
            // a function returns a function because we want to set the atom to a callback function
            // but if you pass a function into set() then jotai will use the function *return* value
            // as the value of the atom
            set(
              confirmOverrideDataCallbackAtom,
              () => () => firebase.auth().signInWithCredential(error.credential)
            );
          } else {
            alert('Error signing in: ' + error);
            prevConnectionRefs.forEach(ref =>
              connectionContext.addConnectionRef(ref)
            );
          }
        });
    }
  }
);

export const signOutAtom = atom(
  null,
  (_, set, connectionContext: ConnectionContextType) => {
    connectionContext.clearConnectionRefs();
    firebase.auth().signOut();
  }
);
