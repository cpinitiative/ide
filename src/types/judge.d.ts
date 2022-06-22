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
  stdout?: string;
  stderr?: string;
  message?: string;
  compilationMessage?: string;
  time?: string;
  memory?: string;
  debugData?: any;
  fileOutput?: string;
}
