import firebase from 'firebase/app';
import invariant from 'tiny-invariant';
import {
  createContext,
  MutableRefObject,
  Ref,
  RefObject,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  /**
   * Maps YJS File ID ==> true / false
   * If file ID is not in the map, assume it's false
   *
   * If true, this client should NOT initialize the code if it's empty.
   * This solves the bug that if multiple people are on the same document,
   * and the document changes languages, every client will try to initialize
   * the code (resuting in multiple templates being inserted).
   *
   * Instead, after the file is loaded & synced, doNotInitializeTheseFileIds is set
   * to true. Then, if the language is changed, the client who triggered the
   * language change (and only that client) will have this set to false.
   */
  doNotInitializeTheseFileIdsRef: MutableRefObject<Record<string, boolean>>;
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
  const doNotInitializeTheseFileIdsRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    setLoading(true);

    const handleDataChange = (snap: firebase.database.DataSnapshot) => {
      setLoading(false);
      setFileData(
        snap.exists()
          ? {
              id: snap.key,
              ...snap.val(),
            }
          : null
      );
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
    return { fileData, updateFileData, doNotInitializeTheseFileIdsRef };
  }, [fileData, updateFileData, doNotInitializeTheseFileIdsRef]);

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
