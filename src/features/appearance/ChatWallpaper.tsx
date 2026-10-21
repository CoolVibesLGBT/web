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
  useEffect(() => {
    const context = canvas.current?.getContext('2d', { alpha: false });
    if (!context) return;
    const image = context.createImageData(50, 50);
    image.data.set(gradientPixels(key.split(','), Math.round(wp.rotation / 45) % 8));
    context.putImageData(image, 0, 0);
  }, [key, wp.rotation]);
  const isPhoto = wp.kind === 'image' && !!photo;
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
