<script lang="ts">
	import Layout from './components/Layout.svelte';

	let { data } = $props();
	let fileId = data.fileId;
</script>

<Layout>
	{#snippet navbar()}
    Navbar
  {/snippet}

  {#snippet mainPane()}
    Main Pane: {fileId}
  {/snippet}

  {#snippet inputPane()}
    Input Pane
  {/snippet}

  {#snippet outputPane()}
    Output Pane
  {/snippet}
</Layout>
