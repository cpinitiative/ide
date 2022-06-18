import React, { useEffect, useState } from 'react';
import { useAtomValue } from 'jotai/utils';
import { MessagePage } from '../../src/components/MessagePage';
import { useRouter } from 'next/router';
import invariant from 'tiny-invariant';
import { firebaseUserAtom } from '../../src/atoms/firebaseUserAtoms';

export default function CopyFilePage(): JSX.Element {
  const router = useRouter();

  const firebaseUser = useAtomValue(firebaseUserAtom);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!router.isReady || !firebaseUser) return;
    const fileId = router.query.id;

    invariant(typeof fileId === 'string', 'Expected fileId to be a string');

    const queryId: string = fileId;

    (async () => {
      const token = await firebaseUser.getIdToken(true); // we need to force refresh to update display name
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
        setError(data.message);
      } else {
        router.replace(`/${data.fileID}`);
      }
    })();
  }, [router.isReady, firebaseUser]);

  if (error) {
    return <MessagePage message={'Error: ' + error} />;
  }

  return <MessagePage message="Copying file..." showHomeButton={false} />;
}
