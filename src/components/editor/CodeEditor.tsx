// A code editor that uses either Monaco or Codemirror 6 depending on whether the user is on mobile or not

import { CodemirrorEditor } from './CodemirrorEditor/CodemirrorEditor';
import LazyMonacoEditor from './MonacoEditor/LazyMonacoEditor';

export type CodeEditorProps = any;

export const CodeEditor = (props: CodeEditorProps) => {
  // return <LazyMonacoEditor {...props} />;
  return <CodemirrorEditor {...props} />;
};
