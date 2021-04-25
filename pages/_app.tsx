import 'tailwindcss/tailwind.css';
import '../styles/globals.css';
import '../styles/firepad.css';
import { AppProps } from 'next/app';
import { SettingsProvider } from '../components/SettingsContext';
import { FirebaseRefProvider } from '../hooks/useFirebaseRef';

function MyApp({ Component, pageProps }: AppProps): JSX.Element {
  return (
    <FirebaseRefProvider>
      {/* Actually maybe this firebase provider should go inside [[...id]].tsx. Future todo I guess */}
      <SettingsProvider>
        <Component {...pageProps} />
      </SettingsProvider>
    </FirebaseRefProvider>
  );
}

export default MyApp;
