import dynamic from 'next/dynamic';
import React from 'react';

const LazyMonacoEditor = dynamic(() => import('./MonacoEditor'), {
  loading: () => <div data-testid="editorLoadingMessage">Loading...</div>,
  ssr: false,
});

export default LazyMonacoEditor;
