import { atom } from 'jotai';
import { createFeedState, type FeedState } from '@/state/feed';

export interface VibeItem {
  id: string;
  mediaUrl: string;
  mediaType: 'video' | 'image';
  posterUrl?: string;
  username: string;
  date_of_birth?: string;
  avatar?: string;
  description?: string;
  music?: string;
  likes?: number;
  comments?: number;
  author?: unknown;
}

export const vibesStateAtom = atom<FeedState<VibeItem>>(createFeedState<VibeItem>());
