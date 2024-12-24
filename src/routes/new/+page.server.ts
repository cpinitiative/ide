import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import firebaseApp from '../../firebaseAdmin';
import { getDatabase, ServerValue } from 'firebase-admin/database';
import colorFromUserId from '$lib/components/editor/colorFromUserId';

const DEFAULT_COMPILER_OPTIONS = {
	cpp: '-std=c++23 -O2 -Wall -Wextra -Wshadow -Wconversion -Wfloat-equal -Wduplicated-cond -Wlogical-op',
	java: '',
	py: ''
};

export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const username = data.get('username') as string;
		const userID = data.get('firebaseUserID') as string;
		const defaultPermission = data.get('defaultPermissions') as string;
		const language = data.get('language') as string;
		const compilerOptions = data.get('compilerOptions') as string;
		const filename = data.get('filename') as string;

		if (!username || !userID || !defaultPermission || !language || compilerOptions === null) {
			return fail(400, {
				error: 'Bad data'
			});
		}

		const resp = await getDatabase(firebaseApp)
			.ref('/files')
			.push({
				users: {
					[userID]: {
						name: username,
						color: colorFromUserId(userID),
						permission: 'OWNER'
					}
				},
				settings: {
					workspaceName: filename,
					defaultPermission: defaultPermission,
					creationTime: ServerValue.TIMESTAMP,
					language: language,
					problem: null,
					compilerOptions: {
						...DEFAULT_COMPILER_OPTIONS,
						[language]: compilerOptions
					}
				}
			});
		const fileID: string = resp.key!;

		// 303 is the recommended status code to redirect to the newly created resource.
		// See https://www.rfc-editor.org/rfc/rfc7231#section-6.4.4
		redirect(303, `/${fileID.substring(1)}`);
	}
} satisfies Actions;
