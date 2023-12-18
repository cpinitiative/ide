// A codemirror editor, used on mobile devices

import ReactCodeMirror from '@uiw/react-codemirror';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { githubLight } from '@uiw/codemirror-theme-github';
import { StreamLanguage } from '@codemirror/language';
import { cpp } from '@codemirror/lang-cpp';
import { EditorProps } from '../MonacoEditor/monaco-editor-types';

import './codemirror-styles.css';

export const CodemirrorEditor = (props: EditorProps): JSX.Element => {
  // props.yjsInfo!
  return (
    <ReactCodeMirror
      value={props.value ?? undefined}
      theme={props.theme === 'light' ? githubLight : vscodeDark}
      height="100%"
      style={{ fontSize: '13px' }}
      readOnly={props.options?.readOnly ?? false}
      // extensions={[StreamLanguage.define(cpp)]}
    />
  );
};
