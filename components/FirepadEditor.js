import Editor from "@monaco-editor/react";
import { useState, useEffect } from "react";
import Firepad from "../scripts/firepad";

const FirepadEditor = ({ onMount, defaultValue, firebaseRef, ...props }) => {
  const [editor, setEditor] = useState(null);

  useEffect(() => {
    if (!firebaseRef || !editor) return;

    // we reset the value here since firepad initialization can't have any text in it
    // firepad will fetch the text from firebase and update monaco
    editor.setValue("");
    const firepad = Firepad.fromMonaco(firebaseRef, editor);

    firepad.on('ready', function() {
      if (editor.getValue().length === 0) {
        editor.setValue(defaultValue);
      }
    });

    return () => firepad.dispose();
  }, [firebaseRef, editor]);

  return (
    <Editor
      {...props}
      onMount={e => {
        setEditor(e);
        if (onMount) onMount(e);
      }}
    />
  );
}

export default FirepadEditor;