<script>
	import datadog_logo from '$lib/assets/datadog-logo.svg';
	import Dashboard from './components/Dashboard.svelte';
	import { authState, getUserData } from '$lib/firebase/firebase.svelte';

	const userData = getUserData();
</script>

<svelte:head>
	<title>Real-Time Collaborative Online IDE</title>
	<meta
		name="description"
		content="An online IDE designed for competitive programming, with code execution, intellisense, mobile support, realtime collaborative editing, and built-in USACO submissions."
	/>
</svelte:head>

<div class="flex min-h-full flex-col bg-white dark:bg-[var(--color-monaco-editor-bg)] huacat-pink:bg-[#F5EAF5]" data-theme={userData.theme}>
	<div class="flex-1">
		<div class="mx-auto max-w-6xl p-4 sm:p-6 md:p-8 lg:p-12">
			<h1 class="text-2xl font-black text-black md:text-4xl dark:text-gray-100 huacat-pink:text-black">
				Real-Time Collaborative Online IDE
			</h1>

			<div class="h-6"></div>

			{#if !authState.firebaseUser}
				<div class="text-gray-400 huacat-pink:text-gray-600">Loading...</div>
			{:else}
				<Dashboard />
			{/if}
		</div>
	</div>
	<div class="border-t border-gray-300 dark:border-gray-700 huacat-pink:border-[#D5C5D5]">
		<div
			class="mx-auto max-w-6xl space-y-8 p-4 text-gray-600 sm:p-6 md:p-8 lg:p-12 dark:text-gray-400 huacat-pink:text-gray-600"
		>
			<div>
				Looking to get better at USACO? Check out the
				<a href="https://usaco.guide/" rel="noreferrer" class="underline hover:text-black dark:hover:text-white huacat-pink:hover:text-black">
					USACO Guide
				</a>!<br />
				Not for commercial use.
			</div>
			<div>
				<img alt="Datadog Logo" src={datadog_logo} width={150} height={250} class="ml-[2px] hidden dark:block" />
				<p class="mt-2 text-gray-500 dark:text-gray-400 huacat-pink:text-gray-600">
					Infrastructure monitoring powered by Datadog. View our
					<a
						href="https://p.datadoghq.com/sb/fbf273aa-1551-11ef-87da-da7ad0900002-1c22ffc7d27083c1529726831826065e"
						rel="noreferrer"
						class="underline hover:text-black dark:hover:text-white huacat-pink:hover:text-black"
					>
						Dashboard
					</a>
					or learn more about
					<a
						href="https://github.com/cpinitiative/ide/blob/master/Datadog.md"
						rel="noreferrer"
						class="underline hover:text-black dark:hover:text-white huacat-pink:hover:text-black"
					>
						how we use Datadog
					</a>!
				</p>
			</div>
		</div>
	</div>
</div>
