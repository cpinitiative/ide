import { useAtomValue } from 'jotai/utils';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';
import invariant from 'tiny-invariant';
import { firebaseUserAtom } from '../../src/atoms/firebaseUserAtoms';
import {
  userSettingsAtomWithPersistence,
  isUserSettingsLoadingAtom,
  displayNameAtom,
} from '../../src/atoms/userSettings';
import { MessagePage } from '../../src/components/MessagePage';

export default function NewFilePage() {
  const firebaseUser = useAtomValue(firebaseUserAtom);
  const displayName = useAtomValue(displayNameAtom);
  const userSettings = useAtomValue(userSettingsAtomWithPersistence);
  const isUserSettingsLoading = useAtomValue(isUserSettingsLoadingAtom);
  const router = useRouter();

  useEffect(() => {
    if (!isUserSettingsLoading && router.isReady && displayName) {
      const classID = router.query.id;
      invariant(
        firebaseUser,
        'Expected firebase user to be initialized when user settings are done loading'
      );
      invariant(
        userSettings,
        'Expected user settings to be initialized when user settings are done loading'
      );
      (async () => {
        const resp = await fetch(`/api/joinClassroom`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            classroomID: classID,
            userID: firebaseUser.uid,
            userName: displayName,
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
  }, [router.isReady, isUserSettingsLoading, displayName]);

  return <MessagePage showHomeButton={false} message="Joining Classroom..." />;
}
