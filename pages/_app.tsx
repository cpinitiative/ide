import 'tailwindcss/tailwind.css';
import '../styles/globals.css';
import '../styles/firepad.css';
import { AppProps } from 'next/app';
import { SettingsProvider } from '../components/SettingsContext';
import { WorkspaceInitializer } from '../components/WorkspaceInitializer';

function MyApp({ Component, pageProps }: AppProps): JSX.Element {
  return (
    <WorkspaceInitializer>
      {/* Actually maybe workspace initializer should go inside [[...id]].tsx. Future todo I guess */}
      <SettingsProvider>
        <Component {...pageProps} />
      </SettingsProvider>
    </WorkspaceInitializer>
  );
}

export default MyApp;
