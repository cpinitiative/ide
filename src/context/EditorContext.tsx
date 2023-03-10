import firebase from 'firebase/app';
import invariant from 'tiny-invariant';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ProblemData } from '../components/Workspace/Workspace';
import { ChatMessage } from '../components/Chat';
import { useUserContext } from './UserContext';

export type Language = 'cpp' | 'java' | 'py';

export interface FileSettings {
  compilerOptions: { [key in Language]: string };
  defaultPermission: 'READ_WRITE' | 'READ' | 'PRIVATE';
  workspaceName: string | null;
  creationTime: string | null; // firebase timetsamp?
  problem: ProblemData | null;
  classroomID: string | null;
  language: Language;
}

export type FileData = {
  id: string;
  users: {
    [userID: string]: {
      name: string;
      color: string; // hex format
      permission: 'OWNER' | 'READ' | 'READ_WRITE' | 'PRIVATE' | null;
    };
  };
  settings: FileSettings;
  isCodeRunning: boolean;
  state: {
    judge_resuts: any; // ???
  };
  chat: {
    [key: string]: Omit<ChatMessage, 'key'>;
  };
};

export type EditorContextType = {
  fileData: FileData;
  updateFileData: (firebaseUpdateData: Partial<FileData>) => Promise<any>;
};

const EditorContext = createContext<EditorContextType | null>(null);

export function useEditorContext() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditorContext must be used within an EditorProvider');
  }
  return context;
}

export function EditorProvider({
  fileId, // expects firebase file ID
  loadingUI,
  fileNotFoundUI,
  permissionDeniedUI,
  children,
}: {
  fileId: string;
  loadingUI: React.ReactNode;
  fileNotFoundUI: React.ReactNode;
  permissionDeniedUI: React.ReactNode;
  children: React.ReactNode;
}): JSX.Element {
  const { userData } = useUserContext();
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);

    const handleDataChange = (snap: firebase.database.DataSnapshot) => {
      setLoading(false);
      setFileData({
        id: snap.key,
        ...snap.val(),
      });
    };

    firebase
      .database()
      .ref('files/' + fileId)
      .on('value', handleDataChange);

    return () =>
      firebase
        .database()
        .ref('files/' + fileId)
        .off('value', handleDataChange);
  }, [fileId]);

  const updateFileData = useCallback(
    (firebaseUpdateData: Object) => {
      return firebase
        .database()
        .ref('files/' + fileId)
        .update(firebaseUpdateData);
    },
    [fileId]
  );

  const editorContextValue = useMemo(() => {
    return { fileData, updateFileData };
  }, [fileData, updateFileData]);

  if (loading) {
    return <>{loadingUI}</>;
  }

  if (!editorContextValue.fileData) {
    return <>{fileNotFoundUI}</>;
  }

  const userPermission =
    editorContextValue.fileData.users[userData.id]?.permission ??
    editorContextValue.fileData.settings.defaultPermission;

  if (userPermission === 'PRIVATE') {
    return <>{permissionDeniedUI}</>;
  }

  // i don't know why the cast is needed. Somehow we should figure out how to
  // assert editorContextValue.fileData is non null.
  return (
    <EditorContext.Provider value={editorContextValue as EditorContextType}>
      {children}
    </EditorContext.Provider>
  );
}
