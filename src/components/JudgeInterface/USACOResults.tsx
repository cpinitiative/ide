import React from 'react';

const USACOTestCase = ({ data }) => {
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
        className={`absolute bottom-0 left-[4px] ${textColor} text-sm font-bold`}
      >
        {data.trialNum}
      </span>
      <span
        className={`absolute bottom-0 right-0 text-right ${textColor} leading-3 p-[2px] text-sm`}
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
  data: any;
}): JSX.Element | null {
  if (!data) return null;
  return (
    <div className="mt-3">
      <p className="font-bold text-gray-200">{data.message}</p>
      {data.output && (
        <pre className="font-mono text-red-300 leading-tight mt-1">
          {data.output}
        </pre>
      )}
      <div className="text-center">
        {data.testCases &&
          data.testCases.map(tc => (
            <USACOTestCase data={tc} key={tc.trialNum} />
          ))}
      </div>
    </div>
  );
}
