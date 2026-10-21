import originals from './greetings.json';
import type { ChatEmoticon } from '@/features/emoticons/types';

// tweb appStickersManager.getGreetingSticker: shuffle once, then rotate the queue.
const queue = originals.map(item => ({ ...item, kind: 'sticker' as const }));
for (let index = queue.length - 1; index > 0; index--) {
  const swap = Math.floor(Math.random() * (index + 1));
  [queue[index], queue[swap]] = [queue[swap], queue[index]];
}
export function nextGreeting(): ChatEmoticon {
  const sticker = queue.shift()!;
  queue.push(sticker);
  return sticker;
}
