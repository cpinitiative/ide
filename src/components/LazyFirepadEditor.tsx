import dynamic from 'next/dynamic';
import React from 'react';
import { FirepadEditorProps } from './FirepadEditor';

const Editor = dynamic(() => import('./FirepadEditor'), {
  loading: () => <div>Loading...</div>,
  ssr: false,
});

export const LazyFirepadEditor = (props: FirepadEditorProps): JSX.Element => {
  return <Editor {...props} />;
};
