// import { SearchIcon } from '@heroicons/react/solid';
import React from 'react';
import {
  connectAutoComplete,
  Highlight,
  InstantSearch,
  PoweredBy,
} from 'react-instantsearch-dom';
import algoliasearch from 'algoliasearch/lite';

const searchClient = algoliasearch(
  '3CFULMFIDW',
  'b1b046e97b39abe6c905e0ad1df08d9e'
);

const indexName = 'usacoProblems';

const FileSearch = ({
  hits,
  currentRefinement,
  refine,
  onSelect,
  canChange,
}: {
  hits: any[];
  currentRefinement: string;
  refine: (arg: string) => void;
  onSelect: (arg: any) => void;
  canChange: boolean;
}) => {
  return (
    <div>
      <div className="flex items-center relative">
        <input
          type="search"
          name={`problem-select`}
          id={`problem-select`}
          className="mt-0 block w-full px-0 pt-0 pb-1 border-0 border-b-2 border-gray-200 focus:ring-0 focus:border-black text-sm placeholder-gray-400"
          value={currentRefinement}
          placeholder={
            'e.g. http://www.usaco.org/index.php?page=viewproblem2&cpid=1140'
          }
          onChange={e => refine(e.target.value)}
          // disabled={!canChange}
          autoComplete="off"
          autoFocus
          disabled={!canChange}
        />
        {/* <span className="p-2 absolute right-0 bottom-px">
          <SearchIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </span> */}
        {/* <input
          type="search"
          placeholder="Search"
          className="focus:outline-none focus:ring-0 text-gray-700 dark:bg-dark-surface dark:text-gray-200 dark:placeholder-gray-400 border-0 flex-1"
          value={currentRefinement}
          onChange={e => refine(e.target.value)}
          autoComplete="off"
          autoFocus
        />*/}
      </div>
      {currentRefinement !== '' && (
        <div>
          <div className="text-sm max-h-[20rem] overflow-y-auto border-t divide-y divide-gray-200 border-gray-200 dark:divide-gray-700 dark:border-gray-700">
            {hits.map(hit => (
              <button
                className="block hover:bg-blue-100 dark:hover:bg-gray-700 py-3 px-5 transition focus:outline-none w-full text-left"
                key={hit.id}
                onClick={() => {
                  refine(''); // clear
                  onSelect(hit);
                }}
              >
                <h3 className="text-gray-600 dark:text-gray-200 font-medium">
                  <Highlight hit={hit} attribute="title" /> (
                  <Highlight hit={hit} attribute="id" />)
                </h3>
                <p className="text-gray-700 dark:text-gray-400 text-sm">
                  <Highlight hit={hit} attribute="source" />
                </p>
              </button>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700">
            <PoweredBy theme="dark" />
          </div>
        </div>
      )}
    </div>
  );
};

const ConnectedSearch = connectAutoComplete(FileSearch);

const ProblemSearchInterface: React.FC<{
  onSelect: (hit: any) => void;
  canChange: boolean;
}> = ({ onSelect, canChange }) => {
  return (
    <InstantSearch indexName={indexName} searchClient={searchClient}>
      <ConnectedSearch onSelect={onSelect} canChange={canChange} />
    </InstantSearch>
  );
};

export default ProblemSearchInterface;
