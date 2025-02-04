<!--

Contains the logic for rendering the editor layout.

This should be a "dumb", self-contained component that only contains UI logic.

-->

<script lang="ts">
	import Split from 'split-grid';
	import { Code, Parentheses } from 'lucide-svelte';

	import { onMount } from 'svelte';
	let {
		navbar,
		mainPane,
		inputPane,
		outputPane,
		layout,
		theme
	}: {
		navbar: any;
		mainPane: any;
		inputPane: any;
		outputPane: any;
		layout: 'mobile' | 'desktop';
		theme: string;
	} = $props();

	let verticalGutter: HTMLElement;
	let horizontalGutter: HTMLElement;

	onMount(() => {
		let split = Split({
			columnGutters: [
				{
					track: 1,
					element: verticalGutter
				}
			],
			rowGutters: [
				{
					track: 1,
					element: horizontalGutter
				}
			]
		});

		return () => split.destroy();
	});

	let mobileActiveTab = $state<'main' | 'inputOutput'>('main');
</script>

<div class="h-full" data-theme={theme}>
	<div class="flex h-full flex-col">
		<div class="flex-shrink-0 bg-white dark:bg-[#1E1E1E]">
			{@render navbar()}
		</div>
		<div class="min-h-0 flex-1 border-t border-black">
			<div class="split-grid h-full">
				<!-- Without min-w-0, we won't be able to reize the pane to make monaco-editor smaller. -->
				<div
					class="row-span-full min-w-0"
					class:col-span-full={layout === 'mobile'}
					class:hidden={layout === 'mobile' && mobileActiveTab !== 'main'}
				>
					{@render mainPane()}
				</div>
				<div
					class="group relative z-10 row-span-full mx-[-6px] cursor-[col-resize]"
					bind:this={verticalGutter}
					class:hidden={layout === 'mobile'}
				>
					<div
						class="pointer-events-none absolute right-[6px] left-[6px] h-full bg-black transition group-hover:bg-neutral-600 group-active:bg-neutral-600"
					></div>
				</div>
				<div
					class="min-h-0 min-w-0"
					class:col-span-full={layout === 'mobile'}
					class:hidden={layout === 'mobile' && mobileActiveTab !== 'inputOutput'}
					class:mb-[6px]={layout === 'mobile'}
				>
					{@render inputPane()}
				</div>
				<div
					class="group relative z-10 my-[-6px] cursor-[row-resize]"
					bind:this={horizontalGutter}
					class:hidden={layout === 'mobile' && mobileActiveTab !== 'inputOutput'}
					class:col-span-full={layout === 'mobile'}
				>
					<div
						class={`pointer-events-none absolute w-full bg-black transition group-hover:bg-neutral-600 group-focus:bg-neutral-600 group-active:bg-neutral-600 ${
							layout === 'desktop'
								? 'top-[6px] bottom-[6px]'
								: 'inset-y-0 flex items-center justify-center bg-neutral-800'
						}`}
					>
						{#if layout === 'mobile'}
							<!-- Ellipsis horizontal icon -->
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								class="h-5 w-5 text-gray-200"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
								/>
							</svg>
						{/if}
					</div>
				</div>
				<div
					class="min-h-0 min-w-0"
					class:mt-[6px]={layout === 'mobile'}
					class:col-span-full={layout === 'mobile'}
					class:hidden={layout === 'mobile' && mobileActiveTab !== 'inputOutput'}
				>
					{@render outputPane()}
				</div>
			</div>
		</div>

		<!-- Mobile bottom bar -->
		{#if layout === 'mobile'}
			<div class="grid grid-cols-2 bg-[#1E1E1E]">
				{#each ['main', 'inputOutput'] as const as tab}
					<button
						class="flex flex-col items-center py-1 transition focus:outline-none {mobileActiveTab ===
						tab
							? 'text-gray-200'
							: 'text-gray-400'}"
						onclick={() => (mobileActiveTab = tab)}
						data-testid="mobile-bottom-nav-{tab}-button"
					>
						{#if tab === 'main'}
							<Code class="h-5 w-5" />
							<span class="text-sm">Code</span>
						{:else}
							<Parentheses class="h-5 w-5" />
							<span class="text-sm">Input/Output</span>
						{/if}
					</button>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.split-grid {
		display: grid;
		grid-template-columns: 1fr 3px 1fr;
		grid-template-rows: 1fr 3px 1fr;
	}
</style>
