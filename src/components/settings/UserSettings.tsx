import { RadioGroup } from '@headlessui/react';
import classNames from 'classnames';
import React from 'react';
import { EditorMode } from '../../atoms/userSettings';
import { EDITOR_MODES } from '../SettingsContext';

export default function UserSettings({
  name,
  onNameChange,
  editorMode,
  onEditorModeChange,
}: {
  name: string;
  onNameChange: (name: string) => void;
  editorMode: EditorMode;
  onEditorModeChange: (mode: EditorMode) => void;
}): JSX.Element {
  return (
    <div className="space-y-6">
      <div>
        <label htmlFor={`name`} className="block font-medium text-gray-700">
          User Name
        </label>
        <div className="mt-1">
          <input
            type="text"
            name={`name`}
            id={`name`}
            className="mt-0 block w-full px-0 pt-0 pb-1 border-0 border-b-2 border-gray-200 focus:ring-0 focus:border-black text-sm"
            value={name}
            onChange={e => {
              onNameChange(e.target.value);
            }}
          />
        </div>
      </div>

      <div>
        <RadioGroup value={editorMode} onChange={onEditorModeChange}>
          <RadioGroup.Label className="font-medium text-gray-800 mb-4">
            Editor Mode
          </RadioGroup.Label>
          <div className="bg-white rounded-md space-x-4">
            {EDITOR_MODES.map(setting => (
              <RadioGroup.Option
                key={setting}
                value={setting}
                className="relative inline-flex items-center cursor-pointer focus:outline-none"
              >
                {({ active, checked }) => (
                  <>
                    <span
                      className={classNames(
                        checked
                          ? 'bg-indigo-600 border-transparent'
                          : 'bg-white border-gray-300',
                        active ? 'ring-2 ring-offset-2 ring-indigo-500' : '',
                        'h-4 w-4 mt-0.5 cursor-pointer rounded-full border flex items-center justify-center'
                      )}
                      aria-hidden="true"
                    >
                      <span className="rounded-full bg-white w-1.5 h-1.5" />
                    </span>
                    <div className="ml-2 flex flex-col">
                      <RadioGroup.Label
                        as="span"
                        className={classNames(
                          checked ? 'text-gray-800' : 'text-gray-600',
                          'block text-sm font-medium'
                        )}
                      >
                        {setting}
                      </RadioGroup.Label>
                    </div>
                  </>
                )}
              </RadioGroup.Option>
            ))}
          </div>
        </RadioGroup>
      </div>
    </div>
  );
}
