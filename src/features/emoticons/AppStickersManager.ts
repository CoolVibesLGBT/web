// Document/pack/emoji indexing adapted from tweb appStickersManager.ts.
// Transport data contains public sticker assets only; custom emoji are a different catalog.
import emojiData from 'emoji-datasource-facebook/emoji.json';
import packs from './sticker-packs.json';
import type { ChatEmoticon } from './types';

export type StickerDocument = ChatEmoticon & { pack: string; format: string };
export const stickerSets = packs as { id: string; title: string; documents: StickerDocument[] }[];
export const STICKERS = stickerSets.flatMap(set => set.documents);
const fixEmoji = (value: string) => value.replace(/[\uFE0E\uFE0F]/gu, '').replace(/\p{Emoji_Modifier}/gu, '');
const documents = new Map(STICKERS.map(document => [document.id, document]));
const byEmoji = new Map<string, StickerDocument[]>();
for (const document of STICKERS) {
 const key = fixEmoji(document.emoji || '');
 if (key) byEmoji.set(key, [...byEmoji.get(key) || [], document]);
}
const keywords = emojiData as unknown as { unified: string; short_names: string[] }[];
export const stickerGroups = [
 { id: 'love', icon: 'stories_like', emojis: ['❤', '😍', '🥰', '😘', '💋', '💕', '💖'] },
 { id: 'like', icon: 'like', emojis: ['👍', '👌', '🤝', '💪', '👏', '😎'] },
 { id: 'dislike', icon: 'dislike', emojis: ['👎', '😡', '😠', '🤬', '😤', '😒'] },
 { id: 'party', icon: 'party', emojis: ['🎉', '🥳', '🎊', '💃', '🕺', '🍾', '🎂'] },
 { id: 'happy', icon: 'smile', emojis: ['😀', '😃', '😄', '😁', '😆', '😂', '🤣', '😊', '🙂'] },
 { id: 'sad', icon: 'animals', emojis: ['😢', '😭', '😞', '😔', '🥺', '😿'] },
] as const;

export const appStickersManager = {
 getDoc: (id: string) => documents.get(id),
 getStickerSets: () => stickerSets,
 getStickersByEmoticon(emoticon: string | readonly string[]) {
  return [...new Set((typeof emoticon === 'string' ? [emoticon] : emoticon).flatMap(emoji => byEmoji.get(fixEmoji(emoji)) || []))];
 },
 searchStickers(query: string) {
  const q = query.trim().toLocaleLowerCase();
  if (!q) return STICKERS;
  const emojis = keywords.filter(item => item.short_names.some(name => name.replace(/_/g, ' ').includes(q))).map(item => String.fromCodePoint(...item.unified.split('-').map(code => parseInt(code, 16))));
  const matches = new Set(this.getStickersByEmoticon(emojis).map(item => item.id));
  return STICKERS.filter(item => matches.has(item.id) || item.emoji?.includes(q) || `${item.pack} ${stickerSets.find(set => set.id === item.pack)?.title}`.toLocaleLowerCase().includes(q));
 },
};
export const stickerSuggestions = (emoji: string) => appStickersManager.getStickersByEmoticon(emoji).slice(0, 20);
