import { getApp, getApps, initializeApp, cert } from 'firebase-admin/app';

if (getApps().length === 0) {
	if (process.env.NEW_NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
		initializeApp({
			credential: cert({
				projectId: process.env.NEW_NEXT_PUBLIC_FIREBASE_PROJECT_ID,
				privateKey: process.env.NEW_FIREBASE_PRIVATE_KEY,
				clientEmail: process.env.NEW_FIREBASE_CLIENT_EMAIL
			}),
			databaseURL: 'https://cp-ide-2-default-rtdb.firebaseio.com'
		});
	} else {
		initializeApp({
			projectId: 'cp-ide-2',
			databaseURL: 'http://127.0.0.1:9000?ns=cp-ide-2-default-rtdb'
		});
	}
}

const firebaseApp = getApp();

export default firebaseApp;
