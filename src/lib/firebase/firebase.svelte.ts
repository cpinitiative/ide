import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getDatabase } from 'firebase/database';
import { getAuth, signInAnonymously, updateProfile, type User } from 'firebase/auth';
import animals from './animals';

const firebaseConfig = {
	apiKey: 'AIzaSyC2C7XWrCKcmM0RDAVZZHDQSxOlo6g3JTU',
	authDomain: 'cp-ide-2.firebaseapp.com',
	databaseURL: 'https://cp-ide-2-default-rtdb.firebaseio.com',
	projectId: 'cp-ide-2',
	storageBucket: 'cp-ide-2.firebasestorage.app',
	messagingSenderId: '1010490112765',
	appId: '1:1010490112765:web:bd1ba8b522169c1eb45c94',
	measurementId: 'G-9C903QL4KZ'
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);
export const database = getDatabase(app);

export const authState:
	| {
			isLoading: true;
			firebaseUser: null;
	  }
	| {
			isLoading: false;
			firebaseUser: User;
	  } = $state({
	isLoading: true,
	firebaseUser: null
});

export function initFirebaseAuth() {
	const unsubscribe = auth.onAuthStateChanged((user) => {
		if (!user) {
			authState.firebaseUser = null;
			authState.isLoading = true;

			signInAnonymously(auth).catch((error) => {
				const errorCode = error.code;
				const errorMessage = error.message;
				alert('Error signing in: ' + errorCode + ' ' + errorMessage);
			});
		} else {
			let displayName = user.displayName;
			if (!displayName) {
				displayName = 'Anonymous ' + animals[Math.floor(animals.length * Math.random())];
				updateProfile(user, { displayName })
					.catch((error) => {
						const errorCode = error.code;
						const errorMessage = error.message;
						alert('Error updating profile: ' + errorCode + ' ' + errorMessage);
					})
					.then(() => {
						authState.isLoading = false;
						authState.firebaseUser = user;
					});
			} else {
				authState.isLoading = false;
				authState.firebaseUser = user;
			}
		}
	});

	return unsubscribe;
}
