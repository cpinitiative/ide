import firebase from 'firebase';
import { useEditorContext } from '../context/EditorContext';
import JudgeResult from '../types/judge';
import useFirebaseState from './useFirebaseState';

export default function useJudgeResults() {
  const { fileData } = useEditorContext();

  return useFirebaseState<(JudgeResult | null)[]>(
    fileData
      ? firebase
          .database()
          .ref(`files/${fileData.id}`)
          .child('state')
          .child('judge_results')
      : null,
    []
  );
}
