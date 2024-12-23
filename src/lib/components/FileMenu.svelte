<script lang="ts">
	import { createDropdownMenu, melt } from '@melt-ui/svelte';
	const {
		elements: { menu, item, trigger, arrow }
	} = createDropdownMenu({
		positioning: {
			placement: 'bottom-start',
			gutter: 0
		}
	});

  const { onDownloadFile, onOpenSettings } = $props();

	const menuItemClass =
		'group flex items-center px-4 py-2 text-sm text-gray-200 data-[highlighted]:bg-neutral-700 data-[highlighted]:text-gray-100 w-full focus:outline-none cursor-pointer';
</script>

<button
	use:melt={$trigger}
	class="relative inline-flex cursor-pointer items-center px-4 py-2 text-sm font-medium text-gray-200 shadow-sm hover:bg-neutral-800 focus:bg-neutral-800 focus:outline-none"
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
<div class="ring-opacity-5 w-56 bg-neutral-800 py-1 shadow-lg focus:outline-none" use:melt={$menu}>
	<a use:melt={$item} href="/new" target="_blank" class={menuItemClass}>
		<!-- Plus Icon -->
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 20 20"
			fill="currentColor"
			class="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-300"
			aria-hidden="true"
		>
			<path
				d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z"
			/>
		</svg>
		New File
	</a>
	<button use:melt={$item} type="button" onclick={onDownloadFile} class={menuItemClass}>
		<!-- Arrow Down Tray Icon -->
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 20 20"
			fill="currentColor"
			class="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-300"
			aria-hidden="true"
		>
			<path
				d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z"
			/>
			<path
				d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z"
			/>
		</svg>
		Download File
	</button>

	<a use:melt={$item} href={window.location.href + '/clone'} target="_blank" rel="noreferrer" class={menuItemClass}>
		<!-- Document Duplicate Icon -->
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 20 20"
			fill="currentColor"
			class="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-300"
			aria-hidden="true"
		>
			<path
				d="M7 3.5A1.5 1.5 0 0 1 8.5 2h3.879a1.5 1.5 0 0 1 1.06.44l3.122 3.12A1.5 1.5 0 0 1 17 6.622V12.5a1.5 1.5 0 0 1-1.5 1.5h-1v-3.379a3 3 0 0 0-.879-2.121L10.5 5.379A3 3 0 0 0 8.379 4.5H7v-1Z"
			/>
			<path
				d="M4.5 6A1.5 1.5 0 0 0 3 7.5v9A1.5 1.5 0 0 0 4.5 18h7a1.5 1.5 0 0 0 1.5-1.5v-5.879a1.5 1.5 0 0 0-.44-1.06L9.44 6.439A1.5 1.5 0 0 0 8.378 6H4.5Z"
			/>
		</svg>
		Clone File
	</a>

	<button use:melt={$item} onclick={onOpenSettings} type="button" class={menuItemClass}>
		<!-- Cog Icon -->
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 20 20"
			fill="currentColor"
			class="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-300"
			aria-hidden="true"
		>
			<path
				d="M13.024 9.25c.47 0 .827-.433.637-.863a4 4 0 0 0-4.094-2.364c-.468.05-.665.576-.43.984l1.08 1.868a.75.75 0 0 0 .649.375h2.158ZM7.84 7.758c-.236-.408-.79-.5-1.068-.12A3.982 3.982 0 0 0 6 10c0 .884.287 1.7.772 2.363.278.38.832.287 1.068-.12l1.078-1.868a.75.75 0 0 0 0-.75L7.839 7.758ZM9.138 12.993c-.235.408-.039.934.43.984a4 4 0 0 0 4.094-2.364c.19-.43-.168-.863-.638-.863h-2.158a.75.75 0 0 0-.65.375l-1.078 1.868Z"
			/>
			<path
				fill-rule="evenodd"
				d="m14.13 4.347.644-1.117a.75.75 0 0 0-1.299-.75l-.644 1.116a6.954 6.954 0 0 0-2.081-.556V1.75a.75.75 0 0 0-1.5 0v1.29a6.954 6.954 0 0 0-2.081.556L6.525 2.48a.75.75 0 1 0-1.3.75l.645 1.117A7.04 7.04 0 0 0 4.347 5.87L3.23 5.225a.75.75 0 1 0-.75 1.3l1.116.644A6.954 6.954 0 0 0 3.04 9.25H1.75a.75.75 0 0 0 0 1.5h1.29c.078.733.27 1.433.556 2.081l-1.116.645a.75.75 0 1 0 .75 1.298l1.117-.644a7.04 7.04 0 0 0 1.523 1.523l-.645 1.117a.75.75 0 1 0 1.3.75l.644-1.116a6.954 6.954 0 0 0 2.081.556v1.29a.75.75 0 0 0 1.5 0v-1.29a6.954 6.954 0 0 0 2.081-.556l.645 1.116a.75.75 0 0 0 1.299-.75l-.645-1.117a7.042 7.042 0 0 0 1.523-1.523l1.117.644a.75.75 0 0 0 .75-1.298l-1.116-.645a6.954 6.954 0 0 0 .556-2.081h1.29a.75.75 0 0 0 0-1.5h-1.29a6.954 6.954 0 0 0-.556-2.081l1.116-.644a.75.75 0 0 0-.75-1.3l-1.117.645a7.04 7.04 0 0 0-1.524-1.523ZM10 4.5a5.475 5.475 0 0 0-2.781.754A5.527 5.527 0 0 0 5.22 7.277 5.475 5.475 0 0 0 4.5 10a5.475 5.475 0 0 0 .752 2.777 5.527 5.527 0 0 0 2.028 2.004c.802.458 1.73.719 2.72.719a5.474 5.474 0 0 0 2.78-.753 5.527 5.527 0 0 0 2.001-2.027c.458-.802.719-1.73.719-2.72a5.475 5.475 0 0 0-.753-2.78 5.528 5.528 0 0 0-2.028-2.002A5.475 5.475 0 0 0 10 4.5Z"
				clip-rule="evenodd"
			/>
		</svg>
		Settings
	</button>
</div>
