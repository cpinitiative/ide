<script lang="ts">
	import { createRadioGroup, melt } from '@melt-ui/svelte';

	const {
		elements: { root, item, hiddenInput },
		helpers: { isChecked },
		states: { value }
	} = createRadioGroup({
		defaultValue: 'default'
	});

	const { options } = $props();

	export const getValue = () => {
		return value;
	};
</script>

<div use:melt={$root} class="space-x-4">
	{#each options as option}
		<div class="relative inline-flex cursor-pointer items-center focus:outline-none">
			<button
				use:melt={$item(option)}
				class={`mt-0.5 flex h-4 w-4 cursor-pointer items-center justify-center rounded-full border focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
					$isChecked(option) ? 'border-transparent bg-indigo-600' : 'border-gray-300 bg-white'
				}`}
				id={option}
				aria-labelledby="{option}-label"
			>
				<span class="h-1.5 w-1.5 rounded-full bg-white"></span>
			</button>
			<label
				class="ml-2 inline-block text-sm font-medium"
				class:text-gray-800={$isChecked(option)}
				class:text-gray-600={!$isChecked(option)}
				for={option}
				id="{option}-label"
			>
				{option}
			</label>
		</div>
	{/each}
	<!-- <input name="" use:melt={$hiddenInput} /> -->
</div>
