import type * as monaco from 'monaco-editor';
import { useWorkerFactory } from 'monaco-editor-wrapper/workerFactory';
import type { WrapperConfig } from 'monaco-editor-wrapper';

import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import getStatusBarServiceOverride from '@codingame/monaco-vscode-view-status-bar-service-override';
import getStorageServiceOverride from '@codingame/monaco-vscode-storage-service-override';
import type { Language } from '$lib/types';

export const getMonacoWrapperConfig = (
	language: Language,
	theme: 'light' | 'dark' | 'huacat-pink',
	compilerOptions?: string,
	editorOptions?: monaco.editor.IStandaloneEditorConstructionOptions
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
			viewsConfig: {
				viewServiceType: 'ViewsService'
			},
			serviceOverrides: {
				...getKeybindingsServiceOverride(),
				...getStatusBarServiceOverride(),
				...getStorageServiceOverride()
			},
			userConfiguration: {
				json: JSON.stringify({
					'workbench.colorTheme':
						theme === 'dark'
							? 'Default Dark Modern'
							: theme === 'huacat-pink'
								? 'Huacat Pink Theme'
								: 'Default Light Modern',
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

export const baseEditorOptions = {
	glyphMargin: false,
	automaticLayout: true,
	detectIndentation: false
};
