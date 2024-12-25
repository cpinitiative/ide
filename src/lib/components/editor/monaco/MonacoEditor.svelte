<script lang="ts" module>
	/**
	 * Note: the following error happens when the vim extension is enabled, but is harmless:
	 *
	 * Uncaught (in promise) Canceled: Canceled
	 *  at Delayer.cancel (http://localhost:5173/node_modules/.vite/deps/chunk-3CMF7VWC.js?v=3695a236:10595:67)
	 *  at _a91.restore (http://localhost:5173/node_modules/.vite/deps/chunk-EWQLM5G2.js?v=3695a236:69739:21)
	 *  at _a92.restoreViewState (http://localhost:5173/node_modules/.vite/deps/chunk-EWQLM5G2.js?v=3695a236:70150:29)
	 *  at TriggerWordHighlightAction.run (http://localhost:5173/node_modules/.vite/deps/chunk-EWQLM5G2.js?v=3695a236:70239:16)
	 *  at TriggerWordHighlightAction.runEditorCommand (http://localhost:5173/node_modules/.vite/deps/chunk-MZCGY3Q3.js?v=3695a236:1128:17)
	 *  at http://localhost:5173/node_modules/.vite/deps/chunk-MZCGY3Q3.js?v=3695a236:1090:114
	 *  at http://localhost:5173/node_modules/.vite/deps/chunk-MZCGY3Q3.js?v=3695a236:1086:14
	 *  at _InstantiationService.invokeFunction (http://localhost:5173/node_modules/.vite/deps/chunk-U5WQF2O2.js?v=3695a236:61297:14)
	 *  at ConfiguredStandaloneEditor.invokeWithinContext (http://localhost:5173/node_modules/.vite/deps/chunk-H4KSBLRV.js?v=3695a236:30155:39)
	 *  at _EditorCommand.runEditorCommand (http://localhost:5173/node_modules/.vite/deps/chunk-MZCGY3Q3.js?v=3695a236:1081:19)
	 *
	 * The promise that's cancelled is a debounced task. For some reason there is no `.catch()` handler
	 * attached to the promise, so when the promise is cancelled, it logs an error.
	 */

	import * as monaco from 'monaco-editor';

	let monacoWrapper: MonacoEditorLanguageClientWrapper | null = $state.raw(null);
	let isMonacoWrapperInitialized = $state(false);

	let isVimLoaded = false;
</script>

<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import type { EditorProps } from '../RealtimeEditor.svelte';

	import { MonacoBinding } from 'y-monaco';
	import { MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper';
	import { Parts, attachPart } from '@codingame/monaco-vscode-views-service-override';

	import '@codingame/monaco-vscode-cpp-default-extension';
	import '@codingame/monaco-vscode-python-default-extension';
	import '@codingame/monaco-vscode-java-default-extension';

	import { getMonacoWrapperConfig } from './utils';
	import type { Language } from '$lib/types';

	let editorElement: HTMLElement;
	let statusbarElement: HTMLElement;

	let {
		language = 'plaintext',
		readOnly = false,
		value,
		compilerOptions,
		editorMode,

		yjsInfo
	}: EditorProps = $props();

	let editor: monaco.editor.IStandaloneCodeEditor | null = $state.raw(null);
	let yjsMonacoBinding: MonacoBinding | null = null;

	const computeEditorOptions = (language: Language | 'plaintext') => {
		return {
			language,
			readOnly,
			glyphMargin: false,
			automaticLayout: true
		};
	};

	const isMainEditor = () => {
		return language !== 'plaintext';
	};

	// Logic for initializing the main monaco editor
	$effect(() => {
		if (!isMainEditor()) {
			return;
		}

		return untrack(() => {
			if (monacoWrapper) {
				console.error(
					'Monaco wrapper already initialized. There should only be one main monaco editor.'
				);
				return;
			}
			if (!editorElement) {
				console.error('Editor element not mounted yet');
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
					if (!isAlive) {
						// The editor has already been unmounted before the promise resolved.
						return;
					}

					isMonacoWrapperInitialized = true;

					return monacoWrapper?.start(editorElement);
				})
				.then(() => {
					if (!isAlive) {
						// The editor has already been unmounted before the promise resolved.
						return;
					}

					attachPart(Parts.STATUSBAR_PART, statusbarElement);

					let maybeNullEditor = monacoWrapper?.getEditor();
					if (!maybeNullEditor) {
						console.error('Monaco editor should not be null');
						return;
					}

					editor = maybeNullEditor;
				});

			return () => {
				isAlive = false;

				if (!editor) {
					// shouldn't happen
					return;
				}

				yjsMonacoBinding?.destroy();
				// this also disposes the editor
				monacoWrapper?.dispose();
				yjsMonacoBinding = null;
				monacoWrapper = null;
				editor = null;
			};
		});
	});

	// Logic for initializing all the other editors
	$effect(() => {
		if (isMainEditor()) {
			// The main editor is initialized above
			return;
		}

		if (!isMonacoWrapperInitialized) {
			// Main editor must be initialized before this editor
			return;
		}

		untrack(() => {
			editor = monaco.editor.create(editorElement, computeEditorOptions(language));
		});

		return () => {
			if (!editor) {
				// shouldn't happen
				return;
			}

			yjsMonacoBinding?.destroy();
			editor.dispose();

			yjsMonacoBinding = null;
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
		// For monaco, vim mode has the following restrictions:
		// - We cannot unload the extension once it is loaded.
		// - It is either enabled for all editors or disabled for all editors.

		// Vim is a global setting, so only configure it for the main editor
		if (!isMainEditor()) return;

		// Still loading the editor mode from Firebase
		if (editorMode === undefined) return;

		if (editorMode === 'vim' && !isVimLoaded) {
			isVimLoaded = true;
			import('./vim-1.29.0.vsix').then(() => {
				console.log('vim-1.29.0.vsix loaded');
			});
		} else if (editorMode !== 'vim' && isVimLoaded) {
			// Vim cannot be disabled once it is loaded.
			alert('Please reload the page to disable vim.');
		}
	});

	$effect(() => {
		if (!yjsInfo || !editor) return;

		yjsMonacoBinding = new MonacoBinding(
			yjsInfo.text,
			editor.getModel()!,
			new Set([editor]),
			yjsInfo.awareness
		);

		return () => {
			// If yjsMonacoBinding is null, it has already been destroyed.
			yjsMonacoBinding?.destroy();
			yjsMonacoBinding = null;
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

<div class="flex h-full min-h-0 flex-col">
	<div bind:this={editorElement} class="min-h-0 w-full flex-1"></div>
	<div bind:this={statusbarElement} class="w-full"></div>
</div>
