<script lang="ts">
	import Firebase from '$lib/firebase/firebase.svelte';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:boundary>
	<Firebase>
		{@render children()}
	</Firebase>

	{#snippet failed(error, reset)}
		<div class="text-red-300 p-4">
			<p>An unexpected error occurred: {error}</p>
			<p>Please <a href="https://github.com/cpinitiative/ide/issues" target="_blank" class="underline text-red-200">report this issue on Github</a>.</p>
		</div>
	{/snippet}
</svelte:boundary>
