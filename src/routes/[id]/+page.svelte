<script lang="ts">
	import MonacoEditor, { layoutEditors } from '$lib/components/MonacoEditor.svelte';
	import { onMount } from 'svelte';
	import Layout from './components/Layout.svelte';

	let { data } = $props();
	let fileId = data.fileId;

  // When the window resizes, we should resize the monaco editors
	onMount(() => {
		function handleResize() {
			layoutEditors();
		}

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	});
</script>

<Layout onResize={() => layoutEditors()}>
	{#snippet navbar()}
		Navbar: {fileId}
	{/snippet}

	{#snippet mainPane()}
		<MonacoEditor />
	{/snippet}

	{#snippet inputPane()}
		<MonacoEditor />
	{/snippet}

	{#snippet outputPane()}
		<MonacoEditor />
	{/snippet}
</Layout>
