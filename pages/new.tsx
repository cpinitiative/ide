import { useAtomValue } from 'jotai/utils';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';
import invariant from 'tiny-invariant';
import { firebaseUserAtom } from '../src/atoms/firebaseUserAtoms';
import {
  isUserSettingsLoadingAtom,
  userSettingsAtomWithPersistence,
} from '../src/atoms/userSettings';
import { MessagePage } from '../src/components/MessagePage';

export default function NewFilePage() {
  const firebaseUser = useAtomValue(firebaseUserAtom);
  const userSettings = useAtomValue(userSettingsAtomWithPersistence);
  const isUserSettingsLoading = useAtomValue(isUserSettingsLoadingAtom);
  const router = useRouter();

  // ?? verify how to make sure userSettings is loaded already

  useEffect(() => {
    if (!isUserSettingsLoading) {
      invariant(
        firebaseUser,
        'Expected firebase user to be initialized when user settings are done loading'
      );
      invariant(
        userSettings,
        'Expected user settings to be initialized when user settings are done loading'
      );
      (async () => {
        const resp = await fetch(`/api/createNewFile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workspaceName: 'Unnamed Workspace',
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
      })();
    }
  }, [isUserSettingsLoading]);

  return <MessagePage showHomeButton={false} message="Creating new file..." />;
}
