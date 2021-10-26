import { RadioGroup } from '@headlessui/react';
import classNames from 'classnames';
import React from 'react';

export function RadioGroupContents<T>({
  title,
  value,
  onChange,
  options,
  disabled,
  lightMode,
}: {
  title: string;
  value: T | null;
  onChange: (newVal: T) => void;
  options: {
    label: string;
    value: T;
  }[];
  disabled?: boolean;
  lightMode?: boolean;
}): JSX.Element {
  return (
    <RadioGroup value={value} onChange={onChange} disabled={disabled}>
      <RadioGroup.Label
        as="div"
        className={classNames(
          'font-medium mb-2',
          lightMode ? 'text-white' : ''
        )}
      >
        {title}
      </RadioGroup.Label>
      <div className="rounded-md space-y-2">
        {options.map(setting => (
          <RadioGroup.Option
            key={setting.label}
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
                      checked
                        ? lightMode
                          ? 'text-gray-200'
                          : 'text-gray-800'
                        : lightMode
                        ? 'text-gray-400'
                        : 'text-gray-600',
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
  );
}

const sharingOptions = [
  {
    label: 'Public Read & Write',
    value: 'READ_WRITE',
  },
  {
    label: 'Public View Only',
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
  lightMode,
}: {
  value: string | null;
  onChange: (newVal: string) => void;
  isOwner: boolean;
  lightMode?: boolean;
}): JSX.Element => {
  return (
    <RadioGroupContents
      title="Default Sharing Permissions"
      value={value}
      onChange={onChange}
      disabled={!isOwner}
      options={sharingOptions}
      lightMode={lightMode}
    />
  );
};
