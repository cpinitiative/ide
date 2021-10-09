import firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/auth';
import 'firebase/analytics';
import React, { useEffect } from 'react';
import type firebaseType from 'firebase';
import {
  updateLangFromFirebaseAtom,
  defaultPermissionAtom,
} from '../atoms/workspace';
import {
  connectionRefAtom,
  fileIdAtom,
  firebaseRefAtom,
  joinExistingWorkspaceWithDefaultPermissionAtom,
  joinNewWorkspaceAsOwnerAtom,
  setFirebaseErrorAtom,
  userRefAtom,
} from '../atoms/firebaseAtoms';
import { useAtomValue, useUpdateAtom } from 'jotai/utils';
import { useAtom } from 'jotai';
import { firebaseUserAtom } from '../atoms/firebaseUserAtoms';
import { userSettingsRefAtom, _userSettingsAtom } from '../atoms/userSettings';

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

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const shouldUseEmulator =
  typeof window !== 'undefined' && location.hostname === 'localhost';

if (!firebase.apps?.length) {
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

export const WorkspaceInitializer: React.FC = ({ children }) => {
  const firebaseUser = useAtomValue(firebaseUserAtom);
  const firebaseRef = useAtomValue(firebaseRefAtom);
  const fileId = useAtomValue(fileIdAtom);
  const setFirebaseError = useUpdateAtom(setFirebaseErrorAtom);
  const setUserRef = useUpdateAtom(userRefAtom);
  const joinNewWorkspaceAsOwner = useUpdateAtom(joinNewWorkspaceAsOwnerAtom);
  const joinExistingWorkspaceWithDefaultPermission = useUpdateAtom(
    joinExistingWorkspaceWithDefaultPermissionAtom
  );
  const setDefaultPermission = useUpdateAtom(defaultPermissionAtom);
  const setConnectionRef = useUpdateAtom(connectionRefAtom);

  const userSettingsRef = useAtomValue(userSettingsRefAtom);
  const setUserSettings = useUpdateAtom(_userSettingsAtom);
  // const currentLang = useAtomValue(actualLangAtom);
  // console.log(`CURRENT LANG ${currentLang}`);
  const updateLangFromFirebase = useUpdateAtom(updateLangFromFirebaseAtom);
  useEffect(() => {
    if (userSettingsRef) {
      const handleUserSettingsChange = (
        snap: firebaseType.database.DataSnapshot
      ) => {
        const val = snap.val();
        setUserSettings(val);
        const lang = val?.defaultLang;
        if (lang) updateLangFromFirebase(lang);
      };
      userSettingsRef.on('value', handleUserSettingsChange, e =>
        setFirebaseError(e)
      );
      return () => userSettingsRef.off('value', handleUserSettingsChange);
    }
  }, [
    setFirebaseError,
    setUserSettings,
    updateLangFromFirebase,
    userSettingsRef,
  ]);

  useEffect(() => {
    if (firebaseUser && firebaseRef && fileId) {
      const uid = firebaseUser.uid;
      const ref = firebaseRef;
      const firebaseUserRef = ref.child('users').child(uid);
      setUserRef(firebaseUserRef);

      let hasJoinedWorkspace = false;
      if (fileId.isNewFile) {
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
      const unsubscribe2 = () =>
        ref
          .child('settings')
          .child('defaultPermission')
          .off('value', handleDefaultPermissionChange);

      const connectedRef = firebase.database().ref('.info/connected');
      const handleConnectionChange = (
        snap: firebaseType.database.DataSnapshot
      ) => {
        if (snap.val() === true) {
          const connectionRef = firebaseUserRef.child('connections').push();
          setConnectionRef(connectionRef);
        }
      };
      connectedRef.on('value', handleConnectionChange, e =>
        setFirebaseError(e)
      );
      const unsubscribe3 = () =>
        connectedRef.off('value', handleConnectionChange);

      return () => {
        unsubscribe2();
        unsubscribe3();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser, firebaseRef, fileId?.id]);

  return <>{children}</>;
};
