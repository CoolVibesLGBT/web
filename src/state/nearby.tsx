import { atom } from 'jotai';

export interface GlobalState {
    nearByCursor: string | number | null;
    nearbyUsers: any[];
    posts: any[];
    postsCursor: string | number | null;
}

export const globalState = atom<GlobalState>({
    nearByCursor: null,
    nearbyUsers: [],
    posts: [],
    postsCursor: null,
});