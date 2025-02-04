<!-- TODO: rewrite this component. figure out if we're using controlled or uncontrolled -->

<script lang="ts">
	import { createRadioGroup, melt } from '@melt-ui/svelte';

	let {
		name,
		options,
		defaultValue,
		orientation = 'vertical',
		theme = 'light',
		value = $bindable(defaultValue),
		readonly = false
	}: {
		// name of hidden input
		name?: string;

		// map of value: label
		options: { [key: string]: string };

		defaultValue?: string;

		orientation?: 'vertical' | 'horizontal';
		theme?: 'dark' | 'light';
		value?: string;
		readonly?: boolean;
	} = $props();

	const {
		elements: { root, item, hiddenInput },
		helpers: { isChecked },
		states: { value: meltValue }
	} = createRadioGroup({
		defaultValue,
		onValueChange: ({ curr, next }) => {
			if (readonly) {
				return curr;
			}
			return next;
		}
	});

	$effect(() => {
		$meltValue = value;
	});

	$effect(() => {
		value = $meltValue;
	});
</script>

<div use:melt={$root} class={orientation === 'vertical' ? 'space-y-2' : 'flex space-x-4'}>
	{#each Object.entries(options) as [option, label]}
		<div class="relative flex items-center focus:outline-none">
			<button
				use:melt={$item(option)}
				class={`mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
					$isChecked(option) ? 'border-transparent bg-indigo-600' : 'border-gray-300 bg-white'
				}`}
				id={option}
				aria-labelledby="{option}-label"
			>
				<span class="h-1.5 w-1.5 rounded-full bg-white"></span>
			</button>
			<label
				class="inline-block cursor-pointer pl-2 text-sm font-medium"
				class:text-gray-800={theme === 'light' && $isChecked(option)}
				class:text-gray-600={theme === 'light' && !$isChecked(option)}
				class:text-gray-200={theme === 'dark' && !$isChecked(option)}
				class:text-gray-100={theme === 'dark' && $isChecked(option)}
				for={option}
				id="{option}-label"
			>
				{label}
			</label>
		</div>
	{/each}
	{#if name}
		<input {name} use:melt={$hiddenInput} />
	{/if}
</div>
