import React, { useEffect, useRef, useState } from 'react';

import { useAtomValue } from 'jotai/utils';

import { useRouter } from 'next/router';
import invariant from 'tiny-invariant';
import { MessagePage } from '../../src/components/MessagePage';
import { useNullableUserContext } from '../../src/context/UserContext';
import va from '@vercel/analytics';

export default function CreateUSACO(): JSX.Element {
  const router = useRouter();

  const { firebaseUser, userData } = useNullableUserContext();
  const [error, setError] = useState<string | null>(null);

  const createdRef = useRef<boolean>(false);

  useEffect(() => {
    if (!router.isReady || !firebaseUser || !userData || createdRef.current)
      return;
    const usacoID = router.query.id;
    createdRef.current = true;

    invariant(typeof usacoID === 'string', 'Expected USACO ID to be a string');

    (async () => {
      va.track('Create File', { type: 'usaco-file' });

      const resp = await fetch(`/api/createUSACOFile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usacoID: usacoID,
          userID: firebaseUser.uid,
          userName: firebaseUser.displayName,
          defaultPermission: userData.defaultPermission,
        }),
      });
      if (resp.status === 500) {
        setError('An unknown error occurred.');
      } else {
        const data = await resp.json();
        if (data.message) {
          // error
          setError(data.message);
        } else {
          router.replace(`/${data.fileID.substring(1)}`);
        }
      }
    })();
  }, [router.isReady, firebaseUser, userData]);

  if (error) {
    return <MessagePage message={'Error: ' + error} />;
  }

  return <MessagePage message="Loading File..." showHomeButton={false} />;
}
