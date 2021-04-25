import { TabBar } from "./TabBar";
import Editor from "@monaco-editor/react";
import { useState } from "react";

export const Output = ({ result, onMount }) => {
  const [option, setOption] = useState("stdout");

  console.log(result?.[option]);

  return (
    <>
      <TabBar
        tabs={[
          { label: 'stdout', value: 'stdout' },
          { label: 'stderr', value: 'stderr' },
          { label: 'compile output', value: 'compile_output' },
          { label: 'sandbox message', value: 'message' },
        ]}
        activeTab={option}
        onTabSelect={tab => {
          setOption(tab.value)
        }}
      />
      <div className="flex-1 bg-[#1E1E1E] text-white min-h-0 overflow-hidden">
        <Editor
          theme="vs-dark"
          language={"plaintext"}
          value={result?.[option] ?? ""}
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
  )
}