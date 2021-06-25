import React, { useEffect } from 'react';
import { navigate, RouteComponentProps } from '@reach/router';
import { usacoProblemIDfromURL } from '../components/JudgeInterface/JudgeInterface';
import { fetchProblemData } from '../components/Workspace/Workspace';

export interface CreateUSACOProps extends RouteComponentProps {
  usacoId?: string;
}

import firebase from 'firebase/app';
import { useUpdateAtom } from 'jotai/utils';
import { useAtom } from 'jotai';

import { fileIdAtom, firebaseUserAtom } from '../atoms/firebaseAtoms';

export default function CreateUSACO(props: CreateUSACOProps): JSX.Element {
  const setFileId = useUpdateAtom(fileIdAtom);
  const [firebaseUser] = useAtom(firebaseUserAtom);
  const checkProps = async () => {
    console.log('CHECK PROPS');
    console.log(setFileId === null);
    console.log(firebaseUser === null);
    if (setFileId === null || !firebaseUser) {
      console.log('RETURNING');
      return;
    }
    console.log('CONTINUING');
    const usacoId = props.usacoId ?? '';
    const problemID = usacoProblemIDfromURL(usacoId);
    if (problemID === null) {
      alert('Could not identify problem ID.');
      navigate('/', { replace: true });
      return;
    }
    const data = await fetchProblemData(problemID);
    if (data === null) {
      alert('Problem ID does not exist.');
      navigate('/', { replace: true });
      return;
    }
    const idToUrlRef = firebase
      .database()
      .ref('users')
      .child(firebaseUser.uid)
      .child('id-to-url')
      .child(problemID);
    const snapshot = await idToUrlRef.get();
    let newId = null;
    let isNewFile = false;
    if (snapshot.exists()) {
      console.log('EXISTS');
      newId = snapshot.val();
    } else {
      console.log('NO EXISTS');
      isNewFile = true;
      const fileRef = firebase.database().ref().push();
      newId = fileRef.key!.slice(1);
      await idToUrlRef.set(newId);
      await fileRef.child('settings').update({
        judgeUrl: usacoId,
      });
      if (data?.title) {
        await fileRef.child('settings').update({
          workspaceName: data.title,
        });
      }
    }
    console.log('PROGRESSING');

    setFileId({
      newId,
      isNewFile,
    });
  };
  useEffect(() => {
    checkProps();
  }, [setFileId, firebaseUser]);
  return <></>;
}
