<script lang="ts">
	import type { FileData, UserData } from '$lib/types';
	import { onValue, ref, remove, serverTimestamp, set, update } from 'firebase/database';
	import IDE from './IDE.svelte';
	import { authState, database, USER_DATA_KEY } from '$lib/firebase/firebase.svelte';
	import { computePermission } from '$lib/utils';
	import MessagePage from '$lib/components/MessagePage.svelte';
	import { getContext } from 'svelte';

	let props = $props();
	let fileId = props.data.fileId;

	let isLoading = $state(true);
	let fileData: FileData | null = $state(null);
	const userData: UserData = getContext(USER_DATA_KEY);

	$effect(() => {
		isLoading = true;
		fileData = null;

		if (!authState.firebaseUser) {
			// auth is loading
			return;
		}

		const fileDataRef = ref(database, `files/${fileId}`);
		const unsubscribeFileData = onValue(fileDataRef, (snapshot) => {
			if (!snapshot.exists()) {
				fileData = null;
			} else {
				fileData = {
					id: snapshot.key,
					...snapshot.val()
				};
			}
			isLoading = false;
		});

		return () => {
			unsubscribeFileData();
		};
	});

	// Add file to dashboard.
	const userPermission = $derived(
		isLoading ? undefined : computePermission(fileData!, authState.firebaseUser!.uid)
	);
	const fileRef = $derived(
		isLoading ? undefined : ref(database, `users/${authState.firebaseUser!.uid}/files/${fileId}`)
	);
	const owner = $derived.by(() => {
		if (isLoading || !fileData || !userPermission) {
			return undefined;
		}
		for (let [userId, user] of Object.entries(fileData.users)) {
			if (user.permission === 'OWNER') {
				return {
					name: user.name,
					id: userId
				};
			}
		}
	});
	const ownerName = $derived(owner ? owner.name : undefined);
	const ownerId = $derived(owner ? owner.id : undefined);
	const workspaceName = $derived(isLoading ? undefined : fileData!.settings.workspaceName);
	const creationTime = $derived(isLoading ? undefined : fileData!.settings.creationTime);
	const language = $derived(isLoading ? undefined : fileData!.settings.language);
	const defaultPermission = $derived(isLoading ? undefined : fileData!.settings.defaultPermission);
	$effect(() => {
		if (isLoading || !fileData || !authState.firebaseUser || !fileRef) {
			return;
		}

		if (userPermission === 'PRIVATE') {
			remove(fileRef);
		} else {
			update(fileRef, {
				title: workspaceName || '',
				lastAccessTime: serverTimestamp(),
				creationTime: creationTime,
				hidden: false,
				version: 2,
				language: language,
				owner: ownerName
					? {
							name: ownerName,
							id: ownerId
						}
					: undefined,

				// deprecated: for compatibility with legacy IDE only
				lastPermission: userPermission,
				lastDefaultPermission: defaultPermission
			});
		}
	});
</script>

<svelte:head>
	<title>
		{fileData?.settings.workspaceName ? `${fileData?.settings.workspaceName} · ` : ''}Real-Time
		Collaborative Online IDE
	</title>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

{#if isLoading}
	<MessagePage message="Loading..." />
{:else if !fileData}
	<MessagePage message="File not found." showHomeButton={true} />
{:else if userPermission === 'PRIVATE'}
	<MessagePage message="You do not have permission to view this file." showHomeButton={true} />
{:else if fileData && userData}
	<IDE {fileData} {userData} />
{/if}
