import MonacoEditor from '@monaco-editor/react';
import { EditorProps } from '@monaco-editor/react';
import React, { useEffect, useState } from 'react';
import { userSettingsAtomWithPersistence } from '../atoms/userSettings';
import { useAtomValue } from 'jotai/utils';

export const EditorWithVim = ({
  onMount,
  ...props
}: EditorProps): JSX.Element => {
  const [
    editor,
    setEditor,
  ] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const { editorMode: mode } = useAtomValue(userSettingsAtomWithPersistence);

  useEffect(() => {
    if (!editor) return;

    if (mode === 'Vim') {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      window.require.config({
        paths: {
          'monaco-vim': 'https://unpkg.com/monaco-vim/dist/monaco-vim',
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let editorMode: any;

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      window.require(['monaco-vim'], MonacoVim => {
        const statusNode = document.querySelector('.status-node');
        editorMode = MonacoVim.initVimMode(editor, statusNode);
      });

      return () => editorMode.dispose();
    }
  }, [editor, mode]);

  return (
    <MonacoEditor
      {...props}
      onMount={(e, m) => {
        setEditor(e);
        if (onMount) onMount(e, m);
      }}
    />
  );
};
