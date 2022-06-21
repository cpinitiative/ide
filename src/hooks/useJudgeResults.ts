import { useAtomValue } from 'jotai';
import { authenticatedFirebaseRefAtom } from '../atoms/firebaseAtoms';
import JudgeResult from '../types/judge';
import useFirebaseState from './useFirebaseState';

export default function useJudgeResults() {
  const authenticatedFirebaseRef = useAtomValue(authenticatedFirebaseRefAtom);

  return useFirebaseState<(JudgeResult | null)[]>(
    authenticatedFirebaseRef?.child('state').child('judge_results'),
    []
  );
}
