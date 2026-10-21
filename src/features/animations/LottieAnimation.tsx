import { useEffect, useRef, useState } from 'react';
import { createAnimationPlayer } from './player';

export default function LottieAnimation({ src, size = 160, className = '', autoplay = true, onReady, onError }: {
  src: string; size?: number; className?: string; autoplay?: boolean; onReady?: () => void; onError?: () => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const ready = useRef(onReady); ready.current = onReady;
  const error = useRef(onError); error.current = onError;
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    let alive = true, visible = false;
    let player: Awaited<ReturnType<typeof createAnimationPlayer>> | undefined;
    let loading: Promise<void> | undefined;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      if (visible && !document.hidden && autoplay && !motion.matches) player?.play();
      else player?.pause();
    };
    const observer = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (visible && !loading) {
        const ratio = Math.min(devicePixelRatio || 1, 2);
        element.width = element.height = Math.round(size * ratio);
        loading = createAnimationPlayer(src, element).then(async result => {
          if (!alive) { await result.destroy(); return; }
          player = result; element.dataset.ready = 'true'; ready.current?.(); sync();
        }).catch(() => { if (alive) { setFailed(true); error.current?.(); } });
      }
      sync();
    });
    observer.observe(element);
    document.addEventListener('visibilitychange', sync);
    motion.addEventListener('change', sync);
    return () => { alive = false; observer.disconnect(); document.removeEventListener('visibilitychange', sync); motion.removeEventListener('change', sync); void player?.destroy(); };
  }, [src, size, autoplay]);
  return <canvas ref={canvas} className={`cv-lottie ${className}`} width={size} height={size} style={{ width: size, height: size, maxWidth: '100%', objectFit: 'contain' }} aria-hidden="true" data-animation={src} data-failed={failed || undefined} />;
}
