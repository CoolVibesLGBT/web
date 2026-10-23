import { useState } from 'react';
import LottieAnimation from '@/features/animations/LottieAnimation';
import TelegramIcon from '@/features/chat/TelegramIcon';
import type { ChatEmoticon } from './types';

/** One document renderer for picker, suggestions, preview and message history. */
export default function StickerMedia({ document, size = 72, onReady }: { document: ChatEmoticon; size?: number; onReady?: () => void }) {
 const [failed, setFailed] = useState(false);
 if (failed) return <span className="cv-sticker-unavailable" style={{ width: size, height: size }}><TelegramIcon name="stickers_face" /></span>;
 const path = document.url.split(/[?#]/, 1)[0].toLowerCase();
 if (/\.(tgs|json)$/.test(path)) return <LottieAnimation src={document.url} size={size} onReady={onReady} onError={() => setFailed(true)} />;
 if (/\.webm$/.test(path)) return <video className="cv-sticker-media" src={document.url} width={size} height={size} style={{ width: size, height: size }} autoPlay loop muted playsInline preload="metadata" onError={() => setFailed(true)} />;
 return <img className="cv-sticker-media" src={document.url} width={size} height={size} style={{ width: size, height: size }} alt="" loading="lazy" draggable={false} onError={() => setFailed(true)} />;
}
