import React from 'react';
import { PlayIcon } from '@heroicons/react/solid';
import LoadingIndicator from './LoadingIndicator';

export interface RunButtonProps {
  onClick:
    | ((event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void)
    | undefined;
  showLoading: boolean;
}

export const RunButton = ({
  onClick,
  showLoading,
}: RunButtonProps): JSX.Element => (
  <button
    type="button"
    className="relative flex-shrink-0 inline-flex items-center px-4 py-2 w-32 shadow-sm text-sm font-medium text-white bg-indigo-900 hover:bg-indigo-800 focus:bg-indigo-800 focus:outline-none"
    onClick={onClick}
  >
    {showLoading ? (
      <LoadingIndicator
        className="h-5 w-5 p-0.5 text-indigo-100"
        data-test-id="run-code-loading"
      />
    ) : (
      <>
        <PlayIcon className="mr-2 h-5 w-5" aria-hidden="true" />
        <span className="text-center flex-1">Run Code</span>
      </>
    )}
  </button>
);
