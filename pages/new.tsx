import { useAtomValue } from 'jotai/utils';
import { useRouter } from 'next/router';
import React, { useEffect, useRef } from 'react';
import invariant from 'tiny-invariant';
import { MessagePage } from '../src/components/MessagePage';
import { LANGUAGES, useNullableUserContext } from '../src/context/UserContext';

import { useState } from 'react';
import { RadioGroup } from '@headlessui/react';
import { Language } from '../src/context/EditorContext';
import Link from 'next/link';

function classNames(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

export const DEFAULT_COMPILER_OPTIONS = {
  cpp: '-std=c++17 -O2 -Wall -Wextra -Wshadow -Wconversion -Wfloat-equal -Wduplicated-cond -Wlogical-op',
  java: '',
  py: '',
};

export default function NewFilePage() {
  const { userData, firebaseUser } = useNullableUserContext();
  const router = useRouter();
  const [lang, setLang] = useState<Language>('cpp');
  const [fileName, setFileName] = useState('');
  const [compilerOptions, setCompilerOptions] = useState('');

  const isPageLoading = !router.isReady || !userData || !firebaseUser;

  useEffect(() => {
    setCompilerOptions(DEFAULT_COMPILER_OPTIONS[lang]);
  }, [lang]);

  useEffect(() => {
    if (!isPageLoading) setLang(userData.defaultLanguage);
  }, [isPageLoading]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPageLoading) {
      alert('Page is still loading, please try again later');
      return;
    }
    if (!fileName) {
      alert('Please enter a file name.');
      return;
    }
    (async () => {
      const resp = await fetch(`/api/createNewFile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceName: fileName,
          userID: firebaseUser.uid,
          userName: firebaseUser.displayName,
          defaultPermission: userData.defaultPermission,
          language: lang,
          compilerOptions: {
            ...DEFAULT_COMPILER_OPTIONS,
            [lang]: compilerOptions,
          },
        }),
      });
      const data = await resp.json();
      if (resp.ok) {
        router.push(`/${data.fileID.substring(1)}`);
      } else {
        alert('Error: ' + data.message);
      }
    })();
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 lg:p-12 min-h-full flex flex-col max-w-6xl mx-auto">
      <form className="space-y-6 sm:space-y-8" onSubmit={handleSubmit}>
        <h1 className="text-white font-semibold md:text-xl xl:text-2xl">
          Create New File
        </h1>

        <div className="space-y-4 sm:space-y-6">
          <div>
            <label
              htmlFor="filename"
              className="block text-sm font-medium leading-6 text-gray-100"
            >
              File Name
            </label>
            <div className="mt-2">
              <input
                type="text"
                name="filename"
                id="filename"
                value={fileName}
                onChange={e => setFileName(e.target.value)}
                className="block w-full max-w-md rounded-md border-0 py-1.5 bg-gray-900 text-gray-100 shadow-sm ring-1 ring-inset ring-gray-700 placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-700 sm:text-sm sm:leading-6"
              />
            </div>
          </div>
          <div>
            <span className="block text-sm font-medium leading-6 text-gray-100">
              Language
            </span>
            <RadioGroup value={lang} onChange={setLang} className="mt-2">
              <RadioGroup.Label className="sr-only">
                {' '}
                Choose a memory option{' '}
              </RadioGroup.Label>
              <div className="flex space-x-3">
                {LANGUAGES.map(option => (
                  <RadioGroup.Option
                    key={option.value}
                    value={option.value}
                    className={({ active, checked }) =>
                      classNames(
                        'cursor-pointer focus-visible:outline-none',
                        active
                          ? 'focus-visible:ring-2 focus-visible:ring-indigo-800 focus-visible:ring-offset-2'
                          : '',
                        checked
                          ? 'bg-indigo-800 text-white hover:bg-indigo-700'
                          : 'ring-1 ring-inset ring-gray-700 bg-gray-900 text-gray-100 hover:bg-gray-800',
                        'flex items-center justify-center rounded-md py-2 px-2 text-sm font-semibold sm:px-4 ring-offset-gray-900'
                      )
                    }
                  >
                    <RadioGroup.Label as="span">
                      {option.label}
                    </RadioGroup.Label>
                  </RadioGroup.Option>
                ))}
              </div>
            </RadioGroup>
          </div>
          <div>
            <label
              htmlFor="compilerOptions"
              className="block text-sm font-medium leading-6 text-gray-100"
            >
              Compiler Options
            </label>
            <div className="mt-2">
              <input
                type="text"
                name="compilerOptions"
                id="compilerOptions"
                value={compilerOptions}
                onChange={e => setCompilerOptions(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 bg-gray-900 text-gray-100 shadow-sm ring-1 ring-inset ring-gray-700 placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-700 sm:text-sm sm:leading-6 font-mono"
              />
            </div>
          </div>
        </div>

        <div className="space-x-4">
          <button
            type="submit"
            disabled={isPageLoading}
            className="rounded-md bg-indigo-700 py-2.5 px-3.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Create File
          </button>
          <Link href="/">
            <a className="rounded-md bg-white/5 py-2.5 px-3.5 text-sm font-semibold text-white shadow-sm hover:bg-white/10 focus-visible:outline-offset-gray-900 focus-visible:outline-2 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-gray-700">
              Cancel
            </a>
          </Link>
        </div>
      </form>
    </div>
  );
}
