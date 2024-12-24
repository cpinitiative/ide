<script lang="ts">
	import { enhance } from '$app/forms';
	import RadioGroup from '$lib/components/RadioGroup.svelte';
	import { authState } from '$lib/firebase/firebase.svelte';
	import { LANGUAGES, type Language } from '$lib/types';
	import generateRandomFileName from './generateRandomFileName';

	let { form } = $props();

	let lang: Language = $state('cpp');
	let compilerOptions: string = $state('');
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
		if (authState.isLoading) return;

		userID = authState.firebaseUser.uid;
		username = authState.firebaseUser.displayName ?? 'Unnamed User';
	});
</script>

<svelte:head>
	<title>Create New File · Real-Time Collaborative Online IDE</title>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<div class="mx-auto flex min-h-full max-w-6xl flex-col p-4 sm:p-6 md:p-8 lg:p-12">
	<form
		class="space-y-6 sm:space-y-8"
		method="POST"
		use:enhance={() => {
			creating = true;

			return async ({ update }) => {
				await update();
				creating = false;
			};
		}}
	>
		<h1 class="font-semibold text-white md:text-xl xl:text-2xl">Create New File</h1>

		{#if form?.error}
			<p class="text-red-300">Error: {form.error}</p>
		{/if}

		<input name="firebaseUserID" type="hidden" value={userID} />
		<input name="username" type="hidden" value={username} />

		<div class="space-y-4 sm:space-y-6">
			<div>
				<label for="filename" class="block text-sm leading-6 font-medium text-neutral-100">
					File Name
				</label>
				<div class="mt-2">
					<input
						type="text"
						name="filename"
						id="filename"
						class="block w-full max-w-md rounded-md border-0 bg-neutral-900 py-1.5 text-neutral-100 ring-1 shadow-sm ring-neutral-700 ring-inset placeholder:text-neutral-500 focus-visible:ring-2 focus-visible:ring-indigo-700 focus-visible:ring-inset sm:text-sm sm:leading-6"
						defaultValue={generateRandomFileName()}
					/>
				</div>
			</div>

			<div class="mb-6">
				<div class="mb-2 font-medium text-white">Default Sharing Permissions</div>
				<RadioGroup
					name="defaultPermissions"
					defaultValue="READ_WRITE"
					options={{
						READ_WRITE: 'Public Read & Write',
						READ: 'Public View Only',
						PRIVATE: 'Private'
					}}
				></RadioGroup>
			</div>

			<!-- Language Selection -->
			<div class="mb-6">
				<span class="block text-sm leading-6 font-medium text-neutral-100">Language</span>
				<div class="mt-2 flex space-x-3">
					{#each LANGUAGES as option}
						<label
							class={'cursor-pointer focus-visible:outline-none ' +
								(lang === option.value
									? 'bg-indigo-800 text-white hover:bg-indigo-700'
									: 'bg-neutral-900 text-neutral-100 ring-1 ring-neutral-700 ring-inset hover:bg-neutral-800') +
								' flex items-center justify-center rounded-md px-2 py-2 text-sm font-semibold ring-offset-neutral-900 sm:px-4'}
						>
							<input
								type="radio"
								name="language"
								value={option.value}
								class="sr-only"
								onclick={() => (lang = option.value)}
								checked={lang === option.value}
							/>
							{option.label}
						</label>
					{/each}
				</div>
			</div>

			<div>
				<label for="compilerOptions" class="block text-sm leading-6 font-medium text-neutral-100">
					Compiler Options
				</label>
				<div class="mt-2">
					<input
						type="text"
						name="compilerOptions"
						id="compilerOptions"
						class="block w-full rounded-md border-0 bg-neutral-900 py-1.5 font-mono text-neutral-100 ring-1 shadow-sm ring-neutral-700 ring-inset placeholder:text-neutral-500 focus-visible:ring-2 focus-visible:ring-indigo-700 focus-visible:ring-inset sm:text-sm sm:leading-6"
						value={compilerOptions}
						oninput={(e) => (compilerOptions = (e.target as HTMLInputElement).value)}
					/>
				</div>
			</div>
		</div>

		<div class="space-x-4">
			<button
				type="submit"
				class="rounded-md bg-indigo-700 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
				disabled={creating}
			>
				{creating ? 'Creating...' : 'Create File'}
			</button>
			<a
				href="/"
				class="focus-visible:outline-offset-neutral-900 rounded-md bg-white/5 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-700"
			>
				Cancel
			</a>
		</div>
	</form>
</div>
