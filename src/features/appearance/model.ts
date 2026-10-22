import presets from './telegram-presets.json';
import themes from './telegram-themes.json';
import { changeColorAccent, getAccentColor, getAverageColor, hexToRgb, hslaToRgba, hsvToRgb, mixColors, rgbToHsv, rgbaToHexa, rgbaToHsla, relativeLuminance, ensureTextContrast, type ColorRgb } from './telegram-colors';

export type BaseTheme = 'day' | 'night' | 'light' | 'tinted';
export type ThemeChoice = BaseTheme | 'system';
export interface Wallpaper {
  kind: 'color' | 'gradient' | 'image';
  colors: string[];
  rotation: number;
  pattern: boolean;
  intensity: number;
  blur: boolean;
  source?: string;
}
/** User-picked message colors (tweb themeSettings.accent_color/message_colors): one solid stop or a two-stop gradient. */
export interface MessageColors { accent: string; colors: string[] }
export interface ThemeSelection { preset: number | null; theme?: string; wallpaper?: Wallpaper; messages?: MessageColors }
export interface Appearance {
  version: 1;
  base: ThemeChoice;
  textSize: number;
  themes: Record<BaseTheme, ThemeSelection>;
}
export interface AccentPreset {
  id: number;
  accent_color: number;
  message_colors: number[];
  wallpaper?: { intensity: number; background_color: number; second_background_color?: number; third_background_color?: number; fourth_background_color?: number; dark?: boolean };
}
export const THEME_CHOICES: ThemeChoice[] = ['day', 'night', 'light', 'tinted', 'system'];
export const PRESETS: Record<BaseTheme, AccentPreset[]> = presets;
interface ChatThemeVariant {
  accent_color: number;
  message_colors: number[];
  outbox_accent_color?: number;
  wallpaper: { colors: number[]; intensity: number; rotation: number; pattern: boolean; source?: string };
}
export const CHAT_THEMES: { id: string; emoticon: string; variants: Record<BaseTheme, ChatThemeVariant> }[] = themes;
export const BACKGROUND_COLORS = ['#E6EBEE', '#B2CEE1', '#008DD0', '#C6E7CB', '#C4E1A6', '#60B16E', '#CCD0AF', '#A6A997', '#7A7072', '#FDD7AF', '#FDB76E', '#DD8851'];
export const hex = (value: number) => '#' + value.toString(16).padStart(6, '0');
// tweb helpers/color.ts:getWallPaperColors treats zero in optional stops as absent.
// A zero first stop remains a valid black background.
export const telegramWallpaperColors = (colors: number[]) => colors.filter((color, index) => index === 0 || color !== 0);
export const defaultAppearance = (base: ThemeChoice = 'system'): Appearance => ({ version: 1, base, textSize: 16, themes: { day: { preset: null }, night: { preset: null }, light: { preset: null }, tinted: { preset: null } } });
export const isBaseTheme = (value: unknown): value is BaseTheme => ['day', 'night', 'light', 'tinted'].includes(String(value));
export const validColor = (value: unknown): value is string => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);

export function readAppearance(raw: string | null, legacy: string | null): Appearance {
  const result = defaultAppearance(legacy === 'dark' ? 'night' : legacy === 'light' ? 'day' : 'system');
  if (!raw) return result;
  try {
    const data = JSON.parse(raw);
    if (data.version !== 1) return result;
    if (THEME_CHOICES.includes(data.base)) result.base = data.base;
    if (Number.isFinite(data.textSize)) result.textSize = Math.max(12, Math.min(20, Math.round(data.textSize)));
    for (const base of ['day', 'night', 'light', 'tinted'] as BaseTheme[]) {
      const entry = data.themes?.[base];
      if (CHAT_THEMES.some(theme => theme.id === entry?.theme)) result.themes[base].theme = entry.theme;
      if (PRESETS[base].some(p => p.id === entry?.preset)) result.themes[base].preset = entry.preset;
      const wp = entry?.wallpaper;
      if (wp && ['color', 'gradient', 'image'].includes(wp.kind) && Array.isArray(wp.colors) && wp.colors.length >= 1 && wp.colors.length <= 4 && wp.colors.every(validColor)) {
        result.themes[base].wallpaper = { kind: wp.kind, colors: wp.colors, rotation: Number.isFinite(wp.rotation) ? Math.abs(wp.rotation) % 360 : 0, pattern: !!wp.pattern, intensity: Number.isFinite(wp.intensity) ? Math.max(0, Math.min(100, wp.intensity)) : 50, blur: !!wp.blur, ...(typeof wp.source === 'string' && /^\/images\/chat\/[\w-]+\.svg$/.test(wp.source) ? { source: wp.source } : {}) };
      }
      const messages = entry?.messages;
      if (messages && validColor(messages.accent) && Array.isArray(messages.colors) && messages.colors.length >= 1 && messages.colors.length <= 2 && messages.colors.every(validColor)) {
        result.themes[base].messages = { accent: messages.accent, colors: messages.colors.slice() };
      }
    }
  } catch { /* Invalid saved preferences fall back to the existing appearance. */ }
  return result;
}

const BASE = {
  day: { accent: '#3390ec', surface: '#ffffff', background: '#f4f4f5', text: '#000000', secondary: '#707579', border: '#dfe1e5', incoming: '#ffffff', bubble: [0x5ca853], wallpaper: [0xdbddbb, 0x6ba587, 0xd5d88d, 0x88b884] },
  night: { accent: '#8774e1', surface: '#212121', background: '#181818', text: '#ffffff', secondary: '#aaaaaa', border: '#0f0f0f', incoming: '#212121', bubble: [0x8774e1], wallpaper: [0xfec496, 0xdd6cb9, 0x962fbf, 0x4f5bd5] },
  light: { accent: '#2d7ed5', surface: '#ffffff', background: '#f4f4f5', text: '#333333', secondary: '#8c8e91', border: '#dfe1e5', incoming: '#f0f0f0', bubble: [0x2d7ed5], wallpaper: [0xb1e0fa, 0x82b0d8, 0xa0d8e8, 0xe5f0f8] },
  tinted: { accent: '#0088ff', surface: '#1d2733', background: '#151e27', text: '#ffffff', secondary: '#7d8b99', border: '#0f151b', incoming: '#232e3b', bubble: PRESETS.tinted[0].message_colors, wallpaper: [0x1e3557, 0x182036, 0x1c4352, 0x16263a] },
};

export function resolveAppearance(appearance: Appearance, systemDark: boolean) {
  const base: BaseTheme = appearance.base === 'system' ? (systemDark ? 'night' : 'day') : appearance.base;
  return resolveTheme(base, appearance.themes[base], appearance.textSize);
}

export function resolveTheme(base: BaseTheme, selection: ThemeSelection = { preset: null }, textSize = 16) {
  const original = BASE[base];
  const dark = base === 'night' || base === 'tinted';
  const themeBundle = CHAT_THEMES.find(theme => theme.id === selection.theme);
  const chatTheme = themeBundle?.variants[base];
  let themeWallpaper = chatTheme?.wallpaper;
  // The cloud Day entries carry a plain white, no-file wallpaper with a zero sentinel.
  // Retain their Day accents/bubbles, and preview their own illustrated Classic wallpaper
  // instead of presenting eight identical blank cards. Explicit user wallpapers still win.
  if (base === 'light' && themeWallpaper && !themeWallpaper.pattern && !themeWallpaper.source &&
      themeWallpaper.colors[0] === 0xffffff && themeWallpaper.colors.slice(1).every(color => color === 0)) {
    themeWallpaper = themeBundle!.variants.day.wallpaper;
  }
  const preset = chatTheme ?? PRESETS[base].find(p => p.id === selection.preset);
  const custom = selection.messages;
  const sourceAccent = custom ? custom.accent : preset ? hex(preset.accent_color) : original.accent;
  // A user-picked accent keeps its hue but is moved just enough to stay visible (3:1) on the base surface;
  // very dark picks would otherwise vanish on Night and turn the derived Dark surfaces black.
  let accent = custom ? ensureTextContrast(custom.accent, hexToRgb(original.surface), 3) : sourceAccent;
  let surface = original.surface, background = original.background, secondary = original.secondary, border = original.border, incoming = original.incoming;
  if (base === 'tinted') {
    const hsv = rgbToHsv(...hexToRgb(accent));
    const v = Math.max(hsv[2], .18);
    const multiplied = (h: number, s: number, b: number) => rgbaToHexa(hsvToRgb(hsv[0] * h % 360, Math.min(1, hsv[1] * s), Math.min(1, v * b)));
    accent = rgbaToHexa(hsvToRgb(hsv[0], hsv[1], v));
    surface = incoming = multiplied(1.024, .585, .25);
    background = multiplied(1.024, .573, .18);
    border = multiplied(1.033, .426, .34);
    secondary = multiplied(.956, .17, 1);
    if (custom) secondary = ensureTextContrast(secondary, hexToRgb(surface), 4.5);
  } else if (!custom) {
    accent = rgbaToHexa(changeColorAccent(rgbToHsv(...hexToRgb(original.accent)), rgbToHsv(...hexToRgb(accent)), hexToRgb(original.accent), !dark));
  }
  const sourceMessageColors = custom ? custom.colors : (preset?.message_colors ?? original.bubble).map(hex);
  const baseMessageColor = hexToRgb(base === 'tinted' ? '#3685fa' : hex(original.bubble[0]));
  const surfaceRgb = hexToRgb(surface);
  const weight = dark ? 1 : .12;
  // tweb themeController.applyTheme: message accent and outgoing fill for a set of message colors.
  const messageFill = (rawMessageColors: ColorRgb[]) => {
    let messageAccent: ColorRgb = rawMessageColors[0];
    if (rawMessageColors.length > 1) {
      messageAccent = rawMessageColors.slice(1).reduce((a, b) => getAverageColor(a, b), messageAccent);
      messageAccent = getAccentColor(rgbToHsv(...baseMessageColor), mixColors(baseMessageColor, surfaceRgb, weight), messageAccent);
    }
    let outgoing = mixColors(messageAccent, surfaceRgb, weight);
    if (!dark) {
      const hsl = rgbaToHsla(...outgoing);
      outgoing = hslaToRgba(hsl.h, Math.min(hsl.s + 63, 100), hsl.l, hsl.a).slice(0, 3) as ColorRgb;
    }
    return { messageAccent, outgoing };
  };
  const { messageAccent, outgoing } = messageFill(sourceMessageColors.map(hexToRgb));
  // User-picked message colors paint the outgoing bubble exactly as chosen (solid or two-stop gradient),
  // with black or white text, whichever contrasts more with the average of the stops.
  const customLight = custom ? relativeLuminance(custom.colors.map(hexToRgb).reduce((a, b) => getAverageColor(a, b))) > .179 : false;
  const customText = customLight ? '#000000' : '#ffffff';
  const outgoingHex = rgbaToHexa(outgoing);
  const outboxAccent = custom ? undefined : chatTheme?.outbox_accent_color;
  const outgoingPrimary = dark ? '#ffffff' : rgbaToHexa(outboxAccent === undefined ? messageAccent : hexToRgb(hex(outboxAccent)));
  const thumbnailOutgoing = rgbaToHexa(mixColors(dark ? [255, 255, 255] : outboxAccent === undefined ? messageAccent : hexToRgb(hex(outboxAccent)), outgoing, .08));
  const wp = PRESETS[base].find(p => p.id === selection.preset)?.wallpaper;
  const colors = wp ? telegramWallpaperColors([wp.background_color, wp.second_background_color, wp.third_background_color, wp.fourth_background_color].filter((n): n is number => n !== undefined)).map(hex) : original.wallpaper.map(hex);
  // tweb blends cloud wallpapers 85% toward the closest tinted base-color wallpaper.
  let themeColors = themeWallpaper && telegramWallpaperColors(themeWallpaper.colors).map(hex);
  if (chatTheme && base === 'tinted') {
    const accentRgb = hexToRgb(hex(chatTheme.accent_color));
    const distance = (color: number) => hexToRgb(hex(color)).reduce((sum, channel, index) => sum + (channel - accentRgb[index]) ** 2, 0);
    const nearest = PRESETS.tinted.reduce((best, candidate) => distance(candidate.accent_color) < distance(best.accent_color) ? candidate : best);
    const target = nearest.wallpaper!;
    const targets = [target.background_color, target.second_background_color, target.third_background_color, target.fourth_background_color];
    themeColors = chatTheme.wallpaper.colors.map((color, index) => {
      const picked = hexToRgb(hex(color));
      return rgbaToHexa(hexToRgb(hex(targets[index] ?? target.background_color)).map((channel, i) => Math.round(channel * .85 + picked[i] * .15)) as ColorRgb);
    });
  }
  const wallpaper: Wallpaper = selection.wallpaper ?? (themeWallpaper ? {
    kind: themeColors!.length > 1 ? 'gradient' : 'color',
    colors: themeColors!, pattern: themeWallpaper.pattern,
    intensity: base === 'tinted' ? 38 : Math.abs(themeWallpaper.intensity),
    rotation: 0, blur: false, source: themeWallpaper.source,
  } : { kind: 'gradient', colors, pattern: true, intensity: base === 'tinted' ? 38 : wp?.intensity ?? 50, rotation: 0, blur: false });
  return { base, dark, accent, surface, background, text: original.text, secondary, border, incoming, outgoing: custom ? custom.colors[custom.colors.length - 1] : outgoingHex, outgoingBackground: custom ? custom.colors.length > 1 ? `linear-gradient(to bottom, ${custom.colors.join(', ')})` : custom.colors[0] : outgoingHex, thumbnailOutgoing: custom ? custom.colors[0] : thumbnailOutgoing, sourceAccent, sourceMessageColors, outgoingText: custom ? customText : original.text, outgoingPrimary: custom ? customText : outgoingPrimary, outgoingMeta: custom ? customLight ? 'rgba(0,0,0,.55)' : 'rgba(255,255,255,.7)' : dark ? 'rgba(255,255,255,.6)' : outgoingPrimary, textSize, wallpaper };
}

export type ResolvedAppearance = ReturnType<typeof resolveTheme>;
