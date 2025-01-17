# Realtime Collaborative IDE

A realtime collaborative IDE with code execution, intellisense, and built-in USACO submissions. Designed primarily for Competitive Programming and USACO, with mobile support for coding on the go.

This IDE is built and maintained by [Nathan Wang](https://github.com/thecodingwizard) and [Benjamin Qi](https://github.com/bqi343/), and is part of the [Competitive Programming Initiative](https://joincpi.org/).

## Running Locally

This project uses the [Firebase Realtime Database](https://firebase.google.com/docs/database). [This tutorial](https://firebase.google.com/codelabs/firestore-web) is helpful (even though Cloud Firestore is not what's being used here). You'll need to install the [firebase CLI](https://firebase.google.com/docs/cli#install_the_firebase_cli) and Node.js 18.

```
npm install
npm run dev
```

`npm run dev` will start a Firebase emulator for you. By default, the dev server uses a local firebase emulator and the production YJS server. To change these settings, edit `src/dev_constants.ts`.

Note: If you get a firebase emulators timeout error on Mac, see [firebase/firebase-tools#2379 (comment)](https://github.com/firebase/firebase-tools/issues/2379#issuecomment-951884721) and Issue #67 in this repo.

### Playwright Tests

```
npm run dev  # Start the dev server in a separate terminal
npm run test
```

We use Playwright for our e2e tests. The VSCode extension for Playwright can be useful for debugging tests.

Note: If you are using the production YJS servers, the Copy Files test will fail because the `YJS_SECURITY_KEY` environment variable needs to be set. For local development, feel free to ignore the Copy Files CI test. Alternatively, you can run a local YJS server (see the `ide-yjs` repository) and use that instead.

### Configuring Firebase

You can update the Firebase configuration (if you want to use a custom firebase project, for example) by modifying `pages/_app.tsx`.

## Tech Stack

- Code execution through a custom [Serverless Online Judge](https://github.com/cpinitiative/online-judge)
- Realtime collaboration with [YJS](https://github.com/yjs/yjs)
- Monaco Editor (desktop)
- Codemirror 6 Editor (mobile)
- Code intellisense with [LSP servers running on Modal](https://github.com/cpinitiative/ide-lsp-modal)
- Next.js
- Tailwind CSS
- Firebase Realtime Database
- Playwright for end-to-end testing

Infrastructure monitoring is generously provided by Datadog's OSS program.

<img src="./public/dd_logo_v_rgb.svg" width="200" />

## Contact Info

If you have any questions, please open an issue or reach out to us at usacoguide@gmail.com.

## Misc Notes

### Firepad / YJS Browser Incompatibility

See https://github.com/FirebaseExtended/firepad/issues/315 and https://github.com/yjs/y-monaco/issues/6.

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

### Monaco Workers

Run

```
mkdir ./public/monaco-workers
cp -r ./node_modules/monaco-editor-workers/dist/workers/editorWorker* ./public/monaco-workers
```

This is used by MonacoEditor.tsx (Monaco uses web workers).

### Troubleshooting `firebase emulators:exec`

If `firebase emulators:exec` fails for unknown reason, try running `firebase emulators:exec "yarn playwright test" || cat firebase-debug.log`.

### Tests that should be written

- Compile error, stdout, stderr
- Too large input
- Too large output
- Classrooms
- Copying files (#64, this broke already lol)

### Updating Monaco Editor

Make sure Monaco is compatible with `monaco-languageclient`!! https://github.com/TypeFox/monaco-languageclient/blob/main/docs/versions-and-history.md#monaco-editor--codingamemonaco-vscode-api-compatibility-table

1. `npm install monaco-editor@latest`
2. Modify `node_modules/monaco-editor/esm/vs/editor/standalone/browser/standaloneServices.js`:

   ```
   -        return (isLinux || isMacintosh) ? '\n' : '\r\n';
   +        return (isLinux || isMacintosh) ? '\n' : '\n';
   ```

   See `patches/monaco-editor+??.patch` for more details

3. `npx patch-package monaco-editor`
4. Commit the updated patch to Github
5. `rm -r ./public/monaco-workers`
6. `mkdir ./public/monaco-workers`
7. `cp -r ./node_modules/monaco-editor-workers/dist/workers/editorWorker* ./public/monaco-workers`
8. Test that everything works: LSP, browser sync, cross-platform sync, etc
