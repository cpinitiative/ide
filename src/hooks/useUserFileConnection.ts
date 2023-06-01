import firebase from 'firebase/app';
import { useAtomValue } from 'jotai/utils';
import { useEffect } from 'react';
import { useConnectionContext } from '../context/ConnectionContext';
import { useEditorContext } from '../context/EditorContext';
import { useUserContext } from '../context/UserContext';
import colorFromUserId from '../scripts/colorFromUserId';

/**
 * Adds user connection to the active file, as well as the
 * active file's associated classroom if it exists.
 *
 * Also, updates the user data for the file.
 */
export default function useUserFileConnection() {
  const connectionContext = useConnectionContext();
  const { userData, firebaseUser } = useUserContext();
  const { fileData } = useEditorContext();

  useEffect(() => {
    firebase
      .database()
      .ref(`files/${fileData.id}/users/${userData.id}`)
      .update({
        name: firebaseUser.displayName,
        color: colorFromUserId(userData.id),
      });

    const ref = firebase
      .database()
      .ref(`files/${fileData.id}/users/${userData.id}/connections`)
      .push();
    connectionContext.addConnectionRef(ref);
    return () => connectionContext.removeConnectionRef(ref);
  }, [fileData.id, firebaseUser.displayName]);

  // const classroomConnectionsRef = useMemo(
  //   () =>
  //     firebaseUser &&
  //     settings.settings.classroomID &&
  //     firebase
  //       .database()
  //       .ref(
  //         `/classrooms/-${settings.settings.classroomID}/students/${firebaseUser.uid}/connections`
  //       ),
  //   [firebaseUser?.uid, settings.settings.classroomID]
  // );

  // useEffect(() => {
  //   if (!classroomConnectionsRef) return;

  //   const ref = classroomConnectionsRef.push();
  //   connectionContext.addConnectionRef(ref);
  //   return () => connectionContext.removeConnectionRef(ref);
  // }, [classroomConnectionsRef]);
}
