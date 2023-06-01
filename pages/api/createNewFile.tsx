import { getDatabase, ServerValue } from 'firebase-admin/database';
import type { NextApiRequest, NextApiResponse } from 'next';
import firebaseApp from '../../src/firebaseAdmin';
import colorFromUserId from '../../src/scripts/colorFromUserId';

type RequestData = {
  workspaceName: string;
  userID: string;
  userName: string;
  defaultPermission: string;
  language: 'cpp' | 'java' | 'py';
  compilerOptions: {
    cpp: string;
    java: string;
    py: string;
  };
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
    !data.workspaceName ||
    !data.language ||
    !data.compilerOptions
  ) {
    res.status(400).json({
      message: 'Bad data',
    });
    return;
  }

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
        workspaceName: data.workspaceName,
        defaultPermission: data.defaultPermission,
        creationTime: ServerValue.TIMESTAMP,
        language: data.language,
        problem: null,
        compilerOptions: data.compilerOptions,
      },
    });
  const fileID: string = resp.key!;

  res.status(200).json({ fileID });
};
