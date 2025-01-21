<script lang="ts">
	import { createDialog, melt } from '@melt-ui/svelte';
	import { fade } from 'svelte/transition';
	import X from 'lucide-svelte/icons/x';
	import TriangleAlert from 'lucide-svelte/icons/triangle-alert';

	const {
		elements: { trigger, overlay, content, title, description, close, portalled },
		states: { open: meltUiOpen }
	} = createDialog({
		forceVisible: true
	});

	let reportChoice: (value: boolean) => void = $state(() => {});

	meltUiOpen.subscribe((open) => {
		if (!open) {
			reportChoice(false);
		}
	});

	export function open(): Promise<boolean> {
		meltUiOpen.set(true);
		return new Promise((_resolve) => {
			reportChoice = (value) => {
				_resolve(value);
				reportChoice = () => {};
			};
		});
	}
</script>

{#if $meltUiOpen}
	<div use:melt={$portalled} class="fixed inset-0 z-10 overflow-y-auto">
		<div
			class="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0"
		>
			<div
				use:melt={$overlay}
				class="fixed inset-0 bg-black/75 transition-opacity"
				transition:fade={{ duration: 150 }}
			></div>
			<!-- This element is to trick the browser into centering the modal contents. -->
			<span class="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
				&#8203;
			</span>
			<div
				class="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle"
				use:melt={$content}
				transition:fade={{ duration: 150 }}
			>
				<div class="sm:flex sm:items-start">
					<div
						class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10"
					>
						<TriangleAlert class="h-6 w-6 text-red-600" aria-hidden="true" strokeWidth={1.5} />
					</div>
					<div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
						<h2 use:melt={$title} class="text-lg leading-6 font-medium text-gray-900">
							Override Local Data?
						</h2>
						<div class="mt-2">
							<p class="text-sm text-gray-500">
								Your local data will be overwritten by your server data. Are you sure you want to
								proceed?
							</p>
						</div>
					</div>
				</div>
				<div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
					<button
						type="button"
						class="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
						onclick={() => {
							reportChoice(true);
							meltUiOpen.set(false);
						}}
					>
						Override Data
					</button>
					<button
						type="button"
						class="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
						use:melt={$close}
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
