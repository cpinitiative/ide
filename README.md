# Realtime Collaborative IDE

A realtime collaborative IDE with code execution, intellisense, and built-in USACO submissions. Designed primarily for Competitive Programming and USACO, with mobile support for coding on the go.

This IDE is built and maintained by [Nathan Wang](https://github.com/thecodingwizard) and [Benjamin Qi](https://github.com/bqi343/), and is part of the [Competitive Programming Initiative](https://joincpi.org/).

## Running Locally

This project uses the [Firebase Realtime Database](https://firebase.google.com/docs/database). [This tutorial](https://firebase.google.com/codelabs/firestore-web) is helpful (even though Cloud Firestore is not what's being used here). You'll need to install the [firebase CLI](https://firebase.google.com/docs/cli#install_the_firebase_cli) and [Yarn](https://classic.yarnpkg.com/en/docs/install).

```
yarn install
FIREBASE_AUTH_EMULATOR_HOST="127.0.0.1:9099" yarn dev
# in a separate tab. make sure you are using emulators iff shouldUseEmulator is true!
firebase emulators:start
```

Note that FIREBASE_AUTH_EMULATOR_HOST must be set; otherwise you'll get a "Firebase ID token has no kid claim" error message when a nextjs function tries to decode a firebase auth token.

Also, if you do not want to run the yjs server locally, change the yjs URLs in
`RealtimeEditor.tsx` and `copyFile.tsx` to point to the production one
(`yjs.usaco.guide`).

Note: If you get a firebase emulators timeout error on Mac, see [firebase/firebase-tools#2379 (comment)](https://github.com/firebase/firebase-tools/issues/2379#issuecomment-951884721) and Issue #67 in this repo.

### Playwright Tests

```
yarn playwright test
```

### Configuring Firebase

You can update the Firebase configuration (if you want to use a custom firebase project, for example) by modifying `pages/_app.tsx`. There, you can also set `shouldUseEmulator` to `false` if you don't want to use the firebase emulator.

## Tech Stack

- Code execution through a custom [Serverless Online Judge](https://github.com/cpinitiative/online-judge)
- Realtime collaboration with [YJS](https://github.com/yjs/yjs)
- Monaco Editor
- [monaco-languageclient](https://github.com/TypeFox/monaco-languageclient) with `clangd-12` for LSP
- React
- Jotai
- Next.js
- Typescript
- Tailwind CSS
- Firebase Realtime Database
- Playwright for end-to-end testing
- Deployed with [Vercel](https://vercel.com/?utm_source=cp-initiative&utm_campaign=oss)

## Contact Info

If you have any questions, please open an issue or reach out to us at usacoguide@gmail.com.

## Misc Notes

### LSP Installation

We used Ubuntu 20.04 on Azure, B2s. Open port 3000 on the Azure firewall rules.

#### 1. Install `clangd-12`

```
sudo apt update
sudo apt install clangd-12
```

#### 2. Install node

```
sudo apt install nodejs npm
sudo npm install -g n
sudo n install lts
sudo n                       # choose v16 or whatever lts is
```

#### 3. Setup Server

```
git clone https://github.com/TypeFox/monaco-languageclient.git

cd packages/examples/node
```

Modify `server.ts`:

```ts
import * as rpc from 'vscode-ws-jsonrpc/cjs';
import { launch } from './json-server-launcher';
import fs from 'fs';
import * as https from 'https';

const privateKey = fs.readFileSync(
  '/etc/letsencrypt/live/lsp.usaco.guide/privkey.pem',
  'utf8'
);
const certificate = fs.readFileSync(
  '/etc/letsencrypt/live/lsp.usaco.guide/fullchain.pem',
  'utf8'
);

process.on('uncaughtException', function (err: any) {
  console.error('Uncaught Exception: ', err.toString());
  if (err.stack) {
    console.error(err.stack);
  }
});

// create the express application
const app = express();
// server the static content, i.e. index.html
app.use(express.static(__dirname));
// start the server
//const server = app.listen(3000);
const httpsServer = https.createServer(
  { key: privateKey, cert: certificate },
  app
);
httpsServer.listen(3000);
// create the web socket
const wss = new ws.Server({
  noServer: true,
  perMessageDeflate: false,
});
httpsServer.on(
  'upgrade',
  (request: http.IncomingMessage, socket: net.Socket, head: Buffer) => {
    // eslint-disable-next-line n/no-deprecated-api
    const pathname = request.url ? url.parse(request.url).pathname : undefined;
    if (pathname === '/sampleServer') {
      wss.handleUpgrade(request, socket, head, webSocket => {
        const socket: rpc.IWebSocket = {
          send: content =>
            webSocket.send(content, error => {
              if (error) {
                throw error;
              }
            }),
          onMessage: cb => webSocket.on('message', cb),
          onError: cb => webSocket.on('error', cb),
          onClose: cb => webSocket.on('close', cb),
          dispose: () => webSocket.close(),
        };
        // launch the server when the web socket is opened
        if (webSocket.readyState === webSocket.OPEN) {
          launch(socket);
        } else {
          webSocket.on('open', () => launch(socket));
        }
      });
    }
  }
);
```

Modify `json-server-launcher.ts`:

```ts
//import * as path from 'path';
import * as rpc from 'vscode-ws-jsonrpc/cjs';
import * as server from 'vscode-ws-jsonrpc/cjs/server';
import * as lsp from 'vscode-languageserver';
import { start } from './json-server';
import { Message } from 'vscode-languageserver';

export function launch(socket: rpc.IWebSocket) {
  const reader = new rpc.WebSocketMessageReader(socket);
  const writer = new rpc.WebSocketMessageWriter(socket);
  const asExternalProccess =
    process.argv.findIndex(value => value === '--external') !== -1;
  if (asExternalProccess) {
    // start the language server as an external process
    //const extJsonServerPath = path.resolve(__dirname, 'ext-json-server.js');
    const socketConnection = server.createConnection(reader, writer, () =>
      socket.dispose()
    );
    //const serverConnection = server.createServerProcess('JSON', 'node', [extJsonServerPath]);
    const serverConnection = server.createServerProcess('CPP', 'clangd-12');
    if (serverConnection) {
      server.forward(socketConnection, serverConnection, message => {
        if (Message.isRequest(message)) {
          if (message.method === lsp.InitializeRequest.type.method) {
            const initializeParams = message.params as lsp.InitializeParams;
            initializeParams.processId = process.pid;
          }
        }
        return message;
      });
    }
  } else {
    // start the language server inside the current process
    start(reader, writer);
  }
}
```

Then:

```
# "cannot find module 'semver' error when running npm install?
# See https://stackoverflow.com/questions/33870520/npm-install-cannot-find-module-semver
npm install
npm run build
node dist/server.js --external
```

To keep the server running:

```
sudo apt install tmux
tmux
node dist/server.js --external

# https://askubuntu.com/questions/8653/how-to-keep-processes-running-after-ending-ssh-session
ctrl+b d

# later, to get back into the session
tmux attach -t 0
```

### (Potential) Firepad / YJS Browser Incompatibility ([firepad#315](https://github.com/FirebaseExtended/firepad/issues/315))

Replace something similar to

```javascript
var n = this.configurationService.getValue('files.eol', {
  overrideIdentifier: t,
  resource: e,
});
return n && 'auto' !== n ? n : d.isLinux || d.isMacintosh ? '\n' : '\r\n';
```

with

```javascript
var n = this.configurationService.getValue('files.eol', {
  overrideIdentifier: t,
  resource: e,
});
return n && 'auto' !== n ? n : d.isLinux || d.isMacintosh ? '\n' : '\n';
```

using `package-patch`.

This was an issue for Firepad; I don't know if this is an issue for YJS, but we kept the change regardless.

### Monaco Workers

Run

```
mkdir ./public/monaco-workers
cp -r ./node_modules/monaco-editor-workers/dist/workers/editorWorker* ./public/monaco-workers
```

This is used by MonacoEditor.tsx (Monaco uses web workers).

### Playwright Debugging

We use the [Playwright Test test runner](https://playwright.dev/docs/intro), not the Playwright library. If you use VSCode, the Playwright Test test runner extension for VSCode is really nice.

### Troubleshooting `firebase emulators:exec`

If `firebase emulators:exec` fails for unknown reason, try running `firebase emulators:exec "yarn playwright test" || cat firebase-debug.log`.

### Tests that should be written

- Compile error, stdout, stderr
- Too large input
- Too large output
- Classrooms
- Copying files (#64, this broke already lol)
