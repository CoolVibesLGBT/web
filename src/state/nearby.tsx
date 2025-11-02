import { atom } from 'recoil';



export interface GlobalState {
    nearByCursor: string | number | null;
    nearbyUsers: any[];
    posts: any[];
    postsCursor: string | number | null;
}

export const globalState = atom<GlobalState>({
    key: 'globalState',
    default: {
        nearByCursor: null,
        nearbyUsers: [],
        posts: [],
        postsCursor:null,
    },
});