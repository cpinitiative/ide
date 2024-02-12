import { useRouter } from 'next/router';
import { MessagePage } from '../src/components/MessagePage';
import { FileMenu } from '../src/components/NavBar/FileMenu';
import { NavBar } from '../src/components/NavBar/NavBar';
import { EditorProvider, useEditorContext } from '../src/context/EditorContext';
import { RunButton } from '../src/components/RunButton';
import { submitToJudge } from '../src/scripts/judge';
import { useAtom, useAtomValue } from 'jotai';
import { useUpdateAtom } from 'jotai/utils';
import {
  inputEditorValueAtom,
  inputMonacoEditorAtom,
  layoutEditorsAtom,
  loadingAtom,
  mainEditorValueAtom,
  mainMonacoEditorAtom,
} from '../src/atoms/workspace';
import {
  inputTabAtom,
  inputTabIndexAtom,
  mobileActiveTabAtom,
  showSidebarAtom,
  tabsListAtom,
} from '../src/atoms/workspaceUI';
import { useEffect, useState } from 'react';
import { useMediaQuery } from '../src/hooks/useMediaQuery';
import Workspace from '../src/components/Workspace/Workspace';
import { MobileBottomNav } from '../src/components/NavBar/MobileBottomNav';
import { useNullableUserContext } from '../src/context/UserContext';
import useUserPermission from '../src/hooks/useUserPermission';
import { SettingsModal } from '../src/components/settings/SettingsModal';
import { getSampleIndex } from '../src/components/JudgeInterface/Samples';
import useJudgeResults from '../src/hooks/useJudgeResults';
import { cleanJudgeResult } from '../src/editorUtils';
import JudgeResult from '../src/types/judge';
import useUserFileConnection from '../src/hooks/useUserFileConnection';
import useUpdateUserDashboard from '../src/hooks/useUpdateUserDashboard';
import { ConfirmOverrideModal } from '../src/components/ConfirmOverrideModal';
import Link from 'next/link';

function EditorPage() {
  const { fileData, updateFileData } = useEditorContext();
  const permission = useUserPermission();
  const loading = useAtomValue(loadingAtom);
  const [showSidebar, setShowSidebar] = useAtom(showSidebarAtom);
  const readOnly = !(permission === 'OWNER' || permission === 'READ_WRITE');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 1024px)', true);
  const layoutEditors = useUpdateAtom(layoutEditorsAtom);
  const [mobileActiveTab, setMobileActiveTab] = useAtom(mobileActiveTabAtom);
  const getMainEditorValue = useAtomValue(mainEditorValueAtom);
  const getInputEditorValue = useAtomValue(inputEditorValueAtom);
  const [judgeResults, setJudgeResults] = useJudgeResults();

  useUserFileConnection();
  useUpdateUserDashboard();

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
    const problem = fileData.settings.problem;
    const setIsRunning = (isRunning: boolean) => {
      updateFileData({
        isCodeRunning: isRunning,
      });
    };
    const fetchJudge = (code: string, input: string): Promise<Response> => {
      return submitToJudge(
        fileData.settings.language,
        code,
        input,
        fileData.settings.compilerOptions[fileData.settings.language],
        problem?.input?.endsWith('.in')
          ? problem.input.substring(0, problem.input.length - 3)
          : undefined
      );
    };

    const setResultAt = (index: number, data: JudgeResult | null) => {
      const newJudgeResults = judgeResults;
      while (newJudgeResults.length <= index) newJudgeResults.push(null);
      newJudgeResults[index] = data;
      setJudgeResults(newJudgeResults);
    };

    const runWithInput = (
      input: string,
      expectedOutput?: string,
      prefix?: string
    ) => {
      if (!getMainEditorValue) {
        // editor is still loading
        return;
      }

      setIsRunning(true);
      setResultAt(inputTabIndex, null);

      const code = getMainEditorValue();
      fetchJudge(code, input)
        .then(async resp => {
          const data: JudgeResult = await resp.json();
          if (!resp.ok) {
            if (data.debugData?.errorType === 'Function.ResponseSizeTooLarge') {
              alert(
                'Error: Your program printed too much data to stdout/stderr.'
              );
            } else {
              alert('Error: ' + (resp.status + ' - ' + JSON.stringify(data)));
            }
          } else {
            cleanJudgeResult(data, expectedOutput, prefix);
            setResultAt(inputTabIndex, data);
          }
        })
        .catch(e => {
          alert(
            'Error: ' +
              e.message +
              '. Perhaps the server is down, or your input is too large.'
          );
          console.error(e);
        })
        .finally(() => setIsRunning(false));
    };

    const runAllSamples = async () => {
      if (!problem || !getMainEditorValue) {
        // editor is still loading
        return;
      }
      const samples = problem.samples;

      setIsRunning(true);
      setResultAt(1, null);

      const code = getMainEditorValue();
      try {
        const promises = [];
        for (let index = 0; index < samples.length; ++index) {
          const sample = samples[index];
          promises.push(fetchJudge(code, sample.input));
        }

        const newJudgeResults = judgeResults;
        const results: JudgeResult[] = [];
        for (let index = 0; index < samples.length; ++index) {
          const sample = samples[index];
          const resp = await promises[index];
          const data: JudgeResult = await resp.json();
          if (!resp.ok || data.status === 'internal_error') {
            alert(
              'Error: ' +
                (data.message || resp.status + ' - ' + JSON.stringify(data))
            );
            console.error(data);
            throw new Error('bad judge result');
          }
          let prefix = 'Sample';
          if (samples.length > 1) prefix += ` ${index + 1}`;
          prefix += ': ';
          cleanJudgeResult(data, sample.output, prefix);
          results.push(data);
          newJudgeResults[2 + index] = data;
        }
        if (samples.length > 1) {
          let verdicts = '';
          for (const result of results) {
            // https://newjudge0.usaco.guide/#statuses-and-languages-status-get
            if (result.status === 'compile_error') {
              // compilation error
              setJudgeResults([result]);
              break;
            }
            if (result.status === 'success') verdicts += 'A';
            else if (result.status === 'wrong_answer') verdicts += 'W';
            else if (result.status === 'time_limit_exceeded') verdicts += 'T';
            else if (result.status === 'runtime_error') verdicts += 'R';
            else verdicts += '?';
          }
          let firstFailed = 0;
          while (
            firstFailed < samples.length - 1 &&
            verdicts[firstFailed] === 'A'
          )
            ++firstFailed;

          const failedResult: JudgeResult = JSON.parse(
            JSON.stringify(results[firstFailed])
          );
          if (verdicts.length > 1)
            failedResult.statusDescription =
              'Sample Verdicts: ' +
              verdicts +
              '. ' +
              failedResult.statusDescription;
          newJudgeResults[1] = failedResult;
        } else {
          newJudgeResults[1] = newJudgeResults[2];
        }
        setJudgeResults(newJudgeResults);
      } catch (e) {
        console.error(e);
      }
      setIsRunning(false);
    };

    if (inputTab === 'input') {
      if (getInputEditorValue) runWithInput(getInputEditorValue());
    } else if (inputTab === 'judge') {
      runAllSamples();
    } else {
      const samples = problem?.samples;
      if (samples) {
        const index = getSampleIndex(inputTab);
        const sample = samples[index - 1];
        runWithInput(sample.input, sample.output, inputTab + ': ');
      }
    }
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

export default function FilePage() {
  const queryId = useRouter().query.id;
  const firebaseFileID = '-' + queryId;

  const { userData } = useNullableUserContext();

  const loadingUI = <MessagePage message="Loading..." showHomeButton={false} />;
  const oldLink = `https://legacy.ide.usaco.guide/${queryId}`;
  const fileNotFoundUI = (
    <div className="p-8 sm:p-16">
      <div className=" max-w-prose mx-auto">
        <div className="text-3xl sm:text-4xl text-white font-bold">
          File Not Found
        </div>
        <p className="sm:text-lg mt-8 text-gray-200 max-w-prose mx-auto text-left">
          Note: The IDE was recently updated to use a new backend system. If
          you&apos;re trying to access an old file you created with the old
          version of the IDE, try this link:{' '}
          <a href={oldLink} className="font-medium text-white underline">
            {oldLink}
          </a>
        </p>
        <Link
          href="/"
          className="mt-6 sm:mt-10 inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-[#1E1E1E]"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
  const permissionDeniedUI = <MessagePage message="This file is private." />;

  if (!queryId) return null;
  if (!userData) return loadingUI;

  return (
    <>
      <EditorProvider
        fileId={firebaseFileID}
        loadingUI={loadingUI}
        fileNotFoundUI={fileNotFoundUI}
        permissionDeniedUI={permissionDeniedUI}
      >
        <EditorPage />
      </EditorProvider>
      <ConfirmOverrideModal />
    </>
  );
}
