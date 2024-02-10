import { useUpdateAtom } from 'jotai/utils';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import firebase from 'firebase/app';
import {
  signInWithGoogleAtom,
  signOutAtom,
} from '../../atoms/firebaseUserAtoms';
import { useConnectionContext } from '../../context/ConnectionContext';
import { isFirebaseId } from '../../editorUtils';
import FilesList, { File } from './FilesList';
import { SharingPermissions } from '../SharingPermissions';
import { RadioGroupContents } from '../settings/RadioGroupContents';
import {
  useNullableUserContext,
  UserData,
  useUserContext,
} from '../../context/UserContext';
import { MessagePage } from '../MessagePage';
import Link from 'next/link';

export default function Dashboard() {
  const { firebaseUser, userData } = useUserContext();

  const signInWithGoogle = useUpdateAtom(signInWithGoogleAtom);
  const signOut = useUpdateAtom(signOutAtom);

  const [files, setFiles] = useState<File[] | null>(null);
  const [showHidden, setShowHidden] = useState<boolean>(false);
  const router = useRouter();
  const connectionContext = useConnectionContext();
  // const makeNewClassroomWithName = async (name: string) => {
  //   if (!firebaseUser) return;
  //   const resp = await fetch(`/api/createNewClassroom`, {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify({
  //       workspaceName: name,
  //       userID: firebaseUser.uid,
  //       userName: firebaseUser.displayName,
  //     }),
  //   });
  //   const data = await resp.json();
  //   if (resp.ok) {
  //     router.push(`/classrooms/${data.fileID}/instructor`);
  //   } else {
  //     alert('Error: ' + data.message);
  //   }
  // };

  useEffect(() => {
    if (!firebaseUser) return;

    const ref = firebase
      .database()
      .ref('users')
      .child(firebaseUser.uid)
      .child('files');
    const unsubscribe = ref.orderByChild('lastAccessTime').on('value', snap => {
      if (!snap.exists) {
        setFiles([]);
      } else {
        const files: File[] = [];
        snap.forEach(child => {
          const data = child.val();
          const key = child.key;
          firebase
            .database()
            .ref('files/' + key)
            .on('value', snapp => {
              if (snapp.exists()) {
                ref.child(key + '/language').set(snapp.val().settings.language);
              }
            });

          if (!showHidden && data.hidden) return;
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
      <div className="flex items-center space-x-4">
        <Link
          href="/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1E1E1E] focus:ring-indigo-500"
        >
          Create New File
        </Link>
      </div>

      {firebaseUser.isAnonymous ? (
        <div className="text-gray-400 mt-6">
          Not signed in.{' '}
          <button
            className="underline text-gray-200 focus:outline-none hover:bg-gray-700 p-1 leading-none transition"
            onClick={() => signInWithGoogle(connectionContext)}
          >
            Sign in now
          </button>
        </div>
      ) : (
        <div className="text-gray-400 mt-6">
          Signed in as {firebaseUser.displayName}.
          <button
            className="underline text-gray-200 focus:outline-none hover:bg-gray-700 p-1 leading-none transition"
            onClick={() => signOut(connectionContext)}
          >
            Sign Out
          </button>
        </div>
      )}

      <div className="h-12"></div>

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

      {!files && <div className="text-gray-400">Loading files...</div>}
    </div>
  );
}
