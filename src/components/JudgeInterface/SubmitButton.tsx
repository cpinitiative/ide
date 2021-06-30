import classNames from 'classnames';
import React from 'react';
import LoadingIndicator from '../LoadingIndicator';

export default function SubmitButton({
  isLoading,
  isDisabled,
  onClick,
}: {
  isLoading: boolean;
  isDisabled: boolean;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
}): JSX.Element {
  const loadingClasses =
    'cursor-not-allowed bg-indigo-900 bg-opacity-50 text-indigo-200 opacity-50';
  const normalClasses =
    'text-indigo-200 hover:text-indigo-100 hover:bg-indigo-800 hover:bg-opacity-50 bg-indigo-900 bg-opacity-50';
  return (
    <button
      className={classNames(
        'block w-full py-2 text-sm uppercase font-bold transition focus:outline-none',
        isLoading || isDisabled ? loadingClasses : normalClasses
      )}
      disabled={isLoading || isDisabled}
      onClick={onClick}
    >
      {isLoading ? (
        <>
          <LoadingIndicator className="h-5 w-5 p-0.5 mr-1.5" />
          <span>Loading...</span>
        </>
      ) : isDisabled ? (
        'Cannot Submit'
      ) : (
        'Submit'
      )}
    </button>
  );
}
