import firebaseApp from '$lib/server/firebaseAdmin';
import { isFirebaseId } from '$lib/utils';
import { json } from '@sveltejs/kit';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase, ServerValue } from 'firebase-admin/database';
import { PUBLIC_YJS_SERVER } from '$env/static/public';
import { YJS_SECURITY_KEY } from '$env/static/private';

const YJS_SERVER_API = PUBLIC_YJS_SERVER.replace('ws://', 'http://').replace('wss://', 'https://');

export async function POST({ request }) {
	const { idToken, fileId } = await request.json();

	if (!idToken || !fileId || !isFirebaseId(fileId)) {
		return json(
			{
				message: 'Bad data'
			},
			{ status: 400 }
		);
	}

	let decodedToken;
	try {
		decodedToken = await getAuth(firebaseApp).verifyIdToken(idToken);
	} catch (e) {
		return json(
			{
				message: 'Error decoding ID Token'
			},
			{ status: 400 }
		);
	}
	const uid = decodedToken.uid;
	const displayName = decodedToken.name;

	const fileDataResp = await getDatabase(firebaseApp).ref(`files/${fileId}`).get();
	const fileData = await fileDataResp.val();
	if (!fileData) {
		return json(
			{
				message: 'File Not Found'
			},
			{ status: 404 }
		);
	}

	const fileSettings = fileData.settings;

	if (
		fileSettings.defaultPermission !== 'READ' &&
		fileSettings.defaultPermission !== 'READ_WRITE'
	) {
		const userPerm = fileData.users?.[uid]?.permission;
		if (userPerm !== 'READ' && userPerm !== 'READ_WRITE' && userPerm !== 'OWNER') {
			return json(
				{
					message: 'This file is private.'
				},
				{ status: 403 }
			);
		}
	}

	const ref = getDatabase(firebaseApp)
		.ref('/files')
		.push({
			users: {
				[uid]: {
					name: displayName,
					permission: 'OWNER'
				}
			},
			settings: {
				...fileData.settings,
				creationTime: ServerValue.TIMESTAMP
			}
		});
	const newFileId: string = ref.key!;

	const copyYjsPromies = ['cpp', 'java', 'py', 'input', 'scribble'].map((key) => {
		return fetch(`${YJS_SERVER_API}/copyFile`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				securityKey: YJS_SECURITY_KEY,
				sourceFile: `${fileId}.${key}`,
				targetFile: `${newFileId}.${key}`
			})
		})
			.then((resp) => resp.text())
			.then((resp) => {
				// it's ok if source file doesn't exist -- maybe the file only had Java and not C++
				if (resp !== 'OK' && resp !== "Source file doesn't exist") {
					throw new Error('Failed to copy file ' + `${fileId}.${key}` + ': ' + resp);
				}
			});
	});

	await Promise.all([ref, ...copyYjsPromies]);

	return json({ fileId: newFileId.substring(1) }, { status: 201 });
}
