import { EditorProps } from '@monaco-editor/react';
import { useEffect, useRef } from 'react';

import 'monaco-editor/esm/vs/editor/editor.all.js';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import 'monaco-editor/esm/vs/basic-languages/cpp/cpp.contribution.js';
import { buildWorkerDefinition } from 'monaco-editor-workers';

buildWorkerDefinition(
  'monaco-workers',
  new URL('', window.location.href).href,
  false
);

import { getOrCreateModel } from './utils';

export default function MonacoEditor(props: EditorProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    const modelPath = `file:///home/thecodingwizard/${props.path ?? 'default'}`;

    editorRef.current = monaco.editor.create(ref.current!, {
      model: getOrCreateModel(monaco, '', props.language, modelPath),
      automaticLayout: true,
      theme: props.theme,
      lightbulb: {
        enabled: true,
      },
      language: props.language,
    });

    if (props.onMount) {
      props.onMount(editorRef.current, monaco);
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.getModel()?.dispose();
        editorRef.current.dispose();
      }
    };
  }, []);

  return (
    <div className="flex relative h-full">
      <div
        className={props.className}
        ref={ref}
        style={{ width: '100%' }}
      ></div>
    </div>
  );
}
