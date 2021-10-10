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

### Configuring Firebase

You can update the Firebase configuration (if you want to use a custom firebase project, for example) by modifying `src/components/WorkspaceInitializer.tsx`. There, you can also set `shouldUseEmulator` to `false` if you don't want to use the firebase emulator.

## Tech Stack

- Code execution supported through [Judge0](https://judge0.com/)
- Realtime collaboration with [Firepad](https://firepad.io/)
- Monaco Editor
- React
- Jotai
- Vite
- Typescript
- Tailwind CSS
- Firebase Realtime Database
- Jest and Playwright for end-to-end testing
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

in `public/vs/editor/editor.main.js`. Then, patch `@monaco-editor/loader` to fetch the appropriate files (ie. fetch monaco from our server instead of jsdelivr):

```javascript
import loader from '@monaco-editor/loader';
loader.config({
  paths: {
    vs: '/vs',
  },
});
```

### Enabling Playwright Debugging

Windows:

```
set PWDEBUG=1 && yarn test

to unset debugging:
set PWDEBUG=
```

### Troubleshooting `firebase emulators:exec`

If `firebase emulators:exec` fails for unknown reason, try running `firebase emulators:exec "yarn test" || cat firebase-debug.log`.

### Tests that should be written

- USACO Judge with multiple sample inputs: http://usaco.org/index.php?page=viewproblem2&cpid=1131

  ```
  import java.io.BufferedReader;
  import java.io.IOException;
  import java.io.InputStreamReader;
  import java.util.Arrays;
  import java.util.Comparator;
  import java.util.StringTokenizer;

  public class AcowdemiaI {

      static int hIndex(Integer[] papers) {
          int h = papers.length;
          while (h > 0 && papers[h - 1] < h) {
              h--;
          }
          return h;
      }

      public static void main(String[] args) throws IOException {
          BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
          StringTokenizer tokenizer = new StringTokenizer(in.readLine());
          int n = Integer.parseInt(tokenizer.nextToken());
          int l = Integer.parseInt(tokenizer.nextToken());
          Integer[] papers = new Integer[n];
          tokenizer = new StringTokenizer(in.readLine());
          for (int j = 0; j < n; j++) {
              papers[j] = Integer.parseInt(tokenizer.nextToken());
          }
          Arrays.sort(papers, Comparator.reverseOrder());
          int h = hIndex(papers);
          if (h != n) {
              for (int j = h; j >= 0 && j > h - l; j--) {
                  papers[j]++;
              }
          }
          Arrays.sort(papers, Comparator.reverseOrder());
          System.out.println(hIndex(papers));
      }
  }
  ```

- Compile error, stdout, stderr
- Too large input
- Too large output
