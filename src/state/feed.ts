export type FeedCursor = string | number | null;

export interface FeedState<T> {
  items: T[];
  cursor: FeedCursor;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
}

export const createFeedState = <T,>(): FeedState<T> => ({
  items: [],
  cursor: null,
  hasMore: true,
  isLoading: true,
  isLoadingMore: false,
  error: null
});
