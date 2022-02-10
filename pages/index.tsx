import React, { useEffect, useState } from 'react';
import FilesGrid from '../src/components/FilesGrid';
import { ConfirmOverrideModal } from '../src/components/ConfirmOverrideModal';
import { useAtomValue, useUpdateAtom } from 'jotai/utils';
import firebase from 'firebase/app';
import { File } from '../src/components/FilesGrid';
import {
  firebaseUserAtom,
  signInWithGoogleAtom,
  signOutAtom,
} from '../src/atoms/firebaseUserAtoms';
import { isFirebaseId } from '../src/editorUtils';
import { fileIdAtom } from '../src/atoms/firebaseAtoms';
import {
  RadioGroupContents,
  SharingPermissions,
} from '../src/components/SharingPermissions';
import {
  isUserSettingsLoadingAtom,
  userSettingsAtomWithPersistence,
} from '../src/atoms/userSettings';
import { DefaultPermission } from '../src/atoms/workspace';
import { useAtom } from 'jotai';
import { useRouter } from 'next/router';
import { useConnectionContext } from '../src/context/ConnectionContext';

export default function DashboardPage(): JSX.Element {
  const firebaseUser = useAtomValue(firebaseUserAtom);
  const signInWithGoogle = useUpdateAtom(signInWithGoogleAtom);
  const signOut = useUpdateAtom(signOutAtom);
  const [ownedFiles, setOwnedFiles] = useState<File[] | null>(null);
  const [files, setFiles] = useState<File[] | null>(null);
  const setFileId = useUpdateAtom(fileIdAtom);
  const [showHidden, setShowHidden] = useState<boolean>(false);
  // const setFirebaseError = useUpdateAtom(setFirebaseErrorAtom);
  const [userSettings, setUserSettings] = useAtom(
    userSettingsAtomWithPersistence
  );
  const isUserSettingsLoading = useAtomValue(isUserSettingsLoadingAtom);
  const router = useRouter();
  const connectionContext = useConnectionContext();

  // const permissionRef = firebaseUser
  //   ? firebase
  //       .database()
  //       .ref('users')
  //       .child(firebaseUser.uid)
  //       .child('defaultPermission')
  //   : null;
  // useEffect(() => {
  //   // no need for live update, just get once
  //   if (permissionRef) {
  //     const getDefaultPermFromFirebase = async () => {
  //       const snap = await (permissionRef as firebase.database.Reference).get();
  //       const val = snap.val();
  //       if (val) setDefaultPermission(val);
  //     };
  //     getDefaultPermFromFirebase();
  //   }
  // }, [firebaseUser, setFirebaseError, permissionRef]);

  const setDefaultPermissionActual = async (val: string) => {
    setUserSettings({ defaultPermission: val as DefaultPermission });
  };

  const makeNewWorkspaceWithName = async (name: string) => {
    if (!firebaseUser) return;
    const resp = await fetch(`/api/createNewFile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workspaceName: name,
        userID: firebaseUser.uid,
        userName: firebaseUser.displayName,
        defaultPermission: userSettings.defaultPermission,
      }),
    });
    const data = await resp.json();
    if (resp.ok) {
      router.push(`/${data.fileID}`);
    } else {
      alert('Error: ' + data.message);
    }
  };

  const makeNewClassroomWithName = async (name: string) => {
    if (!firebaseUser) return;
    const resp = await fetch(`/api/createNewClassroom`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workspaceName: name,
        userID: firebaseUser.uid,
        userName: firebaseUser.displayName,
      }),
    });
    const data = await resp.json();
    if (resp.ok) {
      router.push(`/classrooms/${data.fileID}/instructor`);
    } else {
      alert('Error: ' + data.message);
    }
  };

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
            const key = child.key;
            if (key?.startsWith('-') && isFirebaseId(key.substring(1))) {
              yourFiles.push({
                id: key,
                ...child.val(),
              });
            }
          });
          yourFiles.reverse();
          const yourOwnedFiles: File[] = [];
          const yourOtherFiles: File[] = [];
          for (const file of yourFiles) {
            if (file.hidden && !showHidden) continue;
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
  }, [firebaseUser, showHidden]);

  return (
    <div className="p-4 sm:p-6 md:p-8 lg:p-12 min-h-full flex flex-col">
      <ConfirmOverrideModal />
      <div className="flex-1">
        <h1 className="text-gray-100 text-2xl md:text-4xl font-black">
          Real-Time Collaborative Online IDE
        </h1>

        <div className="h-6"></div>

        {(!firebaseUser || isUserSettingsLoading) && (
          <div className="text-gray-400 mt-6">Loading...</div>
        )}

        {!isUserSettingsLoading && (
          <>
            <div className="mb-4">
              <SharingPermissions
                value={!firebaseUser ? null : userSettings.defaultPermission}
                onChange={setDefaultPermissionActual}
                isOwner={true}
                lightMode
              />
            </div>

            <div className="flex items-center space-x-4">
              <button
                className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1E1E1E] focus:ring-indigo-500"
                onClick={() => {
                  const workspaceName = prompt(
                    'Creating a new workspace. Please name it:'
                  );
                  if (workspaceName === null) return;
                  makeNewWorkspaceWithName(workspaceName);
                }}
              >
                Create New File
              </button>
              <button
                className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1E1E1E] focus:ring-indigo-500"
                onClick={() => {
                  const workspaceName = prompt(
                    'Creating a new classroom. Please name it:'
                  );
                  if (workspaceName === null) return;
                  makeNewClassroomWithName(workspaceName);
                }}
              >
                Create New Classroom
              </button>
            </div>
          </>
        )}

        {firebaseUser && !isUserSettingsLoading && firebaseUser.isAnonymous ? (
          <div className="text-gray-400 mt-6">
            Not signed in.{' '}
            <button
              className="underline text-gray-200 focus:outline-none hover:bg-gray-700 p-1 leading-none transition"
              onClick={() => signInWithGoogle(connectionContext)}
            >
              Sign in now
            </button>
          </div>
        ) : firebaseUser && !isUserSettingsLoading ? (
          <div className="text-gray-400 mt-6">
            Signed in as {firebaseUser.displayName}.
            <button
              className="underline text-gray-200 focus:outline-none hover:bg-gray-700 p-1 leading-none transition"
              onClick={() => signOut(connectionContext)}
            >
              Sign Out
            </button>
          </div>
        ) : null}

        <div className="h-12"></div>

        {firebaseUser && !isUserSettingsLoading && (
          <>
            <h2 className="text-gray-100 text-2xl md:text-4xl font-black">
              Your Workspaces
            </h2>

            <div className="h-6"></div>
            <RadioGroupContents
              title="Show Hidden Files?"
              value={showHidden}
              onChange={setShowHidden}
              options={[
                {
                  label: 'Yes',
                  value: true,
                },
                {
                  label: 'No',
                  value: false,
                },
              ]}
              lightMode
            />
            <div className="h-6"></div>

            {ownedFiles && ownedFiles.length > 0 && (
              <>
                <h3 className="text-gray-100 text-xl md:text-3xl font-black">
                  Owned by You
                </h3>
                <FilesGrid files={ownedFiles} showPerms={false} />
              </>
            )}

            {files && files.length > 0 && (
              <>
                <div className="h-12"></div>

                <h3 className="text-gray-100 text-xl md:text-3xl font-black">
                  Recently Accessed
                </h3>
                <FilesGrid files={files} showPerms={true} />
              </>
            )}
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
        !<br />
        Not for commercial use.
      </div>
    </div>
  );
}