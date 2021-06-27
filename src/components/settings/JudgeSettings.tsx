// import { useAtom } from 'jotai';
import React, { useEffect, useState } from 'react';
import { usacoProblemIDfromURL } from '../JudgeInterface/JudgeInterface';
import { WorkspaceSettings } from '../SettingsContext';
import { ProblemData } from '../Workspace/Workspace';
// import { allProblemDataAtom } from '../../atoms/workspaceUI';

import { judgePrefix } from '../JudgeInterface/JudgeInterface';

export default function JudgeSettings({
  workspaceSettings,
  onWorkspaceSettingsChange,
  userPermission,
}: {
  workspaceSettings: WorkspaceSettings;
  onWorkspaceSettingsChange: (settings: Partial<WorkspaceSettings>) => void;
  userPermission: string;
}): JSX.Element {
  const canChange =
    userPermission === 'READ_WRITE' || userPermission === 'OWNER';
  const [json, setJson] = useState<null | Record<string, ProblemData>>(null);
  useEffect(() => {
    async function load() {
      const response = await fetch(`${judgePrefix}/problems`);
      const json = await response.json();
      setJson(json);
    }
    load();
  }, []);
  let problemId = usacoProblemIDfromURL(workspaceSettings.judgeUrl);
  if (problemId !== null && json && !(problemId in json)) problemId = null;
  return (
    // <Suspense fallback="Loading...">
    <div>
      <div className="space-y-6">
        <div>
          <label
            htmlFor={`judgeurl`}
            className="block font-medium text-gray-700"
          >
            USACO Problem ID
          </label>
          <p className="mt-2 text-sm text-gray-500">
            Paste the problem ID or the entire URL.
          </p>
          <div className="mt-1">
            <input
              type="text"
              name={`judgeurl`}
              id={`judgeurl`}
              className="mt-0 block w-full px-0 pt-0 pb-1 border-0 border-b-2 border-gray-200 focus:ring-0 focus:border-black text-sm placeholder-gray-400"
              value={workspaceSettings.judgeUrl ?? ''}
              placeholder={
                'e.g. 1140 or http://www.usaco.org/index.php?page=viewproblem2&cpid=1140'
              }
              onChange={e => {
                if (canChange) {
                  onWorkspaceSettingsChange({
                    judgeUrl: e.target.value,
                  });
                }
              }}
              disabled={!canChange}
            />
            {(workspaceSettings.judgeUrl ?? '').length > 0 &&
              (problemId === null ? (
                <p className="mt-2 text-xs text-red-500">
                  Could not identify problem ID.
                </p>
              ) : (
                <p className="mt-2 text-xs text-green-500">
                  {json &&
                    json[problemId].source + ': ' + json[problemId].title}
                </p>
              ))}
          </div>
          <p className="mt-2 text-sm text-gray-500">
            This will allow you to submit to USACO servers directly from the
            IDE. Make sure to use File I/O as necessary.
          </p>
        </div>
      </div>
    </div>
    // </Suspense>
  );
}
