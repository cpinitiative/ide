import { TabBar } from './TabBar';
import Editor from '@monaco-editor/react';
import { useState, useEffect } from 'react';

export const Output = ({ result, onMount }) => {
  const tabs = [
    { label: 'stdout', value: 'stdout' },
    { label: 'stderr', value: 'stderr' },
    { label: 'compile output', value: 'compile_output' },
    { label: 'sandbox message', value: 'message' },
  ];
  const [option, setOption] = useState('stdout');

  useEffect(() => {
    const option = tabs.find(tab => result?.[tab.value])?.value;
    if (option) setOption(option);
  }, [result]);

  return (
    <>
      <TabBar
        tabs={tabs}
        activeTab={option}
        onTabSelect={tab => {
          setOption(tab.value);
        }}
      />
      <div className="flex-1 bg-[#1E1E1E] text-white min-h-0 overflow-hidden">
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
          }}
          onMount={onMount}
        />
      </div>
    </>
  );
};
