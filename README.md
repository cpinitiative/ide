# Realtime Collaborative IDE

A realtime collaborative IDE with code execution, input/output, and built-in USACO submissions. Designed primarily for Competitive Programming and USACO, with mobile support for coding on the go.

This IDE is built and maintained by [Nathan Wang](https://github.com/thecodingwizard) and [Benjamin Qi](https://github.com/bqi343/), and is part of the [Competitive Programming Initiative](https://joincpi.org/).

## Running Locally

This project uses the [Firebase Realtime Database](https://firebase.google.com/docs/database). [This tutorial](https://firebase.google.com/codelabs/firestore-web) is helpful (even though Cloud Firestore is not what's being used here). You'll need to install the [firebase CLI](https://firebase.google.com/docs/cli#install_the_firebase_cli) and [Yarn](https://classic.yarnpkg.com/en/docs/install).

```
yarn install
firebase emulators:start
yarn dev
```

Note: If you get a firebase emulators timeout error on Mac, see [firebase/firebase-tools#2379 (comment)](https://github.com/firebase/firebase-tools/issues/2379#issuecomment-951884721) and Issue #67 in this repo.

### Configuring Firebase

You can update the Firebase configuration (if you want to use a custom firebase project, for example) by modifying `src/components/WorkspaceInitializer.tsx`. There, you can also set `shouldUseEmulator` to `false` if you don't want to use the firebase emulator.

## Tech Stack

- Code execution through AWS Lambda
- Realtime collaboration with [Firepad](https://firepad.io/)
- Monaco Editor
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

### Firepad Browser Incompatibility ([firepad#315](https://github.com/FirebaseExtended/firepad/issues/315))

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
return '\n';
```

using package-patch.

Run

```
mkdir ./public/monaco-workers
cp -r ./node_modules/monaco-editor-workers/dist/workers/editorWorker* ./public/monaco-workers
```

needed for monacoeditor.tsx to add workers

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
