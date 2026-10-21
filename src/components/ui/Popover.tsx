import { useLayoutEffect, useRef, type ReactNode } from 'react';

/** Browser-native nonmodal popup: outside press/Escape and focus remain native. */
export default function Popover({ anchor, onClose, children, label, className = '', align = 'start', widthRem = 23.875, heightRem = 26.25, autoHeight = false, manual = false }: {
  anchor?: HTMLElement | null; onClose: () => void; children: ReactNode; label: string;
  className?: string; align?: 'start' | 'end' | 'center'; widthRem?: number; heightRem?: number;
  autoHeight?: boolean; manual?: boolean;
}) {
  const element = useRef<HTMLDivElement>(null);
  const close = useRef(onClose); close.current = onClose;
  useLayoutEffect(() => {
    const popup = element.current;
    if (!popup) return;
    const position = () => {
      const viewport = window.visualViewport;
      const width = viewport?.width ?? innerWidth, height = viewport?.height ?? innerHeight;
      const offsetX = viewport?.offsetLeft ?? 0, offsetY = viewport?.offsetTop ?? 0;
      const box = anchor?.getBoundingClientRect();
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
      const w = Math.min(widthRem * rem, width - 16);
      const gap = .5 * rem, available = (box?.top ?? offsetY + height) - offsetY - gap - 8;
      const contentHeight = autoHeight ? popup.firstElementChild?.scrollHeight : 0;
      const h = Math.min(contentHeight || heightRem * rem, Math.max(96, available), height - 16);
      const rtl = getComputedStyle(popup).direction === 'rtl';
      const anchorLeft = box ? (align === 'center' ? box.left + (box.width - w) / 2 : (align === 'end') !== rtl ? box.right - w : box.left) : offsetX + (width - w) / 2;
      Object.assign(popup.style, {
        width: `${w}px`, left: `${Math.max(offsetX + 8, Math.min(anchorLeft, offsetX + width - w - 8))}px`,
        top: `${Math.max(offsetY + 8, (box?.top ?? offsetY + height) - h - gap)}px`,
        maxHeight: `${h}px`,
      });
      popup.style.setProperty('--picker-height', `${h}px`);
    };
    const toggle = (event: Event) => { if ((event as ToggleEvent).newState === 'closed') close.current(); };
    const outside = (event: PointerEvent) => { if (manual && event.target instanceof Node && !popup.contains(event.target) && !anchor?.contains(event.target)) close.current(); };
    const escape = (event: KeyboardEvent) => { if (manual && event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close.current(); } };
    position(); popup.showPopover();
    popup.addEventListener('toggle', toggle);
    window.addEventListener('resize', position);
    window.visualViewport?.addEventListener('resize', position);
    const observer = new ResizeObserver(position);
    if (anchor) observer.observe(anchor);
    observer.observe(popup);
    document.addEventListener('pointerdown', outside, true);
    document.addEventListener('keydown', escape, true);
    return () => { observer.disconnect(); popup.removeEventListener('toggle', toggle); if (popup.matches(':popover-open')) popup.hidePopover(); window.removeEventListener('resize', position); window.visualViewport?.removeEventListener('resize', position); document.removeEventListener('pointerdown', outside, true); document.removeEventListener('keydown', escape, true); };
  }, [anchor, align, widthRem, heightRem, autoHeight, manual]);
  return <div ref={element} popover={manual ? 'manual' : 'auto'} role="dialog" aria-label={label} className={`cv-native-popover ${className}`}>{children}</div>;
}
