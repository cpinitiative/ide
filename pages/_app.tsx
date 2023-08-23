import { AppProps } from 'next/app';
import 'tailwindcss/tailwind.css';
import '../src/styles/globals.css';
import firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/auth';
import 'firebase/analytics';
import { ConnectionProvider } from '../src/context/ConnectionContext';
import { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/react';
import { UserProvider } from '../src/context/UserContext';
import { SHOULD_USE_FIREBASE_EMULATOR } from '../src/dev_constants';

const firebaseConfig = {
  apiKey: 'AIzaSyC2C7XWrCKcmM0RDAVZZHDQSxOlo6g3JTU',
  authDomain: 'cp-ide-2.firebaseapp.com',
  databaseURL: 'https://cp-ide-2-default-rtdb.firebaseio.com',
  projectId: 'cp-ide-2',
  storageBucket: 'cp-ide-2.appspot.com',
  messagingSenderId: '1010490112765',
  appId: '1:1010490112765:web:bd1ba8b522169c1eb45c94',
  measurementId: 'G-9C903QL4KZ',
};

if (!firebase.apps?.length) {
  if (SHOULD_USE_FIREBASE_EMULATOR) {
    firebase.initializeApp({
      ...firebaseConfig,
      authDomain: 'localhost:9099',
      databaseURL: 'http://localhost:9000/?ns=cp-ide-2-default-rtdb',
    });
    firebase.auth().useEmulator('http://localhost:9099');
    firebase.database().useEmulator('localhost', 9000);
  } else {
    firebase.initializeApp(firebaseConfig);
    if (typeof window !== 'undefined' && firebase.analytics) {
      firebase.analytics();
    }
  }
}

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Toaster position="bottom-right" />
      <UserProvider>
        <ConnectionProvider>
          <Component {...pageProps} />
        </ConnectionProvider>
      </UserProvider>
      <Analytics />
    </>
  );
}

export default MyApp;
