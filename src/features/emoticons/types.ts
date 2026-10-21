export type ChatEmoticon = { kind: 'sticker' | 'gif'; id: string; url: string; emoji?: string; width?: number; height?: number };
export type EmoticonSelection = { kind: 'emoji'; emoji: string } | ChatEmoticon;
export function normalizeEmoticon(value: unknown): ChatEmoticon | undefined {
  if (!value || typeof value !== 'object') return;
  const v = value as Record<string, unknown>;
  if (typeof v.id !== 'string' || typeof v.url !== 'string') return;
  if (v.kind === 'sticker' && !/^\/animations\/telegram\/(?:(?:assets\/[\w-]+|stickers\/[a-f0-9]{16})\.(?:json|tgs)|packs\/[a-f0-9]{16}\.(?:tgs|webp|webm))$/.test(v.url)) return;
  if (v.kind === 'gif') {
    if (!/^\/static\/telegram\/gifs\/[a-f0-9]{64}\.(?:mp4|gif)$/.test(v.url)) {
      try { const url = new URL(v.url); if (url.protocol !== 'https:' || !(url.hostname === 'media.tenor.com' || url.hostname.endsWith('.tenor.com')) || url.username || url.password || url.port) return; } catch { return; }
    }
  } else if (v.kind !== 'sticker') return;
  return { kind: v.kind, id: v.id, url: v.url, emoji: typeof v.emoji === 'string' ? v.emoji : undefined, width: typeof v.width === 'number' ? v.width : undefined, height: typeof v.height === 'number' ? v.height : undefined };
}
