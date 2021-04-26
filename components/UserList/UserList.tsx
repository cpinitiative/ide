import { isUserOnline, useOnlineUsers, User } from '../../hooks/useOnlineUsers';
import { useMemo } from 'react';
import { UserListItem } from './UserListItem';

export const UserList = (): JSX.Element => {
  const users = useOnlineUsers();

  const sortedUsers: User[] | null = useMemo(() => {
    if (!users) return null;
    return [...users].sort((a, b) => {
      if (isUserOnline(a) !== isUserOnline(b)) {
        return isUserOnline(a) ? -1 : 1;
      }
      if (a.permission !== b.permission) {
        if (a.permission === 'OWNER') return -1;
        if (b.permission === 'OWNER') return 1;
        if (a.permission === 'READ_WRITE') return -1;
        if (b.permission === 'READ_WRITE') return 1;
        return -1;
      }
      return a.name.localeCompare(b.name);
    });
  }, [users]);

  return (
    <div>
      <div className="font-medium px-4">Users</div>
      <ul className="divide-y divide-gray-700 mx-4">
        {(sortedUsers || []).map(user => (
          <UserListItem user={user} key={user.id} />
        ))}
      </ul>
    </div>
  );
};
