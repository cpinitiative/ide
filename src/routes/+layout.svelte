<script lang="ts">
	import { onMount } from 'svelte';
	import { initFirebaseAuth } from '$lib/firebase/firebase.svelte';
	import '../app.css';

	let { children } = $props();

	onMount(() => {
		return initFirebaseAuth();
	});
</script>

{@render children()}
