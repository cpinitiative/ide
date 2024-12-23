<script lang="ts">
	import { onMount } from 'svelte';
	import MonacoEditor, { layoutEditors } from '$lib/components/editor/MonacoEditor.svelte';
	import Layout from '$lib/components/IDELayout.svelte';
	import type { FileData, JudgeResponse } from '$lib/types';
	import RealtimeEditor from '$lib/components/editor/RealtimeEditor.svelte';
	import { authState } from '$lib/firebase/firebase.svelte';
	import IDENavbar from '$lib/components/IDENavbar.svelte';
	import RunButton from '$lib/components/RunButton.svelte';
	import { submitToJudge } from '$lib/judge/judge';

	const { fileData }: { fileData: FileData } = $props();

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

	let mainEditor: RealtimeEditor | undefined = $state(undefined);
	let inputEditor: RealtimeEditor | undefined = $state(undefined);

	const judgeState: {
		isRunning: boolean;
		result: JudgeResponse | null;
	} = $state({
		isRunning: false,
		result: null
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
	};

	$inspect(judgeState);

	let isViewOnly = $derived(fileData.settings.defaultPermission === 'READ');
</script>

<Layout onResize={() => layoutEditors()}>
	{#snippet navbar()}
		<IDENavbar>
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
			bind:this={mainEditor}
		/>
	{/snippet}

	{#snippet inputPane()}
		<RealtimeEditor
			documentId={`${fileData.id}.input`}
			userId={firebaseUser.uid}
			language="plaintext"
			bind:this={inputEditor}
		/>
	{/snippet}

	{#snippet outputPane()}
		<MonacoEditor readOnly={true} value={judgeState.result?.execute?.stdout ?? ''} />
	{/snippet}
</Layout>
