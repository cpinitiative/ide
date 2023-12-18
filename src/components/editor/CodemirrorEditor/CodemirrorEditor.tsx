// A codemirror editor, used on mobile devices

import ReactCodeMirror from '@uiw/react-codemirror';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { githubLight } from '@uiw/codemirror-theme-github';
import { CodeEditorProps } from '../CodeEditor';

import './codemirror-styles.css';

export const CodemirrorEditor = (props: CodeEditorProps): JSX.Element => {
  return (
    <ReactCodeMirror
      theme={props.theme === 'light' ? githubLight : vscodeDark}
      height="100%"
    />
  );
};
