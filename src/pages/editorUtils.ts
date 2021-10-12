import JudgeResult, { JudgeResultStatuses } from '../types/judge';

export function encode(str: string | null): string {
  return btoa(unescape(encodeURIComponent(str || '')));
}

// ex. MdDtPWrb3oOcNKtIVEA
// validate that queryId is a firebase key
// todo improve: https://stackoverflow.com/questions/52850099/what-is-the-reg-expression-for-firestore-constraints-on-document-ids/52850529#52850529
export function isFirebaseId(queryId: string): boolean {
  return queryId.length === 19;
}

function cleanAndReplaceOutput(output: string): {
  replaced: string;
  cleaned: string;
} {
  const replaced = output.replace(/ /g, '\u2423'); // spaces made visible
  const lines = output.split('\n');
  for (let i = 0; i < lines.length; ++i) lines[i] = lines[i].trim();
  const cleaned = lines.join('\n').trim(); // remove leading / trailing whitespace on each line, trim
  return { replaced, cleaned };
}

export function cleanJudgeResult(
  data: JudgeResult,
  expectedOutput?: string,
  prefix?: string
): void {
  const statusDescriptions: { [key in JudgeResultStatuses]: string } = {
    success: 'Successful',
    compile_error: 'Compilation Error',
    runtime_error: 'Runtime Error',
    internal_error: 'Internal Server Error',
    time_limit_exceeded: 'Time Limit Exceeded',
    wrong_answer: 'Wrong Answer',
  };
  data.statusDescription = statusDescriptions[data.status];
  if (expectedOutput && data.status === 'success') {
    data.statusDescription = 'Successful';
    if (!data.stdout.endsWith('\n')) data.stdout += '\n';
    const { cleaned, replaced } = cleanAndReplaceOutput(data.stdout);
    if (data.status === 'success' && data.stdout !== expectedOutput) {
      data.status = 'wrong_answer';
      if (cleaned === expectedOutput.trim()) {
        data.statusDescription = 'Wrong Answer (Extra Whitespace)';
        data.stdout = replaced; // show the extra whitespace
      } else {
        data.statusDescription = 'Wrong Answer';
      }
    }
  }
  if (prefix && data.status !== 'compile_error')
    // only add prefix when no compilation error
    data.statusDescription = prefix + data.statusDescription;
}
