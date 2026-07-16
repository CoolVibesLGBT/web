import type { ApiPost } from './Post';

export interface TimelineResponse {
  posts?: ApiPost[];
  items?: ApiPost[];
  flows?: ApiPost[];
  cursor?: number | string | { next?: number | string | null } | null;
  next_cursor?: number | string | null;
  data?: {
    posts?: ApiPost[];
    items?: ApiPost[];
    flows?: ApiPost[];
    cursor?: number | string | { next?: number | string | null } | null;
    next_cursor?: number | string | null;
  };
}

export const isDeletedMarker = (value: unknown) => {
  if (!value) return false;
  if (typeof value === 'string' && value.startsWith('0001-01-01')) return false;
  return true;
};

export const filterDeletedPosts = (items: ApiPost[]) => items.filter((post) => !isDeletedMarker(post.deleted_at));

export const getTimelinePosts = (response: TimelineResponse): ApiPost[] => {
  const posts =
    response?.posts ??
    response?.items ??
    response?.flows ??
    response?.data?.posts ??
    response?.data?.items ??
    response?.data?.flows ??
    [];
  return Array.isArray(posts) ? posts : [];
};

export const getTimelineCursor = (response: TimelineResponse): string | number | null => {
  const cursorValue =
    response?.next_cursor ??
    (typeof response?.cursor === 'object' ? response?.cursor?.next : response?.cursor) ??
    response?.data?.next_cursor ??
    (typeof response?.data?.cursor === 'object' ? response?.data?.cursor?.next : response?.data?.cursor) ??
    null;
  return cursorValue ?? null;
};

export const hasUsableTimelineCursor = (cursor: string | number | null) => {
  const value = cursor !== null && cursor !== undefined ? String(cursor) : '';
  return value !== '' && value !== '0' && value !== 'null' && value !== 'undefined';
};

export const withTimeout = <T,>(promise: Promise<T>, ms: number) => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return new Promise<T>((resolve, reject) => {
    timer = setTimeout(() => {
      reject(new Error('request_timeout'));
    }, ms);
    promise
      .then((value) => {
        if (timer) clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        if (timer) clearTimeout(timer);
        reject(error);
      });
  });
};
