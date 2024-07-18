import {
  MonacoLanguageClient,
  CloseAction,
  ErrorAction,
  MessageTransports,
} from 'monaco-languageclient';
import {
  toSocket,
  WebSocketMessageReader,
  WebSocketMessageWriter,
} from 'vscode-ws-jsonrpc';
import normalizeUrl from 'normalize-url';

import toast from 'react-hot-toast';
import { useEffect, useState } from 'react';

// note: all the toast notifications should probably be moved up to MonacoEditor.tsx
const notify = (message: string) => {
  toast(message, {
    style: {
      borderRadius: '10px',
      background: '#333',
      color: '#fff',
    },
  });
};

function createLSPConnection(
  language: 'cpp' | 'python',
  compiler_options: string | null
) {
  if (language !== 'cpp' && language !== 'python') {
    throw new Error('Unsupported LSP language: ' + language);
  }

  notify('Connecting to server...');
  let url = `wss://thecodingwizard--lsp-server-main.modal.run:443/${
    language === 'cpp' ? 'clangd' : 'pyright'
  }`;
  if (compiler_options) {
    url += `?compiler_options=${encodeURIComponent(compiler_options)}`;
  }

  let webSocket: WebSocket | null = new WebSocket(url);
  let languageClient: MonacoLanguageClient | null;

  webSocket.addEventListener('open', () => {
    const socket = toSocket(webSocket!);
    const reader = new WebSocketMessageReader(socket);
    const writer = new WebSocketMessageWriter(socket);
    languageClient = createLanguageClient({
      reader,
      writer,
    });
    languageClient.start();
  });

  webSocket.addEventListener('message', event => {
    let message;
    try {
      message = JSON.parse(event.data);
    } catch (err) {
      console.error('Malformed message from LSP server:', event.data);
      return;
    }
    if (!webSocket) return;
    if (message.id === 0 && message.result?.capabilities) {
      // assume this is the first message from the server
      // and that connection is successfully established
      notify('Connected');
    }
  });

  let weClosedWebsocketConnection = false;
  webSocket.addEventListener('close', event => {
    if (languageClient) {
      languageClient.stop();
      languageClient = null;
    }

    if (weClosedWebsocketConnection) return;

    if (event.wasClean) {
      console.log('Connection closed cleanly');
    } else {
      console.error('Connection died');
    }

    if (event.reason) {
      notify('Connection closed: ' + event.reason);
    } else if (event.wasClean) {
      notify('Connection closed');
    } else {
      notify('Connection closed unexpectedly');
    }
  });

  function createLanguageClient(
    transports: MessageTransports
  ): MonacoLanguageClient {
    return new MonacoLanguageClient({
      name: 'Sample Language Client',
      clientOptions: {
        // use a language id as a document selector
        documentSelector: [language],
        // disable the default error handler
        errorHandler: {
          error: (error, message, count) => {
            console.log(
              'Got error from monaco language client error handler',
              error,
              message,
              count
            );
            return {
              action: ErrorAction.Continue,
            };
          },
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

  function dispose() {
    if (!languageClient) {
      // possibly didn't connect to websocket before exiting
      if (webSocket && webSocket.readyState === webSocket.CONNECTING) {
        webSocket.close();
        webSocket = null;
      }
    } else {
      languageClient.stop();
      languageClient = null;
    }
    weClosedWebsocketConnection = true;
  }
  return dispose;
}

export default function useLSP(
  language: string,
  lspOptions: { compilerOptions: string | null } | null
) {
  useEffect(() => {
    if (lspOptions && (language === 'cpp' || language === 'python')) {
      return createLSPConnection(language, lspOptions.compilerOptions);
    }
  }, [language, lspOptions?.compilerOptions]);
}
