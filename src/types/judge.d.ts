export type JudgeResultStatuses =
  | 'success'
  | 'compile_error'
  | 'runtime_error'
  | 'time_limit_exceeded'
  | 'wrong_answer'
  | 'internal_error';
export default interface JudgeResult {
  stdout: string;
  stderr: string;
  statusDescription: string;
  status: JudgeResultStatuses;
  message: string;
  time: string;
  memory: string;
  debugData?: any;
}
