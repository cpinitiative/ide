import React, { useEffect } from 'react';
import { ConfirmOverrideModal } from '../src/components/ConfirmOverrideModal';
import { useAtomValue } from 'jotai/utils';
import Dashboard from '../src/components/Dashboard/Dashboard';
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/20/solid';
import {
  useNullableUserContext,
  useUserContext,
} from '../src/context/UserContext';

export default function DashboardPage(): JSX.Element {
  const { userData } = useNullableUserContext();

  useEffect(() => {
    document.title = 'Real-Time Collaborative Online IDE';
  }, []);

  return (
    <div className="p-4 sm:p-6 md:p-8 lg:p-12 min-h-full flex flex-col max-w-6xl mx-auto">
      <ConfirmOverrideModal />
      <div className="flex-1">
        <h1 className="text-gray-100 text-2xl md:text-4xl font-black">
          Real-Time Collaborative Online IDE
        </h1>

        <div className="my-6">
          <div className="rounded-md bg-blue-800/25 p-4 max-w-2xl">
            <div className="flex">
              <div className="flex-shrink-0">
                <InformationCircleIcon
                  className="h-5 w-5 text-blue-400"
                  aria-hidden="true"
                />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-100">
                  Welcome to the beta IDE!
                </h3>
                <div className="mt-2 text-sm text-blue-200">
                  <p>
                    This new IDE should have improved performance and stability.
                    The{' '}
                    <a
                      href="https://ide.usaco.guide/"
                      target="_blank"
                      className="underline"
                    >
                      old IDE
                    </a>{' '}
                    will eventually be removed. Currently, files on the old IDE
                    are not visible on the new IDE. For more information, and to
                    report issues,{' '}
                    <a
                      href="https://github.com/cpinitiative/ide/issues/98"
                      target="_blank"
                      className="underline"
                    >
                      visit our GitHub repository
                    </a>
                    . Thank you for helping us test the new IDE!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* <div className="h-6"></div> */}

        {!userData ? (
          <div className="text-gray-400 mt-6">Loading...</div>
        ) : (
          <Dashboard />
        )}
      </div>
      <div className="mt-6 text-gray-400">
        Looking to get better at USACO? Check out the{' '}
        <a
          href="https://usaco.guide/"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-white"
        >
          USACO Guide
        </a>
        !<br />
        Not for commercial use.
      </div>
    </div>
  );
}
