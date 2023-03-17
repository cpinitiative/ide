import firebase from 'firebase/app';
import { useEditorContext } from '../context/EditorContext';
import JudgeResult from '../types/judge';
import useFirebaseState from './useFirebaseState';

export default function useJudgeResults() {
  const { fileData, updateFileData } = useEditorContext();
  return [
    fileData.state?.judge_resuts ?? [],
    (new_judge_results: any) =>
      updateFileData({
        state: { ...fileData.state, judge_resuts: new_judge_results },
      }),
  ];
}
