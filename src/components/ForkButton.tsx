import { DocumentDuplicateIcon } from '@heroicons/react/20/solid';
import React from 'react';
import { useEditorContext } from '../context/EditorContext';

export const ForkButton = (): JSX.Element => {
  const { fileData } = useEditorContext();

  return (
    <a
      className="relative inline-flex items-center px-4 py-2 shadow-sm text-sm font-medium text-gray-400 hover:text-gray-200 focus:outline-none"
      href={`/${fileData.id.substring(1)}/copy`}
      target="_blank"
      rel="noreferrer"
    >
      <DocumentDuplicateIcon
        className="-ml-1 mr-2 h-5 w-5 text-gray-400"
        aria-hidden="true"
      />
      Clone File
    </a>
  );
};
