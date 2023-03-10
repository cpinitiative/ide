import { getDatabase, ServerValue } from 'firebase-admin/database';
import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchProblemData } from '../../src/components/Workspace/Workspace';
import firebaseApp from '../../src/firebaseAdmin';
import colorFromUserId from '../../src/scripts/colorFromUserId';

type RequestData = {
  usacoID: string;
  userID: string;
  userName: string;
  defaultPermission: string;
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
  if (
    !data ||
    !data.userName ||
    !data.defaultPermission ||
    !data.userID ||
    !data.usacoID
  ) {
    res.status(400).json({
      message: 'Bad data',
    });
    return;
  }

  const problem = await fetchProblemData(data.usacoID);
  if (problem === null) {
    res.status(400).json({
      message: 'Could not identify problem ID.',
    });
    return;
  }

  const idToURLRef = getDatabase(firebaseApp)
    .ref('users')
    .child(data.userID)
    .child('usaco-id-to-file-id')
    .child('' + problem.id);

  const idToURLSnap = await idToURLRef.get();

  if (idToURLSnap.exists()) {
    res.status(200).json({
      fileID: idToURLSnap.val(),
    });
  } else {
    const resp = await getDatabase(firebaseApp)
      .ref('/files')
      .push({
        users: {
          [data.userID]: {
            name: data.userName,
            color: colorFromUserId(data.userID),
            permission: 'OWNER',
          },
        },
        settings: {
          workspaceName: problem.source + ': ' + problem.title,
          defaultPermission: data.defaultPermission,
          creationTime: ServerValue.TIMESTAMP,
          language: 'cpp',
          problem,
          compilerOptions: {
            cpp: '-std=c++17 -O2 -Wall -Wextra -Wshadow -Wconversion -Wfloat-equal -Wduplicated-cond -Wlogical-op',
            java: '',
            py: '',
          },
        },
      });
    const fileID: string = resp.key!;
    await idToURLRef.set(fileID);
    res.status(200).json({ fileID: fileID });
  }
};
