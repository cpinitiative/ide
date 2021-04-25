import Editor from "@monaco-editor/react";
import { useState, useEffect } from "react";
import { useFirebaseRef } from "../hooks/useFirebaseRef";
import Firepad from "../scripts/firepad";
import defaultCode from "../scripts/defaultCode";

const FirepadEditor = ({ onMount, ...props }) => {
  const firebaseRef = useFirebaseRef();
  const [editor, setEditor] = useState(null);

  useEffect(() => {
    if (!firebaseRef || !editor) return;

    const lang = "cpp";
    console.log(editor);
    const firepad = Firepad.fromMonaco(firebaseRef.child("editor-"+lang), editor);

    firepad.on('ready', function() {
      if (editor.getValue().length === 0) {
        editor.setValue(defaultCode[lang]);
      }
    });
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