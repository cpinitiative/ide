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

import toast from 'react-hot-toast';

// note: all the toast notifications shoudl probably be moved up to MonacoEditor.tsx
const notify = (message: string) => {
  toast(message, {
    style: {
      borderRadius: '10px',
      background: '#333',
      color: '#fff',
    },
  });
};

export default function createLSPConnection() {
  notify('Connecting to server...');

  const url = createUrl('lsp.usaco.guide', 3000, '/sampleServer');
  let webSocket: WebSocket | null = new WebSocket(url);
  let languageClient: MonacoLanguageClient | null;

  webSocket.onopen = () => {
    // if webSocket is null, that means we closed the connection before we got a response from the server
    // though I don't think this is ever true?? whatever
    if (!webSocket) return;

    const socket = toSocket(webSocket);
    const reader = new WebSocketMessageReader(socket);
    const writer = new WebSocketMessageWriter(socket);
    languageClient = createLanguageClient({
      reader,
      writer,
    });
    languageClient.start();
    reader.onClose(() => {
      languageClient?.stop();
      languageClient = null;
    });
  };

  webSocket.addEventListener('message', event => {
    let message;
    try {
      message = JSON.parse(event.data);
    } catch (err) {
      console.error('Malformed message from LSP server:', event.data);
      return;
    }

    if (message.id === 0 && message.result.capabilities) {
      // assume this is the first message from the server
      // and that connection is successfully established
      notify('Connected');
    }
  });

  webSocket.addEventListener('close', event => {
    if (event.wasClean) {
      console.log('Connection closed cleanly');
    } else {
      console.error('Connection died');
    }

    notify('Connection closed');

    if (languageClient) {
      languageClient.stop();
      languageClient = null;
    }
  });

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

  function createUrl(hostname: string, port: number, path: string): string {
    const protocol = location.protocol === 'https:' ? 'wss' : 'wss';
    return normalizeUrl(`${protocol}://${hostname}:${port}${path}`);
  }

  return () => {
    if (!languageClient) {
      // possibly didn't conenct to websocket before exiting
      if (webSocket && webSocket.readyState === webSocket.CONNECTING) {
        webSocket.close();
        webSocket = null;
      }
    } else {
      languageClient.stop();
      languageClient = null;
    }
  };
}
