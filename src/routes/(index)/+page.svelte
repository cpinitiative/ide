<script>
	import datadog_logo from '$lib/assets/datadog-logo.svg';
	import Dashboard from './components/Dashboard.svelte';
	import { authState } from '$lib/firebase/firebase.svelte';
</script>

<svelte:head>
	<title>Real-Time Collaborative Online IDE</title>
	<meta
		name="description"
		content="An online IDE designed for competitive programming, with code execution, intellisense, mobile support, realtime collaborative editing, and built-in USACO submissions."
	/>
</svelte:head>

<div class="flex min-h-full flex-col">
	<div class="flex-1">
		<div class="mx-auto max-w-6xl p-4 sm:p-6 md:p-8 lg:p-12">
			<h1 class="text-2xl font-black text-gray-100 md:text-4xl">
				Real-Time Collaborative Online IDE
			</h1>

			<div class="h-6"></div>

			{#if authState.isLoading}
				<div class="text-gray-400">Loading...</div>
			{:else}
				<Dashboard />
			{/if}
		</div>
	</div>
	<div class="border-t border-gray-700">
		<div class="mx-auto max-w-6xl space-y-8 p-4 text-gray-400 sm:p-6 md:p-8 lg:p-12">
			<div>
				Looking to get better at USACO? Check out the
				<a href="https://usaco.guide/" rel="noreferrer" class="underline hover:text-white">
					USACO Guide
				</a>!<br />
				Not for commercial use.
			</div>
			<div>
				<img alt="Datadog Logo" src={datadog_logo} width={150} height={250} class="ml-[2px]" />
				<p class="mt-2 text-gray-400">
					Infrastructure monitoring powered by Datadog. View our
					<a
						href="https://p.datadoghq.com/sb/fbf273aa-1551-11ef-87da-da7ad0900002-1c22ffc7d27083c1529726831826065e"
						rel="noreferrer"
						class="underline hover:text-white"
					>
						Dashboard
					</a>
					or learn more about
					<a
						href="https://github.com/cpinitiative/ide/blob/master/Datadog.md"
						rel="noreferrer"
						class="underline hover:text-white"
					>
						how we use Datadog
					</a>!
				</p>
			</div>
		</div>
	</div>
</div>
