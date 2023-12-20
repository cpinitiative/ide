import dynamic from 'next/dynamic';
import React from 'react';

const LazyCodemirrorEditor = dynamic(() => import('./CodemirrorEditor'), {
  loading: () => <div data-testid="editorLoadingMessage">Loading...</div>,
  ssr: false,
});

export default LazyCodemirrorEditor;
