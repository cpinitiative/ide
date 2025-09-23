<script lang="ts">
	import { basicSetup } from 'codemirror';
	import { EditorView, keymap } from '@codemirror/view';
	import { python } from '@codemirror/lang-python';
	import { cpp } from '@codemirror/lang-cpp';
	import { java } from '@codemirror/lang-java';
	import { vscodeDark } from '@uiw/codemirror-theme-vscode';
	import { githubLight } from '@uiw/codemirror-theme-github';
	import type { EditorProps } from '../RealtimeEditor.svelte';
	import { vim } from '@replit/codemirror-vim';
	import * as Y from 'yjs';
	import { yCollab } from 'y-codemirror.next';
	import { EditorState, type Extension } from '@codemirror/state';
	import { indentUnit } from '@codemirror/language';
	import { indentWithTab } from '@codemirror/commands';

	let editorElement: HTMLElement;

	let {
		language,
		readOnly = false,
		editorMode,
		tabSize = 4,
		theme = 'dark',
		value, // note: yjsInfo overrides this

		yjsInfo
	}: EditorProps & { value?: string } = $props();

	let editorView: EditorView | undefined = $state(undefined);

	$effect(() => {
		let extensions = [basicSetup, keymap.of([indentWithTab])];
		if (editorMode === 'vim') {
			extensions.push(vim());
		}

		switch (language) {
			case 'py':
				extensions.push(python());
				break;
			case 'cpp':
				extensions.push(cpp());
				break;
			case 'java':
				extensions.push(java());
				break;
		}

		switch (theme) {
			case 'dark':
				extensions.push(vscodeDark);
				break;
			case 'light':
			case 'huacat-pink':
				// For huacat-pink theme, use the light theme as a base
				// since pink themes are typically lighter in appearance
				extensions.push(githubLight);
				break;
			default:
				throw new Error('Unsupported theme');
		}

		let yCollabPlugins: Extension[] = [];
    // TODO: this causes an unnecessary initial rerender, since yjsInfo
    // goes from undefined -> defined
		if (yjsInfo) {
			const undoManager = new Y.UndoManager(yjsInfo.text);
			yCollabPlugins = yCollab(yjsInfo.text, yjsInfo.awareness, {
				undoManager
			}) as Extension[];
		}
		extensions.push(...yCollabPlugins);

		extensions.push(indentUnit.of(' '.repeat(tabSize)));

		// TODO: this causes an unnecessary initial rerender, since readOnly
		// goes from true -> false
		if (readOnly) {
			extensions.push(EditorState.readOnly.of(true));
		}

		editorView = new EditorView({
			doc: yjsInfo?.text.toString() ?? value ?? '',
			extensions,
			parent: editorElement
		});

		return () => {
			// some of the codemirror yjs plugins need to be destroyed
			// so that it stops listening to yjs updates; otherwise
			// we may end up with a bug where the codemirror editor
			// has a bunch of duplicated text.
			yCollabPlugins.forEach((plugin) => {
				if ((plugin as any).destroy) (plugin as any).destroy();
			});
			editorView?.destroy();
		};
	});

	export const getValue = () => {
		return editorView?.state.doc.toString();
	};
</script>

<div
	bind:this={editorElement}
	class="cm-editor-container h-full min-h-0 w-full"
	style="font-size: 13px"
></div>

<style>
	.cm-editor-container > :global(.cm-editor) {
		height: 100%;
	}
</style>
