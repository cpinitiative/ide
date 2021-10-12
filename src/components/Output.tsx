import { TabBar } from './TabBar';
import Editor, { EditorProps } from '@monaco-editor/react';
import React, { useState, useEffect, useMemo } from 'react';
import { authenticatedFirebaseRefAtom } from '../atoms/firebaseAtoms';
import { LazyFirepadEditor } from './LazyFirepadEditor';

import { actualUserPermissionAtom } from '../atoms/workspace';
import { useAtomValue } from 'jotai/utils';
import JudgeResult from '../types/judge';

export interface OutputProps {
  result: JudgeResult | null;
  onMount: EditorProps['onMount'];
}

type JudgeOutputTab = 'stdout' | 'stderr' | 'compile_output';

type OutputTab = 'stdout' | 'stderr' | 'compile_output' | 'scribble';

const tabs = [
  { label: 'stdout', value: 'stdout' },
  { label: 'stderr', value: 'stderr' },
  { label: 'compile output', value: 'compile_output' },
  { label: 'scribble', value: 'scribble' },
];

export const Output = ({ result, onMount }: OutputProps): JSX.Element => {
  const [option, setOption] = useState<OutputTab>('stdout');

  useEffect(() => {
    let option = null;
    if (
      result?.status === 'compile_error' ||
      result?.status === 'internal_error'
    )
      option = 'compile_output';
    else if (result?.stdout) option = 'stdout';
    else if (result?.stderr) option = 'stderr';
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

  let outputText;
  if (option !== 'scribble') {
    if (result?.status === 'internal_error') {
      outputText =
        'Internal Error: ' +
        result.message +
        '\n\nPlease report this as a Github issue.';
    } else {
      outputText =
        result?.[option === 'compile_output' ? 'message' : option] ?? '';
    }
  }

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
            value={outputText}
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
            {result.statusDescription}, {result.time ?? '-'}s,{' '}
            {result.memory ?? '-'}KB
          </>
        )}
      </div>
    </>
  );
};
