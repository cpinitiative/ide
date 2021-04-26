import { useFirebaseRef, useUserRef } from '../hooks/useFirebaseRef';
import { useEffect, useState } from 'react';
import type firebaseType from 'firebase';

type User = {
  color: string;
  id: string;
  name: string;
};

export const UserList = (): JSX.Element => {
  const firebaseRef = useFirebaseRef();
  const userRef = useUserRef();

  const [users, setUsers] = useState<User[]>([]);

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

  return (
    <div>
      <div className="font-medium px-4">Users</div>
      <ul className="divide-y divide-gray-700 mx-4">
        {users.map(user => (
          <li key={user.id} className="py-4 flex">
            <span
              className="h-5 w-5 rounded"
              style={{ backgroundColor: user.color }}
            />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-300">
                {user.name}
                {user.id === userRef?.key ? ' (Me)' : ''}
              </p>
              {/*<p className="text-sm text-gray-400">Owner</p>*/}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
