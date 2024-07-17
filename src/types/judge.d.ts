export type JudgeResultStatuses =
  | 'success'
  | 'compile_error'
  | 'runtime_error'
  | 'time_limit_exceeded'
  | 'wrong_answer'
  | 'internal_error';
export default interface JudgeResult {
  statusDescription: string;
  status: JudgeResultStatuses;
  stdout: string | null;
  stderr: string | null;
  message: string | null;
  compilationMessage: string | null;
  time: string | null;
  memory: string | null;
  debugData: any | null;
  fileOutput: string | null;
}
