import firebaseApp from '$lib/server/firebaseAdmin';
import { isFirebaseId } from '$lib/utils';
import { json, type RequestEvent } from '@sveltejs/kit';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';

export async function POST({ request }: RequestEvent) {
  const { idToken, fileId } = await request.json();

  if (!idToken || !fileId || !isFirebaseId(fileId)) {
    return json({ message: 'Bad data' }, { status: 400 });
  }

  let decodedToken;
  try {
    decodedToken = await getAuth(firebaseApp).verifyIdToken(idToken);
  } catch (e) {
    return json({ message: 'Error decoding ID Token' }, { status: 400 });
  }

  const uid = decodedToken.uid;
  const fileDataResp = await getDatabase(firebaseApp).ref(`files/${fileId}`).get();
  const fileData = await fileDataResp.val();

  if (!fileData) {
    return json({ message: 'File not found' }, { status: 404 });
  }

  const userPerm = fileData.users?.[uid]?.permission;
  if (userPerm !== 'OWNER') {
    return json({ message: 'Only the owner can delete this file' }, { status: 403 });
  }

  await getDatabase(firebaseApp).ref(`files/${fileId}`).remove();
  await getDatabase(firebaseApp).ref(`users/${uid}/files/${fileId}`).remove();
  
  return json({ message: 'File removed successfully' }, { status: 200 });
}
