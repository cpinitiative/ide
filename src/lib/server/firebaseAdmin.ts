import { PUBLIC_USE_FIREBASE_EMULATORS } from '$env/static/public';
import { getApp, getApps, initializeApp, cert } from 'firebase-admin/app';
import {
	FIREBASE_PROJECT_ID,
	FIREBASE_PRIVATE_KEY,
	FIREBASE_CLIENT_EMAIL,
	FIREBASE_DATABASE_URL
} from '$env/static/private';

if (getApps().length === 0) {
	if (PUBLIC_USE_FIREBASE_EMULATORS !== 'true') {
		if (!FIREBASE_PROJECT_ID) {
			throw new Error('Missing required firebase environment variables');
		} else {
			initializeApp({
				credential: cert({
					projectId: FIREBASE_PROJECT_ID,
					privateKey: FIREBASE_PRIVATE_KEY,
					clientEmail: FIREBASE_CLIENT_EMAIL
				}),
				databaseURL: FIREBASE_DATABASE_URL
			});
		}
	} else {
		initializeApp({
			projectId: 'cp-ide-2',
			databaseURL: 'http://127.0.0.1:9000?ns=cp-ide-2-default-rtdb'
		});
	}
}

const firebaseApp = getApp();

export default firebaseApp;
