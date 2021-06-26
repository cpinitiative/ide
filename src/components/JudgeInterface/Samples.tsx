import React from 'react';
import { PlayIcon } from '@heroicons/react/solid';

export interface Sample {
  input: string;
  output: string;
}

export function getSampleIndex(inputTab: string): number {
  return inputTab.length === 6 ? 1 : +inputTab.substring(7);
}

export default function Samples({
  samples,
  inputTab,
  handleRunCode,
}: {
  samples: Sample[];
  inputTab: string;
  handleRunCode: () => void;
}): JSX.Element {
  const index = getSampleIndex(inputTab);
  const sample = samples[index - 1];

  return (
    <div className="text-sm">
      <button
        type="button"
        className="relative flex-shrink-0 inline-flex items-center px-4 py-2 w-40 shadow-sm text-sm font-medium text-white bg-indigo-900 hover:bg-indigo-800 focus:bg-indigo-800 focus:outline-none"
        onClick={handleRunCode}
      >
        <PlayIcon className="mr-2 h-5 w-5" aria-hidden="true" />
        <span className="text-center flex-1">Run {inputTab}</span>
      </button>
      <p className="font-bold mt-4">INPUT:</p>
      <pre className="-mx-4 sm:-mx-6 md:mx-0 md:rounded p-4 mt-4 mb-4 whitespace-pre-wrap break-all bg-gray-700">
        {sample.input}
      </pre>
      <p className="font-bold">OUTPUT:</p>
      <pre className="-mx-4 sm:-mx-6 md:mx-0 md:rounded p-4 mt-4 mb-4 whitespace-pre-wrap break-all bg-gray-700">
        {sample.output}
      </pre>
    </div>
  );
}
