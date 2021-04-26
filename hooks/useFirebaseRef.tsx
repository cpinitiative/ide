import firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/analytics';
import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  useMemo,
} from 'react';
import { useRouter } from 'next/router';
import type firebaseType from 'firebase';
import animals from '../scripts/animals';
import colorFromUserId from '../scripts/colorFromUserId';

const firebaseConfig = {
  apiKey: 'AIzaSyDAYhsX5I8X1l_hu6AhBZx8prDdvY2i2EA',
  authDomain: 'live-cp-ide.firebaseapp.com',
  databaseURL: 'https://live-cp-ide.firebaseio.com',
  projectId: 'live-cp-ide',
  storageBucket: 'live-cp-ide.appspot.com',
  messagingSenderId: '350143604950',
  appId: '1:350143604950:web:3a5716645632d42def0177',
  measurementId: 'G-V2G3NLWBWF',
};

if (typeof window !== 'undefined') {
  // firepad needs access to firebase
  // @ts-ignore
  window.firebase = firebase;
}

if (!firebase.apps?.length) {
  firebase.initializeApp(firebaseConfig);
  if (typeof window !== 'undefined' && firebase.analytics) firebase.analytics();
}

export const FirebaseRefContext = createContext<
  | {
      docRef: firebaseType.database.Reference | null;
      userRef: firebaseType.database.Reference | null;
    }
  | undefined
>(undefined);

function getFirebaseRef(
  hash: string | null | undefined
): firebaseType.database.Reference {
  let ref = firebase.database().ref();
  if (hash) {
    ref = ref.child('-' + hash);
  } else {
    ref = ref.push(); // generate unique location.
    window.history.replaceState({}, '', '/' + ref.key!.substr(1));
  }
  return ref;
}

export const FirebaseRefProvider: React.FC = ({ children }) => {
  const router = useRouter();
  const [ref, setRef] = useState<firebaseType.database.Reference | null>(null);
  const [
    userRef,
    setUserRef,
  ] = useState<firebaseType.database.Reference | null>(null);

  useEffect(() => {
    if (!router.isReady) return;

    let ref;
    if (Array.isArray(router.query.id)) {
      ref = getFirebaseRef(router.query.id[0]);
    } else {
      ref = getFirebaseRef(router.query.id);
    }
    const userRef = ref.child('users').push();
    userRef.set({
      name: 'Anonymous ' + animals[Math.floor(animals.length * Math.random())],
      color: colorFromUserId(userRef.key),
    });

    setRef(ref);
    setUserRef(userRef);

    userRef.onDisconnect().remove();

    // we only want to run this once when the router is ready
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  const value = useMemo(() => ({ docRef: ref, userRef }), [ref, userRef]);

  return (
    <FirebaseRefContext.Provider value={value}>
      {children}
    </FirebaseRefContext.Provider>
  );
};

export const useFirebaseRef = (): firebaseType.database.Reference | null => {
  const ref = useContext(FirebaseRefContext);
  if (ref === undefined) {
    throw new Error(
      'useFirebaseRef() must be used inside a FirebaseRefProvider'
    );
  }
  return ref?.docRef;
};

export const useUserRef = (): firebaseType.database.Reference | null => {
  const ref = useContext(FirebaseRefContext);
  if (ref === undefined) {
    throw new Error('useUserRef() must be used inside a FirebaseRefProvider');
  }
  return ref?.userRef;
};
