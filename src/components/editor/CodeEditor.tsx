// A code editor that uses either Monaco or Codemirror 6 depending on whether the user is on mobile or not

import { CodemirrorEditor } from './CodemirrorEditor/CodemirrorEditor';
import LazyMonacoEditor from './MonacoEditor/LazyMonacoEditor';
import { EditorProps } from './MonacoEditor/monaco-editor-types';

export const CodeEditor = (props: EditorProps) => {
  // return <LazyMonacoEditor {...props} />;
  return <CodemirrorEditor {...props} />;
};
