<script lang="ts">
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';
	dayjs.extend(relativeTime);

	import type { UserFile } from '$lib/types';
	import { auth, authState, database } from '$lib/firebase/firebase.svelte';
	import { onChildRemoved, ref, update } from 'firebase/database';

	let { files }: { files: UserFile[] } = $props();

	function formatCreationTime(creationTime: number): string {
		if (+dayjs() - +dayjs(creationTime) <= 1000 * 60 * 60 * 24 * 2) {
			return dayjs(creationTime).fromNow();
		}
		return dayjs(creationTime).format('MM/DD/YYYY');
	}

	async function handleToggleHideFile(file: UserFile) {
		if (!authState.firebaseUser) return;
		const fileRef = ref(database, `users/${authState.firebaseUser.uid}/files/${file.id}`);
		await update(fileRef, { hidden: !file.hidden });
	}

	function formatLanguage(language: string | null): string {
		if (language == 'py') return 'Python';
		if (language == 'java') return 'Java';
		if (language == 'cpp') return 'C++';
		return 'Unknown';
	}

	import { onMount } from 'svelte';
	onMount(() => {
		if (!authState.firebaseUser) return;
		const fileRef = ref(database, `users/${authState.firebaseUser.uid}/files`);
		onChildRemoved(fileRef, (snapshot) => {
			const removedFileId = snapshot.key; 
			files = files.filter(file => file.id !== removedFileId);
		});
	})

</script>

<div class="flex flex-col">
	<div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
		<div class="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
			<table class="min-w-full divide-y divide-gray-600 text-gray-500 dark:text-gray-400">
				<thead>
					<tr>
						{#each ['Name', 'Last Accessed', 'Created', 'Language'] as col, i (col)}
							<th
								scope="col"
								class={[
									i == 0 && 'pr-2 pl-4 sm:pl-6 md:pl-0',
									i > 0 && 'px-2',
									'py-3.5 text-left text-sm font-semibold text-black dark:text-gray-100'
								]}
							>
								{col}
							</th>
						{/each}
						<th scope="col" class="relative py-3.5 pr-4 pl-2 sm:pr-6 md:pr-0">
							<span class="sr-only">Actions</span>
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-700">
					{#each files as file (file.id)}
						<tr>
							<td class="py-4 pr-2 pl-4 text-sm whitespace-nowrap sm:pl-6 md:pl-0">
								{#if file.hidden}
									<span class="text-gray-400">
										{file.title || '(Unnamed File)'} (Hidden)
									</span>
								{:else if !file.title}
									<span class="text-gray-400">
										(File Removed)
									</span>
								{:else}
									<a
										href={`/${file.id.substring(1)}`}
										class="text-gray-900 hover:text-black dark:text-gray-100 dark:hover:text-white"
									>
										{file.title || '(Unnamed File)'}
									</a>
								{/if}
							</td>
							<td class="px-3 py-4 text-sm whitespace-nowrap">
								{formatCreationTime(file.lastAccessTime)}
							</td>
							<td class="px-3 py-4 text-sm whitespace-nowrap">
								{file.creationTime ? formatCreationTime(file.creationTime) : 'Unknown'}
							</td>
							<td class="px-3 py-4 text-sm whitespace-nowrap">
								{file.language ? formatLanguage(file.language) : 'Unknown'}
							</td>
							<td
								class="relative py-4 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-6 md:pr-0"
							>
								<button
									onclick={() => handleToggleHideFile(file)}
									class="text-indigo-400 hover:text-indigo-100"
								>
									{file.hidden ? 'Unhide' : 'Hide'}
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
