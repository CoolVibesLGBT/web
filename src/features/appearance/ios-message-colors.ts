// Adapted from Telegram-iOS Default{Day,Dark,DarkTinted}PresentationTheme.swift.
// See licenses/THIRD-PARTY-NOTICES.txt. Preserve stop order, including Night's blue preset.
import { hexToRgb, rgbToHsv, rgbaToHexa } from './telegram-colors';

// UIColor.rgb truncates channels; UIKit clamps multiplied hue rather than wrapping it.
function iosHsv(h: number, s: number, v: number) {
  const channel = (n: number) => {
    const k = (n + h / 60) % 6;
    return Math.floor((v - v * s * Math.max(Math.min(k, 4 - k, 1), 0)) * 255 + 1e-9);
  };
  return rgbaToHexa([channel(5), channel(3), channel(1)]);
}

export const iosLightness = (color: string) => {
  const [r, g, b] = hexToRgb(color);
  return (.2126 * r + .7152 * g + .0722 * b) / 255;
};

export function iosMultiply(color: string, hue: number, saturation: number, brightness: number) {
  const [h, s, v] = rgbToHsv(...hexToRgb(color));
  return iosHsv(Math.min(360, h * hue), Math.min(1, s * saturation), Math.min(1, v * brightness));
}

export function iosBubbleColors(base: 'day' | 'light' | 'night' | 'tinted', accent: string): string[] {
  if (base === 'day') {
    const [h, s, v] = rgbToHsv(...hexToRgb(accent));
    return [iosHsv(h, s > 0 && v > 0 ? .14 : 0, .79 + v * .21)];
  }
  if (base === 'night') {
    if (accent.toLowerCase() === '#ffffff') return ['#313131', '#313131'];
    if (accent.toLowerCase() === '#3e88f7') return ['#a256bf', '#9047ff', '#0771ff'];
  }
  if (base === 'tinted') {
    const [h, s, v] = rgbToHsv(...hexToRgb(accent));
    const bottomHue = Math.min(360, h * 1.019);
    return [iosHsv(bottomHue * .966, s * .731 * .61, v * .59 * .98), iosHsv(bottomHue, s * .731, v * .59)];
  }
  return [iosMultiply(accent, .966, .61, .98), accent];
}
