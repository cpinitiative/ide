import { useAtomValue } from 'jotai/utils';
import { useRouter } from 'next/router';
import React, { useEffect, useRef } from 'react';
import invariant from 'tiny-invariant';
import { MessagePage } from '../src/components/MessagePage';
import { useNullableUserContext } from '../src/context/UserContext';

export default function NewFilePage() {
  const { userData, firebaseUser } = useNullableUserContext();
  const router = useRouter();

  const alreadyCreatedFile = useRef<boolean>(false);

  useEffect(() => {
    if (userData && firebaseUser && !alreadyCreatedFile.current) {
      alreadyCreatedFile.current = true;
      (async () => {
        const resp = await fetch(`/api/createNewFile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workspaceName: 'Unnamed Workspace',
            userID: firebaseUser.uid,
            userName: firebaseUser.displayName, // TODO TEST
            defaultPermission: userData.defaultPermission,
          }),
        });
        const data = await resp.json();
        if (resp.ok) {
          router.push(`/${data.fileID.substring(1)}`);
        } else {
          alert('Error: ' + data.message);
        }
      })();
    }
  }, [userData, firebaseUser]);

  return <MessagePage showHomeButton={false} message="Creating new file..." />;
}
