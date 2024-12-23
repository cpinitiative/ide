<script lang="ts">
	const {
		connectionStatus
	}: {
		connectionStatus: 'disconnected' | 'connecting' | 'saving' | 'saved';
	} = $props();
</script>

<div
	class="absolute top-[0.25rem] right-[1.25rem] z-10 flex items-center rounded-md bg-black px-2 py-1.5 opacity-80 transition hover:opacity-0"
>
	<span
		class="mr-1 inline-block h-1.5 w-1.5 rounded-full"
		class:bg-red-500={connectionStatus === 'disconnected'}
		class:bg-yellow-500={connectionStatus === 'saving' || connectionStatus === 'connecting'}
		class:bg-green-500={connectionStatus === 'saved'}
	></span>
	<span class="text-xs">
		{#if connectionStatus === 'disconnected'}
			Disconnected
		{:else if connectionStatus === 'connecting'}
			Connecting...
		{:else if connectionStatus === 'saving'}
			Saving...
		{:else if connectionStatus === 'saved'}
			Saved
		{/if}
	</span>
</div>
