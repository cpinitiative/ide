<script lang="ts">
	import { ref, onValue, orderByChild, query, set, push, remove, update } from 'firebase/database';
	import { authState, getUserData, signInWithGoogle, signOut } from '$lib/firebase/firebase.svelte';
	import { database } from '$lib/firebase/firebase.svelte';
	import { type UserFile, type Language, LANGUAGES } from '$lib/types';
	import { isFirebaseId } from '$lib/utils';
	import ConfirmOverrideAuthDialog from '$lib/components/ConfirmOverrideAuthDialog.svelte';

	type ExtendedUserFile = UserFile & {
		parentFolder?: string;
		deleted?: boolean;
		deletedAt?: number;
		tags?: string[];
	};

	const firebaseUser = $derived.by(() => {
		if (!authState.firebaseUser) {
			throw new Error('Firebase user is null. This component requires an authenticated user.');
		}
		return authState.firebaseUser;
	});

	let files: ExtendedUserFile[] | null = $state(null);
	let currentFolder: string | null = $state(null);
	let contextMenu = $state<{ x: number; y: number; item?: ExtendedUserFile; show: boolean }>({
		x: 0,
		y: 0,
		show: false
	});
	let draggedItem: ExtendedUserFile | null = $state(null);
	let renameInput = $state<{ id: string; value: string } | null>(null);
	let selectedItems = $state<Set<string>>(new Set());
	let selectedFile: ExtendedUserFile | null = $state(null);
	let showMobileActions = $state(false);
	let showRecentlyDeleted = $state(false);
	let isMobile = $state(false);

	const userData = getUserData();

	// Check if device is mobile
	$effect(() => {
		const checkMobile = () => {
			isMobile = window.innerWidth < 768;
		};
		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	});

	// Fetch files from Firebase - check1
	$effect(() => {
		const userFilesRef = ref(database, `users/${firebaseUser.uid}/files`);
		const unsubscribe = onValue(query(userFilesRef, orderByChild('lastAccessTime')), (snapshot) => {
			if (!snapshot.exists()) {
				files = [];
			} else {
				const newFiles: ExtendedUserFile[] = [];
				snapshot.forEach((childSnapshot) => {
					const data = childSnapshot.val();
					const key = childSnapshot.key;
					if (key && isFirebaseId(key)) {
						let item: ExtendedUserFile;
						if (data.type === 'file') {
							item = {
								id: key,
								title: data.title,
								lastAccessTime: data.lastAccessTime,
								creationTime: data.creationTime,
								hidden: data.hidden,
								version: data.version,
								language: data.language as Language,
								owner: data.owner,
								type: 'file',
								content: data.content,
								size: data.size,
								mimeType: data.mimeType,
								extension: data.extension,
								isExecutable: data.isExecutable,
								parentFolder: data.parentFolder || null,
								deleted: data.deleted || false,
								deletedAt: data.deletedAt,
								tags: data.tags || []
							};
						} else if (data.type === 'folder') {
							item = {
								id: key,
								title: data.title,
								lastAccessTime: data.lastAccessTime,
								creationTime: data.creationTime,
								hidden: data.hidden,
								version: data.version,
								language: data.language as Language,
								owner: data.owner,
								type: 'folder',
								children: data.children || [],
								isExpanded: data.isExpanded,
								childCount: data.childCount,
								parentFolder: data.parentFolder || null,
								deleted: data.deleted || false,
								deletedAt: data.deletedAt,
								tags: data.tags || []
							};
						} else {
							return; // Skip invalid type
						}
						newFiles.push(item);
					}
				});
				files = newFiles.reverse();
			}
		});
		return unsubscribe;
	});

	// Derived list of files to display
	const filesToShow = $derived.by(() => {
		if (!files) return [];
		if (showRecentlyDeleted) {
			return files.filter((file) => file.deleted);
		}
		return files.filter((file) => {
			const isInCurrentFolder = file.parentFolder === currentFolder;
			const isNotDeleted = !file.deleted;
			const isNotHidden = !file.hidden;
			const hasValidType = file.type === 'file' || file.type === 'folder';
			return isInCurrentFolder && isNotDeleted && isNotHidden && hasValidType;
		});
	});

	const formatDate = (timestamp: number) => {
		return new Date(timestamp).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	};

	const getLanguageDisplay = (language: Language) => {
		return LANGUAGES[language] || '';
	};

	// Context menu and mobile actions
	const handleContextMenu = (e: MouseEvent, item?: ExtendedUserFile) => {
		e.preventDefault();
		if (isMobile) return;
		contextMenu = { x: e.clientX, y: e.clientY, item, show: true };
	};

	const closeContextMenu = () => {
		contextMenu = { ...contextMenu, show: false };
	};

	const closeMobileActions = () => {
		showMobileActions = false;
		selectedFile = null;
	};

	const handleFileClick = (item: ExtendedUserFile) => {
		if (isMobile) {
			selectedFile = item;
			showMobileActions = true;
		}
	};

	const handleDoubleClick = (item: ExtendedUserFile) => {
		if (item.type === 'folder') {
			openFolder(item);
		} else if (item.type === 'file') {
			console.log('Opening file:', item.title);
			// Add file opening logic here
		}
	};

	// File and folder operations
	const createFolder = async () => {
		const title = prompt('Folder name:');
		if (title) {
			const folderRef = push(ref(database, `users/${firebaseUser.uid}/files`));
			await set(folderRef, {
				type: 'folder',
				title,
				lastAccessTime: Date.now(),
				creationTime: Date.now(),
				version: 1,
				language: 'cpp', // Default language
				children: [],
				parentFolder: currentFolder,
				deleted: false
			});
		}
		closeContextMenu();
	};

	const createFile = async () => {
		window.location.href = '/new';
	};

	const deleteItem = async (item: ExtendedUserFile) => {
		if (confirm(`Delete ${item.title}?`)) {
			await update(ref(database, `users/${firebaseUser.uid}/files/${item.id}`), {
				deleted: true,
				deletedAt: Date.now()
			});
		}
		closeContextMenu();
		closeMobileActions();
	};

	const restoreItem = async (item: ExtendedUserFile) => {
		await update(ref(database, `users/${firebaseUser.uid}/files/${item.id}`), {
			deleted: false,
			deletedAt: null
		});
	};

	const startRename = (item: ExtendedUserFile) => {
		renameInput = { id: item.id, value: item.title };
		closeContextMenu();
		closeMobileActions();
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

	// Drag and drop functionality
	const handleDragStart = (e: DragEvent, item: ExtendedUserFile) => {
		if (isMobile) return;
		draggedItem = item;
		e.dataTransfer!.effectAllowed = 'move';
	};

	const handleDragOver = (e: DragEvent) => {
		if (isMobile) return;
		e.preventDefault();
		e.dataTransfer!.dropEffect = 'move';
	};

	const handleDrop = async (e: DragEvent, targetFolder: ExtendedUserFile) => {
		if (isMobile) return;
		e.preventDefault();
		if (draggedItem && targetFolder.type === 'folder' && draggedItem.id !== targetFolder.id) {
			await update(ref(database, `users/${firebaseUser.uid}/files/${draggedItem.id}`), {
				parentFolder: targetFolder.id
			});
		}
		draggedItem = null;
	};

	const openFolder = (folder: ExtendedUserFile) => {
		if (folder.type === 'folder') {
			currentFolder = folder.id;
			closeMobileActions();
		}
	};

	const goBack = () => {
		if (currentFolder) {
			const parent = files?.find((f) => f.id === currentFolder)?.parentFolder;
			currentFolder = parent || null;
		}
	};

	// Authentication
	let confirmOverrideAuthDialog: ConfirmOverrideAuthDialog | undefined = undefined;
	const onSignIn = () => {
		signInWithGoogle(async () => {
			let override = (await confirmOverrideAuthDialog?.open()) ?? false;
			return override;
		});
	};

	// Close menus on click outside
	$effect(() => {
		const handleClick = () => {
			closeContextMenu();
			if (isMobile && showMobileActions) {
				closeMobileActions();
			}
		};
		document.addEventListener('click', handleClick);
		return () => document.removeEventListener('click', handleClick);
	});
</script>

<div class="min-h-screen bg-[#1e1e1e] text-white">
	<div class="p-4 md:p-6">
		<div class="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
			<div class="flex flex-wrap items-center gap-2 md:gap-4">
				<a
					href="/new"
					class="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#1e1e1e] focus:outline-none transition-colors"
				>
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
					</svg>
					New File
				</a>

				<button
					onclick={createFolder}
					class="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#1e1e1e] focus:outline-none transition-colors"
				>
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
					</svg>
					Add Folder
				</button>

				{#if currentFolder && !showRecentlyDeleted}
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
					onclick={() => (showRecentlyDeleted = !showRecentlyDeleted)}
					class="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
				>
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
						/>
					</svg>
					{showRecentlyDeleted ? 'Show Files' : 'Recently Deleted'}
				</button>
			</div>

			{#if firebaseUser.isAnonymous}
				<div class="flex items-center space-x-3 bg-gray-800 rounded-lg px-4 py-2">
					<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
						/>
					</svg>
					<span class="text-gray-300 text-sm md:text-base">Not signed in</span>
					<button
						onclick={onSignIn}
						class="bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded text-sm font-medium transition-colors"
					>
						Sign In
					</button>
				</div>
			{:else}
				<div class="flex items-center space-x-3 bg-gray-800 rounded-lg px-4 py-2">
					<svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
						/>
					</svg>
					<span class="text-gray-1 text-sm md:text-base">{firebaseUser.displayName || 'User'}</span>
					<button
						onclick={signOut}
						class="text-white hover:text-gray-400 text-sm transition-colors"
					>
						Sign Out
					</button>
				</div>
			{/if}
		</div>

		<div class="bg-[#2a2a2a] rounded-lg border border-gray-700 overflow-hidden">
			{#if !isMobile}
				<div
					class="grid grid-cols-12 gap-4 px-4 py-3 bg-[#323232] border-b border-gray-600 text-sm font-medium text-gray-300"
				>
					<div class="col-span-6">Title</div>
					<div class="col-span-3">Date Modified</div>
					<div class="col-span-3">Actions</div>
				</div>
			{/if}

			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="min-h-[400px]"
				oncontextmenu={!isMobile ? (e) => handleContextMenu(e) : undefined}
			>
				{#if filesToShow && filesToShow.length > 0}
					{#each filesToShow as item (item.id)}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<div
							class="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-4 py-3 md:py-2 border-b border-gray-700 hover:bg-[#363636] transition-colors cursor-pointer group"
							draggable={!isMobile}
							ondragstart={!isMobile ? (e: DragEvent) => handleDragStart(e, item) : undefined}
							ondragover={!isMobile && item.type === 'folder' ? handleDragOver : undefined}
							ondrop={!isMobile && item.type === 'folder' ? (e) => handleDrop(e, item) : undefined}
							oncontextmenu={!isMobile ? (e) => handleContextMenu(e, item) : undefined}
							onclick={() => handleFileClick(item)}
							ondblclick={() => handleDoubleClick(item)}
						>
							{#if isMobile}
								<div class="flex items-center justify-between">
									<div class="flex items-center space-x-2 flex-1">
										{#if item.type === 'folder'}
											<svg
												class="w-5 h-5 text-blue-400 flex-shrink-0"
												fill="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"
												/>
											</svg>
										{:else}
											<svg
												class="w-5 h-5 text-gray-400 flex-shrink-0"
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
												class="bg-[#404040] text-white px-2 py-1 rounded text-sm border border-gray-500 focus:border-indigo-500 focus:outline-none flex-1"
												autofocus
											/>
										{:else}
											<div class="flex-1 min-w-0">
												<div class="text-white font-medium truncate">{item.title}</div>
												<div class="text-gray-400 text-xs flex items-center space-x-2">
													<span>{formatDate(item.lastAccessTime)}</span>
													{#if item.type === 'file' && item.language}
														<span class="text-indigo-400">
															• {getLanguageDisplay(item.language as Language)}
														</span>
													{/if}
												</div>
											</div>
										{/if}
									</div>
								</div>
							{:else}
								<div class="col-span-6 flex items-center space-x-3">
									{#if item.type === 'folder'}
										<svg class="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
											<path
												d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"
											/>
										</svg>
									{:else}
										<svg
											class="w-5 h-5 text-gray-400"
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
										<span class="text-white">{item.title}</span>
									{/if}
								</div>

								<div class="col-span-3 text-gray-400 text-sm flex items-center space-x-2">
									<span>{formatDate(item.lastAccessTime)}</span>
									{#if item.type === 'file' && item.language}
										<span class="text-indigo-400">• {getLanguageDisplay(item.language as Language)}</span>
									{/if}
								</div>

								<div class="col-span-3 flex items-center space-x-2">
									{#if showRecentlyDeleted}
										<button
											onclick={(e) => {
												e.stopPropagation();
												restoreItem(item);
											}}
											class="text-green-400 hover:text-green-300 text-sm"
										>
											Restore
										</button>
									{:else}
										<button
											onclick={(e) => {
												e.stopPropagation();
												startRename(item);
											}}
											class="text-blue-400 hover:text-blue-300 text-sm"
										>
											Rename
										</button>
										<button
											onclick={(e) => {
												e.stopPropagation();
												deleteItem(item);
											}}
											class="text-red-400 hover:text-red-300 text-sm"
										>
											Delete
										</button>
									{/if}
								</div>
							{/if}
						</div>
					{/each}
				{:else if filesToShow}
					<div class="flex items-center justify-center h-64 text-gray-500">
						<div class="text-center">
							<svg
								class="w-12 h-12 mx-auto mb-4 text-gray-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
								/>
							</svg>
							<p>{showRecentlyDeleted ? 'No deleted files' : 'No files or projects'}</p>
							{#if !showRecentlyDeleted}
								<p class="text-sm mt-1">
									{isMobile ? 'Tap the + button to add files' : 'Right-click to create new items'}
								</p>
							{/if}
						</div>
					</div>
				{:else}
					<div class="flex items-center justify-center h-64 text-gray-600 text-sm">
						<div
							class="animate-spin rounded-full h-8 w-24 border border bg-indigo-400 border-indigo-2"
						>
							<span class="ml-spinner">Loading...</span>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>

	{#if contextMenu.show && !isMobile}
		<div
			class="fixed bg-[#2a2a2a] shadow-lg rounded-lg border bg-gray-600 min-w-[160px] z-50 py-2"
			style="left: {contextMenu.x}px; top: {contextMenu.y}px;"
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
						onclick={() => contextMenu.item && deleteItem(contextMenu.item)}
						class="text-white px-4 py-2 hover:bg-red-600 hover:text-red-400 text-sm"
					>
						Delete
					</button>
				{/if}
			{:else}
				<button
					onclick={createFile}
					class="text-white px-4 text-left py-2 hover:bg-[#363636] text-sm"
				>
					New File
				</button>
				<button
					onclick={createFolder}
					class="text-white px-4 text-left py-2 hover:bg-[#363636] text-sm"
				>
					New Project
				</button>
			{/if}
		</div>
	{/if}

	{#if showMobileActions && selectedFile && isMobile}
		<div class="fixed inset bg-black bg-opacity-50 flex items-end z-50">
			<div class="bg-[#2a2a2a] rounded-t-lg w-full border-t bg-gray-600 p-4">
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-white font-semibold">{selectedFile.title}</h3>
					<!-- svelte-ignore a11y_consider_explicit_label -->
					<button
						onclick={closeMobileActions}
						class="text-gray-400 hover:text-white"
					>
						<svg class="w-6 h-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
							<path
								d="M6 18L18 6M6 6l12 12"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</button>
				</div>

				<div class="space-y-2">
					{#if showRecentlyDeleted}
						<button
							onclick={() => restoreItem(selectedFile!)}
							class="w-full text-left px-4 py-3 bg-[#363636] hover:bg-[#404040] text-green-400 rounded-lg transition-colors"
						>
							<div class="flex items-center space-x-3">
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 0v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
									/>
								</svg>
								<span>Restore</span>
							</div>
						</button>
					{:else}
						<button
							onclick={() => startRename(selectedFile!)}
							class="w-full text-left px-4 py-3 bg-[#363636] hover:bg-[#404040] text-white rounded-lg transition-colors"
						>
							<div class="flex items-center space-x-3">
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M11 6H7a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-12m-2 0h-4.5a2 2 0 01-4 0m8 8l4-4-4-4"
									/>
								</svg>
								<span>Rename</span>
							</div>
						</button>
						<button
							onclick={() => deleteItem(selectedFile!)}
							class="w-full text-left px-4 py-3 bg-[#363636] hover:bg-red-600 hover:text-white text-red-400 rounded-lg transition-colors"
						>
							<div class="flex items-center space-x-3">
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
									/>
								</svg>
								<span>Delete</span>
							</div>
						</button>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>

<ConfirmOverrideAuthDialog bind:this={confirmOverrideAuthDialog} />