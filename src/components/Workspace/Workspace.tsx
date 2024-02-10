import { EllipsisHorizontalIcon } from '@heroicons/react/20/solid';
import classNames from 'classnames';
import { useAtomValue, useUpdateAtom } from 'jotai/utils';
import { useAtom } from 'jotai';
import React, { useEffect, useState } from 'react';
/// <reference path="./types/react-split-grid.d.ts" />
import Split from 'react-split-grid';
import {
  layoutEditorsAtom,
  inputMonacoEditorAtom,
  outputMonacoEditorAtom,
  inputCodemirrorEditorAtom,
} from '../../atoms/workspace';
import {
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
import { LazyRealtimeEditor } from '../RealtimeEditor/LazyRealtimeEditor';
import { Output } from '../Output';
import { TabBar } from '../TabBar';
import { UserList } from '../UserList/UserList';
import Samples from '../JudgeInterface/Samples';
import useJudgeResults from '../../hooks/useJudgeResults';
import { useEditorContext } from '../../context/EditorContext';
import useUserPermission from '../../hooks/useUserPermission';
import { useUserContext } from '../../context/UserContext';
import { Sample } from '../JudgeInterface/Samples';
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

export default function Workspace({
  handleRunCode,
  tabsList,
}: {
  handleRunCode: () => void;
  tabsList: { label: string; value: string }[];
}): JSX.Element {
  const { fileData } = useEditorContext();
  const layoutEditors = useUpdateAtom(layoutEditorsAtom);
  const isDesktop = useMediaQuery('(min-width: 1024px)', true);
  const mobileActiveTab = useAtomValue(mobileActiveTabAtom);
  const [inputTab, setInputTab] = useAtom(inputTabAtom);
  const showSidebar = useAtomValue(showSidebarAtom);
  const setInputEditor = useUpdateAtom(inputMonacoEditorAtom);
  const setCodemirrorInputEditor = useUpdateAtom(inputCodemirrorEditorAtom);
  const setOutputEditor = useUpdateAtom(outputMonacoEditorAtom);
  const [problem, setProblem] = useAtom(problemAtom);

  const permission = useUserPermission();
  const readOnly = !(permission === 'OWNER' || permission === 'READ_WRITE');
  const [judgeResults, setJudgeResults] = useJudgeResults();

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
    setStatusData(null);
    setProblem(fileData.settings.problem);
    if (fileData.settings.problem) {
      setInputTab('judge');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileData.settings.problem?.id]);

  const inputTabIndex = useAtomValue(inputTabIndexAtom);
  const { lightMode } = useUserContext().userData;

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
              'row-span-full min-w-0 overflow-hidden border-t border-black',
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
                <LazyRealtimeEditor
                  theme={lightMode ? 'light' : 'vs-dark'}
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
                  onCodemirrorMount={(view, state) => {
                    // this is used by e2e/helpers.ts to set the value of the input codemirror editor
                    // @ts-ignore
                    window['TEST_inputCodemirrorEditor'] = view;
                    setCodemirrorInputEditor(view);
                  }}
                  defaultValue="1 2 3"
                  yjsDocumentId={`${fileData.id}.input`}
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
                <EllipsisHorizontalIcon className="h-5 w-5 text-gray-200" />
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
