import { writable } from 'svelte/store';
import { browser } from '$app/environment';

type FileFolderMap = Record<string, string | null>;

function createFileFolderMapStore() {
  const initial: FileFolderMap = browser && localStorage.getItem('fileFolderMap')
    ? JSON.parse(localStorage.getItem('fileFolderMap')!)
    : {};
  const store = writable<FileFolderMap>(initial);
  store.subscribe((value) => {
    if (browser) localStorage.setItem('fileFolderMap', JSON.stringify(value));
  });
  return store;
}

export const fileFolderMap = createFileFolderMapStore();
