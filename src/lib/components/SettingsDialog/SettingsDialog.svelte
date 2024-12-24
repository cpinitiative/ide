<!-- TODO: rewrite this component. It shouldn't have state if it is under the lib/ directory. -->

<script lang="ts">
	import { createDialog, melt } from '@melt-ui/svelte';
	import { fade } from 'svelte/transition';
	import RadioGroup from './RadioGroup.svelte';
	import { onValue, ref, set, update } from 'firebase/database';
	import { authState, database } from '$lib/firebase/firebase.svelte';

	const {
		elements: { trigger, overlay, content, title, description, close, portalled },
		states: { open: meltUiOpen }
	} = createDialog({
		forceVisible: true
	});

	export const open = () => {
		meltUiOpen.set(true);
	};

	let editorModeRadioGroup: RadioGroup | undefined = $state(undefined);

	$effect(() => {
		if (!authState.firebaseUser || !editorModeRadioGroup) return;
		return onValue(
			ref(database, `users/${authState.firebaseUser.uid}/data/editorMode`),
			(snapshot) => {
				let data = snapshot.val();
				if (!data) data = 'normal';
				if (data !== 'vim' && data !== 'normal') data = 'normal';

				editorModeRadioGroup?.setValue(data);
			}
		);
	});

	const onSave = () => {
		if (!authState.firebaseUser || !editorModeRadioGroup) return;
		set(
			ref(database, `users/${authState.firebaseUser.uid}/data/editorMode`),
			editorModeRadioGroup.getValue()
		).then(() => {
			meltUiOpen.set(false);
		});
	};
</script>

{#if $meltUiOpen}
	<div use:melt={$portalled}>
		<div
			use:melt={$overlay}
			class="fixed inset-0 z-10 bg-black/75"
			transition:fade={{ duration: 150 }}
		></div>
		<div
			class="fixed top-1/2 left-1/2 z-50 max-h-[85vh] w-[90vw]
            max-w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white
            p-6 shadow-lg"
			use:melt={$content}
		>
			<h2 use:melt={$title} class="m-0 text-lg font-medium text-black">Settings</h2>

			<p class="mt-2 mb-4 text-sm text-gray-500">
				Work In Progress: Much of the functionality is still being ported over to the new site.
			</p>

			<div class="font-medium text-gray-800">Editor Mode</div>
			<RadioGroup options={{ normal: 'Normal', vim: 'Vim' }} bind:this={editorModeRadioGroup} />

			<div class="mt-6 flex items-center space-x-4">
				<button
					type="button"
					class="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
					use:melt={$close}
				>
					Cancel
				</button>
				<button
					type="button"
					class="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
					onclick={onSave}
				>
					Save
				</button>
			</div>

			<div class="absolute top-0 right-0 pt-4 pr-4">
				<button
					type="button"
					class="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
					use:melt={$close}
				>
					<span class="sr-only">Close</span>

					<!-- X Mark Icon -->
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="h-6 w-6"
						aria-hidden="true"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
		</div>
	</div>
{/if}
