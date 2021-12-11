import React, { useEffect, useState } from 'react';
import { useUpdateAtom } from 'jotai/utils';
import { fileIdAtom } from '../../src/atoms/firebaseAtoms';
import firebase from 'firebase/app';
import { MessagePage } from '../../src/components/MessagePage';
import { isFirebaseId } from '../../src/editorUtils';
import { useRouter } from 'next/router';
import invariant from 'tiny-invariant';

export default function CopyFilePage(): JSX.Element {
  const router = useRouter();
  const fileId = router.query.id ?? undefined;

  const setFileId = useUpdateAtom(fileIdAtom);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    if (!fileId) return; // server side rendering -- ignore

    invariant(typeof fileId === 'string', 'Expected fileId to be a string');

    const queryId: string = fileId;

    if (!isFirebaseId(queryId)) {
      alert('Error: Bad URL');
      router.replace('/');
      return;
    }

    const oldRef = firebase.database().ref(`-${queryId}`);
    const newRef = firebase.database().ref().push();
    const keysToCopy = [
      'editor-cpp',
      'editor-java',
      'editor-py',
      'settings',
      'input',
      'scribble',
    ];
    Promise.all(keysToCopy.map(key => oldRef.child(key).once('value')))
      .then(async data => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateObject: { [key: string]: any } = {};
        keysToCopy.forEach((key, idx) => {
          // we don't want to copy over user information or settings/defaultPermission for firepad
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { users, defaultPermission, creationTime, ...toKeep } =
            data[idx].val() || {};
          updateObject[key] = toKeep;
        });
        updateObject['settings']['workspaceName'] ??= 'Unnamed File';
        updateObject['settings']['workspaceName'] += ' (Copy)'; // make sure to change the name
        await newRef.set(updateObject);
        setFileId({
          newId: newRef.key!.slice(1), // first character is dash which we want to ignore
          isNewFile: true,
          navigate: router.replace,
        });
      })
      .catch(e => {
        if (e.code === 'PERMISSION_DENIED') {
          setPermissionDenied(true);
        } else {
          alert('Failed to clone file: ' + e.message);
          throw new Error(e.message);
        }
      });
  }, [fileId, setFileId]);

  if (permissionDenied) {
    return <MessagePage message="This file is private." />;
  }

  return <MessagePage message="Copying file..." showHomeButton={false} />;
}
