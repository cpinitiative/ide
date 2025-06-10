<script lang="ts">
	import { ref, onValue, orderByChild, query, set, push, remove, update } from 'firebase/database';
	import { authState, getUserData, signInWithGoogle, signOut } from '$lib/firebase/firebase.svelte';
	import { database } from '$lib/firebase/firebase.svelte';
	import type { UserFile } from '$lib/types';
	import { isFirebaseId } from '$lib/utils';
	import ConfirmOverrideAuthDialog from '$lib/components/ConfirmOverrideAuthDialog.svelte';

	interface FileItem extends UserFile {
		created: number;
		name: any;
		type: 'file' | 'folder';
		size?: number;
		tags?: string[];
		parentFolder?: string;
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
	let contextMenu = $state<{ x: number; y: number; item?: FileItem; show: boolean }>({ 
		x: 0, y: 0, show: false 
	});
	let draggedItem: FileItem | null = $state(null);
	let renameInput = $state<{ id: string; value: string } | null>(null);
	let selectedItems = $state<Set<string>>(new Set());

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
							type: data.type || 'file',
							size: data.size || Math.floor(Math.random() * 1000000), // Mock size
							tags: data.tags || [],
							parentFolder: data.parentFolder || null,
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
		return files.filter(file => file.parentFolder === currentFolder);
	});

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	};

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
	};

	const closeContextMenu = () => {
		contextMenu = { ...contextMenu, show: false };
	};

	const createFolder = async () => {
		const name = prompt('Folder name:');
		if (name) {
			const folderRef = push(ref(database, `users/${firebaseUser.uid}/files`));
			await set(folderRef, {
				name,
				type: 'folder',
				created: Date.now(),
				lastAccessTime: Date.now(),
				parentFolder: currentFolder,
				size: 0
			});
		}
		closeContextMenu();
	};

	const createFile = async () => {
		const name = prompt('File name:');
		if (name) {
			const fileRef = push(ref(database, `users/${firebaseUser.uid}/files`));
			await set(fileRef, {
				name,
				type: 'file',
				created: Date.now(),
				lastAccessTime: Date.now(),
				parentFolder: currentFolder,
				size: Math.floor(Math.random() * 100000),
				content: ''
			});
		}
		closeContextMenu();
	};

	const deleteItem = async (item: FileItem) => {
		if (confirm(`Delete ${item.name}?`)) {
			await remove(ref(database, `users/${firebaseUser.uid}/files/${item.id}`));
		}
		closeContextMenu();
	};

	const startRename = (item: FileItem) => {
		renameInput = { id: item.id, value: item.name };
		closeContextMenu();
	};

	const confirmRename = async () => {
		if (renameInput) {
			await update(ref(database, `users/${firebaseUser.uid}/files/${renameInput.id}`), {
				name: renameInput.value
			});
			renameInput = null;
		}
	};

	const cancelRename = () => {
		renameInput = null;
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
		if (draggedItem && targetFolder.type === 'folder' && draggedItem.id !== targetFolder.id) {
			await update(ref(database, `users/${firebaseUser.uid}/files/${draggedItem.id}`), {
				parentFolder: targetFolder.id
			});
		}
		draggedItem = null;
	};

	const openFolder = (folder: FileItem) => {
		currentFolder = folder.id;
	};

	const goBack = () => {
		if (currentFolder) {
			const parent = files?.find(f => f.id === currentFolder)?.parentFolder;
			currentFolder = parent || null;
		}
	};

	const addTag = async (item: FileItem) => {
		const tag = prompt('Add tag:');
		if (tag) {
			const currentTags = item.tags || [];
			await update(ref(database, `users/${firebaseUser.uid}/files/${item.id}`), {
				tags: [...currentTags, tag]
			});
		}
		closeContextMenu();
	};

	const removeTag = async (item: FileItem, tagToRemove: string) => {
		const updatedTags = (item.tags || []).filter(tag => tag !== tagToRemove);
		await update(ref(database, `users/${firebaseUser.uid}/files/${item.id}`), {
			tags: updatedTags
		});
	};

	let confirmOverrideAuthDialog: ConfirmOverrideAuthDialog | undefined = undefined;
	const onSignIn = () => {
		signInWithGoogle(async () => {
			let override = (await confirmOverrideAuthDialog?.open()) ?? false;
			return override;
		});
	};

	// Close context menu when clicking elsewhere
	$effect(() => {
		const handleClick = () => closeContextMenu();
		document.addEventListener('click', handleClick);
		return () => document.removeEventListener('click', handleClick);
	});
</script>

<div class="min-h-screen bg-[#1e1e1e] text-white">
	<div class="p-6">
		<!-- Header -->
		<div class="flex items-center justify-between mb-6">
			<div class="flex items-center space-x-4">
				<a
					href="/new"
					class="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#1e1e1e] focus:outline-none transition-colors"
				>
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
					</svg>
					New File
				</a>
				
				{#if currentFolder}
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
			</div>

			<!-- User Info -->
			{#if firebaseUser.isAnonymous}
				<div class="flex items-center space-x-3 bg-gray-800 rounded-lg px-4 py-2">
					<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
					</svg>
					<span class="text-gray-300">Not signed in</span>
					<button
						onclick={onSignIn}
						class="bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded text-sm font-medium transition-colors"
					>
						Sign In
					</button>
				</div>
			{:else}
				<div class="flex items-center space-x-3 bg-gray-800 rounded-lg px-4 py-2">
					<img 
						src={firebaseUser.photoURL || '/default-avatar.png'} 
						alt="Profile" 
						class="w-6 h-6 rounded-full"
					/>
					<span class="text-gray-300">{firebaseUser.displayName}</span>
					<button
						onclick={signOut}
						class="text-gray-400 hover:text-white text-sm transition-colors"
					>
						Sign Out
					</button>
				</div>
			{/if}
		</div>

		<!-- File Browser -->
		<div class="bg-[#2a2a2a] rounded-lg border border-gray-700 overflow-hidden">
			<!-- Header Row -->
			<div class="grid grid-cols-12 gap-4 px-4 py-3 bg-[#323232] border-b border-gray-600 text-sm font-medium text-gray-300">
				<div class="col-span-5">Name</div>
				<div class="col-span-2">Date Modified</div>
				<div class="col-span-2">Size</div>
				<div class="col-span-3">Tags</div>
			</div>

			<!-- Files List -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div 
				class="min-h-[400px]"
				oncontextmenu={(e) => handleContextMenu(e)}
			>
				{#if filesToShow && filesToShow.length > 0}
					{#each filesToShow as item (item.id)}
						<div
							class="grid grid-cols-12 gap-4 px-4 py-2 border-b border-gray-700 hover:bg-[#363636] transition-colors cursor-pointer group"
							draggable="true"
							ondragstart={(e) => handleDragStart(e, item)}
							ondragover={item.type === 'folder' ? handleDragOver : undefined}
							ondrop={item.type === 'folder' ? (e) => handleDrop(e, item) : undefined}
							oncontextmenu={(e) => handleContextMenu(e, item)}
							ondblclick={() => item.type === 'folder' ? openFolder(item) : null}
						>
							<!-- Name -->
							<div class="col-span-5 flex items-center space-x-3">
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

							<!-- Date -->
							<div class="col-span-2 text-gray-400 text-sm">
								{formatDate(item.lastAccessTime || item.created || Date.now())}
							</div>

							<!-- Size -->
							<div class="col-span-2 text-gray-400 text-sm">
								{item.type === 'folder' ? '--' : formatFileSize(item.size || 0)}
							</div>

							<!-- Tags -->
							<div class="col-span-3 flex flex-wrap gap-1">
								{#each (item.tags || []) as tag}
									<span 
										class="inline-flex items-center bg-indigo-600 text-xs px-2 py-1 rounded-full text-white group-hover:bg-indigo-700 transition-colors"
									>
										<!-- svelte-ignore a11y_consider_explicit_label -->
										{tag}
										<!-- svelte-ignore a11y_consider_explicit_label -->
										<button
											onclick={(e) => {
												e.stopPropagation();
												removeTag(item, tag);
											}}
											class="ml-1 text-indigo-200 hover:text-white"
										>
											<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
											</svg>
										</button>
									</span>
								{/each}
							</div>
						</div>
					{/each}
				{:else if filesToShow && filesToShow.length === 0}
					<div class="flex items-center justify-center h-64 text-gray-500">
						<div class="text-center">
							<svg class="w-12 h-12 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
							</svg>
							<p>No files or folders</p>
							<p class="text-sm mt-1">Right-click to create new items</p>
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
			style="left: {contextMenu.x}px; top: {contextMenu.y}px;"
		>
			{#if contextMenu.item}
				<button
					onclick={() => contextMenu.item && startRename(contextMenu.item)}
					class="w-full text-left px-4 py-2 hover:bg-[#363636] text-white text-sm"
				>
					Rename
				</button>
				<button
					onclick={() => contextMenu.item && addTag(contextMenu.item)}
					class="w-full text-left px-4 py-2 hover:bg-[#363636] text-white text-sm"
				>
					Add Tag
				</button>
				<hr class="border-gray-600 my-1" />
				<button
					onclick={() => contextMenu.item && deleteItem(contextMenu.item)}
					class="w-full text-left px-4 py-2 hover:bg-red-600 text-red-400 hover:text-white text-sm"
				>
					Delete
				</button>
			{:else}
				<button
					onclick={createFile}
					class="w-full text-left px-4 py-2 hover:bg-[#363636] text-white text-sm"
				>
					New File
				</button>
				<button
					onclick={createFolder}
					class="w-full text-left px-4 py-2 hover:bg-[#363636] text-white text-sm"
				>
					New Folder
				</button>
			{/if}
		</div>
	{/if}
</div>

<ConfirmOverrideAuthDialog bind:this={confirmOverrideAuthDialog} />