import AppearanceRange from '@/features/appearance/AppearanceRange';
import { useRef, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Image, RotateCcw } from 'lucide-react';
import { GroupedSection, ListRow } from '@/components/ui/Interface';
import Switch from '@/components/ui/Switch';
import ViewTabs from '@/components/ui/ViewTabs';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate } from '@/router';
import ChatWallpaper from '@/features/appearance/ChatWallpaper';
import TelegramThemePicker from '@/features/appearance/TelegramThemePicker';
import { BACKGROUND_COLORS, PRESETS, THEME_CHOICES, hex, resolveTheme, type ThemeChoice, type ResolvedAppearance } from '@/features/appearance/model';

function previewStyle(value: ResolvedAppearance): CSSProperties {
  return {
    '--color-brand': value.accent, '--cv-neutral-1': value.text, '--cv-neutral-2': value.secondary,
    '--cv-card-bg-solid': value.surface, '--cv-card-bg': value.surface, '--cv-page-bg': value.background,
    '--cv-inner-border': value.border, '--cv-card-border': value.border, '--cv-surface-2': value.background,
    '--cv-chat-incoming': value.incoming, '--cv-chat-outgoing': value.outgoing,
    '--cv-chat-incoming-text': value.text, '--cv-chat-outgoing-text': value.outgoingText,
    '--cv-chat-incoming-meta': value.secondary, '--cv-chat-outgoing-meta': value.outgoingMeta,
    '--cv-chat-font-size': `${value.textSize / 17}rem`,
    background: value.background, color: value.text,
  } as CSSProperties;
}
const themeKeys: Record<ThemeChoice, string> = { day: 'classic', night: 'night', light: 'day', tinted: 'dark', system: 'system' };

export function AppearancePreview({ value }: { value?: ResolvedAppearance }) {
  const { palette } = useTheme();
  const { t } = useTranslation('common');
  const current = value ?? palette;
  return <section className="cv-appearance-preview" style={previewStyle(current)} aria-label={t('appearance.preview')}>
    <ChatWallpaper value={current} />
    <div className="cv-chat-bubble cv-appearance-bubble" data-side="incoming" style={{ background: current.incoming, color: current.text }}>{t('appearance.preview_in')}</div>
    <div className="cv-chat-bubble cv-appearance-bubble" data-side="outgoing" style={{ background: current.outgoing, color: current.outgoingText }}>{t('appearance.preview_out')}</div>
  </section>;
}

export default function AppearanceScreen() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { appearance, palette, setBaseTheme, selectPreset, selectChatTheme, setTextSize } = useTheme();
  const label = (base: ThemeChoice) => t(`appearance.${themeKeys[base]}`);
  return <div className="skyline-page-scroll w-full"><div className={`cv-appearance ${palette.dark ? 'dark' : 'light'}`} style={previewStyle(palette)}>
    <AppearancePreview />
    <GroupedSection title={t('app.nav.settings')}>
      <div className="cv-appearance-slider">
        <label htmlFor="message-text-size"><span>{t('appearance.text_size')}</span><output htmlFor="message-text-size">{appearance.textSize}</output></label>
        <AppearanceRange id="message-text-size" min={12} max={20} value={appearance.textSize} onChange={setTextSize} />
      </div>
      <ListRow icon={<Image />} title={t('appearance.wallpaper')} onClick={() => navigate('/settings/appearance/background')} />
    </GroupedSection>
    <GroupedSection title={t('appearance.color_theme')}>
      <TelegramThemePicker base={palette.base} selectedId={appearance.themes[palette.base].preset === null ? appearance.themes[palette.base].theme ?? '' : undefined} onSelect={selectChatTheme} />
      <div role="radiogroup" aria-label={t('appearance.color_theme')}>
        {THEME_CHOICES.map(base => <label key={base} className="cv-list-row">
          <input type="radio" name="appearance-theme" value={base} checked={appearance.base === base} onChange={() => setBaseTheme(base)} />
          <span className="cv-list-title">{label(base)}</span>
        </label>)}
      </div>
    </GroupedSection>
    <GroupedSection title={t('appearance.accent')}>
      <div className="cv-appearance-colors" aria-label={t('appearance.accent')}>
        <button type="button" className="cv-appearance-swatch" aria-label={t('appearance.default')} aria-pressed={appearance.themes[palette.base].preset === null && !appearance.themes[palette.base].theme} onClick={() => selectPreset(null)}>
          <span style={{ background: resolveTheme(palette.base).accent, display: 'grid', placeItems: 'center', color: '#fff' }}><RotateCcw size={18} aria-hidden="true" /></span>
        </button>
        {PRESETS[palette.base].map(preset => <button type="button" key={preset.id} className="cv-appearance-swatch" aria-label={`${t('appearance.accent')} ${hex(preset.accent_color)}`} aria-pressed={appearance.themes[palette.base].preset === preset.id} onClick={() => selectPreset(preset.id)}>
          <span style={{ background: `linear-gradient(135deg, ${preset.message_colors.length > 1 ? preset.message_colors.map(hex).join(', ') : [hex(preset.accent_color), hex(preset.accent_color)].join(', ')})` }} />
        </button>)}
      </div>
    </GroupedSection>
  </div></div>;
}

export function ChatBackgroundScreen() {
  const { t } = useTranslation('common');
  const { palette, setWallpaper, wallpaperImageUrl, uploadWallpaper } = useTheme();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(false);
  const wp = palette.wallpaper;
  const patch = (values: Partial<typeof wp>) => setWallpaper({ ...wp, ...values });
  const colors = wp.colors;
  return <div className="skyline-page-scroll w-full"><div className={`cv-appearance ${palette.dark ? 'dark' : 'light'}`} style={previewStyle(palette)}>
    <AppearancePreview />
    <GroupedSection>
      <ViewTabs variant="segmented" items={[
        { id: 'gradient', label: t('appearance.gradient') },
        { id: 'color', label: t('appearance.set_color') },
        { id: 'image', label: t('appearance.photo') },
      ]} activeId={wp.kind} onSelect={kind => patch({ kind, colors: kind === 'color' ? colors.slice(0, 1) : colors.length > 1 ? colors : [colors[0], '#b2cee1'], pattern: kind === 'image' ? false : wp.pattern })} label={t('appearance.wallpaper')} />
      {wp.kind !== 'image' ? <>
        {wp.kind === 'color' && <div className="cv-appearance-color-grid">
          {BACKGROUND_COLORS.map(color => <button type="button" key={color} aria-label={color} aria-pressed={colors[0].toLowerCase() === color.toLowerCase()} style={{ background: color }} onClick={() => patch({ colors: [color] })}>{colors[0].toLowerCase() === color.toLowerCase() && <Check aria-hidden="true" style={{ margin: 'auto', color: '#000' }} />}</button>)}
        </div>}
        <div className="cv-appearance-color-controls">
          {colors.map((color, index) => <label key={index}><span>{t('appearance.set_color')} {index + 1}</span><input type="color" value={color} onChange={event => patch({ colors: colors.map((value, position) => position === index ? event.target.value : value) })} /></label>)}
        </div>
        {wp.kind === 'gradient' && <div className="cv-appearance-color-controls">
          {colors.length < 4 && <button type="button" className="cv-appearance-button" onClick={() => patch({ colors: [...colors, '#c6e7cb'] })}>{t('appearance.add_color')}</button>}
          {colors.length > 2 && <button type="button" className="cv-appearance-button" onClick={() => patch({ colors: colors.slice(0, -1) })}>{t('appearance.remove_color')}</button>}
          <button type="button" className="cv-appearance-button" onClick={() => patch({ rotation: (wp.rotation + 45) % 360 })}>{t('appearance.rotate')}</button>
        </div>}
        <ListRow title={t('appearance.pattern')} accessory={<Switch checked={wp.pattern} onChange={() => patch({ pattern: !wp.pattern })} aria-label={t('appearance.pattern')} />} />
        {wp.pattern && <div className="cv-appearance-slider">
          <label htmlFor="wallpaper-intensity"><span>{t('appearance.intensity')}</span><output htmlFor="wallpaper-intensity">{wp.intensity}%</output></label>
          <AppearanceRange id="wallpaper-intensity" min={0} max={100} value={wp.intensity} onChange={intensity => patch({ intensity })} />
        </div>}
      </> : <>
        <input type="file" ref={input} accept="image/*" hidden onChange={async event => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (!file) return;
          setUploading(true); setError(false);
          try { await uploadWallpaper(file); } catch { setError(true); } finally { setUploading(false); }
        }} />
        <div className="cv-appearance-color-controls"><button type="button" className="cv-appearance-button" disabled={uploading} aria-busy={uploading} onClick={() => input.current?.click()}>{t('appearance.upload')}</button></div>
        {error && <p className="cv-appearance-error" role="alert">{t('appearance.upload_error')}</p>}
        {wallpaperImageUrl && <ListRow title={t('appearance.blur')} accessory={<Switch checked={wp.blur} onChange={() => patch({ blur: !wp.blur })} aria-label={t('appearance.blur')} />} />}
      </>}
      <ListRow icon={<RotateCcw />} title={t('appearance.reset')} onClick={() => { setWallpaper(undefined); setError(false); }} />
    </GroupedSection>
  </div></div>;
}
