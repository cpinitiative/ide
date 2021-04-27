import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import { useFirebaseRef } from '../hooks/useFirebaseRef';
import type firebaseType from 'firebase';

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

export interface Settings {
  editorMode: 'Normal' | 'Vim' | 'Emacs';
  compilerOptions: { [key in Language]: string };
  defaultPermission: string;
}

type SettingsContextType = {
  settings: Settings;
  setSettings: (updates: Partial<Settings>) => void;
};

export const SettingsContext = createContext<SettingsContextType | null>(null);

export const SettingsProvider: React.FC = ({ children }) => {
  const firebaseRef = useFirebaseRef();
  const [settings, setSettings] = useReducer(
    (prev: Settings, next: Partial<Settings>) => {
      return {
        ...prev,
        ...next,
      };
    },
    {
      editorMode: 'Normal',
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
        setSettings(snap.val());
      };
      firebaseRef.child('settings').on('value', handleNewSetting);
      return () => firebaseRef.child('settings').off('value', handleNewSetting);
    }
  }, [firebaseRef]);

  useEffect(() => {
    const editorMode = window.localStorage.getItem('editorMode');
    if (editorMode === 'Vim' || editorMode === 'Normal') {
      setSettings({ editorMode });
    }
  }, []);

  const value = useMemo(
    () => ({
      settings,
      setSettings: (data: Partial<Settings>) => {
        if (firebaseRef) {
          const { editorMode, ...otherSettings } = data;
          firebaseRef.child('settings').update(otherSettings);
          if (editorMode) localStorage.setItem('editorMode', editorMode);
          setSettings(data);
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
