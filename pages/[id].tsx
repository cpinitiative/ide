import { useRouter } from 'next/router';
import { useContext } from 'react';
import { MessagePage } from '../src/components/MessagePage';
import { EditorContext, EditorProvider } from '../src/context/EditorContext';

function EditorPage() {
  const { fileData } = useContext(EditorContext)!;

  return <pre className="text-white">{JSON.stringify(fileData, null, 2)}</pre>;
}

export default function FilePage() {
  const queryId = useRouter().query.id;
  const firebaseFileID = '-' + queryId;

  if (!queryId) return null;

  const loadingUI = <MessagePage message="Loading..." showHomeButton={false} />;
  const fileNotFoundUI = <MessagePage message="File Not Found" />;
  const permissionDeniedUI = <MessagePage message="This file is private." />;

  return (
    <div>
      <EditorProvider
        fileId={firebaseFileID}
        loadingUI={loadingUI}
        fileNotFoundUI={fileNotFoundUI}
        permissionDeniedUI={permissionDeniedUI}
      >
        <EditorPage />
      </EditorProvider>
    </div>
  );
}
