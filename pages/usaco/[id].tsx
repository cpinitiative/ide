import React, { useEffect, useState } from 'react';
import { ProblemData } from '../../src/components/Workspace/Workspace';

import firebase from 'firebase/app';
import { useAtomValue, useUpdateAtom } from 'jotai/utils';
import { useAtom } from 'jotai';

import { fileIdAtom } from '../../src/atoms/firebaseAtoms';
import { firebaseUserAtom } from '../../src/atoms/firebaseUserAtoms';
import { WorkspaceSettings } from '../../src/components/SettingsContext';
import { fetchProblemData } from '../../src/components/Workspace/Workspace';
import { useRouter } from 'next/router';
import invariant from 'tiny-invariant';
import { MessagePage } from '../../src/components/MessagePage';
import {
  userSettingsAtomWithPersistence,
  isUserSettingsLoadingAtom,
} from '../../src/atoms/userSettings';

export default function CreateUSACO(): JSX.Element {
  const router = useRouter();

  const firebaseUser = useAtomValue(firebaseUserAtom);
  const userSettings = useAtomValue(userSettingsAtomWithPersistence);
  const isUserSettingsLoading = useAtomValue(isUserSettingsLoadingAtom);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady || !firebaseUser || isUserSettingsLoading) return;
    const usacoID = router.query.id;

    invariant(typeof usacoID === 'string', 'Expected USACO ID to be a string');

    (async () => {
      const resp = await fetch(`/api/createUSACOFile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usacoID: usacoID,
          userID: firebaseUser.uid,
          userName: firebaseUser.displayName,
          defaultPermission: userSettings.defaultPermission,
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
          router.replace(`/${data.fileID}`);
        }
      }
    })();
  }, [router.isReady, firebaseUser, isUserSettingsLoading]);

  if (error) {
    return <MessagePage message={'Error: ' + error} />;
  }

  return <MessagePage message="Loading File..." showHomeButton={false} />;
}
