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
import Image from 'next/image';

export default function DashboardPage(): JSX.Element {
  const { userData } = useNullableUserContext();

  useEffect(() => {
    document.title = 'Real-Time Collaborative Online IDE';
  }, []);

  return (
    <div className="min-h-full flex flex-col">
      <ConfirmOverrideModal />
      <div className="flex-1">
        <div className="p-4 sm:p-6 md:p-8 lg:p-12 max-w-6xl mx-auto">
          <h1 className="text-gray-100 text-2xl md:text-4xl font-black">
            Real-Time Collaborative Online IDE
          </h1>

          <div className="h-6"></div>

          {!userData ? (
            <div className="text-gray-400 mt-6">Loading...</div>
          ) : (
            <Dashboard />
          )}
        </div>
      </div>
      <div className="border-t border-gray-700">
        <div className="p-4 sm:p-6 md:p-8 lg:p-12 max-w-6xl mx-auto text-gray-400 space-y-8">
          <div>
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
          <div>
            <Image
              alt="Datadog Logo"
              src="/dd_logo_v_white.svg"
              width={150}
              height={250}
              className="ml-[2px]"
            />
            <p className="mt-2 text-gray-400">
              Infrastructure monitoring powered by Datadog.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
