import invariant from 'tiny-invariant';
import JudgeResult, { JudgeResultStatuses } from '../types/judge';

type CompileAndExecuteResponse = {
  compile: {
    stdout: string;
    stderr: string;
    wall_time: string;
    memory_usage: string;
    exit_code: number;
    exit_signal: string | null;
  };
  execute: {
    stdout: string;
    file_output: string | null;
    stderr: string;
    wall_time: string;
    memory_usage: string;
    exit_code: number;
    exit_signal: string | null;
    verdict:
      | 'accepted'
      | 'wrong_answer'
      | 'time_limit_exceeded'
      | 'runtime_error';
  } | null;
};

export const submitToJudge = (
  language: 'cpp' | 'java' | 'py',
  code: string,
  input: string,
  compilerOptions: string,
  fileIOName?: string,
  expectedOutput?: string
): Promise<JudgeResult> => {
  const data = {
    compile: {
      source_code: code,
      compiler_options: compilerOptions,
      language:
        language === 'java' ? 'java21' : language === 'py' ? 'py12' : 'cpp',
    },
    execute: {
      timeout_ms: 5000,
      stdin: input,
      file_io_name: fileIOName,
    },
  };
  return fetch(
    `https://v3nuswv3poqzw6giv37wmrt6su0krxvt.lambda-url.us-east-1.on.aws/compile-and-execute`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  ).then(async resp => {
    if (!resp.ok) {
      const msg = await resp.text();
      throw new Error(msg);
    }
    const data = (await resp.json()) as CompileAndExecuteResponse;
    return cleanJudgeResult(data, expectedOutput);
  });
};

function cleanJudgeResult(
  data: CompileAndExecuteResponse,
  expectedOutput?: string
): JudgeResult {
  const statusDescriptions: { [key in JudgeResultStatuses]: string } = {
    success: 'Successful',
    compile_error: 'Compilation Error',
    runtime_error: 'Runtime Error',
    internal_error: 'Internal Server Error',
    time_limit_exceeded: 'Time Limit Exceeded',
    wrong_answer: 'Wrong Answer',
  };

  if (data.compile.exit_code !== 0) {
    return {
      status: 'compile_error',
      statusDescription: statusDescriptions['compile_error'],
      stdout: data.compile.stdout,
      message: data.compile.stderr,
      compilationMessage: data.compile.stderr,
      time: data.compile.wall_time,
      memory: data.compile.memory_usage,
      stderr: null,
      debugData: null,
      fileOutput: null,
    };
  }
  invariant(
    data.execute != null,
    'received invalid compile and execute response'
  );

  let status: JudgeResultStatuses =
    data.execute.verdict === 'accepted' ? 'success' : data.execute.verdict;

  let stdout = data.execute.file_output ?? data.execute.stdout;
  let statusDescription = statusDescriptions[status];
  if (expectedOutput && status === 'success') {
    if (!stdout.endsWith('\n')) stdout += '\n';
    if (status === 'success' && stdout !== expectedOutput) {
      status = 'wrong_answer';
      const { cleaned, replaced } = cleanAndReplaceOutput(stdout);
      if (cleaned === expectedOutput.trim()) {
        statusDescription = 'Wrong Answer (Extra Whitespace)';
        stdout = replaced; // show the extra whitespace
      } else {
        statusDescription = 'Wrong Answer';
      }
    }
  }

  return {
    status,
    statusDescription,
    stdout,
    stderr: data.execute.stderr,
    compilationMessage: data.compile.stderr,
    time: data.execute.wall_time,
    memory: data.execute.memory_usage,
    fileOutput: data.execute.file_output,
    message: null,
    debugData: null,
  };
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
