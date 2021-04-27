import loader from '@monaco-editor/loader';
loader.config({
  paths: {
    vs: '/vs',
  },
});

import Head from 'next/head';
/// <reference path="../types/react-split-grid.d.ts" />
import Split from 'react-split-grid';
import React, {
  useRef,
  useState,
  useMemo,
  useEffect,
  useReducer,
  Fragment,
} from 'react';
import { RunButton } from '../components/RunButton';
import { TabBar } from '../components/TabBar';
import { useRouter } from 'next/router';
import { Output } from '../components/Output';
import {
  CogIcon,
  DownloadIcon,
  PlusIcon,
  ShareIcon,
  TemplateIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/solid';
import dynamic from 'next/dynamic';
import defaultCode from '../scripts/defaultCode';
import { useFirebaseRef, useUserRef } from '../hooks/useFirebaseRef';
import JudgeResult, { JudgeSuccessResult } from '../types/judge';
import { SettingsModal } from '../components/SettingsModal';
import type { Language } from '../components/SettingsContext';
import { useSettings } from '../components/SettingsContext';
import download from '../scripts/download';
import { Menu, Transition } from '@headlessui/react';
import classNames from 'classnames';
import { UserList } from '../components/UserList/UserList';
import { isUserOnline, useOnlineUsers } from '../hooks/useOnlineUsers';
import firebaseType from 'firebase';
import { SharingPermissions } from '../components/SharingPermissions';
import { useAtom } from 'jotai';
import {
  actualUserPermissionAtom,
  loadingAtom,
  userPermissionAtom,
} from '../atoms/workspace';
import { Chat } from '../components/Chat';

const FirepadEditor = dynamic(() => import('../components/FirepadEditor'), {
  ssr: false,
});

function encode(str: string | null) {
  return btoa(unescape(encodeURIComponent(str || '')));
}

function decode(bytes: string | null) {
  const escaped = escape(atob(bytes || ''));
  try {
    return decodeURIComponent(escaped);
  } catch (err) {
    return unescape(escaped);
  }
}

export default function Home(): JSX.Element {
  const router = useRouter();
  const editor = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const inputEditor = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const outputEditor = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [result, setResult] = useState<JudgeSuccessResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [lang, setLang] = useReducer((prev: Language, next: Language) => {
    window.history.replaceState(
      {},
      '',
      window.location.href.split('?')[0] + '?lang=' + next
    );
    return next;
  }, 'cpp');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const { settings } = useSettings();
  const [showSidebar, setShowSidebar] = useState(false);
  const [, setUserPermission] = useAtom(userPermissionAtom);
  const [permission] = useAtom(actualUserPermissionAtom);
  const [loading] = useAtom(loadingAtom);
  const readOnly = !(permission === 'OWNER' || permission === 'READ_WRITE');
  const onlineUsers = useOnlineUsers();
  const onlineUserCount = onlineUsers?.filter(isUserOnline).length;

  useEffect(() => {
    if (router.isReady) {
      if (
        router.query.lang === 'cpp' ||
        router.query.lang === 'java' ||
        router.query.lang === 'py'
      ) {
        setLang(router.query.lang);
      }
    }
    // we only want to run it once when router is ready
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  const userRef = useUserRef();
  useEffect(() => {
    if (userRef) {
      const handleChange = (snap: firebaseType.database.DataSnapshot) => {
        if (!snap.exists()) return;
        const permission = snap.val().permission;
        setUserPermission(permission);
      };
      userRef.on('value', handleChange);
      return () => userRef.off('value', handleChange);
    }
  }, [userRef, setUserPermission]);

  const handleRunCode = () => {
    if (!editor.current || !inputEditor.current) {
      // editor is still loading
      return;
    }

    setIsRunning(true);
    setResult(null);
    const data = {
      source_code: encode(editor.current.getValue()),
      language_id: { cpp: 54, java: 62, py: 71 }[lang],
      stdin: encode(inputEditor.current.getValue()),
      compiler_options: settings.compilerOptions[lang],
      command_line_arguments: '',
      redirect_stderr_to_stdout: false,
    };

    fetch(
      `https://judge0.usaco.guide/submissions?base64_encoded=true&wait=true`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    )
      .then(async resp => {
        const data: JudgeResult = await resp.json();

        if (data.error || !resp.ok) {
          alert(
            'Error: ' +
              (data.error || resp.status + ' - ' + JSON.stringify(data))
          );
        } else {
          data.stdout = decode(data.stdout);
          data.stderr = decode(data.stderr);
          data.compile_output = decode(data.compile_output);
          data.message = decode(data.message);
          setResult(data);
        }
      })
      .catch(e => {
        console.error(e);
      })
      .finally(() => setIsRunning(false));
  };

  const firebaseRef = useFirebaseRef();
  const firebaseRefs = useMemo(
    () => ({
      cpp: firebaseRef?.child(`editor-cpp`),
      java: firebaseRef?.child(`editor-java`),
      py: firebaseRef?.child(`editor-py`),
      input: firebaseRef?.child('input'),
    }),
    [firebaseRef]
  );

  const layoutEditors = () => {
    if (editor.current) editor.current.layout();
    if (inputEditor.current) inputEditor.current.layout();
    if (outputEditor.current) outputEditor.current.layout();
  };

  const handleDownloadFile = () => {
    if (!editor.current) {
      alert("Editor hasn't loaded yet. Please wait.");
      return;
    }

    const fileNames = {
      cpp: 'main.cpp',
      java: 'Main.java',
      py: 'main.py',
    };

    download(fileNames[lang], editor.current.getValue());
  };

  useEffect(() => {
    function handleResize() {
      layoutEditors();
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [showCopied, setShowCopied] = useState(false);
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(
      () => {
        setShowCopied(true);
        setTimeout(() => {
          setShowCopied(false);
        }, 3000);
      },
      () => {
        alert(
          "Couldn't copy link to clipboard. Share the current URL manually."
        );
      }
    );
  };

  const handleInsertFileTemplate = () => {
    if (!editor.current) {
      alert("Editor hasn't loaded yet, please wait");
      return;
    }
    if (confirm('Reset current file? Any changes you made will be lost.')) {
      editor.current.setValue(defaultCode[lang]);
    }
  };

  const handleToggleSidebar = () => {
    setShowSidebar(!showSidebar);
    setTimeout(() => {
      layoutEditors();
    }, 0);
  };

  return (
    <div className="h-full">
      <Head>
        <title>Real-Time Collaborative Online IDE</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="h-full flex flex-col">
        <div className="flex-shrink-0 bg-[#1E1E1E] flex items-center">
          <div className="flex items-center divide-x divide-gray-700">
            <Menu as="div" className="relative inline-block text-left">
              {({ open }) => (
                <>
                  <div>
                    <Menu.Button className="relative inline-flex items-center px-4 py-2 shadow-sm text-sm font-medium text-gray-200 hover:bg-gray-800 focus:bg-gray-800 focus:outline-none">
                      File
                      <ChevronDownIcon
                        className="-mr-1 ml-2 h-5 w-5"
                        aria-hidden="true"
                      />
                    </Menu.Button>
                  </div>

                  <Transition
                    show={open}
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items
                      static
                      className="origin-top-left absolute z-10 left-0 w-56 shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none"
                    >
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
                              onClick={() => handleDownloadFile()}
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
                            <button
                              type="button"
                              className={classNames(
                                active
                                  ? 'bg-gray-700 text-gray-100'
                                  : 'text-gray-200',
                                'group flex items-center px-4 py-2 text-sm w-full focus:outline-none'
                              )}
                              onClick={() => handleInsertFileTemplate()}
                            >
                              <TemplateIcon
                                className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-300"
                                aria-hidden="true"
                              />
                              Insert File Template
                            </button>
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
                              onClick={() => setIsSettingsModalOpen(true)}
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
                    </Menu.Items>
                  </Transition>
                </>
              )}
            </Menu>
            <button
              type="button"
              className="relative inline-flex items-center px-4 py-2 shadow-sm text-sm font-medium text-gray-200 hover:bg-gray-800 focus:bg-gray-800 focus:outline-none"
              onClick={() => handleShare()}
            >
              <ShareIcon
                className="-ml-1 mr-2 h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
              {showCopied ? 'URL Copied!' : 'Share'}
            </button>
          </div>
          <RunButton
            onClick={() => handleRunCode()}
            showLoading={isRunning || loading}
          />
          {!loading && readOnly && (
            <span className="px-4 text-gray-500 text-sm font-medium">
              View Only
            </span>
          )}
          <div className="flex-1" />
          <div>
            <button
              type="button"
              className="relative inline-flex items-center px-4 py-2 shadow-sm text-sm font-medium text-gray-200 hover:bg-gray-800 focus:bg-gray-800 focus:outline-none"
              onClick={() => handleToggleSidebar()}
            >
              {showSidebar ? (
                <ChevronRightIcon
                  className="-ml-1 mr-2 h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              ) : (
                <ChevronLeftIcon
                  className="-ml-1 mr-2 h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              )}
              {onlineUserCount} User{onlineUserCount === 1 ? '' : 's'} Online
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <Split
            onDragEnd={() => layoutEditors()}
            render={({ getGridProps, getGutterProps }) => (
              <div
                className={`grid grid-cols-[3fr,3px,2fr,3px,1fr] grid-rows-[1fr,3px,1fr] h-full overflow-hidden`}
                {...getGridProps()}
              >
                <div className="row-span-full min-w-0 bg-[#1E1E1E] text-gray-200 flex flex-col overflow-hidden">
                  <TabBar
                    tabs={[
                      { label: 'Main.cpp', value: 'cpp' },
                      { label: 'Main.java', value: 'java' },
                      { label: 'Main.py', value: 'py' },
                    ]}
                    activeTab={lang}
                    onTabSelect={tab => setLang(tab.value as Language)}
                  />
                  <div className="flex-1 overflow-hidden">
                    <FirepadEditor
                      theme="vs-dark"
                      language={
                        { cpp: 'cpp', java: 'java', py: 'python' }[lang]
                      }
                      path={lang}
                      options={{
                        minimap: { enabled: false },
                        automaticLayout: false,
                        insertSpaces: false,
                        readOnly,
                      }}
                      onMount={e => {
                        editor.current = e;
                        setTimeout(() => {
                          e.layout();
                          e.focus();
                        }, 0);
                      }}
                      defaultValue={defaultCode[lang]}
                      firebaseRef={firebaseRefs[lang]}
                      useEditorWithVim={true}
                    />
                  </div>
                </div>
                <div
                  className="row-span-full col-start-2 cursor-[col-resize] mx-[-6px] group relative z-10"
                  {...getGutterProps('column', 1)}
                >
                  <div className="absolute h-full left-[6px] right-[6px] bg-black group-hover:bg-gray-600 group-active:bg-gray-600 pointer-events-none transition" />
                </div>
                <div
                  className={`flex flex-col min-w-0 min-h-0 overflow-hidden ${
                    showSidebar ? 'col-span-1' : 'col-span-3'
                  }`}
                >
                  <TabBar
                    tabs={[{ label: 'input', value: 'input' }]}
                    activeTab={'input'}
                  />
                  <div className="flex-1 bg-[#1E1E1E] text-white min-h-0 overflow-hidden">
                    <FirepadEditor
                      theme="vs-dark"
                      language={'plaintext'}
                      saveViewState={false}
                      path="input"
                      options={{
                        minimap: { enabled: false },
                        automaticLayout: false,
                        insertSpaces: false,
                        readOnly,
                      }}
                      onMount={e => {
                        inputEditor.current = e;
                        setTimeout(() => {
                          e.layout();
                        }, 0);
                      }}
                      defaultValue=""
                      firebaseRef={firebaseRefs.input}
                    />
                  </div>
                </div>
                <div
                  className={`cursor-[row-resize] my-[-6px] group relative z-10 ${
                    showSidebar ? 'col-span-1' : 'col-span-3'
                  }`}
                  {...getGutterProps('row', 1)}
                >
                  <div className="absolute w-full top-[6px] bottom-[6px] bg-black group-hover:bg-gray-600 group-active:bg-gray-600 pointer-events-none transition" />
                </div>
                <div
                  className={`flex flex-col min-w-0 min-h-0 overflow-hidden ${
                    showSidebar ? 'col-span-1' : 'col-span-3'
                  }`}
                >
                  <Output
                    result={result}
                    onMount={e => {
                      outputEditor.current = e;
                      setTimeout(() => {
                        e.layout();
                      }, 0);
                    }}
                  />
                </div>
                {showSidebar && (
                  <>
                    <div
                      className="row-span-full col-start-4 cursor-[col-resize] mx-[-6px] group relative z-10"
                      {...getGutterProps('column', 3)}
                    >
                      <div className="absolute h-full left-[6px] right-[6px] bg-black group-hover:bg-gray-600 group-active:bg-gray-600 pointer-events-none transition" />
                    </div>
                    <div className="row-span-full col-start-5 min-w-0 bg-[#1E1E1E] text-gray-200 flex flex-col overflow-auto">
                      <UserList className="max-w-full max-h-64" />
                      <Chat className="flex-1 p-4 min-h-0" />
                    </div>
                  </>
                )}
              </div>
            )}
          />
        </div>
        <div className="flex-shrink-0 relative text-sm bg-purple-900 bg-opacity-25 text-purple-200 font-medium font-mono">
          {/* For vim */}
          <span className="absolute left-0 top-0 bottom-0 pl-4 status-node" />
          <p className="text-center">
            v0.1.0. &copy; Competitive Programming Initiative
          </p>
          {result && (
            <span className="absolute right-0 top-0 bottom-0 pr-4">
              {result.status.description}, {result.time ?? '-'}s,{' '}
              {result.memory ?? '-'}KB
            </span>
          )}
        </div>
      </div>

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
}
