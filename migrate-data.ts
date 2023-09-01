import * as admin from 'firebase-admin';
import * as fs from 'fs';
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
          file[`c${key}`] = y;
          headless.dispose();
          res();
        });
      });
    } else {
      res();
    }
  });
};

let NEW_DATA = {};
// read from new_data.json, parse the json object, and store it in NEW_DATA
if (fs.existsSync('new_data.json')) {
  NEW_DATA = JSON.parse(fs.readFileSync('new_data.json').toString());
}
const ORIG_DATA = {};
const ORIG_DATA_BASE_SIZE = 0;

async function run(lastOne) {
  if (lastOne) {
    if (!NEW_DATA.hasOwnProperty(lastOne)) {
      throw new Error('???');
    }
    const keys = Object.keys(NEW_DATA);
    keys.sort();
    if (keys[Object.keys(NEW_DATA).length - 1] !== lastOne) {
      throw new Error('??? not last. last is ' + keys[keys.length - 1]);
    }
  }
  const queued_new_data = {};
  const filesRef = db.ref('/');
  let query = filesRef.orderByKey();
  if (lastOne) query = query.startAfter(lastOne);
  query = query.limitToFirst(1000);

  let uncompressed = 0;
  let compressed = 0;
  let lastKey = null;
  try {
    const snapshot = await query.once('value');
    if (snapshot.exists()) {
      const files = snapshot.val();
      const promises = [];
      for (const fileKey of Object.keys(files)) {
        const doStuff = async () => {
          const compressedData = { ...files[fileKey] };
          if (fileKey !== 'files') {
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
            if (compressedData['users']) {
              // some older files didn't have users / settings
              for (let user of Object.keys(compressedData['users'])) {
                for (let key of Object.keys(compressedData['users'][user])) {
                  if (key !== 'name' && key !== 'permission') {
                    delete compressedData['users'][user][key];
                  }
                }
              }
            }
            if (compressedData['state']) {
              const compressedState = await gzipBase64Encode(
                JSON.stringify(compressedData['state'])
              );
              delete compressedData['state'];
              compressedData.cstate = compressedState;
            }
            const optionalKeys = ['cscribble', 'cinput', 'cstate'];
            for (let key of optionalKeys) {
              if (
                compressedData.hasOwnProperty(key) &&
                compressedData[key].length > 5000
              ) {
                // console.log(
                //   'Key',
                //   key,
                //   'has length',
                //   compressedData[key].length,
                //   'for file',
                //   fileKey,
                //   '; deleting'
                // );
                delete compressedData[key];
              }
            }
          }
          queued_new_data[fileKey] = compressedData;
          ORIG_DATA[fileKey] = files[fileKey];
        };
        promises.push(doStuff());
        lastKey = fileKey;
      }
      await Promise.all(promises);
    } else {
      console.log('No files found');
      return null;
    }
  } catch (error) {
    console.error('Error fetching files:', error);
    return null;
  }
  NEW_DATA = { ...NEW_DATA, ...queued_new_data };
  fs.writeFileSync('new_data.json', JSON.stringify(NEW_DATA));
  console.log('finished writing up to and including', lastKey);
  return lastKey;
}

(async () => {
  let curKey = await run('-MxjNyx3k4So4sVMQFBH');
  while (curKey != null) {
    const regSize = JSON.stringify(ORIG_DATA).length + 1430993002;
    const compSize = JSON.stringify(NEW_DATA).length;
    console.log(
      'Processed',
      Object.keys(NEW_DATA).length,
      ' files. Currently on key',
      curKey,
      '. Ratio is ',
      compSize,
      '/',
      regSize,
      '=',
      compSize / regSize
    );
    curKey = await run(curKey);
  }
  console.log('DONE??', Object.keys(NEW_DATA).length);
})();
