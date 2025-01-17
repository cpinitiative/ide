<script lang="ts">
	const { label, name, ...props } = $props();
</script>

<div>
	<label for={name} class="block font-medium text-gray-700">
		{label}
	</label>
	<div class="mt-1">
		<input
			type="text"
			{name}
			id={name}
			class="mt-0 block w-full border-0 border-b-2 border-gray-200 px-0 pt-0 pb-1 text-sm text-black focus:border-black focus:ring-0"
			{...props}
		/>
	</div>
</div>
