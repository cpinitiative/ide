<script lang="ts">
	import { createDropdownMenu, melt } from '@melt-ui/svelte';
	import { Plus, Download, Files, Cog } from 'lucide-svelte';
	const {
		elements: { menu, item, trigger }
	} = createDropdownMenu({
		positioning: {
			placement: 'bottom-start',
			gutter: 0
		}
	});

	const { onDownloadFile, onOpenSettings, theme } = $props();
</script>

<button
	use:melt={$trigger}
	class="relative inline-flex cursor-pointer items-center px-4 py-2 text-sm font-medium shadow-sm focus:outline-none"
	class:text-gray-800={theme === 'light' || theme === 'huacat-pink'}
	class:hover:bg-neutral-100={theme === 'light'}
	class:focus:bg-neutral-100={theme === 'light'}
	class:text-gray-200={theme === 'dark'}
	class:hover:bg-neutral-800={theme === 'dark'}
	class:focus:bg-neutral-800={theme === 'dark'}
	class:hover:bg-[#F0E5F0]={theme === 'huacat-pink'}
	class:focus:bg-[#F0E5F0]={theme === 'huacat-pink'}
>
	File
	<!-- Chevron Down Icon -->
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 20 20"
		fill="currentColor"
		aria-hidden="true"
		class="-mr-1 ml-2 h-5 w-5"
	>
		<path
			fill-rule="evenodd"
			d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
			clip-rule="evenodd"
		/>
	</svg>
</button>
<!-- menu options -->
<div
	class="ring-opacity-5 w-56 py-1 shadow-lg focus:outline-none"
	class:bg-white={theme === 'light'}
	class:bg-neutral-800={theme === 'dark'}
	class:bg-[#F5EAF5]={theme === 'huacat-pink'}
	data-theme={theme}
	use:melt={$menu}
>
	{#each [[Plus, 'New File', '/new', null], [Download, 'Download File', null, onDownloadFile], [Files, 'Clone File', `${window.location.href}/copy`, null], [Cog, 'Settings', null, onOpenSettings]] as [Icon, text, href, onclick] (text)}
		<a
			use:melt={$item}
			{href}
			{onclick}
			target="_blank"
			class="group flex w-full cursor-pointer items-center px-4 py-2 text-sm focus:outline-none"
			class:text-gray-800={theme === 'light' || theme === 'huacat-pink'}
			class:data-[highlighted]:bg-neutral-100={theme === 'light'}
			class:data-[highlighted]:text-gray-900={theme === 'light'}
			class:bg-neutral-800={theme === 'dark'}
			class:text-gray-200={theme === 'dark'}
			class:data-[highlighted]:bg-neutral-700={theme === 'dark'}
			class:data-[highlighted]:text-gray-100={theme === 'dark'}
			class:bg-[#F5EAF5]={theme === 'huacat-pink'}
			class:data-[highlighted]:bg-[#F0E5F0]={theme === 'huacat-pink'}
			class:data-[highlighted]:text-gray-800={theme === 'huacat-pink'}
		>
			<Icon
				class="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300"
			/>
			{text}
		</a>
	{/each}
</div>
