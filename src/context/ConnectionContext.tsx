import {
  createContext,
  MutableRefObject,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import type firebaseType from 'firebase';
import invariant from 'tiny-invariant';
import firebase from 'firebase/app';
import { useUpdateAtom } from 'jotai/utils';

export type ConnectionContextType = {
  addConnectionRef: (ref: firebaseType.database.Reference) => void;
  removeConnectionRef: (ref: firebaseType.database.Reference) => void;
  getConnectionRefs: () => firebaseType.database.Reference[]; // used for firebase sign in
  clearConnectionRefs: () => void;
};

const ConnectionContext = createContext<ConnectionContextType | undefined>(
  undefined
);

export const ConnectionProvider = ({ children }: { children: ReactNode }) => {
  const isConnectedRef = useRef<boolean>(false);
  const connectionRefs = useRef<firebaseType.database.Reference[]>([]);
  const setFirebaseError = (e: any) =>
    alert('Error in ConnectionContext.tsx: ' + e?.message);

  const setRef = (ref: firebaseType.database.Reference) => {
    ref.onDisconnect().remove();
    ref.set(true);
  };

  useEffect(() => {
    const handleConnectionChange = (
      snap: firebaseType.database.DataSnapshot
    ) => {
      if (snap.val() === true) {
        isConnectedRef.current = true;
        connectionRefs.current.forEach(setRef);
      } else {
        isConnectedRef.current = false;
      }
    };
    const connectedRef = firebase.database().ref('.info/connected');
    connectedRef.on('value', handleConnectionChange, e => setFirebaseError(e));
    return () => connectedRef.off('value', handleConnectionChange);
  }, []);

  const contextValue = useMemo(() => {
    return {
      addConnectionRef: (ref: firebaseType.database.Reference) => {
        if (isConnectedRef.current) setRef(ref);
        connectionRefs.current.push(ref);
      },
      removeConnectionRef: (ref: firebaseType.database.Reference) => {
        ref.remove();
        connectionRefs.current = connectionRefs.current.filter(
          x => !x.isEqual(ref)
        );
      },
      getConnectionRefs: () => {
        return connectionRefs.current;
      },
      clearConnectionRefs: () => {
        connectionRefs.current.forEach(x => x.remove());
        connectionRefs.current = [];
      },
    };
  }, []);
  return (
    <ConnectionContext.Provider value={contextValue}>
      {children}
    </ConnectionContext.Provider>
  );
};

export function useConnectionContext() {
  const context = useContext(ConnectionContext);
  invariant(
    !!context,
    "Can't call useConnectionContext() outside of a ConnectionProvider"
  );
  return context;
}
