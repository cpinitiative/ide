import { useRouter } from 'next/router';
import { useContext } from 'react';
import { EditorContext, EditorProvider } from '../src/context/EditorContext';

function EditorPage() {
  const { fileData } = useContext(EditorContext)!;

  return <pre className="text-white">{JSON.stringify(fileData, null, 2)}</pre>;
}

export default function FilePage() {
  const queryId = useRouter().query.id;
  const firebaseFileID = '-' + queryId;

  if (!queryId) return null;

  return (
    <div>
      <pre className="text-white">{queryId}</pre>

      <EditorProvider
        fileId={firebaseFileID}
        loadingUI={null}
        fileNotFoundUI={null}
        permissionDeniedUI={null}
      >
        <EditorPage />
      </EditorProvider>
    </div>
  );
}
