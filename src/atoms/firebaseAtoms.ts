import { atom } from 'jotai';
import type firebaseType from 'firebase';
import { userNameAtom } from './userSettings';
import animals from '../scripts/animals';
import colorFromUserId from '../scripts/colorFromUserId';
import { actualUserPermissionAtom, defaultPermissionAtom } from './workspace';
import firebase from 'firebase/app';

const baseFirebaseUserAtom = atom<firebaseType.User | null>(null);
export const firebaseUserAtom = atom(
  get => get(baseFirebaseUserAtom),
  (get, set, user: firebaseType.User | null) => {
    set(baseFirebaseUserAtom, user);
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

const baseFileIdAtom = atom<{
  id: string;
  /**
   * Whether or not this was a newly created file.
   *
   * This is used by WorkspaceInitializer.tsx as an optimization -- if this is a newly created file,
   * WorkspaceInitializer.tsx will immediately join the file as owner rather than waiting to retrieve
   * the file information before joining.
   */
  isNewFile: boolean;
} | null>(null);
export const fileIdAtom = atom(
  get => get(baseFileIdAtom),
  (
    get,
    set,
    {
      newId,
      isNewFile,
    }: {
      newId: string | null;
      isNewFile?: boolean;
    }
  ) => {
    let ref = firebase.database().ref();
    if (newId) {
      ref = ref.child('-' + newId);
      set(baseFileIdAtom, {
        id: newId,
        isNewFile: !!isNewFile,
      });
    } else {
      ref = ref.push(); // generate unique location.
      set(baseFileIdAtom, {
        id: ref.key!,
        isNewFile: !!isNewFile,
      });
    }
    if (isNewFile) {
      window.history.replaceState(
        {},
        '',
        '/' + ref.key!.substr(1) + window.location.search
      );
    }
    set(firebaseRefAtom, ref);
  }
);
fileIdAtom.onMount = setAtom => {
  const routes = window.location.pathname.split('/');
  let queryId = routes.length >= 1 ? routes[1] : null;

  // validate that queryId is a firebase key
  // todo improve: https://stackoverflow.com/questions/52850099/what-is-the-reg-expression-for-firestore-constraints-on-document-ids/52850529#52850529
  if (queryId?.length !== 19) {
    queryId = null;
  }

  setAtom({
    newId: queryId,
    isNewFile: !queryId,
  });
};

export const firebaseRefAtom = atom<firebaseType.database.Reference | null>(
  null
);
export const userRefAtom = atom<firebaseType.database.Reference | null>(null);
export const authenticatedFirebaseRefAtom = atom<firebaseType.database.Reference | null>(
  get => {
    const permission = get(actualUserPermissionAtom);
    const ref = get(firebaseRefAtom);
    if (
      permission === 'OWNER' ||
      permission === 'READ_WRITE' ||
      permission === 'READ'
    ) {
      return ref;
    }
    return null;
  }
);
export const authenticatedUserRefAtom = atom<firebaseType.database.Reference | null>(
  get => {
    const permission = get(actualUserPermissionAtom);
    const ref = get(userRefAtom);
    if (
      permission === 'OWNER' ||
      permission === 'READ_WRITE' ||
      permission === 'READ'
    ) {
      return ref;
    }
    return null;
  }
);

export const joinNewWorkspaceAsOwnerAtom = atom(
  null,
  async (get, _set, _: void) => {
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
    await ref.update({
      [`users/${userRef.key}`]: {
        name,
        color: colorFromUserId(userRef.key),
        permission: 'OWNER',
      },
      'settings/defaultPermission': 'READ_WRITE',
    });
  }
);

export const joinExistingWorkspaceWithDefaultPermissionAtom = atom(
  null,
  async (get, _set, _: void) => {
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

    await userRef
      .once('value')
      .then(snap => {
        if (permission === 'PRIVATE' && !snap.val()?.permission) {
          // file is private
          return;
        }
        if (!snap.val()?.name) {
          // first time on this doc, need to add to user list
          return userRef.update({
            name,
            color: colorFromUserId(userRef.key),
          });
        } else {
          // update name as necessary
          if (snap.val().name !== name) {
            return userRef.child('name').set(name);
          }
        }
      })
      .catch(e => {
        if (e.code === 'PERMISSION_DENIED') {
          // file is private
        } else {
          throw e;
        }
      });
  }
);

export const firebaseErrorAtom = atom<Error | null>(null);
export const setFirebaseErrorAtom = atom(null, (get, set, error: Error) => {
  set(firebaseErrorAtom, error);
  alert('Firebase error: ' + error + ' Report this issue on Github!');
  throw new Error(error.message);
});
