import type firebaseType from 'firebase';
import { useState, useEffect } from 'react';

export default function useFirebaseRefValue<T>(
  ref: firebaseType.database.Reference | undefined
) {
  const [value, setValue] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!ref) {
      setIsLoading(false);
      setValue(null);
      return;
    }
    setIsLoading(true);
    setValue(null);

    const callback = (snapshot: firebaseType.database.DataSnapshot) => {
      setValue(snapshot.val());
    };
    ref.on('value', callback);

    return () => ref.off('value', callback);
  }, [ref?.key]);

  return {
    value,
    isLoading,
  };
}
