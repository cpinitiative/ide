import { useAtom, useAtomValue } from 'jotai';
import { useUpdateAtom } from 'jotai/utils';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import invariant from 'tiny-invariant';
import firebase from 'firebase/app';
import {
  firebaseUserAtom,
  signInWithGoogleAtom,
  signOutAtom,
} from '../../atoms/firebaseUserAtoms';
import {
  isUserSettingsLoadingAtom,
  userSettingsAtomWithPersistence,
} from '../../atoms/userSettings';
import { DefaultPermission } from '../../atoms/workspace';
import { useConnectionContext } from '../../context/ConnectionContext';
import { isFirebaseId } from '../../editorUtils';
import FilesList, { File } from './FilesList';
import { SharingPermissions, RadioGroupContents } from '../SharingPermissions';

export default function Dashboard() {
  const firebaseUser = useAtomValue(firebaseUserAtom);
  const isUserSettingsLoading = useAtomValue(isUserSettingsLoadingAtom);

  invariant(
    firebaseUser && !isUserSettingsLoading,
    '<Dashboard /> should only be called after firebase user and settings are loaded.'
  );

  const signInWithGoogle = useUpdateAtom(signInWithGoogleAtom);
  const signOut = useUpdateAtom(signOutAtom);
  const [files, setFiles] = useState<File[] | null>(null);
  const [showHidden, setShowHidden] = useState<boolean>(false);
  // const setFirebaseError = useUpdateAtom(setFirebaseErrorAtom);
  const [userSettings, setUserSettings] = useAtom(
    userSettingsAtomWithPersistence
  );
  const router = useRouter();
  const connectionContext = useConnectionContext();

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
    const unsubscribe = ref.orderByChild('lastAccessTime').on('value', snap => {
      if (!snap.exists) {
        setFiles(null);
      } else {
        const files: File[] = [];
        snap.forEach(child => {
          const data = child.val();
          if (!showHidden && data.hidden) return;
          const key = child.key;
          if (key?.startsWith('-') && isFirebaseId(key.substring(1))) {
            files.push({
              id: key,
              ...data,
            });
          }
        });
        files.reverse();
        setFiles(files);
        // const yourOwnedFiles: File[] = [];
        // const yourOtherFiles: File[] = [];
        // for (const file of yourFiles) {
        //   if (file.hidden && !showHidden) continue;
        //   if (file.lastPermission === 'OWNER') {
        //     yourOwnedFiles.push(file);
        //   } else {
        //     yourOtherFiles.push(file);
        //   }
        // }
        // setOwnedFiles(yourOwnedFiles);
      }
    });
    return () => ref.off('value', unsubscribe);
  }, [firebaseUser, showHidden]);

  return (
    <div>
      <div className="mb-4">
        <SharingPermissions
          value={!firebaseUser ? null : userSettings.defaultPermission}
          onChange={defaultPermission =>
            setUserSettings({
              defaultPermission: defaultPermission as DefaultPermission,
            })
          }
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

          {files && files.length > 0 && (
            <FilesList files={files} showPerms={false} />
          )}
        </>
      )}
    </div>
  );
}
