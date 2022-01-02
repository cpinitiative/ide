import firebase from 'firebase/app';
import { useAtomValue } from 'jotai/utils';
import { useEffect, useMemo } from 'react';
import { firebaseRefAtom } from '../atoms/firebaseAtoms';
import { firebaseUserAtom } from '../atoms/firebaseUserAtoms';
import { useSettings } from '../components/SettingsContext';
import { useConnectionContext } from '../context/ConnectionContext';

/**
 * Adds user connection to the active file, as well as the
 * active file's associated classroom if it exists
 */
export default function useUserFileConnection() {
  const connectionContext = useConnectionContext();
  const firebaseUser = useAtomValue(firebaseUserAtom);
  const firebaseRef = useAtomValue(firebaseRefAtom);
  const settings = useSettings();

  const firebaseUserRef = useMemo(
    () =>
      firebaseRef &&
      firebaseUser &&
      firebaseRef.child('users').child(firebaseUser.uid),
    [firebaseRef, firebaseUser?.uid]
  );

  useEffect(() => {
    if (!firebaseUserRef) return;

    const ref = firebaseUserRef.child('connections').push();
    connectionContext.addConnectionRef(ref);
    return () => connectionContext.removeConnectionRef(ref);
  }, [firebaseUserRef]);

  const classroomConnectionsRef = useMemo(
    () =>
      firebaseUser &&
      settings.settings.classroomID &&
      firebase
        .database()
        .ref(
          `/classrooms/${settings.settings.classroomID}/students/${firebaseUser.uid}/connections`
        ),
    [firebaseUser?.uid, settings.settings.classroomID]
  );

  useEffect(() => {
    if (!classroomConnectionsRef) return;

    const ref = classroomConnectionsRef.push();
    connectionContext.addConnectionRef(ref);
    return () => connectionContext.removeConnectionRef(ref);
  }, [classroomConnectionsRef]);
}
