<script lang="ts">
	import type { FileData } from '$lib/types';
	import { onValue, ref } from 'firebase/database';
	import IDE from './IDE.svelte';
	import { authState, database } from '$lib/firebase/firebase.svelte';

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
