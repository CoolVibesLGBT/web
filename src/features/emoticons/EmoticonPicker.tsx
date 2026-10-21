// Shared React adaptation of tweb's emoticonsDropdown tabs/search/recent selection.
import { useEffect, useMemo, useRef, useState, forwardRef, type HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';
import { VirtuosoGrid } from 'react-virtuoso';
import emojiData from 'emoji-datasource-facebook/emoji.json';
import { Sheet } from '@/components/ui/Interface';
import Popover from '@/components/ui/Popover';
import TelegramIcon from '@/features/chat/TelegramIcon';
import ViewTabs from '@/components/ui/ViewTabs';
import EmoticonTile from './EmoticonTile';
import { TENOR_API_KEY } from '@/appSettings';
import LottieAnimation from '@/features/animations/LottieAnimation';
import originalStickers from '@/features/animations/stickers.json';
import { normalizeEmoticon, type ChatEmoticon, type EmoticonSelection } from './types';
import './emoticons.css';

type EmojiEntry = { unified: string; short_name: string; short_names: string[]; category: string; sort_order: number; skin_variations?: Record<string, { unified: string }> };
const EMOJI = (emojiData as unknown as EmojiEntry[]).slice().sort((a, b) => a.sort_order - b.sort_order);
const unicode = (entry: EmojiEntry) => String.fromCodePoint(...entry.unified.split('-').map(code => parseInt(code, 16)));
const categories = ['Smileys & Emotion', 'People & Body', 'Animals & Nature', 'Food & Drink', 'Travel & Places', 'Activities', 'Objects', 'Symbols', 'Flags'];
const glyphs = ['😀', '👋', '🐻', '🍔', '🚗', '⚽', '💡', '❤️', '🏳️'];
const categoryIcons = ['smile', 'hand', 'animals', 'eats', 'car', 'sport', 'lamp', 'smile', 'flag'] as const;
const RECENT = 'cv.emoticons.recent.v1';
const Grid = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function Grid(props, ref) { return <div {...props} ref={ref} className="cv-emoticon-grid" />; });
const GridItem = (props: HTMLAttributes<HTMLDivElement>) => <div {...props} className="cv-emoticon-cell" />;
const COMPONENTS = { List: Grid, Item: GridItem };
export const STICKERS: ChatEmoticon[] = originalStickers.map(item => ({ kind: 'sticker', id: item.id, url: item.url, emoji: item.emoji, width: item.width, height: item.height }));
export const stickerSuggestions = (emoji: string) => STICKERS.filter(sticker => sticker.emoji === emoji.replace(/[\u{1F3FB}-\u{1F3FF}]/gu, '')).slice(0, 12);
const toneVariants = (item: EmojiEntry) => [unicode(item), ...Object.entries(item.skin_variations ?? {}).filter(([key]) => key.split('-').every(tone => tone === key.split('-')[0])).slice(0, 5).map(([, value]) => unicode({ ...item, unified: value.unified }))];

export default function EmoticonPicker({ isOpen, onClose, onSelect, onBackspace, canBackspace = true, initialTab = 'emoji', presentation = 'sheet', anchor }: {
  isOpen: boolean; onClose: () => void; onSelect: (selection: EmoticonSelection) => void;
  initialTab?: 'emoji' | 'stickers' | 'gifs';
  presentation?: 'sheet' | 'popover'; anchor?: HTMLElement | null;
  onBackspace?: () => void; canBackspace?: boolean;
}) {
  const { t } = useTranslation('common');
  const [tab, setTab] = useState(initialTab);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Smileys & Emotion');
  const [suggested, setSuggested] = useState('');
  const search = useRef<HTMLInputElement>(null);
  const [tonePicker, setTonePicker] = useState<{ item: EmojiEntry; anchor: HTMLButtonElement } | null>(null);
  const [preview, setPreview] = useState<ChatEmoticon | null>(null);
  const [tones, setTones] = useState<Record<string, number>>(() => {
    try { const saved = JSON.parse(localStorage.getItem('cv.emoticons.tones.v1') || '{}'); return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {}; } catch { return {}; }
  });
  const emojiFor = (item: EmojiEntry) => toneVariants(item)[tones[item.unified] ?? 0] ?? unicode(item);
  const [recent, setRecent] = useState<EmoticonSelection[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(RECENT) || '[]');
      return Array.isArray(saved) ? saved.flatMap(item => item?.kind === 'emoji' && typeof item.emoji === 'string' ? [item] : normalizeEmoticon(item) ? [normalizeEmoticon(item)!] : []).slice(0, 48) : [];
    } catch { return []; }
  });
  const [gifs, setGifs] = useState<ChatEmoticon[]>([]);
  const [page, setPage] = useState('');
  const [next, setNext] = useState('');
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const choose = (selection: EmoticonSelection) => {
    const updated = [selection, ...recent.filter(item => JSON.stringify(item) !== JSON.stringify(selection))].slice(0, 48);
    setRecent(updated); try { localStorage.setItem(RECENT, JSON.stringify(updated)); } catch { /* Session selection remains usable. */ }
    if (selection.kind === 'emoji') setSuggested(selection.emoji);
    onSelect(selection);
  };
  useEffect(() => {
    if (!isOpen || tab !== 'gifs') return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true); setFailed(false);
      try {
        if (!TENOR_API_KEY) throw new Error('GIF provider unavailable');
        const url = new URL(`https://tenor.googleapis.com/v2/${query.trim() ? 'search' : 'featured'}`);
        Object.entries({ key: TENOR_API_KEY, client_key: 'coolvibes-web', limit: '32', media_filter: 'gif,tinygif', contentfilter: 'medium', ...(query.trim() ? { q: query.trim() } : {}), ...(page ? { pos: page } : {}) }).forEach(([name, value]) => url.searchParams.set(name, value));
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error('GIF request failed');
        const data = await response.json();
        const items: ChatEmoticon[] = (data.results ?? []).flatMap((item: { id: string; media_formats: { gif?: { url: string; dims?: number[] }; tinygif?: { url: string; dims?: number[] } } }) => {
          const media = item.media_formats.gif ?? item.media_formats.tinygif;
          const valid = media && normalizeEmoticon({ kind: 'gif', id: item.id, url: media.url, width: media.dims?.[0], height: media.dims?.[1] });
          return valid ? [valid] : [];
        });
        if (!controller.signal.aborted) { setGifs(previous => page ? [...previous, ...items.filter(item => !previous.some(existing => existing.id === item.id))] : items); setNext(data.next || ''); }
      } catch { if (!controller.signal.aborted) setFailed(true); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [isOpen, tab, query, page, retry]);
  const emojis = useMemo(() => EMOJI.filter(item => query ? item.short_names.some(name => name.includes(query.toLowerCase())) || unicode(item).includes(query) : item.category === category), [query, category]);
  const stickers = useMemo(() => STICKERS.filter(item => !query || item.emoji?.includes(query) || originalStickers.find(original => original.id === item.id)?.name.toLowerCase().includes(query.toLowerCase())), [query]);
  const recentItems = recent.filter(item => tab === 'emoji' ? item.kind === 'emoji' : item.kind === (tab === 'gifs' ? 'gif' : 'sticker')).slice(0, 8);
  const content = <div className={`cv-emoticon-picker cv-emoticon-${tab}`} onScrollCapture={() => { setTonePicker(null); setPreview(null); }}>
      {tab === 'emoji' && <div className="cv-emoticon-categories emoticons-menu-wrapper">{categories.map((name, index) => <button type="button" key={name} aria-label={`${t('messages.emoji')} ${glyphs[index]}`} aria-pressed={category === name} onClick={() => setCategory(name)}><TelegramIcon name={categoryIcons[index]} /></button>)}</div>}
      <div className="cv-emoticon-search"><Search aria-hidden="true" /><input ref={search} type="search" value={query} onChange={event => { setQuery(event.target.value); setPage(''); }} placeholder={t('messages.search')} aria-label={t('messages.search')} />{query && <button type="button" aria-label={t('app.close')} onClick={() => setQuery('')}><X /></button>}</div>
      {recentItems.length > 0 && <section aria-label={t('emoticons.recent')} className="cv-emoticon-recent">{recentItems.map((item, index) => <button type="button" key={index} onClick={() => choose(item)} aria-label={item.kind === 'emoji' ? item.emoji : `${t(`emoticons.${item.kind === 'gif' ? 'gifs' : 'stickers'}`)} ${index + 1}`}>{item.kind === 'emoji' ? item.emoji : item.kind === 'sticker' ? <LottieAnimation src={item.url} size={56} /> : <img src={item.url} alt="" loading="lazy" />}</button>)}</section>}
      {tab === 'emoji' && suggested && stickerSuggestions(suggested).length > 0 && <section className="cv-emoticon-suggestions" aria-label={t('emoticons.stickers')}>{stickerSuggestions(suggested).map(sticker => <button type="button" key={sticker.id} onClick={() => choose(sticker)} aria-label={`${t('emoticons.stickers')} ${suggested}`}><LottieAnimation src={sticker.url} size={72} /></button>)}</section>}
      <div className="cv-emoticon-results" aria-busy={loading}>
        {tab === 'emoji' ? <VirtuosoGrid key={category + query} data={emojis} components={COMPONENTS} itemContent={(_, item) => <EmoticonTile className="cv-emoji-item" label={item.short_name} onSelect={() => choose({ kind: 'emoji', emoji: emojiFor(item) })} onHold={anchor => { if (toneVariants(item).length > 1) setTonePicker({ item, anchor }); }}>{emojiFor(item)}</EmoticonTile>} /> : tab === 'stickers' ? <VirtuosoGrid key={query} data={stickers} components={COMPONENTS} itemContent={(_, item) => <EmoticonTile className="cv-sticker-item" label={`${t('emoticons.stickers')} ${item.emoji}`} onSelect={() => choose(item)} onHold={() => setPreview(item)} onHoldEnd={() => setPreview(null)}><LottieAnimation src={item.url} size={72} /></EmoticonTile>} /> : <>
          {failed ? <div className="cv-emoticon-feedback" role="alert"><p>{t('emoticons.error')}</p><button type="button" onClick={() => setRetry(value => value + 1)}>{t('emoticons.retry')}</button></div> : <VirtuosoGrid data={gifs} components={COMPONENTS} itemContent={(_, item) => <button type="button" className="cv-gif-item" aria-label={t('emoticons.gifs')} onClick={() => choose(item)}><img src={item.url} alt="" loading="lazy" /></button>} endReached={() => { if (next && !loading) setPage(next); }} />}
          {loading && <div className="cv-emoticon-loading" role="status">{t('emoticons.loading')}</div>}
        </>}
      </div>
      {preview && <div className="cv-emoticon-press-preview" aria-hidden="true"><LottieAnimation src={preview.url} size={220} /></div>}
      {tonePicker && <Popover manual anchor={tonePicker.anchor} widthRem={17} heightRem={3.3} align="center" className="cv-emoji-tone-picker" label={t('messages.emoji')} onClose={() => setTonePicker(null)}><div className="cv-emoji-tone-options">{toneVariants(tonePicker.item).map((emoji, index) => <button type="button" key={emoji} aria-label={emoji} aria-pressed={(tones[tonePicker.item.unified] ?? 0) === index} data-ripple="off" onClick={() => {
        const updated = { ...tones, [tonePicker.item.unified]: index }; setTones(updated);
        try { localStorage.setItem('cv.emoticons.tones.v1', JSON.stringify(updated)); } catch { /* Keep session preference. */ }
        setTonePicker(null);
      }}>{emoji}</button>)}</div></Popover>}
      <div className="cv-emoticon-toolbar emoji-tabs">
        <button type="button" aria-label={t('messages.search')} onClick={() => search.current?.focus()}><TelegramIcon name="search" /></button>
        <ViewTabs items={[{ id: 'emoji', label: t('messages.emoji'), icon: <TelegramIcon name="smile" /> }, { id: 'stickers', label: t('emoticons.stickers'), icon: <TelegramIcon name="stickers_face" /> }, { id: 'gifs', label: t('emoticons.gifs'), icon: <TelegramIcon name="gifs" /> }]} activeId={tab} onSelect={id => { setTab(id); setQuery(''); setPage(''); }} label={t('emoticons.title')} />
        {onBackspace ? <button type="button" aria-label={t('messages.delete_last_character')} disabled={!canBackspace} onClick={onBackspace}><TelegramIcon name="deleteleft" /></button> : <span className="cv-emoticon-toolbar-spacer" />}
      </div>
    </div>;
  if (!isOpen) return null;
  return presentation === 'popover' && typeof HTMLElement.prototype.showPopover === 'function'
    ? <Popover anchor={anchor} align="end" onClose={onClose} label={t('emoticons.title')} className="emoji-dropdown">{content}</Popover>
    : <Sheet isOpen={isOpen} onClose={onClose} title={t('emoticons.title')}>{content}</Sheet>;
}
