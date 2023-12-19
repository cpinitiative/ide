import { Menu, Transition } from '@headlessui/react';
import {
  ChevronDownIcon,
  CogIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/20/solid';
import React, { Fragment, useState, useEffect } from 'react';
import classNames from 'classnames';
import ReactDOM from 'react-dom';
import { usePopper } from 'react-popper';

import {
  mainCodemirrorEditorAtom,
  mainEditorValueAtom,
  mainMonacoEditorAtom,
} from '../../atoms/workspace';
import { useAtomValue } from 'jotai';
import { useEditorContext } from '../../context/EditorContext';
import defaultCode from '../../scripts/defaultCode';
import download from '../../scripts/download';
import { extractJavaFilename } from '../../scripts/judge';
import useUserPermission from '../../hooks/useUserPermission';

export const FileMenu = (props: { onOpenSettings: Function }): JSX.Element => {
  const { fileData } = useEditorContext();
  const getMainEditorValue = useAtomValue(mainEditorValueAtom);
  const mainMonacoEditor = useAtomValue(mainMonacoEditorAtom);
  const mainCodemirrorEditor = useAtomValue(mainCodemirrorEditorAtom);
  const permission = useUserPermission();

  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(
    null
  );
  const [popperElement, setPopperElement] = useState<HTMLElement | null>(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: 'bottom-start',
  });
  const canWrite = permission === 'OWNER' || permission === 'READ_WRITE';

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  /* ======= BEGIN DROPDOWN ACTIONS ======= */
  const handleDownloadFile = () => {
    if (!getMainEditorValue) {
      alert("Editor hasn't loaded yet. Please wait.");
      return;
    }

    const code = getMainEditorValue();

    const fileNames = {
      cpp: `${fileData.settings.workspaceName}.cpp`,
      java: extractJavaFilename(code),
      py: `${fileData.settings.workspaceName}.py`,
    };

    download(fileNames[fileData.settings.language], code);
  };

  const handleInsertFileTemplate = () => {
    if (!mainMonacoEditor && !mainCodemirrorEditor) {
      alert("Editor hasn't loaded yet, please wait");
      return;
    }
    if (confirm('Reset current file? Any changes you made will be lost.')) {
      if (mainMonacoEditor)
        mainMonacoEditor.setValue(defaultCode[fileData.settings.language]);
      else if (mainCodemirrorEditor) {
        mainCodemirrorEditor.dispatch({
          changes: {
            from: 0,
            to: mainCodemirrorEditor.state.doc.length,
            insert: defaultCode[fileData.settings.language],
          },
        });
      } else {
        console.error(
          "?? shouldn't happen, both monaco and codemirror editors are not defined"
        );
      }
    }
  };

  const forkButtonURL = `/${fileData.id.substring(1)}/copy`;
  /* ======= END DROPDOWN ACTIONS ======= */

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
            {mounted
              ? ReactDOM.createPortal(
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
                                  href="/new"
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
                                  onClick={handleDownloadFile}
                                >
                                  <ArrowDownTrayIcon
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
                                  href={forkButtonURL}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={classNames(
                                    active
                                      ? 'bg-gray-700 text-gray-100'
                                      : 'text-gray-200',
                                    'group flex items-center px-4 py-2 text-sm w-full focus:outline-none'
                                  )}
                                >
                                  <DocumentDuplicateIcon
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
                                    onClick={handleInsertFileTemplate}
                                  >
                                    <ArrowPathIcon
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
                )
              : null}
          </Transition>
        </>
      )}
    </Menu>
  );
};
