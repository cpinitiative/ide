import React, {
  Fragment,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { RadioGroup } from '@headlessui/react';
import classNames from 'classnames';
import { XIcon } from '@heroicons/react/outline';
import {
  EDITOR_MODES,
  LANGUAGES,
  WorkspaceSettings,
  useSettings,
} from './SettingsContext';
import { SharingPermissions } from './SharingPermissions';
import { useAtom } from 'jotai';
import { actualUserPermissionAtom } from '../atoms/workspace';
import {
  authenticatedUserRefAtom,
  firebaseUserAtom,
} from '../atoms/firebaseAtoms';
import {
  EditorMode,
  editorModeAtomWithPersistence,
  userNameAtom,
} from '../atoms/userSettings';
import { useAtomValue, useUpdateAtom } from 'jotai/utils';

export interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal = ({
  isOpen,
  onClose,
}: SettingsDialogProps): JSX.Element => {
  const {
    settings: realWorkspaceSettings,
    setSettings: setRealWorkspaceSettings,
  } = useSettings();
  const userRef = useAtomValue(authenticatedUserRefAtom);
  const dirtyRef = useRef<boolean>(false);
  const [workspaceSettings, setWorkspaceSettings] = useReducer(
    (prev: WorkspaceSettings, next: Partial<WorkspaceSettings>) => {
      return {
        ...prev,
        ...next,
      };
    },
    realWorkspaceSettings
  );
  const [userPermission] = useAtom(actualUserPermissionAtom);
  const [firebaseUser] = useAtom(firebaseUserAtom);
  const setUserNameAtom = useUpdateAtom(userNameAtom);
  const [name, setName] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<EditorMode>('Normal');
  const editorModeAtom = useAtom(editorModeAtomWithPersistence);

  useEffect(() => {
    if (isOpen) {
      setWorkspaceSettings(realWorkspaceSettings);
      setName(firebaseUser?.displayName || null);
      setEditorMode(editorModeAtom[0]);
      dirtyRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const closeWithoutSaving = () => {
    if (dirtyRef.current) {
      if (
        confirm('Are you sure you want to exit without saving your changes?')
      ) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const saveAndClose = () => {
    setRealWorkspaceSettings(workspaceSettings);
    editorModeAtom[1](editorMode);
    if (name !== firebaseUser?.displayName) {
      firebaseUser?.updateProfile({
        displayName: name,
      });
      userRef?.child('name').set(name);
      setUserNameAtom(name);
    }
    onClose();
  };

  const onChange = (data: Partial<WorkspaceSettings>): void => {
    dirtyRef.current = true;
    setWorkspaceSettings(data);
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        static
        className="fixed z-10 inset-0 overflow-y-auto"
        open={isOpen}
        onClose={() => onClose()}
      >
        <div className="flex items-end justify-center min-h-full pt-4 pb-20 text-center sm:block sm:p-0">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span
            className="hidden sm:inline-block sm:align-middle sm:h-screen"
            aria-hidden="true"
          >
            &#8203;
          </span>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div className="inline-block align-bottom bg-white md:rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl w-full">
              <div className="p-4 sm:px-6 border-b border-gray-200">
                <Dialog.Title
                  as="h3"
                  className="text-lg leading-6 font-medium text-gray-900"
                >
                  Settings
                </Dialog.Title>

                <p className="text-sm text-gray-600 mt-1">
                  Editor mode is not synced across users.
                </p>
              </div>

              <div className="p-4 sm:p-6 sm:pt-4 space-y-6">
                <div>
                  <label
                    htmlFor={`name`}
                    className="block font-medium text-gray-700"
                  >
                    User Name
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name={`name`}
                      id={`name`}
                      className="mt-0 block w-full px-0 pt-0 pb-1 border-0 border-b-2 border-gray-200 focus:ring-0 focus:border-black text-sm"
                      value={name || ''}
                      onChange={e => {
                        setName(e.target.value);
                        dirtyRef.current = true;
                      }}
                    />
                  </div>
                </div>

                <div>
                  <RadioGroup
                    value={editorMode}
                    onChange={mode => {
                      setEditorMode(mode);
                      dirtyRef.current = true;
                    }}
                  >
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
                                  active
                                    ? 'ring-2 ring-offset-2 ring-indigo-500'
                                    : '',
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

                {userPermission === 'OWNER' && (
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
                          onChange({
                            workspaceName: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                )}

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
                          onChange({
                            compilerOptions: {
                              ...workspaceSettings.compilerOptions,
                              [value]: e.target.value,
                            },
                          })
                        }
                        disabled={
                          !(
                            userPermission === 'OWNER' ||
                            userPermission === 'READ_WRITE'
                          )
                        }
                      />
                    </div>
                  </div>
                ))}

                {userPermission === 'OWNER' && (
                  <SharingPermissions
                    value={workspaceSettings.defaultPermission}
                    onChange={val => onChange({ defaultPermission: val })}
                  />
                )}

                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => closeWithoutSaving()}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => saveAndClose()}
                  >
                    Save
                  </button>
                </div>
              </div>
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={() => closeWithoutSaving()}
                >
                  <span className="sr-only">Close</span>
                  <XIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
