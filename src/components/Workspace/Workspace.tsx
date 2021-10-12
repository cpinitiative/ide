import { DotsHorizontalIcon } from '@heroicons/react/solid';
import classNames from 'classnames';
import { useAtomValue, useUpdateAtom } from 'jotai/utils';
import { useAtom } from 'jotai';
import React, { useEffect, useMemo, useState } from 'react';
/// <reference path="./types/react-split-grid.d.ts" />
import Split from 'react-split-grid';
import { authenticatedFirebaseRefAtom } from '../../atoms/firebaseAtoms';
import {
  layoutEditorsAtom,
  inputMonacoEditorAtom,
  outputMonacoEditorAtom,
  actualUserPermissionAtom,
} from '../../atoms/workspace';
import {
  judgeResultsAtom,
  mobileActiveTabAtom,
  showSidebarAtom,
  inputTabAtom,
  problemAtom,
  inputTabIndexAtom,
} from '../../atoms/workspaceUI';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { Chat } from '../Chat';
import { CodeInterface } from '../CodeInterface/CodeInterface';
import JudgeInterface from '../JudgeInterface/JudgeInterface';
import { LazyFirepadEditor } from '../LazyFirepadEditor';
import { Output } from '../Output';
import { useSettings } from '../SettingsContext';
import { TabBar } from '../TabBar';
import { UserList } from '../UserList/UserList';
import Samples, { Sample } from '../JudgeInterface/Samples';
import JudgeResult from '../../types/judge';
import { judgePrefix } from '../JudgeInterface/JudgeInterface';

function resizeResults(results: (JudgeResult | null)[], newSize: number) {
  while (results.length > newSize) results.pop();
  while (results.length < newSize) results.push(null);
  return results;
}

export type ProblemData = {
  id: number;
  submittable: boolean;
  url: string;
  source: string;
  title: string;
  input: string;
  output: string;
  samples: Sample[];
};

interface TestCase {
  title: string;
  trialNum: string;
  symbol: string;
  memory: string;
  time: string;
}

export interface StatusData {
  statusText?: string;
  message?: string;
  statusCode: number;
  testCases?: TestCase[];
  output?: string;
}

export async function fetchProblemData(
  problemID: string
): Promise<ProblemData | null> {
  const url = `${judgePrefix}/problem/${problemID}`;
  const response = await fetch(url);
  if (response.status !== 200) return null;
  return await response.json();
}

export default function Workspace({
  handleRunCode,
  tabsList,
}: {
  handleRunCode: () => void;
  tabsList: { label: string; value: string }[];
}): JSX.Element {
  const layoutEditors = useUpdateAtom(layoutEditorsAtom);
  const isDesktop = useMediaQuery('(min-width: 1024px)', true);
  const mobileActiveTab = useAtomValue(mobileActiveTabAtom);
  const [inputTab, setInputTab] = useAtom(inputTabAtom);
  const showSidebar = useAtomValue(showSidebarAtom);
  const { settings } = useSettings();
  const setInputEditor = useUpdateAtom(inputMonacoEditorAtom);
  const setOutputEditor = useUpdateAtom(outputMonacoEditorAtom);
  const [problem, setProblem] = useAtom(problemAtom);

  const permission = useAtomValue(actualUserPermissionAtom);
  const readOnly = !(permission === 'OWNER' || permission === 'READ_WRITE');
  const [judgeResults, setJudgeResults] = useAtom(judgeResultsAtom);

  const firebaseRef = useAtomValue(authenticatedFirebaseRefAtom);
  const firebaseRefs = useMemo(
    () => ({
      input: firebaseRef?.child('input'),
    }),
    [firebaseRef]
  );

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
  }, [isDesktop, mobileActiveTab, layoutEditors]);

  const [statusData, setStatusData] = useState<StatusData | null>(null);

  useEffect(() => {
    const updateProblemData = (newProblem?: ProblemData | null) => {
      setStatusData(null);
      const newJudgeResults = judgeResults;
      while (newJudgeResults.length > 1) newJudgeResults.pop();
      setProblem(newProblem);
      if (newProblem) {
        const samples = newProblem.samples;
        setJudgeResults(resizeResults(newJudgeResults, 2 + samples.length));
        setInputTab('judge');
      } else {
        setJudgeResults(newJudgeResults);
      }
    };
    updateProblemData(settings.problem);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.problem]);

  const inputTabIndex = useAtomValue(inputTabIndexAtom);

  return (
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
              tabs={tabsList}
              activeTab={inputTab}
              onTabSelect={x => setInputTab(x.value)}
            />
            <div className="flex-1 bg-[#1E1E1E] text-white min-h-0 overflow-hidden">
              {inputTab === 'input' && (
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
              )}
              {inputTab === 'judge' && problem && (
                <JudgeInterface
                  problem={problem}
                  statusData={statusData}
                  setStatusData={setStatusData}
                  handleRunCode={handleRunCode}
                />
              )}
              {inputTab.startsWith('Sample') && problem && (
                <div className="overflow-y-auto h-full">
                  <div className="p-4 pb-0">
                    <Samples
                      samples={problem.samples}
                      inputTab={inputTab}
                      handleRunCode={handleRunCode}
                    />
                  </div>
                </div>
              )}
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
              result={judgeResults[inputTabIndex]}
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
  );
}
