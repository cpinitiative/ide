import React from 'react';
import { Link } from '@reach/router';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

export type File = {
  id: string;
  lastAccessTime: number;
  title: string;
  lastPermission: string | null;
  creationTime: number | null;
};

export interface FilesGridProps {
  files: File[];
  showPerms: boolean;
}

import { permissionLabels } from '../components/UserList/UserListItem';

export default function FilesGrid(props: FilesGridProps): JSX.Element {
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
            <div className="text-gray-200">{file.title || 'Unnamed File'}</div>
            <div className="text-gray-400">
              Last Accessed: {dayjs(file.lastAccessTime).fromNow()}
            </div>
            <div className="text-gray-400">
              Created: {formatCreationTime(file.creationTime)}
            </div>
            {props.showPerms && (
              <div className="text-gray-400">
                Sharing Permissions:{' '}
                {file.lastPermission && file.lastPermission in permissionLabels
                  ? permissionLabels[file.lastPermission]
                  : 'Unknown'}
              </div>
            )}
            {/* TODO: show default permissions otherwise */}
          </Link>
        ))}
    </div>
  );
}
