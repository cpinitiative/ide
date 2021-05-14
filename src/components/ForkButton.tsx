import { DuplicateIcon } from '@heroicons/react/solid';
import React from 'react';
import { useAtomValue, useUpdateAtom } from 'jotai/utils';
import { fileIdAtom, firebaseRefAtom } from '../atoms/firebaseAtoms';
import firebase from 'firebase/app';

export const ForkButton = (): JSX.Element => {
  const firebaseRef = useAtomValue(firebaseRefAtom);
  const setFileId = useUpdateAtom(fileIdAtom);

  const handleCloneFile = async () => {
    if (!firebaseRef) return;

    try {
      const newRef = firebase.database().ref().push();
      const keysToCopy = [
        'editor-cpp',
        'editor-java',
        'editor-py',
        'settings',
        'input',
      ];
      const data = await Promise.all(
        keysToCopy.map(key => firebaseRef.child(key).once('value'))
      );
      const updateObject: { [key: string]: unknown } = {};
      keysToCopy.forEach((key, idx) => {
        // we don't want to copy over user information for firepad
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { users, ...toKeep } = data[idx].val() || {};
        updateObject[key] = toKeep;
      });
      await newRef.set(updateObject);
      setFileId({
        newId: newRef.key!.slice(1), // first character is dash which we want to ignore
        isNewFile: true,
      });
    } catch (e) {
      // alert("Failed to clone file: " + e.message);
      throw new Error(e.message);
    }
  };

  return (
    <button
      className="relative inline-flex items-center px-4 py-2 shadow-sm text-sm font-medium text-gray-400 hover:text-gray-200 focus:outline-none"
      onClick={handleCloneFile}
    >
      <DuplicateIcon
        className="-ml-1 mr-2 h-5 w-5 text-gray-400"
        aria-hidden="true"
      />
      Clone File
    </button>
  );
};
