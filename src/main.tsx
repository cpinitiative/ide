import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { SettingsProvider } from './components/SettingsContext';
import { WorkspaceInitializer } from './components/WorkspaceInitializer';
import 'tailwindcss/tailwind.css';
import './styles/globals.css';
import './styles/firepad.css';

ReactDOM.render(
  <React.StrictMode>
    {/* Actually maybe workspace initializer should go inside App.tsx. Future todo I guess */}
    <WorkspaceInitializer>
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </WorkspaceInitializer>
  </React.StrictMode>,
  document.getElementById('root')
);
