import { atom } from 'jotai';
import type firebaseType from 'firebase';

export const firebaseUserAtom = atom<firebaseType.User | null>(null);
