import { getDatabase, ServerValue } from 'firebase-admin/database';
import type { NextApiRequest, NextApiResponse } from 'next';
import firebaseApp from '../../src/firebaseAdmin';
import colorFromUserId from '../../src/scripts/colorFromUserId';
import { ProblemData } from '../../src/components/Workspace/Workspace';

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
export async function fetchProblemData(
  problemID: string
): Promise<ProblemData | null> {
  const response = await fetch(
    'https://raw.githubusercontent.com/cpinitiative/usaco-problems/main/problems.json'
  );
  const data = await response.json();
  if (!data[problemID]) {
    return null;
  }
  const problem = data[problemID];
  const problemData = {
    ...problem,
    source: problem.source.sourceString,
    title: problem.title.titleString,
  };
  return problemData;
}
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
