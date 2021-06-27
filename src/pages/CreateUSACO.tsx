import React, { useEffect, useState } from 'react';
import { navigate, RouteComponentProps } from '@reach/router';
import { usacoProblemIDfromURL } from '../components/JudgeInterface/JudgeInterface';
import { ProblemData } from '../components/Workspace/Workspace';

export interface CreateUSACOProps extends RouteComponentProps {
  usacoId?: string;
}

import firebase from 'firebase/app';
import { useUpdateAtom } from 'jotai/utils';
import { useAtom } from 'jotai';

import { fileIdAtom } from '../atoms/firebaseAtoms';
import { firebaseUserAtom } from '../atoms/firebaseUserAtoms';
import { judgePrefix } from '../components/JudgeInterface/JudgeInterface';

export default function CreateUSACO(props: CreateUSACOProps): JSX.Element {
  const setFileId = useUpdateAtom(fileIdAtom);
  const [firebaseUser] = useAtom(firebaseUserAtom);

  const [json, setJson] = useState<null | Record<string, ProblemData>>(null);
  useEffect(() => {
    async function load() {
      const response = await fetch(`${judgePrefix}/problems`);
      const json = await response.json();
      setJson(json);
    }
    load();
  }, []);

  const checkProps = async () => {
    if (json === null) return;
    if (setFileId === null || !firebaseUser) {
      return;
    }
    const usacoId = props.usacoId ?? '';
    const problemId = usacoProblemIDfromURL(usacoId);
    if (problemId === null || !(problemId in json)) {
      alert('Could not identify problem ID.');
      navigate('/', { replace: true });
      return;
    }
    const idToUrlRef = firebase
      .database()
      .ref('users')
      .child(firebaseUser.uid)
      .child('id-to-url')
      .child(problemId);
    const snapshot = await idToUrlRef.get();
    let newId = null;
    if (snapshot.exists()) {
      // console.log('USACO FILE EXISTS');
      newId = snapshot.val();
      navigate('/' + newId + window.location.search, {
        replace: true,
      });
    } else {
      // console.log('CREATING USACO FILE');
      const fileRef = firebase.database().ref().push();
      newId = fileRef.key!.slice(1);
      await idToUrlRef.set(newId);
      await fileRef.child('settings').update({
        judgeUrl: usacoId,
        workspaceName: json[problemId].source + ': ' + json[problemId].title,
      });
      setFileId({
        newId,
        isNewFile: true,
      });
    }
  };
  useEffect(() => {
    checkProps();
  }, [setFileId, firebaseUser, json]);
  return <></>;
}
