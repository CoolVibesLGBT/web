import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { defaultAppearance, readAppearance, resolveAppearance, type Appearance, type ThemeChoice, type ThemeSelection, type ResolvedAppearance, type Wallpaper, type MessageColors } from '@/features/appearance/model';
import { hexToRgb, mixColors, rgbaToHexa, rgbaToHsla } from '@/features/appearance/telegram-colors';
import { readWallpaper, saveWallpaper } from '@/features/appearance/wallpaperStore';

type Theme = 'light' | 'dark';
const STORAGE_KEY = 'cv.appearance.v1';
interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  appearance: Appearance;
  palette: ResolvedAppearance;
  setBaseTheme: (base: ThemeChoice) => void;
  selectPreset: (preset: number | null) => void;
  selectChatTheme: (theme: string | null) => void;
  setWallpaper: (wallpaper?: Wallpaper) => void;
  setMessageColors: (messages?: MessageColors) => void;
  setTextSize: (size: number) => void;
  wallpaperImageUrl: string | null;
  uploadWallpaper: (file: File) => Promise<void>;
}
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
function initialAppearance() {
  try { return readAppearance(localStorage.getItem(STORAGE_KEY), localStorage.getItem('theme')); }
  catch { return defaultAppearance(); }
}
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearance] = useState(initialAppearance);
  const [systemDark, setSystemDark] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [wallpaperImage, setWallpaperImage] = useState<Blob>();
  const [wallpaperImageUrl, setWallpaperImageUrl] = useState<string | null>(null);
  const palette = useMemo(() => resolveAppearance(appearance, systemDark), [appearance, systemDark]);
  const theme: Theme = palette.dark ? 'dark' : 'light';
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystemDark(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    let active = true;
    readWallpaper().then(image => { if (active) setWallpaperImage(image); }).catch(() => {});
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!wallpaperImage) { setWallpaperImageUrl(null); return; }
    const url = URL.createObjectURL(wallpaperImage);
    setWallpaperImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [wallpaperImage]);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appearance));
      if (appearance.base === 'system') localStorage.removeItem('theme');
      else localStorage.setItem('theme', theme);
    } catch { /* Current-session selection still works if browser storage is unavailable. */ }
  }, [appearance, theme]);
  useEffect(() => {
    const synchronize = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setAppearance(readAppearance(event.newValue, localStorage.getItem('theme')));
    };
    window.addEventListener('storage', synchronize);
    return () => window.removeEventListener('storage', synchronize);
  }, []);
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', palette.dark);
    root.classList.toggle('light', !palette.dark);
    root.dataset.appearance = palette.base;
    const accentHSL = rgbaToHsla(...hexToRgb(palette.accent));
    const values: Record<string, string> = {
      '--cv-action-tint': palette.accent, '--color-brand': palette.accent, '--color-brand-hovered': `hsl(${accentHSL.h}, ${accentHSL.s}%, ${Math.max(0, accentHSL.l - 4)}%)`,
      '--color-brand-light-solid': `color-mix(in srgb, ${palette.accent} 12%, ${palette.surface})`,
      '--color-brand-light': `color-mix(in srgb, ${palette.accent} 12%, transparent)`,
      '--cv-page-bg': palette.background, '--cv-card-bg': palette.surface, '--cv-card-bg-solid': palette.surface,
      '--cv-card-bg-soft': palette.surface, '--cv-floating-bg': palette.surface, '--cv-card-bg-muted': palette.background,
      '--cv-card-border': palette.border, '--cv-inner-border': palette.border,
      '--cv-menu-background': `color-mix(in srgb, ${palette.surface} ${palette.dark ? 75 : 85}%, transparent)`,
      '--cv-list-hover': rgbaToHexa(mixColors(hexToRgb(palette.accent), hexToRgb(palette.surface), .08)),
      '--cv-list-pressed': rgbaToHexa(mixColors(hexToRgb(palette.accent), hexToRgb(palette.surface), .12)),
      '--cv-telegram-row-hover': 'var(--cv-list-hover)',
      '--cv-telegram-section-shadow': `0px 1px 4px 0px rgba(0, 0, 0, ${palette.dark ? .12 : .05})`,
      '--cv-menu-hover': 'var(--cv-list-hover)',
      '--cv-menu-danger': palette.dark ? '#ff595a' : '#df3f40',
      '--cv-neutral-1': palette.text, '--cv-neutral-1-hover': palette.text,
      '--cv-neutral-2': palette.secondary, '--cv-neutral-3': palette.secondary,
      '--cv-surface-2': palette.background, '--cv-surface-2-hover': 'var(--cv-list-hover)',
      '--cv-surface-3': `color-mix(in srgb, ${palette.secondary} 12%, ${palette.surface})`,
      '--cv-surface-3-hover': 'var(--cv-list-hover)',
      '--cv-chat-incoming': palette.incoming, '--cv-chat-outgoing': palette.outgoing, '--cv-chat-outgoing-background': palette.outgoingBackground,
      '--cv-chat-incoming-text': palette.text, '--cv-chat-outgoing-text': palette.outgoingText,
      '--cv-chat-incoming-meta': palette.secondary, '--cv-chat-outgoing-meta': palette.outgoingMeta,
      '--cv-chat-incoming-link': palette.accent, '--cv-chat-outgoing-link': palette.outgoingPrimary,
      '--cv-chat-font-size': `${appearance.textSize / 17}rem`,
    };
    Object.entries(values).forEach(([name, value]) => root.style.setProperty(name, value));
    return () => {
      Object.keys(values).forEach(name => root.style.removeProperty(name));
      delete root.dataset.appearance;
    };
  }, [palette, appearance.textSize]);
  const setBaseTheme = useCallback((base: ThemeChoice) => setAppearance(previous => ({ ...previous, base })), []);
  const setTheme = useCallback((value: Theme) => setBaseTheme(value === 'dark' ? 'night' : 'day'), [setBaseTheme]);
  const toggleTheme = useCallback(() => setTheme(theme === 'dark' ? 'light' : 'dark'), [setTheme, theme]);
  const updateTheme = useCallback((update: (previous: ThemeSelection) => ThemeSelection) => {
    setAppearance(previous => ({ ...previous, themes: { ...previous.themes, [palette.base]: update(previous.themes[palette.base]) } }));
  }, [palette.base]);
  const selectPreset = useCallback((preset: number | null) => updateTheme(() => ({ preset })), [updateTheme]);
  const selectChatTheme = useCallback((theme: string | null) => {
    setAppearance(previous => ({ ...previous, themes: Object.fromEntries(['day', 'night', 'light', 'tinted'].map(base => [base, { preset: null, ...(theme ? { theme } : {}) }])) as Appearance['themes'] }));
  }, []);
  const setWallpaper = useCallback((wallpaper?: Wallpaper) => updateTheme(previous => ({ ...previous, wallpaper })), [updateTheme]);
  const setMessageColors = useCallback((messages?: MessageColors) => updateTheme(previous => ({ ...previous, messages })), [updateTheme]);
  const setTextSize = useCallback((size: number) => setAppearance(previous => ({ ...previous, textSize: Math.max(12, Math.min(20, Math.round(size))) })), []);
  const uploadWallpaper = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/') || file.size > 20 * 1024 * 1024) throw new Error('invalid-image');
    const bitmap = await createImageBitmap(file);
    bitmap.close();
    await saveWallpaper(file);
    setWallpaperImage(file);
    setWallpaper({ kind: 'image', colors: ['#e6ebee'], rotation: 0, pattern: false, intensity: 0, blur: false });
  }, [setWallpaper]);
  return <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, appearance, palette, setBaseTheme, selectPreset, selectChatTheme, setWallpaper, setMessageColors, setTextSize, wallpaperImageUrl, uploadWallpaper }}>{children}</ThemeContext.Provider>;
}
