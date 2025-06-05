<script lang="ts">
  import dayjs from 'dayjs';
  import relativeTime from 'dayjs/plugin/relativeTime';
  dayjs.extend(relativeTime);

  import type { UserFile } from '$lib/types';
  import { authState, database } from '$lib/firebase/firebase.svelte';
  import { onValue, onChildRemoved, ref, update, push, remove } from 'firebase/database';
  import { createEventDispatcher, onMount } from 'svelte';
  import type { Folder } from '$lib/stores/folders';

  const { files, folders, fileFolderMap, starredFiles, fileTags, trashedFiles, syncStatus } = $props();

  const dispatch = createEventDispatcher<{
    updateFileFolder: { id: string; folderId: string };
    deleteFolder: { folderId: string };
    toggleStar: { fileId: string };
    deleteFile: { fileId: string };
    restoreFile: { fileId: string };
    duplicateFile: { fileId: string };
    renameFile: { fileId: string; newName: string };
    renameFolder: { folderId: string; newName: string };
    viewVersions: { fileId: string };
    shareFile: { fileId: string };
    addTag: { fileId: string; tag: string };
    toggleHide: { fileId: string };
    selectFile: { fileId: string; selected: boolean };
  }>();

  // svelte-ignore non_reactive_update
    let openDropdownId: string | null = null;
  // svelte-ignore non_reactive_update
    let renameMode: { type: 'file' | 'folder'; id: string } | null = null;
  // svelte-ignore non_reactive_update
    let newNameInput = '';

  // Track selected files for multi-select
  let selectedFiles = new Set<string>();

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
    const unsubscribe = onChildRemoved(
      fileRef,
      (snapshot: import('firebase/database').DataSnapshot) => {
        const removedFileId = snapshot.key;
        if (removedFileId) {
          // Remove from local array in-place
          const idx = files.findIndex((f: { id: string; }) => f.id === removedFileId);
          if (idx !== -1) files.splice(idx, 1);
        }
      }
    );

    return () => {
      document.removeEventListener('click', handleClickOutside);
      unsubscribe();
    };
  });

  function formatDate(timestamp: number) {
    return dayjs(timestamp).fromNow();
  }

  function toggleDropdown(event: Event, fileId: string) {
    event.stopPropagation();
    openDropdownId = openDropdownId === fileId ? null : fileId;
  }

  function handleFolderChange(fileId: string, folderId: string) {
    dispatch('updateFileFolder', { id: fileId, folderId });
    openDropdownId = null;
  }

  function handleDeleteFolder(folderId: string) {
    if (confirm('Are you sure you want to delete this folder? Files will be moved to Uncategorized.')) {
      dispatch('deleteFolder', { folderId });
    }
  }

  function handleToggleStar(fileId: string) {
    dispatch('toggleStar', { fileId });
  }

  function handleDeleteFile(fileId: string) {
    dispatch('deleteFile', { fileId });
  }

  function handleRestoreFile(fileId: string) {
    dispatch('restoreFile', { fileId });
  }

  function handleDuplicateFile(fileId: string) {
    dispatch('duplicateFile', { fileId });
  }

  function startRename(type: 'file' | 'folder', id: string, currentName: string) {
    renameMode = { type, id };
    newNameInput = currentName;
    openDropdownId = null;
  }

  function finishRename(type: 'file' | 'folder', id: string) {
    if (!newNameInput.trim()) {
      renameMode = null;
      return;
    }
    if (type === 'file') {
      dispatch('renameFile', { fileId: id, newName: newNameInput.trim() });
    } else {
      dispatch('renameFolder', { folderId: id, newName: newNameInput.trim() });
    }
    renameMode = null;
  }

  function handleViewVersions(fileId: string) {
    dispatch('viewVersions', { fileId });
  }

  function handleShareFile(fileId: string) {
    dispatch('shareFile', { fileId });
  }

  function handleAddTag(fileId: string) {
    const tag = prompt('Enter new tag:');
    if (tag?.trim()) {
      dispatch('addTag', { fileId, tag: tag.trim() });
    }
  }

  function handleToggleHide(file: UserFile) {
    dispatch('toggleHide', { fileId: file.id });
  }

  function toggleSelect(fileId: string) {
    if (selectedFiles.has(fileId)) {
      selectedFiles.delete(fileId);
      dispatch('selectFile', { fileId, selected: false });
    } else {
      selectedFiles.add(fileId);
      dispatch('selectFile', { fileId, selected: true });
    }
  }

  // Group files by folder, including "Uncategorized"
  let groupedFiles = $derived.by(() => {
    const groups: { folder: Folder | { id: 'uncategorized'; name: string }; files: UserFile[] }[] = [];

    // Folders with their files
    for (const f of folders) {
      groups.push({
        folder: f,
        files: files.filter(
          (fl: { id: string | number; }) =>
            fileFolderMap[fl.id] === f.id &&
            !trashedFiles.find((tf: { id: string | number; }) => tf.id === fl.id)
        )
      });
    }

    // Uncategorized files
    const uncategorizedFiles = files.filter((fl: { id: string | number; }) => {
      const inFolder =
        fileFolderMap[fl.id] && folders.find((f: { id: any; }) => f.id === fileFolderMap[fl.id]);
      return !inFolder && !trashedFiles.find((tf: { id: string | number; }) => tf.id === fl.id);
    });
    if (uncategorizedFiles.length > 0) {
      groups.push({
        folder: { id: 'uncategorized', name: 'Uncategorized' },
        files: uncategorizedFiles
      });
    }

    return groups;
  });
</script>

<div class="flex flex-col space-y-4">
  {#each groupedFiles as group (group.folder.id)}
    <div class="bg-gray-800 rounded-lg shadow-lg">
      <div class="px-4 py-3 bg-gray-900 text-gray-100 font-semibold rounded-t-lg flex justify-between items-center">
        <div class="flex items-center space-x-2">
          <svg
            class="h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>

          {#if renameMode?.type === 'folder' && renameMode.id === group.folder.id}
            <!-- svelte-ignore event_directive_deprecated -->
            <!-- svelte-ignore a11y_autofocus -->
            <input
              bind:value={newNameInput}
              on:keydown={(e) => {
                if (e.key === 'Enter') finishRename('folder', group.folder.id);
                if (e.key === 'Escape') renameMode = null;
              }}
              on:blur={() => finishRename('folder', group.folder.id)}
              class="bg-gray-700 text-gray-100 px-2 py-1 rounded text-sm w-48"
              autofocus
            />
          {:else}
            <span>{group.folder.name}</span>
          {/if}

          <span class="text-sm text-gray-400">({group.files.length})</span>
        </div>

        {#if group.folder.id !== 'uncategorized'}
          <div class="flex items-center space-x-2">
            <!-- svelte-ignore a11y_consider_explicit_label -->
            <!-- svelte-ignore event_directive_deprecated -->
            <button
              on:click={() => startRename('folder', group.folder.id, group.folder.name)}
              class="text-gray-400 hover:text-gray-200 p-1 rounded hover:bg-gray-700 transition-colors"
              title="Rename folder"
            >
              <svg
                class="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15.232 5.232l3.536 3.536m-2.036 1.464l-8 8H4v-4l8-8 1.196 1.196z"
                />
              </svg>
            </button>

            <!-- svelte-ignore event_directive_deprecated -->
            <!-- svelte-ignore a11y_consider_explicit_label -->
            <button
              on:click={() => handleDeleteFolder(group.folder.id)}
              class="text-red-400 hover:text-red-300 p-1 rounded hover:bg-gray-700 transition-colors"
              title="Delete folder"
            >
              <svg
                class="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        {/if}
      </div>

      {#if group.files.length > 0}
        <div class="divide-y divide-gray-700">
          {#each group.files as file (file.id)}
            <div
              class="flex items-start justify-between px-4 py-3 bg-gray-800 hover:bg-gray-750 transition-colors group relative"
            >
              <!-- Multi-select checkbox -->
              <div class="flex items-center">
                <!-- svelte-ignore event_directive_deprecated -->
                <input
                  type="checkbox"
                  checked={selectedFiles.has(file.id)}
                  on:change={() => toggleSelect(file.id)}
                  class="rounded border-gray-600 text-indigo-600 focus:ring-indigo-500 mr-3"
                />

                <div class="min-w-0">
                  <!-- Title / Inline rename -->
                  {#if renameMode?.type === 'file' && renameMode.id === file.id}
                    <!-- svelte-ignore event_directive_deprecated -->
                    <!-- svelte-ignore a11y_autofocus -->
                    <input
                      bind:value={newNameInput}
                      on:keydown={(e) => {
                        if (e.key === 'Enter') finishRename('file', file.id);
                        if (e.key === 'Escape') renameMode = null;
                      }}
                      on:blur={() => finishRename('file', file.id)}
                      class="bg-gray-700 text-gray-100 px-2 py-1 rounded text-sm w-48"
                      autofocus
                    />
                  {:else}
                    <a
                      href={`/${file.id.replace(/^-/, '')}`}
                        class="block text-gray-100 hover:text-indigo-300 transition-colors font-medium truncate"
                      >
                      {file.title || '(Unnamed File)'}
                      {#if file.hidden}
                      <span class="text-gray-500 text-sm"> (Hidden)</span>
                      {/if}
                    </a>



                  {/if}

                  <!-- File preview snippet -->
                  {#if (file as any).content}
                    <p class="text-xs text-gray-500 mt-1 truncate max-w-md">
                      {(file as any).content.substring(0, 100)}...
                    </p>
                  {/if}

                  <!-- Metadata: size, creation, tags -->
                  <div class="flex items-center space-x-2 text-xs text-gray-400 mt-1">
                    {#if (file as any).size}
                      <span>
                        {(file as any).size > 1024
                          ? `${Math.round((file as any).size / 1024)}KB`
                          : `${(file as any).size}B`}
                      </span>
                      <span>•</span>
                    {/if}

                    {#if file.creationTime}
                      <span>Created {formatDate(file.creationTime)}</span>
                      <span>•</span>
                    {/if}

                    <span>Last accessed {formatDate(file.lastAccessTime)}</span>
                  </div>

                  <!-- Tags -->
                  {#if fileTags[file.id]?.length > 0}
                    <div class="flex flex-wrap gap-1 mt-2">
                      {#each fileTags[file.id] as tag}
                        <span class="px-2 py-1 bg-blue-900/30 text-blue-300 text-xs rounded">
                          {tag}
                        </span>
                      {/each}
                    </div>
                  {/if}
                </div>
              </div>

              <!-- Action buttons -->
              <div class="flex items-center space-x-2 ml-4">
                <!-- Sync status -->
                {#if syncStatus[file.id]}
                  {#if syncStatus[file.id] === 'saving'}
                    <div class="animate-spin h-4 w-4 border-2 border-yellow-400 border-t-transparent rounded-full"></div>
                  {:else if syncStatus[file.id] === 'saved'}
                    <svg class="h-4 w-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                  {:else if syncStatus[file.id] === 'error'}
                    <svg class="h-4 w-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  {/if}
                {/if}

                <!-- Hide/Unhide -->
                <!-- svelte-ignore event_directive_deprecated -->
                <button
                  on:click={() => handleToggleHide(file)}
                  class="text-gray-400 hover:text-gray-200 p-1 rounded hover:bg-gray-700 transition-colors"
                  title={(file as any).hidden ? 'Unhide file' : 'Hide file'}
                >
                  {#if (file as any).hidden}
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

                <!-- Star -->
                <!-- svelte-ignore event_directive_deprecated -->
                <!-- svelte-ignore a11y_consider_explicit_label -->
                <button
                  on:click={() => handleToggleStar(file.id)}
                  class="p-1 hover:bg-gray-600 rounded transition-colors {(starredFiles as Set<string>).has(file.id) ? 'text-yellow-400' : 'text-gray-400'}"
                  title={(starredFiles as Set<string>).has(file.id) ? 'Unstar' : 'Star'}
                >
                  <svg class="h-4 w-4" fill={(starredFiles as Set<string>).has(file.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </button>

                <!-- Add Tag -->
                <!-- svelte-ignore a11y_consider_explicit_label -->
                <!-- svelte-ignore event_directive_deprecated -->
                <button
                  on:click={() => handleAddTag(file.id)}
                  class="text-gray-400 hover:text-gray-200 p-1 rounded hover:bg-gray-700 transition-colors"
                  title="Add tag"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 11h.01M7 15h.01M11 7h.01M11 11h.01M11 15h.01M15 7h.01M15 11h.01M15 15h.01" />
                  </svg>
                </button>

                <!-- View Versions -->
                <!-- svelte-ignore a11y_consider_explicit_label -->
                <!-- svelte-ignore event_directive_deprecated -->
                <button
                  on:click={() => handleViewVersions(file.id)}
                  class="text-gray-400 hover:text-gray-200 p-1 rounded hover:bg-gray-700 transition-colors"
                  title="Version history"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M12 16h.01M12 8h.01M9.886 9.886A4.001 4.001 0 0112 8V4a8 8 0 100 16v-4a4 4 0 01-2.114-3.114z" />
                  </svg>
                </button>

                <!-- Share -->
                <!-- svelte-ignore a11y_consider_explicit_label -->
                <!-- svelte-ignore event_directive_deprecated -->
                <button
                  on:click={() => handleShareFile(file.id)}
                  class="text-gray-400 hover:text-gray-200 p-1 rounded hover:bg-gray-700 transition-colors"
                  title="Share file"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12v.01M8 12v.01M12 12v.01M16 12v.01M20 12v.01" />
                  </svg>
                </button>

                <!-- Duplicate -->
                <!-- svelte-ignore a11y_consider_explicit_label -->
                <!-- svelte-ignore event_directive_deprecated -->
                <button
                  on:click={() => handleDuplicateFile(file.id)}
                  class="text-gray-400 hover:text-gray-200 p-1 rounded hover:bg-gray-700 transition-colors"
                  title="Duplicate file"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m4 4v8a2 2 0 01-2 2H8a2 2 0 01-2-2v-2M12 12h.01M16 12h.01" />
                  </svg>
                </button>

                <!-- Delete / Restore -->
                {#if (trashedFiles as UserFile[]).find((tf) => tf.id === file.id)}
                  <!-- svelte-ignore a11y_consider_explicit_label -->
                  <!-- svelte-ignore event_directive_deprecated -->
                  <button
                    on:click={() => handleRestoreFile(file.id)}
                    class="text-green-400 hover:text-green-300 p-1 rounded hover:bg-gray-700 transition-colors"
                    title="Restore file"
                  >
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12h16M12 4v16" />
                    </svg>
                  </button>
                {:else}
                  <!-- svelte-ignore a11y_consider_explicit_label -->
                  <!-- svelte-ignore event_directive_deprecated -->
                  <button
                    on:click={() => handleDeleteFile(file.id)}
                    class="text-red-400 hover:text-red-300 p-1 rounded hover:bg-gray-700 transition-colors"
                    title="Delete file"
                  >
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                {/if}
              </div>

              <!-- Folder dropdown -->
              <div class="dropdown relative ml-4">
                <!-- svelte-ignore event_directive_deprecated -->
                <button
                  on:click={(e) => toggleDropdown(e, file.id)}
                  class="flex items-center px-3 py-2 bg-gray-700 text-gray-100 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-colors"
                >
                  <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z"
                    />
                  </svg>
                  <span>
                    {fileFolderMap[file.id] &&
                    folders.find((f: { id: any; }) => f.id === fileFolderMap[file.id])
                      ? folders.find((f: { id: any; }) => f.id === fileFolderMap[file.id])?.name
                      : 'Uncategorized'}
                  </span>
                  <svg class="h-4 w-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {#if openDropdownId === file.id}
                  <div class="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg z-20 border border-gray-600">
                    <div class="py-1">
                      <!-- svelte-ignore event_directive_deprecated -->
                      <button
                        on:click={() => handleFolderChange(file.id, '')}
                        class="w-full text-left px-4 py-2 text-sm text-gray-100 hover:bg-gray-600 transition-colors flex items-center"
                      >
                        <svg class="h-4 w-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                        Uncategorized
                        {#if !fileFolderMap[file.id]}
                          <svg class="h-4 w-4 ml-auto text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                          </svg>
                        {/if}
                      </button>

                      {#each folders as folder}
                        <!-- svelte-ignore event_directive_deprecated -->
                        <button
                          on:click={() => handleFolderChange(file.id, folder.id)}
                          class="w-full text-left px-4 py-2 text-sm text-gray-100 hover:bg-gray-600 transition-colors flex items-center"
                        >
                          <svg class="h-4 w-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z"
                            />
                          </svg>
                          {#if renameMode?.type === 'folder' && renameMode.id === folder.id}
                            <!-- svelte-ignore event_directive_deprecated -->
                            <!-- svelte-ignore a11y_autofocus -->
                            <input
                              bind:value={newNameInput}
                              on:keydown={(e) => {
                                if (e.key === 'Enter') finishRename('folder', folder.id);
                                if (e.key === 'Escape') renameMode = null;
                              }}
                              on:blur={() => finishRename('folder', folder.id)}
                              class="bg-gray-700 text-gray-100 px-2 py-1 rounded text-sm w-full"
                              autofocus
                            />
                          {:else}
                            {folder.name}
                          {/if}
                          {#if fileFolderMap[file.id] === folder.id}
                            <svg class="h-4 w-4 ml-auto text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          {/if}
                        </button>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="px-4 py-6 text-center text-gray-500">
          <svg
            class="h-12 w-12 mx-auto text-gray-600 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          No files in this folder
        </div>
      {/if}
    </div>
  {/each}
</div>
