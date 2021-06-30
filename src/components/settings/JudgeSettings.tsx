// import { useAtom } from 'jotai';
import React from 'react';
import { WorkspaceSettings } from '../SettingsContext';

// import { allProblemDataAtom } from '../../atoms/workspaceUI';
// import { useAtom } from 'jotai';
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
  const { problem } = workspaceSettings;
  return (
    <div>
      <div className="space-y-6">
        <div>
          <label
            htmlFor={`problem-select`}
            className="block font-medium text-gray-700"
          >
            USACO Problem Selection
          </label>
          {problem ? (
            <p className="text-sm text-gray-500 mt-1 mb-2">
              Currently Selected:{' '}
              <span className="text-green-500">
                {problem.source +
                  ': ' +
                  problem.title +
                  ' ' +
                  '(' +
                  problem.id +
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
              onWorkspaceSettingsChange({
                problem: {
                  id: hit.id,
                  submittable: hit.submittable,
                  url: hit.url,
                  source: hit.source,
                  title: hit.title,
                  input: hit.input,
                  output: hit.output,
                  samples: hit.samples,
                },
              });
            }}
            canChange={canChange}
          />
          <p className="mt-2 text-sm text-gray-500">
            This will allow you to submit to USACO servers directly from the
            IDE.
          </p>
        </div>
      </div>
    </div>
  );
}
