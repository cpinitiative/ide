import JudgeResult, { JudgeResultStatuses } from './types/judge';

export function encode(str: string | null): string {
  return btoa(unescape(encodeURIComponent(str || '')));
}

export function isFirebaseId(queryId: string): boolean {
  return (
    /^(?!\.\.?$)(?!.*__.*__)([^/]{1,1500})$/.test(queryId) &&
    queryId.length === 19
  );
}
