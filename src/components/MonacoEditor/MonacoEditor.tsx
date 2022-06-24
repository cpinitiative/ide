import { useEffect, useLayoutEffect, useRef } from 'react';

import 'monaco-editor/esm/vs/editor/editor.all.js';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import 'monaco-editor/esm/vs/basic-languages/cpp/cpp.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/java/java.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/python/python.contribution.js';
import { buildWorkerDefinition } from 'monaco-editor-workers';
import { initVimMode } from 'monaco-vim';
import {
  MonacoLanguageClient,
  CloseAction,
  ErrorAction,
  MonacoServices,
  MessageTransports,
} from 'monaco-languageclient';
import {
  toSocket,
  WebSocketMessageReader,
  WebSocketMessageWriter,
} from 'vscode-ws-jsonrpc';
import normalizeUrl from 'normalize-url';
import { getOrCreateModel, usePrevious, useUpdate } from './utils';
import { EditorProps } from './monaco-editor-types';

buildWorkerDefinition(
  'monaco-workers',
  new URL('', window.location.href).href,
  false
);

monaco.languages.register({
  id: 'cpp',
  extensions: ['.cpp'],
  aliases: ['cpp'],
});

MonacoServices.install();

const viewStates = new Map();

// @ts-ignore todo find a better way to do this
window.monaco = monaco;

export default function MonacoEditor({
  path,
  theme,
  options,
  saveViewState = true,
  onMount,
  language,
  className,
  value = '',
  onBeforeDispose,
  vim = false,
  lspEnabled = false,
}: EditorProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    const modelPath = `file:///home/thecodingwizard/${path ?? 'default'}`;

    editorRef.current = monaco.editor.create(
      ref.current!,
      {
        model: getOrCreateModel(monaco, value, language, modelPath),
        automaticLayout: true,
        theme: theme,
        lightbulb: {
          enabled: true,
        },
        language: language,
        ...options,
      },
      {}
    );

    if (saveViewState) {
      editorRef.current.restoreViewState(viewStates.get(modelPath));
    }

    if (onMount) {
      onMount(editorRef.current, monaco);
    }

    return () => {
      if (editorRef.current) {
        if (onBeforeDispose) onBeforeDispose();

        editorRef.current.getModel()?.dispose();
        // this throws some model is already disposed error? so ig just don't?
        editorRef.current.dispose();
      } else {
        console.error("Shouldn't happen??");
      }
    };
  }, []);

  useEffect(() => {
    if (lspEnabled) {
      const url = createUrl('52.180.147.96', 3000, '/sampleServer');
      const webSocket = new WebSocket(url);
      let languageClient: MonacoLanguageClient;

      webSocket.onopen = () => {
        const socket = toSocket(webSocket);
        const reader = new WebSocketMessageReader(socket);
        const writer = new WebSocketMessageWriter(socket);
        languageClient = createLanguageClient({
          reader,
          writer,
        });
        languageClient.start();
        // todo add alive check
        reader.onClose(() => {
          languageClient.stop();
        });
      };

      function createLanguageClient(
        transports: MessageTransports
      ): MonacoLanguageClient {
        return new MonacoLanguageClient({
          name: 'Sample Language Client',
          clientOptions: {
            // use a language id as a document selector
            documentSelector: ['cpp'],
            // disable the default error handler
            errorHandler: {
              error: () => ({ action: ErrorAction.Continue }),
              closed: () => ({ action: CloseAction.DoNotRestart }),
            },
          },
          // create a language client connection from the JSON RPC connection on demand
          connectionProvider: {
            get: () => {
              return Promise.resolve(transports);
            },
          },
        });
      }

      function createUrl(hostname: string, port: number, path: string): string {
        const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
        return normalizeUrl(`${protocol}://${hostname}:${port}${path}`);
      }

      return () => {
        languageClient?.stop();
      };
    }
  }, [lspEnabled]);

  useEffect(() => {
    if (vim) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let editorMode: any;

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const statusNode = document.querySelector('.status-node');
      editorMode = initVimMode(editorRef.current, statusNode);

      return () => editorMode.dispose();
    }
  }, [vim]);

  /* Note: path update handler needs to run first. Otherwise, changing both path and language
     at the same time will result in the wrong language being used */
  const previousPath = usePrevious(path);
  useUpdate(() => {
    const model = getOrCreateModel(monaco, value, language, path ?? 'default');

    if (model !== editorRef.current!.getModel()) {
      saveViewState &&
        viewStates.set(previousPath, editorRef.current!.saveViewState());
      editorRef.current!.setModel(model);

      saveViewState &&
        editorRef.current!.restoreViewState(viewStates.get(path));
    }
  }, [path]);

  useUpdate(() => {
    if (editorRef.current!.getOption(monaco.editor.EditorOption.readOnly)) {
      editorRef.current!.setValue(value);
    } else {
      if (value !== editorRef.current!.getValue()) {
        editorRef.current!.executeEdits('', [
          {
            range: editorRef.current!.getModel()!.getFullModelRange(),
            text: value,
            forceMoveMarkers: true,
          },
        ]);

        editorRef.current!.pushUndoStop();
      }
    }
  }, [value]);

  useUpdate(() => {
    // theme is global
    monaco.editor.setTheme(theme ?? 'vs-dark');
  }, [theme]);

  useUpdate(() => {
    monaco.editor.setModelLanguage(
      editorRef.current!.getModel()!,
      language ?? 'plaintext'
    );
  }, [language]);

  useUpdate(() => {
    // console.log('updating options'); // todo this runs way too often
    editorRef.current!.updateOptions(options ?? {});
  }, [options]);

  return (
    <div className="flex relative h-full">
      <div className={className} ref={ref} style={{ width: '100%' }}></div>
    </div>
  );
}
