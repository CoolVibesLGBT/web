// React adaptation of tweb/components/chatThemesPicker.tsx and scss/partials/_themes.scss.
// Original source and GPL-3.0 attribution: licenses/THIRD-PARTY-NOTICES.txt.
import { useEffect, useRef, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import ChatWallpaper from './ChatWallpaper';
import LottieAnimation from '@/features/animations/LottieAnimation';
import themeEmoji from '@/features/animations/theme-emoji.json';
import { CHAT_THEMES, resolveTheme, type BaseTheme } from './model';

const ITEMS = [{ id: '', emoticon: '🏠' }, ...CHAT_THEMES];

export default function TelegramThemePicker({ base, selectedId, onSelect }: {
  base: BaseTheme;
  selectedId?: string;
  onSelect: (id: string | null) => void;
}) {
  const { t } = useTranslation('common');
  const strip = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = strip.current;
    if (!container) return;
    const buttons = Array.from(container.querySelectorAll<HTMLButtonElement>('button'));
    const selected = buttons.find(button => button.getAttribute('aria-pressed') === 'true') ?? buttons[0];
    buttons.forEach(button => { button.tabIndex = button === selected ? 0 : -1; });
    const card = selected.getBoundingClientRect(), viewport = container.getBoundingClientRect();
    container.scrollBy({ left: card.left - viewport.left - (container.clientWidth - card.width) / 2, behavior: 'instant' });
  }, [base, selectedId]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const container = event.currentTarget;
    const buttons = Array.from(container.querySelectorAll<HTMLButtonElement>('button'));
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (index < 0) return;
    event.preventDefault();
    const rtl = getComputedStyle(container).direction === 'rtl';
    const nextKey = rtl ? 'ArrowLeft' : 'ArrowRight';
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === nextKey ? 1 : buttons.length - 1)) % buttons.length;
    buttons.forEach((button, position) => { button.tabIndex = position === next ? 0 : -1; });
    buttons[next].focus({ preventScroll: true });
    const card = buttons[next].getBoundingClientRect(), viewport = container.getBoundingClientRect();
    container.scrollBy({ left: card.left - viewport.left - (container.clientWidth - card.width) / 2, behavior: 'instant' });
  };

  return <div ref={strip} className="cv-appearance-themes scrollable scrollable-x themes-container" role="toolbar" aria-label={t('appearance.color_theme')} onKeyDown={onKeyDown}>
    {ITEMS.map(theme => {
      const preview = resolveTheme(base, { preset: null, theme: theme.id || undefined });
      const active = selectedId === theme.id;
      return <button type="button" key={theme.id} className={`cv-appearance-tile theme-container${active ? ' active' : ''}`} tabIndex={active || (selectedId === undefined && theme.id === '') ? 0 : -1} aria-label={`${t('appearance.color_theme')} ${theme.emoticon}`} aria-pressed={active} onClick={() => onSelect(theme.id || null)}>
        <div className="cv-appearance-tile-art background-item" aria-hidden="true">
          <ChatWallpaper value={preview} thumbnail />
        </div>
        <span className="theme-bubble is-in" style={{ background: preview.incoming }} aria-hidden="true" />
        <span className="theme-bubble is-out" style={{ background: preview.thumbnailOutgoing }} aria-hidden="true" />
        <span className="cv-appearance-theme-emoji theme-emoticon" aria-hidden="true"><LottieAnimation src={(themeEmoji as Record<string, string>)[theme.emoticon]} size={28} autoplay={active} /></span>
      </button>;
    })}
  </div>;
}
