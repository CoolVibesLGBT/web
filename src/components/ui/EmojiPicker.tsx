import { lazy, Suspense } from 'react';
const EmoticonPicker = lazy(() => import('@/features/emoticons/EmoticonPicker'));

/** Shared chat emoji picker for editors, forms and other application surfaces. */
export default function EmojiPicker({ onEmojiSelect, onClose = () => {}, presentation = 'inline', anchor }: {
  onEmojiSelect: (emoji: string) => void;
  onClose?: () => void;
  presentation?: 'inline' | 'sheet' | 'popover';
  anchor?: HTMLElement | null;
}) {
  return <Suspense fallback={null}><EmoticonPicker isOpen emojiOnly presentation={presentation} anchor={anchor} onClose={onClose} onSelect={item => { if (item.kind === 'emoji') onEmojiSelect(item.emoji); }} /></Suspense>;
}
