import React, { useEffect, useState } from 'react';
import { useAtomValue, useUpdateAtom } from 'jotai/utils';
import { fileIdAtom } from '../../src/atoms/firebaseAtoms';
import firebase from 'firebase/app';
import { MessagePage } from '../../src/components/MessagePage';
import { isFirebaseId } from '../../src/editorUtils';
import { useRouter } from 'next/router';
import invariant from 'tiny-invariant';
import { firebaseUserAtom } from '../../src/atoms/firebaseUserAtoms';

export default function CopyFilePage(): JSX.Element {
  const router = useRouter();

  const firebaseUser = useAtomValue(firebaseUserAtom);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    if (!router.isReady || !firebaseUser) return;
    const fileId = router.query.id;

    invariant(typeof fileId === 'string', 'Expected fileId to be a string');

    const queryId: string = fileId;

    (async () => {
      const token = await firebaseUser.getIdToken();
      const resp = await fetch(`/api/copyFile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken: token,
          fileID: queryId,
        }),
      });
      const data = await resp.json();
      if (data.message) {
        // error
        alert('Error: ' + data.message);
      } else {
        router.replace(`/${data.fileID}`);
      }
    })();
  }, [router.isReady, firebaseUser]);

  if (permissionDenied) {
    return <MessagePage message="This file is private." />;
  }

  return <MessagePage message="Copying file..." showHomeButton={false} />;
}
