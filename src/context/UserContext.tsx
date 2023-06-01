import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type firebaseType from 'firebase';
import firebase from 'firebase/app';
import { signInAnonymously } from '../scripts/firebaseUtils';
import animals from '../scripts/animals';

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

export type UserContextType = {
  firebaseUser: firebaseType.User | null;
  userData: (UserData & { id: string }) | null;
  /**
   * Updates firebaseUser.displayName. Normally doing this doesn't trigger rerender
   * so use this function, which will force a UI rerender
   * @param username The new value of firebaseUser.displayName
   * @returns promise that resolves when firebaseUser is updated
   */
  updateUsername: (username: string) => Promise<any>;
};

export type UserData = {
  editorMode: 'Normal' | 'Vim';
  tabSize: number;
  lightMode: boolean;
  defaultPermission: 'READ_WRITE' | 'READ' | 'PRIVATE';
  defaultLanguage: Language;
};

export const defaultUserSettings: UserData = {
  editorMode: 'Normal', // change in settings
  tabSize: 4,
  lightMode: false,
  defaultPermission: 'READ_WRITE', // change in dashboard
  defaultLanguage: 'cpp', // last viewed file
};

export type EditorMode = 'Normal' | 'Vim';

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<firebaseType.User | null>(null);
  const [userData, setUserData] = useState<(UserData & { id: string }) | null>(
    null
  );
  const [_, triggerRerender] = useState<number>(0);

  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged(user => {
      if (!user) {
        setUserData(null);
        signInAnonymously();
      } else {
        let displayName = user.displayName;
        if (!displayName) {
          displayName =
            'Anonymous ' + animals[Math.floor(animals.length * Math.random())];
          user.updateProfile({ displayName }).then(() => setUser(user));
        } else {
          setUser(user);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const handleSnapshot = (snap: firebaseType.database.DataSnapshot) => {
      const data = snap.val() ?? {};
      setUserData({
        id: user.uid,
        editorMode: data.editorMode ?? 'Normal',
        tabSize: data.tabSize ?? 4,
        lightMode: data.lightMode ?? false,
        defaultPermission: data.defaultPermission ?? 'READ_WRITE',
        defaultLanguage: data.defaultLanguage ?? 'cpp',
      });
    };
    firebase
      .database()
      .ref(`users/${user.uid}/data`)
      .on('value', handleSnapshot);
    return () =>
      firebase
        .database()
        .ref(`users/${user.uid}/data`)
        .off('value', handleSnapshot);
  }, [user]);

  const updateUsername = useCallback(
    (newName: string) => {
      if (!user) throw new Error('Tried to update username but user is null');
      return user.updateProfile({ displayName: newName }).then(() => {
        // we need to trigger a rerender because firebase user never changes
        // but some parts of the app needs to rerender when firebaseUser.displayName changes
        triggerRerender(Date.now());
      });
    },
    [user]
  );

  return (
    <UserContext.Provider
      value={{ firebaseUser: user, userData, updateUsername }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useNullableUserContext() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
}

export function useUserContext() {
  const { firebaseUser, userData, updateUsername } = useNullableUserContext();
  if (!firebaseUser || !userData)
    throw new Error(
      "useUserContext() can only be called after UserProvider has finished loading. If you want to access userContext while it's still loading, use useNullableUserContext() instead"
    );
  return { firebaseUser, userData, updateUsername };
}
