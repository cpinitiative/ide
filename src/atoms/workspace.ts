import { EditorView } from '@uiw/react-codemirror';
import { atom } from 'jotai';
import type * as monaco from 'monaco-editor';

// Loading
export const loadingAtom = atom(true);

export const mainMonacoEditorAtom =
  atom<monaco.editor.IStandaloneCodeEditor | null>(null);
export const inputMonacoEditorAtom =
  atom<monaco.editor.IStandaloneCodeEditor | null>(null);
export const outputMonacoEditorAtom =
  atom<monaco.editor.IStandaloneCodeEditor | null>(null);

export const mainCodemirrorEditorAtom = atom<EditorView | null>(null);
export const inputCodemirrorEditorAtom = atom<EditorView | null>(null);

export const layoutEditorsAtom = atom(null, (get, _set, _arg) => {
  get(mainMonacoEditorAtom)?.layout();
  get(inputMonacoEditorAtom)?.layout();
  get(outputMonacoEditorAtom)?.layout();
});

// returns a function that can be called to get the value of the editor
export const mainEditorValueAtom = atom(get => {
  const monacoEditor = get(mainMonacoEditorAtom);
  const codemirrorEditor = get(mainCodemirrorEditorAtom);
  if (monacoEditor && codemirrorEditor) {
    console.error('Both main editors are defined, this should not happen!');
  }
  if (!monacoEditor && !codemirrorEditor) {
    return null;
  }
  return () => {
    if (monacoEditor) {
      return monacoEditor.getValue();
    }
    return codemirrorEditor!.state.doc.toString();
  };
});

// returns a function that can be called to get the value of the editor
export const inputEditorValueAtom = atom(get => {
  const monacoEditor = get(inputMonacoEditorAtom);
  const codemirrorEditor = get(inputCodemirrorEditorAtom);
  if (monacoEditor && codemirrorEditor) {
    console.error('Both input editors are defined, this should not happen!');
  }
  if (!monacoEditor && !codemirrorEditor) {
    return null;
  }
  return () => {
    if (monacoEditor) {
      return monacoEditor.getValue();
    }
    return codemirrorEditor!.state.doc.toString();
  };
});
