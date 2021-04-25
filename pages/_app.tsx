import 'tailwindcss/tailwind.css';
import '../styles/globals.css';
import '../styles/firepad.css';
import { AppProps } from 'next/app';
import { SettingsProvider } from '../components/SettingsContext';

function MyApp({ Component, pageProps }: AppProps): JSX.Element {
  return (
    <SettingsProvider>
      <Component {...pageProps} />
    </SettingsProvider>
  );
}

export default MyApp;
