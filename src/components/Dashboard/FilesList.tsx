import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import firebase from 'firebase/app';
import Link from 'next/link';
dayjs.extend(relativeTime);
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Firepad from '../../scripts/firepad';
import { extractJavaFilename } from '../../scripts/judge';

export type File = {
  id: string;
  lastAccessTime: number;
  title: string;
  creationTime: number | null;
  lastPermission: string | null;
  lastDefaultPermission: string | null;
  hidden: boolean | null;
  version: number;
  owner?: {
    name: string;
    id: string;
  }; // added in v2
};

export interface FilesListProps {
  files: File[];
  showPerms: boolean;
}

import { useAtomValue } from 'jotai/utils';
import invariant from 'tiny-invariant';
import { firebaseUserAtom } from '../../atoms/firebaseUserAtoms';
import { permissionLabels } from '../UserList/UserListItem';

export const sharingPermissionLabels: Record<string, string> = {
  READ_WRITE: 'Public Read & Write',
  READ: 'Public View Only',
  PRIVATE: 'Private',
};

export default function FilesList(props: FilesListProps): JSX.Element {
  const firebaseUser = useAtomValue(firebaseUserAtom);
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

  const handleToggleHideFile = (file: File) => {
    const ref = firebase
      .database()
      .ref('users')
      .child(firebaseUser.uid)
      .child(file.id);
    ref.update({ hidden: !file.hidden });
  };

  const downloadAll = (files: File[]) => {
    files.forEach(file => {
      firebase
        .database()
        .ref(file.id)
        .get()
        .then((snap: firebase.database.DataSnapshot) => {
          const fileData = snap.val();
          console.log(fileData);
          for (const language of ['cpp', 'java', 'py']) {
            const editorKey = `editor-${language}`;
            if (editorKey in fileData) {
              const firepadRef = firebase
                .database()
                .ref(file.id)
                .child(editorKey);
              // console.log('REF');
              // console.log(firepadRef);
              const headless = new Firepad.Headless(firepadRef);
              headless.getText(code => {
                const fileNames = {
                  cpp: `${fileData.settings.workspaceName}.cpp`,
                  java: extractJavaFilename(code),
                  py: `${fileData.settings.workspaceName}.py`,
                };
                // @ts-ignore
                download(fileNames[fileData.settings.language], code);
              });
            }
          }
        })
        .catch(error => {
          console.error(error);
        });
    });
  };

  const downloadAllButton = (
    <div className="flex items-center space-x-4">
      <button
        className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1E1E1E] focus:ring-indigo-500"
        onClick={() => downloadAll(props.files)}
      >
        Download All Files
      </button>
    </div>
  );

  return (
    <>
      {downloadAllButton}
      <div className="flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <table className="min-w-full divide-y divide-gray-600">
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-100 sm:pl-6 md:pl-0"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    className="py-3.5 px-3 text-left text-sm font-semibold text-gray-100"
                  >
                    Last Accessed
                  </th>
                  <th
                    scope="col"
                    className="py-3.5 px-3 text-left text-sm font-semibold text-gray-100"
                  >
                    Created
                  </th>
                  <th
                    scope="col"
                    className="py-3.5 px-3 text-left text-sm font-semibold text-gray-100"
                  >
                    Owner
                  </th>
                  <th
                    scope="col"
                    className="py-3.5 px-3 text-left text-sm font-semibold text-gray-100"
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
                        <Link href={`/${file.id.substring(1)}`}>
                          <a className="text-gray-100 hover:text-white">
                            {file.title || '(Unnamed File)'}
                          </a>
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
    </>
  );
}
