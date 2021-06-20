import { atom } from 'jotai';
import { JudgeSuccessResult } from '../types/judge';

export const mobileActiveTabAtom = atom<'code' | 'io' | 'users'>('code');
export const showSidebarAtom = atom<boolean>(false);
export const judgeResultAtom = atom<JudgeSuccessResult | null>(null);
