import { createContext, useContext, useEffect, useState } from 'react';
import { UserSettings } from '../components/SettingsContext';
import type firebaseType from 'firebase';
import firebase from 'firebase/app';
import { signInAnonymously } from '../scripts/firebaseUtils';
import animals from '../scripts/animals';

export type UserContextType = {
  firebaseUser: firebaseType.User | null;
  userData: (UserData & { id: string }) | null;
};

export type UserData = {
  editorMode: 'Normal' | 'Vim';
  tabSize: number;
  lightMode: boolean;
};

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<firebaseType.User | null>(null);
  const [userData, setUserData] = useState<(UserData & { id: string }) | null>(
    null
  );

  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged(user => {
      setUser(user);
      if (!user) {
        setUserData(null);
        signInAnonymously();
      } else {
        let displayName = user.displayName;
        if (!displayName) {
          displayName =
            'Anonymous ' + animals[Math.floor(animals.length * Math.random())];
          user.updateProfile({ displayName });
          // TODO also update the name on the current firebase document.
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
      });
    };
    firebase.database().ref(`users/${user.uid}`).on('value', handleSnapshot);
    return () =>
      firebase.database().ref(`users/${user.uid}`).off('value', handleSnapshot);
  }, [user]);

  return (
    <UserContext.Provider value={{ firebaseUser: user, userData }}>
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
  const { firebaseUser, userData } = useNullableUserContext();
  if (!firebaseUser || !userData)
    throw new Error(
      "useUserContext() can only be called after UserProvider has finished loading. If you want to access userContext while it's still loading, use useNullableUserContext() instead"
    );
  return { firebaseUser, userData };
}
