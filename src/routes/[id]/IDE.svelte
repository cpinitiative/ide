<script lang="ts">
	import Layout from '$lib/components/IDELayout.svelte';
	import type { FileData, FileSettings, JudgeResponse, UserData } from '$lib/types';
	import RealtimeEditor from '$lib/components/editor/RealtimeEditor.svelte';
	import { authState, database } from '$lib/firebase/firebase.svelte';
	import IDENavbar from '$lib/components/IDENavbar.svelte';
	import RunButton from '$lib/components/RunButton.svelte';
	import { submitToJudge } from '$lib/judge/judge';
	import TabbedPane from '$lib/components/TabbedPane.svelte';
	import FileMenu from '$lib/components/FileMenu.svelte';
	import SettingsDialog from '$lib/components/SettingsDialog/SettingsDialog.svelte';
	import { downloadFile } from './utils';
	import { ref, update } from 'firebase/database';
	import OutputStatusBar from '$lib/components/OutputStatusBar.svelte';
	import EditorLoadingPlaceholder from '$lib/components/editor/EditorLoadingPlaceholder.svelte';
	import { computePermission } from '$lib/utils';
	import { updateProfile } from 'firebase/auth';
	import { type Component, onMount } from 'svelte';

	const { fileData, userData }: { fileData: FileData; userData: UserData } = $props();

	let mainEditor: RealtimeEditor | undefined = $state(undefined);
	let inputEditor: RealtimeEditor | undefined = $state(undefined);

	let inputPaneTab = $state('input');
	let outputPaneTab = $state('stdout');

	let settingsDialog: SettingsDialog | undefined = $state(undefined);

	let judgeState: {
		isRunning: boolean;
		result: JudgeResponse | null;
	} = $state({
		isRunning: false,
		result: null
	});

	const firebaseUser = $derived.by(() => {
		if (!authState.firebaseUser) {
			throw new Error(
				'Firebase user is null. The IDE component require that the firebase user is not null.'
			);
		}
		return authState.firebaseUser;
	});

	const firebaseUserId = $derived(firebaseUser.uid);
	const fileId = $derived(fileData.id);
	const userPermission = $derived(computePermission(fileData, firebaseUserId));
	const isReadOnly = $derived(userPermission === 'READ');

	const runCode = async () => {
		const code = mainEditor?.getValue();
		const input = inputEditor?.getValue();

		if (code === undefined || input === undefined) {
			console.warn('Code or input is undefined when trying to run code, cancelling', code, input);
			return;
		}

		judgeState.isRunning = true;
		judgeState.result = null;

		const resp = await submitToJudge(
			fileData.settings.language,
			code,
			input,
			fileData.settings.compilerOptions[fileData.settings.language]
			// todo
			// fileData.settings.fileIOName
		);

		judgeState.isRunning = false;
		judgeState.result = resp;

		// Auto-select the next tab
		if (resp.compile.exit_code !== 0) {
			// Compilation error: show compile output
			outputPaneTab = 'compile_output';
		} else if (resp.execute?.exit_code !== 0 && resp.execute?.stderr !== '') {
			// Runtime error: show stderr
			outputPaneTab = 'stderr';
		} else {
			// Otherwise, show stdout
			outputPaneTab = 'stdout';
		}
	};

	const onDownloadFile = () => {
		if (!mainEditor?.getValue()) {
			alert("Editor hasn't loaded yet. Please wait.");
			return;
		}

		const code = mainEditor.getValue();

		downloadFile(code, fileData.settings.language, fileData.settings.workspaceName ?? 'main');
	};

	const onUpdateUserSettings = (
		newUserData: UserData,
		newFileSettings: FileSettings,
		newUsername: string
	) => {
		update(ref(database, `users/${firebaseUserId}/data`), newUserData).catch((error) => {
			alert('Error updating user data: ' + error);
		});
		if (!isReadOnly) {
			update(ref(database, `files/${fileId}/settings`), newFileSettings).catch((error) => {
				alert('Error updating file settings: ' + error);
			});
		}
		updateProfile(firebaseUser, { displayName: newUsername });
	};

	let outputPaneValue = $derived.by(() => {
		if (outputPaneTab === 'stdout') {
			return judgeState.result?.execute?.stdout ?? '';
		} else if (outputPaneTab === 'stderr') {
			return judgeState.result?.execute?.stderr ?? '';
		} else if (outputPaneTab === 'compile_output') {
			return judgeState.result?.compile?.stderr ?? '';
		} else {
			// Scribble editor is a realtime editor which doesn't read from this value.
			return 'Error';
		}
	});

	let PrimaryEditor = $state<Component>(EditorLoadingPlaceholder);
	let SecondaryEditor = $state<Component>(EditorLoadingPlaceholder);

	onMount(() => {
		const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
		(async () => {
			PrimaryEditor = isMobile
				? (await import('$lib/components/editor/codemirror/CodemirrorEditor.svelte')).default
				: (await import('$lib/components/editor/monaco/MainMonacoEditor.svelte')).default;
			SecondaryEditor = isMobile
				? (await import('$lib/components/editor/codemirror/CodemirrorEditor.svelte')).default
				: (await import('$lib/components/editor/monaco/SecondaryMonacoEditor.svelte')).default;
		})();
	});

	// All of these need to be derived to prevent unnecessary re-renders when
	// fileData's reference changes but the values do not.
	const language = $derived(fileData.settings.language);
	const editorMode = $derived(userData.editorMode);
	const mainDocumentId = $derived(`${fileData.id}.${fileData.settings.language}`);
	const inputDocumentId = $derived(`${fileData.id}.input`);
	const scribbleDocumentId = $derived(`${fileData.id}.scribble`);
	const userId = $derived(firebaseUser.uid);
	const compilerOptions = $derived(fileData.settings.compilerOptions[fileData.settings.language]);
	const theme = $derived(userData.theme);
	const tabSize = $derived(userData.tabSize);
</script>

<Layout>
	{#snippet navbar()}
		<IDENavbar showViewOnlyMessage={isReadOnly}>
			{#snippet fileMenu()}
				<FileMenu {onDownloadFile} onOpenSettings={() => settingsDialog?.open()} />
			{/snippet}
			{#snippet runButton()}
				<RunButton
					showLoadingIndicator={judgeState.isRunning}
					onclick={runCode}
					disabled={isReadOnly || judgeState.isRunning}
					title={isReadOnly ? "You can't run code in a view-only document." : undefined}
				/>
			{/snippet}
		</IDENavbar>
	{/snippet}

	{#snippet mainPane()}
		<RealtimeEditor
			documentId={mainDocumentId}
			{userId}
			{language}
			{compilerOptions}
			{editorMode}
			{theme}
			{tabSize}
			Editor={PrimaryEditor}
			bind:this={mainEditor}
			readOnly={isReadOnly}
		/>
	{/snippet}

	{#snippet inputPane()}
		<TabbedPane
			tabs={{
				input: 'Input'
			}}
			bind:activeTab={inputPaneTab}
		>
			<RealtimeEditor
				documentId={inputDocumentId}
				{userId}
				language="plaintext"
				{editorMode}
				Editor={SecondaryEditor}
				bind:this={inputEditor}
				readOnly={isReadOnly}
			/>
		</TabbedPane>
	{/snippet}

	{#snippet outputPane()}
		<TabbedPane
			tabs={{
				stdout: 'stdout',
				stderr: 'stderr',
				compile_output: 'compile output',
				scribble: 'scribble'
			}}
			bind:activeTab={outputPaneTab}
		>
			{#if outputPaneTab === 'scribble'}
				<RealtimeEditor
					documentId={scribbleDocumentId}
					{userId}
					language="plaintext"
					{editorMode}
					Editor={SecondaryEditor}
					readOnly={isReadOnly}
				/>
			{:else}
				<div class="flex h-full min-h-0 flex-col">
					<SecondaryEditor readOnly={true} value={outputPaneValue} {editorMode} />
					<OutputStatusBar result={judgeState.result} />
				</div>
			{/if}
		</TabbedPane>
	{/snippet}
</Layout>

<SettingsDialog
	bind:this={settingsDialog}
	{userPermission}
	{userData}
	{firebaseUser}
	fileSettings={fileData.settings}
	onSave={onUpdateUserSettings}
/>
