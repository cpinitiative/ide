import React from 'react';
import USACOResults from './USACOResults';

export default function JudgeInterface(): JSX.Element {
  return (
    <div className="p-4 pb-8 relative h-full">
      <div>
        <p className="text-gray-100 font-bold text-lg">
          Problem 1. Social Distancing I
        </p>
        <p className="text-gray-400 text-sm">
          USACO 2020 US Open Contest, Bronze
        </p>
      </div>
      <USACOResults />
      <button className="absolute inset-x-0 bottom-0 block w-full py-2 text-sm uppercase font-bold text-indigo-300 hover:text-indigo-100 bg-indigo-900 bg-opacity-50 focus:outline-none">
        Submit
      </button>
    </div>
  );
}
