import dynamic from 'next/dynamic';
import React from 'react';
import { RealtimeEditorProps } from './RealtimeEditor';

const Editor = dynamic(() => import('./RealtimeEditor'), {
  loading: () => <div>Loading...</div>,
  ssr: false,
});

// `${fileId}.${firebaseRef.key}`;
export const LazyRealtimeEditor = (props: RealtimeEditorProps): JSX.Element => {
  return <Editor {...props} />;
};
