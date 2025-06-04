<script lang="ts">
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';
	dayjs.extend(relativeTime);

	import type { UserFile } from '$lib/types';
	import { auth, authState, database } from '$lib/firebase/firebase.svelte';
	import { onChildRemoved, ref, update } from 'firebase/database';
	import type { Folder } from '$lib';
	import { createEventDispatcher } from 'svelte';

	let { files }: { files: UserFile[] } = $props();
    let { folders }: { folders: Folder[] } = $props();
    let { fileFolderMap }: { fileFolderMap: Record<string, string | null> } = $props();
    const dispatch = createEventDispatcher<{ updateFileFolder: { id: string; folderId: string } }>();

    let groupedFiles = $derived.by(() => {
		const groups: { folder: Folder | null; files: UserFile[] }[] = [];
		for (const f of folders) {
		groups.push({ folder: f, files: files.filter(fl => fileFolderMap[fl.id] === f.id) });
		}
		groups.push({ folder: null, files: files.filter(fl => !fileFolderMap[fl.id]) });
		return groups;
	});

	function formatCreationTime(creationTime: number): string {
		if (+dayjs() - +dayjs(creationTime) <= 1000 * 60 * 60 * 24 * 2) {
			return dayjs(creationTime).fromNow();
		}
		return dayjs(creationTime).format('MM/DD/YYYY');
	}

	async function handleToggleHideFile(file: UserFile) {
               if (!authState.firebaseUser) return;
               const fileRef = ref(database, `users/${authState.firebaseUser.uid}/files/${file.id}`);
               await update(fileRef, { hidden: !file.hidden });
       }

    function handleFolderChange(id: string, folderId: string) {
        dispatch('updateFileFolder', { id, folderId });
    }

	function formatLanguage(language: string | null): string {
		if (language == 'py') return 'Python';
		if (language == 'java') return 'Java';
		if (language == 'cpp') return 'C++';
		return 'Unknown';
	}

	 import { onMount } from 'svelte';
       onMount(() => {
               if (!authState.firebaseUser) return;
               const fileRef = ref(database, `users/${authState.firebaseUser.uid}/files`);
               const unsubscribe = onChildRemoved(fileRef, (snapshot) => {
                       const removedFileId = snapshot.key;
                       files = files.filter(file => file.id !== removedFileId);
               });
               return unsubscribe;
       })

</script>

<div class="flex flex-col">
	<!-- Card layout for small screens -->
    <div class="sm:hidden space-y-4">
        {#each groupedFiles as group (group.folder ? group.folder.id : 'none')}
            {#if group.folder}
                <h3 class="font-semibold text-black dark:text-gray-100">{group.folder.name}</h3>
            {/if}
            {#each group.files as file (file.id)}
                <div class="rounded border border-gray-300 p-3 dark:border-gray-600">
                    <div class="font-medium text-black dark:text-gray-100">
                        {file.title || '(Unnamed File)'}
                    </div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">Last Accessed: {formatCreationTime(file.lastAccessTime)}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">Created: {file.creationTime ? formatCreationTime(file.creationTime) : 'Unknown'}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">Language: {file.language ? formatLanguage(file.language) : 'Unknown'}</div>
                    <div class="mt-2 flex items-center justify-between">
                        <select class="rounded border px-1 text-sm text-black dark:text-gray-800" on:change={(e) => handleFolderChange(file.id, (e.target as HTMLSelectElement).value)}>
                            <option value="">No Folder</option>
                            {#each folders as f}
                                <option selected={fileFolderMap[file.id] === f.id} value={f.id}>{f.name}</option>
                            {/each}
                        </select>
                        <button onclick={() => handleToggleHideFile(file)} class="text-indigo-400 hover:text-indigo-100 text-sm">
                            {file.hidden ? 'Unhide' : 'Hide'}
                        </button>
                    </div>
                </div>
            {/each}
        {/each}
    </div>

    <!-- Table layout for larger screens -->
    <div class="-mx-4 -my-2 hidden overflow-x-auto sm:-mx-6 sm:block lg:-mx-8">
        <div class="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            {#each groupedFiles as group (group.folder ? group.folder.id : 'none')}
                {#if group.folder}
                    <h3 class="my-2 font-semibold text-black dark:text-gray-100">{group.folder.name}</h3>
                {/if}
                <table class="min-w-full divide-y divide-gray-600 text-gray-500 dark:text-gray-400 mb-6">
                    <thead>
                        <tr>
                            {#each ['Name', 'Last Accessed', 'Created', 'Language', 'Folder'] as col, i (col)}
                                <th
                                    scope="col"
                                    class=[
                                        i == 0 && 'pr-2 pl-4 sm:pl-6 md:pl-0',
                                        i > 0 && 'px-2',
                                        'py-3.5 text-left text-sm font-semibold text-black dark:text-gray-100'
                                    ]
                                >
                                    {col}
                                </th>
                            {/each}
                            <th scope="col" class="relative py-3.5 pr-4 pl-2 sm:pr-6 md:pr-0">
                                <span class="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-700">
                        {#each group.files as file (file.id)}
                            <tr>
                                <td class="py-4 pr-2 pl-4 text-sm whitespace-nowrap sm:pl-6 md:pl-0">
                                    {#if file.hidden}
                                        <span class="text-gray-400">{file.title || '(Unnamed File)'} (Hidden)</span>
                                    {:else if !file.title}
                                        <span class="text-gray-400">(File Removed)</span>
                                    {:else}
                                        <a href={`/${file.id.substring(1)}`} class="text-gray-900 hover:text-black dark:text-gray-100 dark:hover:text-white">
                                            {file.title || '(Unnamed File)'}
                                        </a>
                                    {/if}
                                </td>
                                <td class="px-3 py-4 text-sm whitespace-nowrap">{formatCreationTime(file.lastAccessTime)}</td>
                                <td class="px-3 py-4 text-sm whitespace-nowrap">{file.creationTime ? formatCreationTime(file.creationTime) : 'Unknown'}</td>
                                <td class="px-3 py-4 text-sm whitespace-nowrap">{file.language ? formatLanguage(file.language) : 'Unknown'}</td>
                                <td class="px-3 py-4 text-sm whitespace-nowrap">
                                    <select class="rounded border px-1 text-sm text-black dark:text-gray-800" on:change={(e) => handleFolderChange(file.id, (e.target as HTMLSelectElement).value)}>
                                        <option value="">No Folder</option>
                                        {#each folders as f}
                                            <option selected={fileFolderMap[file.id] === f.id} value={f.id}>{f.name}</option>
                                        {/each}
                                    </select>
                                </td>
                                <td class="relative py-4 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-6 md:pr-0">
                                    <button onclick={() => handleToggleHideFile(file)} class="text-indigo-400 hover:text-indigo-100">
                                        {file.hidden ? 'Unhide' : 'Hide'}
                                    </button>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            {/each}
        </div>
    </div>
</div>
