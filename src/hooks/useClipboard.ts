import { useCallback, useEffect, useRef, useState } from 'react';

/** A copy succeeds only after the browser confirms it; feedback replaces itself and expires. */
export default function useClipboard() {
 const [status, setStatus] = useState<'copied' | 'failed' | null>(null);
 const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined), request = useRef(0);
 useEffect(() => () => { clearTimeout(timer.current); request.current++; }, []);
 const reset = useCallback(() => { clearTimeout(timer.current); request.current++; setStatus(null); }, []);
 const copy = useCallback(async (text: string) => {
  const current = ++request.current; clearTimeout(timer.current); setStatus(null);
  let copied = false;
  try { if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); copied = true; } } catch { /* Older/nonsecure browsers can still support gesture-based copy. */ }
  if (request.current !== current) return false;
  if (!copied) {
   const focused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
   const selection = window.getSelection();
   const ranges = selection ? Array.from({ length: selection.rangeCount }, (_, index) => selection.getRangeAt(index).cloneRange()) : [];
   const field = document.createElement('textarea'); field.value = text; field.readOnly = true; field.tabIndex = -1;
   Object.assign(field.style, { position: 'fixed', inset: '0', opacity: '0', pointerEvents: 'none', width: '1px', height: '1px' });
   document.body.append(field); field.select();
   try { copied = document.execCommand('copy'); } catch { copied = false; }
   field.remove(); focused?.focus({ preventScroll: true });
   if (selection) { selection.removeAllRanges(); ranges.forEach(range => selection.addRange(range)); }
  }
  if (request.current === current) { setStatus(copied ? 'copied' : 'failed'); timer.current = setTimeout(() => setStatus(null), copied ? 2200 : 4000); }
  return copied;
 }, []);
 return { copy, status, reset };
}
