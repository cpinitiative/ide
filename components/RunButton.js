import React from 'react';
import { PlayIcon } from '@heroicons/react/solid';

export const RunButton = ({ onClick, isRunning }) => (
  <button
    type="button"
    className="relative inline-flex items-center px-4 py-2 w-32 shadow-sm text-sm font-medium text-white bg-indigo-900 hover:bg-indigo-800 focus:bg-indigo-800 focus:outline-none"
    onClick={onClick}
  >
    {isRunning ? (
      <svg
        fill="none"
        viewBox="0 0 24 24"
        className="mx-auto h-5 w-5 p-0.5 inline-block animate-spin text-indigo-100"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    ) : (
      <>
        <PlayIcon className="mr-2 h-5 w-5" aria-hidden="true" />
        <span className="text-center flex-1">Run Code</span>
      </>
    )}
  </button>
);
