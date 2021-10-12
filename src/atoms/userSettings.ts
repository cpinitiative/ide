import firebase from 'firebase/app';
import { atom } from 'jotai';
import { Language } from '../components/SettingsContext';
import type firebaseType from 'firebase';
import 'firebase/database';
import { firebaseUserAtom } from './firebaseUserAtoms';
import colorFromUserId from '../scripts/colorFromUserId';
import { DefaultPermission } from './workspace';

export type EditorMode = 'Normal' | 'Vim';

// const editorModeAtom = atom<EditorMode>('Normal');
// editorModeAtom.onMount = setValue => {
//   // this might trigger hydration issues? whatever
//   if (typeof window !== 'undefined') {
//     const editorMode = window.localStorage.getItem('editorMode');
//     if (editorMode === 'Vim' || editorMode === 'Normal') {
//       setValue(editorMode);
//     }
//   }
// };
// export const editorModeAtomWithPersistence = atom<EditorMode, EditorMode>(
//   get => get(editorModeAtom),
//   (_get, set, val) => {
//     set(editorModeAtom, val);
//     localStorage.setItem('editorMode', val);
//   }
// );

export const userSettingsRefAtom = atom<firebaseType.database.Reference | null>(
  get => {
    const firebaseUser = get(firebaseUserAtom);
    if (!firebaseUser) {
      return null;
    }
    const uid = firebaseUser.uid;
    return firebase.database().ref('users').child(uid).child('settings');
  }
);

interface UserSettings {
  color: string;
  editorMode: EditorMode;
  defaultPermission: DefaultPermission;
  defaultLang: Language;
}

const defaultUserSettings: UserSettings = {
  editorMode: 'Normal', // change in settings
  color: '', // fixed
  defaultPermission: 'READ_WRITE', // change in dashboard
  defaultLang: 'cpp', // last viewed file
};

export const baseDisplayNameAtom = atom<string>('');
export const displayNameAtom = atom(
  get => get(baseDisplayNameAtom),
  (get, set, displayName: string) => {
    const firebaseUser = get(firebaseUserAtom);
    if (firebaseUser) firebaseUser.updateProfile({ displayName });
    set(baseDisplayNameAtom, displayName);
  }
);

export const baseUserSettingsAtom = atom<UserSettings>(defaultUserSettings);
export const _userSettingsAtom = atom<UserSettings, Partial<UserSettings>>(
  get => {
    const firebaseUser = get(firebaseUserAtom);
    let obj = { ...get(baseUserSettingsAtom) };
    if (firebaseUser) {
      obj = {
        ...obj,
        color: colorFromUserId(firebaseUser.uid),
      };
    }
    return obj;
  },
  (get, set, val) => {
    // only use this in WorkspaceInitializer
    set(baseUserSettingsAtom, {
      ...get(baseUserSettingsAtom),
      ...val,
    });
  }
);
export const userSettingsAtomWithPersistence = atom<
  UserSettings,
  Partial<UserSettings>
>(
  get => get(_userSettingsAtom),
  (get, _set, val) => {
    const data: UserSettings = {
      ...get(_userSettingsAtom),
      ...val,
    };
    const userRef = get(userSettingsRefAtom);
    if (userRef) userRef.update(data);
    else {
      // fail silently, it's probably okay?
      // console.log(`FAILED TO SET`);
      // console.log(val);
      // alert("Firebase hasn't loaded yet, please wait (UserSettings)");
    }
  }
);
