<script lang="ts">
  import { ref, onValue, orderByChild, query, set, onChildRemoved, push, remove } from 'firebase/database';
  import { authState, getUserData, signInWithGoogle, signOut } from '$lib/firebase/firebase.svelte';
  import { database } from '$lib/firebase/firebase.svelte';
  import type { UserFile } from '$lib/types';
  import { isFirebaseId } from '$lib/utils';
  import FilesList from './FilesList.svelte';
  import ConfirmOverrideAuthDialog from '$lib/components/ConfirmOverrideAuthDialog.svelte';
  import RadioGroup from '$lib/components/RadioGroup.svelte';
  import type { Folder } from '$lib/stores/folders';

  const firebaseUser = $derived.by(() => {
    if (!authState.firebaseUser) return null;
    return authState.firebaseUser;
  });

  let fileList: UserFile[] | null = $state(null);
  let folders: Folder[] = $state([]);
  let fileFolderMap: Record<string, string | null> = $state({});
  let isLoading = $state(true);
  
  const userData = getUserData();

  // Load files
  $effect(() => {
    if (!firebaseUser) {
      fileList = null;
      isLoading = false;
      return;
    }
    
    isLoading = true;
    const userFilesRef = ref(database, `users/${firebaseUser.uid}/files`);
    const unsubscribeValue = onValue(
      query(userFilesRef, orderByChild('lastAccessTime')),
      (snapshot) => {
        if (!snapshot.exists()) {
          fileList = [];
        } else {
          const newFiles: UserFile[] = [];
          snapshot.forEach((childSnapshot) => {
            const data = childSnapshot.val();
            const key = childSnapshot.key;
            if (key && isFirebaseId(key)) {
              newFiles.push({ id: key, ...data });
            }
          });
          fileList = newFiles.reverse();
        }
        isLoading = false;
      }
    );
    
    const unsubscribeChildRemoved = onChildRemoved(userFilesRef, (snapshot) => {
      const removedFileId = snapshot.key;
      if (removedFileId) fileList = fileList?.filter((f) => f.id !== removedFileId) ?? [];
    });
    
    return () => {
      unsubscribeValue();
      unsubscribeChildRemoved();
    };
  });

  // Load folders
  $effect(() => {
    if (!firebaseUser) {
      folders = [];
      return;
    }
    
    const foldersRef = ref(database, `users/${firebaseUser.uid}/folders`);
    const unsubscribe = onValue(foldersRef, (snapshot) => {
      if (!snapshot.exists()) {
        folders = [];
      } else {
        const newFolders: Folder[] = [];
        snapshot.forEach((childSnapshot) => {
          const data = childSnapshot.val();
          const key = childSnapshot.key;
          if (key && data) {
            newFolders.push({ id: key, name: data.name });
          }
        });
        folders = newFolders.sort((a, b) => a.name.localeCompare(b.name));
      }
    });
    
    return unsubscribe;
  });

  // Load file-folder mappings
  $effect(() => {
    if (!firebaseUser) {
      fileFolderMap = {};
      return;
    }
    
    const mapRef = ref(database, `users/${firebaseUser.uid}/fileFolderMap`);
    const unsubscribe = onValue(mapRef, (snapshot) => {
      if (!snapshot.exists()) {
        fileFolderMap = {};
      } else {
        fileFolderMap = snapshot.val() || {};
      }
    });
    
    return unsubscribe;
  });

  let filesToShow = $derived.by(() => {
    if (!fileList) return null;
    if (userData.showHiddenFiles === 'yes') return fileList;
    return fileList.filter((f) => !f.hidden);
  });

  let confirmOverrideAuthDialog: ConfirmOverrideAuthDialog | undefined = $state(undefined);
  
  const onSignIn = () => {
    signInWithGoogle(async () => {
      const override = (await confirmOverrideAuthDialog?.open()) ?? false;
      return override;
    });
  };
  
  const onUpdateShowHiddenFiles = (newValue: string) => {
    if (userData.showHiddenFiles === newValue) return;
    if (!firebaseUser) return;
    set(
      ref(database, `users/${firebaseUser.uid}/data/showHiddenFiles`),
      newValue as 'yes' | 'no'
    ).catch((error) => {
      alert('Error updating Show Hidden Files preference: ' + error);
    });
  };

  async function addFolder() {
    const name = prompt('Enter folder name:');
    if (!name?.trim() || !firebaseUser) return;
    
    try {
      const foldersRef = ref(database, `users/${firebaseUser.uid}/folders`);
      await push(foldersRef, { 
        name: name.trim(),
        createdAt: Date.now()
      });
    } catch (error) {
      alert('Error creating folder: ' + error);
    }
  }

  async function updateFileFolder(event: CustomEvent<{ id: string; folderId: string }>) {
    const { id, folderId } = event.detail;
    if (!firebaseUser) return;
    
    try {
      const mapRef = ref(database, `users/${firebaseUser.uid}/fileFolderMap/${id}`);
      if (folderId) {
        await set(mapRef, folderId);
      } else {
        await remove(mapRef);
      }
    } catch (error) {
      alert('Error updating file folder: ' + error);
    }
  }

  async function deleteFolder(event: CustomEvent<{ folderId: string }>) {
    const { folderId } = event.detail;
    if (!firebaseUser) return;
    
    try {
      // Remove the folder
      const folderRef = ref(database, `users/${firebaseUser.uid}/folders/${folderId}`);
      await remove(folderRef);
      
      // Remove all file mappings to this folder
      const updates: Record<string, null> = {};
      Object.keys(fileFolderMap).forEach(fileId => {
        if (fileFolderMap[fileId] === folderId) {
          updates[`users/${firebaseUser.uid}/fileFolderMap/${fileId}`] = null;
        }
      });
      
      if (Object.keys(updates).length > 0) {
        await set(ref(database), updates);
      }
    } catch (error) {
      alert('Error deleting folder: ' + error);
    }
  }

  let sortKey: 'name' | 'created' | 'lastAccessed' = $state('lastAccessed');
  let sortDir: 'asc' | 'desc' = $state('desc');
  
  let sortedFiles = $derived.by(() => {
    if (!filesToShow) return null;
    const arr = [...filesToShow];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') cmp = (a.title || '').localeCompare(b.title || '');
      if (sortKey === 'created') cmp = (a.creationTime || 0) - (b.creationTime || 0);
      if (sortKey === 'lastAccessed') cmp = a.lastAccessTime - b.lastAccessTime;
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return arr;
  });
</script>

<div class="p-6 bg-gray-900 min-h-screen text-gray-100">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-100 mb-2">My Files</h1>
    <p class="text-gray-400">Manage and organize your documents</p>
  </div>

  <!-- Action Bar -->
  <div class="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-800 rounded-lg">
    <a
      href="/new"
      class="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors"
    >
      <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      New File
    </a>
    
    <button
      class="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-400 transition-colors"
      onclick={addFolder}
    >
      <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      New Folder
    </button>

    <div class="flex items-center space-x-4 ml-auto">
      <div class="flex items-center space-x-2">
        <label class="text-sm text-gray-300">Sort by:</label>
        <select
          bind:value={sortKey}
          class="rounded-md bg-gray-700 px-3 py-2 text-sm text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
        >
          <option value="lastAccessed">Last Accessed</option>
          <option value="created">Date Created</option>
          <option value="name">Name</option>
        </select>
        
        <select
          bind:value={sortDir}
          class="rounded-md bg-gray-700 px-3 py-2 text-sm text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </div>

      {#if firebaseUser && !firebaseUser.isAnonymous}
        <div class="flex items-center space-x-2">
          <label class="text-sm text-gray-300">Show hidden:</label>
          <RadioGroup
			value={userData.showHiddenFiles}
			options={{
				yes: 'Yes',
				no: 'No'
			}}
			theme={userData.theme}
			onchange={(e) => (onUpdateShowHiddenFiles(e))}
		/>
        </div>
      {/if}
    </div>
  </div>

  <!-- Authentication Status -->
  {#if !firebaseUser || firebaseUser.isAnonymous}
    <div class="text-center py-12">
      <svg class="h-16 w-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
      <h3 class="text-lg font-medium text-gray-300 mb-2">Sign in to access your files</h3>
      <p class="text-gray-500 mb-6">Your files are securely stored and synced across devices</p>
      <button
        class="inline-flex items-center rounded-md bg-indigo-600 px-6 py-3 text-base font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors"
        onclick={onSignIn}
      >
        <svg class="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
        </svg>
        Sign in with Google
      </button>
    </div>
  {:else}
    <!-- Main Content Area -->
    {#if isLoading}
      <div class="flex justify-center items-center py-16">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        <span class="ml-3 text-gray-400">Loading your files...</span>
      </div>
    {:else if sortedFiles && sortedFiles.length > 0}
      <!-- Files List Component -->
      <FilesList 
        files={sortedFiles} 
        {folders} 
        {fileFolderMap}
        on:updateFileFolder={updateFileFolder}
        on:deleteFolder={deleteFolder}
      />
    {:else}
      <!-- Empty State -->
      <div class="text-center py-16">
        <svg class="h-24 w-24 mx-auto text-gray-600 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 class="text-xl font-medium text-gray-300 mb-2">No files yet</h3>
        <p class="text-gray-500 mb-8 max-w-md mx-auto">
          Get started by creating your first document. All your files will be automatically saved and synced across your devices.
        </p>
        <a
          href="/new"
          class="inline-flex items-center rounded-md bg-indigo-600 px-6 py-3 text-base font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors"
        >
          <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Create your first file
        </a>
      </div>
    {/if}

    <!-- User Info Footer -->
    <div class="mt-12 pt-6 border-t border-gray-700">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          {#if firebaseUser.photoURL}
            <img 
              src={firebaseUser.photoURL} 
              alt="Profile" 
              class="h-8 w-8 rounded-full"
            />
          {:else}
            <div class="h-8 w-8 bg-gray-600 rounded-full flex items-center justify-center">
              <svg class="h-5 w-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          {/if}
          <div>
            <p class="text-sm font-medium text-gray-100">
              {firebaseUser.displayName || firebaseUser.email}
            </p>
            <p class="text-xs text-gray-500">
              {sortedFiles?.length || 0} files • {folders.length} folders
            </p>
          </div>
        </div>
        
        <button
          onclick={signOut}
          class="text-sm text-gray-400 hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded px-2 py-1 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  {/if}
</div>

<ConfirmOverrideAuthDialog bind:this={confirmOverrideAuthDialog} />