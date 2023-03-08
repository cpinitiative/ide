import { useRouter } from 'next/router';
import { MessagePage } from '../src/components/MessagePage';
import { FileMenu } from '../src/components/NavBar/FileMenu';
import { NavBar } from '../src/components/NavBar/NavBar';
import { EditorProvider, useEditorContext } from '../src/context/EditorContext';
import { RunButton } from '../src/components/RunButton';
import { extractJavaFilename } from '../src/scripts/judge';
import { useAtom, useAtomValue } from 'jotai';
import { useUpdateAtom } from 'jotai/utils';
import {
  actualUserPermissionAtom,
  layoutEditorsAtom,
  loadingAtom,
  mainMonacoEditorAtom,
} from '../src/atoms/workspace';
import {
  inputTabAtom,
  inputTabIndexAtom,
  showSidebarAtom,
  tabsListAtom,
} from '../src/atoms/workspaceUI';
import defaultCode from '../src/scripts/defaultCode';
import download from '../src/scripts/download';
import { useEffect, useState } from 'react';
import { useMediaQuery } from '../src/hooks/useMediaQuery';
import Workspace from '../src/components/Workspace/Workspace';
import { MobileBottomNav } from '../src/components/NavBar/MobileBottomNav';
import {
  useNullableUserContext,
  useUserContext,
} from '../src/context/UserContext';
import useUserPermission from '../src/hooks/useUserPermission';

function EditorPage() {
  const { fileData } = useEditorContext();
  const permission = useUserPermission();
  const loading = useAtomValue(loadingAtom);
  const [showSidebar, setShowSidebar] = useAtom(showSidebarAtom);
  const readOnly = !(permission === 'OWNER' || permission === 'READ_WRITE');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 1024px)', true);
  const layoutEditors = useUpdateAtom(layoutEditorsAtom);

  const [inputTab, setInputTab] = useAtom(inputTabAtom);
  const tabsList = useAtomValue(tabsListAtom);
  const inputTabIndex = useAtomValue(inputTabIndexAtom);
  useEffect(() => {
    if (inputTabIndex === tabsList.length) {
      // current tab doesn't exist
      setInputTab(tabsList[0].value);
    }
  }, [tabsList, inputTab, setInputTab, inputTabIndex]);

  const handleToggleSidebar = () => {
    setShowSidebar(show => !show);
    setTimeout(() => {
      layoutEditors();
    }, 0);
  };

  const handleRunCode = () => {
    // if (inputTab === 'input') {
    //   if (inputEditor) runWithInput(inputEditor.getValue());
    // } else if (inputTab === 'judge') {
    //   runAllSamples();
    // } else {
    //   const samples = problem?.samples;
    //   if (samples) {
    //     const index = getSampleIndex(inputTab);
    //     const sample = samples[index - 1];
    //     runWithInput(sample.input, sample.output, inputTab + ': ');
    //   }
    // }
  };

  return (
    <div className="h-full">
      <div className="h-full flex flex-col">
        <div className="flex-shrink-0 bg-[#1E1E1E]">
          <NavBar
            fileMenu={
              <FileMenu onOpenSettings={() => setIsSettingsModalOpen(true)} />
            }
            runButton={
              <RunButton
                onClick={handleRunCode}
                showLoading={fileData.isCodeRunning || loading}
                disabledForViewOnly={readOnly}
              />
            }
            showViewOnly={!loading && readOnly}
            isSidebarOpen={showSidebar}
            onToggleSidebar={handleToggleSidebar}
            showSidebarButton={isDesktop}
          />
        </div>
        <div className="flex-1 min-h-0">
          <Workspace handleRunCode={handleRunCode} tabsList={tabsList} />
        </div>
        {/* {!isDesktop && (
          <MobileBottomNav
            activeTab={mobileActiveTab}
            onActiveTabChange={setMobileActiveTab}
          />
        )} */}
      </div>

      {/* <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      /> */}
    </div>
  );
}

export default function FilePage() {
  const queryId = useRouter().query.id;
  const firebaseFileID = '-' + queryId;

  const { userData } = useNullableUserContext();

  const loadingUI = <MessagePage message="Loading..." showHomeButton={false} />;
  const fileNotFoundUI = <MessagePage message="File Not Found" />;
  const permissionDeniedUI = <MessagePage message="This file is private." />;

  if (!queryId) return null;
  if (!userData) return loadingUI;

  return (
    <EditorProvider
      fileId={firebaseFileID}
      loadingUI={loadingUI}
      fileNotFoundUI={fileNotFoundUI}
      permissionDeniedUI={permissionDeniedUI}
    >
      <EditorPage />
    </EditorProvider>
  );
}
