<script module>
	import { isExecuteResponse, type CommandOutput, type ExecuteResponse, type FileData, type FileSettings, type JudgeResponse, type USACOJudgeSubmissionResult, type UserData } from '$lib/types';

	export type JudgeState = {
		isRunning: boolean;
		compileResult: CommandOutput | null;
		executeResult: ExecuteResponse | USACOJudgeSubmissionResult | null;
	};
</script>
<script lang="ts">
	import Layout from '$lib/components/IDELayout.svelte';
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
	import { MediaQuery } from 'svelte/reactivity';
	import USACOJudgePane from './USACOJudgePane.svelte';
	const { fileData, userData }: { fileData: FileData; userData: UserData } = $props();

	let mainEditor: RealtimeEditor | undefined = $state(undefined);
	let inputEditor: RealtimeEditor | undefined = $state(undefined);

	let inputPaneTab: 'input' | 'judge' = $state(fileData.settings.problem ? 'judge' : 'input');
	let outputPaneTab = $state('stdout');

	let settingsDialog: SettingsDialog | undefined = $state(undefined);

	let judgeState: JudgeState = $state({
		isRunning: false,
		compileResult: null,
		executeResult: null
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
		const input = inputEditor?.getValue().trimEnd();

		if (code === undefined || input === undefined) {
			console.warn('Code or input is undefined when trying to run code, cancelling', code, input);
			return;
		}

		judgeState.isRunning = true;
		judgeState.compileResult = null;
		judgeState.executeResult = null;

		let resp: JudgeResponse;
		try {
			resp = await submitToJudge(
				fileData.settings.language,
				code,
				input,
				fileData.settings.compilerOptions[fileData.settings.language],
				fileData.settings.fileIOName
			);
		} catch (e) {
			judgeState.isRunning = false;
			judgeState.compileResult = null;
			judgeState.executeResult = null;
			alert('Error running code: ' + e);
			return;
		}

		judgeState.isRunning = false;
		judgeState.compileResult = resp.compile;
		judgeState.executeResult = resp.execute;

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
		newUserData: Partial<UserData>,
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
		if (outputPaneTab === 'compile_output') {
			return judgeState.compileResult?.stderr ?? '';
		} else if (judgeState.executeResult && isExecuteResponse(judgeState.executeResult)) {
			if (outputPaneTab === 'stdout') {
				if (judgeState.executeResult.file_output) {
					return judgeState.executeResult.file_output;
				}
				return judgeState.executeResult.stdout ?? '';
			} else if (outputPaneTab === 'stderr') {
				return judgeState.executeResult.stderr ?? '';
			} else {
				return 'Error';
			}
		} else if (judgeState.executeResult) {
			if (outputPaneTab === 'stdout') {
				return judgeState.executeResult.test_cases[0]?.stdout ?? '';
			} else if (outputPaneTab === 'stderr') {
				return judgeState.executeResult.test_cases[0]?.stderr ?? '';
			} else {
				return 'Error';
			}
		} else {
			return '';
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

	const useMobileLayout = new MediaQuery('(max-width: 1023px)');

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
	const inlayHints = $derived(userData.inlayHints);
</script>

<Layout layout={useMobileLayout.current ? 'mobile' : 'desktop'} theme={userData.theme}>
	{#snippet navbar()}
		<IDENavbar showViewOnlyMessage={isReadOnly}>
			{#snippet fileMenu()}
				<FileMenu
					{onDownloadFile}
					onOpenSettings={() => settingsDialog?.open()}
					theme={userData.theme}
				/>
			{/snippet}
			{#snippet runButton()}
				<RunButton
					showLoadingIndicator={judgeState.isRunning}
					onclick={runCode}
					disabled={isReadOnly || judgeState.isRunning || inputPaneTab === 'judge'}
					title={isReadOnly
						? "You can't run code in a view-only document."
						: inputPaneTab === 'judge'
							? 'Switch to the input tab to run code.'
							: undefined}
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
			{inlayHints}
			Editor={PrimaryEditor}
			bind:this={mainEditor}
			readOnly={isReadOnly}
		/>
	{/snippet}

	{#snippet inputPane()}
		<TabbedPane
			tabs={{
				input: 'Input',
				...(fileData.settings.problem ? { judge: 'USACO Judge' } : {})
			}}
			bind:activeTab={inputPaneTab}
		>
			{#if inputPaneTab === 'input'}
				<RealtimeEditor
					documentId={inputDocumentId}
					{userId}
					language="plaintext"
					{editorMode}
					Editor={SecondaryEditor}
					bind:this={inputEditor}
					readOnly={isReadOnly}
				/>
			{:else if inputPaneTab === 'judge'}
				<USACOJudgePane {fileData} {mainEditor} bind:judgeState={judgeState} />
			{/if}
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
					<SecondaryEditor
						readOnly={true}
						language="plaintext"
						value={outputPaneValue}
						{editorMode}
					/>
					<OutputStatusBar {judgeState} />
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
