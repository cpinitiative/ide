import { TabBar } from './TabBar';
import React, { useState, useEffect } from 'react';
import { LazyRealtimeEditor } from './RealtimeEditor/LazyRealtimeEditor';

import JudgeResult from '../types/judge';
import { EditorProps } from './editor/MonacoEditor/monaco-editor-types';
import useUserPermission from '../hooks/useUserPermission';
import { useUserContext } from '../context/UserContext';
import { useEditorContext } from '../context/EditorContext';
import { CodeEditor } from './editor/CodeEditor';

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

  const permission = useUserPermission();
  const readOnly = !(permission === 'OWNER' || permission === 'READ_WRITE');

  let outputText;
  if (option !== 'scribble') {
    if (result?.status === 'internal_error') {
      outputText =
        'Internal Error: ' +
        result.message +
        '\n\nPlease report this as a Github issue.';
    } else {
      if (option === 'compile_output') {
        if (result?.status === 'compile_error') {
          outputText = result.message ?? '';
        } else {
          outputText = result?.compilationMessage ?? '';
        }
      } else {
        outputText = result?.[option] ?? '';
      }
    }
  }
  const { fileData } = useEditorContext();
  const { userData } = useUserContext();
  const lightMode = userData.lightMode;

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
          <LazyRealtimeEditor
            theme={lightMode ? 'light' : 'vs-dark'}
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
            yjsDocumentId={`${fileData.id}.scribble`}
          />
        ) : (
          <CodeEditor
            theme={lightMode ? 'light' : 'vs-dark'}
            language={'plaintext'}
            value={outputText}
            saveViewState={false}
            path="output"
            options={{
              minimap: { enabled: false },
              readOnly: true,
              automaticLayout: false,
              insertSpaces: true,
            }}
            onMount={onMount}
          />
        )}
      </div>
      <div
        className="text-sm font-mono text-right pr-4 text-gray-200"
        data-test-id="code-execution-output-status"
      >
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
