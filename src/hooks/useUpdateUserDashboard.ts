import firebase from 'firebase/app';
import { useEffect, useMemo } from 'react';
import { useEditorContext } from '../context/EditorContext';
import { useUserContext } from '../context/UserContext';
import { useOnlineUsers } from './useOnlineUsers';
import useUserPermission from './useUserPermission';

export default function useUpdateUserDashboard() {
  const { fileData } = useEditorContext();
  const { userData } = useUserContext();
  const onlineUsers = useOnlineUsers();
  const settings = fileData.settings;
  const permission = useUserPermission();

  useEffect(() => {
    document.title = `${
      settings.workspaceName ? settings.workspaceName + ' · ' : ''
    }Real-Time Collaborative Online IDE`;
  }, [settings.workspaceName]);

  const fileOwner = useMemo(() => {
    const user = onlineUsers?.find(user => user.permission === 'OWNER');
    if (user) {
      return {
        name: user.name,
        id: user.id,
      };
    }
    return null;
  }, [onlineUsers]);

  useEffect(() => {
    if (permission === null || !fileOwner || settings.workspaceName === null)
      return;

    // Shouldn't happen, but just in case...
    if (!fileData.id) throw new Error('fileData.id was null');

    const fileRef = firebase
      .database()
      .ref('users')
      .child(userData.id)
      .child('files')
      .child(fileData.id);

    if (permission === 'PRIVATE') {
      // remove from dashboard recently accessed files
      fileRef.remove();
    } else {
      fileRef.set({
        title: settings.workspaceName || '',
        lastAccessTime: firebase.database.ServerValue.TIMESTAMP,
        creationTime: settings.creationTime ?? null,
        lastPermission: permission,
        lastDefaultPermission: settings.defaultPermission,
        hidden: false,
        version: 2,
        ...(fileOwner ? { owner: fileOwner } : {}),
      });
    }
  }, [
    permission,
    settings.workspaceName,
    settings.creationTime,
    settings.defaultPermission,
    fileOwner?.id,
    fileOwner?.name,
    fileData.id,
  ]);
}
