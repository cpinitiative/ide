import loader from '@monaco-editor/loader';
loader.config({
  paths: {
    vs: '/vs',
  },
});

import React, { useState, useEffect } from 'react';
import { RunButton } from '../components/RunButton';
import defaultCode from '../scripts/defaultCode';
import JudgeResult from '../types/judge';
import { SettingsModal } from '../components/settings/SettingsModal';
import { useSettings } from '../components/SettingsContext';
import type firebaseType from 'firebase';
import { useAtom } from 'jotai';
import {
  actualUserPermissionAtom,
  currentLangAtom,
  inputMonacoEditorAtom,
  layoutEditorsAtom,
  loadingAtom,
  mainMonacoEditorAtom,
  userPermissionAtom,
} from '../atoms/workspace';
import { NavBar } from '../components/NavBar/NavBar';
import { FileMenu } from '../components/NavBar/FileMenu';
import download from '../scripts/download';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { MobileBottomNav } from '../components/NavBar/MobileBottomNav';
import { useAtomValue, useUpdateAtom } from 'jotai/utils';
import {
  fileIdAtom,
  firebaseUserAtom,
  setFirebaseErrorAtom,
  userRefAtom,
} from '../atoms/firebaseAtoms';
import { MessagePage } from '../components/MessagePage';
import { navigate, RouteComponentProps } from '@reach/router';
import firebase from 'firebase/app';
import Workspace from '../components/Workspace/Workspace';
import {
  judgeResultAtom,
  mobileActiveTabAtom,
  showSidebarAtom,
} from '../atoms/workspaceUI';

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

export interface EditorPageProps extends RouteComponentProps {
  fileId?: string;
}

export default function EditorPage(props: EditorPageProps): JSX.Element {
  const [fileId, setFileId] = useAtom(fileIdAtom);
  const firebaseUser = useAtomValue(firebaseUserAtom);
  const layoutEditors = useUpdateAtom(layoutEditorsAtom);
  const mainMonacoEditor = useAtomValue(mainMonacoEditorAtom);
  const inputEditor = useAtomValue(inputMonacoEditorAtom);
  const setResult = useUpdateAtom(judgeResultAtom);
  const [isRunning, setIsRunning] = useState(false);
  const lang = useAtomValue(currentLangAtom);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const { settings } = useSettings();
  const setUserPermission = useUpdateAtom(userPermissionAtom);
  const permission = useAtomValue(actualUserPermissionAtom);
  const loading = useAtomValue(loadingAtom);
  const setShowSidebar = useUpdateAtom(showSidebarAtom);
  const setFirebaseError = useUpdateAtom(setFirebaseErrorAtom);
  const readOnly = !(permission === 'OWNER' || permission === 'READ_WRITE');
  const isDesktop = useMediaQuery('(min-width: 1024px)', true);
  const [mobileActiveTab, setMobileActiveTab] = useAtom(mobileActiveTabAtom);
  const showSidebar = useAtomValue(showSidebarAtom);

  useEffect(() => {
    const queryId: string | null = props.fileId ?? null;

    if (queryId === 'new') {
      setFileId({
        newId: null,
        isNewFile: true,
      });
      // validate that queryId is a firebase key
      // todo improve: https://stackoverflow.com/questions/52850099/what-is-the-reg-expression-for-firestore-constraints-on-document-ids/52850529#52850529
    } else if (queryId?.length === 19) {
      setFileId({
        newId: queryId,
        isNewFile: false,
      });
    } else {
      alert('Error: Bad URL');
      navigate('/', { replace: true });
    }
  }, [props.fileId, setFileId]);

  useEffect(() => {
    return () => setFileId(null) as void;
  }, [setFileId]);

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

  const handleToggleSidebar = () => {
    setShowSidebar(show => !show);
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

  useEffect(() => {
    if (firebaseUser && fileId?.id) {
      firebase
        .database()
        .ref('users')
        .child(firebaseUser.uid)
        .child(fileId.id)
        .set({
          title: settings.workspaceName || '',
          lastAccessTime: firebase.database.ServerValue.TIMESTAMP,
        });
    }
  }, [firebaseUser, fileId, settings.workspaceName]);

  if (permission === 'PRIVATE')
    return <MessagePage message="This file is private." />;

  return (
    <div className="h-full">
      <div className="h-full flex flex-col">
        <div className="flex-shrink-0 bg-[#1E1E1E]">
          <NavBar
            fileMenu={
              <FileMenu
                onDownloadFile={handleDownloadFile}
                onInsertFileTemplate={handleInsertFileTemplate}
                onOpenSettings={() => setIsSettingsModalOpen(true)}
                forkButtonUrl={`/${fileId?.id?.substring(1)}/copy`}
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
          <Workspace />
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
