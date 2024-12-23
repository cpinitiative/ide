import type * as monaco from 'monaco-editor';
import { useWorkerFactory } from 'monaco-editor-wrapper/workerFactory';
import type { WrapperConfig } from 'monaco-editor-wrapper';

import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import type { Language } from '$lib/types';

export const getMonacoWrapperConfig = (
	language: Language,
	compilerOptions?: string,
	editorOptions?: monaco.editor.IEditorOptions
): WrapperConfig => {
	let lspUrl = undefined;

	if (language === 'cpp' || language === 'py') {
		lspUrl = `wss://thecodingwizard--lsp-server-main.modal.run:443/${
			language === 'cpp' ? 'clangd' : 'pyright'
		}`;
		if (compilerOptions) {
			lspUrl += `?compiler_options=${encodeURIComponent(compilerOptions)}`;
		}
	}

	const monacoLanguage = language === 'py' ? 'python' : language;

	return {
		$type: 'extended',
		vscodeApiConfig: {
			serviceOverrides: {
				...getKeybindingsServiceOverride()
			},
			userConfiguration: {
				json: JSON.stringify({
					'workbench.colorTheme': 'Default Dark Modern',
					'editor.guides.bracketPairsHorizontal': 'active',
					'editor.lightbulb.enabled': 'On',
					'editor.wordBasedSuggestions': 'off',
					'editor.experimental.asyncTokenization': true,
					'editor.minimap.enabled': false
				})
			}
		},
		editorAppConfig: {
			monacoWorkerFactory: (logger) => {
				useWorkerFactory({
					workerOverrides: {
						ignoreMapping: true,
						workerLoaders: {
							TextEditorWorker: () =>
								new Worker(
									new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url),
									{ type: 'module' }
								),
							TextMateWorker: () =>
								new Worker(
									new URL(
										'@codingame/monaco-vscode-textmate-service-override/worker',
										import.meta.url
									),
									{ type: 'module' }
								)
						}
					},
					logger
				});
			},
			editorOptions,
			codeResources: {
				modified: {
					uri: `/workspace/main.${language}`,
					text: ''
				}
			}
		},
		languageClientConfigs: lspUrl
			? {
					[monacoLanguage]: {
						clientOptions: {
							documentSelector: [monacoLanguage]
						},
						connection: {
							options: {
								$type: 'WebSocketUrl',
								url: lspUrl,
								startOptions: {
									onCall: () => {
										console.log('Connected to LSP.');
									},
									reportStatus: true
								},
								stopOptions: {
									onCall: () => {
										console.log('Disconnected from LSP.');
									},
									reportStatus: true
								}
							}
						}
					}
				}
			: undefined
	};
};
