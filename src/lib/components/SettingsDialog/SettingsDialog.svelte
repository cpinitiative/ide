<script lang="ts">
	import { createDialog, melt } from '@melt-ui/svelte';
	import { fade } from 'svelte/transition';
	import RadioGroup from '../RadioGroup.svelte';
	import type { Icon as LucideIcon } from 'lucide-svelte';
	import LaptopMinimal from 'lucide-svelte/icons/laptop-minimal';
	import User from 'lucide-svelte/icons/user';
	import Server from 'lucide-svelte/icons/server';
	import X from 'lucide-svelte/icons/x';
	import { LANGUAGES, type FileSettings, type Language, type UserData } from '$lib/types';
	import type { User as FirebaseUser } from 'firebase/auth';
	import TextField from './TextField.svelte';

	const {
		elements: { overlay, content, title, close, portalled },
		states: { open: meltUiOpen }
	} = createDialog({
		forceVisible: true
	});

	const {
		firebaseUser,
		userPermission,
		userData,
		fileSettings,
		onSave
	}: {
		firebaseUser: FirebaseUser;
		userPermission: 'OWNER' | 'READ' | 'READ_WRITE' | 'PRIVATE';
		userData: UserData;
		fileSettings: FileSettings;
		onSave: (
			newUserData: Partial<UserData>,
			newFileSettings: FileSettings,
			newUsername: string
		) => void;
	} = $props();

	let activeTab: 'workspace' | 'user' | 'judge' = $state('workspace');
	let selectedLanguage: Language = $state(fileSettings.language);
	let ioMethod: 'stdio' | 'fileio' = $state(fileSettings.fileIOName ? 'fileio' : 'stdio');
	let fileName: string = $state(fileSettings.fileIOName || fileSettings.workspaceName || '');

	const getInactiveTabClasses = () => {
		switch (userData.theme) {
			case 'dark':
				return 'border-transparent text-gray-500 hover:border-gray-700 hover:text-neutral-200';
			case 'huacat-pink':
				return 'border-transparent text-gray-500 hover:border-[#D5C5D5] hover:text-gray-700';
			default: // light
				return 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700';
		}
	};

	const onSubmit = (event: SubmitEvent) => {
		event.preventDefault();
		const formData = new FormData(event.target as HTMLFormElement);
		let tabSize: 2 | 4 | 8;
		try {
			tabSize = parseInt(formData.get('tabSize') as string) as 2 | 4 | 8;
		} catch (e) {
			alert('Invalid tab size value of ' + formData.get('tabSize'));
			return;
		}
		const newUserData = {
			editorMode: formData.get('editorMode') as 'normal' | 'vim',
			tabSize,
			theme: formData.get('theme') as 'light' | 'dark' | 'huacat-pink',
			inlayHints: formData.get('inlayHints') as 'on' | 'off',

			// deprecated: for compatibility with old IDE only
			lightMode: formData.get('theme') === 'light'
		};
		let newFileSettings = {
			...fileSettings,
			workspaceName: formData.get('workspaceName') as string,
			language: formData.get('language') as Language,
			defaultPermission: formData.get('defaultPermission') as 'READ_WRITE' | 'READ' | 'PRIVATE',
			fileIOName: ioMethod === 'fileio' ? fileName : null
		};
		newFileSettings.compilerOptions[newFileSettings.language] = formData.get(
			'compiler_options'
		) as string;
		onSave(newUserData, newFileSettings, formData.get('username') as string);
		meltUiOpen.set(false);
	};

	export const open = () => {
		meltUiOpen.set(true);
		activeTab = 'workspace';
	};
</script>

{#if $meltUiOpen}
	<div
		use:melt={$portalled}
		class="no-scrollbar fixed inset-0 z-10 overflow-y-scroll"
		data-theme={userData.theme}
	>
		<div class="flex min-h-full items-end justify-center pt-4 pb-20 text-center sm:block sm:p-0">
			<div
				use:melt={$overlay}
				class="fixed inset-0 bg-black/75 transition-opacity"
				transition:fade={{ duration: 150 }}
			></div>
			<div
				class="inline-block w-full transform overflow-hidden text-left shadow-xl transition-all sm:my-8 sm:max-w-2xl md:rounded-lg"
				class:bg-white={userData.theme === 'light'}
				class:bg-[#1E1E1E]={userData.theme === 'dark'}
				class:bg-[#F5EAF5]={userData.theme === 'huacat-pink'}
				class:text-gray-800={userData.theme === 'light' || userData.theme === 'huacat-pink'}
				class:text-gray-200={userData.theme === 'dark'}
				use:melt={$content}
				transition:fade={{ duration: 150 }}
			>
				<div class="px-4 pt-4 pb-2 sm:px-6">
					<h2 use:melt={$title} class="text-center text-lg leading-6 font-medium">Settings</h2>
				</div>

				<div class="border-b" class:border-gray-200={userData.theme === 'light'} class:border-gray-700={userData.theme === 'dark'} class:border-[#E5D5E5]={userData.theme === 'huacat-pink'}>
					<nav class="-mb-px flex">
						{@render SettingsTab(
							'Workspace',
							LaptopMinimal,
							activeTab === 'workspace',
							() => (activeTab = 'workspace')
						)}
						{@render SettingsTab('User', User, activeTab === 'user', () => (activeTab = 'user'))}
						{@render SettingsTab(
							'Judge',
							Server,
							activeTab === 'judge',
							() => (activeTab = 'judge')
						)}
					</nav>
				</div>

				<form class="space-y-6 p-4 sm:p-6" onsubmit={onSubmit}>
					<div class:hidden={activeTab !== 'workspace'}>
					<TextField
						label="Workspace Name"
						name="workspaceName"
						defaultValue={fileSettings.workspaceName}
						readonly={!(userPermission === 'OWNER' || userPermission === 'READ_WRITE')}
					/>
					</div>
					<div class:hidden={activeTab !== 'workspace'}>
						<div class="mb-2 font-medium">Language</div>
						<RadioGroup
							name="language"
							defaultValue={fileSettings.language}
							options={LANGUAGES}
							bind:value={selectedLanguage}
							readonly={!(userPermission === 'OWNER' || userPermission === 'READ_WRITE')}
						/>
					</div>

					<div class:hidden={activeTab !== 'workspace'}>
					<TextField
						label={`${LANGUAGES[selectedLanguage]} Compiler Options`}
						name="compiler_options"
						defaultValue={fileSettings.compilerOptions[selectedLanguage]}
						readonly={!(userPermission === 'OWNER' || userPermission === 'READ_WRITE')}
						placeholder="None"
							className="font-mono"
						/>
					</div>

					<div class:hidden={activeTab !== 'workspace'}>
						<div class="mb-2 font-medium">Default Sharing Permissions</div>
						<RadioGroup
							name="defaultPermission"
							defaultValue={fileSettings.defaultPermission}
							options={{
								READ_WRITE: 'Public Read & Write',
								READ: 'Public View Only',
								PRIVATE: 'Private'
							}}
							readonly={userPermission !== 'OWNER'}
						/>
					</div>

					<div class:hidden={activeTab !== 'user'}>
					<TextField
						label="User Name"
						name="username"
						defaultValue={firebaseUser.displayName || ''}
					/>
					</div>

					<div class:hidden={activeTab !== 'user'}>
						<div class="mb-2 font-medium">Editor Mode</div>
						<RadioGroup
							name="editorMode"
							defaultValue={userData.editorMode}
							options={{ normal: 'Normal', vim: 'Vim' }}
						/>
					</div>

					<div class:hidden={activeTab !== 'user'}>
						<div class="mb-2 font-medium">Tab Size</div>
						<RadioGroup
							name="tabSize"
							defaultValue={userData.tabSize.toString()}
							options={{ 2: '2', 4: '4', 8: '8' }}
						/>
					</div>

					<div class:hidden={activeTab !== 'user'}>
						<div class="mb-2 font-medium">Inlay Hints</div>
						<RadioGroup
							name="inlayHints"
							defaultValue={userData.inlayHints}
							options={{ on: 'On', off: 'Off' }}
						/>
					</div>

					<div class:hidden={activeTab !== 'user'}>
						<div class="mb-2 font-medium">Theme</div>
						<RadioGroup
							name="theme"
							defaultValue={userData.theme}
							options={{ light: 'Light', dark: 'Dark', 'huacat-pink': 'Huacat Pink' }}
						/>
					</div>

					<div class:hidden={activeTab !== 'judge'}>
						<div class="mb-2 font-medium">File I/O</div>
						<RadioGroup
							name="ioMethod"
							options={{ fileio: 'Enabled', stdio: 'Disabled' }}
							defaultValue={ioMethod}
							bind:value={ioMethod}
							readonly={!(userPermission === 'OWNER' || userPermission === 'READ_WRITE')}
						/>
					</div>

					<div class:hidden={activeTab !== 'judge'}>
						{#if ioMethod === 'fileio'}
						<TextField
							label="File Name"
							name="fileName"
							bind:value={fileName}
							readonly={!(userPermission === 'OWNER' || userPermission === 'READ_WRITE')}
						/>
							<p class="text-sm text-gray-500 pt-2">
								You can optionally read/write from {fileName}.in and
								{fileName}.out instead of standard input/output. You must use an alphanumeric
								file name (dashes are not allowed).
							</p>
						{/if}
					</div>

					<div class="mt-6 flex items-center space-x-4">
					<button
						type="button"
						class="inline-flex items-center rounded-md border bg-transparent px-4 py-2 text-sm font-medium shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
						class:border-gray-300={userData.theme === 'light'}
						class:text-gray-700={userData.theme === 'light' || userData.theme === 'huacat-pink'}
						class:hover:bg-gray-50={userData.theme === 'light'}
						class:border-gray-600={userData.theme === 'dark'}
						class:text-white={userData.theme === 'dark'}
						class:hover:bg-gray-700={userData.theme === 'dark'}
						class:border-[#D5C5D5]={userData.theme === 'huacat-pink'}
						class:hover:bg-[#F0E5F0]={userData.theme === 'huacat-pink'}
						use:melt={$close}
						>
							Cancel
						</button>
						<button
							type="submit"
							class="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
						>
							Save
						</button>
					</div>
				</form>

				<div class="absolute top-0 right-0 pt-4 pr-4">
					<button
						type="button"
						class="cursor-pointer rounded-md bg-transparent text-gray-400 hover:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
						use:melt={$close}
					>
						<span class="sr-only">Close</span>

						<X class="h-6 w-6" strokeWidth={1.5}></X>
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

{#snippet SettingsTab(
	label: string,
	Icon: typeof LucideIcon,
	selected: boolean,
	onClick: () => void
)}
	<button
		class={(selected
			? 'border-indigo-500'
			: getInactiveTabClasses()) +
			' group flex w-1/2 cursor-pointer items-center justify-center border-b-2 px-1 py-3 text-sm font-medium focus:outline-none'}
		class:text-indigo-500={selected && userData.theme !== 'dark'}
		class:text-neutral-200={selected && userData.theme === 'dark'}
		class:text-neutral-300={!selected && userData.theme === 'dark'}
		onclick={onClick}
	>
		<Icon
			class={(selected ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500') +
				' mr-2 -ml-0.5 h-5 w-5'}
		/>

		{label}
	</button>
{/snippet}
