import { Fragment } from 'react';
import { emojiArtwork, emojiPattern } from './emojiArtwork';
import './emoji.css';

/** Unicode remains in the DOM for accessible names and clipboard; art is platform independent. */
export default function Emoji({ children }: { children: string }) {
  const art = emojiArtwork(children);
  return art ? <span className="cv-emoji-art" style={art}>{children}</span> : <>{children}</>;
}
export function EmojiText({ children }: { children: string }) {
  const output = [];
  let cursor = 0;
  for (const match of children.matchAll(emojiPattern())) {
    const index = match.index!;
    if (index > cursor) output.push(<Fragment key={`text-${cursor}`}>{children.slice(cursor, index)}</Fragment>);
    output.push(<Emoji key={index}>{match[0]}</Emoji>);
    cursor = index + match[0].length;
  }
  if (cursor < children.length) output.push(<Fragment key={`text-${cursor}`}>{children.slice(cursor)}</Fragment>);
  return <>{output}</>;
}
