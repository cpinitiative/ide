import React, { useEffect, useState } from 'react';
import { navigate, RouteComponentProps } from '@reach/router';
import { ProblemData } from '../components/Workspace/Workspace';

import firebase from 'firebase/app';
import { useUpdateAtom } from 'jotai/utils';
import { useAtom } from 'jotai';

import { fileIdAtom } from '../atoms/firebaseAtoms';
import { firebaseUserAtom } from '../atoms/firebaseUserAtoms';
import { WorkspaceSettings } from '../components/SettingsContext';
import { fetchProblemData } from '../components/Workspace/Workspace';

export interface CreateUSACOProps extends RouteComponentProps {
  _usacoId?: string;
}

export default function CreateUSACO({
  _usacoId,
}: CreateUSACOProps): JSX.Element {
  const usacoId = _usacoId ?? '';
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
        navigate('/', { replace: true });
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
        navigate('/' + newId + window.location.search, {
          replace: true,
        });
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
          isNewFile: true,
        });
      }
    };
    checkProps();
  }, [setFileId, firebaseUser, problem]);
  return <></>;
}
