import React, { useEffect, useState } from 'react';
import { userSettingsAtomWithPersistence } from '../../atoms/userSettings';
import { useAtomValue } from 'jotai/utils';
import { EditorProps } from '../MonacoEditor/monaco-editor-types';
import LazyMonacoEditor from '../MonacoEditor/LazyMonacoEditor';
import type * as monaco from 'monaco-editor';

import { initVimMode } from 'monaco-vim'; // todo bundle size is too big https://nextjs.org/docs/advanced-features/dynamic-import#with-external-libraries

// this editor doesn't *force* vim -- only supports vim.
const EditorWithVim = ({ onMount, ...props }: EditorProps): JSX.Element => {
  const [editor, setEditor] =
    useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const { editorMode: mode } = useAtomValue(userSettingsAtomWithPersistence);

  useEffect(() => {
    if (!editor) return;

    if (mode === 'Vim') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let editorMode: any;

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const statusNode = document.querySelector('.status-node');
      editorMode = initVimMode(editor, statusNode);

      return () => editorMode.dispose();
    }
  }, [editor, mode]);

  return (
    <LazyMonacoEditor
      {...props}
      onMount={(e, m) => {
        setEditor(e);
        if (onMount) onMount(e, m);
      }}
    />
  );
};

export default EditorWithVim;
