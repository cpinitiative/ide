<script lang="ts">
	import type { FileData } from '$lib/types';
	import { onValue, ref } from 'firebase/database';
  import IDE from './IDE.svelte';
	import { authState, database } from '$lib/firebase/firebase.svelte';

	let props = $props();
	let fileId = props.data.fileId;

  let isLoading = $state(true);
  let fileData: FileData | null = $state(null);

	$effect(() => {
    isLoading = true;
    fileData = null;

    if (!authState.firebaseUser) {
      // auth is loading
      return;
    }

    const fileDataRef = ref(database, `files/${fileId}`);
    const unsubscribe = onValue(fileDataRef, (snapshot) => {
      if (!snapshot.exists()) {
        fileData = null;
      } else {
        fileData = {
          id: snapshot.key,
          ...snapshot.val()
        };
      }
      isLoading = false;
    });

    return unsubscribe;
	});
</script>

<svelte:head>
  <meta name="robots" content="noindex,nofollow" />
</svelte:head>

{#if isLoading}
  <div>Loading...</div>
{:else if !fileData}
  <div>File not found.</div>
{:else}
  <IDE fileData={fileData} />
{/if}