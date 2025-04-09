<script lang="ts" module>
	import { initializeApp } from 'firebase/app';
	import { getAnalytics } from 'firebase/analytics';
	import { connectDatabaseEmulator, getDatabase } from 'firebase/database';
	import {
		connectAuthEmulator,
		getAuth,
		GoogleAuthProvider,
		linkWithPopup,
		signInAnonymously,
		signInWithCredential,
		signInWithPopup,
		updateProfile,
		type User
	} from 'firebase/auth';
	import animals from './animals';
	import { getContext, onMount } from 'svelte';
	import { PUBLIC_USE_FIREBASE_EMULATORS } from '$env/static/public';
	import { type UserData } from '$lib/types';
	let firebaseConfig = {
		apiKey: 'AIzaSyC2C7XWrCKcmM0RDAVZZHDQSxOlo6g3JTU',
		authDomain: 'cp-ide-2.firebaseapp.com',
		databaseURL: 'https://cp-ide-2-default-rtdb.firebaseio.com',
		projectId: 'cp-ide-2',
		storageBucket: 'cp-ide-2.firebasestorage.app',
		messagingSenderId: '1010490112765',
		appId: '1:1010490112765:web:bd1ba8b522169c1eb45c94',
		measurementId: 'G-9C903QL4KZ'
	};
	if (PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
		firebaseConfig = {
			...firebaseConfig,
			authDomain: 'localhost:9099',
			databaseURL: 'http://localhost:9000/?ns=cp-ide-2-default-rtdb'
		};
	}

	export const app = initializeApp(firebaseConfig);
	export const auth = getAuth(app);
	export const analytics = getAnalytics(app);
	export const database = getDatabase(app);

	if (PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
		connectAuthEmulator(auth, 'http://127.0.0.1:9099');
		connectDatabaseEmulator(database, 'localhost', 9000);
	}

	export let authState: {
		firebaseUser: User | null;
	} = $state({
		firebaseUser: null
	});

	/**
	 * Opens a popup to sign in with Google.
	 */
	export const signInWithGoogle = (confirmDataOverride: () => Promise<boolean>) => {
		if (!authState.firebaseUser) {
			throw new Error(
				'Firebase user is null. Make sure authState.isLoading() is false before calling signInWithGoogle().'
			);
		}

		const provider = new GoogleAuthProvider();

		if (PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
			// Note: for some reason firebase emulator does not work with `linkWithPopup`
			// so we're just going to always sign up with popup instead.
			signInWithPopup(auth, provider);
		} else {
			linkWithPopup(authState.firebaseUser, provider)
				.then((result) => {
					// linked successfully
					const newName = result.user.providerData[0].displayName;
					if (newName) updateProfile(result.user, { displayName: newName }); // update displayName in case it changed
				})
				.catch((error) => {
					if (error.code === 'auth/credential-already-in-use') {
						// User already has an account. Sign in to that account and override our data.
						confirmDataOverride().then((override) => {
							if (override) {
								const credential = GoogleAuthProvider.credentialFromError(error);
								if (!credential) {
									throw new Error('No credential found in error');
								}
								signInWithCredential(auth, credential);
							}
						});
					} else {
						throw error;
					}
				});
		}
	};

	/**
	 * Signs out the current user.
	 */
	export const signOut = () => {
		return auth.signOut();
	};

	const USER_DATA_KEY = Symbol('userData');
	export const getUserData: () => UserData = () => getContext(USER_DATA_KEY);
</script>

<script lang="ts">
	import { setContext } from 'svelte';
	import { onValue, ref } from 'firebase/database';
	const defaultData = {
		editorMode: 'normal',
		tabSize: 4,
		theme: localStorage.theme ?? 'dark',
		defaultPermission: 'READ_WRITE',
		defaultLanguage: 'cpp',
		inlayHints: 'off',
		showHiddenFiles: 'no'
	} as UserData;
	let userData: UserData = $state(defaultData);
	/*
	 * Listen for auth state changes, updating the `authState` store and signing in
	 * anonymously as needed.
	 */
	setContext(USER_DATA_KEY, userData);
	onMount(() => {
		let unsubscribeUserData: () => void = () => {};
		const unsubscribeAuth = auth.onAuthStateChanged((user) => {
			// clean up existing any listener
			unsubscribeUserData();
			unsubscribeUserData = () => {};
			if (!user) {
				authState.firebaseUser = null;
				// a deep copy here is necessary so reference isn't changed
				// @ts-expect-error both userData and defaultData are the same type, so this is fine
				for (const key in defaultData) userData[key] = defaultData[key];

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
							authState.firebaseUser = user;
						});
				} else {
					authState.firebaseUser = user;
				}

				// Set up user data listener when authenticated
				const userDataRef = ref(database, `users/${user.uid}/data`);
				unsubscribeUserData = onValue(userDataRef, (snapshot) => {
					const data = snapshot.val();

					if (data) {
						if (data.editorMode === 'vim' || data.editorMode === 'normal') {
							userData.editorMode = data.editorMode;
						}
						if (data.tabSize === 2 || data.tabSize === 4 || data.tabSize === 8) {
							userData.tabSize = data.tabSize;
						}
						if (data.theme === 'light' || data.theme === 'dark') {
							// write theme to localStorage to prevent flicker
							localStorage.theme = userData.theme = data.theme;
						}
						if (data.inlayHints === 'on' || data.inlayHints === 'off') {
							userData.inlayHints = data.inlayHints;
						}
						if (
							data.defaultPermission === 'READ_WRITE' ||
							data.defaultPermission === 'READ' ||
							data.defaultPermission === 'PRIVATE'
						) {
							userData.defaultPermission = data.defaultPermission;
						}
						if (
							data.defaultLanguage === 'cpp' ||
							data.defaultLanguage === 'java' ||
							data.defaultLanguage === 'py'
						) {
							userData.defaultLanguage = data.defaultLanguage;
						}
						if (
							data.showHiddenFiles === 'yes' ||
							data.showHiddenFiles === 'no'
						) {
							userData.showHiddenFiles = data.showHiddenFiles;
						}
					}
				});
			}
		});

		return () => {
			unsubscribeUserData();
			unsubscribeAuth();
		};
	});
	$effect(() => {
		document.body.setAttribute('data-theme', userData.theme);
	});
	const { children } = $props();
</script>

{@render children()}
