import { getDatabase, ServerValue } from 'firebase-admin/database';
import type { NextApiRequest, NextApiResponse } from 'next';
import firebaseApp from '../../src/firebaseAdmin';
import colorFromUserId from '../../src/scripts/colorFromUserId';

type RequestData = {
  workspaceName: string;
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
    !data.workspaceName
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
        language: 'cpp',
        problem: null,
        compilerOptions: {
          cpp: '-std=c++17 -O2 -Wall -Wextra -Wshadow -Wconversion -Wfloat-equal -Wduplicated-cond -Wlogical-op',
          java: '',
          py: '',
        },
      },
    });
  const fileID: string = resp.key!;
  res.status(200).json({ fileID });
};
