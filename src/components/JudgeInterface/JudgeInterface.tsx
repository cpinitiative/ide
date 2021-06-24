import { useAtomValue } from 'jotai/utils';
import React from 'react';
import { currentLangAtom, mainMonacoEditorAtom } from '../../atoms/workspace';
import USACOResults from './USACOResults';
import { ProblemData, StatusData } from '../Workspace/Workspace';
import SubmitButton from './SubmitButton';
import { PlayIcon } from '@heroicons/react/solid';

// export const judgePrefix = 'http://localhost:5000';
export const judgePrefix = 'https://judge.usaco.guide';

function encode(str: string | null) {
  return btoa(unescape(encodeURIComponent(str || '')));
}

// e.g. http://www.usaco.org/index.php?page=viewproblem2&cpid=1140 -> 1140
// e.g. 1140 -> 1140 (if already ID then remains unchanged)
export function usacoProblemIDfromURL(url: string | undefined): string | null {
  if (!url?.match(/^[1-9]\d*$/)) {
    url = url?.match(/cpid=([1-9]\d*)$/)?.[1];
  }
  if (url && url.length <= 4 && +url >= 187) return url; // must be number with length <= 4
  // earliest submittable problem: http://www.usaco.org/index.php?page=viewproblem2&cpid=187
  return null;
}

// https://github.com/cpinitiative/usaco-guide/blob/30f7eca4b8eee693694a801498aaf1bfd9cbb5d0/src/components/markdown/ProblemsList/ProblemsListItem.tsx#L92
function getUSACOContestURL(contest: string): string {
  const parts = contest.split(' ');
  parts.shift(); // remove "USACO"
  parts[0] = parts[0].substring(2);
  if (parts[1] === 'US') parts[1] = 'open';
  else parts[1] = parts[1].toLowerCase().substring(0, 3);
  return `http://www.usaco.org/index.php?page=${parts[1]}${parts[0]}results`;
}

export default function JudgeInterface(props: {
  problemID: string;
  problemData: ProblemData | null | undefined;
  statusData: StatusData | null;
  setStatusData: React.Dispatch<React.SetStateAction<StatusData | null>>;
  handleRunCode: () => void;
}): JSX.Element {
  const {
    problemID,
    problemData,
    statusData,
    setStatusData,
    handleRunCode,
  } = props;
  const mainMonacoEditor = useAtomValue(mainMonacoEditorAtom);
  const lang = useAtomValue(currentLangAtom);

  const handleSubmit = async () => {
    if (!mainMonacoEditor || !lang) {
      alert('Error: Page still loading?');
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

  // console.log('SAMPLES ' + problemData?.samples);
  return (
    <div className="relative h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 pb-0">
          <p className="text-gray-400 text-sm mb-4">
            Early access. Report issues to Github. Do not spam submit.
            {/* Note: You will not be able to submit to a problem in an active contest. */}
            {/* ^ is this necessary? */}
          </p>
          {problemData && problemData.parsed ? (
            <>
              <p className="text-gray-100 font-bold text-lg">
                <a
                  href={getUSACOContestURL(problemData.source || '')}
                  className="text-indigo-300"
                  target="_blank"
                  rel="noreferrer"
                >
                  {problemData?.source}
                </a>
              </p>
              <p className="text-gray-100 font-bold text-lg">
                <a
                  href={`http://www.usaco.org/index.php?page=viewproblem2&cpid=${problemID}`}
                  className="text-indigo-300"
                  target="_blank"
                  rel="noreferrer"
                >
                  {problemData?.title}
                </a>
              </p>
              <p className="text-gray-100 text-sm mb-4">
                <span className="font-bold">I/O:</span> {problemData?.input}/
                {problemData?.output}
              </p>
              {/* <p className="text-gray-100 text-sm">
                <span className="font-bold">INPUT:</span> {problemData?.input}
              </p>
              <p className="text-gray-100 text-sm">
                <span className="font-bold">OUTPUT:</span> {problemData?.output}
              </p> */}
              <button
                type="button"
                className="relative flex-shrink-0 inline-flex items-center px-4 py-2 w-40 shadow-sm text-sm font-medium text-white bg-indigo-900 hover:bg-indigo-800 focus:bg-indigo-800 focus:outline-none"
                onClick={handleRunCode}
              >
                <PlayIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                <span className="text-center flex-1">Run Samples</span>
              </button>
            </>
          ) : (
            <>
              <p className="text-gray-100 font-bold text-lg">
                USACO Problem ID:{' '}
                <a
                  href={`http://www.usaco.org/index.php?page=viewproblem2&cpid=${problemID}`}
                  className="text-indigo-300"
                  target="_blank"
                  rel="noreferrer"
                >
                  {problemID}
                </a>
              </p>
              <p className="text-red-300 text-sm font-bold">
                {problemData
                  ? 'Could not parse problem data.'
                  : 'Problem ID does not exist.'}
              </p>
            </>
          )}
        </div>
        <div className="px-4">
          <USACOResults data={statusData} />
        </div>
      </div>
      <SubmitButton
        isLoading={(statusData?.statusCode ?? 0) <= -8}
        onClick={() => handleSubmit()}
      />
    </div>
  );
}
