import React, { useEffect, useState } from 'react';
import { ProblemData } from '../../src/components/Workspace/Workspace';

import firebase from 'firebase/app';
import { useUpdateAtom } from 'jotai/utils';
import { useAtom } from 'jotai';

import { fileIdAtom } from '../../src/atoms/firebaseAtoms';
import { firebaseUserAtom } from '../../src/atoms/firebaseUserAtoms';
import { WorkspaceSettings } from '../../src/components/SettingsContext';
import { fetchProblemData } from '../../src/components/Workspace/Workspace';
import { useRouter } from 'next/router';
import invariant from 'tiny-invariant';

export default function CreateUSACO(): JSX.Element {
  const router = useRouter();

  const usacoId = router.query.id;
  invariant(typeof usacoId === 'string', 'Expected USACO ID to be a string');

  const setFileId = useUpdateAtom(fileIdAtom);
  const [firebaseUser] = useAtom(firebaseUserAtom);
  const [problem, setProblem] = useState<ProblemData | undefined | null>(
    undefined
  );

  useEffect(() => {
    const lookupProblem = async () => {
      setProblem(await fetchProblemData(usacoId));
    };
    lookupProblem();
  }, [usacoId]);

  useEffect(() => {
    const checkProps = async () => {
      if (problem === undefined) return;
      if (setFileId === null || !firebaseUser) {
        return;
      }
      if (problem === null) {
        alert('Could not identify problem ID.');
        router.replace('/');
        return;
      }
      const idToUrlRef = firebase
        .database()
        .ref('users')
        .child(firebaseUser.uid)
        .child('usaco-id-to-url')
        .child(String(problem.id));
      const snapshot = await idToUrlRef.get();
      let newId = null;
      if (snapshot.exists()) {
        newId = snapshot.val();
        router.replace('/' + newId + window.location.search);
      } else {
        const fileRef = firebase.database().ref().push();
        newId = fileRef.key!.slice(1);
        await idToUrlRef.set(newId);
        const toUpdate: Partial<WorkspaceSettings> = {
          problem,
          workspaceName: problem.source + ': ' + problem.title,
        };
        await fileRef.child('settings').update(toUpdate);
        setFileId({
          newId,
          // isNewFile: true,
          // navigate: router.replace,
        });
      }
    };
    checkProps();
  }, [setFileId, firebaseUser, problem]);
  return <></>;
}
