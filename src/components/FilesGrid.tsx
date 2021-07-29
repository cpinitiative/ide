import React from 'react';
import { Link } from '@reach/router';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

import { TrashIcon, SaveIcon } from '@heroicons/react/solid';
import firebase from 'firebase/app';

export type File = {
  id: string;
  lastAccessTime: number;
  title: string;
  creationTime: number | null;
  lastPermission: string | null;
  lastDefaultPermission: string | null;
  hidden: boolean | null;
};

export interface FilesGridProps {
  files: File[];
  showPerms: boolean;
}

import { permissionLabels } from '../components/UserList/UserListItem';
import { firebaseUserAtom } from '../atoms/firebaseUserAtoms';
import { useAtomValue } from 'jotai/utils';

export const sharingPermissionLabels: Record<string, string> = {
  READ_WRITE: 'Public Read & Write',
  READ: 'Public View Only',
  PRIVATE: 'Private',
};

export default function FilesGrid(props: FilesGridProps): JSX.Element {
  const firebaseUser = useAtomValue(firebaseUserAtom);
  const formatCreationTime = (creationTime: number | null): string => {
    if (!creationTime) return 'Unknown';
    // return String(creationTime);
    // if recent then display time ago
    if (+dayjs() - +dayjs(creationTime) <= 1000 * 60 * 60 * 24 * 2)
      // <= two days
      return dayjs(creationTime).fromNow();
    return dayjs(creationTime).format('MM/DD/YYYY'); // otherwise display date
  };
  return (
    <div className="mt-4 -mx-2">
      {props.files
        .sort((a, b) => (a.creationTime ?? 0) - (b.creationTime ?? 0))
        .reverse()
        .map(file => (
          <Link
            key={file.id}
            to={`/${file.id.substring(1)}`}
            className="bg-gray-800 hover:bg-gray-700 px-4 py-3 rounded-lg inline-block w-full max-w-sm m-2"
          >
            <div className="flex justify-between">
              <div className="text-gray-200">
                {file.title || 'Unnamed File'}
              </div>
              <button
                onClick={e => {
                  e.preventDefault(); // not stopPropagation
                  if (!firebaseUser) {
                    alert('Firebase not loaded, please wait');
                    return;
                  }
                  const confirmed = confirm(
                    file.hidden ? 'Unhide this item?' : 'Hide this item?'
                  );
                  if (!confirmed) return;
                  if (confirmed) {
                    const ref = firebase
                      .database()
                      .ref('users')
                      .child(firebaseUser.uid)
                      .child(file.id);
                    ref.update({ hidden: !file.hidden });
                  }
                }}
              >
                {file.hidden ? (
                  <SaveIcon
                    className="h-5 w-5 text-gray-400 hover:text-gray-500 focus:text-gray-500 focus:outline-none"
                    aria-hidden="true"
                  />
                ) : (
                  <TrashIcon
                    className="h-5 w-5 text-gray-400 hover:text-gray-500 focus:text-gray-500 focus:outline-none"
                    aria-hidden="true"
                  />
                )}
              </button>
            </div>
            <div className="text-gray-400">
              Last Accessed: {dayjs(file.lastAccessTime).fromNow()}
            </div>
            <div className="text-gray-400">
              Created: {formatCreationTime(file.creationTime)}
            </div>
            {props.showPerms ? (
              <div className="text-gray-400">
                Permissions:{' '}
                {file.lastPermission && file.lastPermission in permissionLabels
                  ? permissionLabels[file.lastPermission]
                  : 'Unknown'}
              </div>
            ) : (
              <div className="text-gray-400">
                Default Permissions:{' '}
                {file.lastDefaultPermission &&
                file.lastDefaultPermission in sharingPermissionLabels
                  ? sharingPermissionLabels[file.lastDefaultPermission]
                  : 'Unknown'}
              </div>
            )}
          </Link>
        ))}
    </div>
  );
}
