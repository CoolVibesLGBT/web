import { ChatMediaImage, ChatMediaVideo } from './ProtectedChatMedia';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import TelegramIcon from './TelegramIcon';
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
  const dialogRef = useRef<HTMLDialogElement>(null);
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

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus({ preventScroll: true });

    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        const controls = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), video[controls]') ?? []);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      } else if (event.key === 'Escape') {
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
    <dialog ref={dialogRef} className="cv-chat-media-viewer"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={labels.title}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="cv-media-viewer-header">
        <div className="cv-media-viewer-title">{labels.title}{canNavigate && <span>{activeIndex + 1} / {items.length}</span>}</div>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label={labels.close}
          className="cv-media-viewer-button"
        >
          <TelegramIcon name="close" />
        </button>
      </div>

      {canNavigate && (
        <button
          type="button"
          onClick={() => setActiveIndex((index) => (index - 1 + items.length) % items.length)}
          aria-label={labels.previous}
          className="cv-media-viewer-button cv-media-viewer-previous"
        >
          <TelegramIcon name="arrow_prev" />
        </button>
      )}

      <div
        className="cv-media-viewer-stage"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {hasLoadError ? (
          <div className="cv-media-viewer-error">
            {labels.loadError}
          </div>
        ) : activeItem.kind === 'image' ? (
          <ChatMediaImage
            unavailable={<div className="cv-media-viewer-error">{labels.loadError}</div>}
            key={activeItem.src}
            src={activeItem.src}
            alt={activeItem.name}
            className="cv-media-viewer-image"
            draggable={false}
            onError={() => setHasLoadError(true)}
          />
        ) : (
          <ChatMediaVideo
            unavailable={<div className="cv-media-viewer-error">{labels.loadError}</div>}
            key={activeItem.src}
            src={activeItem.src}
            poster={activeItem.posterSrc}
            controls
            autoPlay
            playsInline
            className="cv-media-viewer-video"
            onError={() => setHasLoadError(true)}
          />
        )}
      </div>

      {canNavigate && (
        <button
          type="button"
          onClick={() => setActiveIndex((index) => (index + 1) % items.length)}
          aria-label={labels.next}
          className="cv-media-viewer-button cv-media-viewer-next"
        >
          <TelegramIcon name="arrow_next" />
        </button>
      )}
    </dialog>,
    document.body,
  );
};

export default ChatMediaViewer;
