import { atom } from 'jotai';
import { Language } from '../components/SettingsContext';

// Permissions
export const defaultPermissionAtom = atom<
  'READ_WRITE' | 'READ' | 'PRIVATE' | null
>(null);
export const userPermissionAtom = atom<'OWNER' | 'READ_WRITE' | 'READ' | null>(
  null
);
export const actualUserPermissionAtom = atom<
  'OWNER' | 'READ_WRITE' | 'READ' | 'PRIVATE' | null
>(get => get(userPermissionAtom) || get(defaultPermissionAtom));

// Loading
export const loadingAtom = atom(true);

// Code Interface
const actualLangAtom = atom<Language>('cpp');
export const currentLangAtom = atom<Language, Language>(
  get => get(actualLangAtom),
  (_get, set, lang: Language) => {
    window.history.replaceState(
      {},
      '',
      window.location.href.split('?')[0] + '?lang=' + lang
    );
    set(actualLangAtom, lang);
  }
);
currentLangAtom.onMount = setAtom => {
  const urlParams = new URLSearchParams(window.location.search);
  const queryLang = urlParams.get('lang');
  if (queryLang === 'cpp' || queryLang === 'java' || queryLang === 'py') {
    setAtom(queryLang);
  }
};
export const mainMonacoEditorAtom = atom<monaco.editor.IStandaloneCodeEditor | null>(
  null
);
export const inputMonacoEditorAtom = atom<monaco.editor.IStandaloneCodeEditor | null>(
  null
);
export const outputMonacoEditorAtom = atom<monaco.editor.IStandaloneCodeEditor | null>(
  null
);
export const layoutEditorsAtom = atom(null, (get, _set, _arg) => {
  get(mainMonacoEditorAtom)?.layout();
  get(inputMonacoEditorAtom)?.layout();
  get(outputMonacoEditorAtom)?.layout();
});
// export const monacoEditorsAtom = atom<monaco.editor.IStandaloneCodeEditor[]>(
//   []
// );
// export const updateMonacoEditorsAtom = atom<
//   null,
//   { editor: monaco.editor.IStandaloneCodeEditor; add: boolean }
// >(null, (get, set, { editor, add }) => {
//   if (add) {
//     set(monacoEditorsAtom, [...get(monacoEditorsAtom), editor]);
//   } else {
//     set(
//       monacoEditorsAtom,
//       get(monacoEditorsAtom).filter(editor => editor !== editor)
//     );
//   }
// });
