import { atom } from 'jotai';
import type firebaseType from 'firebase';
import { userNameAtom } from './userSettings';
import animals from '../scripts/animals';
import colorFromUserId from '../scripts/colorFromUserId';
import { defaultPermissionAtom } from './workspace';

export const firebaseUserAtom = atom<firebaseType.User | null>(null);
export const setFirebaseUserAtom = atom(
  null,
  (get, set, user: firebaseType.User | null) => {
    set(firebaseUserAtom, user);
    if (user) {
      let name =
        'Anonymous ' + animals[Math.floor(animals.length * Math.random())];
      if (!user.displayName) {
        user.updateProfile({ displayName: name });
      } else {
        name = user.displayName;
      }
      set(userNameAtom, name);
    } else {
      set(userNameAtom, null);
    }
  }
);
export const firebaseRefAtom = atom<firebaseType.database.Reference | null>(
  null
);
export const userRefAtom = atom<firebaseType.database.Reference | null>(null);

export const joinNewWorkspaceAsOwnerAtom = atom(null, (get, _set, _: void) => {
  const ref = get(firebaseRefAtom);
  const userRef = get(userRefAtom);
  const name = get(userNameAtom);
  if (!ref) throw new Error('ref must be set before workspace can be joined');
  if (!userRef || !userRef.key)
    throw new Error(
      'userRef (and userRef.key) must be set before workspace can be joined'
    );
  if (!name)
    throw new Error('user name must be set before workspace can be joined');
  return ref.update({
    [`users/${userRef.key}`]: {
      name,
      color: colorFromUserId(userRef.key),
      permission: 'OWNER',
    },
    settings: {
      defaultPermission: 'READ_WRITE',
    },
  });
});

export const joinExistingWorkspaceWithDefaultPermissionAtom = atom(
  null,
  (get, _set, _: void) => {
    const ref = get(firebaseRefAtom);
    const userRef = get(userRefAtom);
    const name = get(userNameAtom);
    const permission = get(defaultPermissionAtom);
    if (!ref) throw new Error('ref must be set before workspace can be joined');
    if (!userRef || !userRef.key)
      throw new Error(
        'userRef (and userRef.key) must be set before workspace can be joined'
      );
    if (!name)
      throw new Error('user name must be set before workspace can be joined');
    if (!permission)
      throw new Error('permission must be set before workspace can be joined');

    return userRef.once('value').then(snap => {
      if (permission === 'PRIVATE' && !snap.val()?.permission) {
        alert('This file is private.');
        window.location.href = '/';
      }
      if (!snap.val()?.name) {
        // first time on this doc, need to add to user list
        return userRef.update({
          name,
          color: colorFromUserId(userRef.key),
          permission,
        });
      } else {
        // update name as necessary
        if (snap.val().name !== name) {
          return userRef.child('name').set(name);
        }
      }
    });
  }
);
