import Head from 'next/head'
import Split from 'react-split-grid'
import React, { useRef, useState } from "react";
import { RunButton } from "../components/RunButton";
import { TabBar } from "../components/TabBar";
import Editor from "@monaco-editor/react";
import { Output } from "../components/Output";

function encode(str) {
  return btoa(unescape(encodeURIComponent(str || "")));
}

function decode(bytes) {
  const escaped = escape(atob(bytes || ""));
  try {
    return decodeURIComponent(escaped);
  } catch (err) {
    return unescape(escaped);
  }
}

export default function Home() {
  const editor = useRef(null);
  const inputEditor = useRef(null);
  const outputEditor = useRef(null);
  const [editorValue, setEditorValue] = useState(`#include <bits/stdc++.h>

using namespace std;

int main() {
\tcout << "Hello World!" << endl;
\treturn 0;
}
`);
  const [stdin, setStdin] = useState("");
  const [result, setResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleRunCode = () => {
    setIsRunning(true);
    setResult(null);
    const data = {
      source_code: encode(editorValue),
      language_id: "54", // C++
      stdin: encode(stdin),
      compiler_options: "",
      command_line_arguments: "",
      redirect_stderr_to_stdout: false,
    };

    fetch(`https://judge0.usaco.guide/submissions?base64_encoded=true&wait=true`, {
      method: "POST",
      async: true,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(data),
    }).then(resp => resp.json())
      .then(data => {
        if (data.error) {
          alert(data.error);
        } else {
          data.stdout = decode(data.stdout);
          data.stderr = decode(data.stderr);
          data.compile_output = decode(data.compile_output);
          data.message = decode(data.message);
          setResult(data);
        }
    }).catch(e => {
      console.error(e);
    }).finally(() => setIsRunning(false));
  };

  const output = result?.stdout;

  return (
    <div className="h-full">
      <Head>
        <title>Real-Time IDE</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="h-full flex flex-col">
        <div className="flex-shrink-0 bg-[#1E1E1E]">
          <RunButton onClick={() => handleRunCode()} isRunning={isRunning} />
        </div>
        <div className="flex-1 min-h-0">
          <Split
            onDragEnd={() => {
              if (editor.current) editor.current.layout();
              if (inputEditor.current) inputEditor.current.layout();
              if (outputEditor.current) outputEditor.current.layout();
            }}
            render={({
                       getGridProps,
                       getGutterProps,
                     }) => (
              <div className="grid grid-cols-[1fr,10px,1fr] grid-rows-[1fr,10px,1fr] h-full" {...getGridProps()}>
                <div className="row-span-full min-w-0 bg-[#1E1E1E] text-gray-200 flex flex-col overflow-hidden">
                  <TabBar
                    tabs={[
                      { label: 'Main.cpp', value: 'file' },
                    ]}
                    activeTab={"file"}
                    onTabSelect={tab => {}}
                  />
                  <div className="flex-1 overflow-hidden">
                    <Editor
                      theme="vs-dark"
                      language={"cpp"}
                      value={editorValue}
                      path="code"
                      onChange={(v, e) => {
                        console.log(editor.current);
                        console.log(editor.current);
                        setEditorValue(v)
                      }}
                      saveViewState={false}
                      options={{
                        minimap: { enabled: false },
                        automaticLayout: false,
                      }}
                      onMount={e => {
                        editor.current = e;
                        setTimeout(() => {
                          e.layout();
                          e.focus();
                        }, 0);
                      }}
                    />
                  </div>
                </div>
                <div
                  className="row-span-full col-start-2 cursor-[col-resize] bg-black" {...getGutterProps('column', 1)} />
                <div className="flex flex-col min-w-0 min-h-0 overflow-hidden">
                  <TabBar
                    tabs={[
                      { label: 'input', value: 'input' },
                    ]}
                    activeTab={"input"}
                    onTabSelect={tab => {}}
                  />
                  <div className="flex-1 bg-[#1E1E1E] text-white min-h-0 overflow-hidden">
                    <Editor
                      theme="vs-dark"
                      language={"plaintext"}
                      value={stdin}
                      saveViewState={false}
                      path="input"
                      onChange={(v, e) => setStdin(v)}
                      options={{
                        minimap: { enabled: false },
                        automaticLayout: false,
                      }}
                      onMount={e => {
                        inputEditor.current = e;
                        setTimeout(() => {
                          e.layout();
                        }, 0);
                      }}
                    />
                  </div>
                </div>
                <div className="cursor-[row-resize] bg-black" {...getGutterProps('row', 1)} />
                <div className="flex flex-col min-w-0 min-h-0 overflow-hidden">
                  <Output result={result} onMount={e => {
                    outputEditor.current = e;
                    setTimeout(() => {
                      e.layout();
                    }, 0);
                  }} />
                </div>
              </div>
            )}
          />
        </div>
        <div className="flex-shrink-0 relative text-sm bg-purple-900 text-purple-200 font-medium font-mono">
          <p className="text-center">
            v0.1.0. &copy; Nathan Wang
          </p>
          {result && (
            <span className="absolute right-0 top-0 bottom-0 pr-4">{result.status.description}, {result.time ?? "-"}s, {result.memory ?? "-"}KB</span>
          )}
        </div>
      </div>
    </div>
  )
}
