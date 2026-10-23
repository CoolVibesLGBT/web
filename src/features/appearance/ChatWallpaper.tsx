import { useEffect, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { gradientPixels } from './gradient';
import type { ResolvedAppearance } from './model';
import './appearance.css';

export default function ChatWallpaper({ value, imageUrl, thumbnail = false }: { value?: ResolvedAppearance; imageUrl?: string | null; thumbnail?: boolean }) {
  const { palette, wallpaperImageUrl } = useTheme();
  const resolved = value ?? palette;
  const wp = resolved.wallpaper;
  const photo = imageUrl === undefined ? wallpaperImageUrl : imageUrl;
  const canvas = useRef<HTMLCanvasElement>(null);
  const key = wp.colors.join(',');
  const isPhoto = wp.kind === 'image' && !!photo;
  useEffect(() => {
    const element = canvas.current;
    const context = element?.getContext('2d', { alpha: false });
    if (!context || !element) return;
    const colors = key.split(',');
    const initialPhase = Math.round(wp.rotation / 45) % 8;
    const image = context.createImageData(50, 50);
    const paint = (phase: number, progress = 1) => {
      image.data.set(gradientPixels(colors, phase, progress));
      context.putImageData(image, 0, 0);
    };
    paint(initialPhase);
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const enabled = !thumbnail && !isPhoto && wp.kind === 'gradient' && wp.animated !== false && colors.length > 1;
    let frame = 0, elapsed = 0, lastTime = 0, lastPaint = 0;
    let visible = false;
    const tick = (time: number) => {
      if (lastTime) elapsed += Math.min(time - lastTime, 100);
      lastTime = time;
      if (time - lastPaint >= 1000 / 30) {
        const step = elapsed / 6000;
        const progress = step % 1;
        paint(((initialPhase - Math.floor(step) - 1) % 8 + 8) % 8, progress * progress * (3 - 2 * progress));
        lastPaint = time;
      }
      frame = requestAnimationFrame(tick);
    };
    const update = () => {
      cancelAnimationFrame(frame);
      lastTime = 0;
      const running = enabled && visible && !document.hidden && !reducedMotion.matches;
      element.dataset.motion = running ? 'running' : 'paused';
      if (running) frame = requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; update(); });
    observer.observe(element);
    reducedMotion.addEventListener('change', update);
    document.addEventListener('visibilitychange', update);
    update();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      reducedMotion.removeEventListener('change', update);
      document.removeEventListener('visibilitychange', update);
    };
  }, [key, wp.rotation, wp.kind, wp.animated, thumbnail, isPhoto]);
  const nightMask = !thumbnail && resolved.base === 'night' && wp.pattern && !isPhoto;
  // tweb background.tsx paints the wallpaper's colors before its canvas is ready.
  const background = nightMask ? '#000' : wp.colors.length === 1 ? wp.colors[0] : `linear-gradient(135deg, ${wp.colors.join(', ')})`;
  return <div className={`cv-chat-wallpaper${nightMask ? ' cv-chat-wallpaper-night' : ''}${resolved.base === 'tinted' ? ' cv-chat-wallpaper-tinted' : ''}`} style={{ background }} aria-hidden="true" data-wallpaper={isPhoto ? 'image' : wp.kind}>
    <canvas ref={canvas} width={50} height={50} style={{ opacity: nightMask ? Math.max(.3, wp.intensity / 200) : 1 }} />
    {isPhoto && <div className="cv-chat-wallpaper-photo" style={{ backgroundImage: `url("${photo}")`, filter: wp.blur ? 'blur(10px)' : undefined }} />}
    {wp.pattern && !isPhoto && <div className="cv-chat-wallpaper-pattern" style={{
      opacity: nightMask ? 1 : wp.intensity / 100,
      ...(wp.source ? nightMask ? { maskImage: `linear-gradient(#fff, #fff), url("${wp.source}")` } : { backgroundImage: `url("${wp.source}")` } : {}),
    }} />}
  </div>;
}
