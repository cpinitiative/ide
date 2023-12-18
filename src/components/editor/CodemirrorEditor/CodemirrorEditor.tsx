// A codemirror editor, used on mobile devices

import ReactCodeMirror from '@uiw/react-codemirror';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { githubLight } from '@uiw/codemirror-theme-github';
import { cpp } from '@codemirror/lang-cpp';
import { EditorProps } from '../MonacoEditor/monaco-editor-types';
import * as Y from 'yjs';

import './codemirror-styles.css';
import { useEffect, useMemo, useState } from 'react';
import { yCollab } from 'y-codemirror.next';

export const CodemirrorEditor = (props: EditorProps): JSX.Element => {
  const [yCollabExtension, setYCollabExtension] = useState<any | null>(null);
  useEffect(() => {
    if (!props.yjsInfo) return;

    const undoManager = new Y.UndoManager(props.yjsInfo.yjsText);
    setYCollabExtension(
      yCollab(props.yjsInfo.yjsText, props.yjsInfo.yjsAwareness, {
        undoManager,
      })
    );
  }, [props.yjsInfo]);

  const extensions = useMemo(() => {
    if (!yCollabExtension) return [cpp()];
    return [cpp(), yCollabExtension];
  }, [yCollabExtension]);

  return (
    <ReactCodeMirror
      // force entire component to re-mount (and re-initialize codemirror) when yjs document ID changes
      key={props.yjsInfo?.yjsText.doc.guid}
      // we need to pass in props.yjsInfo.yjsText as a possible value here, since
      // the yCollab() extension expects the value to be initialized to yText.toString()
      // I don't think this needs to be re-computed every time though (only when extensions changes), but whatever
      value={props.value || props.yjsInfo?.yjsText.toString() || undefined}
      theme={props.theme === 'light' ? githubLight : vscodeDark}
      height="100%"
      style={{ fontSize: '13px' }}
      readOnly={props.options?.readOnly ?? false}
      extensions={extensions}
    />
  );
};
