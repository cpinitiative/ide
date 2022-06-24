// from https://github.com/suren-atoyan/monaco-react/blob/c3e516cea63e5e96f04f1f5441fd90c34cbe43d3/src/utils/index.js#L3

import { DependencyList, EffectCallback, useEffect, useRef } from 'react';
import type Monaco from 'monaco-editor';

export function getOrCreateModel(
  monaco: typeof Monaco,
  value: string,
  language: string | undefined,
  path: string
) {
  return getModel(monaco, path) || createModel(monaco, value, language, path);
}

function getModel(monaco: typeof Monaco, path: string) {
  return monaco.editor.getModel(createModelUri(monaco, path));
}

function createModel(
  monaco: typeof Monaco,
  value: string,
  language: string | undefined,
  path: string
) {
  return monaco.editor.createModel(
    value,
    language,
    path ? createModelUri(monaco, path) : undefined
  );
}

function createModelUri(monaco: typeof Monaco, path: string) {
  return monaco.Uri.parse(path);
}

export function useUpdate(effect: EffectCallback, deps: DependencyList) {
  const isInitialMount = useRef(true);

  useEffect(
    isInitialMount.current
      ? () => {
          isInitialMount.current = false;
        }
      : effect,
    deps
  );
}

export function usePrevious<T>(value: T) {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}
