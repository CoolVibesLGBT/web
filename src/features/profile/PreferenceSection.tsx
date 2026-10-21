import AnimatedEmptyState from '@/components/ui/AnimatedEmptyState';
import { useId, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Virtuoso } from 'react-virtuoso';
import { GroupedSection } from '@/components/ui/Interface';
import { SwitchIndicator } from '@/components/ui/Switch';
import IllustratedIcon from '@/components/ui/IllustratedIcon';
import TelegramIcon from '@/features/chat/TelegramIcon';
import './preferences.css';

export interface ProfilePreferenceOption { id: string; name: string; description?: string; icon?: string }
export interface ProfilePreferenceCategory { id: string; name: string; icon?: string }
export type ProfilePreferenceSelection = Record<string, ProfilePreferenceOption[]>;

/** Resolve legacy item IDs against the same initial-sync catalog used for bit flags. */
export function resolveCatalogSelection(options: Record<string, ProfilePreferenceOption[]>, ids: string[], selected: ProfilePreferenceSelection): ProfilePreferenceSelection {
 const result = Object.fromEntries(Object.entries(selected).map(([id, items]) => [id, [...items]]));
 const wanted = new Set(ids.map(String));
 for (const [category, items] of Object.entries(options)) for (const item of items) {
  if (!wanted.has(String(item.id))) continue;
  const group = result[category] ||= [];
  if (!group.some(value => String(value.id) === String(item.id))) group.push(item);
 }
 return result;
}

/** The owner can browse the full catalog in-place; visitors see selected values only. */
export default function PreferenceSection({ title, kind, categories, options, selected, canEdit, busy, loading, failed, onRetry, onToggle, emptyLabel, limit }: {
 title: string; kind: string; categories: ProfilePreferenceCategory[]; options: Record<string, ProfilePreferenceOption[]>;
 selected: ProfilePreferenceSelection; canEdit: boolean; busy: boolean; loading: boolean; failed: boolean;
 onRetry: () => void; onToggle: (category: string, item: string) => void; emptyLabel: string; limit?: number;
}) {
 const { t, i18n } = useTranslation('common'), id = useId(), root = useRef<HTMLElement>(null);
 const [expanded, setExpanded] = useState<string | null>(null), [all, setAll] = useState(false);
 const [scrollParent, setScrollParent] = useState<HTMLElement>();
 useLayoutEffect(() => {
  let parent = root.current?.parentElement;
  while (parent && !/(auto|scroll)/.test(getComputedStyle(parent).overflowY)) parent = parent.parentElement;
  setScrollParent(parent || undefined);
 }, []);
 const number = (value: number) => new Intl.NumberFormat(i18n.language).format(value);
 const groups = [...categories];
 for (const key of Object.keys(selected)) if (!groups.some(category => category.id === key)) groups.push({ id: key, name: title });
 const visible = canEdit || kind === 'attributes' ? groups : groups.filter(category => selected[category.id]?.length);
 const displayed = limit && !all ? visible.slice(0, limit) : visible;
 const total = kind === 'attributes' ? Object.values(selected).filter(items => items.length).length : Object.values(selected).reduce((sum, items) => sum + items.length, 0);
 const available = kind === 'attributes' ? categories.length : Object.values(options).reduce((sum, items) => sum + items.length, 0);
 const hasOptions = Object.values(options).some(items => items.length > 0);
 return <section ref={root} className={`cv-profile-preferences cv-profile-${kind === 'attributes' ? 'traits' : kind}`} aria-label={title}>
  <div className="cv-profile-section-heading"><h2>{title}</h2><span>{number(total)}{canEdit && ` / ${number(available)}`}</span></div>
  {loading && !hasOptions ? <p role="status" className="cv-preference-status">{t('emoticons.loading')}</p> : failed && !hasOptions ? <div role="alert" className="cv-preference-status"><span>{t('chat_actions.action_failed')}</span><button type="button" onClick={onRetry}>{t('emoticons.retry')}</button></div> : visible.length ? <GroupedSection>
   {displayed.map(category => {
    const chosen = selected[category.id] || [], items = options[category.id] || [];
    const editable = canEdit && items.length > 0, open = editable && expanded === category.id;
    const contents = <><span className="cv-list-icon"><IllustratedIcon name={category.icon || category.id} fallback={kind === 'interests' ? 'system-heart' : 'system-sparkles'} /></span><span className="cv-list-copy"><bdi className="cv-list-title">{category.name}</bdi><span className="cv-list-description">{chosen.length ? kind === 'attributes' ? chosen.map(item => item.name).join(' · ') : t('chat_actions.selected', { count: chosen.length }) : t('profile.not_specified')}</span></span>{editable && <TelegramIcon name="arrow_next" className={`cv-preference-chevron${open ? ' is-open' : ''}`} />}</>;
    return <div key={category.id} className="cv-preference-category" data-category={category.id}>
     {editable ? <button type="button" className="cv-list-row cv-preference-category-toggle" aria-expanded={open} aria-controls={`${id}-${category.id}`} onClick={event => { setExpanded(open ? null : category.id); if (!open) { const node = event.currentTarget; requestAnimationFrame(() => node.scrollIntoView({ block: 'nearest', behavior: 'instant' })); } }}>{contents}</button> : <div className="cv-list-row">{contents}</div>}
     {!open && kind !== 'attributes' && chosen.length > 0 && <div className="cv-preference-selected-items">{chosen.map(item => <span key={item.id} className="cv-preference-chip"><IllustratedIcon name={item.icon || item.id} fallback={kind === 'interests' ? 'system-heart' : 'system-sparkles'} /><span>{item.name}</span></span>)}</div>}
     {open && <div id={`${id}-${category.id}`} className="cv-preference-options" role="group" aria-label={category.name} aria-busy={busy}><Virtuoso customScrollParent={scrollParent} useWindowScroll={!scrollParent} defaultItemHeight={64} data={items} computeItemKey={(_, item) => item.id} itemContent={(_, item) => {
      const checked = chosen.some(value => String(value.id) === String(item.id));
      return <button type="button" role="switch" aria-checked={checked} aria-label={item.name} data-ripple="on" className="cv-list-row cv-preference-option" disabled={busy} onClick={() => onToggle(category.id, item.id)}><span className="cv-list-icon"><IllustratedIcon name={item.icon || item.id} fallback={kind === 'interests' ? 'system-heart' : 'system-sparkles'} /></span><span className="cv-list-copy"><bdi className="cv-list-title">{item.name}</bdi>{item.description && <span className="cv-list-description">{item.description}</span>}</span><SwitchIndicator checked={checked} /></button>;
     }} /></div>}
    </div>;
   })}
   {limit && visible.length > limit && <button type="button" className="cv-preference-more" aria-expanded={all} onClick={() => setAll(value => !value)}>{t(all ? 'match.show_less' : 'match.view_all')}{!all && <span>{number(visible.length)}</span>}</button>}
  </GroupedSection> : kind === 'attributes' ? <p className="cv-preference-empty">{emptyLabel}</p> : <AnimatedEmptyState compact title={emptyLabel} />}
 </section>;
}
