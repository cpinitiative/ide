import dynamic from 'next/dynamic';

export const LazyFirepadEditor = dynamic(
  () => import('../components/FirepadEditor'),
  {
    ssr: false,
  }
);
