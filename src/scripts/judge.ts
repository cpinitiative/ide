export const submitToJudge = (
  language: 'cpp' | 'java' | 'py',
  code: string,
  input: string,
  compilerOptions: string
): Promise<Response> => {
  const data = {
    sourceCode: code,
    filename: { cpp: 'main.cpp', java: 'Main.java', py: 'main.py' }[language],
    language,
    input,
    compilerOptions: compilerOptions,
  };
  return fetch(
    `https://oh2kjsg6kh.execute-api.us-west-1.amazonaws.com/Prod/execute`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  );
};
