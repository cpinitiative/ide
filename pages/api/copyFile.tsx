import type { NextApiRequest, NextApiResponse } from 'next';
import { isFirebaseId } from '../../src/editorUtils';
import colorFromUserId from '../../src/scripts/colorFromUserId';
import { getAuth } from 'firebase-admin/auth';
import firebaseApp from '../../src/firebaseAdmin';
import { getDatabase, ServerValue } from 'firebase-admin/database';

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
    .ref(`-${data.fileID}`)
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

  const resp = await getDatabase(firebaseApp)
    .ref('/')
    .push({
      users: {
        [uid]: {
          name: displayName,
          color: colorFromUserId(uid),
          permission: 'OWNER',
        },
      },
      'editor-cpp': fileData['editor-cpp'],
      'editor-java': fileData['editor-java'],
      'editor-py': fileData['editor-py'],
      input: fileData.input,
      scribble: fileData.scribble,
      settings: {
        ...fileData.settings,
        creationTime: ServerValue.TIMESTAMP,
      },
    });
  const fileID: string = resp.key!;
  res.status(200).json({ fileID: fileID.substr(1) });
};
