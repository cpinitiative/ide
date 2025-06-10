<script lang="ts">
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';
	dayjs.extend(relativeTime);

	import type { UserFile } from '$lib/types';
	import { authState, database } from '$lib/firebase/firebase.svelte';
	import { ref, update, remove, push, set } from 'firebase/database';

	interface FileItem extends UserFile {
		name: string;
		type: 'file' | 'folder';
		size?: number;
		tags?: string[];
		parentFolder?: string | null;
	}

	const { files }: { files: FileItem[] } = $props();

	// Context menu state
	let contextMenu: { x: number; y: number; visible: boolean; file?: FileItem } = $state({
		x: 0,
		y: 0,
		visible: false
	});

	// Modal states
	let showDeleteConfirm = $state(false);
	let fileToDelete: FileItem | null = $state(null);
	let renameInput = $state<{ id: string; value: string } | null>(null);

	// Drag and drop state
	let draggedFile: FileItem | null = $state(null);
	let selectedItems = $state<Set<string>>(new Set());

	function formatCreationTime(creationTime: number): string {
		if (+dayjs() - +dayjs(creationTime) <= 1000 * 60 * 60 * 24 * 2) {
			return dayjs(creationTime).fromNow();
		}
		return dayjs(creationTime).format('MM/DD/YYYY');
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	}

	async function deleteFile(file: FileItem) {
		if (!authState.firebaseUser) return;
		try {
			const fileRef = ref(database, `users/${authState.firebaseUser.uid}/files/${file.id}`);
			await remove(fileRef);
			showDeleteConfirm = false;
			fileToDelete = null;
		} catch (error) {
			alert('Error deleting file: ' + error);
		}
	}

	async function createFolder() {
		if (!authState.firebaseUser) return;
		const name = prompt('Folder name:');
		if (name) {
			const folderRef = push(ref(database, `users/${authState.firebaseUser.uid}/files`));
			await set(folderRef, {
				name,
				title: name,
				type: 'folder',
				created: Date.now(),
				creationTime: Date.now(),
				lastAccessTime: Date.now(),
				parentFolder: null,
				size: 0
			});
		}
		hideContextMenu();
	}

	async function createFile() {
		if (!authState.firebaseUser) return;
		const name = prompt('File name:');
		if (name) {
			const fileRef = push(ref(database, `users/${authState.firebaseUser.uid}/files`));
			await set(fileRef, {
				name,
				title: name,
				type: 'file',
				created: Date.now(),
				creationTime: Date.now(),
				lastAccessTime: Date.now(),
				parentFolder: null,
				size: Math.floor(Math.random() * 100000),
				content: '',
				language: 'txt'
			});
		}
		hideContextMenu();
	}

	async function startRename(file: FileItem) {
		renameInput = { id: file.id, value: file.title || file.name || '' };
		hideContextMenu();
	}

	async function confirmRename() {
		if (renameInput && authState.firebaseUser) {
			await update(ref(database, `users/${authState.firebaseUser.uid}/files/${renameInput.id}`), {
				title: renameInput.value,
				name: renameInput.value
			});
			renameInput = null;
		}
	}

	function cancelRename() {
		renameInput = null;
	}

	async function addTag(file: FileItem) {
		if (!authState.firebaseUser) return;
		const tag = prompt('Add tag:');
		if (tag) {
			const currentTags = file.tags || [];
			await update(ref(database, `users/${authState.firebaseUser.uid}/files/${file.id}`), {
				tags: [...currentTags, tag]
			});
		}
		hideContextMenu();
	}

	async function removeTag(file: FileItem, tagToRemove: string) {
		if (!authState.firebaseUser) return;
		const updatedTags = (file.tags || []).filter(tag => tag !== tagToRemove);
		await update(ref(database, `users/${authState.firebaseUser.uid}/files/${file.id}`), {
			tags: updatedTags
		});
	}

	function formatLanguage(language: string | null): string {
		if (language == 'py') return 'Python';
		if (language == 'java') return 'Java';
		if (language == 'cpp') return 'C++';
		if (language == 'js') return 'JavaScript';
		if (language == 'ts') return 'TypeScript';
		if (language == 'html') return 'HTML';
		if (language == 'css') return 'CSS';
		if (language == 'json') return 'JSON';
		return language || 'Text';
	}

	function getFileIcon(file: FileItem): string {
		if (file.type === 'folder') {
			return '📁';
		}
		const lang = file.language?.toLowerCase();
		if (lang === 'py') return '🐍';
		if (lang === 'java') return '☕';
		if (lang === 'cpp' || lang === 'c++') return '⚙️';
		if (lang === 'js') return '🟨';
		if (lang === 'ts') return '🔷';
		if (lang === 'html') return '🌐';
		if (lang === 'css') return '🎨';
		if (lang === 'json') return '📋';
		return '📄';
	}

	// Context menu handlers
	const handleRightClick = (e: MouseEvent, file?: FileItem) => {
		e.preventDefault();
		contextMenu = {
			x: e.clientX,
			y: e.clientY,
			visible: true,
			file
		};
	};

	const hideContextMenu = () => {
		contextMenu.visible = false;
	};

	// Drag and drop handlers
	const handleDragStart = (e: DragEvent, file: FileItem) => {
		draggedFile = file;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', file.id);
		}
	};

	const handleDragEnd = () => {
		draggedFile = null;
	};

	const handleDragOver = (e: DragEvent) => {
		e.preventDefault();
		e.dataTransfer!.dropEffect = 'move';
	};

	const handleDrop = async (e: DragEvent, targetFolder: FileItem) => {
		e.preventDefault();
		if (draggedFile && targetFolder.type === 'folder' && draggedFile.id !== targetFolder.id && authState.firebaseUser) {
			await update(ref(database, `users/${authState.firebaseUser.uid}/files/${draggedFile.id}`), {
				parentFolder: targetFolder.id
			});
		}
		draggedFile = null;
	};

	const openFolder = (folder: FileItem) => {
		// This would need to be handled by the parent component
		// For now, we'll just log it
		console.log('Opening folder:', folder.name);
	};

	// Close context menu on outside click
	$effect(() => {
		const handleClick = () => {
			hideContextMenu();
		};
		
		document.addEventListener('click', handleClick);
		return () => document.removeEventListener('click', handleClick);
	});
</script>

<!-- Mac Finder Style File Browser -->
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
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div 
		class="min-h-[400px]"
		oncontextmenu={(e) => handleRightClick(e)}
	>
		{#if files && files.length > 0}
			{#each files as file (file.id)}
				<div
					class="grid grid-cols-12 gap-4 px-4 py-2 border-b border-gray-700 hover:bg-[#363636] transition-colors cursor-pointer group {
						draggedFile?.id === file.id ? 'opacity-50' : ''
					}"
					draggable="true"
					ondragstart={(e) => handleDragStart(e, file)}
					ondragend={handleDragEnd}
					ondragover={file.type === 'folder' ? handleDragOver : undefined}
					ondrop={file.type === 'folder' ? (e) => handleDrop(e, file) : undefined}
					oncontextmenu={(e) => handleRightClick(e, file)}
					ondblclick={() => file.type === 'folder' ? openFolder(file) : (window.location.href = `/${file.id.substring(1)}`)}
				>
					<!-- Name -->
					<div class="col-span-5 flex items-center space-x-3">
						<div class="text-xl">
							{getFileIcon(file)}
						</div>
						
						{#if renameInput && renameInput.id === file.id}
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
							<span class="text-white text-sm font-medium">
								{file.title || file.name || '(Unnamed)'}
							</span>
						{/if}
					</div>

					<!-- Date -->
					<div class="col-span-2 text-gray-400 text-sm">
						{formatCreationTime(file.lastAccessTime || file.creationTime || Date.now())}
					</div>

					<!-- Size -->
					<div class="col-span-2 text-gray-400 text-sm">
						{file.type === 'folder' ? '--' : formatFileSize(file.size || 0)}
					</div>

					<!-- Tags -->
					<div class="col-span-3 flex flex-wrap gap-1">
						{#each (file.tags || []) as tag}
							<span 
								class="inline-flex items-center bg-indigo-600 text-xs px-2 py-1 rounded-full text-white group-hover:bg-indigo-700 transition-colors"
							>
								<!-- svelte-ignore a11y_consider_explicit_label -->
								{tag}
								<!-- svelte-ignore a11y_consider_explicit_label -->
								<button
									onclick={(e) => {
										e.stopPropagation();
										removeTag(file, tag);
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
		{:else}
			<div class="flex items-center justify-center h-64 text-gray-500">
				<div class="text-center">
					<svg class="w-12 h-12 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
					<p>No files or folders</p>
					<p class="text-sm mt-1">Right-click to create new items</p>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Context Menu -->
{#if contextMenu.visible}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div 
		class="fixed z-50 bg-[#2a2a2a] border border-gray-600 rounded-lg shadow-lg py-2 min-w-[160px]"
		style="left: {contextMenu.x}px; top: {contextMenu.y}px;"
		onclick={(e) => e.stopPropagation()}
	>
		{#if contextMenu.file}
			<!-- File/Folder specific actions -->
			<button 
				class="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-[#363636] flex items-center"
				onclick={() => { 
					if (contextMenu.file) {
						if (contextMenu.file.type === 'folder') {
							openFolder(contextMenu.file);
						} else {
							window.location.href = `/${contextMenu.file.id.substring(1)}`;
						}
					}
					hideContextMenu(); 
				}}
			>
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
				</svg>
				Open
			</button>
			
			<button 
				class="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-[#363636] flex items-center"
				onclick={() => startRename(contextMenu.file!)}
			>
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
				</svg>
				Rename
			</button>

			<button 
				class="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-[#363636] flex items-center"
				onclick={() => addTag(contextMenu.file!)}
			>
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
				</svg>
				Add Tag
			</button>
			
			<hr class="border-gray-600 my-1">
			
			<button 
				class="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-600 hover:text-white flex items-center"
				onclick={() => { 
					fileToDelete = contextMenu.file || null;
					showDeleteConfirm = true;
					hideContextMenu(); 
				}}
			>
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
				</svg>
				Delete
			</button>
		{:else}
			<!-- Empty space actions -->
			<button
				onclick={createFile}
				class="w-full text-left px-4 py-2 hover:bg-[#363636] text-white text-sm flex items-center"
			>
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
				</svg>
				New File
			</button>
			<button
				onclick={createFolder}
				class="w-full text-left px-4 py-2 hover:bg-[#363636] text-white text-sm flex items-center"
			>
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a1.5 1.5 0 01-3 0V5.697l-1.402 1.402-1.414-1.414L21 2.368V4.5z"/>
				</svg>
				New Folder
			</button>
		{/if}
	</div>
{/if}

<!-- Delete Confirmation Modal -->
{#if showDeleteConfirm && fileToDelete}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-[#2a2a2a] rounded-lg p-6 w-96 border border-gray-700">
			<h3 class="text-lg font-medium text-gray-100 mb-4">Delete {fileToDelete.type === 'folder' ? 'Folder' : 'File'}</h3>
			<p class="text-gray-400 mb-4">
				Are you sure you want to delete "{fileToDelete.title || fileToDelete.name || '(Unnamed)'}"? 
				{#if fileToDelete.type === 'folder'}
					This will also delete all files inside this folder.
				{/if}
				This action cannot be undone.
			</p>
			<div class="flex justify-end space-x-3">
				<button 
					class="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
					onclick={() => { showDeleteConfirm = false; fileToDelete = null; }}
				>
					Cancel
				</button>
				<button 
					class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
					onclick={() => fileToDelete && deleteFile(fileToDelete)}
				>
					Delete
				</button>
			</div>
		</div>
	</div>
{/if}