import { createContext, useContext, useState } from 'react';
import JudgeResult from '../types/judge';

const JudgeResultsContext = createContext<
  [(JudgeResult | null)[], (newResults: (JudgeResult | null)[]) => void] | null
>(null);

export default function useJudgeResults() {
  const context = useContext(JudgeResultsContext);
  if (context === null) {
    throw new Error(
      'useJudgeResults must be used within an JudgeResultsProvider'
    );
  }

  return context;
}

export function JudgeResultsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const state = useState<(JudgeResult | null)[]>([]);
  return (
    <JudgeResultsContext.Provider value={state}>
      {children}
    </JudgeResultsContext.Provider>
  );
}
