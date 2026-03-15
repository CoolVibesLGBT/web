import { atom } from 'jotai';

export interface GlobalState {
    notificationNextCursor: string | number | null;
    notificationPrevCursor: string | number | null;
    notifications: unknown[];

    vibesCursor: string | number | null
    nearByCursor: string | number | null;
    nearbyUsers: unknown[];
    vibes: unknown[]
    posts: unknown[];
    postsCursor: string | number | null;
    currentUserMapPosition: [number, number] | null;
}

export const globalState = atom<GlobalState>({
    notificationNextCursor: null,
    notificationPrevCursor: null,
    notifications: [],

    nearByCursor: null,
    nearbyUsers: [],
    posts: [],
    postsCursor: null,
    vibesCursor: null,
    vibes: [],
    currentUserMapPosition: null
});