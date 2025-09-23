<script lang="ts">
	import { isExecuteResponse, Verdict } from '$lib/types';
	import type { ExecuteResponse, USACOJudgeSubmissionResult } from '$lib/types';
	import type { JudgeState } from '../../routes/[id]/IDE.svelte';

	const {
		judgeState,
		theme = 'dark'
	}: { judgeState: JudgeState | null; theme?: 'light' | 'dark' | 'huacat-pink' } = $props();

	function formatVerdict(verdict: Verdict) {
		if (verdict === Verdict.Accepted) {
			return 'Successful';
		} else if (verdict === Verdict.WrongAnswer) {
			return 'Wrong Answer';
		} else if (verdict === Verdict.TimeLimitExceeded) {
			return 'Time Limit Exceeded';
		} else if (verdict === Verdict.RuntimeError) {
			return 'Runtime Error';
		} else {
			return verdict;
		}
	}
</script>

<!-- Font family is copied from vscode to match the status bar font. -->
<div
	class="py-1 pr-4 text-right text-xs"
	class:bg-white={theme === 'light'}
	class:text-gray-800={theme === 'light' || theme === 'huacat-pink'}
	class:bg-[#1e1e1e]={theme === 'dark'}
	class:text-gray-200={theme === 'dark'}
	class:bg-[#F5EAF5]={theme === 'huacat-pink'}
	data-test-id="code-execution-output-status"
	style="font-family: -apple-system,BlinkMacSystemFont,Segoe WPC,Segoe UI,system-ui,Ubuntu,Droid Sans,sans-serif"
>
	{#if judgeState?.executeResult}
		{#if isExecuteResponse(judgeState.executeResult)}
			{formatVerdict(judgeState.executeResult.verdict)}, {judgeState.executeResult.wall_time}s, {judgeState.executeResult
			.memory_usage}KB
		{:else if judgeState.executeResult.verdict}
			{formatVerdict(judgeState.executeResult.verdict)}
		{/if}
	{:else if judgeState?.compileResult?.exit_code && judgeState.compileResult.exit_code > 0}
		Compile Error
	{:else}
		&nbsp;
	{/if}
</div>
