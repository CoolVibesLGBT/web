import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import MessageActionsMenu, { type MessageAction } from './MessageActionsMenu';

/** Viewport-positioned menu shared by virtualized rows; it cannot be clipped by a scroller. */
export default function FloatingContextMenu({ point, actions, label, onClose }: {
  point: { x: number; y: number }; actions: MessageAction[]; label: string; onClose: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const close = useRef(onClose); close.current = onClose;
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  useLayoutEffect(() => {
    const menu = root.current;
    if (!menu) return;
    const place = () => {
      const viewport = visualViewport, left = viewport?.offsetLeft ?? 0, top = viewport?.offsetTop ?? 0;
      const width = viewport?.width ?? innerWidth, height = viewport?.height ?? innerHeight;
      const x = Math.max(left + 8, Math.min(point.x, left + width - menu.offsetWidth - 8));
      const y = Math.max(top + 8, Math.min(point.y, top + height - menu.offsetHeight - 8));
      setPosition(previous => previous?.x === x && previous.y === y ? previous : { x, y });
    };
    const outside = (event: PointerEvent) => { if (event.target instanceof Node && !menu.contains(event.target)) close.current(); };
    const scroll = (event: Event) => { if (event.target instanceof Node && !menu.contains(event.target)) close.current(); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); close.current(); } };
    place();
    const focus = setTimeout(() => menu.focus({ preventScroll: true }), 0);
    document.addEventListener('pointerdown', outside, true); document.addEventListener('scroll', scroll, true); document.addEventListener('keydown', escape);
    window.addEventListener('resize', place); visualViewport?.addEventListener('resize', place);
    const observer = new ResizeObserver(place); observer.observe(menu);
    return () => { clearTimeout(focus); observer.disconnect(); document.removeEventListener('pointerdown', outside, true); document.removeEventListener('scroll', scroll, true); document.removeEventListener('keydown', escape); window.removeEventListener('resize', place); visualViewport?.removeEventListener('resize', place); };
  }, [point]);
  return createPortal(<MessageActionsMenu ref={root} actions={actions} label={label} position={position} />, document.body);
}
