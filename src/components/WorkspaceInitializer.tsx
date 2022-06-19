import firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/auth';
import 'firebase/analytics';
import React, { ReactNode, useEffect } from 'react';
import type firebaseType from 'firebase';
import {
  updateLangFromFirebaseAtom,
  defaultPermissionAtom,
} from '../atoms/workspace';
import {
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
import {
  isUserSettingsLoadingAtom,
  userSettingsRefAtom,
  _userSettingsAtom,
} from '../atoms/userSettings';
import { useConnectionContext } from '../context/ConnectionContext';

export const WorkspaceInitializer = ({ children }: { children: ReactNode }) => {
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

  const connectionContext = useConnectionContext();

  const userSettingsRef = useAtomValue(userSettingsRefAtom);
  const [isUserSettingsLoading, setIsUserSettingsLoading] = useAtom(
    isUserSettingsLoadingAtom
  );
  const setUserSettings = useUpdateAtom(_userSettingsAtom);
  // const currentLang = useAtomValue(actualLangAtom);
  // console.log(`CURRENT LANG ${currentLang}`);
  const updateLangFromFirebase = useUpdateAtom(updateLangFromFirebaseAtom);
  useEffect(() => {
    if (userSettingsRef) {
      setIsUserSettingsLoading(true);
      const handleUserSettingsChange = (
        snap: firebaseType.database.DataSnapshot
      ) => {
        const val = snap.val();
        setUserSettings(val);
        setIsUserSettingsLoading(false);
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

      return unsubscribe2;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser, firebaseRef, fileId?.id]);

  return <>{children}</>;
};
