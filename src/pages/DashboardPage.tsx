import React, { useEffect, useState } from 'react';
import { Link, RouteComponentProps } from '@reach/router';
import FilesGrid from '../components/FilesGrid';
import { useAtomValue, useUpdateAtom } from 'jotai/utils';
import firebase from 'firebase/app';
import { File } from '../components/FilesGrid';
import {
  firebaseUserAtom,
  signInWithGoogleAtom,
  signOutAtom,
} from '../atoms/firebaseUserAtoms';

export default function DashboardPage(
  _props: RouteComponentProps
): JSX.Element {
  const firebaseUser = useAtomValue(firebaseUserAtom);
  const signInWithGoogle = useUpdateAtom(signInWithGoogleAtom);
  const signOut = useUpdateAtom(signOutAtom);
  const [ownedFiles, setOwnedFiles] = useState<File[] | null>(null);
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
          const yourFiles: File[] = [];
          snap.forEach(child => {
            yourFiles.push({
              id: child.key,
              ...child.val(),
            });
          });
          yourFiles.reverse();
          const yourOwnedFiles: File[] = [];
          const yourOtherFiles: File[] = [];
          for (const file of yourFiles) {
            if (file.lastPermission === 'OWNER') {
              yourOwnedFiles.push(file);
            } else {
              yourOtherFiles.push(file);
            }
          }
          setOwnedFiles(yourOwnedFiles);
          setFiles(yourOtherFiles);
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
          className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1E1E1E] focus:ring-indigo-500"
        >
          Create New File
        </Link>

        {!firebaseUser || firebaseUser.isAnonymous ? (
          <div className="text-gray-400 mt-6">
            Not signed in.{' '}
            <button
              className="underline text-gray-200 focus:outline-none hover:bg-gray-700 p-1 leading-none transition"
              onClick={signInWithGoogle}
            >
              Sign in now
            </button>
          </div>
        ) : (
          <div className="text-gray-400 mt-6">
            Signed in as {firebaseUser.displayName}.
            <button
              className="underline text-gray-200 focus:outline-none hover:bg-gray-700 p-1 leading-none transition"
              onClick={signOut}
            >
              Sign Out
            </button>
          </div>
        )}

        {ownedFiles && ownedFiles.length > 0 && (
          <>
            <div className="h-12"></div>

            <h2 className="text-gray-100 text-xl md:text-3xl font-black">
              Owned by You
            </h2>
            <FilesGrid files={ownedFiles} showPerms={false} />
          </>
        )}

        {files && files.length > 0 && (
          <>
            <div className="h-12"></div>

            <h2 className="text-gray-100 text-xl md:text-3xl font-black">
              Recently Accessed
            </h2>
            <FilesGrid files={files} showPerms={true} />
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
