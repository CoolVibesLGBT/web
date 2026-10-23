import data from 'emoji-datasource-facebook/emoji.json';
import sheet from 'emoji-datasource-facebook/img/facebook/sheets/32.png';

interface Entry { unified: string; non_qualified?: string | null; sheet_x: number; sheet_y: number; skin_variations?: Record<string, Entry> }
const coordinates = new Map<string, [number, number]>();
const unicode = (value: string) => String.fromCodePoint(...value.split('-').map(code => parseInt(code, 16)));
for (const item of data as Entry[]) {
  for (const variant of [item, ...Object.values(item.skin_variations ?? {})]) {
    coordinates.set(unicode(variant.unified), [variant.sheet_x, variant.sheet_y]);
    if (variant.non_qualified) coordinates.set(unicode(variant.non_qualified), [variant.sheet_x, variant.sheet_y]);
  }
}
// Longest sequences first so flags, skin tones and ZWJ families stay a single image.
const pattern = [...coordinates.keys()].sort((a, b) => b.length - a.length).map(value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
export const emojiPattern = () => new RegExp(pattern, 'gu');
export function emojiArtwork(emoji: string) {
  const point = coordinates.get(emoji);
  if (!point) return undefined;
  // Source sheet: 2108px; 32px cells with 1px padding on each edge.
  return { backgroundImage: `url("${sheet}")`, backgroundSize: '65.875em 65.875em', backgroundPosition: `${-(point[0] * 34 + 1) / 32}em ${-(point[1] * 34 + 1) / 32}em` };
}
