<!-- TODO: rewrite this component. It shouldn't have state if it is under the lib/ directory. -->

<script lang="ts">
	import { createDialog, melt } from '@melt-ui/svelte';
	import { fade } from 'svelte/transition';
	import RadioGroup from './RadioGroup.svelte';
	import { onValue, ref, set } from 'firebase/database';
	import { authState, database } from '$lib/firebase/firebase.svelte';
	import type { Icon as LucideIcon } from 'lucide-svelte';
	import LaptopMinimal from 'lucide-svelte/icons/laptop-minimal';
	import User from 'lucide-svelte/icons/user';
	import Server from 'lucide-svelte/icons/server';
	import X from 'lucide-svelte/icons/x';

	const {
		elements: { trigger, overlay, content, title, description, close, portalled },
		states: { open: meltUiOpen }
	} = createDialog({
		forceVisible: true
	});

	export const open = () => {
		meltUiOpen.set(true);
	};

	let activeTab: 'workspace' | 'user' | 'judge' = $state('workspace');

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
	<div use:melt={$portalled} class="no-scrollbar fixed inset-0 z-10 overflow-y-scroll">
		<div class="flex min-h-full items-end justify-center pt-4 pb-20 text-center sm:block sm:p-0">
			<div
				use:melt={$overlay}
				class="fixed inset-0 bg-black/75 transition-opacity"
				transition:fade={{ duration: 150 }}
			></div>
			<div
				class="inline-block w-full transform overflow-hidden bg-white text-left shadow-xl transition-all sm:my-8 sm:max-w-2xl md:rounded-lg"
				use:melt={$content}
				transition:fade={{ duration: 150 }}
			>
				<div class="px-4 pt-4 pb-2 sm:px-6">
					<h2 use:melt={$title} class="text-center text-lg leading-6 font-medium text-gray-900">
						Settings
					</h2>
				</div>

				<div class="border-b border-gray-200">
					<nav class="-mb-px flex">
						{@render SettingsTab(
							'Workspace',
							LaptopMinimal,
							activeTab === 'workspace',
							() => (activeTab = 'workspace')
						)}
						{@render SettingsTab('User', User, activeTab === 'user', () => (activeTab = 'user'))}
						{@render SettingsTab(
							'Judge',
							Server,
							activeTab === 'judge',
							() => (activeTab = 'judge')
						)}
					</nav>
				</div>

				<div class="space-y-6 p-4 sm:p-6">
					<p class="text-sm text-gray-500">
						Work In Progress: Much of the functionality is still being ported over to the new site.
					</p>

					{#if activeTab === 'workspace'}
						<div>
							<div class="font-medium text-gray-800">Editor Mode</div>
							<RadioGroup
								options={{ normal: 'Normal', vim: 'Vim' }}
								bind:this={editorModeRadioGroup}
							/>
						</div>
					{/if}

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
				</div>

				<div class="absolute top-0 right-0 pt-4 pr-4">
					<button
						type="button"
						class="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
						use:melt={$close}
					>
						<span class="sr-only">Close</span>

						<X class="h-6 w-6" strokeWidth={1.5}></X>
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

{#snippet SettingsTab(
	label: string,
	Icon: typeof LucideIcon,
	selected: boolean,
	onClick: () => void
)}
	<button
		class={(selected
			? 'border-indigo-500 text-indigo-600'
			: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700') +
			' group flex w-1/2 items-center justify-center border-b-2 px-1 py-3 text-sm font-medium focus:outline-none'}
		onclick={onClick}
	>
		<Icon
			class={(selected ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500') +
				' mr-2 -ml-0.5 h-5 w-5'}
		/>

		{label}
	</button>
{/snippet}
