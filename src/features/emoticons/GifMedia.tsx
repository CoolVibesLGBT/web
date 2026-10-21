import { useEffect, useRef } from 'react';
import { serviceURL } from '@/appSettings';
import type { ChatEmoticon } from './types';

export default function GifMedia({ document: gif, className = '' }: { document: ChatEmoticon; className?: string }) {
 const video = useRef<HTMLVideoElement>(null);
 const src = gif.url.startsWith('/static/telegram/gifs/') ? new URL(gif.url, serviceURL[0] || location.origin).href : gif.url;
 useEffect(() => {
  const element = video.current; if (!element) return;
  let visible = false;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const sync = () => { if (visible && !document.hidden && !motion.matches) void element.play().catch(() => {}); else element.pause(); };
  const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }); observer.observe(element);
  document.addEventListener('visibilitychange', sync); motion.addEventListener('change', sync);
  return () => { observer.disconnect(); element.pause(); document.removeEventListener('visibilitychange', sync); motion.removeEventListener('change', sync); };
 }, [src]);
 return /\.mp4$/.test(gif.url) ? <video ref={video} className={className} src={src} loop muted playsInline preload="metadata" width={gif.width} height={gif.height} /> : <img className={className} src={src} alt="" loading="lazy" draggable={false} />;
}
