import { DotsHorizontalIcon } from '@heroicons/react/solid';
import classNames from 'classnames';
import { useAtomValue, useUpdateAtom } from 'jotai/utils';
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
  judgeResultAtom,
  mobileActiveTabAtom,
  showSidebarAtom,
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

export default function Workspace(): JSX.Element {
  const layoutEditors = useUpdateAtom(layoutEditorsAtom);
  const isDesktop = useMediaQuery('(min-width: 1024px)', true);
  const mobileActiveTab = useAtomValue(mobileActiveTabAtom);
  const [inputTab, setInputTab] = useState<'input' | 'judge'>('input');
  const showSidebar = useAtomValue(showSidebarAtom);
  const { settings } = useSettings();
  const setInputEditor = useUpdateAtom(inputMonacoEditorAtom);
  const setOutputEditor = useUpdateAtom(outputMonacoEditorAtom);
  const permission = useAtomValue(actualUserPermissionAtom);
  const readOnly = !(permission === 'OWNER' || permission === 'READ_WRITE');
  const result = useAtomValue(judgeResultAtom);

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

  useEffect(() => {
    if (!settings?.judgeUrl) {
      setInputTab('input');
    }
  }, [settings?.judgeUrl]);

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
              tabs={[
                { label: 'input', value: 'input' },
                ...(settings.judgeUrl
                  ? [{ label: 'USACO Judge', value: 'judge' }]
                  : []),
              ]}
              activeTab={inputTab}
              onTabSelect={x => setInputTab(x.value as 'input' | 'judge')}
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
              {inputTab === 'judge' && <JudgeInterface />}
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
  );
}
