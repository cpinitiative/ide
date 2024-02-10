import React from 'react';
import Link from 'next/link';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

import firebase from 'firebase/app';

export type File = {
  id: string;
  lastAccessTime: number;
  title: string;
  creationTime: number | null;
  lastPermission: string | null;
  lastDefaultPermission: string | null;
  hidden: boolean | null;
  version: number;
  language: string;
  owner?: {
    name: string;
    id: string;
  }; // added in v2
};

export interface FilesListProps {
  files: File[];
  showPerms: boolean;
}

import { permissionLabels } from '../UserList/UserListItem';
import { useAtomValue } from 'jotai/utils';
import invariant from 'tiny-invariant';
import { useUserContext } from '../../context/UserContext';

export const sharingPermissionLabels: Record<string, string> = {
  READ_WRITE: 'Public Read & Write',
  READ: 'Public View Only',
  PRIVATE: 'Private',
};

export default function FilesList(props: FilesListProps): JSX.Element {
  const { firebaseUser } = useUserContext();
  invariant(!!firebaseUser);
  const formatCreationTime = (creationTime: number | null): string => {
    if (!creationTime) return 'Unknown';
    // return String(creationTime);
    // if recent then display time ago
    if (+dayjs() - +dayjs(creationTime) <= 1000 * 60 * 60 * 24 * 2)
      // <= two days
      return dayjs(creationTime).fromNow();
    return dayjs(creationTime).format('MM/DD/YYYY'); // otherwise display date
  };

  const formatLanguage = (language: string | null): string => {
    if (language == 'py') return 'Python';
    if (language == 'java') return 'Java';
    if (language == 'cpp') return 'C++';
    return 'Unknown';
  };

  const handleToggleHideFile = (file: File) => {
    const ref = firebase
      .database()
      .ref('users')
      .child(firebaseUser.uid)
      .child('files')
      .child(file.id);
    ref.update({ hidden: !file.hidden });
  };

  return (
    <div className="flex flex-col">
      <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
          <table className="min-w-full divide-y divide-gray-600">
            <thead>
              <tr>
                <th
                  scope="col"
                  className="py-3.5 pl-4 pr-2 text-left text-sm font-semibold text-gray-100 sm:pl-6 md:pl-0"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="py-3.5 px-2 text-left text-sm font-semibold text-gray-100"
                >
                  Last Accessed
                </th>
                <th
                  scope="col"
                  className="py-3.5 px-2 text-left text-sm font-semibold text-gray-100"
                >
                  Created
                </th>
                <th
                  scope="col"
                  className="py-3.5 px-2 text-left text-sm font-semibold text-gray-100"
                >
                  Language
                </th>
                <th
                  scope="col"
                  className="py-3.5 px-2 text-left text-sm font-semibold text-gray-100"
                >
                  Owner
                </th>
                <th
                  scope="col"
                  className="py-3.5 px-2 text-left text-sm font-semibold text-gray-100"
                >
                  Permissions
                </th>
                <th
                  scope="col"
                  className="relative py-3.5 pl-3 pr-4 sm:pr-6 md:pr-0"
                >
                  <span className="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {props.files.map(file => (
                <tr key={file.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium sm:pl-6 md:pl-0">
                    {file.hidden ? (
                      <span className="text-gray-400">
                        {file.title || '(Unnamed File)'} (Hidden)
                      </span>
                    ) : (
                      <Link
                        href={`/${file.id.substring(1)}`}
                        className="text-gray-100 hover:text-white"
                      >
                        {file.title || '(Unnamed File)'}
                      </Link>
                    )}
                  </td>
                  <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-400">
                    {dayjs(file.lastAccessTime).fromNow()}
                  </td>
                  <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-400">
                    {formatCreationTime(file.creationTime)}
                  </td>
                  <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-400">
                    {formatLanguage(file.language)}
                  </td>
                  <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-400">
                    {file.owner
                      ? file.owner.id === firebaseUser.uid
                        ? 'Me'
                        : file.owner.name
                      : ''}
                  </td>
                  <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-400">
                    {file.lastPermission &&
                    file.lastPermission in permissionLabels
                      ? permissionLabels[file.lastPermission]
                      : 'Unknown'}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 md:pr-0">
                    <button
                      className="text-indigo-400 hover:text-indigo-100"
                      onClick={() => handleToggleHideFile(file)}
                    >
                      {file.hidden ? 'Unhide' : 'Hide'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    // <div className="mt-4 -mx-2">
    //   {props.files
    //     .sort((a, b) => (a.creationTime ?? 0) - (b.creationTime ?? 0))
    //     .reverse()
    //     .map(file => (
    //       <Link key={file.id} href={`/${file.id.substring(1)}`}>
    //         <a className="bg-gray-800 hover:bg-gray-700 px-4 py-3 rounded-lg inline-block w-full max-w-sm m-2">
    //           <div className="flex justify-between">
    //             <div className="text-gray-200">
    //               {file.title || 'Unnamed File'}
    //             </div>
    //             <button
    //               onClick={e => {
    //                 e.preventDefault(); // not stopPropagation
    //                 if (!firebaseUser) {
    //                   alert('Firebase not loaded, please wait');
    //                   return;
    //                 }
    //                 const confirmed = confirm(
    //                   file.hidden ? 'Unhide this item?' : 'Hide this item?'
    //                 );
    //                 if (!confirmed) return;
    //                 if (confirmed) {
    //                   const ref = firebase
    //                     .database()
    //                     .ref('users')
    //                     .child(firebaseUser.uid)
    //                     .child(file.id);
    //                   ref.update({ hidden: !file.hidden });
    //                 }
    //               }}
    //             >
    //               {file.hidden ? (
    //                 <SaveIcon
    //                   className="h-5 w-5 text-gray-400 hover:text-gray-500 focus:text-gray-500 focus:outline-none"
    //                   aria-hidden="true"
    //                 />
    //               ) : (
    //                 <TrashIcon
    //                   className="h-5 w-5 text-gray-400 hover:text-gray-500 focus:text-gray-500 focus:outline-none"
    //                   aria-hidden="true"
    //                 />
    //               )}
    //             </button>
    //           </div>
    //           <div className="text-gray-400">
    //             Last Accessed: {dayjs(file.lastAccessTime).fromNow()}
    //           </div>
    //           <div className="text-gray-400">
    //             Created: {formatCreationTime(file.creationTime)}
    //           </div>
    //           {props.showPerms ? (
    //             <div className="text-gray-400">
    //               Permissions:{' '}
    //               {file.lastPermission &&
    //               file.lastPermission in permissionLabels
    //                 ? permissionLabels[file.lastPermission]
    //                 : 'Unknown'}
    //             </div>
    //           ) : (
    //             <div className="text-gray-400">
    //               Default Permissions:{' '}
    //               {file.lastDefaultPermission &&
    //               file.lastDefaultPermission in sharingPermissionLabels
    //                 ? sharingPermissionLabels[file.lastDefaultPermission]
    //                 : 'Unknown'}
    //             </div>
    //           )}
    //         </a>
    //       </Link>
    //     ))}
    // </div>
  );
}
