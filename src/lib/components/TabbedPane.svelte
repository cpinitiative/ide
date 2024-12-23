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
	<div class="bg-black h-6 flex">
		{#each Object.entries(tabs) as [value, label]}
			<button
				class={(value === activeTab
					? 'bg-[#1E1E1E] text-gray-200'
					: 'text-gray-400 hover:bg-gray-800 hover:text-gray-300 active:bg-gray-800') +
					' inline-block px-4 text-sm font-medium transition focus:outline-none'}
				onclick={() => (activeTab = value)}
			>
				{label}
			</button>
		{/each}
	</div>
	<!-- min-h-0 is needed to ensure monaco editor is sized properly -->
	<div class="flex-1 min-h-0">
		{@render children()}
	</div>
</div>
