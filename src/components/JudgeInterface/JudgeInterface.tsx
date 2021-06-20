import { useAtomValue } from 'jotai/utils';
import React, { useState } from 'react';
import { currentLangAtom, mainMonacoEditorAtom } from '../../atoms/workspace';
import { useSettings } from '../SettingsContext';
import USACOResults from './USACOResults';
// import fetch from 'isomorphic-fetch';
// import { JSDOM } from 'jsdom';

function encode(str: string | null) {
  return btoa(unescape(encodeURIComponent(str || '')));
}

// e.g. http://www.usaco.org/index.php?page=viewproblem2&cpid=1140 -> 1140
// e.g. 1140 -> 1140 (if already ID then remains unchanged)
export function usacoProblemIDfromURL(url: string | undefined) {
  if (!url?.match(/^[1-9]\d*$/)) {
    url = url?.match(/cpid=([1-9]\d*)$/)?.[1];
  }
  if (url && url.length <= 4 && +url >= 187) return url; // must be number with length <= 4
  // earliest submittable problem: http://www.usaco.org/index.php?page=viewproblem2&cpid=187
  return undefined;
}

export default function JudgeInterface(): JSX.Element {
  const { settings } = useSettings();
  const mainMonacoEditor = useAtomValue(mainMonacoEditorAtom);
  const lang = useAtomValue(currentLangAtom);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [statusData, setStatusData] = useState<any>(null);

  const handleSubmit = async () => {
    const problemID: string | undefined = usacoProblemIDfromURL(
      settings.judgeUrl
    );

    // https://medium.com/@bretcameron/how-to-build-a-web-scraper-using-javascript-11d7cd9f77f2
    // oops how do you actually load these

    // const fetch = require("isomorphic-fetch");
    // const jsdom = require("jsdom");
    // const { JSDOM } = jsdom;

    // (async () => {
    //   const problemID = "1140";
    //   // const problemID = "996";
    //   const response = await fetch(
    //     `http://www.usaco.org/index.php?page=viewproblem2&cpid=${problemID}`
    //   );
    //   const text = await response.text();
    //   const dom = await new JSDOM(text);

    //   // Step 1
    //   // get source and title, e.g.
    //   // USACO 2021 US Open, Platinum
    //   // Problem 1. United Cows of Farmer John

    //   for (const part of dom.window.document.querySelectorAll("h2")) {
    //     const content = part.textContent;
    //     console.log(content.trim());
    //   }

    //   // Step 2
    //   // get input / output format
    //   // e.g. stdin / stdout
    //   // e.g. cave.in / cave.out
    //   for (const part of dom.window.document.querySelectorAll("h4")) {
    //     let content = part.textContent;
    //     if (content.includes("FORMAT")) {
    //       content = content.substring(content.indexOf("FORMAT ") + 7).slice(1, -2);
    //       content = content.substring(content.lastIndexOf(" ") + 1);
    //       console.log(content.trim());
    //     }
    //   }
    // })();

    // problemID should already have been parsed but why not do it again?
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

    const judgePrefix = 'http://localhost:5000';
    // const judgePrefix = 'https://judge.usaco.guide';

    const resp = await fetch(`${judgePrefix}/submit`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    const submissionID = await resp.text();

    const checkStatus = async () => {
      const statusResp = await fetch(
        `${judgePrefix}/submission/${submissionID}`
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
          USACO Problem ID:{' '}
          <a
            href={`http://www.usaco.org/index.php?page=viewproblem2&cpid=${settings.judgeUrl}`}
            className="text-indigo-300"
            target="_blank"
            rel="noreferrer"
          >
            {usacoProblemIDfromURL(settings.judgeUrl)}
          </a>
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
