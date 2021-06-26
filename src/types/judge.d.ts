// todo actually make these correct
export interface JudgeSuccessResult {
  stdout: string;
  stderr: string;
  compile_output: string;
  message: string;
  status: {
    id: number;
    description: string;
  };
  time: string;
  memory: string;
}

export interface JudgeErrorResult {
  error: string;
}

export type JudgeResult = JudgeSuccessResult & JudgeErrorResult;

export default JudgeResult;
