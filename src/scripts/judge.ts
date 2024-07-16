// Source: https://javascript.info/regexp-groups
export const extractJavaFilename = (code: string): string => {
  const matches = Array.from(code.matchAll(/public +class +(\w+)/g));
  if (matches.length > 0) {
    return matches[0][1] + '.java';
  }
  return 'Main.java'; // fallback, something went wrong
};

export const submitToJudge = (
  language: 'cpp' | 'java' | 'py',
  code: string,
  input: string,
  compilerOptions: string,
  fileIOName?: string
): Promise<any> => {
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
    },
    // todo: fileioname
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
    const data = await resp.json();
    if (data.compile?.exit_code !== 0) {
      return {
        status: 'compile_error',
        stdout: data.compile.stdout,
        message: data.compile.stderr,
        compilationMessage: data.compile.stderr,
        time: data.compile.wall_time,
        memory: data.compile.memory_usage,
      };
    }
    return {
      status:
        data.execute.exit_code === 0
          ? 'success'
          : data.execute.exit_code === 124
          ? 'time_limit_exceeded'
          : 'runtime_error',
      stdout: data.execute.stdout,
      stderr: data.execute.stderr,
      compilationMessage: data.compile.stderr,
      time: data.execute.wall_time,
      memory: data.execute.memory_usage,
    };
  });
};
