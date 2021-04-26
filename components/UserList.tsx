import { useOnlineUsers } from '../hooks/useOnlineUsers';
import { useUserRef } from '../hooks/useFirebaseRef';

export const UserList = (): JSX.Element => {
  const userRef = useUserRef();
  const users = useOnlineUsers();

  return (
    <div>
      <div className="font-medium px-4">Users</div>
      <ul className="divide-y divide-gray-700 mx-4">
        {(users || []).map(user => (
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
