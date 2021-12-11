import { AppProps } from 'next/app';
import { SettingsProvider } from '../src/components/SettingsContext';
import { WorkspaceInitializer } from '../src/components/WorkspaceInitializer';
import 'tailwindcss/tailwind.css';
import '../src/styles/globals.css';
import '../src/styles/firepad.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <WorkspaceInitializer>
      <SettingsProvider>
        <Component {...pageProps} />
      </SettingsProvider>
    </WorkspaceInitializer>
  );
}

export default MyApp;
