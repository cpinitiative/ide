<script lang="ts">
	const { fileMenu, runButton, showViewOnlyMessage = false } = $props();

	let copied = $state(false);

	function handleShare() {
		navigator.clipboard.writeText(window.location.href).then(
			() => {
				copied = true;
				setTimeout(() => {
					copied = false;
				}, 3000);
			},
			() => {
				alert("Couldn't copy link to clipboard. Share the current URL manually.");
			}
		);
	}
</script>

<div class="flex items-center overflow-x-auto text-gray-800 dark:text-gray-200">
	<div class="flex items-center divide-x divide-neutral-200 dark:divide-neutral-700">
		<a
			href="/"
			class="relative inline-flex items-center px-4 py-2 text-sm font-medium shadow-sm hover:bg-neutral-200 focus:bg-neutral-200 focus:outline-none dark:hover:bg-neutral-800 dark:focus:bg-neutral-800"
		>
			<!-- Home Icon -->
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 20 20"
				fill="currentColor"
				class="h-5 w-5"
			>
				<path
					fill-rule="evenodd"
					d="M9.293 2.293a1 1 0 0 1 1.414 0l7 7A1 1 0 0 1 17 11h-1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-.707-1.707l7-7Z"
					clip-rule="evenodd"
				/>
			</svg>
		</a>
		{@render fileMenu()}
		<button
			type="button"
			class="focus: relative inline-flex cursor-pointer items-center px-4 py-2 text-sm font-medium shadow-sm hover:bg-neutral-300 focus:outline-none dark:hover:bg-neutral-800 dark:focus:bg-neutral-800"
			onclick={handleShare}
		>
			<!-- Share Icon -->
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 20 20"
				fill="currentColor"
				class="mr-2 -ml-1 h-5 w-5 text-gray-400"
				aria-hidden="true"
			>
				<path
					d="M13 4.5a2.5 2.5 0 1 1 .702 1.737L6.97 9.604a2.518 2.518 0 0 1 0 .792l6.733 3.367a2.5 2.5 0 1 1-.671 1.341l-6.733-3.367a2.5 2.5 0 1 1 0-3.475l6.733-3.366A2.52 2.52 0 0 1 13 4.5Z"
				/>
			</svg>
			{#if copied}URL Copied!{:else}Share{/if}
		</button>
	</div>
	{@render runButton()}
	<div class="flex items-center divide-x divide-neutral-200 dark:divide-neutral-700">
		<a
			href="https://github.com/cpinitiative/ide/issues"
			target="_blank"
			class="flex-shrink-0 px-4 py-2 text-sm font-medium hover:text-gray-900 dark:hover:text-gray-100"
			rel="noreferrer"
		>
			Report an Issue
		</a>
		<a
			href="https://github.com/cpinitiative/ide"
			target="_blank"
			rel="noreferrer"
			class="flex-shrink-0 px-4 py-2 text-sm font-medium hover:text-gray-900 dark:hover:text-gray-100"
		>
			Star this on GitHub!
		</a>
		{#if showViewOnlyMessage}
			<span class="px-4 py-2 text-sm font-medium whitespace-nowrap">View Only</span>
		{/if}
	</div>
</div>
