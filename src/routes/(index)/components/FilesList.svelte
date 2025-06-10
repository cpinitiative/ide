<script lang="ts">
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';
	dayjs.extend(relativeTime);

	import { type UserFile, type Language, LANGUAGES, isFile, isFolder } from '$lib/types';
	import { authState, database } from '$lib/firebase/firebase.svelte';
	import { ref, update, remove, push, set } from 'firebase/database';

	const { files }: { files: UserFile[] } = $props();

	// Context menu state
	let contextMenu: { x: number; y: number; visible: boolean; file?: UserFile } = $state({
		x: 0,
		y: 0,
		visible: false
	});

	// Modal states
	let showDeleteConfirm = $state(false);
	let fileToDelete: UserFile | null = $state(null);
	let renameInput = $state<{ id: string; value: string } | null>(null);

	// Drag and drop state
	let draggedFile: UserFile | null = $state(null);
	let selectedItems = $state<Set<string>>(new Set());

	/** Format the creation or last access time for display */
	function formatCreationTime(creationTime: number): string {
		if (+dayjs() - +dayjs(creationTime) <= 1000 * 60 * 60 * 24 * 2) {
			return dayjs(creationTime).fromNow();
		}
		return dayjs(creationTime).format('MM/DD/YYYY');
	}

	/** Convert file size from bytes to a human-readable format */
	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	}

	/** Delete a file or folder from Firebase */
	async function deleteFile(file: UserFile) {
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

	/** Create a new folder in Firebase */
	async function createFolder() {
		if (!authState.firebaseUser) return;
		const name = prompt('Folder name:');
		if (name) {
			const folderRef = push(ref(database, `users/${authState.firebaseUser.uid}/files`));
			await set(folderRef, {
				type: 'folder',
				title: name,
				lastAccessTime: Date.now(),
				creationTime: Date.now(),
				version: 1,
				language: 'txt',
				children: [],
				isExpanded: false,
				childCount: 0
			});
		}
		hideContextMenu();
	}

	/** Create a new file in Firebase */
	async function createFile() {
		if (!authState.firebaseUser) return;
		const name = prompt('File name:');
		if (name) {
			const fileRef = push(ref(database, `users/${authState.firebaseUser.uid}/files`));
			await set(fileRef, {
				type: 'file',
				title: name,
				lastAccessTime: Date.now(),
				creationTime: Date.now(),
				language: 'txt',
				version: 1,
				content: '',
				size: 0,
				mimeType: 'text/plain',
				extension: name.split('.').pop() || 'txt',
				isExecutable: false
			});
		}
		hideContextMenu();
	}

	/** Start renaming a file or folder */
	async function startRename(file: UserFile) {
		renameInput = { id: file.id, value: file.title };
		hideContextMenu();
	}

	/** Confirm and apply the rename operation */
	async function confirmRename() {
		if (renameInput && authState.firebaseUser) {
			await update(ref(database, `users/${authState.firebaseUser.uid}/files/${renameInput.id}`), {
				title: renameInput.value
			});
			renameInput = null;
		}
	}

	/** Cancel the rename operation */
	function cancelRename() {
		renameInput = null;
	}

	/** Format the language for display using the LANGUAGES constant */
	function formatLanguage(language: string): string {
		if (language in LANGUAGES) {
			return LANGUAGES[language as Language];
		}
		return language || 'Text';
	}

	/** Get an icon based on the file or folder type */
	function getFileIcon(file: UserFile): string {
		if (isFolder(file)) {
			return '📁';
		}
		
		if (isFile(file)) {
			const lang = file.language?.toLowerCase();
			if (lang === 'py') return '🐍';
			if (lang === 'java') return '☕';
			if (lang === 'cpp' || lang === 'c++') return '⚙️';
		}
		
		return '📄';
	}

	/** Get file size for display */
	function getFileSize(file: UserFile): string {
		if (isFolder(file)) {
			return '--';
		}
		
		if (isFile(file) && file.size !== undefined) {
			return formatFileSize(file.size);
		}
		
		return '--';
	}

	/** Get additional info for display */
	function getFileInfo(file: UserFile): string {
		if (isFolder(file)) {
			const count = file.childCount || 0;
			return count === 1 ? '1 item' : `${count} items`;
		}
		
		if (isFile(file)) {
			return formatLanguage(file.language);
		}
		
		return '';
	}

	// **Context menu handlers**
	const handleRightClick = (e: MouseEvent, file?: UserFile) => {
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

	// **Drag and drop handlers**
	const handleDragStart = (e: DragEvent, file: UserFile) => {
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

	const handleDrop = async (e: DragEvent, targetFolder: UserFile) => {
		e.preventDefault();
		if (
			draggedFile &&
			isFolder(targetFolder) &&
			draggedFile.id !== targetFolder.id &&
			authState.firebaseUser
		) {
			// In a real implementation, you'd update the folder's children array
			// and the dragged file's parent reference
			console.log(`Moving ${draggedFile.title} to ${targetFolder.title}`);
		}
		draggedFile = null;
	};

	/** Open a folder (placeholder for parent component handling) */
	const openFolder = (folder: UserFile) => {
		if (isFolder(folder)) {
			console.log('Opening folder:', folder.title);
			// Dispatch event or call parent function to handle folder navigation
		}
	};

	/** Open a file */
	const openFile = (file: UserFile) => {
		if (isFile(file)) {
			window.location.href = `/${file.id.substring(1)}`;
		}
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
	<div
		class="grid grid-cols-12 gap-4 px-4 py-3 bg-[#323232] border-b border-gray-600 text-sm font-medium text-gray-300"
	>
		<div class="col-span-5">Name</div>
		<div class="col-span-2">Date Modified</div>
		<div class="col-span-2">Size</div>
		<div class="col-span-3">Kind</div>
	</div>

	<!-- Files List -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="min-h-[400px]" oncontextmenu={(e) => handleRightClick(e)}>
		{#if files && files.length > 0}
			{#each files as file (file.id)}
				<div
					class="grid grid-cols-12 gap-4 px-4 py-2 border-b border-gray-700 hover:bg-[#363636] transition-colors cursor-pointer group {draggedFile?.id === file.id
						? 'opacity-50'
						: ''}"
					draggable="true"
					ondragstart={(e) => handleDragStart(e, file)}
					ondragend={handleDragEnd}
					ondragover={isFolder(file) ? handleDragOver : undefined}
					ondrop={isFolder(file) ? (e) => handleDrop(e, file) : undefined}
					oncontextmenu={(e) => handleRightClick(e, file)}
					ondblclick={() => isFolder(file) ? openFolder(file) : openFile(file)}
				>
					<!-- Name -->
					<div class="col-span-5 flex items-center space-x-3">
						<div class="text-xl">{getFileIcon(file)}</div>

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
								{file.title}
							</span>
						{/if}
					</div>

					<!-- Date -->
					<div class="col-span-2 text-gray-400 text-sm">
						{formatCreationTime(file.lastAccessTime)}
					</div>

					<!-- Size -->
					<div class="col-span-2 text-gray-400 text-sm">
						{getFileSize(file)}
					</div>

					<!-- Kind/Type -->
					<div class="col-span-3 text-gray-400 text-sm">
						{getFileInfo(file)}
					</div>
				</div>
			{/each}
		{:else}
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
						if (isFolder(contextMenu.file)) {
							openFolder(contextMenu.file);
						} else {
							openFile(contextMenu.file);
						}
					}
					hideContextMenu();
				}}
			>
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
					/>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
					/>
				</svg>
				Open
			</button>

			<button
				class="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-[#363636] flex items-center"
				onclick={() => startRename(contextMenu.file!)}
			>
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
					/>
				</svg>
				Rename
			</button>

			<hr class="border-gray-600 my-1" />

			<button
				class="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-600 hover:text-white flex items-center"
				onclick={() => {
					fileToDelete = contextMenu.file || null;
					showDeleteConfirm = true;
					hideContextMenu();
				}}
			>
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
					/>
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
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
					/>
				</svg>
				New File
			</button>
			<button
				onclick={createFolder}
				class="w-full text-left px-4 py-2 hover:bg-[#363636] text-white text-sm flex items-center"
			>
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a1.5 1.5 0 01-3 0V5.697l-1.402 1.402-1.414-1.414L21 2.368V4.5z"
					/>
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
			<h3 class="text-lg font-medium text-gray-100 mb-4">
				Delete {isFolder(fileToDelete) ? 'Folder' : 'File'}
			</h3>
			<p class="text-gray-400 mb-4">
				Are you sure you want to delete "{fileToDelete.title}"?
				{#if isFolder(fileToDelete)}
					This will also delete all files inside this folder.
				{/if}
				This action cannot be undone.
			</p>
			<div class="flex justify-end space-x-3">
				<button
					class="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
					onclick={() => {
						showDeleteConfirm = false;
						fileToDelete = null;
					}}
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