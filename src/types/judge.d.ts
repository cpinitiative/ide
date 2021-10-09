// todo actually make these correct
export interface JudgeSuccessResult {
  stdout: string;
  stderr: string;
  statusDescription: string;
  status:
    | 'success'
    | 'compile_error'
    | 'runtime_error'
    | 'time_limit_exceeded'
    | 'wrong_answer';
  message: string;
  time: string;
  memory: string;
}

export interface JudgeErrorResult {
  error: string;
}

export type JudgeResult = JudgeSuccessResult & JudgeErrorResult;

export default JudgeResult;
