import { useState } from 'react';

export default function JoinLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}${link}`).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      },
      () => {
        alert("Couldn't copy to clipboard");
      }
    );
  };

  return (
    <div>
      <h4 className="font-medium text-white px-4">Join Link</h4>
      <div className="mt-2 flex">
        <span className="block pl-4 pr-2 py-1.5 bg-gray-800 rounded text-gray-300 w-full overflow-ellipsis overflow-hidden">
          {window.location.origin}
          {link}
        </span>
        <button
          className="text-gray-300 hover:text-white hover:bg-gray-700 bg-gray-800 px-2 text-sm font-medium"
          onClick={handleCopy}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
