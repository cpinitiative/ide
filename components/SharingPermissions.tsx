import { RadioGroup } from '@headlessui/react';
import classNames from 'classnames';
import React, { useState } from 'react';
import { useFirebaseRef } from '../hooks/useFirebaseRef';

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
  const [value, setValue] = useState('READ_WRITE');
  const firebaseRef = useFirebaseRef();

  const handleChange = (newVal: string) => {
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
                    <span className="rounded-full bg-gray-200 w-1.5 h-1.5" />
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
