import { createContext, useContext, useMemo, useReducer } from 'react';

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
}

export const SettingsContext = createContext<{
  settings: Settings;
  setSettings: (updates: Partial<Settings>) => void;
} | null>(null);

export const SettingsProvider: React.FC = ({ children }) => {
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
    }
  );

  const value = useMemo(
    () => ({
      settings,
      setSettings,
    }),
    [settings]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error(
      'useSettings() must be called within a SettingsContext.Provider'
    );
  }
  return context;
};
