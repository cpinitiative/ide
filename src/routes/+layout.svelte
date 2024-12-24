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
		<div class="text-red-500">
			An unexpected error occurred: {JSON.stringify(error)}
		</div>
	{/snippet}
</svelte:boundary>
