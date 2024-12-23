<script lang="ts" module>
	import * as monaco from 'monaco-editor';

	const editors: monaco.editor.IStandaloneCodeEditor[] = [];

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

	const registerEditor = (editor: monaco.editor.IStandaloneCodeEditor) => {
		editors.push(editor);
	};

	const unregisterEditor = (editor: monaco.editor.IStandaloneCodeEditor) => {
		let index = editors.indexOf(editor);
		if (index > -1) {
			editors.splice(index, 1);
		}
	};

	let monacoWrapper: MonacoEditorLanguageClientWrapper | null = $state.raw(null);
	let isMonacoWrapperInitialized = $state(false);
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import type { EditorProps } from '../RealtimeEditor.svelte';

	import { MonacoBinding } from 'y-monaco';
	import { MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper';
	import '@codingame/monaco-vscode-cpp-default-extension';
	import '@codingame/monaco-vscode-python-default-extension';
	import '@codingame/monaco-vscode-java-default-extension';
	import { getMonacoWrapperConfig } from './utils';

	let editorElement: HTMLElement;

	let {
		language = 'plaintext',
		readOnly = false,
		value,
		compilerOptions,

		yjsInfo
	}: EditorProps = $props();

	let editor: monaco.editor.IStandaloneCodeEditor | null = $state.raw(null);

	const computeEditorOptions = (language: Language) => {
		return {
			language,
			readOnly,
			glyphMargin: false
		};
	};

	// Logic for initializing the main monaco editor
	$effect(() => {
		if (language === 'plaintext') {
			// Not the main editor
			return;
		}
		if (!editorElement) {
			// Editor element not mounted yet
			return;
		}

		return untrack(() => {
			if (monacoWrapper) {
				console.error(
					'Monaco wrapper already initialized. There should only be one main monaco editor.'
				);
				return;
			}

			monacoWrapper = new MonacoEditorLanguageClientWrapper();
			const monacoWrapperConfig = getMonacoWrapperConfig(
				language,
				compilerOptions,
				computeEditorOptions(language)
			);
			let isAlive = true;

			monacoWrapper
				.init(monacoWrapperConfig)
				.then(() => {
					isMonacoWrapperInitialized = true;
					return monacoWrapper?.start(editorElement);
				})
				.then(() => {
					if (!isAlive) {
						// The editor has already been unmounted before the promise resolved.
						return;
					}

					let maybeNullEditor = monacoWrapper?.getEditor();
					if (!maybeNullEditor) {
						console.error('Monaco editor should not be null');
						return;
					}

					editor = maybeNullEditor;
					registerEditor(untrack(() => editor));
				});

			return () => {
				isAlive = false;

				if (!editor) {
					// shouldn't happen
					return;
				}

				monacoWrapper?.dispose();
				monacoWrapper = null;

				unregisterEditor(editor);

				// Set editor to null to avoid calling monacoBinding.destroy().
				editor = null;
			};
		});
	});

	// Logic for initializing all the other editors
	$effect(() => {
		if (language !== 'plaintext') {
			// This is the main editor, initialized above
			return;
		}

		if (!isMonacoWrapperInitialized) {
			// Main editor must be initialized before this editor
			return;
		}

		untrack(() => {
			editor = monaco.editor.create(editorElement, computeEditorOptions(language));

			editors.push(editor);
		});

		return () => {
			if (!editor) {
				// shouldn't happen
				return;
			}

			editor.dispose();

			unregisterEditor(editor);

			// Set editor to null to avoid calling monacoBinding.destroy().
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
		if (!yjsInfo || !editor) return;

		const monacoBinding = new MonacoBinding(
			yjsInfo.text,
			editor.getModel()!,
			new Set([editor]),
			yjsInfo.awareness
		);

		return () => {
			if (editor) {
				monacoBinding.destroy();
			}
			// If editor is null, that means the editor has already been disposed.
			// y-monaco will automatically call .destroy() when the editor is disposed.
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
