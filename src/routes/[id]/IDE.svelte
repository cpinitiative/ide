<script lang="ts">
	import MonacoEditor from '$lib/components/editor/monaco/SecondaryMonacoEditor.svelte';
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
	import SecondaryMonacoEditor from '$lib/components/editor/monaco/SecondaryMonacoEditor.svelte';
	import MainMonacoEditor from '$lib/components/editor/monaco/MainMonacoEditor.svelte';
	import OutputStatusBar from '$lib/components/OutputStatusBar.svelte';
	import { computePermission } from '$lib/utils';

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

	const onUpdateUserSettings = (newUserData: UserData, newFileSettings: FileSettings) => {
		update(ref(database, `users/${firebaseUserId}/data`), newUserData).catch((error) => {
			alert('Error updating user data: ' + error);
		});
		// TODO: only if the user has permission to edit the file
		update(ref(database, `files/${fileId}/settings`), newFileSettings)
			.catch((error) => {
				alert('Error updating file settings: ' + error);
			});
	};

	let userPermission = $derived(computePermission(fileData, firebaseUserId));
	let isReadOnly = $derived(userPermission === 'READ');
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

	// All of these need to be derived to prevent unnecessary re-renders when
	// fileData's reference changes but the values do not.
	let language = $derived(fileData.settings.language);
	let editorMode = $derived(userData.editorMode);
	let mainDocumentId = $derived(`${fileData.id}.${fileData.settings.language}`);
	let inputDocumentId = $derived(`${fileData.id}.input`);
	let scribbleDocumentId = $derived(`${fileData.id}.scribble`);
	let userId = $derived(firebaseUser.uid);
	let compilerOptions = $derived(fileData.settings.compilerOptions[fileData.settings.language]);
</script>

<Layout>
	{#snippet navbar()}
		<IDENavbar>
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
			Editor={MainMonacoEditor}
			bind:this={mainEditor}
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
				Editor={SecondaryMonacoEditor}
				bind:this={inputEditor}
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
					Editor={SecondaryMonacoEditor}
				/>
			{:else}
				<div class="flex h-full min-h-0 flex-col">
					<MonacoEditor readOnly={true} value={outputPaneValue} {editorMode} />
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
	fileSettings={fileData.settings}
	onSave={onUpdateUserSettings}
/>
