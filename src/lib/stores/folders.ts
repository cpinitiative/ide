import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface Folder {
    id: string;
    name: string;
}

function createFoldersStore() {
    const initial: Folder[] = browser && localStorage.getItem('folders') ? JSON.parse(localStorage.getItem('folders')!) : [];
    const store = writable<Folder[]>(initial);
    store.subscribe((value) => {
        if (browser) localStorage.setItem('folders', JSON.stringify(value));
    });
    return store;
}

export const folders = createFoldersStore();