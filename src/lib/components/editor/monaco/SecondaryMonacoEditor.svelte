<script lang="ts" module>
	import * as monaco from 'monaco-editor';
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import type { YjsInfo } from '../RealtimeEditor.svelte';

	import { MonacoBinding } from 'y-monaco';

	import '@codingame/monaco-vscode-cpp-default-extension';
	import '@codingame/monaco-vscode-python-default-extension';
	import '@codingame/monaco-vscode-java-default-extension';

	import { baseEditorOptions } from './utils';
	import type { Language } from '$lib/types';
	import { mainMonacoState } from './MainMonacoEditor.svelte';

	let editorElement: HTMLElement;

	let {
		language = 'plaintext',
		readOnly = false,
		value,

		yjsInfo
	}: {
		language?: Language | 'plaintext';
		readOnly?: boolean;
		value?: string;
		yjsInfo?: YjsInfo;
	} = $props();

	let editor: monaco.editor.IStandaloneCodeEditor | null = $state.raw(null);

	$effect(() => {
		if (!mainMonacoState.isMonacoInitialized) {
			// Main editor must be initialized before secondary editors
			return;
		}

		editor = monaco.editor.create(
			// the editor element changes when the main editor is initialized
			// we want to ignore this change
			untrack(() => editorElement),
			{
				...baseEditorOptions,
				language
			}
		);

		let yjsMonacoBinding: MonacoBinding | null = null;
		if (yjsInfo) {
			// we set editor above, so we need to untrack it here.
			// no other effect other than this one should mutate editor.
			let tmpEditor = untrack(() => editor!);
			yjsMonacoBinding = new MonacoBinding(
				yjsInfo.text,
				tmpEditor.getModel()!,
				new Set([tmpEditor]),
				yjsInfo.awareness
			);
		}

		return () => {
			if (!editor) {
				throw new Error('Editor should be initialized before disposing');
			}

			yjsMonacoBinding?.destroy();
			editor.dispose();
			editor = null;
		};
	});

	$effect(() => {
		if (!editor) return;
		editor.updateOptions({
			readOnly
		});
	});

	$effect(() => {
		if (!editor || value === undefined) return;
		editor.setValue(value);
	});

	export const getValue = () => {
		return editor?.getValue();
	};
</script>

<div bind:this={editorElement} class="h-full min-h-0 w-full"></div>
