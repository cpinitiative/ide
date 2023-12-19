import dynamic from 'next/dynamic';
import React from 'react';

const LazyMonacoEditor = dynamic(() => import('./MonacoEditor'), {
  loading: () => <div data-testid="monacoLoadingMessage">Loading...</div>,
  ssr: false,
});

export default LazyMonacoEditor;
