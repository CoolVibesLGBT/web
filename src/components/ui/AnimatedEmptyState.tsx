import type { ReactNode } from 'react';
import StickerMedia from '@/features/emoticons/StickerMedia';
import './animated-empty-state.css';

// The same packaged TGS documents and player used in message history.
const stickers = {
  discover: 'c645f2da35041224',
  matches: '4fccb7cee6ad0f05',
  liked: '71ed35ffa1b2db08',
  passed: 'a267c1f3c56e2e00',
} as const;

export default function AnimatedEmptyState({ title, description, kind = 'discover', children, compact = false, inverse = false }: {
  title: string;
  description?: string;
  kind?: keyof typeof stickers;
  children?: ReactNode;
  compact?: boolean;
  inverse?: boolean;
}) {
  const id = stickers[kind];
  return <div className="cv-animated-empty" data-kind={kind} data-compact={compact || undefined} data-inverse={inverse || undefined}>
    <div className="cv-animated-empty-art" aria-hidden="true"><StickerMedia document={{kind: 'sticker', id, url: `/animations/telegram/packs/${id}.tgs`}} size={compact ? 80 : 144} /></div>
    <h3>{title}</h3>
    {description && <p>{description}</p>}
    {children && <div className="cv-animated-empty-actions">{children}</div>}
  </div>;
}
