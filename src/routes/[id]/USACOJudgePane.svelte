<script lang="ts">
	import type { ProblemData } from '$lib/types';

	let props = $props();
	let problem = props.problem;

	// https://github.com/cpinitiative/usaco-guide/blob/30f7eca4b8eee693694a801498aaf1bfd9cbb5d0/src/components/markdown/ProblemsList/ProblemsListItem.tsx#L92
	function getUSACOContestURL(contest: string): string {
		const parts = contest.split(' ');
		parts[0] = parts[0].substring(2);
		if (parts[1] === 'US') parts[1] = 'open';
		else parts[1] = parts[1].toLowerCase().substring(0, 3);
		return `http://www.usaco.org/index.php?page=${parts[1]}${parts[0]}results`;
	}

	$inspect(problem);
</script>

<div class="relative flex h-full flex-col">
	<div class="flex-1 overflow-y-auto">
		<div class="p-4 pb-0">
			<p class="mb-4 text-sm text-gray-400">
				Note: USACO problem submission{' '}
				<a href="https://github.com/cpinitiative/ide/issues/138" class="underline"> is broken </a>
				. Unfortunately, we don&apos;t know when this will be fixed.
			</p>
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
		</div>
	</div>
</div>
