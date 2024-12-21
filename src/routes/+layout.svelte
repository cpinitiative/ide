<script lang="ts">
	import Firebase from '$lib/firebase/firebase.svelte';
	import '../app.css';

	let { children } = $props();
</script>

<Firebase>
	{@render children()}
</Firebase>
