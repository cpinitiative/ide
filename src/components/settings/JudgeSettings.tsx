import React from 'react';
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
  return (
    <div>
      <div className="space-y-6">
        <div>
          <label
            htmlFor={`judgeurl`}
            className="block font-medium text-gray-700"
          >
            USACO Problem URL
          </label>
          <div className="mt-1">
            <input
              type="text"
              name={`judgeurl`}
              id={`judgeurl`}
              className="mt-0 block w-full px-0 pt-0 pb-1 border-0 border-b-2 border-gray-200 focus:ring-0 focus:border-black text-sm"
              value={workspaceSettings.judgeUrl ?? ''}
              onChange={e => {
                if (
                  userPermission === 'READ_WRITE' ||
                  userPermission === 'OWNER'
                ) {
                  onWorkspaceSettingsChange({
                    judgeUrl: e.target.value,
                  });
                }
              }}
            />
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
