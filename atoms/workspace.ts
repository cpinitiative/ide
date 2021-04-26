import { atom } from 'jotai';

export const defaultPermissionAtom = atom<
  'READ_WRITE' | 'READ' | 'PRIVATE' | null
>(null);
export const userPermissionAtom = atom<'OWNER' | 'READ_WRITE' | 'READ' | null>(
  null
);
export const actualUserPermissionAtom = atom<
  'OWNER' | 'READ_WRITE' | 'READ' | 'PRIVATE' | null
>(get => get(userPermissionAtom) || get(defaultPermissionAtom));
