# Realtime Collaborative IDE

A realtime collaborative IDE with code execution, input/output, and built-in USACO submissions. Designed primarily for Competitive Programming and USACO, with mobile support for coding on the go.

This IDE is built and maintained by [Nathan Wang](https://github.com/thecodingwizard) and [Benjamin Qi](https://github.com/bqi343/), and is part of the [Competitive Programming Initiative](https://joincpi.org/).

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

### Configuring Judge0 nginx file size

By default Judge0's nginx setup only supports files up to 1MB in size, which is often exceeded for large input files. To change this behavior, first add

```
      - ./srv/nginx/conf.d:/etc/nginx/conf.d
```

to docker-compose.yml under `services > nginx > volumes`. Then, rebuild the app:

```
docker-compose stop nginx
docker-compose rm nginx
docker-compose up -d nginx
```

Then, go to `./srv/.../conf.d`, and add at the very bottom, add:

```
client_max_body_size 100M;
```

Finally, reload the nginx configuration:

```
docker ps
docker exec <nginx-container-name-or-id> nginx -s reload
```

Unfortunately, I think every time nginx restarts the configuration gets overwritten. Haven't figured out a better way to do this; suggestions welcome!
