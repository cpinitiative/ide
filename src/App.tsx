import React from 'react';
import { Router } from '@reach/router';

import EditorPage from './pages/EditorPage';
import CopyFilePage from './pages/CopyFilePage';
import DashboardPage from './pages/DashboardPage';
import CreateUSACO from './pages/CreateUSACO';

export default function App(): JSX.Element {
  return (
    <Router className="h-full">
      <CopyFilePage path="/:fileId/copy" />
      <EditorPage path="/:fileId" />
      <DashboardPage path="/" />
      <CreateUSACO path="/usaco/:_usacoId" />
    </Router>
  );
}
