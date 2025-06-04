<script lang="ts">
  import dayjs from 'dayjs';
  import relativeTime from 'dayjs/plugin/relativeTime';
  dayjs.extend(relativeTime);

  import type { UserFile } from '$lib/types';
  import { authState, database } from '$lib/firebase/firebase.svelte';
  import { onChildRemoved, ref, update } from 'firebase/database';
  import { createEventDispatcher, onMount } from 'svelte';
  import type { Folder } from '$lib/stores/folders';

  /** @typedef {import('$lib/types').UserFile} UserFile */
  /** @typedef {import('$lib/stores/folders').Folder} Folder */

  /**
   * @prop {UserFile[]} files
   * @prop {Folder[]} folders
   * @prop {Record<string,string|null>} fileFolderMap
   */
  let { files, folders, fileFolderMap }: {
    files: UserFile[];
    folders: Folder[];
    fileFolderMap: Record<string, string | null>;
  } = $props();

  const dispatch = createEventDispatcher<{ 
    updateFileFolder: { id: string; folderId: string };
    deleteFolder: { folderId: string };
  }>();

  // Track which file's dropdown is open
  let openDropdownId: string | null = $state(null);

  // Close dropdown when clicking outside
  function handleClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown')) {
      openDropdownId = null;
    }
  }

  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    
    if (!authState.firebaseUser) return;
    const fileRef = ref(database, `users/${authState.firebaseUser.uid}/files`);
    const unsubscribe = onChildRemoved(fileRef, (snapshot) => {
      const removedFileId = snapshot.key;
      if (removedFileId) files = files.filter((f) => f.id !== removedFileId);
    });
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
      unsubscribe();
    };
  });

  // Group by folder, including "Uncategorized"
  let groupedFiles = $derived.by(() => {
    const groups: { folder: Folder | null; files: UserFile[] }[] = [];
    
    // Add folders with their files
    for (const f of folders) {
      groups.push({
        folder: f,
        files: files.filter((fl) => fileFolderMap[fl.id] === f.id)
      });
    }
    
    // Add uncategorized files
    const uncategorizedFiles = files.filter((fl) => !fileFolderMap[fl.id] || !folders.find(f => f.id === fileFolderMap[fl.id]));
    if (uncategorizedFiles.length > 0) {
      groups.push({
        folder: { id: 'uncategorized', name: 'Uncategorized' },
        files: uncategorizedFiles
      });
    }
    
    return groups;
  });

  async function handleToggleHideFile(file: UserFile) {
    if (!authState.firebaseUser) return;
    const fileRef = ref(database, `users/${authState.firebaseUser.uid}/files/${file.id}`);
    await update(fileRef, { hidden: !file.hidden });
  }

  function handleFolderChange(fileId: string, folderId: string) {
    dispatch('updateFileFolder', { id: fileId, folderId });
    openDropdownId = null;
  }

  function toggleDropdown(event: Event, fileId: string) {
    event.stopPropagation();
    openDropdownId = openDropdownId === fileId ? null : fileId;
  }

  function handleDeleteFolder(folderId: string) {
    if (confirm('Are you sure you want to delete this folder? Files will be moved to Uncategorized.')) {
      dispatch('deleteFolder', { folderId });
    }
  }

  function formatDate(timestamp: number) {
    return dayjs(timestamp).fromNow();
  }
</script>

<div class="flex flex-col space-y-4">
  {#each groupedFiles as group (group.folder?.id)}
    <div class="bg-gray-800 rounded-lg shadow-lg">
      <div class="px-4 py-3 bg-gray-900 text-gray-100 font-semibold rounded-t-lg flex justify-between items-center">
        <div class="flex items-center space-x-2">
          <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <span>{group.folder?.name}</span>
          <span class="text-sm text-gray-400">({group.files.length})</span>
        </div>
        
        {#if group.folder && group.folder.id !== 'uncategorized'}
          <button
            onclick={() => handleDeleteFolder(group.folder.id)}
            class="text-red-400 hover:text-red-300 p-1 rounded hover:bg-gray-700"
            title="Delete folder"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        {/if}
      </div>

      {#if group.files.length > 0}
        <div class="divide-y divide-gray-700">
          {#each group.files as file (file.id)}
            <div class="flex items-center justify-between px-4 py-3 bg-gray-800 hover:bg-gray-750 transition-colors">
              <div class="flex-1 min-w-0">
                <a
                  href={`/${file.id.substring(1)}`}
                  class="block text-gray-100 hover:text-indigo-300 transition-colors"
                >
                  <div class="font-medium truncate">
                    {file.title || '(Unnamed File)'}
                    {#if file.hidden}
                      <span class="text-gray-500 text-sm"> (Hidden)</span>
                    {/if}
                  </div>
                  <div class="text-sm text-gray-400 mt-1">
                    Last accessed {formatDate(file.lastAccessTime)}
                    {#if file.creationTime}
                      • Created {formatDate(file.creationTime)}
                    {/if}
                  </div>
                </a>
              </div>

              <div class="flex items-center space-x-2 ml-4">
                <div class="dropdown relative">
                  <button
                    onclick={(e) => toggleDropdown(e, file.id)}
                    class="flex items-center px-3 py-2 bg-gray-700 text-gray-100 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-colors"
                  >
                    <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <span>
                      {fileFolderMap[file.id] && folders.find((f) => f.id === fileFolderMap[file.id])
                        ? folders.find((f) => f.id === fileFolderMap[file.id])?.name
                        : 'Uncategorized'}
                    </span>
                    <svg class="h-4 w-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {#if openDropdownId === file.id}
                    <div class="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg z-20 border border-gray-600">
                      <div class="py-1">
                        <button
                          onclick={() => handleFolderChange(file.id, '')}
                          class="w-full text-left px-4 py-2 text-sm text-gray-100 hover:bg-gray-600 transition-colors flex items-center"
                        >
                          <svg class="h-4 w-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          Uncategorized
                          {#if !fileFolderMap[file.id]}
                            <svg class="h-4 w-4 ml-auto text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                            </svg>
                          {/if}
                        </button>
                        
                        {#each folders as folder}
                          <button
                            onclick={() => handleFolderChange(file.id, folder.id)}
                            class="w-full text-left px-4 py-2 text-sm text-gray-100 hover:bg-gray-600 transition-colors flex items-center"
                          >
                            <svg class="h-4 w-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                            {folder.name}
                            {#if fileFolderMap[file.id] === folder.id}
                              <svg class="h-4 w-4 ml-auto text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                              </svg>
                            {/if}
                          </button>
                        {/each}
                      </div>
                    </div>
                  {/if}
                </div>

                <button
                  onclick={() => handleToggleHideFile(file)}
                  class="px-3 py-2 text-sm text-indigo-400 hover:text-indigo-300 hover:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                  title={file.hidden ? 'Unhide file' : 'Hide file'}
                >
                  {#if file.hidden}
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  {:else}
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L12 12l6.12-6.12M21 3l-6.12 6.12" />
                    </svg>
                  {/if}
                </button>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="px-4 py-6 text-center text-gray-500">
          <svg class="h-12 w-12 mx-auto text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          No files in this folder
        </div>
      {/if}
    </div>
  {/each}
</div>