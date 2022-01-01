import type { NextApiRequest, NextApiResponse } from 'next';
import colorFromUserId from '../../src/scripts/colorFromUserId';

type RequestData = {
  workspaceName: string;
  userID: string;
  userName: string;
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
  if (!data || !data.userName || !data.userID || !data.workspaceName) {
    res.status(400).json({
      message: 'Bad data',
    });
    return;
  }

  const resp = await fetch(
    `http://127.0.0.1:9000/classrooms/.json?ns=cp-ide-default-rtdb`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        users: {
          [data.userID]: {
            name: data.userName,
            color: colorFromUserId(data.userID),
            permission: 'OWNER',
          },
        },
        settings: {
          workspaceName: data.workspaceName,
          defaultPermission: 'PRIVATE',
          creationTime: {
            '.sv': 'timestamp',
          },
        },
      }),
    }
  );
  const fileID: string = (await resp.json()).name;
  res.status(200).json({ fileID: fileID.substring(1) });
};
