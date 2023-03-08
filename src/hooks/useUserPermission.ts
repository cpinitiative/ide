import { useEditorContext } from '../context/EditorContext';
import { useUserContext } from '../context/UserContext';

export default function useUserPermission() {
  const { fileData } = useEditorContext();
  const { user } = useUserContext();

  return (
    fileData.users[user.uid]?.permission ?? fileData.settings.defaultPermission
  );
}
