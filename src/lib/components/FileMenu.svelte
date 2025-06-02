<script lang="ts">
	import { createDropdownMenu, melt } from '@melt-ui/svelte';
	import { Plus, Download, Files, Cog, Trash } from 'lucide-svelte';
	const {
		elements: { menu, item, trigger }
	} = createDropdownMenu({
		positioning: {
			placement: 'bottom-start',
			gutter: 0
		}
	});

	const { onDownloadFile, onOpenSettings, theme, onRemoveFile } = $props();
</script>

<button
	use:melt={$trigger}
	class="relative inline-flex cursor-pointer items-center px-4 py-2 text-sm font-medium text-gray-800 shadow-sm hover:bg-neutral-100 focus:bg-neutral-100 focus:outline-none dark:text-gray-200 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800"
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
	class="ring-opacity-5 w-56 bg-white py-1 shadow-lg focus:outline-none dark:bg-neutral-800"
	data-theme={theme}
	use:melt={$menu}
>
	{#each [[Plus, 'New File', '/new', null], [Download, 'Download File', null, onDownloadFile], [Files, 'Clone File', `${window.location.href}/copy`, null], [Trash, 'Remove File', null, onRemoveFile], [Cog, 'Settings', null, onOpenSettings]] as [Icon, text, href, onclick] (text)}
		<a
			use:melt={$item}
			{href}
			{onclick} 
			target="_blank"
			class="group flex w-full cursor-pointer items-center px-4 py-2
		text-sm text-gray-800 focus:outline-none data-[highlighted]:bg-neutral-100 data-[highlighted]:text-gray-900
		dark:bg-neutral-800 dark:text-gray-200 dark:data-[highlighted]:bg-neutral-700 dark:data-[highlighted]:text-gray-100"
		>
			<Icon
				class="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300"
			/>
			{text}
		</a>
	{/each}
</div>
