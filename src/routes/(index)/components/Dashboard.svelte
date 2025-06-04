<script lang="ts">
	import { ref, onValue, orderByChild, query, set, onChildRemoved } from 'firebase/database';
	import { authState, getUserData, signInWithGoogle, signOut } from '$lib/firebase/firebase.svelte';
	import { database } from '$lib/firebase/firebase.svelte';
	import type { UserFile } from '$lib/types';
	import { isFirebaseId } from '$lib/utils';
	import FilesList from './FilesList.svelte';
    import { folders, fileFolderMap } from '$lib';
    import ConfirmOverrideAuthDialog from '$lib/components/ConfirmOverrideAuthDialog.svelte';
    import RadioGroup from '$lib/components/RadioGroup.svelte';
    import { snapshot } from 'yjs';

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
		const unsubscribeValue = onValue(query(userFilesRef, orderByChild('lastAccessTime')), (snapshot) => {
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

		const unsubscribeChildRemoved = onChildRemoved(userFilesRef, (snapshot) => {
			const removedFileId = snapshot.key; 
			if (removedFileId) {
				files = files?.filter(file => file.id !== removedFileId) ?? [];
			}
		});

		return () => {
			unsubscribeValue();
			unsubscribeChildRemoved(); 
		};
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
	const onUpdateShowHiddenFiles = (newValue: string) => {
                if (userData.showHiddenFiles === newValue) return;
                if (firebaseUser && firebaseUser.uid) {
                        set(ref(database, `users/${firebaseUser.uid}/data/showHiddenFiles`), newValue as 'yes' | 'no')
                                .catch((error) => {
                                        alert('Error updating Show Hidden Files preference: ' + error);
                                });
                }
        };

       /* Folder management */
       let $folders = $store(folders);
       let $fileFolderMap = $store(fileFolderMap);
       function addFolder() {
               const name = prompt('Folder name?');
               if (!name) return;
               const id = `${Date.now().toString(36)}`;
               $folders = [...$folders, { id, name }];
       }

       function updateFileFolder(id: string, folderId: string) {
               $fileFolderMap = { ...$fileFolderMap, [id]: folderId || null };
       }

       /* Sorting */
       let sortKey: 'name' | 'lastAccessed' | 'created' = $state('lastAccessed');
       let sortDir: 'asc' | 'desc' = $state('desc');
       let sortedFiles = $derived.by(() => {
               if (!filesToShow) return [] as UserFile[];
               const arr = [...filesToShow];
               arr.sort((a, b) => {
                       let cmp = 0;
                       if (sortKey === 'name') cmp = (a.title || '').localeCompare(b.title || '');
                       if (sortKey === 'created') cmp = (a.creationTime || 0) - (b.creationTime || 0);
                       if (sortKey === 'lastAccessed') cmp = a.lastAccessTime - b.lastAccessTime;
                       return cmp;
               });
               if (sortDir === 'desc') arr.reverse();
               return arr;
       });
</script>

<div>
	 <div class="flex flex-wrap items-center gap-4">
               <a
                       href="/new"
                       class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#1E1E1E] focus:outline-none"
               >
                       Create New File
               </a>
               <button
                       class="rounded-md border border-transparent bg-indigo-500 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#1E1E1E] focus:outline-none"
                       onclick={addFolder}
               >
                       Add Folder
               </button>
               <div class="flex items-center space-x-2">
                       <label class="text-sm text-gray-700 dark:text-gray-300">Sort:</label>
                       <select bind:value={sortKey} class="rounded p-1 text-sm text-black dark:text-gray-800">
                               <option value="lastAccessed">Last Accessed</option>
                               <option value="created">Created</option>
                               <option value="name">Name</option>
                       </select>
                       <select bind:value={sortDir} class="rounded p-1 text-sm text-black dark:text-gray-800">
                               <option value="desc">Desc</option>
                               <option value="asc">Asc</option>
                       </select>
               </div>
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
		value={userData.showHiddenFiles}
		options={{
			yes: 'Yes',
			no: 'No'
		}}
		theme={userData.theme}
		onchange={(e) => (onUpdateShowHiddenFiles(e))}
	/>
	<div class="h-6"></div>

	{#if sortedFiles && sortedFiles.length > 0}
   <FilesList
        files={sortedFiles}
        folders={$folders}
        fileFolderMap={$fileFolderMap}
    	on:updateFileFolder={(e) => updateFileFolder(e.detail.id, e.detail.folderId)}
           />
    {:else if sortedFiles && sortedFiles.length === 0}
            <div class="text-gray-800 dark:text-gray-400">No files found. Create a new file above!</div>
    {:else}
		<div class="text-gray-800 dark:text-gray-400">Loading files...</div>
	{/if}
</div>

<ConfirmOverrideAuthDialog bind:this={confirmOverrideAuthDialog} />
