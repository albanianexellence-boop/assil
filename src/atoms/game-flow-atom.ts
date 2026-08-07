import { atom } from 'jotai';

export const hasSpunWheelAtom = atom<boolean>(false);
export const claimedPrizeAtom = atom<string | null>(null);
export const accountCreatedAtom = atom<boolean>(false);

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: 'admin' | 'user';
  prize?: string;
  timestamp?: string;
  isBanned?: boolean;
}

export const loggedInUserAtom = atom<User | null>(null);
