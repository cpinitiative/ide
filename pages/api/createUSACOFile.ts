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

  // useEffect(() => {
  //   const checkProps = async () => {
  //     if (problem === undefined) return;
  //     if (setFileId === null || !firebaseUser) {
  //       return;
  //     }
  //     const idToUrlRef = firebase
  //       .database()
  //       .ref('users')
  //       .child(firebaseUser.uid)
  //       .child('usaco-id-to-url')
  //       .child(String(problem.id));
  //     const snapshot = await idToUrlRef.get();
  //     let newId = null;
  //     if (snapshot.exists()) {
  //       newId = snapshot.val();
  //       router.replace('/' + newId + window.location.search);
  //     } else {
  //       const fileRef = firebase.database().ref().push();
  //       newId = fileRef.key!.slice(1);
  //       await idToUrlRef.set(newId);
  //       const toUpdate: Partial<WorkspaceSettings> = {
  //         problem,
  //         workspaceName: problem.source + ': ' + problem.title,
  //       };
  //       await fileRef.child('settings').update(toUpdate);
  //       setFileId({
  //         newId,
  //         // isNewFile: true,
  //         // navigate: router.replace,
  //       });
  //     }
  //   };
  //   checkProps();
  // }, [setFileId, firebaseUser, problem]);

  const resp = await getDatabase(firebaseApp)
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
        defaultPermission: data.defaultPermission,
        creationTime: ServerValue.TIMESTAMP,
      },
    });
  const fileID: string = resp.key!;
  res.status(200).json({ fileID: fileID.substring(1) });
};
