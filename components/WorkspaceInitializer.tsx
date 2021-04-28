import firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/auth';
import 'firebase/analytics';
import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import type firebaseType from 'firebase';
import { defaultPermissionAtom } from '../atoms/workspace';
import {
  firebaseRefAtom,
  joinExistingWorkspaceWithDefaultPermissionAtom,
  joinNewWorkspaceAsOwnerAtom,
  setFirebaseUserAtom,
  userRefAtom,
} from '../atoms/firebaseAtoms';
import { signInAnonymously } from '../scripts/firebaseUtils';
import { useUpdateAtom } from 'jotai/utils';

const firebaseConfig = {
  apiKey: 'AIzaSyDAYhsX5I8X1l_hu6AhBZx8prDdvY2i2EA',
  authDomain: 'live-cp-ide.firebaseapp.com',
  databaseURL: 'https://live-cp-ide.firebaseio.com',
  projectId: 'live-cp-ide',
  storageBucket: 'live-cp-ide.appspot.com',
  messagingSenderId: '350143604950',
  appId: '1:350143604950:web:3a5716645632d42def0177',
  measurementId: 'G-V2G3NLWBWF',
};

if (typeof window !== 'undefined') {
  // firepad needs access to firebase
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  window.firebase = firebase;
}

if (!firebase.apps?.length) {
  firebase.initializeApp(firebaseConfig);
  if (typeof window !== 'undefined' && firebase.analytics) firebase.analytics();
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
  const router = useRouter();
  const setFirebaseUser = useUpdateAtom(setFirebaseUserAtom);
  const setFirebaseRef = useUpdateAtom(firebaseRefAtom);
  const setUserRef = useUpdateAtom(userRefAtom);
  const joinNewWorkspaceAsOwner = useUpdateAtom(joinNewWorkspaceAsOwnerAtom);
  const joinExistingWorkspaceWithDefaultPermission = useUpdateAtom(
    joinExistingWorkspaceWithDefaultPermissionAtom
  );
  const setDefaultPermission = useUpdateAtom(defaultPermissionAtom);

  useEffect(() => {
    if (!router.isReady) return;

    signInAnonymously();

    let unsubscribe2: () => void;
    let unsubscribe3: () => void;
    const unsubscribe = firebase.auth().onAuthStateChanged(user => {
      if (unsubscribe2) unsubscribe2();
      if (unsubscribe3) unsubscribe3();
      setFirebaseUser(user);

      if (user) {
        const uid = user.uid;

        let queryId: string | undefined;
        if (Array.isArray(router.query.id)) {
          queryId = router.query.id[0];
        } else {
          queryId = router.query.id;
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
          .on('value', handleDefaultPermissionChange);
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
        connectedRef.on('value', handleConnectionChange);
        unsubscribe3 = () => connectedRef.off('value', handleConnectionChange);
      }
    });

    return () => {
      unsubscribe();
      if (unsubscribe2) unsubscribe2();
      if (unsubscribe3) unsubscribe3();
    };

    // we only want to run this once when the router is ready
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  return <>{children}</>;
};
