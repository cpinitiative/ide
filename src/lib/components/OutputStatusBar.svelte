<script lang="ts">
	import type { JudgeResponse } from '$lib/types';
	import { Verdict } from '$lib/types';

	const { result }: { result?: JudgeResponse | null } = $props();

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
	class="bg-white py-1 pr-4 text-right text-xs text-gray-800 dark:bg-[#1e1e1e] dark:text-gray-200"
	data-test-id="code-execution-output-status"
	style="font-family: -apple-system,BlinkMacSystemFont,Segoe WPC,Segoe UI,system-ui,Ubuntu,Droid Sans,sans-serif"
>
	{#if result?.execute}
		{formatVerdict(result.execute.verdict)}, {result.execute.wall_time}s, {result.execute
			.memory_usage}KB
	{:else if result?.compile}
		Compile Error
	{:else}
		&nbsp;
	{/if}
</div>
