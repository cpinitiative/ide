<script lang="ts">
	import { ref, onValue, set, off, orderByChild, query } from 'firebase/database';
	import { authState, signInWithGoogle, signOut } from '$lib/firebase/firebase.svelte';
	import { database } from '$lib/firebase/firebase.svelte';
	import type { UserFile } from '$lib/types';
	import { isFirebaseId } from '$lib/utils';
	import FilesList from './FilesList.svelte';

	const firebaseUser = $derived.by(() => {
		if (!authState.firebaseUser) {
			throw new Error(
				'Firebase user is null. The Dashboard component require that the firebase user is not null.'
			);
		}
		return authState.firebaseUser;
	});

	let files: UserFile[] | null = $state(null);
  let showHidden = $state(false);

	$effect(() => {
		const userFilesRef = ref(database, `users/${firebaseUser.uid}/files`);
		const unsubscribe = onValue(
			query(userFilesRef, orderByChild('lastAccessTime')),
			(snapshot) => {
				if (!snapshot.exists()) {
					files = null;
				} else {
					const newFiles: UserFile[] = [];

					snapshot.forEach((childSnapshot) => {
						const data = childSnapshot.val();
						const key = childSnapshot.key;
						if (key) {
							if (!showHidden && data.hidden) return;
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
			},
		);

		return unsubscribe;
	});
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
		<div class="mt-6 text-gray-400">
			Not signed in.{' '}
			<button
				class="p-1 leading-none text-gray-200 underline transition hover:bg-gray-700 focus:outline-none"
				onclick={signInWithGoogle}
			>
				Sign in now
			</button>
		</div>
	{:else}
		<div class="mt-6 text-gray-400">
			Signed in as {firebaseUser.displayName}.
			<button
				class="p-1 leading-none text-gray-200 underline transition hover:bg-gray-700 focus:outline-none"
				onclick={signOut}
			>
				Sign Out
			</button>
		</div>
	{/if}

	<div class="h-12"></div>

	<h2 class="text-2xl font-black text-gray-100 md:text-4xl">Your Workspaces</h2>

	<div class="h-6"></div>
	<!-- <RadioGroupContents
    title="Show Hidden Files?"
    value={showHidden}
    onChange={(value) => showHidden = value}
    options={[
      {
        label: 'Yes',
        value: true,
      },
      {
        label: 'No',
        value: false,
      },
    ]}
    lightMode
  /> -->
	<!-- <div class="h-6"></div> -->

	{#if files}
		<FilesList {files} />
	{:else}
		<div class="text-gray-400">Loading files...</div>
	{/if}
</div>
