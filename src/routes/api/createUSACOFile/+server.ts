import firebaseApp from '$lib/server/firebaseAdmin';
import type { ProblemData } from '$lib/types';
import { json } from '@sveltejs/kit';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase, ServerValue } from 'firebase-admin/database';

async function fetchProblemData(problemID: string): Promise<ProblemData | null> {
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
		title: problem.title.titleString
	};
	return problemData;
}

export async function POST({ request }) {
	const { idToken, problemId, defaultPermission, language } = await request.json();

	if (!idToken || !problemId || !defaultPermission || !language) {
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

	const problem = await fetchProblemData(problemId);
	if (problem === null) {
		return json(
			{
				message: 'Could not identify problem ID.'
			},
			{ status: 400 }
		);
	}

	const idToURLRef = getDatabase(firebaseApp)
		.ref('users')
		.child(uid)
		.child('usaco-id-to-file-id')
		.child('' + problem.id);

	const idToURLSnap = await idToURLRef.get();

	if (idToURLSnap.exists()) {
		return json(
			{
				fileId: idToURLSnap.val()
			},
			{ status: 200 }
		);
	} else {
		const resp = await getDatabase(firebaseApp)
			.ref('/files')
			.push({
				users: {
					[uid]: {
						name: displayName,
						permission: 'OWNER'
					}
				},
				settings: {
					workspaceName: problem.source + ': ' + problem.title,
					defaultPermission,
					creationTime: ServerValue.TIMESTAMP,
					language,
					problem,
					compilerOptions: {
						cpp: '-std=c++23 -O2 -Wall -Wextra -Wshadow -Wconversion -Wfloat-equal -Wduplicated-cond -Wlogical-op',
						java: '',
						py: ''
					}
				}
			});
		const fileID: string = resp.key!;
		await idToURLRef.set(fileID);

		return json(
			{
				fileId: fileID
			},
			{ status: 200 }
		);
	}
}
