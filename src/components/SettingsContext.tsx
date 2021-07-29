import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import type firebaseType from 'firebase';
import { useAtomValue, useUpdateAtom } from 'jotai/utils';
import {
  authenticatedFirebaseRefAtom,
  setFirebaseErrorAtom,
} from '../atoms/firebaseAtoms';
import { ProblemData } from './Workspace/Workspace';

export type Language = 'cpp' | 'java' | 'py';
export const LANGUAGES: { label: string; value: Language }[] = [
  {
    label: 'C++',
    value: 'cpp',
  },
  {
    label: 'Java',
    value: 'java',
  },
  {
    label: 'Python 3.8.1',
    value: 'py',
  },
];

// emacs coming soon?
export const EDITOR_MODES = ['Normal', 'Vim' /*'Emacs'*/];

export interface UserSettings {
  editorMode: 'Normal' | 'Vim' | 'Emacs';
  name: string;
}

export interface WorkspaceSettings {
  compilerOptions: { [key in Language]: string };
  defaultPermission: string;
  workspaceName?: string;
  creationTime?: string;
  problem?: ProblemData | null;
}

type SettingsContextType = {
  settings: WorkspaceSettings;
  setSettings: (updates: Partial<WorkspaceSettings>) => void;
};

export const SettingsContext = createContext<SettingsContextType | null>(null);

export const SettingsProvider: React.FC = ({ children }) => {
  const firebaseRef = useAtomValue(authenticatedFirebaseRefAtom);
  const setFirebaseError = useUpdateAtom(setFirebaseErrorAtom);
  const [settings, setSettings] = useReducer(
    (prev: WorkspaceSettings, next: Partial<WorkspaceSettings>) => {
      return {
        ...prev,
        ...next,
      };
    },
    {
      compilerOptions: {
        cpp:
          '-std=c++17 -O2 -Wall -Wextra -Wshadow -Wconversion -Wfloat-equal -Wduplicated-cond -Wlogical-op',
        java: '',
        py: '',
      },
      defaultPermission: 'READ_WRITE',
    }
  );

  useEffect(() => {
    if (firebaseRef) {
      const handleNewSetting = (snap: firebaseType.database.DataSnapshot) => {
        setSettings({
          // set workspaceName to nothing if the workspace doesn't have a name
          workspaceName: '',
          problem: null, // don't persist problem and compiler options to new file
          compilerOptions: {
            cpp:
              '-std=c++17 -O2 -Wall -Wextra -Wshadow -Wconversion -Wfloat-equal -Wduplicated-cond -Wlogical-op',
            java: '',
            py: '',
          },
          ...snap.val(),
        });
      };
      firebaseRef
        .child('settings')
        .on('value', handleNewSetting, e => setFirebaseError(e));
      return () => firebaseRef.child('settings').off('value', handleNewSetting);
    }
  }, [firebaseRef, setFirebaseError]);

  const value = useMemo(
    () => ({
      settings,
      setSettings: (data: Partial<WorkspaceSettings>) => {
        if (firebaseRef) {
          firebaseRef.child('settings').update(data);
          // setSettings(data);
          // ^ firebase should auto-sync
        } else {
          alert("Firebase hasn't loaded yet, please wait");
        }
      },
    }),
    [settings, firebaseRef]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error(
      'useSettings() must be called within a SettingsContext.Provider'
    );
  }
  return context;
};
