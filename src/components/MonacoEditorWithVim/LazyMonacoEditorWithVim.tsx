import dynamic from 'next/dynamic';
import React from 'react';

const LazyMonacoEditorWithVim = dynamic(() => import('./EditorWithVim'), {
  loading: () => <div>Loading...</div>,
  ssr: false,
});

export default LazyMonacoEditorWithVim;
