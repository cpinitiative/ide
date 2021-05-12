import { atom } from 'jotai';

export type EditorMode = 'Normal' | 'Vim';

const editorModeAtom = atom<EditorMode>('Normal');
editorModeAtom.onMount = setValue => {
  // this might trigger hydration issues? whatever
  if (typeof window !== 'undefined') {
    const editorMode = window.localStorage.getItem('editorMode');
    if (editorMode === 'Vim' || editorMode === 'Normal') {
      setValue(editorMode);
    }
  }
};
export const editorModeAtomWithPersistence = atom<EditorMode, EditorMode>(
  get => get(editorModeAtom),
  (get, set, val) => {
    set(editorModeAtom, val);
    localStorage.setItem('editorMode', val);
  }
);

export const userNameAtom = atom<string | null>(null);
