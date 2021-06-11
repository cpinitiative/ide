import { DuplicateIcon } from '@heroicons/react/solid';
import React from 'react';
import { useAtomValue } from 'jotai/utils';
import { fileIdAtom } from '../atoms/firebaseAtoms';

export const ForkButton = (): JSX.Element => {
  const fileId = useAtomValue(fileIdAtom);

  return (
    <a
      className="relative inline-flex items-center px-4 py-2 shadow-sm text-sm font-medium text-gray-400 hover:text-gray-200 focus:outline-none"
      href={`/${fileId?.id?.substring(1)}/copy`}
      target="_blank"
      rel="noreferrer"
    >
      <DuplicateIcon
        className="-ml-1 mr-2 h-5 w-5 text-gray-400"
        aria-hidden="true"
      />
      Clone File
    </a>
  );
};
