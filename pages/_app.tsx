import { AppProps } from 'next/app';
import { SettingsProvider } from '../src/components/SettingsContext';
import { WorkspaceInitializer } from '../src/components/WorkspaceInitializer';
import 'tailwindcss/tailwind.css';
import '../src/styles/globals.css';
import '../src/styles/firepad.css';
import firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/auth';
import 'firebase/analytics';
import { ConnectionProvider } from '../src/context/ConnectionContext';
import { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/react';

const firebaseConfig = {
  apiKey: 'AIzaSyBlzBGNIqAQSOjHZ1V7JJxZ3Nw70ld2EP0',
  authDomain: 'cp-ide.firebaseapp.com',
  databaseURL: 'https://cp-ide-default-rtdb.firebaseio.com',
  projectId: 'cp-ide',
  storageBucket: 'cp-ide.appspot.com',
  messagingSenderId: '1068328460784',
  appId: '1:1068328460784:web:9385b3f43a0e2604a9fd35',
  measurementId: 'G-G22TZ5YCKV',
};

if (typeof window !== 'undefined') {
  // firepad needs access to firebase
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  window.firebase = firebase;
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const shouldUseEmulator =
  typeof window !== 'undefined' && location.hostname === 'localhost' && true;

if (!firebase.apps?.length) {
  if (shouldUseEmulator) {
    firebase.initializeApp({
      ...firebaseConfig,
      authDomain: 'localhost:9099',
      databaseURL: 'http://localhost:9000/?ns=cp-ide-default-rtdb',
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
      <ConnectionProvider>
        <WorkspaceInitializer>
          <SettingsProvider>
            <Component {...pageProps} />
          </SettingsProvider>
        </WorkspaceInitializer>
      </ConnectionProvider>
      <Analytics />
    </>
  );
}

export default MyApp;
