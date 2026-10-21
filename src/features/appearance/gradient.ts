// Pixel interpolation adapted from tweb's ChatBackgroundGradientRenderer (GPL-3.0).
// Original credit: Artem Kolnogorov and http://useless.altervista.org/gradient.html.
import { hexToRgb } from './telegram-colors';
const POSITIONS = [[.8, .1], [.6, .2], [.35, .25], [.25, .6], [.2, .9], [.4, .8], [.65, .75], [.75, .4]];
export function gradientPixels(colors: string[], phase = 0, progress = 1): Uint8ClampedArray {
  const pixels = new Uint8ClampedArray(50 * 50 * 4);
  const rgb = colors.map(hexToRgb);
  const positions = (value: number) => Array.from({ length: 4 }, (_, i) => {
    const point = POSITIONS[(value + i * 2) % 8];
    return { x: point[0], y: 1 - point[1] };
  });
  const previous = positions((phase + 1) % 8), current = positions(phase);
  let offset = 0;
  for (let y = 0; y < 50; y++) {
    const cy = y / 50 - .5;
    for (let x = 0; x < 50; x++) {
      const cx = x / 50 - .5;
      const centerDistance = Math.sqrt(cx * cx + cy * cy);
      const swirl = .35 * centerDistance;
      const theta = swirl * swirl * .8 * 8;
      const sin = Math.sin(theta), cos = Math.cos(theta);
      const px = Math.max(0, Math.min(1, .5 + cx * cos - cy * sin));
      const py = Math.max(0, Math.min(1, .5 + cx * sin + cy * cos));
      let sum = 0, r = 0, g = 0, b = 0;
      for (let i = 0; i < rgb.length; i++) {
        const colorX = previous[i].x + (current[i].x - previous[i].x) * progress;
        const colorY = previous[i].y + (current[i].y - previous[i].y) * progress;
        const dx = px - colorX, dy = py - colorY;
        let distance = Math.max(0, .9 - Math.sqrt(dx * dx + dy * dy));
        distance = distance * distance * distance * distance;
        sum += distance; r += distance * rgb[i][0]; g += distance * rgb[i][1]; b += distance * rgb[i][2];
      }
      pixels[offset++] = rgb.length === 1 ? rgb[0][0] : r / sum;
      pixels[offset++] = rgb.length === 1 ? rgb[0][1] : g / sum;
      pixels[offset++] = rgb.length === 1 ? rgb[0][2] : b / sum;
      pixels[offset++] = 255;
    }
  }
  return pixels;
}
