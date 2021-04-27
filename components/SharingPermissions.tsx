import { RadioGroup } from '@headlessui/react';
import classNames from 'classnames';
import React from 'react';
import { useFirebaseRef } from '../hooks/useFirebaseRef';
import { useAtom } from 'jotai';
import { defaultPermissionAtom } from '../atoms/workspace';

const sharingOptions = [
  {
    label: 'Public Read & Write',
    value: 'READ_WRITE',
  },
  {
    label: 'View Only',
    value: 'READ',
  },
  {
    label: 'Private',
    value: 'PRIVATE',
  },
];

export const SharingPermissions = (): JSX.Element => {
  const [value, setValue] = useAtom(defaultPermissionAtom);
  const firebaseRef = useFirebaseRef();

  // note: users don't currently subscribe to these changes, so they'll have to reload the page
  const handleChange = (newVal: 'READ_WRITE' | 'READ' | 'PRIVATE') => {
    if (!firebaseRef) {
      alert('Firebase loading, please wait');
      return;
    }
    firebaseRef.child('settings').child('default_permission').set(newVal);
    setValue(newVal);
  };

  return (
    <>
      <RadioGroup value={value} onChange={handleChange}>
        <RadioGroup.Label as="div" className="font-medium px-4 mb-2">
          Sharing Permissions
        </RadioGroup.Label>
        <div className="rounded-md space-y-2 px-4 pb-4">
          {sharingOptions.map(setting => (
            <RadioGroup.Option
              key={setting.value}
              value={setting.value}
              className="relative flex items-center cursor-pointer focus:outline-none"
            >
              {({ active, checked }) => (
                <>
                  <span
                    className={classNames(
                      checked
                        ? 'bg-indigo-700 border-transparent'
                        : 'bg-gray-700 border-gray-500',
                      active
                        ? 'ring-2 ring-offset-2 ring-offset-[#1E1E1E] ring-indigo-600'
                        : '',
                      'h-4 w-4 mt-0.5 cursor-pointer rounded-full border flex items-center justify-center'
                    )}
                    aria-hidden="true"
                  >
                    <span
                      className={classNames(
                        'rounded-full w-1.5 h-1.5',
                        checked && 'bg-gray-200'
                      )}
                    />
                  </span>
                  <div className="ml-2 flex flex-col">
                    <RadioGroup.Label
                      as="span"
                      className={classNames(
                        checked ? 'text-gray-300' : 'text-gray-400',
                        'block text-sm font-medium'
                      )}
                    >
                      {setting.label}
                    </RadioGroup.Label>
                  </div>
                </>
              )}
            </RadioGroup.Option>
          ))}
        </div>
      </RadioGroup>
    </>
  );
};
