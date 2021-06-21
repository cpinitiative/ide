import React from 'react';
import { LANGUAGES, WorkspaceSettings } from '../SettingsContext';
import { SharingPermissions } from '../SharingPermissions';

export default function WorkspaceSettingsUI({
  workspaceSettings,
  onWorkspaceSettingsChange,
  userPermission,
}: {
  workspaceSettings: WorkspaceSettings;
  onWorkspaceSettingsChange: (settings: Partial<WorkspaceSettings>) => void;
  userPermission: string;
}): JSX.Element {
  return (
    <div className="space-y-6">
      {
        <div>
          <label
            htmlFor={`workspace_name`}
            className="block font-medium text-gray-700"
          >
            Workspace Name
          </label>
          <div className="mt-1">
            <input
              type="text"
              name={`workspace_name`}
              id={`workspace_name`}
              className="mt-0 block w-full px-0 pt-0 pb-1 border-0 border-b-2 border-gray-200 focus:ring-0 focus:border-black text-sm"
              value={workspaceSettings.workspaceName || ''}
              onChange={e =>
                (userPermission === 'OWNER' ||
                  userPermission === 'READ_WRITE') &&
                onWorkspaceSettingsChange({
                  workspaceName: e.target.value,
                })
              }
              disabled={
                !(userPermission === 'OWNER' || userPermission === 'READ_WRITE')
              }
            />
          </div>
        </div>
      }

      {LANGUAGES.map(({ label, value }) => (
        <div key={value}>
          <label
            htmlFor={`compiler_options_${value}`}
            className="block font-medium text-gray-700"
          >
            {label} Compiler Options
          </label>
          <div className="mt-1">
            <input
              type="text"
              name={`compiler_options_${value}`}
              id={`compiler_options_${value}`}
              className="mt-0 block w-full px-0 pt-0 pb-1 border-0 border-b-2 border-gray-200 focus:ring-0 focus:border-black font-mono text-sm"
              value={workspaceSettings.compilerOptions[value]}
              placeholder="None"
              onChange={e =>
                (userPermission === 'OWNER' ||
                  userPermission === 'READ_WRITE') &&
                onWorkspaceSettingsChange({
                  compilerOptions: {
                    ...workspaceSettings.compilerOptions,
                    [value]: e.target.value,
                  },
                })
              }
              disabled={
                !(userPermission === 'OWNER' || userPermission === 'READ_WRITE')
              }
            />
          </div>
        </div>
      ))}
      <SharingPermissions
        value={workspaceSettings.defaultPermission}
        onChange={val =>
          userPermission === 'OWNER' &&
          onWorkspaceSettingsChange({ defaultPermission: val })
        }
        isOwner={userPermission === 'OWNER'}
      />
    </div>
  );
}
