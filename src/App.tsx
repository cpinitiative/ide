import loader from '@monaco-editor/loader';
loader.config({
  paths: {
    vs: '/vs',
  },
});

/// <reference path="./types/react-split-grid.d.ts" />
import Split from 'react-split-grid';
import React, { useState, useEffect, useMemo } from 'react';
import { RunButton } from './components/RunButton';
import { TabBar } from './components/TabBar';
import { Output } from './components/Output';
import defaultCode from './scripts/defaultCode';
import JudgeResult, { JudgeSuccessResult } from './types/judge';
import { SettingsModal } from './components/SettingsModal';
import { useSettings } from './components/SettingsContext';
import { UserList } from './components/UserList/UserList';
import type firebaseType from 'firebase';
import { useAtom } from 'jotai';
import {
  actualUserPermissionAtom,
  currentLangAtom,
  inputMonacoEditorAtom,
  layoutEditorsAtom,
  loadingAtom,
  mainMonacoEditorAtom,
  outputMonacoEditorAtom,
  userPermissionAtom,
} from './atoms/workspace';
import { Chat } from './components/Chat';
import { NavBar } from './components/NavBar/NavBar';
import { FileMenu } from './components/NavBar/FileMenu';
import download from './scripts/download';
import { useMediaQuery } from './hooks/useMediaQuery';
import { MobileBottomNav } from './components/NavBar/MobileBottomNav';
import { CodeInterface } from './components/CodeInterface/CodeInterface';
import { LazyFirepadEditor } from './components/LazyFirepadEditor';
import classNames from 'classnames';
import { DotsHorizontalIcon } from '@heroicons/react/solid';
import { useAtomValue, useUpdateAtom } from 'jotai/utils';
import {
  authenticatedFirebaseRefAtom,
  setFirebaseErrorAtom,
  userRefAtom,
} from './atoms/firebaseAtoms';
import { PrivateFileMessage } from './components/PrivateFileMessage';

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

export default function App(): JSX.Element {
  const [mainMonacoEditor] = useAtom(mainMonacoEditorAtom);
  const [inputEditor, setInputEditor] = useAtom(inputMonacoEditorAtom);
  const setOutputEditor = useUpdateAtom(outputMonacoEditorAtom);
  const layoutEditors = useUpdateAtom(layoutEditorsAtom);
  const [result, setResult] = useState<JudgeSuccessResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const lang = useAtomValue(currentLangAtom);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const { settings } = useSettings();
  const [showSidebar, setShowSidebar] = useState(false);
  const setUserPermission = useUpdateAtom(userPermissionAtom);
  const permission = useAtomValue(actualUserPermissionAtom);
  const loading = useAtomValue(loadingAtom);
  const setFirebaseError = useUpdateAtom(setFirebaseErrorAtom);
  const readOnly = !(permission === 'OWNER' || permission === 'READ_WRITE');
  const [mobileActiveTab, setMobileActiveTab] = useState<
    'code' | 'io' | 'users'
  >('code');
  const isDesktop = useMediaQuery('(min-width: 1024px)', true);

  const firebaseRef = useAtomValue(authenticatedFirebaseRefAtom);
  const firebaseRefs = useMemo(
    () => ({
      cpp: firebaseRef?.child(`editor-cpp`),
      java: firebaseRef?.child(`editor-java`),
      py: firebaseRef?.child(`editor-py`),
      input: firebaseRef?.child('input'),
    }),
    [firebaseRef]
  );

  const potentiallyUnauthenticatedUserRef = useAtomValue(userRefAtom);
  useEffect(() => {
    if (potentiallyUnauthenticatedUserRef) {
      const handleChange = (snap: firebaseType.database.DataSnapshot) => {
        if (!snap.exists()) return;
        const permission = snap.val().permission;
        setUserPermission(permission);
      };
      potentiallyUnauthenticatedUserRef.on('value', handleChange, e => {
        setFirebaseError(e);
      });
      return () => {
        potentiallyUnauthenticatedUserRef.off('value', handleChange);
      };
    }
  }, [potentiallyUnauthenticatedUserRef, setUserPermission, setFirebaseError]);

  const handleRunCode = () => {
    if (!mainMonacoEditor || !inputEditor) {
      // editor is still loading
      return;
    }

    setIsRunning(true);
    setResult(null);
    const data = {
      source_code: encode(mainMonacoEditor.getValue()),
      language_id: { cpp: 54, java: 62, py: 71 }[lang],
      stdin: encode(inputEditor.getValue()),
      compiler_options: settings.compilerOptions[lang],
      command_line_arguments: '',
      redirect_stderr_to_stdout: false,
    };

    fetch(
      `https://newjudge0.usaco.guide/submissions?base64_encoded=true&wait=true`,
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

  useEffect(() => {
    function handleResize() {
      layoutEditors();
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [layoutEditors]);

  useEffect(() => {
    if (!isDesktop) {
      layoutEditors();
    }
  }, [isDesktop, mobileActiveTab]);

  const handleToggleSidebar = () => {
    setShowSidebar(!showSidebar);
    setTimeout(() => {
      layoutEditors();
    }, 0);
  };

  const handleDownloadFile = () => {
    if (!mainMonacoEditor) {
      alert("Editor hasn't loaded yet. Please wait.");
      return;
    }

    const fileNames = {
      cpp: 'main.cpp',
      java: 'Main.java',
      py: 'main.py',
    };

    download(fileNames[lang], mainMonacoEditor.getValue());
  };

  const handleInsertFileTemplate = () => {
    if (!mainMonacoEditor) {
      alert("Editor hasn't loaded yet, please wait");
      return;
    }
    if (confirm('Reset current file? Any changes you made will be lost.')) {
      mainMonacoEditor.setValue(defaultCode[lang]);
    }
  };

  useEffect(() => {
    document.title = `${
      settings.workspaceName ? settings.workspaceName + ' · ' : ''
    }Real-Time Collaborative Online IDE`;
  }, [settings.workspaceName]);

  if (permission === 'PRIVATE') return <PrivateFileMessage />;

  return (
    <div className="h-full">
      <div className="h-full flex flex-col">
        <div className="flex-shrink-0 bg-[#1E1E1E] flex items-center">
          <NavBar
            fileMenu={
              <FileMenu
                onDownloadFile={handleDownloadFile}
                onInsertFileTemplate={handleInsertFileTemplate}
                onOpenSettings={() => setIsSettingsModalOpen(true)}
              />
            }
            runButton={
              <RunButton
                onClick={() => handleRunCode()}
                showLoading={isRunning || loading}
              />
            }
            showViewOnly={!loading && readOnly}
            isSidebarOpen={showSidebar}
            onToggleSidebar={handleToggleSidebar}
            showSidebarButton={isDesktop}
          />
        </div>
        <div className="flex-1 min-h-0">
          <Split
            onDragEnd={() => layoutEditors()}
            render={({ getGridProps, getGutterProps }) => (
              <div
                className={`grid grid-cols-[3fr,3px,2fr,3px,1fr] grid-rows-[1fr,3px,1fr] h-full overflow-hidden`}
                {...getGridProps()}
              >
                <CodeInterface
                  className={classNames(
                    'row-span-full min-w-0 overflow-hidden',
                    !isDesktop && 'col-span-full',
                    !isDesktop && mobileActiveTab !== 'code' && 'hidden'
                  )}
                />
                <div
                  className={classNames(
                    'row-span-full col-start-2 cursor-[col-resize] mx-[-6px] group relative z-10',
                    !isDesktop && 'hidden'
                  )}
                  {...getGutterProps('column', 1)}
                >
                  <div className="absolute h-full left-[6px] right-[6px] bg-black group-hover:bg-gray-600 group-active:bg-gray-600 pointer-events-none transition" />
                </div>
                <div
                  className={classNames(
                    'flex flex-col min-w-0 min-h-0 overflow-hidden',
                    !isDesktop && 'col-span-full mb-[6px]',
                    !isDesktop && mobileActiveTab !== 'io' && 'hidden',
                    isDesktop && (showSidebar ? 'col-span-1' : 'col-span-3')
                  )}
                >
                  <TabBar
                    tabs={[{ label: 'input', value: 'input' }]}
                    activeTab={'input'}
                  />
                  <div className="flex-1 bg-[#1E1E1E] text-white min-h-0 overflow-hidden">
                    <LazyFirepadEditor
                      theme="vs-dark"
                      language={'plaintext'}
                      saveViewState={false}
                      path="input"
                      dataTestId="input-editor"
                      options={{
                        minimap: { enabled: false },
                        automaticLayout: false,
                        insertSpaces: false,
                        readOnly,
                      }}
                      onMount={e => {
                        setInputEditor(e);
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
                  className={classNames(
                    'cursor-[row-resize] group relative z-10 my-[-6px]',
                    !isDesktop && 'col-span-full',
                    !isDesktop && mobileActiveTab !== 'io' && 'hidden',
                    isDesktop && (showSidebar ? 'col-span-1' : 'col-span-3')
                  )}
                  {...getGutterProps('row', 1)}
                >
                  <div
                    className={classNames(
                      'absolute w-full bg-black group-hover:bg-gray-600 group-active:bg-gray-600 group-focus:bg-gray-600 pointer-events-none transition',
                      isDesktop
                        ? 'top-[6px] bottom-[6px]'
                        : 'inset-y-0 bg-gray-800 flex items-center justify-center'
                    )}
                  >
                    {!isDesktop && (
                      <DotsHorizontalIcon className="h-5 w-5 text-gray-200" />
                    )}
                  </div>
                </div>
                <div
                  className={classNames(
                    'flex flex-col min-w-0 min-h-0 overflow-hidden',
                    !isDesktop && 'col-span-full mt-[6px]',
                    !isDesktop && mobileActiveTab !== 'io' && 'hidden',
                    isDesktop && (showSidebar ? 'col-span-1' : 'col-span-3')
                  )}
                >
                  <Output
                    result={result}
                    onMount={e => {
                      setOutputEditor(e);
                      setTimeout(() => {
                        e.layout();
                      }, 0);
                    }}
                  />
                </div>
                {((showSidebar && isDesktop) ||
                  (!isDesktop && mobileActiveTab === 'users')) && (
                  <>
                    <div
                      className={classNames(
                        'row-span-full col-start-4 cursor-[col-resize] mx-[-6px] group relative z-10',
                        !isDesktop && 'hidden'
                      )}
                      {...getGutterProps('column', 3)}
                    >
                      <div className="absolute h-full left-[6px] right-[6px] bg-black group-hover:bg-gray-600 group-active:bg-gray-600 pointer-events-none transition" />
                    </div>
                    <div
                      className={classNames(
                        'row-span-full min-w-0 bg-[#1E1E1E] text-gray-200 flex flex-col overflow-auto',
                        isDesktop ? 'col-start-5' : 'col-span-full pt-4'
                      )}
                    >
                      <UserList className="max-w-full max-h-64" />
                      <Chat className="flex-1 p-4 min-h-0" />
                    </div>
                  </>
                )}
              </div>
            )}
          />
        </div>
        {!isDesktop && (
          <MobileBottomNav
            activeTab={mobileActiveTab}
            onActiveTabChange={setMobileActiveTab}
          />
        )}
      </div>

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
}
