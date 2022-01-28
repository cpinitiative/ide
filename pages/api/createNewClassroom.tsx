import { getDatabase, ServerValue } from 'firebase-admin/database';
import type { NextApiRequest, NextApiResponse } from 'next';
import firebaseApp from '../../src/firebaseAdmin';
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

  const file = await getDatabase(firebaseApp)
    .ref('/')
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
        defaultPermission: 'READ',
        creationTime: ServerValue.TIMESTAMP,
        // classroomID: data.classroomID, // todo actually set classroom id...
      },
    });
  const classroom = await getDatabase(firebaseApp)
    .ref(`/classrooms`)
    .push({
      users: {
        [data.userID]: {
          name: data.userName,
          color: colorFromUserId(data.userID),
          permission: 'OWNER',
        },
      },
      instructorFileID: file.key!.substring(1),
      settings: {
        workspaceName: data.workspaceName,
        defaultPermission: 'PRIVATE',
        creationTime: ServerValue.TIMESTAMP,
      },
    });

  res.status(200).json({ fileID: classroom.key!.substring(1) });
};
