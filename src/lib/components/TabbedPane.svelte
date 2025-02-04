<script lang="ts">
	let {
		tabs,
		activeTab = $bindable(),
		children
	}: {
		/**
		 * A mapping of tab value => tab label.
		 */
		tabs: { [key: string]: string };
		activeTab: string;
		children: any;
	} = $props();
</script>

<div class="flex h-full flex-col">
	<div class="flex h-6 bg-neutral-200 dark:bg-black">
		{#each Object.entries(tabs) as [value, label]}
			<button
				class={(value === activeTab
					? 'bg-white text-black dark:bg-[#1E1E1E] dark:text-gray-200'
					: 'text-gray-500 hover:bg-neutral-100 active:bg-neutral-100 dark:text-gray-400 dark:hover:bg-neutral-800 dark:hover:text-gray-300 dark:active:bg-neutral-800') +
					' inline-block px-4 text-sm font-medium transition focus:outline-none'}
				onclick={() => (activeTab = value)}
			>
				{label}
			</button>
		{/each}
	</div>
	<!-- min-h-0 is needed to ensure monaco editor is sized properly -->
	<div class="min-h-0 flex-1">
		{@render children()}
	</div>
</div>
