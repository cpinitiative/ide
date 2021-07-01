import { JudgeResult } from '../types/judge';

export function encode(str: string | null): string {
  return btoa(unescape(encodeURIComponent(str || '')));
}

function decode(bytes: string | null): string {
  const escaped = escape(atob(bytes || ''));
  try {
    return decodeURIComponent(escaped);
  } catch (err) {
    return unescape(escaped);
  }
}

// ex. MdDtPWrb3oOcNKtIVEA
// validate that queryId is a firebase key
// todo improve: https://stackoverflow.com/questions/52850099/what-is-the-reg-expression-for-firestore-constraints-on-document-ids/52850529#52850529
export function isFirebaseId(queryId: string): boolean {
  return queryId.length === 19;
}

function cleanAndReplaceOutput(
  output: string
): { replaced: string; cleaned: string } {
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
  // cleans up in place
  data.stdout = decode(data.stdout);
  data.stderr = decode(data.stderr);
  data.compile_output = decode(data.compile_output);
  data.message = decode(data.message);
  if (!expectedOutput) {
    if (data.status.description == 'Accepted')
      data.status.description = 'Successful';
  } else {
    if (!data.stdout.endsWith('\n')) data.stdout += '\n';
    const { cleaned, replaced } = cleanAndReplaceOutput(data.stdout);
    if (data.status.id === 3 && data.stdout !== expectedOutput) {
      data.status.id = 4;
      if (cleaned === expectedOutput.trim()) {
        data.status.description = 'Wrong Answer (Extra Whitespace)';
        data.stdout = replaced; // show the extra whitespace
      } else {
        data.status.description = 'Wrong Answer';
      }
    }
  }
  if (prefix && !data.status.description.includes('Compilation'))
    // only add prefix when no compilation error
    data.status.description = prefix + data.status.description;
}
