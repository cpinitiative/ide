// A codemirror editor, used on mobile devices

import ReactCodeMirror, { Extension } from '@uiw/react-codemirror';
import { indentUnit } from '@codemirror/language';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { githubLight } from '@uiw/codemirror-theme-github';
import { cpp } from '@codemirror/lang-cpp';
import { java } from '@codemirror/lang-java';
import { python } from '@codemirror/lang-python';
import { vim } from '@replit/codemirror-vim';
import { EditorProps } from '../MonacoEditor/monaco-editor-types';
import * as Y from 'yjs';

import './codemirror-styles.css';
import { useEffect, useMemo, useState } from 'react';
import { yCollab } from 'y-codemirror.next';

const CodemirrorEditor = (props: EditorProps): JSX.Element => {
  const [yCollabExtension, setYCollabExtension] = useState<any | null>(null);
  useEffect(() => {
    if (!props.yjsInfo) return;

    const undoManager = new Y.UndoManager(props.yjsInfo.yjsText);
    const yCollabPlugins = yCollab(
      props.yjsInfo.yjsText,
      props.yjsInfo.yjsAwareness,
      {
        undoManager,
      }
    ) as Extension[];
    setYCollabExtension(yCollabPlugins);

    return () => {
      // some of the codemirror yjs plugins need to be destroyed
      // so that it stops listening to yjs updates; otherwise
      // we may end up with a bug where the codemirror editor
      // has a bunch of duplicated text.
      // normally this shouldn't ever happen, since this effect should only be run once,
      // but I think react in development mode may run effects more than once
      // and this effect isn't "pure" unless these plugins are destroyed.
      yCollabPlugins.forEach(plugin => {
        if ((plugin as any).destroy) (plugin as any).destroy();
      });
    };
  }, [props.yjsInfo]);

  const extensions = useMemo(() => {
    let extensions = [];
    const tabSize = props.options?.tabSize || 4;
    extensions.push(indentUnit.of(' '.repeat(tabSize)));
    if (yCollabExtension) {
      extensions.push(yCollabExtension);
    }
    if (props.vim) {
      extensions.push(vim());
    }
    if (props.language && props.language !== 'plaintext') {
      if (props.language === 'cpp') {
        extensions.push(cpp());
      } else if (props.language === 'java') {
        extensions.push(java());
      } else if (props.language === 'python') {
        extensions.push(python());
      } else {
        console.error('Unknown language: ' + props.language);
      }
    }
    return extensions;
  }, [props.language, yCollabExtension, props.options?.tabSize, props.vim]);

  // todo: need to deal with props.options.tabSize
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
      onCreateEditor={props.onCodemirrorMount}
    />
  );
};

export default CodemirrorEditor;
