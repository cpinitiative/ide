# Realtime Collaborative IDE

A realtime collaborative IDE with code execution and input/output. Designed primarily for Competitive Programming and USACO, with basic mobile support for coding on the go.

Code execution supported through [Judge0](https://judge0.com/). Realtime collaboration with [Firepad](https://firepad.io/).

---

Note: To fix https://github.com/FirebaseExtended/firepad/issues/315, a very questionable change was done:

Replace something like

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

in `public/vs/editor/editor.main.js`. Then, patch `@monaco-editor/loader` to fetch the appropriate files (ie. fetch from our server instead of jsdelivr).
