import { useEffect, useRef, useState, type ReactNode } from 'react';

/** A native button with a scroll-cancellable hold; a hold never also selects. */
export default function EmoticonTile({ children, label, className, onSelect, onHold, onHoldEnd }: {
  children: ReactNode; label: string; className: string; onSelect: () => void;
  onHold?: (element: HTMLButtonElement) => void; onHoldEnd?: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const origin = useRef({ x: 0, y: 0 });
  const held = useRef(false);
  const cancel = () => { clearTimeout(timer.current); timer.current = undefined; setPressed(false); onHoldEnd?.(); };
  useEffect(() => () => clearTimeout(timer.current), []);
  return <button type="button" className={className} aria-label={label} data-ripple="off" data-pressed={pressed || undefined}
    onPointerDown={event => {
      if (event.button !== 0) return;
      held.current = false; setPressed(true);
      origin.current = { x: event.clientX, y: event.clientY };
      const element = event.currentTarget;
      timer.current = setTimeout(() => { held.current = true; onHold?.(element); }, 450);
    }}
    onPointerMove={event => { if (Math.hypot(event.clientX - origin.current.x, event.clientY - origin.current.y) > 8) cancel(); }}
    onPointerUp={cancel} onPointerCancel={cancel} onPointerLeave={cancel}
    onContextMenu={event => { event.preventDefault(); event.stopPropagation(); clearTimeout(timer.current); if (!held.current) { held.current = true; onHold?.(event.currentTarget); } }}
    onClick={event => { if (held.current) { event.preventDefault(); held.current = false; return; } onSelect(); }}
  >{children}</button>;
}
