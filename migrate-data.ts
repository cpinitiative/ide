import * as admin from 'firebase-admin';
// @ts-ignore
import * as firepad from 'firepad';

admin.initializeApp({
  credential: admin.credential.cert('./adminkey.json'),
  databaseURL: 'https://cp-ide-default-rtdb.firebaseio.com',
});

import * as zlib from 'zlib';

const db = admin.database();

async function gzipBase64Encode(input) {
  return new Promise((resolve, reject) => {
    zlib.gzip(input, (err, gzippedBuffer) => {
      if (err) {
        reject(err);
      } else {
        const base64Encoded = gzippedBuffer.toString('base64');
        resolve(base64Encoded);
      }
    });
  });
}

const processKey = (key, fileKey, file) => {
  return new Promise<void>((res, rej) => {
    if (file[key]) {
      delete file[key];
      const ref = db.ref(`/${fileKey}/${key}`);
      const headless = new firepad.Headless(ref);
      headless.getText(x => {
        gzipBase64Encode(x).then(y => {
          file[`compressed-${key}`] = y;
          res();
        });
      });
    } else {
      res();
    }
  });
};

async function fetchFirst50Files() {
  const filesRef = db.ref('/');
  const query = filesRef.orderByKey().limitToFirst(200);

  let uncompressed = 0;
  let compressed = 0;
  try {
    const snapshot = await query.once('value');
    if (snapshot.exists()) {
      const files = snapshot.val();
      for (const fileKey of Object.keys(files)) {
        const compressedData = { ...files[fileKey] };
        const keys = [
          'editor-cpp',
          'editor-java',
          'editor-py',
          'scribble',
          'input',
        ];
        await Promise.all(
          keys.map(key => processKey(key, fileKey, compressedData))
        );
        for (let user of Object.keys(compressedData['users'])) {
          for (let key of Object.keys(compressedData['users'][user])) {
            if (key !== 'name' && key !== 'permission') {
              delete compressedData['users'][user][key];
            }
          }
        }
        const regSize = JSON.stringify(files[fileKey]).length;
        const compSize = JSON.stringify(compressedData).length;
        uncompressed += regSize;
        compressed += compSize;
        console.log(
          compressed,
          '/',
          uncompressed,
          '=',
          compressed / uncompressed
        );
      }
    } else {
      console.log('No files found');
      return null;
    }
    console.log(compressed, '/', uncompressed, '=', compressed / uncompressed);
  } catch (error) {
    console.error('Error fetching files:', error);
  }
}

fetchFirst50Files();
