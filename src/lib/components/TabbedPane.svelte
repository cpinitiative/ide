<script lang="ts">
	let {
		tabs,
		activeTab = $bindable(),
		children,
		theme = 'dark'
	}: {
		/**
		 * A mapping of tab value => tab label.
		 */
		tabs: { [key: string]: string };
		activeTab: string;
		children: any;
		theme?: 'light' | 'dark' | 'huacat-pink';
	} = $props();

	function getTabClasses(isActive: boolean, theme: string): string {
		const baseClasses = 'inline-block px-4 text-sm font-medium transition focus:outline-none';
		
		if (isActive) {
			switch (theme) {
				case 'dark':
					return `${baseClasses} bg-[#1E1E1E] text-gray-200`;
				case 'huacat-pink':
					return `${baseClasses} bg-white text-black`;
				default: // light
					return `${baseClasses} bg-white text-black`;
			}
		} else {
			switch (theme) {
				case 'dark':
					return `${baseClasses} text-gray-400 hover:bg-neutral-800 hover:text-gray-300 active:bg-neutral-800`;
				case 'huacat-pink':
					return `${baseClasses} text-gray-600 hover:bg-[#F0E0F0] active:bg-[#F0E0F0]`;
				default: // light
					return `${baseClasses} text-gray-500 hover:bg-neutral-100 active:bg-neutral-100`;
			}
		}
	}
</script>

<div class="flex h-full flex-col">
	<div class="flex h-6" class:bg-neutral-200={theme === 'light'} class:bg-black={theme === 'dark'} class:bg-[#F5EAF5]={theme === 'huacat-pink'}>
		{#each Object.entries(tabs) as [value, label]}
			<button
				class={getTabClasses(value === activeTab, theme)}
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
