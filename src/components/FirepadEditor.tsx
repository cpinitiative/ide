import React, { useState, useEffect, useRef } from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Firepad from '../scripts/firepad';
import type firebaseType from 'firebase';
// import { EditorWithVim } from './EditorWithVim';
import { useAtom } from 'jotai';
import { loadingAtom } from '../atoms/workspace';
import { useAtomValue } from 'jotai/utils';
import { authenticatedUserRefAtom } from '../atoms/firebaseAtoms';
import LazyMonacoEditor from './MonacoEditor/LazyMonacoEditor';
import { EditorProps } from './MonacoEditor/monaco-editor-types';
import type * as monaco from 'monaco-editor';
import { userSettingsAtomWithPersistence } from '../atoms/userSettings';

export interface FirepadEditorProps extends EditorProps {
  firebaseRef: firebaseType.database.Reference | undefined;
  useEditorWithVim?: boolean;
  dataTestId?: string;
}

const FirepadEditor = ({
  onMount,
  defaultValue,
  firebaseRef,
  useEditorWithVim = false,
  dataTestId = '',
  ...props
}: FirepadEditorProps): JSX.Element => {
  const [editor, setEditor] =
    useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const userRef = useAtomValue(authenticatedUserRefAtom);
  const [, setLoading] = useAtom(loadingAtom);
  const disposeFirepadRef = useRef<Function | null>(null);
  const { editorMode: mode } = useAtomValue(userSettingsAtomWithPersistence);

  useEffect(() => {
    if (!firebaseRef || !editor || !userRef) return;

    const { path } = props;
    const affectsLoading = path && ['cpp', 'java', 'py'].includes(path);
    if (affectsLoading) setLoading(true);

    // we reset the value here since firepad initialization can't have any text in it
    // firepad will fetch the text from firebase and update monaco
    editor.setValue('');
    const firepad = Firepad.fromMonaco(firebaseRef, editor, {
      userId: userRef.key,
    });

    firepad.on('ready', function () {
      if (defaultValue) {
        if (editor.getValue().length === 0) {
          editor.setValue(defaultValue);
        }
      }
      if (affectsLoading) setLoading(false);
    });

    disposeFirepadRef.current = () => {
      firepad.dispose();
    };

    return () => {
      if (disposeFirepadRef.current) {
        disposeFirepadRef.current();
        disposeFirepadRef.current = null;
      }
    };
    // defaultValue shouldn't change without the other values changing (and if it does, it's probably a bug)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseRef, userRef, editor]);

  return (
    <div
      className="tw-forms-disable tw-forms-disable-all-descendants h-full"
      data-test-id={dataTestId}
    >
      <LazyMonacoEditor
        {...props}
        onMount={(e, m) => {
          setEditor(e);
          if (onMount) onMount(e, m);
        }}
        // this is necessary because sometimes the editor component will unmount before firepad
        // and firepad needs to be disposed before editor can be disposed
        onBeforeDispose={() => {
          if (disposeFirepadRef.current) {
            disposeFirepadRef.current();
            disposeFirepadRef.current = null;
          }
        }}
        vim={useEditorWithVim && mode === 'Vim'}
      />
    </div>
  );
};

export default FirepadEditor;
