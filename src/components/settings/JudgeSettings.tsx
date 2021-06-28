// import { useAtom } from 'jotai';
import React from 'react';
import { usacoProblemIDfromURL } from '../JudgeInterface/JudgeInterface';
import { WorkspaceSettings } from '../SettingsContext';

import { allProblemDataAtom } from '../../atoms/workspaceUI';
import { useAtom } from 'jotai';
import ProblemSearchInterface from './ProblemSearchInterface';

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
  const [allProblemData] = useAtom(allProblemDataAtom);
  let problemId = usacoProblemIDfromURL(workspaceSettings.judgeUrl);
  if (problemId !== null && !(problemId in allProblemData)) problemId = null;
  return (
    <div>
      <div className="space-y-6">
        <div>
          <label
            htmlFor={`judgeurl`}
            className="block font-medium text-gray-700"
          >
            USACO Problem Selection
          </label>
          {problemId && problemId.length > 0 ? (
            <p className="text-sm text-gray-500 mt-1 mb-2">
              Currently Selected:{' '}
              <span className="text-green-500">
                {allProblemData[problemId].source +
                  ': ' +
                  allProblemData[problemId].title +
                  ' ' +
                  '(' +
                  problemId +
                  ')'}
              </span>
            </p>
          ) : (
            <p className="text-sm text-gray-500 mt-1 mb-2">
              Paste the problem URL or search for it.
            </p>
          )}
          <ProblemSearchInterface
            onSelect={hit => {
              // console.log('SELECTED ' + hit.id);
              onWorkspaceSettingsChange({
                judgeUrl: String(hit.id),
              });
            }}
            canChange={canChange}
          />
          {/* <div className="mt-1">
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
                  {allProblemData[problemId].source +
                    ': ' +
                    allProblemData[problemId].title}
                </p>
              ))}
          </div> */}
          <p className="mt-2 text-sm text-gray-500">
            This will allow you to submit to USACO servers directly from the
            IDE.
          </p>
        </div>
      </div>
    </div>
  );
}
