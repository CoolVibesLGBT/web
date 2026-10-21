// Adapted from tweb/components/ripple.ts:startRippleWave (GPL-3.0).
// Uses native pointer/keyboard events; application click handlers remain responsible for actions.
import { useEffect } from 'react';
import './ripple.css';

export default function RippleEffects() {
  useEffect(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const active = new Map<number, () => void>();
    const layers = new Set<HTMLElement>();
    const positioned = new Map<HTMLElement, { value: string; priority: string }>();
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const later = (callback: () => void, delay: number) => {
      const timer = setTimeout(() => { timers.delete(timer); callback(); }, delay);
      timers.add(timer);
    };
    const wave = (target: EventTarget | null, x?: number, y?: number) => {
      if (reduced.matches || !(target instanceof Element)) return;
      const host = target.closest<HTMLElement>('button, a[href], [role="button"], label.cv-list-row');
      if (!host || host.matches(':disabled, [aria-disabled="true"], [role="switch"], [data-ripple="off"]')) return;
      // Navigation re-renders replace className during the wave. Keep its containing
      // block inline so the still-running ripple cannot jump to the sidebar/page.
      if (getComputedStyle(host).position === 'static') {
        positioned.set(host, { value: host.style.getPropertyValue('position'), priority: host.style.getPropertyPriority('position') });
        host.style.setProperty('position', 'relative');
      }
      const rect = host.getBoundingClientRect();
      const clickX = x === undefined ? rect.width / 2 : x - rect.left;
      const clickY = y === undefined ? rect.height / 2 : y - rect.top;
      const radius = Math.hypot(Math.abs(clickY - rect.height / 2) + rect.height / 2, Math.abs(clickX - rect.width / 2) + rect.width / 2);
      const layer = document.createElement('span');
      layer.className = 'cv-ripple c-ripple';
      layer.setAttribute('aria-hidden', 'true');
      Object.assign(layer.style, { width: `${rect.width}px`, height: `${rect.height}px`, maxWidth: '100%', maxHeight: '100%' });
      const circle = document.createElement('span');
      circle.className = 'cv-ripple-circle c-ripple__circle';
      Object.assign(circle.style, { width: `${radius}px`, height: `${radius}px`, left: `${clickX - radius / 2}px`, top: `${clickY - radius / 2}px` });
      layer.append(circle);
      host.append(layer);
      layers.add(layer);
      const duration = parseFloat(getComputedStyle(layer).getPropertyValue('--ripple-duration')) * 1000;
      const started = performance.now();
      let ended = false;
      return () => {
        if (ended) return;
        ended = true;
        const elapsed = performance.now() - started;
        const delay = elapsed < duration ? Math.max(duration - elapsed, duration / 2) : duration / 2;
        later(() => circle.classList.add('hiding'), Math.max(0, delay - duration / 2));
        later(() => {
          layer.remove(); layers.delete(layer);
          if (!host.querySelector(':scope > .cv-ripple')) {
            const previous = positioned.get(host);
            if (previous && host.style.position === 'relative') {
              if (previous.value) host.style.setProperty('position', previous.value, previous.priority);
              else host.style.removeProperty('position');
            }
            positioned.delete(host);
          }
        }, delay);
      };
    };
    const press = (event: PointerEvent) => {
      if (event.button !== 0 || !event.isPrimary) return;
      active.get(event.pointerId)?.();
      const release = wave(event.target, event.clientX, event.clientY);
      if (release) active.set(event.pointerId, release);
    };
    const release = (event: PointerEvent) => { active.get(event.pointerId)?.(); active.delete(event.pointerId); };
    const key = (event: KeyboardEvent) => {
      if (event.repeat || !['Enter', ' '].includes(event.key)) return;
      if (event.target instanceof Element && event.target.matches('input, textarea, select, [contenteditable="true"]')) return;
      wave(event.target)?.();
    };
    const clear = () => { active.forEach(end => end()); active.clear(); };
    document.addEventListener('pointerdown', press, true);
    document.addEventListener('pointerup', release, true);
    document.addEventListener('pointercancel', release, true);
    document.addEventListener('scroll', clear, true);
    document.addEventListener('keydown', key, true);
    window.addEventListener('blur', clear);
    return () => {
      document.removeEventListener('pointerdown', press, true);
      document.removeEventListener('pointerup', release, true);
      document.removeEventListener('pointercancel', release, true);
      document.removeEventListener('scroll', clear, true);
      document.removeEventListener('keydown', key, true);
      window.removeEventListener('blur', clear);
      timers.forEach(clearTimeout);
      layers.forEach(layer => layer.remove());
      positioned.forEach((previous, host) => {
        if (host.style.position !== 'relative') return;
        if (previous.value) host.style.setProperty('position', previous.value, previous.priority);
        else host.style.removeProperty('position');
      });
    };
  }, []);
  return null;
}
