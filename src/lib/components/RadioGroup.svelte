<!-- TODO: rewrite this component. figure out if we're using controlled or uncontrolled -->

<script lang="ts">
	import { createRadioGroup, melt } from '@melt-ui/svelte';

	let {
		name,
		options,
		defaultValue,
		orientation = 'vertical',
		value = $bindable(defaultValue),
		readonly = false,
		onchange = (val: string) => {}
	}: {
		// name of hidden input
		name?: string;

		// map of value: label
		options: { [key: string]: string };

		defaultValue?: string;

		orientation?: 'vertical' | 'horizontal';
		value?: string;
		readonly?: boolean;
		onchange?: (val: string) => void;
	} = $props();

	const {
		elements: { root, item, hiddenInput },
		helpers: { isChecked },
		states: { value: meltValue }
	} = createRadioGroup({
		defaultValue,
		onValueChange: ({ curr, next }) => {
			if (readonly) return curr;
			onchange(next);
			return next;
		}
	});

	$effect(() => {
		$meltValue = value;
	});

	$effect(() => {
		value = $meltValue;
	});

	// Use semantic CSS variables for consistent theming
	const uncheckedRadioClasses = 'border-[var(--color-bg-border-primary)] bg-[var(--color-bg-primary)]';
</script>

<div use:melt={$root} class={orientation === 'vertical' ? 'space-y-2' : 'flex space-x-4'}>
	{#each Object.entries(options) as [option, label]}
		<div class="relative flex items-center focus:outline-none">
			<button
				use:melt={$item(option)}
				class={`mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg-primary)] ${
					$isChecked(option) ? 'border-transparent bg-[var(--color-primary)]' : uncheckedRadioClasses
				}`}
				id={option}
				aria-labelledby="{option}-label"
			>
				<span class="h-1.5 w-1.5 rounded-full bg-white"></span>
			</button>
			<label
				class="inline-block cursor-pointer pl-2 text-sm font-medium text-[var(--color-text-primary)]"
				class:opacity-80={!$isChecked(option)}
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
