import { RadioGroup } from '@headlessui/react';
import classNames from 'classnames';
import React from 'react';

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

export const SharingPermissions = ({
  value,
  onChange,
  isOwner,
}: {
  value: string;
  onChange: (newVal: string) => void;
  isOwner: boolean;
}): JSX.Element => {
  return (
    <>
      <RadioGroup value={value} onChange={onChange} disabled={!isOwner}>
        <RadioGroup.Label as="div" className="font-medium mb-2">
          Sharing Permissions
        </RadioGroup.Label>
        <div className="rounded-md space-y-2">
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
                        ? 'bg-indigo-600 border-transparent'
                        : 'bg-white border-gray-300',
                      active ? 'ring-2 ring-offset-2 ring-indigo-500' : '',
                      'h-4 w-4 mt-0.5 cursor-pointer rounded-full border flex items-center justify-center'
                    )}
                    aria-hidden="true"
                  >
                    <span className="rounded-full bg-white w-1.5 h-1.5" />
                  </span>
                  <div className="ml-2 flex flex-col">
                    <RadioGroup.Label
                      as="span"
                      className={classNames(
                        checked ? 'text-gray-800' : 'text-gray-600',
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
