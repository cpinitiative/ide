import type firebaseType from 'firebase';
import { useEffect, useMemo, useState } from 'react';

export default function useFirebaseState<T>(
  ref: firebaseType.database.Reference | null | undefined,
  defaultValue: T
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    if (!ref) {
      setValue(defaultValue);
      return;
    }
    const callback = (snapshot: firebaseType.database.DataSnapshot) => {
      const val = snapshot.val();
      setValue(val ?? defaultValue);
    };
    ref.on('value', callback);
    return () => ref.off('value', callback);
  }, [ref?.key]);

  const update = useMemo(() => {
    if (!ref) return () => {};

    return (value: T) => {
      ref.set(value);
    };
  }, [ref]);

  return useMemo(() => [value, update], [value, update]);
}
