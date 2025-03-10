<script lang="ts">
	import { isExecuteResponse, Verdict, type FileData, type JudgeTestCaseResponse } from '$lib/types';
	import USACOJudgeInterface from '$lib/components/USACOJudgeInterface.svelte';
	import { SSE } from 'sse.js';
	import RealtimeEditor from '$lib/components/editor/RealtimeEditor.svelte';
	import type { JudgeState } from './IDE.svelte';

	let {
		fileData,
		mainEditor,
		// TODO: rethink whether it's a good idea to bind the entire judge state here.
		judgeState = $bindable()
	}: { fileData: FileData; mainEditor?: RealtimeEditor; judgeState: JudgeState } = $props();

	let problem = $derived(fileData.settings.problem!);
	let errorMessage = $state<string | null>(null);

	function onSubmit() {
		if (!mainEditor) {
			console.warn('No main editor found');
			return;
		}

		errorMessage = null;
		judgeState.isRunning = true;
		judgeState.compileResult = null;
		judgeState.executeResult = null;
		let source = new SSE('https://thecodingwizard--usaco-judge-fastapi-app.modal.run/judge', {
			headers: {
				'Content-Type': 'application/json'
			},
			payload: JSON.stringify({
				problem_id: problem.id,
				source_code: mainEditor.getValue(),
				compiler_options: fileData.settings.compilerOptions[fileData.settings.language],
				// TODO: de-duplicate this with `judge.ts`.
				language: fileData.settings.language === 'java' ? 'java21' : fileData.settings.language === 'py' ? 'py12' : 'cpp'
			})
		});
		source.onreadystatechange = (state) => {
			if (state.readyState === source.CLOSED) {
				judgeState.isRunning = false;
			}
		};
		source.onerror = (e: any) => {
			console.error(e);
			if (e.responseCode) {
				errorMessage = `Status code ${e.responseCode}: ${e.data}`;
			} else {
				errorMessage = `Internal error: ${e.data}`;
			}
		};
		source.addEventListener('compile', (e: any) => {
			const data = JSON.parse(e.data);
			// TODO: figure out how to auto-select compile output tab
			judgeState.compileResult = data;
		});
		source.addEventListener('execute', (e: any) => {
			const data = JSON.parse(e.data) as JudgeTestCaseResponse;

			if (!judgeState.executeResult || isExecuteResponse(judgeState.executeResult)) {
				judgeState.executeResult = {
					test_cases: [],
					verdict: undefined
				};
			}

			while (judgeState.executeResult.test_cases.length < data.total_test_cases) {
				judgeState.executeResult.test_cases.push(null);
			}
			judgeState.executeResult.test_cases[data.test_case] = data;
		});
	}

	function onRunSamples() {
		console.log('run samples');
	}
</script>

<!-- isLoading={(statusData?.statusCode ?? 0) <= -8}
		isDisabled={!problem.submittable || true} -->

<USACOJudgeInterface
	{problem}
	results={judgeState.executeResult && !isExecuteResponse(judgeState.executeResult) ? judgeState.executeResult.test_cases : undefined}
	isLoading={judgeState.isRunning}
	isDisabled={false}
	{onSubmit}
	{onRunSamples}
	{errorMessage}
/>
