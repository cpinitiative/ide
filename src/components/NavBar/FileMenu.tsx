import { Menu, Transition } from '@headlessui/react';
import {
  ChevronDownIcon,
  CogIcon,
  DownloadIcon,
  PlusIcon,
  TemplateIcon,
  DuplicateIcon,
} from '@heroicons/react/solid';
import React, { Fragment, useState } from 'react';
import classNames from 'classnames';
import ReactDOM from 'react-dom';
import { usePopper } from 'react-popper';

import { actualUserPermissionAtom } from '../../atoms/workspace';
import { useAtom } from 'jotai';

export interface FileMenuProps {
  onDownloadFile: () => void;
  onInsertFileTemplate: () => void;
  onOpenSettings: () => void;
  forkButtonUrl: string;
}

export const FileMenu = (props: FileMenuProps): JSX.Element => {
  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(
    null
  );
  const [popperElement, setPopperElement] = useState<HTMLElement | null>(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: 'bottom-start',
  });
  const [permission] = useAtom(actualUserPermissionAtom);
  const canWrite = permission === 'OWNER' || permission === 'READ_WRITE';

  return (
    <Menu as="div" className="relative inline-block text-left">
      {({ open }) => (
        <>
          <div>
            <Menu.Button
              className="relative inline-flex items-center px-4 py-2 shadow-sm text-sm font-medium text-gray-200 hover:bg-gray-800 focus:bg-gray-800 focus:outline-none"
              ref={setReferenceElement}
            >
              File
              <ChevronDownIcon
                className="-mr-1 ml-2 h-5 w-5"
                aria-hidden="true"
              />
            </Menu.Button>
          </div>

          <Transition show={open}>
            {ReactDOM.createPortal(
              <Menu.Items static as="div">
                <div
                  ref={setPopperElement}
                  style={styles.popper}
                  {...attributes.popper}
                  className="relative"
                >
                  <Transition.Child
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <div className="origin-top-left absolute z-10 left-0 w-56 shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="py-1">
                        <Menu.Item>
                          {({ active }) => (
                            <a
                              href="/"
                              target="_blank"
                              className={classNames(
                                active
                                  ? 'bg-gray-700 text-gray-100'
                                  : 'text-gray-200',
                                'group flex items-center px-4 py-2 text-sm'
                              )}
                            >
                              <PlusIcon
                                className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-300"
                                aria-hidden="true"
                              />
                              New File
                            </a>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              type="button"
                              className={classNames(
                                active
                                  ? 'bg-gray-700 text-gray-100'
                                  : 'text-gray-200',
                                'group flex items-center px-4 py-2 text-sm w-full focus:outline-none'
                              )}
                              onClick={() => props.onDownloadFile()}
                            >
                              <DownloadIcon
                                className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-300"
                                aria-hidden="true"
                              />
                              Download File
                            </button>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <a
                              href={props.forkButtonUrl}
                              target="_blank"
                              rel="noreferrer"
                              className={classNames(
                                active
                                  ? 'bg-gray-700 text-gray-100'
                                  : 'text-gray-200',
                                'group flex items-center px-4 py-2 text-sm w-full focus:outline-none'
                              )}
                            >
                              <DuplicateIcon
                                className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-300"
                                aria-hidden="true"
                              />
                              Clone File
                            </a>
                          )}
                        </Menu.Item>
                        {canWrite && (
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                type="button"
                                className={classNames(
                                  active
                                    ? 'bg-gray-700 text-gray-100'
                                    : 'text-gray-200',
                                  'group flex items-center px-4 py-2 text-sm w-full focus:outline-none'
                                )}
                                onClick={() => props.onInsertFileTemplate()}
                              >
                                <TemplateIcon
                                  className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-300"
                                  aria-hidden="true"
                                />
                                Reset File to Template
                              </button>
                            )}
                          </Menu.Item>
                        )}
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              type="button"
                              className={classNames(
                                active
                                  ? 'bg-gray-700 text-gray-100'
                                  : 'text-gray-200',
                                'group flex items-center px-4 py-2 text-sm w-full focus:outline-none'
                              )}
                              onClick={() => props.onOpenSettings()}
                            >
                              <CogIcon
                                className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-300"
                                aria-hidden="true"
                              />
                              Settings
                            </button>
                          )}
                        </Menu.Item>
                      </div>
                    </div>
                  </Transition.Child>
                </div>
              </Menu.Items>,
              document.body
            )}
          </Transition>
        </>
      )}
    </Menu>
  );
};
