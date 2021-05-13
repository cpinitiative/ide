import React from 'react';

export const PrivateFileMessage = (): JSX.Element => {
  return (
    <div className="p-8 sm:p-16 text-center">
      <div className="text-3xl sm:text-4xl text-white font-bold">
        This file is private.
      </div>
      <a
        href="/"
        className="mt-6 sm:mt-10 inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-[#1E1E1E]"
      >
        Create a new file
      </a>
    </div>
  );
};
