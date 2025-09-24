<script lang="ts">
	let { label, name, value = $bindable(), ...props } = $props();
</script>

<div>
	<label for={name} class="block font-medium text-[var(--color-text-primary)]">
		{label}
	</label>
	<div class="mt-1">
		<input
			type="text"
			{name}
			id={name}
			class="mt-0 block w-full border-0 border-b-2 bg-transparent px-0 pt-0 pb-1 text-sm text-[var(--color-text-primary)] border-[var(--color-bg-border-primary)] focus:border-[var(--color-primary)] focus:ring-0"
			bind:value
			{...props}
		/>
	</div>
</div>
