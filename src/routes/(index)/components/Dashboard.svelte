<script lang="ts">
  import {
    ref,
    onValue,
    orderByChild,
    query,
    set,
    onChildRemoved,
    push,
    remove,
    update,
  } from 'firebase/database';
  import {
    authState,
    getUserData,
    signInWithGoogle,
    signOut,
  } from '$lib/firebase/firebase.svelte';
  import { database } from '$lib/firebase/firebase.svelte';
  import { createEventDispatcher } from 'svelte';
  import type { UserFile } from '$lib/types';
  import { isFirebaseId } from '$lib/utils';
  import FilesList from './FilesList.svelte';
  import ConfirmOverrideAuthDialog from '$lib/components/ConfirmOverrideAuthDialog.svelte';
  import RadioGroup from '$lib/components/RadioGroup.svelte';
  import type { Folder } from '$lib/stores/folders';

  // -- Derive the Firebase user from authState --
  const firebaseUser = $derived.by(() => authState.firebaseUser ?? null);
  const dispatch = createEventDispatcher<{
    change: string;
  }>();

  // -- Local state variables --
  let fileList: UserFile[] | null = $state(null);
  let folders: Folder[] = $state([]);
  let fileFolderMap: Record<string, string | null> = $state({});
  let isLoading = $state(true);
  let searchQuery = $state('');
  let selectedFiles = $state(new Set<string>());
  let draggedFile: UserFile | null = $state(null);
  let viewMode: 'list' | 'grid' = $state('list');
  let showSidebar = $state(true);
  let currentFolder: string | null = $state(null);
  let breadcrumb: Array<{ id: string | null; name: string }> = $state([
    { id: null, name: 'All Files' },
  ]);
  let recentFiles: UserFile[] = $state([]);
  let starredFiles = $state(new Set<string>());
  let trashedFiles: UserFile[] = $state([]);
  let showTrash = $state(false);
  let undoStack: Array<{ action: string; data: any }> = $state([]);
  let fileTags: Record<string, string[]> = $state({});
  let currentPage = $state(1);
  let filesPerPage = $state(50);
  let syncStatus: Record<string, 'saving' | 'saved' | 'error'> = $state({});
  let fileVersions: Record<string, Array<{ timestamp: number; content: string }>> =
    $state({});
  let contextMenu: {
    x: number;
    y: number;
    fileId?: string;
    folderId?: string;
  } | null = $state(null);
  let renameMode: { type: 'file' | 'folder'; id: string } | null = $state(null);

  const userData = getUserData();
  let confirmOverrideAuthDialog: ConfirmOverrideAuthDialog | undefined =
    $state(undefined);



  // -- Keyboard shortcuts --
  const handleKeyboardShortcuts = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'n':
          e.preventDefault();
          window.location.href = '/new';
          break;
        case 'a':
          e.preventDefault();
          if (sortedFiles) {
            selectedFiles = new Set(sortedFiles.map((f) => f.id));
          }
          break;
        case 'z':
          e.preventDefault();
          undoLastAction();
          break;
        case 'f':
          e.preventDefault();
          document.getElementById('search-input')?.focus();
          break;
      }
    }
    if (e.key === 'Delete' && selectedFiles.size > 0) {
      deleteSelectedFiles();
    }
  };

  // -- Load files from Firebase --
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
              newFiles.push({
                id: key,
                ...data,
                // Cast to any so TS won’t complain if UserFile type lacks these properties
                size: (data as any).content?.length || 0,
                fileType: (data as any).language || 'text',
                content: (data as any).content ?? '',
                creationTime: data.creationTime ?? Date.now(),
                lastAccessTime: data.lastAccessTime ?? Date.now(),
                hidden: data.hidden ?? false,
                title: data.title ?? '',
              } as UserFile);
            }
          });
          // Reverse to show newest first
          fileList = newFiles.reverse();
          // Update recentFiles to last 10 accessed
          recentFiles = newFiles.slice(0, 10);
        }
        isLoading = false;
      }
    );

    const unsubscribeChildRemoved = onChildRemoved(userFilesRef, (snapshot) => {
      const removedFileId = snapshot.key;
      if (removedFileId && fileList) {
        fileList = fileList.filter((f) => f.id !== removedFileId);
      }
    });

    return () => {
      unsubscribeValue();
      unsubscribeChildRemoved();
    };
  });

  // -- Load folders from Firebase --
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
            newFolders.push({
              id: key,
              name: data.name,
            });
          }
        });
        // Sort alphabetically
        folders = newFolders.sort((a, b) => a.name.localeCompare(b.name));
      }
    });

    return unsubscribe;
  });

  // -- Load starred, tags, and trash data --
  $effect(() => {
    if (!firebaseUser) return;

    // Starred files
    const starredRef = ref(database, `users/${firebaseUser.uid}/starred`);
    const unsubscribeStarred = onValue(starredRef, (snapshot) => {
      if (snapshot.exists()) {
        starredFiles = new Set(Object.keys(snapshot.val()));
      }
    });

    // File tags
    const tagsRef = ref(database, `users/${firebaseUser.uid}/fileTags`);
    const unsubscribeTags = onValue(tagsRef, (snapshot) => {
      fileTags = snapshot.exists() ? snapshot.val() : {};
    });

    // Trash
    const trashRef = ref(database, `users/${firebaseUser.uid}/trash`);
    const unsubscribeTrash = onValue(trashRef, (snapshot) => {
      if (snapshot.exists()) {
        const trashData: UserFile[] = [];
        snapshot.forEach((childSnapshot) => {
          const data = childSnapshot.val();
          const key = childSnapshot.key;
          if (key && data) {
            trashData.push({
              id: key,
              ...data,
              content: (data as any).content ?? '',
              creationTime: data.creationTime ?? Date.now(),
              lastAccessTime: data.lastAccessTime ?? Date.now(),
              hidden: data.hidden ?? false,
              title: data.title ?? '',
            } as UserFile);
          }
        });
        trashedFiles = trashData;
      }
    });

    return () => {
      unsubscribeStarred();
      unsubscribeTags();
      unsubscribeTrash();
    };
  });

  // -- Load file-folder mappings --
  $effect(() => {
    if (!firebaseUser) {
      fileFolderMap = {};
      return;
    }

    const mapRef = ref(database, `users/${firebaseUser.uid}/fileFolderMap`);
    const unsubscribe = onValue(mapRef, (snapshot) => {
      fileFolderMap = snapshot.exists() ? snapshot.val() : {};
    });
    return unsubscribe;
  });

  // -- Derived list to show, applying filters, search, and trash toggle --
  let filesToShow = $derived.by(() => {
    if (!fileList) return null;

    // Filter hidden if needed
    let files = userData.showHiddenFiles === 'yes'
      ? fileList
      : fileList.filter((f) => !(f as any).hidden);

    // Filter by current folder (if not in Trash mode)
    if (!showTrash) {
      if (currentFolder) {
        files = files.filter((f) => fileFolderMap[f.id] === currentFolder);
      }
      // else show all (root) or all folders
    }

    // Search filter (by title, content, or tags)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      files = files.filter((f) => {
        const titleMatch = f.title?.toLowerCase().includes(q);
        const contentMatch = (f as any).content
          ? (f as any).content.toLowerCase().includes(q)
          : false;
        const tagsMatch =
          fileTags[f.id]?.some((tag) => tag.toLowerCase().includes(q)) ?? false;
        return titleMatch || contentMatch || tagsMatch;
      });
    }

    return showTrash ? trashedFiles : files;
  });

  // -- Sign-in handler with override dialog --
  const onSignIn = () => {
    signInWithGoogle(async () => {
      const override = (await confirmOverrideAuthDialog?.open()) ?? false;
      return override;
    });
  };

  // -- Update “show hidden” preference in Firebase (takes a string directly) --
  const onUpdateShowHiddenFiles = (newValue: string) => {
    if (userData.showHiddenFiles === newValue) return;
    if (!firebaseUser) return;
    set(
      ref(database, `users/${firebaseUser.uid}/data/showHiddenFiles`),
      newValue as 'yes' | 'no'
    ).catch((error) => {
      alert('Error updating Show Hidden Files: ' + error);
    });
  };

  // -- Create a new folder in Firebase --
  async function addFolder() {
    const name = prompt('Enter folder name:');
    if (!name?.trim() || !firebaseUser) return;
    try {
      const foldersRef = ref(database, `users/${firebaseUser.uid}/folders`);
      await push(foldersRef, {
        name: name.trim(),
        createdAt: Date.now(),
      });
      addToUndoStack('createFolder', { name: name.trim() });
    } catch (error) {
      alert('Error creating folder: ' + error);
    }
  }

  // -- Update a file’s folder mapping --
  async function updateFileFolder(event: CustomEvent<{ id: string; folderId: string }>) {
    const { id, folderId } = event.detail;
    if (!firebaseUser) return;
    const oldFolderId = fileFolderMap[id];
    try {
      const mapRef = ref(database, `users/${firebaseUser.uid}/fileFolderMap/${id}`);
      if (folderId) {
        await set(mapRef, folderId);
      } else {
        await remove(mapRef);
      }
      addToUndoStack('moveFile', {
        fileId: id,
        oldFolderId,
        newFolderId: folderId,
      });
    } catch (error) {
      alert('Error updating file folder: ' + error);
    }
  }

  // -- Delete a folder (moves its files to root) --
  async function deleteFolder(event: CustomEvent<{ folderId: string }>) {
    const { folderId } = event.detail;
    if (!firebaseUser) return;
    const folderToDelete = folders.find((f) => f.id === folderId);
    if (!folderToDelete) return;
    if (
      !confirm(
        `Are you sure you want to delete folder "${folderToDelete.name}"? Files will move to root.`
      )
    ) {
      return;
    }
    try {
      // Remove the folder entry
      const folderRef = ref(database, `users/${firebaseUser.uid}/folders/${folderId}`);
      await remove(folderRef);

      // Unset mapping for all files in that folder
      const updates: Record<string, null> = {};
      Object.keys(fileFolderMap).forEach((fid) => {
        if (fileFolderMap[fid] === folderId) {
          updates[`users/${firebaseUser.uid}/fileFolderMap/${fid}`] = null;
        }
      });
      if (Object.keys(updates).length > 0) {
        await update(ref(database), updates);
      }
      addToUndoStack('deleteFolder', {
        folder: folderToDelete,
        fileIds: Object.keys(fileFolderMap).filter((fid) => fileFolderMap[fid] === folderId),
      });
    } catch (error) {
      alert('Error deleting folder: ' + error);
    }
  }

  // -- Drag-and-drop handlers for moving files between folders --
  const handleDragStart = (file: UserFile, e: DragEvent) => {
    draggedFile = file;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  };
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  };
  const handleDrop = async (folderId: string | null, e: DragEvent) => {
    e.preventDefault();
    if (!draggedFile || !firebaseUser) return;
    try {
      const mapRef = ref(
        database,
        `users/${firebaseUser.uid}/fileFolderMap/${draggedFile.id}`
      );
      if (folderId) {
        await set(mapRef, folderId);
      } else {
        await remove(mapRef);
      }
      addToUndoStack('moveFile', {
        fileId: draggedFile.id,
        oldFolderId: fileFolderMap[draggedFile.id],
        newFolderId: folderId,
      });
    } catch (error) {
      alert('Error moving file: ' + error);
    }
    draggedFile = null;
  };

  // -- Toggle a single file’s selection for batch actions --
  const toggleFileSelection = (fileId: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(fileId)) {
      newSelection.delete(fileId);
    } else {
      newSelection.add(fileId);
    }
    selectedFiles = newSelection;
  };

  // -- Batch delete (soft-delete) of selected files --
  const deleteSelectedFiles = async () => {
    if (selectedFiles.size === 0 || !firebaseUser) return;
    if (
      !confirm(
        `Are you sure you want to delete ${selectedFiles.size} file(s)?`
      )
    ) {
      return;
    }
    const filesToDelete = Array.from(selectedFiles)
      .map((id) => fileList?.find((f) => f.id === id))
      .filter(Boolean) as UserFile[];

    try {
      const updates: Record<string, any> = {};
      filesToDelete.forEach((file) => {
        // Soft-delete → move to "trash"
        updates[`users/${firebaseUser.uid}/trash/${file.id}`] = {
          ...file,
          deletedAt: Date.now(),
        };
        updates[`users/${firebaseUser.uid}/files/${file.id}`] = null;
      });
      await update(ref(database), updates);
      addToUndoStack('deleteFiles', { files: filesToDelete });
      selectedFiles = new Set();
    } catch (error) {
      alert('Error deleting files: ' + error);
    }
  };

  // -- Toggle star/unstar a single file --
  const toggleFileStar = async (fileId: string) => {
    if (!firebaseUser) return;
    const isStarred = starredFiles.has(fileId);
    const starRef = ref(database, `users/${firebaseUser.uid}/starred/${fileId}`);
    try {
      if (isStarred) {
        await remove(starRef);
      } else {
        await set(starRef, true);
      }
    } catch (error) {
      alert('Error updating starred status: ' + error);
    }
  };

  // -- Add a custom tag to a file --
  const addTagToFile = async (fileId: string, tag: string) => {
    if (!firebaseUser || !tag.trim()) return;
    const currentTags = fileTags[fileId] || [];
    if (currentTags.includes(tag.trim())) return;
    const newTags = [...currentTags, tag.trim()];
    const tagRef = ref(database, `users/${firebaseUser.uid}/fileTags/${fileId}`);
    try {
      await set(tagRef, newTags);
    } catch (error) {
      alert('Error adding tag: ' + error);
    }
  };

  // -- Undo stack helpers --
  const addToUndoStack = (action: string, data: any) => {
    undoStack = [...undoStack.slice(-9), { action, data }];
  };
  const undoLastAction = async () => {
    if (undoStack.length === 0 || !firebaseUser) return;
    const lastAction = undoStack[undoStack.length - 1];
    undoStack = undoStack.slice(0, -1);

    try {
      switch (lastAction.action) {
        case 'deleteFiles': {
          // Restore from trash
          const updates: Record<string, any> = {};
          lastAction.data.files.forEach((file: UserFile) => {
            updates[`users/${firebaseUser.uid}/files/${file.id}`] = file;
            updates[`users/${firebaseUser.uid}/trash/${file.id}`] = null;
          });
          await update(ref(database), updates);
          break;
        }
        case 'moveFile': {
          const { fileId, oldFolderId } = lastAction.data;
          const mapRef = ref(
            database,
            `users/${firebaseUser.uid}/fileFolderMap/${fileId}`
          );
          if (oldFolderId) {
            await set(mapRef, oldFolderId);
          } else {
            await remove(mapRef);
          }
          break;
        }
        // (Add more undo cases as needed)
      }
    } catch (error) {
      alert('Error undoing action: ' + error);
    }
  };

  // -- Restore a single file from trash --
  const restoreFile = async (fileId: string) => {
    if (!firebaseUser) return;
    const trashedFile = trashedFiles.find((f) => f.id === fileId);
    if (!trashedFile) return;
    try {
      const updates: Record<string, any> = {};
      updates[`users/${firebaseUser.uid}/files/${fileId}`] = {
        ...trashedFile,
        deletedAt: null,
      };
      updates[`users/${firebaseUser.uid}/trash/${fileId}`] = null;
      await update(ref(database), updates);
    } catch (error) {
      alert('Error restoring file: ' + error);
    }
  };

  // -- Duplicate a file (push a copy) --
  const duplicateFile = async (fileId: string) => {
    if (!firebaseUser) return;
    const originalFile = fileList?.find((f) => f.id === fileId);
    if (!originalFile) return;
    try {
      const filesRef = ref(database, `users/${firebaseUser.uid}/files`);
      await push(filesRef, {
        ...originalFile,
        title: `Copy of ${originalFile.title}`,
        creationTime: Date.now(),
        lastAccessTime: Date.now(),
      });
    } catch (error) {
      alert('Error duplicating file: ' + error);
    }
  };

  // -- Breadcrumb navigation --
  const navigateToFolder = (folderId: string | null, folderName: string) => {
    currentFolder = folderId;
    if (folderId) {
      breadcrumb = [...breadcrumb, { id: folderId, name: folderName }];
    } else {
      breadcrumb = [{ id: null, name: 'All Files' }];
    }
  };
  const navigateToBreadcrumb = (index: number) => {
    const target = breadcrumb[index];
    currentFolder = target.id;
    breadcrumb = breadcrumb.slice(0, index + 1);
  };

  // -- Context menu handlers (right-click) --
  const showContextMenu = (e: MouseEvent, fileId?: string, folderId?: string) => {
    e.preventDefault();
    contextMenu = { x: e.clientX, y: e.clientY, fileId, folderId };
  };
  const hideContextMenu = () => {
    contextMenu = null;
  };

  // -- Start inline renaming for file or folder --
  const startRename = (type: 'file' | 'folder', id: string) => {
    renameMode = { type, id };
    hideContextMenu();
  };
  // -- Finish an inline rename and push to Firebase --
  const finishRename = async (newName: string) => {
    if (!renameMode || !firebaseUser || !newName.trim()) {
      renameMode = null;
      return;
    }
    try {
      if (renameMode.type === 'file') {
        const fileRef = ref(
          database,
          `users/${firebaseUser.uid}/files/${renameMode.id}/title`
        );
        await set(fileRef, newName.trim());
      } else {
        const folderRef = ref(
          database,
          `users/${firebaseUser.uid}/folders/${renameMode.id}/name`
        );
        await set(folderRef, newName.trim());
      }
    } catch (error) {
      alert('Error renaming: ' + error);
    }
    renameMode = null;
  };

  // -- Sorting and pagination logic --
  let sortKey: 'name' | 'created' | 'lastAccessed' | 'size' | 'type' =
    $state('lastAccessed');
  let sortDir: 'asc' | 'desc' = $state('desc');

  let sortedFiles = $derived.by(() => {
    if (!filesToShow) return null;
    const arr = [...filesToShow];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') cmp = (a.title || '').localeCompare(b.title || '');
      if (sortKey === 'created')
        cmp = (a.creationTime || 0) - (b.creationTime || 0);
      if (sortKey === 'lastAccessed')
        cmp = a.lastAccessTime - b.lastAccessTime;
      if (sortKey === 'size')
        cmp = ((a as any).size || 0) - ((b as any).size || 0);
      if (sortKey === 'type')
        cmp = ((a as any).fileType || '').localeCompare((b as any).fileType || '');
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return arr;
  });

  let paginatedFiles = $derived.by(() => {
    if (!sortedFiles) return null;
    const start = (currentPage - 1) * filesPerPage;
    const end = start + filesPerPage;
    return sortedFiles.slice(start, end);
  });

  let totalPages = $derived.by(() => {
    if (!sortedFiles) return 0;
    return Math.ceil(sortedFiles.length / filesPerPage);
  });

  // -- File upload via drag/drop --
  const handleFileUpload = async (e: DragEvent) => {
    e.preventDefault();
    if (!e.dataTransfer?.files || !firebaseUser) return;
    const incoming = Array.from(e.dataTransfer.files);
    for (const file of incoming) {
      try {
        setSyncStatus(file.name, 'saving');
        const content = await file.text();
        const filesRef = ref(
          database,
          `users/${firebaseUser.uid}/files`
        );
        await push(filesRef, {
          title: file.name,
          content,
          language: getLanguageFromFile(file.name),
          creationTime: Date.now(),
          lastAccessTime: Date.now(),
          size: content.length,
          fileType: file.type || 'text',
          hidden: false,
        });
        setSyncStatus(file.name, 'saved');
      } catch (error) {
        setSyncStatus(file.name, 'error');
        console.error('Error uploading file:', error);
      }
    }
  };

  const getLanguageFromFile = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'cpp':
      case 'cc':
      case 'cxx':
        return 'cpp';
      case 'java':
        return 'java';
      case 'py':
        return 'py';
      case 'js':
        return 'javascript';
      case 'ts':
        return 'typescript';
      default:
        return 'text';
    }
  };

  const setSyncStatus = (
    fileId: string,
    status: 'saving' | 'saved' | 'error'
  ) => {
    syncStatus = { ...syncStatus, [fileId]: status };
    if (status === 'saved') {
      setTimeout(() => {
        const newStatus = { ...syncStatus };
        delete newStatus[fileId];
        syncStatus = newStatus;
      }, 2000);
    }
  };

  // -- Global event listeners for keyboard and click-outside --
  $effect(() => {
    document.addEventListener('keydown', handleKeyboardShortcuts);
    document.addEventListener('click', hideContextMenu);
    return () => {
      document.removeEventListener('keydown', handleKeyboardShortcuts);
      document.removeEventListener('click', hideContextMenu);
    };
  });
</script>

<style>
  /* Keep your existing Tailwind or custom CSS here */
</style>

<!-- svelte-ignore event_directive_deprecated -->
<!-- svelte-ignore event_directive_deprecated -->
<div
  role="region"
  aria-label="File drop zone"
  class="p-6 bg-gray-900 min-h-screen text-gray-100"
  on:drop={handleFileUpload}
  on:dragover={handleDragOver}
>
  <!-- ================= HEADER ================= -->
  <div class="mb-8 flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold text-gray-100 mb-2">My Files</h1>
      <p class="text-gray-400">Manage and organize your documents</p>
    </div>

    <!-- View Toggle + Sidebar Toggle -->
    <div class="flex items-center space-x-4">
      <button
        on:click={() => (viewMode = viewMode === 'list' ? 'grid' : 'list')}
        class="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
        title="Toggle view"
      >
        {#if viewMode === 'list'}
          <!-- Grid icon -->
          <svg
            class="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
            />
          </svg>
        {:else}
          <!-- List icon -->
          <svg
            class="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 10h16M4 14h16M4 18h16"
            />
          </svg>
        {/if}
      </button>
      <!-- svelte-ignore a11y_consider_explicit_label -->
      <!-- svelte-ignore a11y_consider_explicit_label -->

      <button
        on:click={() => (showSidebar = !showSidebar)}
        class="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
        title="Toggle sidebar"
      >
        <svg
          class="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h16M4 18h7"
          />
        </svg>
      </button>
    </div>
  </div>

  <div class="flex gap-6">
    <!-- ================ SIDEBAR ================ -->
    {#if showSidebar}
      <div class="w-64 bg-gray-800 rounded-lg p-4 h-fit sticky top-6">
        <!-- Quick Actions -->
        <div class="mb-6">
          <h3 class="text-sm font-medium text-gray-300 mb-3">Quick Actions</h3>
          <div class="space-y-2">
            <a
              href="/new"
              class="flex items-center p-2 text-sm text-gray-300 hover:bg-gray-700 rounded"
            >
              <svg
                class="h-4 w-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New File
            </a>
            <button
              on:click={addFolder}
              class="flex items-center p-2 text-sm text-gray-300 hover:bg-gray-700 rounded w-full text-left"
            >
              <svg
                class="h-4 w-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Folder
            </button>
            <button
              on:click={() => (showTrash = !showTrash)}
              class="flex items-center p-2 text-sm text-gray-300 hover:bg-gray-700 rounded w-full text-left"
            >
              <svg
                class="h-4 w-4 mr-2"
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
              Trash ({trashedFiles.length})
            </button>
          </div>
        </div>

        <!-- Recent Files -->
        {#if recentFiles.length > 0 && !showTrash}
          <div class="mb-6">
            <h3 class="text-sm font-medium text-gray-300 mb-3">Recent Files</h3>
            <div class="space-y-1">
              {#each recentFiles.slice(0, 5) as file}
                <a
                  href={`/${file.id.replace(/^-/, '')}`}
                  class="flex items-center p-2 text-sm text-gray-400 hover:bg-gray-700 rounded truncate"
                  title={file.title}
                >
                  <svg
                    class="h-3 w-3 mr-2 flex-shrink-0"
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
                  <span class="truncate">{file.title}</span>
                </a>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Folders Tree (non‐Trash mode) -->
        {#if folders.length > 0 && !showTrash}
          <div class="mb-6">
            <h3 class="text-sm font-medium text-gray-300 mb-3">Folders</h3>
            <div class="space-y-1">
              <!-- “All Files” root button -->
              <button
                on:click={() => navigateToFolder(null, 'All Files')}
                class="flex items-center p-2 text-sm text-gray-300 hover:bg-gray-700 rounded w-full text-left {currentFolder === null ? 'bg-gray-700' : ''}"
              >
                <svg
                  class="h-4 w-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a1 1 0 00-1-1H6a1 1 0 01-1-1V7a1 1 0 011-1h7l2 2h6a1 1 0 011 1z"
                  />
                </svg>
                <span>All Files</span>
                <span class="ml-auto text-xs text-gray-500">{fileList?.length || 0}</span>
              </button>

                <!-- svelte-ignore a11y_no_static_element_interactions -->
              {#each folders as folder}
                <div
                  class="flex items-center group"
                  on:drop={(e) => handleDrop(folder.id, e)}
                  on:dragover={handleDragOver}
                >
                  <button
                    on:click={() => navigateToFolder(folder.id, folder.name)}
                    class="flex items-center p-2 text-sm text-gray-300 hover:bg-gray-700 rounded flex-1 text-left {currentFolder === folder.id ? 'bg-gray-700' : ''}"
                    on:contextmenu={(e) => showContextMenu(e, undefined, folder.id)}
                  >
                    <svg
                      class="h-4 w-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a1 1 0 00-1-1H6a1 1 0 01-1-1V7a1 1 0 011-1h7l2 2h6a1 1 0 011 1z"
                      />
                    </svg>
                    <span class="truncate">{folder.name}</span>
                  </button>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Starred Files (non‐Trash mode) -->
        {#if starredFiles.size > 0 && !showTrash}
          <div class="mb-6">
            <h3 class="text-sm font-medium text-gray-300 mb-3">
              Starred Files
            </h3>
            <div class="space-y-1">
              {#each Array.from(starredFiles).slice(0, 5) as starredId}
                {@const starredFile = fileList?.find((f) => f.id === starredId)}
                {#if starredFile}
                  <a
                    href={`/${starredFile.id.replace(/^-/, '')}`}
                    class="flex items-center p-2 text-sm text-gray-400 hover:bg-gray-700 rounded truncate"
                    title={starredFile.title}
                  >
                    <svg
                      class="h-3 w-3 mr-2 flex-shrink-0 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span class="truncate">{starredFile.title}</span>
                  </a>
                {/if}
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/if}

    <!-- ============ MAIN CONTENT ============ -->
    <div class="flex-1">
      <!-- Search + Breadcrumb -->
      <div class="mb-6">
        {#if !showTrash}
          <nav class="flex items-center space-x-2 text-sm text-gray-400 mb-4">
            {#each breadcrumb as crumb, i}
              <button
                on:click={() => navigateToBreadcrumb(i)}
                class="hover:text-gray-200 transition-colors {i === breadcrumb.length - 1 ? 'text-gray-200 font-medium' : ''}"
              >
                {crumb.name}
              </button>
              {#if i < breadcrumb.length - 1}
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              {/if}
            {/each}
          </nav>
        {/if}

        <div class="relative">
          <svg
            class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            id="search-input"
            type="text"
            placeholder="Search files by name, content, or tags..."
            bind:value={searchQuery}
            class="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
          />
          {#if searchQuery}
            <!-- svelte-ignore a11y_consider_explicit_label -->
            <!-- svelte-ignore a11y_consider_explicit_label -->
            <button
              on:click={() => (searchQuery = '')}
              class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
            >
              <svg
                class="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          {/if}
        </div>
      </div>

      <!-- Action Bar -->
      <div class="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-800 rounded-lg">
        <a
          href="/new"
          class="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors"
        >
          <svg
            class="h-4 w-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          New File
        </a>

        <button
          class="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-400 transition-colors"
          on:click={addFolder}
        >
          <svg
            class="h-4 w-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Folder
        </button>

        <!-- Batch Actions (delete / clear) -->
        {#if selectedFiles.size > 0}
          <div class="flex items-center space-x-2 bg-gray-700 px-3 py-2 rounded-lg">
            <span class="text-sm text-gray-300">
              {selectedFiles.size} selected
            </span>
            <!-- svelte-ignore a11y_consider_explicit_label -->
            <!-- svelte-ignore a11y_consider_explicit_label -->
            <button
              on:click={deleteSelectedFiles}
              class="text-red-400 hover:text-red-300 p-1"
              title="Delete selected files"
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
            <!-- svelte-ignore a11y_consider_explicit_label -->
            <button
              on:click={() => (selectedFiles = new Set())}
              class="text-gray-400 hover:text-gray-300 p-1"
              title="Clear selection"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        {/if}

        <!-- Undo Button -->
        {#if undoStack.length > 0}
          <button
            on:click={undoLastAction}
            class="inline-flex items-center rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-colors"
            title="Undo last action (Ctrl+Z)"
          >
            <svg
              class="h-4 w-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            </svg>
            Undo
          </button>
        {/if}

        <!-- Sort controls & “show hidden” toggle -->
        <div class="flex items-center space-x-4 ml-auto">
          <div class="flex items-center space-x-2">
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label class="text-sm text-gray-300">Sort by:</label>
            <select
              bind:value={sortKey}
              class="rounded-md bg-gray-700 px-3 py-2 text-sm text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
            >
              <option value="lastAccessed">Last Accessed</option>
              <option value="created">Date Created</option>
              <option value="name">Name</option>
              <option value="size">Size</option>
              <option value="type">Type</option>
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
                  <label for="show-hidden-toggle" class="text-sm text-gray-300">
                    Show hidden:
                  </label>
                  <RadioGroup
                      bind:value={userData.showHiddenFiles}
                      options={{ yes: 'Yes', no: 'No' }}
                      theme={userData.theme}
                    />
                </div>
              {/if}
        </div>
      </div>

      <!-- ========== AUTHENTICATION/BANNER ========== -->
      {#if !firebaseUser || firebaseUser.isAnonymous}
        <div class="text-center py-12">
          <svg
            class="h-16 w-16 mx-auto text-gray-600 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <h3 class="text-lg font-medium text-gray-300 mb-2">
            Sign in to access your files
          </h3>
          <p class="text-gray-500 mb-6">
            Your files are securely stored and synced across devices
          </p>
          <button
            class="inline-flex items-center rounded-md bg-indigo-600 px-6 py-3 text-base font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors"
            on:click={onSignIn}
          >
            <svg
              class="h-5 w-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                clip-rule="evenodd"
              />
            </svg>
            Sign in with Google
          </button>
        </div>
      {:else}
        <!-- ========== MAIN CONTENT AREA ========== -->
        {#if isLoading}
          <div class="flex justify-center items-center py-16">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            <span class="ml-3 text-gray-400">Loading your files...</span>
          </div>
        {:else if paginatedFiles && paginatedFiles.length > 0}
          <!-- ======== FILES LIST (TABLE OR GRID) ======== -->
          <div class="bg-gray-800 rounded-lg overflow-hidden">
            {#if viewMode === 'list'}
              <!-- ---- LIST VIEW ---- -->
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-700">
                    <tr>
                      <th class="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedFiles.size > 0 && selectedFiles.size === (sortedFiles?.length ?? 0)}
                          on:change={(e) => {
                            const tgt = e.target as HTMLInputElement;
                            if (tgt.checked && sortedFiles) {
                              selectedFiles = new Set<string>(
                                sortedFiles.map((f) => f.id)
                              );
                            } else {
                              selectedFiles = new Set<string>();
                            }
                          }}
                          class="rounded border-gray-600 text-indigo-600 focus:ring-indigo-500"
                        />
                      </th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Name
                      </th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Size
                      </th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Type
                      </th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Modified
                      </th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Folder
                      </th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-700">
                    {#each paginatedFiles as file (file.id)}
                      <tr
                        class="hover:bg-gray-700/50 transition-colors {selectedFiles.has(file.id) ? 'bg-indigo-900/30' : ''}"
                        draggable="true"
                        on:dragstart={(e) => handleDragStart(file, e)}
                        on:contextmenu={(e) => showContextMenu(e, file.id)}
                      >
                        <td class="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedFiles.has(file.id)}
                            on:change={() => toggleFileSelection(file.id)}
                            class="rounded border-gray-600 text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                        <td class="px-4 py-3">
                          <div class="flex items-center">
                            <svg
                              class="h-5 w-5 mr-3 text-gray-400"
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
                            <div>
                              {#if renameMode?.type === 'file' && renameMode.id === file.id}
                                <!-- svelte-ignore a11y_autofocus -->
                                <input
                                  type="text"
                                  value={file.title}
                                  on:blur={(e) => {
                                    finishRename((e.target as HTMLInputElement).value);
                                  }}
                                  on:keydown={(e) => {
                                    if (e.key === 'Enter') {
                                      finishRename((e.target as HTMLInputElement).value);
                                    }
                                    if (e.key === 'Escape') {
                                      renameMode = null;
                                    }
                                  }}
                                  class="bg-gray-700 text-gray-100 px-2 py-1 rounded text-sm"
                                  autofocus
                                />
                              {:else}
                                <a
                                  href={`/${file.id.replace(/^-/, '')}`}
                                  class="text-gray-100 hover:text-indigo-400 font-medium"
                                >
                                  {file.title}
                                </a>
                              {/if}

                              <!-- File Preview Snippet -->
                              {#if (file as any).content}
                                <p class="text-xs text-gray-500 mt-1 truncate max-w-md">
                                  {(file as any).content.substring(0, 100)}...
                                </p>
                              {/if}

                              <!-- Tags -->
                              {#if fileTags[file.id]?.length > 0}
                                <div class="flex flex-wrap gap-1 mt-1">
                                  {#each fileTags[file.id] as tag}
                                    <span class="px-2 py-1 bg-blue-900/30 text-blue-300 text-xs rounded">
                                      {tag}
                                    </span>
                                  {/each}
                                </div>
                              {/if}
                            </div>

                            <!-- Sync Status Indicator -->
                            {#if syncStatus[file.id]}
                              <div class="ml-2">
                                {#if syncStatus[file.id] === 'saving'}
                                  <div class="animate-spin h-4 w-4 border-2 border-yellow-400 border-t-transparent rounded-full"></div>
                                {:else if syncStatus[file.id] === 'saved'}
                                  <svg
                                    class="h-4 w-4 text-green-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      stroke-linecap="round"
                                      stroke-linejoin="round"
                                      stroke-width="2"
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                {:else if syncStatus[file.id] === 'error'}
                                  <svg
                                    class="h-4 w-4 text-red-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      stroke-linecap="round"
                                      stroke-linejoin="round"
                                      stroke-width="2"
                                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                {/if}
                              </div>
                            {/if}
                          </div>
                        </td>
                        <td class="px-4 py-3 text-sm text-gray-400">
                          {#if (file as any).size}
                            {( (file as any).size > 1024
                              ? `${Math.round((file as any).size / 1024)}KB`
                              : `${(file as any).size}B`) }
                          {:else}
                            -
                          {/if}
                        </td>
                        <td class="px-4 py-3 text-sm text-gray-400">
                          <span class="px-2 py-1 bg-gray-700 rounded text-xs uppercase">
                            {(file as any).fileType || 'text'}
                          </span>
                        </td>
                        <td class="px-4 py-3 text-sm text-gray-400">
                          {new Date(file.lastAccessTime).toLocaleDateString()}
                        </td>
                        <td class="px-4 py-3 text-sm text-gray-400">
                          {#if fileFolderMap[file.id]}
                            {@const fld = folders.find((f) => f.id === fileFolderMap[file.id]!)}
                            {fld?.name ?? 'Unknown'}
                          {:else}
                            Root
                          {/if}
                        </td>
                        <td class="px-4 py-3">
                          <div class="flex items-center space-x-2">
                            <!-- Star / Unstar -->
                            <!-- svelte-ignore a11y_consider_explicit_label -->
                            <button
                              on:click={() => toggleFileStar(file.id)}
                              class="p-1 hover:bg-gray-600 rounded {starredFiles.has(file.id) ? 'text-yellow-400' : 'text-gray-400'}"
                              title={starredFiles.has(file.id) ? 'Unstar' : 'Star'}
                            >
                              <svg
                                class="h-4 w-4"
                                fill={starredFiles.has(file.id) ? 'currentColor' : 'none'}
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-width="2"
                                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                />
                              </svg>
                            </button>

                            <!-- Duplicate -->
                            <!-- svelte-ignore a11y_consider_explicit_label -->
                            <button
                              on:click={() => duplicateFile(file.id)}
                              class="p-1 hover:bg-gray-600 rounded text-gray-400"
                              title="Duplicate"
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
                                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                            </button>

                            <!-- Restore / Delete -->
                            {#if trashedFiles.find((tf) => tf.id === file.id)}
                              <!-- svelte-ignore a11y_consider_explicit_label -->
                              <button
                                on:click={() => restoreFile(file.id)}
                                class="text-green-400 hover:text-green-300 p-1 rounded hover:bg-gray-700 transition-colors"
                                title="Restore file"
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
                                    d="M4 12h16M12 4v16"
                                  />
                                </svg>
                              </button>
                            {:else}
                              <!-- svelte-ignore a11y_consider_explicit_label -->
                              <button
                                on:click={() => {
                                  selectedFiles = new Set([file.id]);
                                  deleteSelectedFiles();
                                }}
                                class="text-red-400 hover:text-red-300 p-1 rounded hover:bg-gray-700 transition-colors"
                                title="Delete file"
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
                            {/if}
                          </div>
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            {:else}
              <!-- ---- GRID VIEW ---- -->
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                {#each paginatedFiles as file (file.id)}
                  <!-- svelte-ignore a11y_click_events_have_key_events -->
                  <!-- svelte-ignore a11y_no_static_element_interactions -->
                  <div
                    class="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors cursor-pointer relative group {selectedFiles.has(file.id) ? 'ring-2 ring-indigo-500' : ''}"
                    draggable="true"
                    on:dragstart={(e) => handleDragStart(file, e)}
                    on:contextmenu={(e) => showContextMenu(e, file.id)}
                    on:click={() => {
                      if (selectedFiles.has(file.id)) {
                        toggleFileSelection(file.id);
                      } else {
                        window.location.href = `/${file.id.replace(/^-/, '')}`;
                      }
                    }}
                  >
                    <!-- Selection checkbox -->
                    <div class="absolute top-2 left-2">
                      <input
                        type="checkbox"
                        checked={selectedFiles.has(file.id)}
                        on:change={() => toggleFileSelection(file.id)}
                        on:click={(e) => e.stopPropagation()}
                        class="rounded border-gray-600 text-indigo-600 focus:ring-indigo-500"
                      />
                    </div>

                    <!-- Star button -->
                    <div class="absolute top-2 right-2">
                      <!-- svelte-ignore a11y_consider_explicit_label -->
                      <button
                        on:click={(e) => {
                          e.stopPropagation();
                          toggleFileStar(file.id);
                        }}
                        class="p-1 hover:bg-gray-600 rounded {starredFiles.has(file.id) ? 'text-yellow-400' : 'text-gray-400'}"
                        title={starredFiles.has(file.id) ? 'Unstar' : 'Star'}
                      >
                        <svg
                          class="h-4 w-4"
                          fill={starredFiles.has(file.id) ? 'currentColor' : 'none'}
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                          />
                        </svg>
                      </button>
                    </div>

                    <!-- Icon + Title -->
                    <div class="flex flex-col items-center justify-center h-full mt-6">
                      <svg
                        class="h-10 w-10 text-gray-400 mb-2"
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
                      <p class="mt-2 text-sm text-gray-100 truncate max-w-full">
                        {file.title}
                      </p>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>

          <!-- ========== PAGINATION CONTROLS ========== -->
          {#if totalPages > 1}
            <div class="flex justify-center items-center mt-6 space-x-2">
              <button
                on:click={() => (currentPage = Math.max(currentPage - 1, 1))}
                class="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
                disabled={currentPage === 1}
              >
                Prev
              </button>
              <span class="text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                on:click={() => (currentPage = Math.min(currentPage + 1, totalPages))}
                class="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          {/if}
        {:else}
          <!-- ========== EMPTY STATE ========== -->
          <div class="text-center py-16">
            <svg
              class="h-24 w-24 mx-auto text-gray-600 mb-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 class="text-xl font-medium text-gray-300 mb-2">
              {showTrash ? 'No items in Trash' : 'No files found'}
            </h3>
            <p class="text-gray-500 mb-8 max-w-md mx-auto">
              {showTrash
                ? 'Your trash is empty.'
                : 'Create a new file or upload files to get started.'}
            </p>
            {#if !showTrash}
              <a
                href="/new"
                class="inline-flex items-center rounded-md bg-indigo-600 px-6 py-3 text-base font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors"
              >
                <svg
                  class="h-5 w-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create your first file
              </a>
            {/if}
          </div>
        {/if}

        <!-- ========== CONTEXT MENU ========== -->
        {#if contextMenu}
          <div
            class="absolute z-50 bg-gray-800 rounded shadow-lg py-2"
            style="top: {contextMenu.y}px; left: {contextMenu.x}px;"
          >
            {#if contextMenu.fileId}
              <!-- Rename File -->
              <button
                on:click={() => {
                  if (contextMenu!.fileId) {
                    startRename('file', contextMenu!.fileId);
                  }
                  hideContextMenu();
                }}
                class="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
              >
                Rename File
              </button>
              <!-- Duplicate File -->
              <button
                on:click={() => {
                  if (contextMenu!.fileId) {
                    duplicateFile(contextMenu!.fileId);
                  }
                  hideContextMenu();
                }}
                class="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
              >
                Duplicate File
              </button>
              <!-- Star / Unstar -->
              <button
                on:click={() => {
                  if (contextMenu!.fileId) {
                    toggleFileStar(contextMenu!.fileId);
                  }
                  hideContextMenu();
                }}
                class="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
              >
                {starredFiles.has(contextMenu!.fileId!) ? 'Unstar File' : 'Star File'}
              </button>
              <!-- Delete File -->
              <button
                on:click={() => {
                  if (contextMenu!.fileId) {
                    selectedFiles = new Set([contextMenu!.fileId!]);
                    deleteSelectedFiles();
                  }
                  hideContextMenu();
                }}
                class="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-700"
              >
                Delete File
              </button>
            {/if}

            {#if contextMenu.folderId}
              <!-- Rename Folder -->
              <button
                on:click={() => {
                  if (contextMenu!.folderId) {
                    startRename('folder', contextMenu!.folderId);
                  }
                  hideContextMenu();
                }}
                class="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
              >
                Rename Folder
              </button>
              <!-- Delete Folder -->
              <button
                on:click={() => {
                  if (contextMenu!.folderId) {
                    deleteFolder(
                      new CustomEvent<{ folderId: string }>('ignored', {
                        detail: { folderId: contextMenu!.folderId },
                      })
                    );
                  }
                  hideContextMenu();
                }}
                class="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-700"
              >
                Delete Folder
              </button>
            {/if}

            <!-- Close menu -->
            <button
              on:click={hideContextMenu}
              class="block w-full text-left px-4 py-2 text-sm text-gray-500 hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        {/if}

        <!-- ========== USER INFO FOOTER ========== -->
        {#if firebaseUser && !firebaseUser.isAnonymous}
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
                    <svg
                      class="h-5 w-5 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                {/if}
                <div>
                  <p class="text-sm font-medium text-gray-100">
                    {firebaseUser.displayName || firebaseUser.email}
                  </p>
                  <p class="text-xs text-gray-500">
                    {fileList?.length || 0} files • {folders.length} folders
                  </p>
                </div>
              </div>

              <button
                on:click={signOut}
                class="text-sm text-gray-400 hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded px-2 py-1 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        {/if}
      {/if}
    </div>
  </div>

  <ConfirmOverrideAuthDialog bind:this={confirmOverrideAuthDialog} />
</div>
