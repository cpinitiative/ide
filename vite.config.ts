import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import importMetaUrlPlugin from '@codingame/esbuild-import-meta-url-plugin';
import vsixPlugin from '@codingame/monaco-vscode-rollup-vsix-plugin';

export default defineConfig({
	plugins: [sveltekit(), tailwindcss(), vsixPlugin()],

	optimizeDeps: {
		// Source: https://github.com/CodinGame/monaco-vscode-api/issues/519#issuecomment-2429195251
		include: ['vscode-textmate', 'vscode-oniguruma'],

		esbuildOptions: {
			// needed for codingame's monaco editor
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			plugins: [importMetaUrlPlugin] as any
		}
	}
});
