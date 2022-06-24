// from https://github.com/suren-atoyan/monaco-react/blob/c3e516cea63e5e96f04f1f5441fd90c34cbe43d3/src/utils/index.js#L3

export function getOrCreateModel(monaco, value, language, path) {
  return getModel(monaco, path) || createModel(monaco, value, language, path);
}

function getModel(monaco, path) {
  return monaco.editor.getModel(createModelUri(monaco, path));
}

function createModel(monaco, value, language, path) {
  return monaco.editor.createModel(
    value,
    language,
    path && createModelUri(monaco, path)
  );
}

function createModelUri(monaco, path) {
  return monaco.Uri.parse(path);
}
