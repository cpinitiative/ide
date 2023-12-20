import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';
import type { ReactCodeMirrorProps } from '@uiw/react-codemirror';
type Theme = 'vs-dark' | 'light';

export type OnMount = (
  editor: Monaco.editor.IStandaloneCodeEditor,
  monaco: typeof Monaco
) => void;

export interface EditorProps {
  /**
   * Default value of the current model
   */
  defaultValue?: string;

  /**
   * Default language of the current model
   */
  defaultLanguage?: string;

  /**
   * Default path of the current model
   * Will be passed as the third argument to `.createModel` method
   * `monaco.editor.createModel(..., ..., monaco.Uri.parse(defaultPath))`
   */
  defaultPath?: string;

  /**
   * Value of the current model
   */
  value?: string;

  /**
   * Language of the current model
   */
  language?: string;

  /**
   * Path of the current model
   * Will be passed as the third argument to `.createModel` method
   * `monaco.editor.createModel(..., ..., monaco.Uri.parse(defaultPath))`
   */
  path?: string;

  /**
   * The theme for the monaco
   * Available options "vs-dark" | "light"
   * Define new themes by `monaco.editor.defineTheme`
   * Defaults to "light"
   */
  theme?: Theme | string;

  /**
   * The line to jump on it
   */
  line?: number;

  /**
   * The loading screen before the editor will be mounted
   * Defaults to 'loading...'
   */
  loading?: React.ReactNode;

  /**
   * IStandaloneEditorConstructionOptions
   */
  options?: Monaco.editor.IStandaloneEditorConstructionOptions;

  /**
   * IEditorOverrideServices
   */
  overrideServices?: Monaco.editor.IEditorOverrideServices;

  /**
   * Indicator whether to save the models' view states between model changes or not
   * Defaults to true
   */
  saveViewState?: boolean;

  /**
   * Indicator whether to dispose the current model when the Editor is unmounted or not
   * Defaults to false
   */
  keepCurrentModel?: boolean;

  /**
   * Width of the editor wrapper
   * Defaults to 100%
   */
  width?: number | string;

  /**
   * Height of the editor wrapper
   * Defaults to 100%
   */
  height?: number | string;

  /**
   * Class name for the editor container
   */
  className?: string;

  /**
   * Props applied to the wrapper element
   */
  wrapperProps?: object;

  /**
   * Signature: function(editor: monaco.editor.IStandaloneCodeEditor, monaco: Monaco) => void
   * An event is emitted when the editor is mounted
   * It gets the editor instance as a first argument and the monaco instance as a second
   * Defaults to "noop"
   */
  onMount?: OnMount;

  onBeforeDispose?: Function;

  /**
   * Only called for Codemirror editor.
   * Same signature as onCreateEditor?(view: EditorView, state: EditorState): void;
   */
  onCodemirrorMount?: ReactCodeMirrorProps['onCreateEditor'];

  vim?: boolean;

  lspEnabled?: boolean;

  /**
   * If provided, the code editor should create a yjs binding with the given information
   */
  yjsInfo?: {
    yjsText: any;
    yjsAwareness: any;
  } | null;
}
