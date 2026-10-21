import { useLayoutEffect, useRef } from 'react';
import StickerMedia from './StickerMedia';
import type { ChatEmoticon } from './types';

/** tweb mediaPeek: viewport layer, transparent media, release-to-close. */
export default function StickerPreview({ document: sticker, onClose }: { document: ChatEmoticon; onClose: () => void }) {
 const element = useRef<HTMLDivElement>(null);
 const close = useRef(onClose); close.current = onClose;
 useLayoutEffect(() => {
  const overlay = element.current;
  if (!overlay) return;
  overlay.showPopover();
  const release = () => close.current();
  const key = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); close.current(); } };
  document.addEventListener('pointerup', release, true);
  document.addEventListener('pointercancel', release, true);
  document.addEventListener('keydown', key, true);
  window.addEventListener('blur', release);
  return () => { document.removeEventListener('pointerup', release, true); document.removeEventListener('pointercancel', release, true); document.removeEventListener('keydown', key, true); window.removeEventListener('blur', release); if (overlay.matches(':popover-open')) overlay.hidePopover(); };
 }, []);
 const size = Math.round(Math.min(innerWidth * .8, innerHeight * .65, 420));
 return <div ref={element} popover="manual" className="cv-sticker-preview" aria-hidden="true"><StickerMedia key={sticker.id} document={sticker} size={size} /></div>;
}
