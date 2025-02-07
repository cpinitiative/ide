<script lang="ts">
	const { message, showHomeButton = false } = $props();
</script>

<div class="bg-white p-8 text-center sm:p-16 dark:bg-black">
	<div class="text-3xl font-bold text-black sm:text-4xl dark:text-white">{message}</div>
	{#if showHomeButton}
		<a
			href="/"
			class="mt-6 inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#1E1E1E] focus:outline-none sm:mt-10"
		>
			Go Home
		</a>
	{/if}
</div>
