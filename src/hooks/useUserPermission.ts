import { useEditorContext } from '../context/EditorContext';
import { useUserContext } from '../context/UserContext';

export default function useUserPermission() {
  const { fileData } = useEditorContext();
  const { userData } = useUserContext();

  return (
    fileData.users[userData.id]?.permission ??
    fileData.settings.defaultPermission
  );
}
