<script lang="ts">
	import { getUserData } from '$lib/firebase/firebase.svelte';

	const { message, showHomeButton = false } = $props();
	const userData = getUserData();
</script>

<div class="bg-[var(--color-bg-primary)] p-8 text-center sm:p-16" data-theme={userData.theme}>
	<div class="text-3xl font-bold text-[var(--color-text-primary)] sm:text-4xl">{message}</div>
	{#if showHomeButton}
		<a
			href="/"
			class="mt-6 inline-flex items-center rounded-md border border-transparent bg-[var(--color-primary)] px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-[var(--color-primary-hover)] focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg-primary)] focus:outline-none sm:mt-10"
		>
			Go Home
		</a>
	{/if}
</div>
