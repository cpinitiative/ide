import React from 'react';
import { FileSettings } from '../../context/EditorContext';
import { LANGUAGES } from '../../context/UserContext';
import { SharingPermissions } from '../SharingPermissions';
import { RadioGroupContents } from './RadioGroupContents';

export default function WorkspaceSettingsUI({
  workspaceSettings,
  onWorkspaceSettingsChange,
  userPermission,
}: {
  workspaceSettings: FileSettings;
  onWorkspaceSettingsChange: (settings: Partial<FileSettings>) => void;
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

      <RadioGroupContents
        title="Language"
        value={workspaceSettings.language}
        onChange={val =>
          onWorkspaceSettingsChange({
            language: val,
          })
        }
        disabled={
          !(userPermission === 'OWNER' || userPermission === 'READ_WRITE')
        }
        options={LANGUAGES}
      />

      <div>
        <label
          htmlFor={`compiler_options`}
          className="block font-medium text-gray-700"
        >
          {LANGUAGES.find(x => x.value === workspaceSettings.language)!.label}{' '}
          Compiler Options
        </label>
        <div className="mt-1">
          <input
            type="text"
            name={`compiler_options`}
            id={`compiler_options`}
            className="mt-0 block w-full px-0 pt-0 pb-1 border-0 border-b-2 border-gray-200 focus:ring-0 focus:border-black font-mono text-sm"
            value={
              workspaceSettings.compilerOptions[workspaceSettings.language]
            }
            placeholder="None"
            onChange={e =>
              (userPermission === 'OWNER' || userPermission === 'READ_WRITE') &&
              onWorkspaceSettingsChange({
                compilerOptions: {
                  ...workspaceSettings.compilerOptions,
                  [workspaceSettings.language]: e.target.value,
                },
              })
            }
            disabled={
              !(userPermission === 'OWNER' || userPermission === 'READ_WRITE')
            }
          />
        </div>
      </div>

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
