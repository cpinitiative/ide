<script lang="ts">
	import { enhance } from '$app/forms';
	import RadioGroup from '$lib/components/RadioGroup.svelte';
	import { authState, database, getUserData } from '$lib/firebase/firebase.svelte';
	import { LANGUAGES, type Language } from '$lib/types';
	import { get, ref, update } from 'firebase/database';
	import generateRandomFileName from './generateRandomFileName';

	const userData = getUserData();

	let { form } = $props();

	let lang: Language = $state('cpp');
	let compilerOptions: string = $state('');
	let defaultPermission: 'READ_WRITE' | 'READ' | 'PRIVATE' = $state('READ_WRITE');
	let creating = $state(false);

	const DEFAULT_COMPILER_OPTIONS = {
		cpp: '-std=c++23 -O2 -Wall -Wextra -Wshadow -Wconversion -Wfloat-equal -Wduplicated-cond -Wlogical-op',
		java: '',
		py: ''
	};

	$effect(() => {
		compilerOptions = DEFAULT_COMPILER_OPTIONS[lang];
	});

	let userID = $state('');
	let username = $state('');

	$effect(() => {
		if (!authState.firebaseUser) return;

		userID = authState.firebaseUser.uid;
		username = authState.firebaseUser.displayName ?? 'Unnamed User';
		
		const userDataRef = ref(database, `users/${authState.firebaseUser.uid}/data`);
		let isAlive = true;
		get(userDataRef).then((snapshot) => {
			if (!isAlive) return;
			const data = snapshot.val();
			if (data) {
				if (data.defaultPermission === 'READ_WRITE' || data.defaultPermission === 'READ' || data.defaultPermission === 'PRIVATE') {
					defaultPermission = data.defaultPermission;
				}
				if (data.defaultLanguage === 'cpp' || data.defaultLanguage === 'java' || data.defaultLanguage === 'py') {
					lang = data.defaultLanguage;
				}
			}
		});

		return () => isAlive = false;
	});
</script>

<svelte:head>
	<title>Create New File · Real-Time Collaborative Online IDE</title>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<div class="mx-auto flex min-h-full max-w-6xl flex-col p-4 sm:p-6 md:p-8 lg:p-12" data-theme={userData.theme}>
	<form
		class="space-y-6 sm:space-y-8"
		method="POST"
		use:enhance={() => {
			creating = true;

			return async ({ update: submitRequest }) => {
				const userDataRef = ref(database, `users/${authState.firebaseUser!.uid}/data`);
				await update(userDataRef, {
					defaultPermission,
					language: lang
				});
				await submitRequest();
				creating = false;
			};
		}}
	>
		<h1 class="font-semibold text-[var(--color-text-primary)] md:text-xl xl:text-2xl">Create New File</h1>

		{#if form?.error}
			<p class="text-red-400">Error: {form.error}</p>
		{/if}

		<input name="firebaseUserID" type="hidden" value={userID} />
		<input name="username" type="hidden" value={username} />

		<div class="space-y-4 sm:space-y-6">
			<div>
				<label for="filename" class="block text-sm leading-6 font-medium text-[var(--color-text-primary)]">
					File Name
				</label>
				<div class="mt-2">
					<input
						type="text"
						name="filename"
						id="filename"
						class="block w-full max-w-md rounded-md border-0 bg-[var(--color-bg-primary)] py-1.5 text-[var(--color-text-primary)] ring-1 shadow-sm ring-[var(--color-bg-border-primary)] ring-inset placeholder:text-[var(--color-text-secondary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-inset sm:text-sm sm:leading-6"
						defaultValue={generateRandomFileName()}
					/>
				</div>
			</div>

			<div class="mb-6">
				<div class="mb-2 font-medium text-[var(--color-text-primary)]">Default Sharing Permissions</div>
				<RadioGroup
					name="defaultPermission"
					bind:value={defaultPermission}
					options={{
						READ_WRITE: 'Public Read & Write',
						READ: 'Public View Only',
						PRIVATE: 'Private'
					}}
				></RadioGroup>
			</div>

			<!-- Language Selection -->
			<div class="mb-6">
				<span class="block text-sm leading-6 font-medium text-[var(--color-text-primary)]">Language</span>
				<div class="mt-2 flex space-x-3">
					{#each Object.entries(LANGUAGES) as [option, label]}
						<label
							class={'cursor-pointer focus-visible:outline-none ' +
								(lang === option
									? 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]'
									: 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] ring-1 ring-[var(--color-bg-border-primary)] ring-inset hover:bg-[var(--color-bg-hover-primary)]') +
								' flex items-center justify-center rounded-md px-2 py-2 text-sm font-semibold ring-offset-[var(--color-bg-primary)] sm:px-4'}
						>
							<input
								type="radio"
								name="language"
								value={option}
								class="sr-only"
								onclick={() => (lang = option as keyof typeof LANGUAGES)}
								checked={lang === option}
							/>
							{label}
						</label>
					{/each}
				</div>
			</div>

			<div>
				<label for="compilerOptions" class="block text-sm leading-6 font-medium text-[var(--color-text-primary)]">
					Compiler Options
				</label>
				<div class="mt-2">
					<input
						type="text"
						name="compilerOptions"
						id="compilerOptions"
						class="block w-full rounded-md border-0 bg-[var(--color-bg-primary)] py-1.5 font-mono text-[var(--color-text-primary)] ring-1 shadow-sm ring-[var(--color-bg-border-primary)] ring-inset placeholder:text-[var(--color-text-secondary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-inset sm:text-sm sm:leading-6"
						value={compilerOptions}
						oninput={(e) => (compilerOptions = (e.target as HTMLInputElement).value)}
					/>
				</div>
			</div>
		</div>

		<div class="space-x-4">
			<button
				type="submit"
				class="rounded-md bg-[var(--color-primary)] px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--color-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
				disabled={creating}
			>
				{creating ? 'Creating...' : 'Create File'}
			</button>
			<a
				href="/"
				class="rounded-md border bg-transparent px-3.5 py-2.5 text-sm font-semibold shadow-sm border-[var(--color-bg-border-primary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
			>
				Cancel
			</a>
		</div>
	</form>
</div>
