import type { NextApiRequest, NextApiResponse } from 'next';
import colorFromUserId from '../../src/scripts/colorFromUserId';
import { getDatabase, ServerValue } from 'firebase-admin/database';
import firebaseApp from '../../src/firebaseAdmin';
import { ClassroomInfo } from '../classrooms/[id]';

type RequestData = {
  classroomID: string;
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
    !data.classroomID
  ) {
    res.status(400).json({
      message: 'Bad data',
    });
    return;
  }

  const classroomData: ClassroomInfo = (
    await getDatabase(firebaseApp).ref(`/classrooms/-${data.classroomID}`).get()
  ).val();

  if (!classroomData) {
    res.status(400).json({
      message: 'Classroom not found',
    });
    return;
  }

  if (classroomData.students?.[data.userID]) {
    res.status(200).json({
      fileID: classroomData.students[data.userID].studentFileID.substring(1),
    });
    return;
  }

  const fileRef = await getDatabase(firebaseApp)
    .ref(`/`)
    .push({
      users: {
        [data.userID]: {
          name: data.userName,
          color: colorFromUserId(data.userID),
          permission: 'OWNER',
        },
      },
      settings: {
        workspaceName: classroomData.settings.workspaceName,
        defaultPermission: data.defaultPermission,
        creationTime: ServerValue.TIMESTAMP,
        classroomID: data.classroomID,
      },
    });

  const fileID: string = fileRef.key!;

  await getDatabase(firebaseApp)
    .ref(`/classrooms/-${data.classroomID}/students/${data.userID}`)
    .update({
      color: colorFromUserId(data.userID),
      studentID: data.userID,
      studentFileID: fileID.substring(1),
      name: data.userName,
    });

  res.status(200).json({ fileID: fileID.substring(1) });
};
