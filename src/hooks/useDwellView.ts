import { useCallback, useEffect, useRef, useState, type RefCallback } from 'react';

const viewedKeys = new Set<string>();
const STORAGE_PREFIX = 'coolvibes:dwell-view:';

const hasSessionView = (key: string) => {
  if (viewedKeys.has(key)) return true;
  if (typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(`${STORAGE_PREFIX}${key}`) === '1';
  } catch {
    return false;
  }
};

const markSessionView = (key: string) => {
  viewedKeys.add(key);
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(`${STORAGE_PREFIX}${key}`, '1');
  } catch {
    // Module-level dedupe remains available when storage is blocked.
  }
};

const clearSessionView = (key: string) => {
  viewedKeys.delete(key);
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  } catch {
    // Nothing else to clean up when storage is blocked.
  }
};

interface DwellViewOptions {
  key: string | null | undefined;
  enabled?: boolean;
  dwellMs?: number;
  minimumVisibleRatio?: number;
  minimumVisiblePixels?: number;
  onDwell: () => void | Promise<unknown>;
}

/**
 * Records a view only after a meaningful portion of the target has remained
 * visible for the dwell period. Time spent in a hidden browser tab never
 * counts. Keys are deduplicated for the current module and browser-tab session.
 */
export function useDwellView<T extends Element>({
  key,
  enabled = true,
  dwellMs = 1000,
  minimumVisibleRatio = 0.35,
  minimumVisiblePixels = 24_000,
  onDwell,
}: DwellViewOptions): RefCallback<T> {
  const [target, setTarget] = useState<T | null>(null);
  const onDwellRef = useRef(onDwell);

  useEffect(() => {
    onDwellRef.current = onDwell;
  }, [onDwell]);

  const targetRef = useCallback((node: T | null) => {
    setTarget(node);
  }, []);

  useEffect(() => {
    if (!enabled || !key || !target || typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      return;
    }
    if (hasSessionView(key)) return;

    let timer: number | null = null;
    let isVisibleEnough = false;
    let disposed = false;

    const clearTimer = () => {
      if (timer !== null) {
        window.clearTimeout(timer);
        timer = null;
      }
    };

    const isPageVisible = () => typeof document === 'undefined' || document.visibilityState === 'visible';

    const armTimer = () => {
      if (disposed || timer !== null || !isVisibleEnough || !isPageVisible() || hasSessionView(key)) return;
      timer = window.setTimeout(() => {
        timer = null;
        if (disposed || !isVisibleEnough || !isPageVisible() || hasSessionView(key)) return;

        markSessionView(key);
        try {
          Promise.resolve(onDwellRef.current()).catch(() => clearSessionView(key));
        } catch {
          clearSessionView(key);
        }
      }, dwellMs);
    };

    const observer = new IntersectionObserver((entries) => {
      const entry = entries.find((candidate) => candidate.target === target);
      if (!entry) return;

      const targetArea = Math.max(entry.boundingClientRect.width * entry.boundingClientRect.height, 0);
      const visibleArea = Math.max(entry.intersectionRect.width * entry.intersectionRect.height, 0);
      const requiredArea = Math.min(targetArea * minimumVisibleRatio, minimumVisiblePixels);
      isVisibleEnough = entry.isIntersecting && targetArea > 0 && visibleArea >= requiredArea;

      if (isVisibleEnough) armTimer();
      else clearTimer();
    }, {
      threshold: [0, 0.01, 0.025, 0.05, 0.1, 0.25, minimumVisibleRatio, 0.5, 0.75, 1]
        .filter((value, index, values) => value >= 0 && value <= 1 && values.indexOf(value) === index)
        .sort((a, b) => a - b),
    });

    const handleVisibilityChange = () => {
      if (isPageVisible()) armTimer();
      else clearTimer();
    };

    observer.observe(target);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      disposed = true;
      clearTimer();
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [dwellMs, enabled, key, minimumVisiblePixels, minimumVisibleRatio, target]);

  return targetRef;
}
