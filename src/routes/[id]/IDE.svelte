<script lang="ts">
	import { onMount } from 'svelte';
	import MonacoEditor, { layoutEditors } from '$lib/components/editor/monaco/MonacoEditor.svelte';
	import Layout from '$lib/components/IDELayout.svelte';
	import type { FileData, JudgeResponse } from '$lib/types';
	import RealtimeEditor from '$lib/components/editor/RealtimeEditor.svelte';
	import { authState } from '$lib/firebase/firebase.svelte';
	import IDENavbar from '$lib/components/IDENavbar.svelte';
	import RunButton from '$lib/components/RunButton.svelte';
	import { submitToJudge } from '$lib/judge/judge';
	import TabbedPane from '$lib/components/TabbedPane.svelte';
	import FileMenu from '$lib/components/FileMenu.svelte';
	import { downloadFile } from './utils';
	import SettingsDialog from '$lib/components/SettingsDialog/SettingsDialog.svelte';

	const { fileData }: { fileData: FileData } = $props();

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

	// When the window resizes, we should resize the monaco editors
	onMount(() => {
		function handleResize() {
			layoutEditors();
		}

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	});

	const firebaseUser = $derived.by(() => {
		if (!authState.firebaseUser) {
			throw new Error(
				'Firebase user is null. The IDE component require that the firebase user is not null.'
			);
		}
		return authState.firebaseUser;
	});

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

	const onOpenSettings = () => {
		settingsDialog?.open();
	};

	let isViewOnly = $derived(fileData.settings.defaultPermission === 'READ');
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
</script>

<Layout onResize={() => layoutEditors()}>
	{#snippet navbar()}
		<IDENavbar>
			{#snippet fileMenu()}
				<FileMenu {onDownloadFile} {onOpenSettings} />
			{/snippet}
			{#snippet runButton()}
				<RunButton
					showLoadingIndicator={judgeState.isRunning}
					onclick={runCode}
					disabled={isViewOnly || judgeState.isRunning}
					title={isViewOnly ? "You can't run code in a view-only document." : undefined}
				/>
			{/snippet}
		</IDENavbar>
	{/snippet}

	{#snippet mainPane()}
		<RealtimeEditor
			documentId={`${fileData.id}.${fileData.settings.language}`}
			userId={firebaseUser.uid}
			language={fileData.settings.language}
			compilerOptions={fileData.settings.compilerOptions[fileData.settings.language]}
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
				documentId={`${fileData.id}.input`}
				userId={firebaseUser.uid}
				language="plaintext"
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
					documentId={`${fileData.id}.scribble`}
					userId={firebaseUser.uid}
					language="plaintext"
				/>
			{:else}
				<MonacoEditor readOnly={true} value={outputPaneValue} />
			{/if}
		</TabbedPane>
	{/snippet}
</Layout>

<SettingsDialog bind:this={settingsDialog} />
