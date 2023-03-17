import { isUserOnline, User } from '../../hooks/useOnlineUsers';
import React, { Fragment, useState } from 'react';
import ReactDOM from 'react-dom';
import { Menu, Transition } from '@headlessui/react';
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid';
import classNames from 'classnames';
import { usePopper } from 'react-popper';
import { useUserContext } from '../../context/UserContext';
import useUserPermission from '../../hooks/useUserPermission';
import { useEditorContext } from '../../context/EditorContext';
import firebase from 'firebase/app';

export const permissionLabels: Record<string, string> = {
  OWNER: 'Owner',
  READ_WRITE: 'Read & Write',
  READ: 'View Only',
  PRIVATE: 'No Access',
};

export const UserListItem = ({ user }: { user: User }): JSX.Element | null => {
  const { userData } = useUserContext();
  const permission = useUserPermission();
  const { fileData } = useEditorContext();
  const defaultPermission = fileData.settings.defaultPermission;

  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(
    null
  );
  const [popperElement, setPopperElement] = useState<HTMLElement | null>(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: 'bottom-end',
  });

  if (!permission || !defaultPermission) return null;

  type PermissionUpdate = 'OWNER' | 'READ_WRITE' | 'READ' | 'DEFAULT';
  const handleUpdateUserPermission = (
    user: User,
    permission: PermissionUpdate
  ): void => {
    if (permission === 'DEFAULT') {
      firebase
        .database()
        .ref(`files/${fileData.id}`)
        .child('users')
        .child(user.id)
        .child('permission')
        .remove();
    } else {
      firebase
        .database()
        .ref(`files/${fileData.id}`)
        .child('users')
        .child(user.id)
        .update({
          permission,
        });
    }
  };

  return (
    <li key={user.id} className="py-2 flex">
      <span className="relative h-5 w-5">
        <span
          className="inline-block h-5 w-5 rounded"
          style={{ backgroundColor: user.color }}
        />
        <span className="absolute bottom-0 right-0 transform translate-y-1/3 translate-x-1/3 block rounded-full">
          <span
            className={`block h-3 w-3 rounded-full ${
              isUserOnline(user) ? 'bg-green-400' : 'bg-gray-400'
            }`}
          />
        </span>
      </span>
      <div className="ml-3 flex-1">
        <p
          className={`text-sm font-medium ${
            isUserOnline(user) ? 'text-gray-300' : 'text-gray-400'
          }`}
        >
          {user.name}
          {user.id === userData.id ? ' (Me)' : ''}
        </p>
        <p
          className={`text-sm ${
            isUserOnline(user) ? 'text-gray-400' : 'text-gray-500'
          }`}
        >
          {user.permission
            ? permissionLabels[user.permission]
            : `Default (${permissionLabels[defaultPermission]})`}
        </p>
      </div>

      {user.id !== userData.id && permission === 'OWNER' && (
        <Menu>
          {({ open }) => (
            <>
              <div>
                <Menu.Button
                  className="bg-[#1E1E1E] rounded-full flex items-center text-gray-500 hover:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1E1E1E] focus:ring-indigo-500"
                  ref={setReferenceElement}
                >
                  <span className="sr-only">Open options</span>
                  <EllipsisVerticalIcon
                    className="h-5 w-5"
                    aria-hidden="true"
                  />
                </Menu.Button>
              </div>

              <Transition show={open}>
                {ReactDOM.createPortal(
                  <Menu.Items as="div" static>
                    <div
                      ref={setPopperElement}
                      style={styles.popper}
                      {...attributes.popper}
                      className="relative"
                    >
                      <Transition.Child
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <div className="origin-top-right absolute right-0 bg-gray-800 rounded-md mt-2 w-48 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <div className="py-1">
                            {(
                              [
                                ['OWNER', 'Owner'],
                                ['READ_WRITE', 'Read & Write'],
                                ['READ', 'View Only'],
                                [
                                  'DEFAULT',
                                  `Default (${permissionLabels[defaultPermission]})`,
                                ],
                                ['PRIVATE', 'Blocked'],
                              ] as [PermissionUpdate, string][]
                            ).map(option => (
                              <Menu.Item key={option[0]}>
                                {({ active }) => (
                                  <button
                                    className={classNames(
                                      active
                                        ? 'bg-gray-700 text-gray-100'
                                        : 'text-gray-200',
                                      'w-full text-left block px-4 py-2 text-sm focus:outline-none'
                                    )}
                                    onClick={() =>
                                      handleUpdateUserPermission(
                                        user,
                                        option[0]
                                      )
                                    }
                                  >
                                    {option[1]}
                                  </button>
                                )}
                              </Menu.Item>
                            ))}
                          </div>
                        </div>
                      </Transition.Child>
                    </div>
                  </Menu.Items>,
                  document.body
                )}
              </Transition>
            </>
          )}
        </Menu>
      )}
    </li>
  );
};
