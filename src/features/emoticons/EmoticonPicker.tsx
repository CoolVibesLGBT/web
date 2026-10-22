import AnimatedEmptyState from '@/components/ui/AnimatedEmptyState';
// Shared React adaptation of tweb's emoticonsDropdown tabs/search/recent selection.
import { useEffect, useLayoutEffect, useMemo, useRef, useState, forwardRef, type HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';
import { Virtuoso, VirtuosoGrid } from 'react-virtuoso';
import emojiData from 'emoji-datasource-facebook/emoji.json';
import { Sheet } from '@/components/ui/Interface';
import Popover from '@/components/ui/Popover';
import TelegramIcon from '@/features/chat/TelegramIcon';
import ViewTabs from '@/components/ui/ViewTabs';
import EmoticonTile from './EmoticonTile';
import { appGifsManager } from './AppGifsManager';
import GifMedia from './GifMedia';
import StickerMedia from './StickerMedia';
import StickerPreview from './StickerPreview';
import { appStickersManager, stickerSets, stickerGroups, stickerSuggestions } from './AppStickersManager';
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
export { STICKERS, stickerSuggestions } from './AppStickersManager';
const toneVariants = (item: EmojiEntry) => [unicode(item), ...Object.entries(item.skin_variations ?? {}).filter(([key]) => key.split('-').every(tone => tone === key.split('-')[0])).slice(0, 5).map(([, value]) => unicode({ ...item, unified: value.unified }))];

export default function EmoticonPicker({ isOpen, onClose, onSelect, onBackspace, canBackspace = true, initialTab = 'emoji', emojiOnly = false, presentation = 'sheet', anchor }: {
  isOpen: boolean; onClose: () => void; onSelect: (selection: EmoticonSelection) => void;
  initialTab?: 'emoji' | 'stickers' | 'gifs';
  emojiOnly?: boolean;
  presentation?: 'sheet' | 'popover'; anchor?: HTMLElement | null;
  onBackspace?: () => void; canBackspace?: boolean;
}) {
  const { t } = useTranslation('common');
  const [tab, setTab] = useState(initialTab);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Smileys & Emotion');
  const [suggested, setSuggested] = useState('');
  const [stickerGroup, setStickerGroup] = useState('');
  const [pack, setPack] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
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
  const gifScroller = useRef<HTMLElement | null>(null);
  const gifScrollRestore = useRef<number | null>(null);
  const gifRows = useMemo(() => Array.from({ length: Math.ceil(gifs.length / 2) }, (_, index) => gifs.slice(index * 2, index * 2 + 2)), [gifs]);
  const [page, setPage] = useState('');
  const [next, setNext] = useState('');
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const [gifsAtBottom, setGifsAtBottom] = useState(false);
  const searchFor = (value: string) => {
    gifScrollRestore.current = null;
    setQuery(value); setStickerGroup(''); setPage(''); setNext('');
    setGifs([]); setFailed(false); setRetry(0); setLoading(false);
  };
  const choose = (selection: EmoticonSelection) => {
    const updated = [selection, ...recent.filter(item => JSON.stringify(item) !== JSON.stringify(selection))].slice(0, 48);
    setRecent(updated); try { localStorage.setItem(RECENT, JSON.stringify(updated)); } catch { /* Session selection remains usable. */ }
    if (selection.kind === 'emoji') setSuggested(selection.emoji);
    onSelect(selection);
  };
  useEffect(() => {
    if (!isOpen || tab !== 'gifs') return;
    const controller = new AbortController();
    setLoading(true); setFailed(false);
    const timer = setTimeout(async () => {
      try {
        const data = await appGifsManager.searchGifs(query, page, retry > 0);
        const items = data.documents;
        if (!controller.signal.aborted) {
          if (page) gifScrollRestore.current = gifScroller.current?.scrollTop ?? null;
          setGifs(previous => page ? [...previous, ...items.filter(item => !previous.some(existing => existing.id === item.id))] : items); setNext(data.nextOffset);
        }
      } catch { if (!controller.signal.aborted) setFailed(true); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 400);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [isOpen, tab, query, page, retry]);
  useLayoutEffect(() => {
    const top = gifScrollRestore.current;
    if (top === null) return;
    const restore = () => { if (gifScrollRestore.current === top) gifScroller.current?.scrollTo({ top, behavior: 'instant' }); };
    restore();
    const frame = requestAnimationFrame(() => { restore(); gifScrollRestore.current = null; });
    return () => cancelAnimationFrame(frame);
  }, [gifs]);
  useEffect(() => {
    if (isOpen && tab === 'gifs' && gifsAtBottom && !loading && !failed && next && page !== next) setPage(next);
  }, [isOpen, tab, gifsAtBottom, loading, failed, next, page]);
  const emojis = useMemo(() => EMOJI.filter(item => query ? item.short_names.some(name => name.includes(query.toLowerCase())) || unicode(item).includes(query) : item.category === category), [query, category]);
  const stickers = useMemo(() => {
    if (query.trim()) return appStickersManager.searchStickers(query);
    const group = stickerGroups.find(group => group.id === stickerGroup);
    if (group) return appStickersManager.getStickersByEmoticon(group.emojis);
    if (pack === 'recent') return recent.flatMap(item => item.kind === 'sticker' && appStickersManager.getDoc(item.id) ? [appStickersManager.getDoc(item.id)!] : []);
    return stickerSets.filter(set => !pack || set.id === pack).flatMap(set => set.documents);
  }, [query, pack, stickerGroup, recent]);
  const recentItems = recent.filter(item => tab === 'emoji' ? item.kind === 'emoji' : item.kind === (tab === 'gifs' ? 'gif' : 'sticker')).slice(0, 8);
  const content = <div className={`cv-emoticon-picker cv-emoticon-${tab}`} onScrollCapture={() => { setTonePicker(null); setPreview(null); }}>
      {tab === 'emoji' && <div className="cv-emoticon-categories emoticons-menu-wrapper">{categories.map((name, index) => <button type="button" key={name} aria-label={`${t('messages.emoji')} ${glyphs[index]}`} aria-pressed={category === name} onClick={() => setCategory(name)}><TelegramIcon name={categoryIcons[index]} /></button>)}</div>}
      <div className={`cv-emoticon-search${searchFocused || query ? ' is-searching' : ''}`}>
        <button type="button" className="cv-emoticon-search-icon" aria-label={t(stickerGroup ? 'app.back' : 'messages.search')} onClick={() => { if (stickerGroup) setStickerGroup(''); else search.current?.focus(); }}><TelegramIcon name={stickerGroup ? 'arrow_prev' : 'search'} /></button>
        <input ref={search} type="search" value={query} onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)} onChange={event => searchFor(event.target.value)} placeholder={t(tab === 'emoji' ? 'messages.search' : `emoticons.search_${tab}`)} aria-label={t(tab === 'emoji' ? 'messages.search' : `emoticons.search_${tab}`)} />
        {tab === 'stickers' && !query && <div className="cv-sticker-emotions" role="toolbar" aria-label={t('emoticons.stickers')}>{stickerGroups.map(group => <button key={group.id} type="button" data-ripple="off" aria-label={group.emojis[0]} aria-pressed={stickerGroup === group.id} onClick={() => { setStickerGroup(previous => previous === group.id ? '' : group.id); setQuery(''); search.current?.blur(); }}><TelegramIcon name={group.icon} /></button>)}</div>}
        {query && <button type="button" aria-label={t('app.close')} onClick={() => searchFor('')}><TelegramIcon name="close" /></button>}
      </div>
      {tab === 'stickers' && !query && !stickerGroup && <div className="cv-sticker-packs" role="toolbar" aria-label={t('emoticons.sticker_packs')}>
        <button type="button" aria-label={t('emoticons.stickers')} aria-pressed={!pack} onClick={() => setPack('')}><TelegramIcon name="stickers_face" /></button>
        <button type="button" aria-label={t('emoticons.recent')} aria-pressed={pack === 'recent'} onClick={() => setPack('recent')}><TelegramIcon name="recent" /></button>
        {stickerSets.map(set => <button type="button" key={set.id} title={set.title} aria-label={set.title} aria-pressed={pack === set.id} onClick={() => setPack(set.id)}><StickerMedia document={set.documents[0]} size={32} /></button>)}
      </div>}
      {tab !== 'stickers' && recentItems.length > 0 && <section aria-label={t('emoticons.recent')} className="cv-emoticon-recent">{recentItems.map((item, index) => <button type="button" key={index} onClick={() => choose(item)} aria-label={item.kind === 'emoji' ? item.emoji : `${t(`emoticons.${item.kind === 'gif' ? 'gifs' : 'stickers'}`)} ${index + 1}`}>{item.kind === 'emoji' ? item.emoji : item.kind === 'sticker' ? <StickerMedia document={item} size={56} /> : <GifMedia document={item} />}</button>)}</section>}
      {!emojiOnly && tab === 'emoji' && suggested && stickerSuggestions(suggested).length > 0 && <section className="cv-emoticon-suggestions" aria-label={t('emoticons.stickers')}>{stickerSuggestions(suggested).map(sticker => <EmoticonTile className="cv-sticker-item" key={sticker.id} label={`${t('emoticons.stickers')} ${suggested}`} onSelect={() => choose(sticker)} onHold={() => setPreview(sticker)} onHoldEnd={() => setPreview(null)}><StickerMedia document={sticker} size={72} /></EmoticonTile>)}</section>}
      <div className="cv-emoticon-results" aria-busy={loading}>
        {tab === 'stickers' && stickers.length === 0 && <AnimatedEmptyState compact title={t('emoticons.no_stickers')} />}
        {tab === 'emoji' ? <VirtuosoGrid key={category + query} data={emojis} components={COMPONENTS} itemContent={(_, item) => <EmoticonTile className="cv-emoji-item" label={item.short_name} onSelect={() => choose({ kind: 'emoji', emoji: emojiFor(item) })} onHold={anchor => { if (toneVariants(item).length > 1) setTonePicker({ item, anchor }); }}>{emojiFor(item)}</EmoticonTile>} /> : tab === 'stickers' ? <VirtuosoGrid key={query + stickerGroup + pack} data={stickers} components={COMPONENTS} itemContent={(_, item) => <EmoticonTile className="cv-sticker-item" label={`${t('emoticons.stickers')} ${item.emoji}`} onSelect={() => choose(item)} onHold={() => setPreview(item)} onHoldEnd={() => setPreview(null)}><StickerMedia key={item.id} document={item} size={72} /></EmoticonTile>} /> : <>
          {failed ? <div className="cv-emoticon-feedback" role="alert"><p>{t('emoticons.gif_unavailable')}</p><button type="button" onClick={() => setRetry(value => value + 1)}>{t('emoticons.retry')}</button></div> : !loading && gifRows.length === 0 ? <AnimatedEmptyState compact title={t('search.no_results')} /> : <Virtuoso key={query} scrollerRef={element => { gifScroller.current = element instanceof HTMLElement ? element : null; }} computeItemKey={(_, row) => row[0].id} data={gifRows} itemContent={(_, row) => <div className="cv-gif-row">{row.map(item => <button key={item.id} type="button" className="cv-gif-item" aria-label={t('emoticons.gifs')} onClick={() => choose(item)}><GifMedia document={item} /></button>)}</div>} atBottomStateChange={setGifsAtBottom} />}
          {loading && <div className="cv-emoticon-loading" role="status">{t('emoticons.loading')}</div>}
        </>}
      </div>
      {preview && <StickerPreview document={preview} onClose={() => setPreview(null)} />}
      {tonePicker && <Popover manual anchor={tonePicker.anchor} widthRem={17} heightRem={3.3} align="center" className="cv-emoji-tone-picker" label={t('messages.emoji')} onClose={() => setTonePicker(null)}><div className="cv-emoji-tone-options">{toneVariants(tonePicker.item).map((emoji, index) => <button type="button" key={emoji} aria-label={emoji} aria-pressed={(tones[tonePicker.item.unified] ?? 0) === index} data-ripple="off" onClick={() => {
        const updated = { ...tones, [tonePicker.item.unified]: index }; setTones(updated);
        try { localStorage.setItem('cv.emoticons.tones.v1', JSON.stringify(updated)); } catch { /* Keep session preference. */ }
        setTonePicker(null);
      }}>{emoji}</button>)}</div></Popover>}
      <div className="cv-emoticon-toolbar emoji-tabs">
        <button type="button" aria-label={t('messages.search')} onClick={() => search.current?.focus()}><TelegramIcon name="search" /></button>
        <ViewTabs items={[{ id: 'emoji', label: t('messages.emoji'), icon: <TelegramIcon name="smile" /> }, { id: 'stickers', label: t('emoticons.stickers'), icon: <TelegramIcon name="stickers_face" /> }, { id: 'gifs', label: t('emoticons.gifs'), icon: <TelegramIcon name="gifs" /> }].filter(item => !emojiOnly || item.id === 'emoji')} activeId={tab} onSelect={id => { setTab(id); searchFor(''); }} label={t('emoticons.title')} />
        {onBackspace ? <button type="button" aria-label={t('messages.delete_last_character')} disabled={!canBackspace} onClick={onBackspace}><TelegramIcon name="deleteleft" /></button> : <span className="cv-emoticon-toolbar-spacer" />}
      </div>
    </div>;
  if (!isOpen) return null;
  return presentation === 'popover' && typeof HTMLElement.prototype.showPopover === 'function'
    ? <Popover anchor={anchor} align="end" onClose={onClose} label={t('emoticons.title')} className="emoji-dropdown" widthRem={22.4705882353} heightRem={24.7058823529}>{content}</Popover>
    : <Sheet isOpen={isOpen} onClose={onClose} title={t('emoticons.title')}>{content}</Sheet>;
}
