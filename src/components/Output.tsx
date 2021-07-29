import { TabBar } from './TabBar';
import Editor, { EditorProps } from '@monaco-editor/react';
import React, { useState, useEffect, useMemo } from 'react';
import { JudgeSuccessResult } from '../types/judge';
import { authenticatedFirebaseRefAtom } from '../atoms/firebaseAtoms';
import { LazyFirepadEditor } from './LazyFirepadEditor';

import { actualUserPermissionAtom } from '../atoms/workspace';
import { useAtomValue } from 'jotai/utils';

export interface OutputProps {
  result: JudgeSuccessResult | null;
  onMount: EditorProps['onMount'];
}

type JudgeOutputTab = 'stdout' | 'stderr' | 'compile_output' | 'message';

type OutputTab =
  | 'stdout'
  | 'stderr'
  | 'compile_output'
  | 'message'
  | 'scribble';

const tabs = [
  { label: 'stdout', value: 'stdout' },
  { label: 'stderr', value: 'stderr' },
  { label: 'compile output', value: 'compile_output' },
  { label: 'sandbox message', value: 'message' },
  { label: 'scribble', value: 'scribble' },
];

export const Output = ({ result, onMount }: OutputProps): JSX.Element => {
  const [option, setOption] = useState<OutputTab>('stdout');

  useEffect(() => {
    const option = tabs.find(tab => result?.[tab.value as JudgeOutputTab])
      ?.value;
    if (option) setOption(option as JudgeOutputTab);
  }, [result]);

  const permission = useAtomValue(actualUserPermissionAtom);
  const readOnly = !(permission === 'OWNER' || permission === 'READ_WRITE');

  const firebaseRef = useAtomValue(authenticatedFirebaseRefAtom);
  const firebaseRefs = useMemo(
    () => ({
      scribble: firebaseRef?.child('scribble'),
    }),
    [firebaseRef]
  );

  return (
    <>
      <TabBar
        tabs={tabs}
        activeTab={option}
        onTabSelect={tab => {
          setOption(tab.value as OutputTab);
        }}
      />
      <div className="flex-1 bg-[#1E1E1E] text-white min-h-0 overflow-hidden tw-forms-disable tw-forms-disable-all-descendants">
        {option === 'scribble' ? (
          <LazyFirepadEditor
            theme="vs-dark"
            language={'plaintext'}
            saveViewState={false}
            path="scribble"
            dataTestId="scribble-editor"
            options={{
              minimap: { enabled: false },
              automaticLayout: false,
              insertSpaces: false,
              readOnly,
            }}
            onMount={e => {
              setTimeout(() => {
                e.layout();
              }, 0);
            }}
            defaultValue=""
            firebaseRef={firebaseRefs.scribble}
          />
        ) : (
          <Editor
            theme="vs-dark"
            language={'plaintext'}
            value={result?.[option] ?? ''}
            saveViewState={false}
            path="output"
            options={{
              minimap: { enabled: false },
              readOnly: true,
              automaticLayout: false,
              insertSpaces: false,
            }}
            onMount={onMount}
          />
        )}
      </div>
      <div className="text-sm font-mono text-right pr-4 text-gray-200">
        {result && (
          <>
            {result.status.description}, {result.time ?? '-'}s,{' '}
            {result.memory ?? '-'}KB
          </>
        )}
      </div>
    </>
  );
};
