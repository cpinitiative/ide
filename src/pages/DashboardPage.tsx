import React, { useEffect, useState } from 'react';
import { Link, RouteComponentProps } from '@reach/router';
import FilesGrid from '../components/FilesGrid';
import { useAtomValue } from 'jotai/utils';
import { firebaseUserAtom } from '../atoms/firebaseAtoms';
import firebase from 'firebase/app';
import { File } from '../components/FilesGrid';

export default function DashboardPage(
  _props: RouteComponentProps
): JSX.Element {
  const firebaseUser = useAtomValue(firebaseUserAtom);
  const [files, setFiles] = useState<File[] | null>(null);

  useEffect(() => {
    if (!firebaseUser) return;

    const ref = firebase.database().ref('users').child(firebaseUser.uid);
    const unsubscribe = ref
      .orderByChild('lastAccessTime')
      .limitToLast(50)
      .on('value', snap => {
        if (!snap.exists) {
          setFiles(null);
        } else {
          const newFiles: File[] = [];
          snap.forEach(child => {
            newFiles.push({
              id: child.key,
              ...child.val(),
            });
          });
          newFiles.reverse();
          setFiles(newFiles);
        }
      });
    return () => ref.off('value', unsubscribe);
  }, [firebaseUser]);

  return (
    <div className="p-4 sm:p-6 md:p-8 lg:p-12 min-h-full flex flex-col">
      <div className="flex-1">
        <h1 className="text-gray-100 text-2xl md:text-4xl font-black">
          Real-Time Collaborative Online IDE
        </h1>

        <div className="h-6"></div>

        <Link
          to="/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Create New File
        </Link>

        {files && (
          <>
            <div className="h-12"></div>

            <h2 className="text-gray-100 text-xl md:text-3xl font-black">
              My Files
            </h2>
            <FilesGrid files={files} />
          </>
        )}
      </div>
      <div className="mt-6 text-gray-400">
        Looking to get better at USACO? Check out the{' '}
        <a
          href="https://usaco.guide/"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-white"
        >
          USACO Guide
        </a>
        !
      </div>
    </div>
  );
}
