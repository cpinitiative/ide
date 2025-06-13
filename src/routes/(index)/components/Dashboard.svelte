<script lang="ts">
   import { ref, onValue, orderByChild, query, set, push, remove, update } from 'firebase/database';
   import { authState, getUserData, signInWithGoogle, signOut } from '$lib/firebase/firebase.svelte';
   import { database } from '$lib/firebase/firebase.svelte';
   import type { UserFile } from '$lib/types';
   import { isFirebaseId } from '$lib/utils';
   import ConfirmOverrideAuthDialog from '$lib/components/ConfirmOverrideAuthDialog.svelte';
   import { createDropdownMenu } from '@melt-ui/svelte'; 

   let selectedFile: string | null = $state(null);
   let lastTapTime = 0;
   let tapTimeout: number | null = null;

   interface FileItem extends UserFile {
       name: any;
       created: number;
       title: string;
       type: 'file' | 'folder';
       parentFolder?: string;
       isDeleted?: boolean;
       deletedAt?: number;
       language: string;
   }

   const firebaseUser = $derived.by(() => {
       if (!authState.firebaseUser) {
           throw new Error(
               'Firebase user is null. The Dashboard component requires that the firebase user is not null.'
           );
       }
       return authState.firebaseUser;
   });

   let files: FileItem[] | null = $state(null);
   let currentFolder: string | null = $state(null);
   let showRecentlyDeleted = $state(false);
   let actionMenu = $state<{ item: FileItem; show: boolean } | null>(null);
   let draggedItem: FileItem | null = $state(null);
   let renameInput = $state<{ id: string; value: string } | null>(null);
   let selectedItems = $state<Set<string>>(new Set());
   let touchStartTime = $state(0);
   let touchStartPos = $state<{ x: number; y: number }>({ x: 0, y: 0 });

   const userData = getUserData();

   const {
       elements: { trigger, menu, item: menuItem },
       states: { open }
   } = createDropdownMenu({
       positioning: {
           placement: 'bottom-end'
       },
       forceVisible: true
   });

   const getFileIcon = (item: FileItem) => {
       if (item.type === 'folder') {
           return { type: 'folder', color: 'text-blue-400' };
       }
       
       const lang = item.language?.toLowerCase();
       switch (lang) {
           case 'python':
           case 'py':
               return { type: 'python', color: 'text-yellow-400' };
           case 'cpp':
           case 'c++':
               return { type: 'cpp', color: 'text-blue-300' };
           case 'java':
               return { type: 'java', color: 'text-red-400' };
           default:
               return { type: 'file', color: 'text-gray-400' };
       }
   };

   const renderFileIcon = (item: FileItem) => {
       const iconInfo = getFileIcon(item);
       
       if (iconInfo.type === 'folder') {
           return `<svg class="w-5 h-5 ${iconInfo.color}" fill="currentColor" viewBox="0 0 24 24">
               <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
           </svg>`;
       }
       
       switch (iconInfo.type) {
           case 'python':
               return `<div class="w-5 h-5 ${iconInfo.color} flex items-center justify-center text-xs font-bold">Py</div>`;
           case 'cpp':
               return `<div class="w-5 h-5 ${iconInfo.color} flex items-center justify-center text-xs font-bold">C++</div>`;
           case 'java':
               return `<div class="w-5 h-5 ${iconInfo.color} flex items-center justify-center text-xs font-bold">J</div>`;
           default:
               return `<svg class="w-5 h-5 ${iconInfo.color}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
               </svg>`;
       }
   };

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
                           language: data.language || null,
                           ...data
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

   const createFolder = async () => {
       const title = prompt('Folder name:');
       if (title) {
           const folderRef = push(ref(database, `users/${firebaseUser.uid}/files`));
           await set(folderRef, {
               title,
               type: 'folder',
               created: Date.now(),
               lastAccessTime: Date.now(),
               parentFolder: currentFolder,
               isDeleted: false
           });
       }
       open.set(false);
   };

   const moveToTrash = async (item: FileItem) => {
       await update(ref(database, `users/${firebaseUser.uid}/files/${item.id}`), {
           isDeleted: true,
           deletedAt: Date.now()
       });
       open.set(false);
   };

   const restoreItem = async (item: FileItem) => {
       await update(ref(database, `users/${firebaseUser.uid}/files/${item.id}`), {
           isDeleted: false,
           deletedAt: null
       });
       open.set(false);
   };

   const startRename = (item: FileItem) => {
       renameInput = { id: item.id, value: item.title };
       open.set(false);
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

   const handleTouchEnd = (e: TouchEvent, item: FileItem) => {
       const touchEndTime = Date.now();
       const touchDuration = touchEndTime - touchStartTime;
       const timeSinceLastTap = touchEndTime - lastTapTime;
       lastTapTime = touchEndTime;

       if (touchDuration > 500) {
           e.preventDefault();
           actionMenu = { item, show: true };
           open.set(true);
       } else {
           if (timeSinceLastTap < 300 && tapTimeout) {
               clearTimeout(tapTimeout);
               tapTimeout = null;
               if (item.type === 'folder' && !showRecentlyDeleted) {
                   openFolder(item);
               } else if (item.type === 'file') {
                   window.location.href = `/${item.id.substring(1)}`;
               }
           } else {
               if (tapTimeout) {
                   clearTimeout(tapTimeout);
               }
               tapTimeout = Number(setTimeout(() => {
                   if (selectedFile === item.id) {
                       selectedFile = null;
                   } else {
                       selectedFile = item.id;
                   }
                   tapTimeout = null;
               }, 300));
           }
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
</script>

<div class="min-h-screen bg-[#1e1e1e] text-white">
   <div class="py-3 sm:py-6">
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
                   class="inline-flex items-center rounded-md bg-gray-700 px-3 py-2 text-sm font-medium text-white hover:bg-gray-600 transition-colors"
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
                   class="inline-flex items-center rounded-md bg-gray-700 px-3 py-2 text-sm font-medium text-white hover:bg-gray-600 transition-colors"
               >
                   <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       {#if showRecentlyDeleted}
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                       {:else}
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                       {/if}
                   </svg>
                   <span class="hidden sm:inline">{showRecentlyDeleted ? 'Back to Files' : 'Recently Deleted'}</span>
                   <span class="sm:hidden">{showRecentlyDeleted ? 'Files' : 'Trash'}</span>
               </button>
           </div>
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
            <div>
            <button
                onclick={signOut}
                class="inline-flex items-center rounded-md bg-gray-700 px-3 py-2 text-sm font-medium text-white hover:bg-gray-600 transition-colors"
            >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
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

       <div class="bg-[#2a2a2a] rounded-lg border border-gray-700 overflow-hidden">
           <div class="hidden sm:grid sm:grid-cols-12 gap-4 px-4 py-3 bg-[#323232] border-b border-gray-600 text-sm font-medium text-gray-300">
               <div class="col-span-8">Name</div>
               <div class="col-span-3">Date Modified</div>
               <div class="col-span-1"></div>
           </div>
           <div class="sm:hidden bg-[#323232] border-b border-gray-600 px-4 py-3">
               <div class="text-sm font-medium text-gray-300">Files</div>
           </div>
           <div class="min-h-[400px] relative">
               {#if filesToShow && filesToShow.length > 0}
                   {#each filesToShow as item (item.id)}
                       <!-- svelte-ignore a11y_click_events_have_key_events -->
                       <!-- svelte-ignore a11y_no_static_element_interactions -->
                       <div
                           class="sm:grid sm:grid-cols-12 gap-4 px-4 py-3 border-b border-gray-700 transition-colors cursor-pointer group relative {selectedFile === item.id ? 'bg-gray-700/50' : 'hover:bg-[#363636]'}"
                           draggable="true"
                           ondragstart={(e) => handleDragStart(e, item)}
                           ondragover={item.type === 'folder' ? handleDragOver : undefined}
                           ondrop={item.type === 'folder' ? (e) => handleDrop(e, item) : undefined}
                           onclick={(e) => {
                               e.preventDefault();
                               if (item.type === 'folder' && !showRecentlyDeleted) {
                                   openFolder(item);
                               } else if (item.type === 'file') {
                                   window.location.href = `/${item.id.substring(1)}`;
                               }
                           }}
                           ontouchstart={(e) => handleTouchStart(e, item)}
                           ontouchmove={handleTouchMove}
                           ontouchend={(e) => {
                               e.preventDefault();
                               if (item.type === 'folder' && !showRecentlyDeleted) {
                                   openFolder(item);
                               } else if (item.type === 'file') {
                                   window.location.href = `/${item.id.substring(1)}`;
                               }
                           }}
                           oncontextmenu={(e) => e.preventDefault()}
                       >
                           <div class="hidden sm:block sm:col-span-8">
                               <div class="flex items-center space-x-3 h-full">
                                   {#if item.type === 'folder'}
                                       <svg class="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                                           <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
                                       </svg>
                                   {:else if item.language === 'python' || item.language === 'py'}
                                      <svg class="w-5 h-5 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.5">
                                            <path fill="#3776ab" d="M11.914 0C5.82 0 6.2 2.656 6.2 2.656l.01 2.752h5.814v.826H3.9S0 5.789 0 11.969c0 6.18 3.403 5.96 3.403 5.96h2.034v-2.867s-.109-3.42 3.35-3.42h5.766s3.24.052 3.24-3.148V3.202S18.28 0 11.914 0zM8.708 1.85c.606 0 1.097.501 1.097 1.119 0 .618-.491 1.118-1.097 1.118-.606 0-1.097-.5-1.097-1.118 0-.618.491-1.119 1.097-1.119z"/>
                                            <path fill="#ffd43b" d="M12.087 24c6.094 0 5.714-2.656 5.714-2.656l-.01-2.752h-5.814v-.826H20.1s3.9.445 3.9-5.735c0-6.18-3.403-5.96-3.403-5.96h-2.034v2.867s.109 3.42-3.35 3.42H9.447s-3.24-.052-3.24 3.148v5.292S5.72 24 12.087 24zm3.206-1.85c-.606 0-1.097-.501-1.097-1.119 0-.618.491-1.118 1.097-1.118.606 0 1.097.5 1.097 1.118 0 .618-.491 1.119-1.097 1.119z"/>
                                        </svg>
                                   {:else if item.language === 'cpp' || item.language === 'c++'}
                                       <svg class="w-5 h-5 text-blue-300" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M22.394 6c-.167-.29-.398-.543-.652-.69L12.926.22c-.509-.294-1.34-.294-1.848 0L2.26 5.31c-.508.293-.923 1.013-.923 1.6v10.18c0 .294.104.62.271.91.167.29.398.543.652.69l8.816 5.09c.508.293 1.34.293 1.848 0l8.816-5.09c.254-.147.485-.4.652-.69.167-.29.27-.616.27-.91V6.91c.003-.294-.1-.62-.268-.91zM12 19.11c-3.92 0-7.109-3.19-7.109-7.11 0-3.92 3.19-7.11 7.109-7.11a7.133 7.133 0 016.156 3.553l-3.076 1.78a3.567 3.567 0 00-3.08-1.78A3.56 3.56 0 008.444 12 3.56 3.56 0 0012 15.555a3.57 3.57 0 003.08-1.778l3.078 1.78A7.135 7.135 0 0112 19.11zm7.11-6.715h-.79V11.61h-.79v.785h-.79v.79h.79v.785h.79V13.185h.79v-.79zm2.962 0h-.79V11.61h-.79v.785h-.79v.79h.79v.785h.79V13.185h.79v-.79z"/>
                                        </svg>
                                   {:else if item.language === 'java'}
                                      <svg class="w-5 h-5 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.5">
                                        <path fill="currentColor" d="M8.851 18.56s-.917.534.653.714c1.902.218 2.874.187 4.969-.211 0 0 .552.346 1.321.646-4.699 2.013-10.633-.118-6.943-1.149M8.276 15.933s-1.028.761.542.924c2.032.209 3.636.227 6.413-.308 0 0 .384.389.987.602-5.679 1.661-12.007.13-7.942-1.218M13.116 11.475c1.158 1.333-.304 2.533-.304 2.533s2.939-1.518 1.589-3.418c-1.261-1.772-2.228-2.652 3.007-5.688 0-.001-8.216 2.051-4.292 6.573M19.33 20.504s.679.559-.747.991c-2.712.822-11.288 1.069-13.669.033-.856-.373.75-.89 1.254-.998.527-.114.828-.093.828-.093-.953-.671-6.156 1.317-2.643 1.887 9.58 1.553 17.462-.7 14.977-1.82M9.292 13.21s-4.362 1.036-1.544 1.412c1.189.159 3.561.123 5.77-.062 1.806-.152 3.618-.477 3.618-.477s-.637.272-1.098.587c-4.429 1.165-12.986.623-10.522-.568 2.082-1.006 3.776-.892 3.776-.892M17.116 17.584c4.503-2.34 2.421-4.589.968-4.285-.355.074-.515.138-.515.138s.132-.207.385-.297c2.875-1.011 5.086 2.981-.928 4.562 0-.001.07-.062.09-.118M14.401 0s2.494 2.494-2.365 6.33c-3.896 3.077-.888 4.832-.001 6.836-2.274-2.053-3.943-3.858-2.824-5.539 1.644-2.469 6.197-3.665 5.19-7.627M9.734 23.924c4.322.277 10.959-.153 11.116-2.198 0 0-.302.775-3.572 1.391-3.688.694-8.239.613-10.937.168 0-.001.553.457 3.393.639"/>
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
                           <div class="hidden sm:flex sm:col-span-3 text-gray-400 text-sm items-center">
                               <div>{formatDate(item.lastAccessTime || item.created || Date.now())}</div>
                           </div>
                           <div class="hidden sm:flex sm:col-span-1 items-center justify-end">
                               <!-- svelte-ignore a11y_consider_explicit_label -->
                            <button
                               use:trigger
                               onclick={() => {
                                   actionMenu = { item, show: true };
                                   open.set(true);
                               }}
                               class="inline-flex items-center p-1.5 rounded-md hover:bg-gray-600 text-gray-400 hover:text-white transition-colors focus:outline-none"
                            >
                               <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                               </svg>
                            </button>
                           </div>
                           <div class="sm:hidden {selectedFile === item.id ? 'border-l-4 border-indigo-500' : ''}">
                               <div class="flex items-center">
                                   <div class="flex items-center space-x-3 flex-1 min-w-0">
                                       {#if item.type === 'folder'}
                                       <svg class="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                                           <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
                                       </svg>
                                   {:else if item.language === 'python' || item.language === 'py'}
                                       <svg class="w-5 h-5 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.5">
                                            <path fill="#3776ab" d="M11.914 0C5.82 0 6.2 2.656 6.2 2.656l.01 2.752h5.814v.826H3.9S0 5.789 0 11.969c0 6.18 3.403 5.96 3.403 5.96h2.034v-2.867s-.109-3.42 3.35-3.42h5.766s3.24.052 3.24-3.148V3.202S18.28 0 11.914 0zM8.708 1.85c.606 0 1.097.501 1.097 1.119 0 .618-.491 1.118-1.097 1.118-.606 0-1.097-.5-1.097-1.118 0-.618.491-1.119 1.097-1.119z"/>
                                            <path fill="#ffd43b" d="M12.087 24c6.094 0 5.714-2.656 5.714-2.656l-.01-2.752h-5.814v-.826H20.1s3.9.445 3.9-5.735c0-6.18-3.403-5.96-3.403-5.96h-2.034v2.867s.109 3.42-3.35 3.42H9.447s-3.24-.052-3.24 3.148v5.292S5.72 24 12.087 24zm3.206-1.85c-.606 0-1.097-.501-1.097-1.119 0-.618.491-1.118 1.097-1.118.606 0 1.097.5 1.097 1.118 0 .618-.491 1.119-1.097 1.119z"/>
                                        </svg>
                                   {:else if item.language === 'cpp' || item.language === 'c++'}
                                       <svg class="w-5 h-5 text-blue-300" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M22.394 6c-.167-.29-.398-.543-.652-.69L12.926.22c-.509-.294-1.34-.294-1.848 0L2.26 5.31c-.508.293-.923 1.013-.923 1.6v10.18c0 .294.104.62.271.91.167.29.398.543.652.69l8.816 5.09c.508.293 1.34.293 1.848 0l8.816-5.09c.254-.147.485-.4.652-.69.167-.29.27-.616.27-.91V6.91c.003-.294-.1-.62-.268-.91zM12 19.11c-3.92 0-7.109-3.19-7.109-7.11 0-3.92 3.19-7.11 7.109-7.11a7.133 7.133 0 016.156 3.553l-3.076 1.78a3.567 3.567 0 00-3.08-1.78A3.56 3.56 0 008.444 12 3.56 3.56 0 0012 15.555a3.57 3.57 0 003.08-1.778l3.078 1.78A7.135 7.135 0 0112 19.11zm7.11-6.715h-.79V11.61h-.79v.785h-.79v.79h.79v.785h.79V13.185h.79v-.79zm2.962 0h-.79V11.61h-.79v.785h-.79v.79h.79v.785h.79V13.185h.79v-.79z"/>
                                        </svg>
                                   {:else if item.language === 'java'}
                                      <svg class="w-5 h-5 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.5">
                                            <path fill="currentColor" d="M8.851 18.56s-.917.534.653.714c1.902.218 2.874.187 4.969-.211 0 0 .552.346 1.321.646-4.699 2.013-10.633-.118-6.943-1.149M8.276 15.933s-1.028.761.542.924c2.032.209 3.636.227 6.413-.308 0 0 .384.389.987.602-5.679 1.661-12.007.13-7.942-1.218M13.116 11.475c1.158 1.333-.304 2.533-.304 2.533s2.939-1.518 1.589-3.418c-1.261-1.772-2.228-2.652 3.007-5.688 0-.001-8.216 2.051-4.292 6.573M19.33 20.504s.679.559-.747.991c-2.712.822-11.288 1.069-13.669.033-.856-.373.75-.89 1.254-.998.527-.114.828-.093.828-.093-.953-.671-6.156 1.317-2.643 1.887 9.58 1.553 17.462-.7 14.977-1.82M9.292 13.21s-4.362 1.036-1.544 1.412c1.189.159 3.561.123 5.77-.062 1.806-.152 3.618-.477 3.618-.477s-.637.272-1.098.587c-4.429 1.165-12.986.623-10.522-.568 2.082-1.006 3.776-.892 3.776-.892M17.116 17.584c4.503-2.34 2.421-4.589.968-4.285-.355.074-.515.138-.515.138s.132-.207.385-.297c2.875-1.011 5.086 2.981-.928 4.562 0-.001.07-.062.09-.118M14.401 0s2.494 2.494-2.365 6.33c-3.896 3.077-.888 4.832-.001 6.836-2.274-2.053-3.943-3.858-2.824-5.539 1.644-2.469 6.197-3.665 5.19-7.627M9.734 23.924c4.322.277 10.959-.153 11.116-2.198 0 0-.302.775-3.572 1.391-3.688.694-8.239.613-10.937.168 0-.001.553.457 3.393.639"/>
                                        </svg>
                                   {:else}
                                       <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                                   <div>{formatDate(item.lastAccessTime || item.created || Date.now())}</div>
                                               </div>
                                           {/if}
                                       </div>
                                   </div>
                                   <!-- svelte-ignore a11y_consider_explicit_label -->
                                <button
                                     use:trigger
                                     onclick={() => {
                                         actionMenu = { item, show: true };
                                         open.set(true);
                                     }}
                                     ontouchend={(e) => e.stopPropagation()}
                                     class="flex-shrink-0 p-2 rounded-md hover:bg-gray-600 transition-colors focus:outline-none"
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
                    <div class="absolute inset-0 flex items-center justify-center text-gray-500">
                        <div class="text-center px-4">
                            <svg class="w-12 h-12 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p class="text-base font-medium mb-2">{showRecentlyDeleted ? 'No deleted files' : 'No files or folders'}</p>
                            {#if !showRecentlyDeleted}
                                <p class="text-sm text-gray-400">Tap the + buttons above to create new items</p>
                            {/if}
                        </div>
                    </div>
               {:else}
                   <div class="absolute inset-0 flex items-center justify-center text-gray-500">
                       <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                       <span class="ml-3">Loading...</span>
                   </div>
               {/if}
           </div>
       </div>
   </div>

   {#if $open && actionMenu?.show}
       <div use:menu class="bg-[#2a2a2a] border border-gray-600 rounded-lg shadow-xl py-1.5 z-50 min-w-[180px] divide-y divide-gray-600/50">
           {#if showRecentlyDeleted}
               <div use:menuItem>
                   <button
                       onclick={() => actionMenu?.item && restoreItem(actionMenu.item)}
                       class="w-full flex items-center px-4 py-2 hover:bg-[#363636] text-green-400 hover:text-green-300 text-sm transition-colors"
                   >
                       <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                       </svg>
                       Restore File
                   </button>
               </div>
           {:else}
               <div>
                   {#if actionMenu.item.type === 'file'}
                       <div use:menuItem>
                           <a
                               href="/{actionMenu.item.id.substring(1)}"
                               class="w-full flex items-center px-4 py-2 hover:bg-[#363636] text-white hover:text-indigo-300 text-sm transition-colors"
                           >
                               <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                               </svg>
                               Open Editor
                           </a>
                       </div>
                   {/if}
                   <div use:menuItem>
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
               </div>
               <div>
                   <div use:menuItem>
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
               </div>
           {/if}
       </div>
   {/if}
</div>

<ConfirmOverrideAuthDialog bind:this={confirmOverrideAuthDialog} />