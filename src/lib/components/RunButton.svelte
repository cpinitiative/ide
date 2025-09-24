<script lang="ts">
	import LoadingIndicator from "./LoadingIndicator.svelte";

	let { showLoadingIndicator, ...props } = $props();

	// Using semantic CSS variables for consistent theming
	const buttonClasses = 'relative inline-flex w-32 flex-shrink-0 items-center px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none cursor-pointer disabled:cursor-not-allowed bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] focus:bg-[var(--color-primary-hover)] disabled:opacity-50';
</script>

<button
	type="button"
	class={buttonClasses}
	{...props}
>
	{#if showLoadingIndicator}
		<LoadingIndicator class="h-5 w-5 p-0.5 text-indigo-100" data-test-id="run-code-loading" />
	{:else}
		<!-- Play Circle Icon -->
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 20 20"
			fill="currentColor"
			class="mr-2 h-5 w-5"
		>
			<path
				fill-rule="evenodd"
				d="M2 10a8 8 0 1 1 16 0 8 8 0 0 1-16 0Zm6.39-2.908a.75.75 0 0 1 .766.027l3.5 2.25a.75.75 0 0 1 0 1.262l-3.5 2.25A.75.75 0 0 1 8 12.25v-4.5a.75.75 0 0 1 .39-.658Z"
				clip-rule="evenodd"
			/>
		</svg>
		<span class="flex-1 text-center">Run Code</span>
	{/if}
</button>
