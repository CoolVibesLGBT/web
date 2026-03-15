import { useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  loading: boolean;
  hasNextPage: boolean;
  onLoadMore: () => void;
  root?: Element | null;
  rootMargin?: string;
  threshold?: number;
}

const useInfiniteScroll = ({
  loading,
  hasNextPage,
  onLoadMore,
  root = null,
  rootMargin = '0px',
  threshold = 1.0,
}: UseInfiniteScrollOptions) => {
  const observer = useRef<IntersectionObserver | null>(null);

  const lastElementRef = useCallback(
    (node: Element | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextPage && !loading) {
            onLoadMore();
          }
        },
        { root, rootMargin, threshold }
      );

      if (node) observer.current.observe(node);
    },
    [loading, hasNextPage, onLoadMore, root, rootMargin, threshold]
  );

  return lastElementRef;
};

export default useInfiniteScroll;
