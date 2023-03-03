import React, { useState, useEffect, useRef } from 'react';
import type firebaseType from 'firebase';
// import { EditorWithVim } from './EditorWithVim';
import { useAtom } from 'jotai';
import { loadingAtom } from '../atoms/workspace';
import { useAtomValue } from 'jotai/utils';
import { authenticatedUserRefAtom, fileIdAtom } from '../atoms/firebaseAtoms';
import LazyMonacoEditor from './MonacoEditor/LazyMonacoEditor';
import { EditorProps } from './MonacoEditor/monaco-editor-types';
import type * as monaco from 'monaco-editor';
import { userSettingsAtomWithPersistence } from '../atoms/userSettings';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import '../styles/yjs.css';

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
  const { id: fileId } = useAtomValue(fileIdAtom) || { id: null };
  const [, setLoading] = useAtom(loadingAtom);
  const disposeFirepadRef = useRef<Function | null>(null);
  const { editorMode: mode } = useAtomValue(userSettingsAtomWithPersistence);

  const [connectionStatus, setConnectionStatus] = useState<
    'disconnected' | 'connecting' | 'connected'
  >('disconnected');
  const [isSynced, setIsSynced] = useState<boolean>(false);

  useEffect(() => {
    if (!firebaseRef || !editor || !userRef || !fileId) return;

    const { path } = props;
    const affectsLoading =
      path && ['myfile.cpp', 'myfile.java', 'myfile.py'].includes(path);
    if (affectsLoading) setLoading(false);

    const documentId = `${fileId}.${firebaseRef.key}`;

    const ydocument = new Y.Doc();
    const provider = new WebsocketProvider(
      `${location.protocol === 'http:' ? 'ws:' : 'wss:'}//localhost:1234`,
      documentId,
      ydocument
    );
    provider.on(
      'status',
      ({ status }: { status: 'disconnected' | 'connecting' | 'connected' }) => {
        setConnectionStatus(status);
      }
    );
    provider.on('sync', (isSynced: boolean) => {
      setIsSynced(isSynced);
    });
    const type = ydocument.getText('monaco');

    // Bind Yjs to the editor model
    const monacoBinding = new MonacoBinding(
      type,
      editor.getModel()!,
      new Set([editor]),
      provider.awareness
    );

    disposeFirepadRef.current = () => {
      monacoBinding.destroy();
      provider.destroy();
      ydocument.destroy();
    };

    return () => {
      if (disposeFirepadRef.current) {
        disposeFirepadRef.current();
        disposeFirepadRef.current = null;
      }
    };
    // defaultValue shouldn't change without the other values changing (and if it does, it's probably a bug)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseRef, userRef, editor, fileId]);

  return (
    <div
      className="tw-forms-disable tw-forms-disable-all-descendants h-full"
      data-test-id={dataTestId}
    >
      <div>
        Connection status: {connectionStatus}. Sync status:{' '}
        {isSynced ? 'Synced' : 'Not Synced'}
      </div>
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
