import data from 'emoji-datasource-facebook/emoji.json';
import availableArtwork from './emojiManifest.json';

interface Entry { unified: string; non_qualified?: string | null; skin_variations?: Record<string, Entry> }
const known = new Set<string>();
const unicode = (value: string) => String.fromCodePoint(...value.split('-').map(code => parseInt(code, 16)));
for (const item of data as Entry[]) {
  for (const variant of [item, ...Object.values(item.skin_variations ?? {})]) {
    known.add(unicode(variant.unified));
    if (variant.non_qualified) known.add(unicode(variant.non_qualified));
  }
}
// Longest sequences first so flags, skin tones and ZWJ families stay a single image.
const pattern = [...known].sort((a, b) => b.length - a.length).map(value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
export const emojiPattern = () => new RegExp(pattern, 'gu');

// Apple draws its own color emoji glyphs natively (tweb's approach): let the system
// font render them there instead of swapping in a raster image over crisp vector art.
const IS_EMOJI_NATIVE = typeof navigator !== 'undefined' && /OS X|iPhone|iPad|iOS/i.test(navigator.userAgent);

const artwork = new Set(availableArtwork as string[]);
// Matches tweb's filename scheme: lowercase hex code points, dash-joined, VS16 stripped.
const toArtworkKey = (emoji: string) => Array.from(emoji)
  .map(char => char.codePointAt(0)!.toString(16))
  .filter(hex => hex !== 'fe0f')
  .join('-');

export function emojiArtwork(emoji: string) {
  if (IS_EMOJI_NATIVE || !known.has(emoji)) return undefined;
  const key = toArtworkKey(emoji);
  if (!artwork.has(key)) return undefined;
  return { backgroundImage: `url("/emoji/${key}.png")`, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' as const };
}
