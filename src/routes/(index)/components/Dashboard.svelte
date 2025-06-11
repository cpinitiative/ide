<script lang="ts">
   import { ref, onValue, orderByChild, query, set, push, remove, update } from 'firebase/database';
   import { authState, getUserData, signInWithGoogle, signOut } from '$lib/firebase/firebase.svelte';
   import { database } from '$lib/firebase/firebase.svelte';
   import type { UserFile } from '$lib/types';
   import { isFirebaseId } from '$lib/utils';
   import ConfirmOverrideAuthDialog from '$lib/components/ConfirmOverrideAuthDialog.svelte';
   let actionMenuPosition = $state<{ x: number; y: number } | null>(null);
   let selectedFile: string | null = $state(null);


   interface FileItem extends UserFile {
       name: any;
       created: number;
       title: string; 
       type: 'file' | 'folder';
       parentFolder?: string;
       isDeleted?: boolean;
       deletedAt?: number;
   }


   const firebaseUser = $derived.by(() => {
       if (!authState.firebaseUser) {
           throw new Error(
               'Firebase user is null. The Dashboard component require that the firebase user is not null.'
           );
       }
       return authState.firebaseUser;
   });


   let files: FileItem[] | null = $state(null);
   let currentFolder: string | null = $state(null);
   let showRecentlyDeleted = $state(false);
   let contextMenu = $state<{ x: number; y: number; item?: FileItem; show: boolean }>({
       x: 0, y: 0, show: false
   });
   let actionMenu = $state<{ item: FileItem; show: boolean } | null>(null);
   let draggedItem: FileItem | null = $state(null);
   let renameInput = $state<{ id: string; value: string } | null>(null);
   let selectedItems = $state<Set<string>>(new Set());
   let touchStartTime = $state(0);
   let touchStartPos = $state<{ x: number; y: number }>({ x: 0, y: 0 });


   const userData = getUserData();

   $effect(() => {
       const userFilesRef = ref(database, `users/${firebaseUser.uid}/files`);
       const unsubscribe = onValue(query(userFilesRef, orderByChild('lastAccessTime')), (snapshot) => {
           if (!snapshot.exists()) {
               files = [];
           } else {
               const newFiles: FileItem[] = [];
               snapshot.forEach((childSnapshot) => {
                   const data = childSnapshot.val();
                   const key = childSnapshot.key;
                   if (key && isFirebaseId(key)) {
                       newFiles.push({
                           id: key,
                           name: data.name || data.title || 'Untitled',
                           type: data.type || 'file',
                           parentFolder: data.parentFolder || null,
                           isDeleted: data.isDeleted || false,
                           deletedAt: data.deletedAt || null,
                           created: data.created || data.creationTime || Date.now(),
                           lastAccessTime: data.lastAccessTime || Date.now(),
                           ...data // Spread remaining properties
                       });
                   }
               });
               files = newFiles.reverse();
           }
       });
       return unsubscribe;
   });


   const filesToShow = $derived.by(() => {
       if (!files) return [];
       if (showRecentlyDeleted) {
           return files.filter(file => file.isDeleted);
       }
       return files.filter(file => file.parentFolder === currentFolder && !file.isDeleted);
   });


   const formatDate = (timestamp: number) => {
       return new Date(timestamp).toLocaleDateString('en-US', {
           month: 'short',
           day: 'numeric',
           year: 'numeric'
       });
   };


   const handleContextMenu = (e: MouseEvent, item?: FileItem) => {
       e.preventDefault();
       contextMenu = {
           x: e.clientX,
           y: e.clientY,
           item,
           show: true
       };
       actionMenu = null;
   };


   const toggleActionMenu = (item: FileItem, event: MouseEvent) => {
       if (actionMenu?.item.id === item.id) {
           actionMenu = null;
           actionMenuPosition = null;
       } else {
           const button = event.currentTarget as HTMLElement;
           const rect = button.getBoundingClientRect();
           actionMenuPosition = {
               x: rect.left,
               y: rect.bottom + 4 // 4px offset from button
           };
           actionMenu = { item, show: true };
       }
       contextMenu = { ...contextMenu, show: false };
   };


   const closeMenus = () => {
       contextMenu = { ...contextMenu, show: false };
       actionMenu = null;
   };


   const createFolder = async () => {
       const title = prompt('Folder name:');
       if (title) {
           const folderRef = push(ref(database, `users/${firebaseUser.uid}/files`));
           await set(folderRef, {
               title, // Use title instead of name
               type: 'folder',
               created: Date.now(),
               lastAccessTime: Date.now(),
               parentFolder: currentFolder,
               isDeleted: false
           });
       }
       closeMenus();
   };


   const moveToTrash = async (item: FileItem) => {
       await update(ref(database, `users/${firebaseUser.uid}/files/${item.id}`), {
           isDeleted: true,
           deletedAt: Date.now()
       });
       closeMenus();
   };


   const restoreItem = async (item: FileItem) => {
       await update(ref(database, `users/${firebaseUser.uid}/files/${item.id}`), {
           isDeleted: false,
           deletedAt: null
       });
       closeMenus();
   };


   const startRename = (item: FileItem) => {
       renameInput = { id: item.id, value: item.title };
       closeMenus();
   };


   const confirmRename = async () => {
       if (renameInput) {
           await update(ref(database, `users/${firebaseUser.uid}/files/${renameInput.id}`), {
               title: renameInput.value 
           });
           renameInput = null;
       }
   };


   const cancelRename = () => {
       renameInput = null;
   };


   const handleTouchStart = (e: TouchEvent, item: FileItem) => {
       touchStartTime = Date.now();
       touchStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
       draggedItem = item;
   };


   const handleTouchMove = (e: TouchEvent) => {
       if (draggedItem) {
           e.preventDefault();
       }
   };
   const handleFileClick = (item: FileItem, event: MouseEvent) => {
       event.preventDefault();
       if (selectedFile === item.id) {
           selectedFile = null;
       } else {
           selectedFile = item.id;
       }
   };


   const handleTouchEnd = (e: TouchEvent, targetItem?: FileItem) => {
       const touchEndTime = Date.now();
       const touchDuration = touchEndTime - touchStartTime;
      
       if (touchDuration > 500 && draggedItem && !targetItem) {
           // Long press - show context menu
           handleContextMenu({
               preventDefault: () => {},
               clientX: touchStartPos.x,
               clientY: touchStartPos.y
           } as MouseEvent, draggedItem);
       } else if (draggedItem && targetItem && targetItem.type === 'folder' && draggedItem.id !== targetItem.id) {
           // Drop on folder
           handleDropAction(draggedItem, targetItem);
       }
      
       draggedItem = null;
       touchStartTime = 0;
   };


   const handleDragStart = (e: DragEvent, item: FileItem) => {
       draggedItem = item;
       e.dataTransfer!.effectAllowed = 'move';
   };


   const handleDragOver = (e: DragEvent) => {
       e.preventDefault();
       e.dataTransfer!.dropEffect = 'move';
   };


   const handleDrop = async (e: DragEvent, targetFolder: FileItem) => {
       e.preventDefault();
       if (draggedItem) {
           await handleDropAction(draggedItem, targetFolder);
       }
       draggedItem = null;
   };


   const handleDropAction = async (draggedItem: FileItem, targetFolder: FileItem) => {
       if (targetFolder.type === 'folder' && draggedItem.id !== targetFolder.id) {
           await update(ref(database, `users/${firebaseUser.uid}/files/${draggedItem.id}`), {
               parentFolder: targetFolder.id
           });
       }
   };


   const openFolder = (folder: FileItem) => {
       if (renameInput?.id === folder.id) return;
       currentFolder = folder.id;
       showRecentlyDeleted = false;
   };


   const goBack = () => {
       if (showRecentlyDeleted) {
           showRecentlyDeleted = false;
           return;
       }
       if (currentFolder) {
           const parent = files?.find(f => f.id === currentFolder)?.parentFolder;
           currentFolder = parent || null;
       }
   };


   const toggleRecentlyDeleted = () => {
       showRecentlyDeleted = !showRecentlyDeleted;
       currentFolder = null;
   };


   let confirmOverrideAuthDialog: ConfirmOverrideAuthDialog | undefined = undefined;
   const onSignIn = () => {
       signInWithGoogle(async () => {
           let override = (await confirmOverrideAuthDialog?.open()) ?? false;
           return override;
       });
   };


   // Close menus when clicking elsewhere
   $effect(() => {
       const handleClick = () => closeMenus();
       document.addEventListener('click', handleClick);
       return () => document.removeEventListener('click', handleClick);
   });
</script>


<div class="min-h-screen bg-[#1e1e1e] text-white">
   <div class="p-3 sm:p-6">
       <!-- Header -->
       <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
           <div class="flex flex-wrap items-center gap-2 sm:gap-4">
               <a
                   href="/new"
                   class="inline-flex items-center rounded-md bg-indigo-600 px-3 sm:px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#1e1e1e] focus:outline-none transition-colors"
               >
                   <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                   </svg>
                   New File
               </a>


               <button
                   onclick={createFolder}
                   class="inline-flex items-center rounded-md bg-green-600 px-3 sm:px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-[#1e1e1e] focus:outline-none transition-colors"
               >
                   <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                   </svg>
                   New Folder
               </button>
              
               {#if currentFolder || showRecentlyDeleted}
                   <button
                       onclick={goBack}
                       class="inline-flex items-center rounded-md bg-gray-700 px-3 py-2 text-sm font-medium text-white hover:bg-gray-600 transition-colors"
                   >
                       <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                       </svg>
                       Back
                   </button>
               {/if}


               <button
                   onclick={toggleRecentlyDeleted}
                   class="inline-flex items-center rounded-md {showRecentlyDeleted ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-red-600 hover:bg-red-700'} px-3 py-2 text-sm font-medium text-white transition-colors"
               >
                   <svg
                       class="w-4 h-4 mr-2"
                       fill="none"
                       stroke="currentColor"
                       viewBox="0 0 24 24"
                   >
                       {#if showRecentlyDeleted}
                           <!-- Back to Files icon -->
                           <path
                               stroke-linecap="round"
                               stroke-linejoin="round"
                               stroke-width="2"
                               d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                           />
                       {:else}
                           <!-- Trash icon -->
                           <path
                               stroke-linecap="round"
                               stroke-linejoin="round"
                               stroke-width="2"
                               d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                           />
                       {/if}
                   </svg>
                   <span class="hidden sm:inline">
                       {showRecentlyDeleted ? 'Back to Files' : 'Recently Deleted'}
                   </span>
                   <span class="sm:hidden">
                       {showRecentlyDeleted ? 'Files' : 'Trash'}
                   </span>
               </button>
           </div>


           <!-- User Info -->
           {#if firebaseUser.isAnonymous}
               <div class="flex items-center space-x-3 bg-gray-800 rounded-lg px-3 sm:px-4 py-2 w-full sm:w-auto">
                   <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                   </svg>
                   <span class="text-gray-300 flex-1 sm:flex-none">Not signed in</span>
                   <button
                       onclick={onSignIn}
                       class="bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded text-sm font-medium transition-colors"
                   >
                       Sign In
                   </button>
               </div>
           {:else}
               <div class="flex items-center space-x-3 bg-gray-800 rounded-lg px-3 sm:px-4 py-2 w-full sm:w-auto">
                   <img
                       src={firebaseUser.photoURL || '/default-avatar.png'}
                       alt="Profile"
                       class="w-6 h-6 rounded-full"
                   />
                   <span class="text-gray-300 flex-1 sm:flex-none text-sm sm:text-base truncate">{firebaseUser.displayName}</span>
                   <button
                       onclick={signOut}
                       class="text-gray-400 hover:text-white text-sm transition-colors"
                   >
                       Sign Out
                   </button>
               </div>
           {/if}
       </div>


       {#if showRecentlyDeleted}
           <div class="mb-4 text-sm text-gray-400">
               <span>Recently Deleted</span>
           </div>
       {/if}


       <!-- File Browser -->
       <div class="bg-[#2a2a2a] rounded-lg border border-gray-700 overflow-hidden">
           <!-- Desktop Header Row -->
           <div class="hidden sm:grid grid-cols-12 gap-4 px-4 py-3 bg-[#323232] border-b border-gray-600 text-sm font-medium text-gray-300">
               <div class="col-span-6">Name</div>
               <div class="col-span-3">Date Modified</div>
               <div class="col-span-3">Actions</div>
           </div>


           <!-- Mobile Header -->
           <div class="sm:hidden bg-[#323232] border-b border-gray-600 px-4 py-3">
               <div class="text-sm font-medium text-gray-300">Files</div>
           </div>


           <!-- Files List -->
           <!-- svelte-ignore a11y_no_static_element_interactions -->
           <div
               class="min-h-[400px] max-h-[70vh] overflow-y-auto"
               oncontextmenu={(e) => handleContextMenu(e)}
           >
               {#if filesToShow && filesToShow.length > 0}
                   {#each filesToShow as item (item.id)}
                       <!-- svelte-ignore a11y_click_events_have_key_events -->
                           <div
                               class="sm:grid sm:grid-cols-12 gap-4 px-4 py-3 border-b border-gray-700 transition-colors cursor-pointer group relative {selectedFile === item.id ? 'bg-gray-700/50' : 'hover:bg-[#363636]'}"
                               draggable="true"
                               ondragstart={(e) => handleDragStart(e, item)}
                               ondragover={item.type === 'folder' ? handleDragOver : undefined}
                               ondrop={item.type === 'folder' ? (e) => handleDrop(e, item) : undefined}
                               oncontextmenu={(e) => handleContextMenu(e, item)}
                               onclick={(e) => handleFileClick(item, e)}
                               ondblclick={() => {
                                   if (item.type === 'folder' && !showRecentlyDeleted) {
                                       openFolder(item);
                                   } else if (item.type === 'file') {
                                       window.location.href=`/${item.id.substring(1)}`;
                                   }
                               }}
                               ontouchstart={(e) => handleTouchStart(e, item)}
                               ontouchmove={handleTouchMove}
                               ontouchend={(e) => handleTouchEnd(e, item)}
                           >
                           <!-- Desktop Layout -->
                           <div class="hidden sm:block sm:col-span-6">
                               <div class="flex items-center space-x-3">
                                   {#if item.type === 'folder'}
                                       <svg class="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                                           <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
                                       </svg>
                                   {:else}
                                       <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                       </svg>
                                   {/if}
                                  
                                   {#if renameInput && renameInput.id === item.id}
                                       <!-- svelte-ignore a11y_autofocus -->
                                       <input
                                           bind:value={renameInput.value}
                                           onkeydown={(e) => {
                                               if (e.key === 'Enter') confirmRename();
                                               if (e.key === 'Escape') cancelRename();
                                           }}
                                           onblur={confirmRename}
                                           class="bg-[#404040] text-white px-2 py-1 rounded text-sm border border-gray-500 focus:border-indigo-500 focus:outline-none"
                                           autofocus
                                       />
                                   {:else}
                                       <span class="text-white">{item.name}</span>
                                   {/if}
                               </div>
                           </div>


                           <div class="hidden sm:block sm:col-span-3 text-gray-400 text-sm">
                               {formatDate(item.lastAccessTime || item.created || Date.now())}
                           </div>


                           <div class="hidden sm:block sm:col-span-3">
                               <div class="relative">
                                   <button
                                       onclick={(e) => {
                                           e.stopPropagation();
                                           toggleActionMenu(item, e);
                                       }}
                                       class="inline-flex items-center px-3 py-1.5 rounded-md bg-gray-700 hover:bg-gray-600 text-white text-sm transition-colors group"
                                   >
                                       <span>Actions</span>
                                       <svg
                                           class="w-4 h-4 ml-1.5 transition-transform duration-200 ${actionMenu?.item.id === item.id ? 'rotate-180' : ''}"
                                           fill="none"
                                           stroke="currentColor"
                                           viewBox="0 0 24 24"
                                       >
                                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                       </svg>
                                   </button>
                               </div>
                           </div>


                           <!-- Mobile Layout -->
                           <div class="sm:hidden">
                               <div class="flex items-center justify-between">
                                   <div class="flex items-center space-x-3 flex-1 min-w-0">
                                       {#if item.type === 'folder'}
                                           <svg class="w-5 h-5 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                               <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89-2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
                                           </svg>
                                       {:else}
                                           <svg class="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                           </svg>
                                       {/if}
                                      
                                       <div class="flex-1 min-w-0">
                                           {#if renameInput && renameInput.id === item.id}
                                               <!-- svelte-ignore a11y_autofocus -->
                                               <input
                                                   bind:value={renameInput.value}
                                                   onkeydown={(e) => {
                                                       if (e.key === 'Enter') confirmRename();
                                                       if (e.key === 'Escape') cancelRename();
                                                   }}
                                                   onblur={confirmRename}
                                                   class="w-full bg-[#404040] text-white px-2 py-1 rounded text-sm border border-gray-500 focus:border-indigo-500 focus:outline-none"
                                                   autofocus
                                               />
                                           {:else}
                                               <div class="text-white truncate">{item.name}</div>
                                               <div class="text-gray-400 text-xs">
                                                   {formatDate(item.lastAccessTime || item.created || Date.now())}
                                               </div>
                                           {/if}
                                       </div>
                                   </div>


                                   <!-- svelte-ignore a11y_consider_explicit_label -->
                                   <button
                                       onclick={(e) => {
                                           e.stopPropagation();
                                           toggleActionMenu(item, e);
                                       }}
                                       class="flex-shrink-0 p-2 rounded-md hover:bg-gray-600 transition-colors"
                                   >
                                       <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                       </svg>
                                   </button>
                               </div>
                           </div>
                       </div>
                   {/each}
               {:else if filesToShow && filesToShow.length === 0}
                   <div class="flex items-center justify-center h-64 text-gray-500">
                       <div class="text-center px-4">
                           <svg class="w-12 h-12 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                           </svg>
                           <p>{showRecentlyDeleted ? 'No deleted files' : 'No files or folders'}</p>
                           {#if !showRecentlyDeleted}
                               <p class="text-sm mt-1">Tap the + buttons above to create new items</p>
                           {/if}
                       </div>
                   </div>
               {:else}
                   <div class="flex items-center justify-center h-64 text-gray-500">
                       <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                       <span class="ml-3">Loading...</span>
                   </div>
               {/if}
           </div>
       </div>
   </div>


   <!-- Context Menu -->
   {#if contextMenu.show}
       <div
           class="fixed bg-[#2a2a2a] border border-gray-600 rounded-lg shadow-lg py-2 z-50 min-w-[160px]"
           style="left: {Math.min(contextMenu.x, window.innerWidth - 160)}px; top: {Math.min(contextMenu.y, window.innerHeight - 200)}px;"
       >
           {#if contextMenu.item}
               {#if showRecentlyDeleted}
                   <button
                       onclick={() => contextMenu.item && restoreItem(contextMenu.item)}
                       class="w-full text-left px-4 py-2 hover:bg-[#363636] text-green-400 text-sm"
                   >
                       Restore
                   </button>
               {:else}
                   <button
                       onclick={() => contextMenu.item && startRename(contextMenu.item)}
                       class="w-full text-left px-4 py-2 hover:bg-[#363636] text-white text-sm"
                   >
                       Rename
                   </button>
                   <hr class="border-gray-600 my-1" />
                   <button
                       onclick={() => contextMenu.item && moveToTrash(contextMenu.item)}
                       class="w-full text-left px-4 py-2 hover:bg-red-600 text-red-400 hover:text-white text-sm"
                   >
                       Move to Trash
                   </button>
               {/if}
           {:else if !showRecentlyDeleted}
               <button
                   onclick={createFolder}
                   class="w-full text-left px-4 py-2 hover:bg-[#363636] text-white text-sm"
               >
                   New Folder
               </button>
           {/if}
       </div>
   {/if}


   <!-- Action Menu -->
   {#if actionMenu?.show && actionMenuPosition}
       <!-- svelte-ignore a11y_click_events_have_key_events -->
       <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onclick={closeMenus}></div>
       <div
           class="fixed bg-[#2a2a2a] border border-gray-600 rounded-lg shadow-xl py-1.5 z-50 min-w-[180px] divide-y divide-gray-600/50"
           style="left: {actionMenuPosition.x}px; top: {actionMenuPosition.y}px;"
       >
           {#if showRecentlyDeleted}
               <button
                   onclick={() => actionMenu?.item && restoreItem(actionMenu.item)}
                   class="w-full flex items-center px-4 py-2 hover:bg-[#363636] text-green-400 hover:text-green-300 text-sm transition-colors"
               >
                   <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                   </svg>
                   Restore File
               </button>
           {:else}
               <div>
                   {#if actionMenu.item.type === 'file'}
                       <a
                           href="/{actionMenu.item.id.substring(1)}"
                           class="w-full flex items-center px-4 py-2 hover:bg-[#363636] text-white hover:text-indigo-300 text-sm transition-colors"
                       >
                           <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                           </svg>
                           Open Editor
                       </a>
                   {/if}
                   <button
                       onclick={() => actionMenu && startRename(actionMenu.item)}
                       class="w-full flex items-center px-4 py-2 hover:bg-[#363636] text-white hover:text-blue-300 text-sm transition-colors"
                   >
                       <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                       </svg>
                       Rename
                   </button>
               </div>
               <div>
                   <button
                       onclick={() => actionMenu && moveToTrash(actionMenu.item)}
                       class="w-full flex items-center px-4 py-2 hover:bg-red-600/20 text-red-400 hover:text-red-300 text-sm transition-colors"
                   >
                       <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                       </svg>
                       Move to Trash
                   </button>
               </div>
           {/if}
       </div>
   {/if}
</div>

<ConfirmOverrideAuthDialog bind:this={confirmOverrideAuthDialog} />