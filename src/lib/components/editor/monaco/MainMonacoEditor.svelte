<!--
We use codingame's monaco editor since it has more advanced functionality
(such as support for the full-featured vim extension and LSPs).

It has some quirks though:
- There can only be one "main" monaco editor, which has LSP support.
- Once the vim extension is loaded, it cannot be unloaded.
- Some settings, such as vim and theme, are global.
- "Secondary" editors, which don't have LSP support, can only be initialized after the main editor is initialized.
- The init and dispose functions are async, which doesn't play nicely with Svelte's synchronous $effect() hooks.
- The entire editor needs to be disposed and recreated when the language changes.

---

Note: the following error happens when the vim extension is enabled, but is harmless:

Uncaught (in promise) Canceled: Canceled
 at Delayer.cancel (http://localhost:5173/node_modules/.vite/deps/chunk-3CMF7VWC.js?v=3695a236:10595:67)
 at _a91.restore (http://localhost:5173/node_modules/.vite/deps/chunk-EWQLM5G2.js?v=3695a236:69739:21)
 at _a92.restoreViewState (http://localhost:5173/node_modules/.vite/deps/chunk-EWQLM5G2.js?v=3695a236:70150:29)
 at TriggerWordHighlightAction.run (http://localhost:5173/node_modules/.vite/deps/chunk-EWQLM5G2.js?v=3695a236:70239:16)
 at TriggerWordHighlightAction.runEditorCommand (http://localhost:5173/node_modules/.vite/deps/chunk-MZCGY3Q3.js?v=3695a236:1128:17)
 at http://localhost:5173/node_modules/.vite/deps/chunk-MZCGY3Q3.js?v=3695a236:1090:114
 at http://localhost:5173/node_modules/.vite/deps/chunk-MZCGY3Q3.js?v=3695a236:1086:14
 at _InstantiationService.invokeFunction (http://localhost:5173/node_modules/.vite/deps/chunk-U5WQF2O2.js?v=3695a236:61297:14)
 at ConfiguredStandaloneEditor.invokeWithinContext (http://localhost:5173/node_modules/.vite/deps/chunk-H4KSBLRV.js?v=3695a236:30155:39)
 at _EditorCommand.runEditorCommand (http://localhost:5173/node_modules/.vite/deps/chunk-MZCGY3Q3.js?v=3695a236:1081:19)

The promise that's cancelled is a debounced task. For some reason there is no `.catch()` handler
attached to the promise, so when the promise is cancelled, it logs an error.
-->

<script lang="ts" module>
	import * as monaco from 'monaco-editor';
	import * as vscode from 'vscode';

	// PRIVATE: do not access this outside this <script module> block!
	// We must keep _monacoWrapper.isStarting() and _monacoWrapper.isStopping() in sync with mainMonacoState.
	let _monacoWrapper: MonacoEditorLanguageClientWrapper | null = null;
	export let mainMonacoState = $state({
		// Codingame's monaco implementation patches parts of the global monaco editor.
		// If this is false, this patching hasn't been completed yet, and no secondary monaco editors can be created.
		// If this is true, the patching is complete, and secondary monaco editors can be created.
		isMonacoInitialized: false
	});

	const createMainMonacoWrapper = async (
		language: Language,
		compilerOptions: string,
		theme: 'light' | 'dark',
		readOnly: boolean,
		editorElement: HTMLElement,
		statusbarElement: HTMLElement,
		inlayHints: 'on' | 'off'
	) => {
		if (_monacoWrapper) {
			throw new Error('Monaco wrapper already initialized.');
		}
		_monacoWrapper = new MonacoEditorLanguageClientWrapper();

		const monacoWrapperConfig = getMonacoWrapperConfig(language, theme, compilerOptions, {
			...baseEditorOptions,
			language,
			readOnly,
			inlayHints: { enabled: inlayHints }
		});

		await _monacoWrapper.init(monacoWrapperConfig);
		mainMonacoState.isMonacoInitialized = true;

		// @ts-expect-error TS1209: It seems to work...
		attachPart(Parts.STATUSBAR_PART, statusbarElement);

		await _monacoWrapper.start(editorElement);

		let maybeUndefinedEditor = _monacoWrapper.getEditor();
		if (!maybeUndefinedEditor) {
			throw new Error('Monaco editor should not be undefined');
		}
		return maybeUndefinedEditor;
	};

	/**
	 * Dispose the main monaco wrapper. Can be called multiple times.
	 */
	const disposeMainMonacoWrapper = async () => {
		if (!_monacoWrapper || _monacoWrapper.isStopping() || !_monacoWrapper.isStarted()) {
			// nothing to do
			return;
		}
		if (_monacoWrapper.isStarting()) {
			throw new Error(
				'Monaco wrapper is starting. Please ensure only one operation happens at a time.'
			);
		}

		await _monacoWrapper.dispose();
		_monacoWrapper = null;
	};

	let isVimLoaded = false;
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import type { EditorProps } from '../RealtimeEditor.svelte';

	import { MonacoBinding } from 'y-monaco';
	import { MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper';
	// @ts-expect-error TS1209
	import { Parts, attachPart } from '@codingame/monaco-vscode-views-service-override';

	import '@codingame/monaco-vscode-cpp-default-extension';
	import '@codingame/monaco-vscode-python-default-extension';
	import '@codingame/monaco-vscode-java-default-extension';

	import { baseEditorOptions, getMonacoWrapperConfig } from './utils';
	import type { Language } from '$lib/types';

	let editorElement: HTMLElement;
	let statusbarElement: HTMLElement;

	let {
		language,
		readOnly = false,
		compilerOptions,
		editorMode,
		tabSize,
		theme = 'dark',
		yjsInfo,
		inlayHints
	}: EditorProps = $props();

	console.log('theme: ', theme);
	let editor: monaco.editor.IStandaloneCodeEditor | null = $state.raw(null);
	let yjsMonacoBinding: MonacoBinding | null = null;

	const disposeYjsMonacoBinding = () => {
		if (!yjsMonacoBinding) {
			// It has already been disposed
			return;
		}
		yjsMonacoBinding.destroy();
		yjsMonacoBinding = null;
	};

	const disposeAll = async () => {
		disposeYjsMonacoBinding();
		// Set editor to null before disposing the monaco wrapper.
		// Otherwise, there may be a race condition where Yjs tries to bind to the old editor
		// after it has already been disposed, but before editor has been set to null.
		editor = null;
		await disposeMainMonacoWrapper();
	};

	onMount(() => {
		return () => disposeAll();
	});

	$effect(() => {
		if (!language) {
			throw new Error('Main monaco editor language is required');
		}

		if (language === 'plaintext') {
			throw new Error('Main monaco editor language cannot be plaintext');
		}

		// Rerun when compilerOptions changes.
		// Do not rerun when readOnly or theme change, since they are handled separately.
		// Do not rerun when editorElement or statusbarElement changes, since they are dom elements.
		// Dependencies are not tracked inside callbacks.
		compilerOptions;
		inlayHints; // TODO: get rid of this and use $effect to update the workspace state (currently broken)

		// Note: It's possible this will crash if this effect reruns many times
		// in a row, faster than we can create / dispose the monaco wrapper.

		let isAlive = true;

		// Dispose both the yjs binding and the monaco wrapper, just to be safe.
		// This will reset editor to null, causing the yjs binding to be re-initialized.
		// We can't put disposeAll() in the returned function because it is async.
		disposeAll().then(() => {
			if (!isAlive) {
				throw new Error('Monaco editor changed before it finished initializing');
			}
			createMainMonacoWrapper(
				language,
				compilerOptions ?? '',
				theme,
				readOnly,
				editorElement,
				statusbarElement,
				inlayHints ?? 'off'
			).then((_editor) => {
				if (!isAlive) {
					throw new Error('Monaco editor changed before it finished initializing');
				}
				editor = _editor;
			});
		});

		return () => (isAlive = false);
	});

	$effect(() => {
		if (!editor) return;
		editor.updateOptions({
			readOnly
		});
	});

	$effect(() => {
		if (!editor) return;

		vscode.workspace
			.getConfiguration()
			.update(
				'workbench.colorTheme',
				theme === 'dark' ? 'Default Dark Modern' : 'Default Light Modern',
				vscode.ConfigurationTarget.Global
			);
	});

	$effect(() => {
		if (!editor) return;

		vscode.workspace
			.getConfiguration()
			.update('editor.tabSize', tabSize, vscode.ConfigurationTarget.Global);
	});

	// this doesn't work for some reason---the effect is run but doesn't change editor state
	$effect(() => {
		if (!editor) return;
		console.log(inlayHints);
		vscode.workspace
			.getConfiguration()
			.update('editor.inlayHints.enabled', inlayHints, vscode.ConfigurationTarget.Global);
	});

	$effect(() => {
		// For monaco, vim mode has the following restrictions:
		// - We cannot unload the extension once it is loaded.
		// - It is either enabled for all editors or disabled for all editors.

		// Wait for monaco's patches to apply before enabling vim mode.
		if (!mainMonacoState.isMonacoInitialized) return;

		// Still loading the editor mode from Firebase
		if (editorMode === undefined) return;

		if (editorMode === 'vim' && !isVimLoaded) {
			isVimLoaded = true;
			// @ts-expect-error: don't need types for this
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

		if (!editor.getModel()) {
			throw new Error('Editor model should not be undefined');
		}

		yjsMonacoBinding = new MonacoBinding(
			yjsInfo.text,
			editor.getModel()!,
			new Set([editor]),
			yjsInfo.awareness
		);

		return disposeYjsMonacoBinding;
	});

	// Every 10 seconds, save the editor's value to localStorage.
	// Temporary measure to protect against accidental loss of data.
	$effect(() => {
		if (!editor) return;

		const interval = setInterval(() => {
			const value = editor?.getValue();
			if (!value) return;

			// Only save files < 15kb in size
			if (value.length < 15000) {
				let data = localStorage.getItem('editorHistory') ?? '[]';
				let parsedData = JSON.parse(data);
				if (parsedData.length > 0 && parsedData[parsedData.length - 1] === value) {
					// Don't save duplicate values
					return;
				}
				parsedData.push(value);

				if (data.length > 4 * 1024 * 1024) {
					// save at most 4MB of data
					// Remove oldest 1/3 of entries to stay under storage limit
					parsedData = parsedData.slice(Math.floor(parsedData.length / 3));
				}

				localStorage.setItem('editorHistory', JSON.stringify(parsedData));
			}
		}, 10000);

		return () => clearInterval(interval);
	});

	export const getValue = () => {
		return editor?.getValue();
	};
</script>

<div class="dark:bg-monaco-editor-bg flex h-full min-h-0 flex-col bg-white">
	<div bind:this={editorElement} class="min-h-0 w-full flex-1"></div>
	<div bind:this={statusbarElement} class="w-full"></div>
</div>
