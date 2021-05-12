import React, { Suspense } from 'react';
import { FirepadEditorProps } from './FirepadEditor';

const Editor = React.lazy(() => import('./FirepadEditor'));

export const LazyFirepadEditor = (props: FirepadEditorProps): JSX.Element => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Editor {...props} />
    </Suspense>
  );
};
