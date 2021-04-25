import firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/analytics';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import type firebaseType from 'firebase';

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

export const useFirebaseRef = () => {
  const router = useRouter();
  const [ref, setRef] = useState<firebaseType.database.Reference | null>(null);
  useEffect(() => {
    if (!router.isReady) return;

    // Since we're using [[...id]], it can actually be an array if the user does something dumb
    if (Array.isArray(router.query.id)) {
      setRef(getFirebaseRef(null));
    } else {
      setRef(getFirebaseRef(router.query.id));
    }
  }, [router.isReady]);
  return ref;
};
