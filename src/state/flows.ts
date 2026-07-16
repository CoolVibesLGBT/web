import { atom } from 'jotai';
import type { ApiPost } from '@/features/post/Post';
import { createFeedState, type FeedState } from '@/state/feed';

export const flowsStateAtom = atom<FeedState<ApiPost>>(createFeedState<ApiPost>());
