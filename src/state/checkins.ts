import { atom } from 'jotai';
import type { ApiPost } from '@/features/post/Post';
import { createFeedState, type FeedState } from '@/state/feed';
import { api } from '@/services/api';

export const checkinsStateAtom = atom<FeedState<ApiPost>>(createFeedState<ApiPost>());

export const fetchCheckinsAtom = atom(
  null,
  async (_get, set, params?: { limit?: number }) => {
    set(checkinsStateAtom, (prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = (await api.fetchCheckIns({ limit: params?.limit ?? 50 })) as {
        posts?: ApiPost[];
        cursor?: string | number | null;
      };
      const incomingPosts = Array.isArray(response?.posts) ? response.posts : [];
      const cursorValue = response?.cursor != null ? String(response.cursor) : '';
      const hasMorePosts = cursorValue !== '' && cursorValue !== '0' && cursorValue !== 'null' && cursorValue !== 'undefined';

      set(checkinsStateAtom, (prev) => ({
        ...prev,
        items: incomingPosts,
        cursor: cursorValue !== '' ? cursorValue : null,
        hasMore: hasMorePosts,
        isLoading: false,
        isLoadingMore: false,
        error: null,
      }));
    } catch (error) {
      console.error('Error fetching check-ins:', error);
      set(checkinsStateAtom, (prev) => ({
        ...prev,
        error: 'Failed to load check-ins. Please try again.',
        isLoading: false,
        isLoadingMore: false,
      }));
    }
  }
);
