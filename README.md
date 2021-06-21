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

---

Playwright debugging (for windows):

```
set PWDEBUG=1 && yarn test
```

to unset: `set PWDEBUG=`.

---

If `firebase emulators:exec` fails for unknown reason: `firebase emulators:exec "yarn test" || cat firebase-debug.log`

---

nginx configuration for larger than 1MB file size:

Add

```
      - ./srv/nginx/conf.d:/etc/nginx/conf.d
```

to docker-compose.yml under services > nginx > volumes. Then, rebuild the app:

```
docker-compose stop nginx
docker-compose rm nginx
docker-compose up -d nginx
```

Then, go to ./srv/.../conf.d, and add at the very bottom:

```
client_max_body_size 100M;
```

Then, reload the nginx configuration:

```
docker ps
docker exec <nginx-container-name-or-id> nginx -s reload
```

I think every time nginx restarts the configuration gets overwritten...

---

## Running Locally

This project uses the [Firebase Realtime Database](https://firebase.google.com/docs/database). [This tutorial](https://firebase.google.com/codelabs/firestore-web) is helpful (even though Cloud Firestore is not what's being used here). You'll need to install the [firebase CLI](https://firebase.google.com/docs/cli#install_the_firebase_cli).

After setting up, use the following commands to start running locally:

```
firebase emulators:start
yarn dev
```