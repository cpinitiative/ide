<script lang="ts" module>
	import * as monaco from 'monaco-editor';

	import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
	import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
	import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
	import jsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
	import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';

	let editors: monaco.editor.IStandaloneCodeEditor[] = [];

	/**
	 * Resizes all editors.
	 *
	 * Call this function whenever the size of the monaco editors changes,
	 * perhaps due to the window being resized or the user resizing the
	 * editor pane.
	 */
	export function layoutEditors() {
		editors.forEach((editor) => {
			editor.layout();
		});
	}

	self.MonacoEnvironment = {
		getWorker: function (workerId, label) {
			switch (label) {
				case 'json':
					return new jsonWorker();
				case 'css':
				case 'scss':
				case 'less':
					return new cssWorker();
				case 'html':
				case 'handlebars':
				case 'razor':
					return new htmlWorker();
				case 'typescript':
				case 'javascript':
					return new jsWorker();
				default:
					return new editorWorker();
			}
		}
	};
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import type { EditorProps } from './RealtimeEditor.svelte';
	import { MonacoBinding } from 'y-monaco';

	let editorElement: HTMLElement;

	let {
		theme = 'dark',
		language = 'plaintext',
		readOnly = false,
		value,

		yjsInfo
	}: EditorProps = $props();

	let editor: monaco.editor.IStandaloneCodeEditor | null = $state(null);

	onMount(() => {
		editor = monaco.editor.create(editorElement, {
			automaticLayout: false,
			minimap: { enabled: false },
			bracketPairColorization: {
				enabled: true
			},

			// TODO: check if still needed
			// this next option is to prevent annoying autocompletes
			// ex. type return space and it adds two spaces + semicolon
			// ex. type vecto< and it autocompletes weirdly
			acceptSuggestionOnCommitCharacter: false,

			language: language === 'py' ? 'python' : language
		});

		editors.push(editor);

		return () => {
			if (!editor) {
				// shouldn't happen
				return;
			}

			editor.dispose();

			let index = editors.indexOf(editor);
			if (index > -1) {
				editors.splice(index, 1);
			}
		};
	});

	$effect(() => {
		// Note: theme is global
		monaco.editor.setTheme(theme === 'dark' ? 'vs-dark' : 'light');
	});

	$effect(() => {
		if (!editor) return;
		editor.updateOptions({
			readOnly
		});
	});

	$effect(() => {
		if (!yjsInfo || !editor) return;

		const monacoBinding = new MonacoBinding(
			yjsInfo.text,
			editor.getModel()!,
			new Set([editor]),
			yjsInfo.awareness
		);

		return () => {
			monacoBinding.destroy();
		};
	});

	$effect(() => {
		if (!editor || value === undefined) return;
		editor.setValue(value);
	});

	export const getValue = () => {
		return editor?.getValue();
	};
</script>

<div bind:this={editorElement} class="h-full w-full"></div>
