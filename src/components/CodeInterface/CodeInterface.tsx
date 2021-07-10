import { TabBar } from '../TabBar';
import { Language } from '../SettingsContext';
import defaultCode from '../../scripts/defaultCode';
import React, { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import { useAtom } from 'jotai';
import {
  actualUserPermissionAtom,
  currentLangAtom,
  mainMonacoEditorAtom,
} from '../../atoms/workspace';
import { LazyFirepadEditor } from '../LazyFirepadEditor';
import { useAtomValue } from 'jotai/utils';
import { authenticatedFirebaseRefAtom } from '../../atoms/firebaseAtoms';

export const CodeInterface = ({
  className,
}: {
  className?: string;
}): JSX.Element => {
  const [lang, setLang] = useAtom(currentLangAtom);
  const [permission] = useAtom(actualUserPermissionAtom);
  const readOnly = !(permission === 'OWNER' || permission === 'READ_WRITE');
  const [
    editor,
    setEditor,
  ] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [, setMainMonacoEditor] = useAtom(mainMonacoEditorAtom);

  const firebaseRef = useAtomValue(authenticatedFirebaseRefAtom);
  const firebaseRefs = useMemo(
    () => ({
      cpp: firebaseRef?.child(`editor-cpp`),
      java: firebaseRef?.child(`editor-java`),
      py: firebaseRef?.child(`editor-py`),
    }),
    [firebaseRef]
  );

  useEffect(() => {
    if (editor) {
      setMainMonacoEditor(editor);
      return () => {
        setMainMonacoEditor(null);
      };
    }
  }, [editor, setMainMonacoEditor]);

  return (
    <div
      className={classNames(
        'bg-[#1E1E1E] text-gray-200 flex flex-col',
        className
      )}
    >
      <TabBar
        tabs={[
          { label: 'Main.cpp', value: 'cpp' },
          { label: 'Main.java', value: 'java' },
          { label: 'Main.py', value: 'py' },
        ]}
        activeTab={lang}
        onTabSelect={tab => setLang(tab.value as Language)}
      />
      <div className="flex-1 overflow-hidden">
        <LazyFirepadEditor
          theme="vs-dark"
          language={{ cpp: 'cpp', java: 'java', py: 'python' }[lang]}
          path={lang}
          options={{
            minimap: { enabled: false },
            automaticLayout: false,
            insertSpaces: false,
            readOnly,
          }}
          onMount={e => {
            setEditor(e);
            setTimeout(() => {
              e.layout();
              e.focus();
            }, 0);
          }}
          defaultValue={defaultCode[lang]}
          firebaseRef={firebaseRefs[lang]}
          useEditorWithVim={true}
          dataTestId="code-editor"
        />
      </div>
      <p className="text-sm font-mono text-gray-200 pl-4 status-node" />
    </div>
  );
};
