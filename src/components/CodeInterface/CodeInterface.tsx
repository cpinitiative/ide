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
import { LazyRealtimeEditor } from '../LazyRealtimeEditor';
import { useAtomValue } from 'jotai/utils';
import { authenticatedFirebaseRefAtom } from '../../atoms/firebaseAtoms';
import { userSettingsAtomWithPersistence } from '../../atoms/userSettings';
import type * as monaco from 'monaco-editor';
import { useEditorContext } from '../../context/EditorContext';
import { useUserContext } from '../../context/UserContext';
import useUserPermission from '../../hooks/useUserPermission';

export const CodeInterface = ({
  className,
}: {
  className?: string;
}): JSX.Element => {
  const { fileData } = useEditorContext();
  const lang = fileData.settings.language;
  const permission = useUserPermission();
  const readOnly = !(permission === 'OWNER' || permission === 'READ_WRITE');
  const [editor, setEditor] =
    useState<monaco.editor.IStandaloneCodeEditor | null>(null);
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

  const { tabSize, lightMode } = useAtomValue(userSettingsAtomWithPersistence);

  return (
    <div
      className={classNames(
        'bg-[#1E1E1E] text-gray-200 flex flex-col',
        className
      )}
    >
      <div className="flex-1 overflow-hidden">
        <LazyRealtimeEditor
          theme={lightMode ? 'light' : 'vs-dark'}
          language={{ cpp: 'cpp', java: 'java', py: 'python' }[lang]}
          path={`myfile.${lang}`}
          options={
            {
              minimap: { enabled: false },
              automaticLayout: false,
              tabSize: tabSize,
              insertSpaces: false,
              readOnly,
              'bracketPairColorization.enabled': true, // monaco doesn't expect an IBracketPairColorizationOptions

              // this next option is to prevent annoying autocompletes
              // ex. type return space and it adds two spaces + semicolon
              // ex. type vecto< and it autocompletes weirdly
              acceptSuggestionOnCommitCharacter: false,
              // suggestOnTriggerCharacters: false,
            } as any
          }
          onMount={e => {
            setEditor(e);
            setTimeout(() => {
              e.layout();
              e.focus();
            }, 0);
          }}
          defaultValue={defaultCode[lang]}
          yjsDocumentId={`${fileData.id}.code`}
          useEditorWithVim={true}
          lspEnabled={lang === 'cpp'}
          dataTestId="code-editor"
        />
      </div>
      <p className="text-sm font-mono text-gray-200 pl-4 status-node" />
    </div>
  );
};
