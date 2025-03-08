<script lang="ts">
	import type { JudgeTestCaseResponse, ProblemData } from '$lib/types';
	import { PlayIcon } from 'lucide-svelte';
	import LoadingIndicator from './LoadingIndicator.svelte';

	let {
		problem,
		results,
		isLoading,
		isDisabled,
		onSubmit,
		onRunSamples,
		errorMessage
	}: {
		problem: ProblemData;
		results?: (JudgeTestCaseResponse | null)[];
		isLoading: boolean;
		isDisabled: boolean;
		onSubmit: () => void;
		onRunSamples: () => void;
		errorMessage: string | null;
	} = $props();

	// https://github.com/cpinitiative/usaco-guide/blob/30f7eca4b8eee693694a801498aaf1bfd9cbb5d0/src/components/markdown/ProblemsList/ProblemsListItem.tsx#L92
	function getUSACOContestURL(contest: string): string {
		const parts = contest.split(' ');
		parts[0] = parts[0].substring(2);
		if (parts[1] === 'US') parts[1] = 'open';
		else parts[1] = parts[1].toLowerCase().substring(0, 3);
		return `http://www.usaco.org/index.php?page=${parts[1]}${parts[0]}results`;
	}

	const submitButtonLoadingClasses =
		'cursor-not-allowed bg-indigo-900 bg-opacity-50 text-indigo-200 opacity-50';
	const submitButtonNormalClasses =
		'text-indigo-200 hover:text-indigo-100 hover:bg-indigo-800 hover:bg-opacity-50 bg-indigo-900 bg-opacity-50';
</script>

<div class="relative flex h-full flex-col">
	<div class="flex-1 overflow-y-auto">
		<div class="p-4">
			<p class="text-lg font-bold text-gray-100">
				<a
					href={getUSACOContestURL(problem.source || '')}
					class="text-indigo-300"
					target="_blank"
					rel="noreferrer"
				>
					{problem.source}
				</a>
			</p>
			<p class="text-lg font-bold text-gray-100">
				<a href={problem.url} class="text-indigo-300" target="_blank" rel="noreferrer">
					{problem.title}
				</a>
			</p>
			<p class="text-sm text-gray-100">
				<span class="font-bold">I/O:</span>
				{problem.input}/{problem.output}
				{#if problem.input.includes('.in')}
					(&quot;Run Samples&quot; supports both file I/O and stdin/stdout)
				{/if}
			</p>
			<p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
				The Online Judge is in early beta. Not all problems are supported. Timing and correctness
				information may not be perfectly accurate. Large inputs / outputs may incorrectly result in
				WA. Report issues <a
					href="https://github.com/cpinitiative/online-judge-modal/issues"
					class="underline"
					target="_blank"
					rel="noreferrer">here</a
				>.
			</p>
			<!-- {#if problem.samples.length > 0}
				<button
					type="button"
					class="relative inline-flex w-40 flex-shrink-0 items-center bg-indigo-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-800 focus:bg-indigo-800 focus:outline-none"
					onclick={onRunSamples}
				>
					<PlayIcon class="mr-2 h-5 w-5" aria-hidden="true" />
					<span class="flex-1 text-center">Run Samples</span>
				</button>
			{/if} -->
		</div>
		{#if errorMessage}
			<p class="px-4 text-red-500">Error: {errorMessage}</p>
		{/if}
		{#if results}
			<div class="flex flex-wrap justify-center px-4 text-center">
				{#each results as result, index}
					{@render TestCase(result)}
				{/each}
			</div>
		{/if}
	</div>
	<button
		class={`block w-full py-2 text-sm font-bold uppercase transition focus:outline-none ${isLoading || isDisabled ? submitButtonLoadingClasses : submitButtonNormalClasses}`}
		disabled={isLoading || isDisabled}
		onclick={onSubmit}
	>
		{#if isLoading}
			<LoadingIndicator class="mr-1.5 h-5 w-5 p-0.5" />
			Loading...
		{:else if isDisabled}
			Cannot Submit
		{:else}
			Submit
		{/if}
	</button>
</div>

{#snippet TestCase(data: JudgeTestCaseResponse | null)}
	{@const containerClasses =
		data?.verdict === 'accepted'
			? 'bg-green-700/50 border-green-700'
			: data?.verdict === 'time_limit_exceeded'
				? 'bg-yellow-700/50 border-yellow-700'
				: data
					? 'bg-red-700/50 border-red-700'
					: 'bg-gray-700/50 border-gray-700'}
	{@const textColor = data?.verdict === 'accepted' ? 'text-green-100' : 'text-red-100'}
	<div class={`m-1 inline-block h-[60px] w-[70px] border ${containerClasses} relative`}>
		<div
			class={`flex items-center justify-center text-[2rem] font-bold ${textColor} font-[Arial] leading-6`}
		>
			{#if data?.verdict === 'accepted'}
				<!-- TODO: figure out a better way to style this -->
				<span class="text-[2.5rem] leading-11">*</span>
			{:else if data?.verdict === 'wrong_answer'}
				x
			{:else if data?.verdict === 'time_limit_exceeded'}
				t
			{:else if data?.verdict === 'runtime_error'}
				!
			{/if}
		</div>
		{#if data}
			<span class={`absolute bottom-0 left-[4px] ${textColor} text-[0.8125rem] font-bold`}>
				{data.test_case + 1}
			</span>
			<span
				class={`absolute right-0 bottom-0 text-right ${textColor} p-[2px] text-[0.625rem] leading-3`}
			>
				{data.memory_usage}kb
				<br />
				{data.wall_time}s
			</span>
		{/if}
	</div>
{/snippet}
