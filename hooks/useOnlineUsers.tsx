import { useFirebaseRef } from './useFirebaseRef';
import { useEffect, useState } from 'react';
import firebaseType from 'firebase';

export type User = {
  color: string;
  id: string;
  name: string;
};

export function useOnlineUsers(): User[] | null {
  const firebaseRef = useFirebaseRef();

  const [users, setUsers] = useState<User[] | null>(null);

  useEffect(() => {
    if (firebaseRef) {
      const handleChange = (snap: firebaseType.database.DataSnapshot) => {
        if (!snap.exists()) return;
        setUsers(
          Object.keys(snap.val()).map(id => ({ id, ...snap.val()[id] }))
        );
      };
      firebaseRef.child('users').on('value', handleChange);
      return () => firebaseRef.child('users').off('value', handleChange);
    }
  }, [firebaseRef]);

  return users;
}
