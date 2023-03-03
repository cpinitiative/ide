import React, { useState, useEffect, useRef, useMemo } from 'react';
import type firebaseType from 'firebase';
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
import EditorConnectionStatusIndicator from './editor/EditorConnectionStatusIndicator';

export interface FirepadEditorProps extends EditorProps {
  firebaseRef: firebaseType.database.Reference | undefined;
  useEditorWithVim?: boolean;
  dataTestId?: string;
}

const WEBSOCKET_SERVER = `${
  location.protocol === 'http:' ? 'ws:' : 'wss:'
}//localhost:1234`;

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
  const cleanupYjsRef = useRef<Function | null>(null);
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
      WEBSOCKET_SERVER,
      documentId,
      ydocument
    );

    // Bind Yjs to the editor model
    const monacoText = ydocument.getText('monaco');
    const monacoBinding = new MonacoBinding(
      monacoText,
      editor.getModel()!,
      new Set([editor]),
      provider.awareness
    );

    provider.on(
      'status',
      ({ status }: { status: 'disconnected' | 'connecting' | 'connected' }) => {
        setConnectionStatus(status);
      }
    );
    provider.on('sync', (isSynced: boolean) => {
      if (isSynced) {
        // Check if file needs to be initialized
        const isInitializedMap = ydocument.getMap('isInitialized');
        if (!isInitializedMap.get('isInitialized')) {
          isInitializedMap.set('isInitialized', true);
          monacoText.insert(0, defaultValue ?? '');
        }
      }
      setIsSynced(isSynced);
    });

    cleanupYjsRef.current = () => {
      setConnectionStatus('disconnected');
      setIsSynced(false);
      monacoBinding.destroy();
      provider.destroy();
      ydocument.destroy();
    };

    return () => {
      if (cleanupYjsRef.current) {
        cleanupYjsRef.current();
        cleanupYjsRef.current = null;
      }
    };
    // defaultValue shouldn't change without the other values changing (and if it does, it's probably a bug)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseRef, userRef, editor, fileId]);

  // make editor read only until yjs syncs with server
  const editorOptions = useMemo(() => {
    let editorOptions = { ...(props.options || {}) };
    if (!isSynced) editorOptions.readOnly = true;
    return editorOptions;
  }, [isSynced, props.options]);

  return (
    <div
      className="tw-forms-disable tw-forms-disable-all-descendants h-full relative"
      data-test-id={dataTestId}
    >
      <EditorConnectionStatusIndicator
        connectionStatus={connectionStatus}
        isSynced={isSynced}
      />
      <LazyMonacoEditor
        {...props}
        options={editorOptions}
        onMount={(e, m) => {
          setEditor(e);
          if (onMount) onMount(e, m);
        }}
        // this is necessary because sometimes the editor component will unmount before yjs
        // and yjs needs to be disposed before editor can be disposed
        onBeforeDispose={() => {
          if (cleanupYjsRef.current) {
            cleanupYjsRef.current();
            cleanupYjsRef.current = null;
          }
        }}
        vim={useEditorWithVim && mode === 'Vim'}
      />
    </div>
  );
};

export default FirepadEditor;
