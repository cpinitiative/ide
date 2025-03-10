<script lang="ts">
	import { ref, onValue, orderByChild, query } from 'firebase/database';
	import { authState, getUserData, signInWithGoogle, signOut } from '$lib/firebase/firebase.svelte';
	import { database } from '$lib/firebase/firebase.svelte';
	import type { UserFile } from '$lib/types';
	import { isFirebaseId } from '$lib/utils';
	import FilesList from './FilesList.svelte';
	import ConfirmOverrideAuthDialog from '$lib/components/ConfirmOverrideAuthDialog.svelte';
	import RadioGroup from '$lib/components/RadioGroup.svelte';

	const firebaseUser = $derived.by(() => {
		if (!authState.firebaseUser) {
			throw new Error(
				'Firebase user is null. The Dashboard component require that the firebase user is not null.'
			);
		}
		return authState.firebaseUser;
	});

	let files: UserFile[] | null = $state(null);
	const userData = getUserData();
	$effect(() => {
		const userFilesRef = ref(database, `users/${firebaseUser.uid}/files`);
		const unsubscribe = onValue(query(userFilesRef, orderByChild('lastAccessTime')), (snapshot) => {
			if (!snapshot.exists()) {
				files = [];
			} else {
				const newFiles: UserFile[] = [];

				snapshot.forEach((childSnapshot) => {
					const data = childSnapshot.val();
					const key = childSnapshot.key;
					if (key) {
						if (isFirebaseId(key)) {
							newFiles.push({
								id: key,
								...data
							});
						}
					}
				});

				files = newFiles.reverse();
			}
		});

		return unsubscribe;
	});

	let filesToShow = $derived.by(() => {
		if (userData.showHiddenFiles == 'yes') return files;
		return files?.filter((file) => !file.hidden);
	});

	let confirmOverrideAuthDialog: ConfirmOverrideAuthDialog | undefined = $state(undefined);
	const onSignIn = () => {
		signInWithGoogle(async () => {
			let override = (await confirmOverrideAuthDialog?.open()) ?? false;
			return override;
		});
	};
</script>

<div>
	<div class="flex items-center space-x-4">
		<a
			href="/new"
			class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#1E1E1E] focus:outline-none"
		>
			Create New File
		</a>
	</div>

	{#if firebaseUser.isAnonymous}
		<div class="mt-6 text-gray-600 dark:text-gray-400">
			Not signed in.{' '}
			<button
				class="cursor-pointer p-1 leading-none text-gray-900 underline transition hover:bg-neutral-100 focus:outline-none dark:text-gray-200 dark:hover:bg-neutral-700"
				onclick={onSignIn}
			>
				Sign in now
			</button>
		</div>
	{:else}
		<div class="mt-6 text-gray-700 dark:text-gray-400">
			Signed in as {firebaseUser.displayName}.
			<button
				class="cursor-pointer p-1 leading-none text-gray-900 underline transition hover:bg-neutral-200 focus:outline-none dark:text-gray-200 dark:hover:bg-neutral-700"
				onclick={signOut}
			>
				Sign Out
			</button>
		</div>
	{/if}

	<div class="h-12"></div>

	<h2 class="text-2xl font-black text-black md:text-4xl dark:text-gray-100">Your Workspaces</h2>
	<div class="h-6"></div>

	<div class="mb-2 font-medium text-black dark:text-gray-100">Show Hidden Files?</div>
	<RadioGroup
		bind:value={userData.showHiddenFiles}
		options={{
			yes: 'Yes',
			no: 'No'
		}}
		theme={userData.theme}
	/>
	<div class="h-6"></div>

	{#if filesToShow && filesToShow.length > 0}
		<FilesList files={filesToShow} />
	{:else if filesToShow && filesToShow.length === 0}
		<div class="text-gray-800 dark:text-gray-400">No files found. Create a new file above!</div>
	{:else}
		<div class="text-gray-800 dark:text-gray-400">Loading files...</div>
	{/if}
</div>

<ConfirmOverrideAuthDialog bind:this={confirmOverrideAuthDialog} />
