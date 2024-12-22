<script lang="ts">
	import { onMount } from 'svelte';
	import MonacoEditor, { layoutEditors } from '$lib/components/editor/MonacoEditor.svelte';
	import Layout from './components/Layout.svelte';
	import type { FileData } from '$lib/types';
	import RealtimeEditor from '$lib/components/editor/RealtimeEditor.svelte';
	import { authState } from '$lib/firebase/firebase.svelte';

	const { fileData }: { fileData: FileData } = $props();

	// When the window resizes, we should resize the monaco editors
	onMount(() => {
		function handleResize() {
			layoutEditors();
		}

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	});

	const firebaseUser = $derived.by(() => {
		if (!authState.firebaseUser) {
			throw new Error(
				'Firebase user is null. The IDE component require that the firebase user is not null.'
			);
		}
		return authState.firebaseUser;
	});
</script>

<Layout onResize={() => layoutEditors()}>
	{#snippet navbar()}
		Navbar
	{/snippet}

	{#snippet mainPane()}
		<RealtimeEditor
			defaultValue={'my default value'}
			documentId={fileData.id}
			userId={firebaseUser.uid}
		/>
	{/snippet}

	{#snippet inputPane()}
		<MonacoEditor />
	{/snippet}

	{#snippet outputPane()}
		<MonacoEditor />
	{/snippet}
</Layout>
