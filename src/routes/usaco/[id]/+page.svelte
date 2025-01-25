<script lang="ts">
	import { goto } from '$app/navigation';
	import MessagePage from '$lib/components/MessagePage.svelte';
	import { authState } from '$lib/firebase/firebase.svelte';
	import { ref, get } from 'firebase/database';
	import { database } from '$lib/firebase/firebase.svelte';
	import type { Language } from '$lib/types';

	let error = $state<string | null>(null);
	let props = $props();
	let problemId = props.data.problemId;

	$effect(() => {
		if (!authState.firebaseUser) return;

		createUSACOFile();
	});

	async function createUSACOFile() {
		if (!authState.firebaseUser) throw new Error('firebaseUser cannot be null');

		try {
			// Read user preferences from Firebase
			const userDataRef = ref(database, `users/${authState.firebaseUser.uid}/data`);
			const snapshot = await get(userDataRef);
			let defaultPermission: 'READ_WRITE' | 'READ' | 'PRIVATE' = 'READ_WRITE';
			let lang: Language = 'cpp';
			
			if (snapshot.exists()) {
				const data = snapshot.val();
				if (data.defaultPermission === 'READ_WRITE' || data.defaultPermission === 'READ' || data.defaultPermission === 'PRIVATE') {
					defaultPermission = data.defaultPermission;
				}
				if (data.defaultLanguage === 'cpp' || data.defaultLanguage === 'java' || data.defaultLanguage === 'py') {
					lang = data.defaultLanguage;
				}
			}

			const token = await authState.firebaseUser.getIdToken(true);
			const resp = await fetch(`/api/createUSACOFile`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					idToken: token,
					problemId: problemId,
					defaultPermission,
					language: lang,
				})
			});

			const data = await resp.json();
			if (data.message || resp.status !== 200) {
				throw new Error(data.message ?? 'Unknown error', {
					cause: data
        });
			} else {
				goto(`/${data.fileId.substring(1)}`);
			}
		} catch (e) {
			console.error("Failed to create USACO file", e, e instanceof Error ? e.cause : null);
			error = e instanceof Error ? e.message : 'Unknown error';
		}
	}
</script>

<svelte:head>
	<title>Loading File...</title>
	<meta name="robots" content="noindex" />
</svelte:head>

{#if error}
	<MessagePage message={'Error: ' + error} showHomeButton />
{:else}
	<MessagePage message="Loading File..." />
{/if}
