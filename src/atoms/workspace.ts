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
export const layoutEditorsAtom = atom(null, (get, _set, _arg) => {
  get(mainMonacoEditorAtom)?.layout();
  get(inputMonacoEditorAtom)?.layout();
  get(outputMonacoEditorAtom)?.layout();
});
