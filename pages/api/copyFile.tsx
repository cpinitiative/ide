import type { NextApiRequest, NextApiResponse } from 'next';
import { isFirebaseId } from '../../src/editorUtils';
import colorFromUserId from '../../src/scripts/colorFromUserId';
import { getAuth } from 'firebase-admin/auth';
import firebaseApp from '../../src/firebaseAdmin';
import { getDatabase, ServerValue } from 'firebase-admin/database';
import { SHOULD_USE_DEV_YJS_SERVER } from '../../src/dev_constants';

type RequestData = {
  idToken: string;
  fileID: string;
};
type ResponseData =
  | {
      fileID: string;
    }
  | {
      message: string; // error
    };

export default async (
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) => {
  const data: RequestData = req.body;

  // todo validate?
  if (!data || !data.idToken || !data.fileID || !isFirebaseId(data.fileID)) {
    res.status(400).json({
      message: 'Bad data',
    });
    return;
  }

  let decodedToken;
  try {
    decodedToken = await getAuth(firebaseApp).verifyIdToken(data.idToken);
  } catch (e) {
    res.status(400).json({
      message: 'Error decoding ID Token',
    });
    console.error(e);
    return;
  }
  const uid = decodedToken.uid;
  const displayName = decodedToken.name;

  const fileDataResp = await getDatabase(firebaseApp)
    .ref(`files/-${data.fileID}`)
    .get();
  const fileData = await fileDataResp.val();
  if (!fileData) {
    res.status(200).send({ message: 'File Not Found' });
    return;
  }

  const fileSettings = fileData.settings;

  if (
    fileSettings.defaultPermission !== 'READ' &&
    fileSettings.defaultPermission !== 'READ_WRITE'
  ) {
    const userPerm = fileData.users?.[uid]?.permission;
    if (
      userPerm !== 'READ' &&
      userPerm !== 'READ_WRITE' &&
      userPerm !== 'OWNER'
    ) {
      res.status(403).send({ message: 'This file is private.' });
    }
  }

  const ref = getDatabase(firebaseApp)
    .ref('/files')
    .push({
      users: {
        [uid]: {
          name: displayName,
          color: colorFromUserId(uid),
          permission: 'OWNER',
        },
      },
      settings: {
        ...fileData.settings,
        creationTime: ServerValue.TIMESTAMP,
      },
    });
  const fileID: string = ref.key!;

  const copyYjsPromies = ['cpp', 'java', 'py', 'input', 'scribble'].map(key => {
    const HOST_URL = SHOULD_USE_DEV_YJS_SERVER
      ? 'http://0.0.0.0:1234'
      : 'https://yjs.usaco.guide';
    return fetch(`${HOST_URL}/copyFile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        securityKey: process.env.YJS_SECURITY_KEY,
        sourceFile: `-${data.fileID}.${key}`,
        targetFile: `${fileID}.${key}`,
      }),
    })
      .then(resp => resp.text())
      .then(resp => {
        // it's ok if source file doesn't exist -- maybe the file only had Java and not C++
        if (resp !== 'OK' && resp !== "Source file doesn't exist") {
          throw new Error(
            'Failed to copy file ' + `-${data.fileID}.${key}` + ': ' + resp
          );
        }
      });
  });

  await Promise.all([ref, ...copyYjsPromies]);

  res.status(200).json({ fileID: fileID.substr(1) });
};
