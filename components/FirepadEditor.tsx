import loader from '@monaco-editor/loader';
loader.config({
  paths: {
    vs: '/vs',
  },
});

import Editor, { EditorProps } from '@monaco-editor/react';
import { useState, useEffect } from 'react';
import Firepad from '../scripts/firepad';
import type firebaseType from 'firebase';

export interface FirepadEditorProps extends EditorProps {
  firebaseRef: firebaseType.database.Reference | undefined;
}

const FirepadEditor = ({
  onMount,
  defaultValue,
  firebaseRef,
  ...props
}: FirepadEditorProps): JSX.Element => {
  const [
    editor,
    setEditor,
  ] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (!firebaseRef || !editor) return;

    // we reset the value here since firepad initialization can't have any text in it
    // firepad will fetch the text from firebase and update monaco
    editor.setValue('');
    const firepad = Firepad.fromMonaco(firebaseRef, editor);

    if (defaultValue) {
      firepad.on('ready', function () {
        if (editor.getValue().length === 0) {
          editor.setValue(defaultValue);
        }
      });
    }

    return () => firepad.dispose();
    // defaultValue shouldn't change without the other values changing (and if it does, it's probably a bug)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseRef, editor]);

  return (
    <Editor
      {...props}
      onMount={(e, m) => {
        setEditor(e);
        if (onMount) onMount(e, m);
      }}
    />
  );
};

export default FirepadEditor;
