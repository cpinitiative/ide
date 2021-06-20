import { useAtomValue } from 'jotai/utils';
import React, { useState } from 'react';
import { currentLangAtom, mainMonacoEditorAtom } from '../../atoms/workspace';
import { useSettings } from '../SettingsContext';
import USACOResults from './USACOResults';

function encode(str: string | null) {
  return btoa(unescape(encodeURIComponent(str || '')));
}

export default function JudgeInterface(): JSX.Element {
  const { settings } = useSettings();
  const mainMonacoEditor = useAtomValue(mainMonacoEditorAtom);
  const lang = useAtomValue(currentLangAtom);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [statusData, setStatusData] = useState<any>(null);

  const handleSubmit = async () => {
    const problemID = settings.judgeUrl?.match(/cpid=(\d+)/)?.[1];
    if (!mainMonacoEditor || !lang) {
      alert('Error: Page still loading?');
      return;
    }
    if (!problemID) {
      alert('Error: Failed to parse problem ID. Is the usaco.org URL correct?');
      return;
    }

    setStatusData({
      message: 'Sending submission to server',
      statusCode: -100,
    });

    const data = {
      problemID: problemID,
      language: { cpp: 'c++17', java: 'java', py: 'python3' }[lang],
      base64Code: encode(mainMonacoEditor.getValue()),
    };

    const resp = await fetch(`https://judge.usaco.guide/submit`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    const submissionID = await resp.text();

    const checkStatus = async () => {
      const statusResp = await fetch(
        `https://judge.usaco.guide/submission/${submissionID}`
      );
      const data = await statusResp.json();
      setStatusData(data);

      if (data.statusCode && parseInt(data.statusCode) <= -8) {
        // still working
        setTimeout(checkStatus, 1000);
      }
    };

    setTimeout(checkStatus, 1000);
  };

  return (
    <div className="relative h-full flex flex-col">
      <div className="p-4 pb-0">
        <p className="text-gray-100 font-bold text-lg">
          {settings.judgeUrl}
          {/* Problem 1. Social Distancing I */}
        </p>
        <p className="text-gray-400 text-sm">
          Early access. Report issues to Github. Do not spam submit.
          {/* USACO 2020 US Open Contest, Bronze */}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto px-4">
        <USACOResults data={statusData} />
      </div>
      <button
        className="block w-full py-2 text-sm uppercase font-bold text-indigo-300 hover:text-indigo-100 bg-indigo-900 bg-opacity-50 focus:outline-none disabled:cursor-not-allowed"
        disabled={statusData?.statusCode <= -8}
        onClick={() => handleSubmit()}
      >
        Submit
      </button>
    </div>
  );
}
