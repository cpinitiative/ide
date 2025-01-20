<script lang="ts">
	import { goto } from '$app/navigation';
	import MessagePage from '$lib/components/MessagePage.svelte';
	import { authState } from '$lib/firebase/firebase.svelte';

	let error = $state<string | null>(null);
	let props = $props();
	let fileId = props.data.fileId;

	$effect(() => {
		if (!authState.firebaseUser) return;

		copyFile();
	});

	async function copyFile() {
		if (!authState.firebaseUser) throw new Error('firebaseUser cannot be null');

		try {
			const token = await authState.firebaseUser.getIdToken(true);
			const resp = await fetch(`/api/copyFile`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					idToken: token,
					fileId,
				})
			});

			const data = await resp.json();
			if (data.message || resp.status !== 201) {
				throw new Error(data.message ?? 'Unknown error', {
					cause: data
        });
			} else {
				goto(`/${data.fileID}`);
			}
		} catch (e) {
			console.error("Failed to copy file", e, e instanceof Error ? e.cause : null);
			error = e instanceof Error ? e.message : 'Unknown error';
		}
	}
</script>

<svelte:head>
	<title>Copying file...</title>
	<meta name="robots" content="noindex" />
</svelte:head>

{#if error}
	<MessagePage message={'Error: ' + error} showHomeButton />
{:else}
	<MessagePage message="Copying file..." />
{/if}
