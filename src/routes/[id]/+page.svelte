<script lang="ts">
	import type { FileData, UserData } from '$lib/types';
	import { onValue, ref, remove, serverTimestamp, set } from 'firebase/database';
	import IDE from './IDE.svelte';
	import { authState, database } from '$lib/firebase/firebase.svelte';
	import { computePermission } from '$lib/utils';

	let props = $props();
	let fileId = props.data.fileId;

	let isLoading = $state(true);
	let fileData: FileData | null = $state(null);
	let userData: UserData | null = $state(null);

	$effect(() => {
		isLoading = true;
		fileData = null;

		if (!authState.firebaseUser) {
			// auth is loading
			return;
		}

		const fileDataRef = ref(database, `files/${fileId}`);
		const unsubscribeFileData = onValue(fileDataRef, (snapshot) => {
			if (!snapshot.exists()) {
				fileData = null;
			} else {
				fileData = {
					id: snapshot.key,
					...snapshot.val()
				};
			}
			isLoading = false;
		});

		const userDataRef = ref(database, `users/${authState.firebaseUser.uid}/data`);
		const unsubscribeUserData = onValue(userDataRef, (snapshot) => {
			userData = {
				editorMode: 'normal'
			};

			const data = snapshot.val();
			if (data.editorMode === 'vim' || data.editorMode === 'normal') {
				userData.editorMode = data.editorMode;
			}
		});

		return () => {
			unsubscribeFileData();
			unsubscribeUserData();
		};
	});

	// Add file to dashboard.
	const userPermission = $derived(
		isLoading ? undefined : computePermission(fileData!, authState.firebaseUser!.uid)
	);
	const fileRef = $derived(
		isLoading ? undefined : ref(database, `users/${authState.firebaseUser!.uid}/files/${fileId}`)
	);
	const owner = $derived.by(() => {
		if (isLoading || !fileData || !userPermission) {
			return undefined;
		}
		for (let [userId, user] of Object.entries(fileData.users)) {
			if (user.permission === 'OWNER') {
				return {
					name: user.name,
					id: userId
				};
			}
		}
	});
	const ownerName = $derived(owner ? owner.name : undefined);
	const ownerId = $derived(owner ? owner.id : undefined);
	const workspaceName = $derived(isLoading ? undefined : fileData!.settings.workspaceName);
	const creationTime = $derived(isLoading ? undefined : fileData!.settings.creationTime);
	const language = $derived(isLoading ? undefined : fileData!.settings.language);
	const defaultPermission = $derived(isLoading ? undefined : fileData!.settings.defaultPermission);
	$effect(() => {
		if (isLoading || !fileData || !authState.firebaseUser || !fileRef) {
			return;
		}

		if (userPermission === 'PRIVATE') {
			remove(fileRef);
		} else {
			set(fileRef, {
				title: workspaceName || '',
				lastAccessTime: serverTimestamp(),
				creationTime: creationTime,
				hidden: false,
				version: 2,
				language: language,
				owner: ownerName ? {
					name: ownerName,
					id: ownerId
				} : undefined,

				// deprecated: for compatibility with legacy IDE only
				lastPermission: userPermission,
				lastDefaultPermission: defaultPermission
			});
		}
	});
</script>

<svelte:head>
	<title>
		{fileData?.settings.workspaceName ? `${fileData?.settings.workspaceName} · ` : ''}Real-Time
		Collaborative Online IDE
	</title>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

{#if isLoading}
	<div>Loading...</div>
{:else if !fileData}
	<div>File not found.</div>
{:else if fileData && userData}
	<IDE {fileData} {userData} />
{/if}
