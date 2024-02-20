import { useAtomValue } from 'jotai/utils';
import { useRouter } from 'next/router';
import React, { useEffect, useLayoutEffect, useRef } from 'react';
import invariant from 'tiny-invariant';
import { MessagePage } from '../src/components/MessagePage';
import { LANGUAGES, useNullableUserContext } from '../src/context/UserContext';

import { useState } from 'react';
import { RadioGroup } from '@headlessui/react';
import { Language } from '../src/context/EditorContext';
import Link from 'next/link';
import firebase from 'firebase/app';
import { SharingPermissions } from '../src/components/SharingPermissions';
import va from '@vercel/analytics';
import generateRandomFileName from '../src/scripts/generateRandomFileName';

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
  const [defaultPerimssion, setDefaultPermission] = useState<
    'READ_WRITE' | 'READ' | 'PRIVATE' | null
  >(null);
  const [compilerOptions, setCompilerOptions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Note: filename is not a controlled input because we want to set the default value
  // and auto-select the input when the page loads.
  const filenameInputRef = useRef<HTMLInputElement>(null);

  const isPageLoading = !router.isReady || !userData || !firebaseUser;

  useEffect(() => {
    if (!filenameInputRef.current) return;
    filenameInputRef.current.value = generateRandomFileName();
    filenameInputRef.current.focus();
    filenameInputRef.current.select();
  }, [filenameInputRef.current]);

  useEffect(() => {
    setCompilerOptions(DEFAULT_COMPILER_OPTIONS[lang]);
  }, [lang]);

  useEffect(() => {
    if (!isPageLoading) {
      setLang(userData.defaultLanguage);
      setDefaultPermission(userData.defaultPermission);
    }
  }, [isPageLoading]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPageLoading) {
      alert('Page is still loading, please try again later');
      return;
    }
    const fileName = filenameInputRef.current?.value;
    if (!fileName) {
      alert('Please enter a file name.');
      return;
    }
    if (isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    (async () => {
      va.track('Create File', { type: 'new-file' });
      firebase.database().ref(`users/${firebaseUser.uid}/data`).update({
        defaultLanguage: lang,
        defaultPermission: defaultPerimssion,
      });
      const resp = await fetch(`/api/createNewFile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceName: fileName,
          userID: firebaseUser.uid,
          userName: firebaseUser.displayName,
          defaultPermission: defaultPerimssion,
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
                ref={filenameInputRef}
                className="block w-full max-w-md rounded-md border-0 py-1.5 bg-gray-900 text-gray-100 shadow-sm ring-1 ring-inset ring-gray-700 placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-700 sm:text-sm sm:leading-6"
              />
            </div>
          </div>
          <div className="mb-4">
            <SharingPermissions
              value={defaultPerimssion}
              onChange={setDefaultPermission}
              isOwner={true}
              lightMode
            />
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
            disabled={isPageLoading || isSubmitting}
            className="rounded-md bg-indigo-700 py-2.5 px-3.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            {isSubmitting ? 'Creating...' : 'Create File'}
          </button>
          <Link
            href="/"
            className="rounded-md bg-white/5 py-2.5 px-3.5 text-sm font-semibold text-white shadow-sm hover:bg-white/10 focus-visible:outline-offset-gray-900 focus-visible:outline-2 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-gray-700"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
