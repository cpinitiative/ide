import { useEffect, useState } from 'react';
import type firebaseType from 'firebase';
import { useAtomValue, useUpdateAtom } from 'jotai/utils';
import { useEditorContext } from '../context/EditorContext';

export type User = {
  color: string;
  id: string;
  name: string;
  permission: 'OWNER' | 'READ_WRITE' | 'READ' | 'PRIVATE' | null;
  connections: { [key: string]: number };
};

export const isUserOnline = (user: User): boolean => {
  return Object.keys(user?.connections || {}).length > 0;
};

export function useOnlineUsers(): User[] | null {
  const { fileData } = useEditorContext();
  return Object.entries(fileData.users).map(
    ([userID, userData]) =>
      ({
        id: userID,
        ...userData,
      } as User) // note: this cast is needed because the type definition from useEditorContext isn't perfect. we should fix it
  );
}
