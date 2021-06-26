import React from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const USACOTestCase = ({ data }: { data: any }) => {
  const containerClasses =
    data.title === 'Correct answer'
      ? 'bg-green-700 border-green-700'
      : 'bg-red-700 border-red-700';
  const textColor =
    data.title === 'Correct answer' ? 'text-green-100' : 'text-red-100';
  return (
    <div
      className={`m-1 inline-block w-[70px] h-[60px] bg-opacity-50 border ${containerClasses} relative`}
      title={data.title}
    >
      <div
        className={`font-bold text-center text-[2.5rem] ${textColor} leading-10`}
      >
        {data.symbol}
      </div>
      <span
        className={`absolute bottom-0 left-[4px] ${textColor} text-[0.8125rem] font-bold`}
      >
        {data.trialNum}
      </span>
      <span
        className={`absolute bottom-0 right-0 text-right ${textColor} leading-3 p-[2px] text-[0.625rem]`}
      >
        {data.memory}
        <br />
        {data.time}
      </span>
    </div>
  );
};

export default function USACOResults({
  data,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}): JSX.Element | null {
  if (!data) return null;
  let equalUpToTrim = false;
  let output = data.output;
  if (data.message.includes('Incorrect') && output) {
    const lines = output.split('\n');
    const indices = [],
      answers = [];
    for (let i = 0; i < lines.length; ++i) {
      if (lines[i].endsWith(':') && (i == 0 || lines[i - 1] === '')) {
        indices.push(i);
      }
    }
    indices.push(lines.length);
    for (let i = 0; i + 1 < indices.length; ++i) {
      if (
        indices[i] + 3 == indices[i + 1] &&
        lines[indices[i] + 1] === '[File missing!]'
      )
        continue;
      let ans = '';
      for (let j = indices[i] + 1; j < indices[i + 1] - 1; ++j) {
        ans += lines[j].trim() + '\n';
        lines[j] = lines[j].replace(/ /g, '\u2423'); // make spaces visible
      }
      answers.push(ans);
    }
    equalUpToTrim = answers[0].trim() === answers[1].trim();
    if (equalUpToTrim) {
      // display whitespace
      output = lines.join('\n');
    }
  }
  return (
    <div className="mt-3">
      <p className="font-bold text-gray-200">{data.message}</p>
      {output && (
        <>
          <pre className="font-mono text-red-300 leading-tight mt-1 text-sm">
            {output}
          </pre>
          {equalUpToTrim && (
            <p className="font-bold text-gray-200 mt-3">
              Your output contains extra whitespace. This is an error; see{' '}
              <a
                href="https://usaco.guide/general/io?lang=cpp#usaco-note---extra-whitespace"
                className="text-indigo-300"
              >
                here
              </a>{' '}
              for details.
            </p>
          )}
        </>
      )}
      <div className="text-center">
        {data.testCases &&
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data.testCases.map((tc: any) => (
            <USACOTestCase data={tc} key={tc.trialNum} />
          ))}
      </div>
    </div>
  );
}
