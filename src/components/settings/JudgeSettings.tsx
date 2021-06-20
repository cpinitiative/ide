import React from 'react';
import { usacoProblemIDfromURL } from '../JudgeInterface/JudgeInterface';
import { WorkspaceSettings } from '../SettingsContext';

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
  return (
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
            Paste the entire URL or just the problem ID (e.g. 1140).
          </p>
          <div className="mt-1">
            <input
              type="text"
              name={`judgeurl`}
              id={`judgeurl`}
              className="mt-0 block w-full px-0 pt-0 pb-1 border-0 border-b-2 border-gray-200 focus:ring-0 focus:border-black text-sm"
              value={workspaceSettings.judgeUrl ?? ''}
              placeholder={
                'http://www.usaco.org/index.php?page=viewproblem2&cpid=1140'
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
              usacoProblemIDfromURL(workspaceSettings.judgeUrl) ===
                undefined && (
                <p className="mt-2 text-xs text-red-500">
                  Invalid problem ID or URL
                </p>
              )}
          </div>
          <p className="mt-2 text-sm text-gray-500">
            This will allow you to submit to USACO servers directly from the
            IDE. Make sure to use File I/O as necessary.
          </p>
        </div>
      </div>
    </div>
  );
}
