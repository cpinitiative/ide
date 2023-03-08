import { createContext, useContext, useEffect, useState } from 'react';
import { UserSettings } from '../components/SettingsContext';
import type firebaseType from 'firebase';
import firebase from 'firebase/app';
import { signInAnonymously } from '../scripts/firebaseUtils';

export type UserContextType = {
  user: firebaseType.User | null;
  userData: UserData | null;
};

export type UserData = {
  editorMode: 'Normal' | 'Vim';
  tabSize: number;
  lightMode: boolean;
};

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<firebaseType.User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged(user => {
      setUser(user);
      if (!user) {
        setUserData(null);
        signInAnonymously();
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
        editorMode: data.editorMode ?? 'Normal',
        tabSize: data.tabSize ?? 4,
        lightMode: data.lightMode ?? false,
      });
    };
    firebase.database().ref(`users/${user.uid}`).on('value', handleSnapshot);
    return () =>
      firebase.database().ref(`users/${user.uid}`).off('value', handleSnapshot);
  }, [user]);

  return (
    <UserContext.Provider value={{ user, userData }}>
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
  const { user, userData } = useNullableUserContext();
  if (!user || !userData)
    throw new Error(
      "useUserContext() can only be called after UserProvider has finished loading. If you want to access userContext while it's still loading, use useNullableUserContext() instead"
    );
  return { user, userData };
}
