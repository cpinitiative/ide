import { DuplicateIcon } from '@heroicons/react/solid';
import React, { useState } from 'react';

export const ShareInfo = ({
  displayUrl,
}: {
  displayUrl: string;
}): JSX.Element => {
  const [showCopied, setShowCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href).then(
      () => {
        setShowCopied(true);
        setTimeout(() => {
          setShowCopied(false);
        }, 3000);
      },
      () => {
        alert("Couldn't copy to clipboard");
      }
    );
  };

  return (
    <div
      className="px-4 py-1 text-sm group text-gray-300 focus:outline-none max-w-max cursor-pointer flex items-center"
      onClick={() => handleCopy()}
    >
      <span className="font-medium mr-4 group-hover:text-gray-100">
        {showCopied ? 'Copied!' : 'Share'}
      </span>
      <span className="font-mono pl-3 pr-10 py-2 bg-gray-900 group-hover:text-gray-100 rounded inline-flex items-center flex-1 min-w-0 relative">
        <span className="truncate">{displayUrl}</span>
        <DuplicateIcon className="h-5 w-5 mr-3 mt-2 text-gray-400 group-hover:text-gray-200 absolute right-0 top-0 bottom-0 " />
      </span>
    </div>
  );
};
