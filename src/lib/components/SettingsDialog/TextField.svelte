<script lang="ts">
	let { label, name, value = $bindable(), theme = 'dark', ...props } = $props();
</script>

<div>
	<label for={name} class="block font-medium text-gray-700 dark:text-gray-300">
		{label}
	</label>
	<div class="mt-1">
		<input
			type="text"
			{name}
			id={name}
			class="mt-0 block w-full border-0 border-b-2 bg-transparent px-0 pt-0 pb-1 text-sm focus:ring-0"
			class:border-gray-200={theme === 'light'}
			class:text-black={theme === 'light' || theme === 'huacat-pink'}
			class:focus:border-black={theme === 'light'}
			class:border-gray-700={theme === 'dark'}
			class:text-white={theme === 'dark'}
			class:focus:border-white={theme === 'dark'}
			class:border-[#D5C5D5]={theme === 'huacat-pink'}
			class:focus:border-[#B5A5B5]={theme === 'huacat-pink'}
			bind:value
			{...props}
		/>
	</div>
</div>
