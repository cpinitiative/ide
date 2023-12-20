// A code editor that uses either Monaco or Codemirror 6 depending on whether the user is on mobile or not

import { useEffect, useState } from 'react';
import LazyMonacoEditor from './MonacoEditor/LazyMonacoEditor';
import { EditorProps } from './MonacoEditor/monaco-editor-types';
import LazyCodemirrorEditor from './CodemirrorEditor/LazyCodemirrorEditor';

export const CodeEditor = (props: EditorProps) => {
  const [isMobile, setIsMobile] = useState<undefined | boolean>(undefined);
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setIsMobile(isMobile);
  }, []);

  if (isMobile === undefined) {
    return null;
  }

  if (isMobile) {
    return <LazyCodemirrorEditor {...props} />;
  }

  return <LazyMonacoEditor {...props} />;
};
