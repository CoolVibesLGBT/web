import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { ResolvedChatMedia } from './chatMedia';

interface ChatMediaViewerLabels {
  close: string;
  next: string;
  previous: string;
  title: string;
  loadError: string;
}

interface ChatMediaViewerProps {
  items: ResolvedChatMedia[];
  initialIndex: number;
  labels: ChatMediaViewerLabels;
  onClose: () => void;
}

const ChatMediaViewer: React.FC<ChatMediaViewerProps> = ({
  items,
  initialIndex,
  labels,
  onClose,
}) => {
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, initialIndex));
  const [hasLoadError, setHasLoadError] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const activeItem = items[activeIndex];
  const canNavigate = items.length > 1;

  useEffect(() => {
    setActiveIndex(Math.min(Math.max(0, initialIndex), Math.max(0, items.length - 1)));
  }, [initialIndex, items.length]);

  useEffect(() => {
    if (!activeItem) {
      onClose();
      return;
    }
    setHasLoadError(false);
  }, [activeItem, onClose]);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus({ preventScroll: true });

    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      } else if (event.key === 'ArrowLeft' && canNavigate) {
        event.preventDefault();
        setActiveIndex((index) => (index - 1 + items.length) % items.length);
      } else if (event.key === 'ArrowRight' && canNavigate) {
        event.preventDefault();
        setActiveIndex((index) => (index + 1) % items.length);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [canNavigate, items.length, onClose]);

  if (!activeItem || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/95 p-2 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label={labels.title}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-5">
        <div className="pointer-events-auto rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-xl">
          {activeIndex + 1} / {items.length}
        </div>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label={labels.close}
          className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white shadow-xl backdrop-blur-xl transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {canNavigate && (
        <button
          type="button"
          onClick={() => setActiveIndex((index) => (index - 1 + items.length) % items.length)}
          aria-label={labels.previous}
          className="absolute left-2 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white shadow-xl backdrop-blur-xl transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-5"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      <div
        className="flex h-full w-full items-center justify-center px-10 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-14 sm:px-16 sm:pt-16"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {hasLoadError ? (
          <div className="max-w-sm rounded-2xl border border-white/15 bg-white/10 px-5 py-4 text-center text-sm font-medium text-white/85 backdrop-blur-xl">
            {labels.loadError}
          </div>
        ) : activeItem.kind === 'image' ? (
          <img
            key={activeItem.src}
            src={activeItem.src}
            alt={activeItem.name}
            className="max-h-full max-w-full select-none object-contain shadow-2xl"
            draggable={false}
            onError={() => setHasLoadError(true)}
          />
        ) : (
          <video
            key={activeItem.src}
            src={activeItem.src}
            poster={activeItem.posterSrc}
            controls
            autoPlay
            playsInline
            className="max-h-full max-w-full bg-black object-contain shadow-2xl"
            onError={() => setHasLoadError(true)}
          />
        )}
      </div>

      {canNavigate && (
        <button
          type="button"
          onClick={() => setActiveIndex((index) => (index + 1) % items.length)}
          aria-label={labels.next}
          className="absolute right-2 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white shadow-xl backdrop-blur-xl transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-5"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}
    </div>,
    document.body,
  );
};

export default ChatMediaViewer;
