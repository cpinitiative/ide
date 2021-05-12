import firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/auth';
import 'firebase/analytics';
import React, { useEffect } from 'react';
import type firebaseType from 'firebase';
import { defaultPermissionAtom } from '../atoms/workspace';
import {
  firebaseRefAtom,
  joinExistingWorkspaceWithDefaultPermissionAtom,
  joinNewWorkspaceAsOwnerAtom,
  setFirebaseErrorAtom,
  setFirebaseUserAtom,
  userRefAtom,
} from '../atoms/firebaseAtoms';
import { signInAnonymously } from '../scripts/firebaseUtils';
import { useUpdateAtom } from 'jotai/utils';

const firebaseConfig = {
  apiKey: 'AIzaSyBlzBGNIqAQSOjHZ1V7JJxZ3Nw70ld2EP0',
  authDomain: 'cp-ide.firebaseapp.com',
  databaseURL: 'https://cp-ide-default-rtdb.firebaseio.com',
  projectId: 'cp-ide',
  storageBucket: 'cp-ide.appspot.com',
  messagingSenderId: '1068328460784',
  appId: '1:1068328460784:web:9385b3f43a0e2604a9fd35',
  measurementId: 'G-G22TZ5YCKV',
};

if (typeof window !== 'undefined') {
  // firepad needs access to firebase
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  window.firebase = firebase;
}

if (!firebase.apps?.length) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const shouldUseEmulator =
    typeof window !== 'undefined' && location.hostname === 'localhost';
  if (shouldUseEmulator) {
    firebase.initializeApp({
      ...firebaseConfig,
      authDomain: 'localhost:9099',
      databaseURL: 'http://localhost:9000/?ns=cp-ide-default-rtdb',
    });
    firebase.auth().useEmulator('http://localhost:9099');
    firebase.database().useEmulator('localhost', 9000);
  } else {
    firebase.initializeApp(firebaseConfig);
    if (typeof window !== 'undefined' && firebase.analytics) {
      firebase.analytics();
    }
  }
}

function getFirebaseRef(
  hash: string | null | undefined
): firebaseType.database.Reference {
  let ref = firebase.database().ref();
  if (hash) {
    ref = ref.child('-' + hash);
  } else {
    ref = ref.push(); // generate unique location.
    window.history.replaceState({}, '', '/' + ref.key!.substr(1));
  }
  return ref;
}

export const WorkspaceInitializer: React.FC = ({ children }) => {
  const setFirebaseUser = useUpdateAtom(setFirebaseUserAtom);
  const setFirebaseRef = useUpdateAtom(firebaseRefAtom);
  const setFirebaseError = useUpdateAtom(setFirebaseErrorAtom);
  const setUserRef = useUpdateAtom(userRefAtom);
  const joinNewWorkspaceAsOwner = useUpdateAtom(joinNewWorkspaceAsOwnerAtom);
  const joinExistingWorkspaceWithDefaultPermission = useUpdateAtom(
    joinExistingWorkspaceWithDefaultPermissionAtom
  );
  const setDefaultPermission = useUpdateAtom(defaultPermissionAtom);

  useEffect(() => {
    signInAnonymously();

    let unsubscribe2: () => void;
    let unsubscribe3: () => void;
    const unsubscribe = firebase.auth().onAuthStateChanged(user => {
      if (unsubscribe2) unsubscribe2();
      if (unsubscribe3) unsubscribe3();
      setFirebaseUser(user);

      if (user) {
        const uid = user.uid;

        const routes = window.location.pathname.split('/');
        let queryId = routes.length >= 1 ? routes[1] : null;

        // validate that queryId is a firebase key
        // todo improve: https://stackoverflow.com/questions/52850099/what-is-the-reg-expression-for-firestore-constraints-on-document-ids/52850529#52850529
        if (queryId?.length !== 19) {
          queryId = null;
        }

        const ref = getFirebaseRef(queryId);
        const userRef = ref.child('users').child(uid);

        setFirebaseRef(ref);
        setUserRef(userRef);

        let hasJoinedWorkspace = false;
        if (!queryId) {
          joinNewWorkspaceAsOwner();
          hasJoinedWorkspace = true;
        }

        const handleDefaultPermissionChange = (
          snap: firebaseType.database.DataSnapshot
        ) => {
          setDefaultPermission(snap.val() || 'READ_WRITE');

          if (!hasJoinedWorkspace) {
            if (snap.exists()) {
              joinExistingWorkspaceWithDefaultPermission();
            } else {
              // new doc, make me the owner
              joinNewWorkspaceAsOwner();
            }
            hasJoinedWorkspace = true;
          }
        };

        ref
          .child('settings')
          .child('defaultPermission')
          .on('value', handleDefaultPermissionChange, e => setFirebaseError(e));
        unsubscribe2 = () =>
          ref
            .child('settings')
            .child('defaultPermission')
            .off('value', handleDefaultPermissionChange);

        const connectedRef = firebase.database().ref('.info/connected');
        const handleConnectionChange = (
          snap: firebaseType.database.DataSnapshot
        ) => {
          if (snap.val() === true) {
            const con = userRef.child('connections').push();
            con.onDisconnect().remove();
            con.set(true);
          }
        };
        connectedRef.on('value', handleConnectionChange, e =>
          setFirebaseError(e)
        );
        unsubscribe3 = () => connectedRef.off('value', handleConnectionChange);
      }
    });

    return () => {
      unsubscribe();
      if (unsubscribe2) unsubscribe2();
      if (unsubscribe3) unsubscribe3();
    };
  }, []);

  return <>{children}</>;
};
