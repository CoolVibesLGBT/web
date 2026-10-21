import AnimatedEmptyState from '@/components/ui/AnimatedEmptyState';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Virtuoso } from 'react-virtuoso';
import { FormField, ListRow, NavigationBar } from '@/components/ui/Interface';
import Switch, { SwitchIndicator } from '@/components/ui/Switch';
import { api } from '@/services/api';
import type { ChatItem } from '@/state/chat';
import TelegramIcon from './TelegramIcon';
import GroupAvatarField from './GroupAvatarField';
import SearchField from '@/components/ui/SearchField';
import { socialApi } from '@/features/profile/socialApi';
import './group-composer.css';

interface Peer { id: string; public_id?: string; username: string; displayname: string; avatar?: { file?: { url?: string } } }
export interface CreatedGroup { id: string; avatar?: unknown; visibility?: string; public_username?: string; participants?: { user_id: string }[] }

/** tweb sidebarLeft/tabs/newGroup.tsx: member selection and group details stay in Messages. */
export default function GroupComposer({ chats, viewerId, viewerName, onClose, onCreated, excludedIds = [], onMembersSelected }: {
  chats: ChatItem[]; viewerId: string; viewerName: string;
  onClose: () => void; onCreated: (chat: CreatedGroup, title: string) => void;
  excludedIds?: string[]; onMembersSelected?: (ids: string[]) => Promise<void>;
}) {
  const { t } = useTranslation('common');
  const [step, setStep] = useState<'members' | 'details'>('members');
  const [query, setQuery] = useState('');
  const [found, setFound] = useState<Peer[]>([]);
  const [contacts, setContacts] = useState<Peer[]>([]), [contactsNext, setContactsNext] = useState<string>();
  const [contactsLoading, setContactsLoading] = useState(true), [contactsFailed, setContactsFailed] = useState(false);
  const contactsGeneration = useRef(0), fetchingContacts = useRef(false);
  useEffect(() => {
    const generation = ++contactsGeneration.current; fetchingContacts.current = true; setContactsLoading(true); setContactsFailed(false);
    void socialApi.friends('friends').then(data => { if (generation === contactsGeneration.current) { setContacts((data.friendships || []).map(friend => ({ ...friend.user, id: String(friend.user.id) }))); setContactsNext(data.cursor); } }).catch(() => { if (generation === contactsGeneration.current) setContactsFailed(true); }).finally(() => { if (generation === contactsGeneration.current) { fetchingContacts.current = false; setContactsLoading(false); } });
    return () => { contactsGeneration.current++; };
  }, [viewerId]);
  const moreContacts = async () => {
    if (fetchingContacts.current) return;
    const generation = contactsGeneration.current; fetchingContacts.current = true; setContactsLoading(true); setContactsFailed(false);
    try { const data = await socialApi.friends('friends', contactsNext); if (generation === contactsGeneration.current) { setContacts(previous => { const result = new Map(previous.map(peer => [peer.id, peer])); (data.friendships || []).forEach(friend => result.set(String(friend.user.id), { ...friend.user, id: String(friend.user.id) })); return [...result.values()]; }); setContactsNext(data.cursor === contactsNext ? undefined : data.cursor); } }
    catch { if (generation === contactsGeneration.current) setContactsFailed(true); }
    finally { if (generation === contactsGeneration.current) { fetchingContacts.current = false; setContactsLoading(false); } }
  };
  const [selected, setSelected] = useState<Peer[]>([]);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false), [publicUsername, setPublicUsername] = useState('');
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const busyRef = useRef(false);
  useEffect(() => {
    let active = true;
    setFailed(false);
    if (!query.trim()) { setFound([]); setSearching(false); return; }
    setSearching(true);
    const timer = setTimeout(() => {
      void api.searchUserLookup(query.trim().replace(/^@/, '')).then(response => {
        if (!active) return;
        setFound(Array.isArray(response) ? response : response.users || []);
      }).catch(() => { if (active) setFailed(true); }).finally(() => { if (active) setSearching(false); });
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [query]);
  const candidates = useMemo(() => {
    const peers = new Map<string, Peer>();
    chats.filter(chat => chat.type !== 'group').forEach(chat => { const id = chat.peerId || chat.id; peers.set(id, { id, username: chat.username, displayname: chat.name, avatar: chat.avatar ? { file: { url: chat.avatar } } : undefined }); });
    contacts.forEach(peer => peers.set(String(peer.public_id || peer.id), { ...peer, id: String(peer.public_id || peer.id) }));
    found.forEach(peer => peers.set(String(peer.public_id || peer.id), { ...peer, id: String(peer.public_id || peer.id) }));
    const serverMatches = new Set(found.map(peer => String(peer.public_id || peer.id)));
    const excluded = new Set(excludedIds.map(String));
    const search = query.trim().replace(/^@/, '').toLocaleLowerCase();
    return Array.from(peers.values()).filter(peer => peer.id !== String(viewerId) && !excluded.has(peer.id) && (!search || serverMatches.has(peer.id) || `${peer.displayname} ${peer.username}`.toLocaleLowerCase().includes(search)));
  }, [chats, contacts, found, query, viewerId, excludedIds]);
  const toggle = (peer: Peer) => setSelected(previous => previous.some(item => item.id === peer.id) ? previous.filter(item => item.id !== peer.id) : [...previous, peer]);
  const advance = () => {
    if (!selected.length) return;
    if (onMembersSelected) {
      if (busyRef.current) return;
      busyRef.current = true; setBusy(true); setFailed(false);
      void onMembersSelected(selected.map(peer => String(peer.id))).catch(() => setFailed(true)).finally(() => { busyRef.current = false; setBusy(false); });
      return;
    }
    if (!name) setName([viewerName, ...selected.slice(0, 3).map(peer => peer.displayname || peer.username)].filter(Boolean).join(' & ').slice(0, 128));
    setStep('details'); setFailed(false);
  };
  const create = async () => {
    if (busyRef.current || !name.trim() || !selected.length) return;
    busyRef.current = true; setBusy(true); setFailed(false);
    try {
      const response = await api.createChat(selected.map(peer => String(peer.id)), 'group', name.trim(), description.trim(), avatar, isPublic ? 'public' : 'private', publicUsername) as { chat?: CreatedGroup };
      if (!response.chat?.id) throw new Error('Missing created group');
      onCreated(response.chat, name.trim());
    } catch { setFailed(true); }
    finally { busyRef.current = false; setBusy(false); }
  };
  const peers = step === 'members' ? candidates : selected;
  const [scrollParent, setScrollParent] = useState<HTMLDivElement | null>(null);
  return <section className={`cv-group-composer cv-group-step-${step}`} aria-busy={busy}>
    <NavigationBar title={t(onMembersSelected ? 'chat_actions.add_members' : 'chat_actions.new_group')} onBack={() => { if (!busyRef.current) { if (step === 'details') setStep('members'); else onClose(); } }} backIcon={<TelegramIcon name="arrow_prev" />} />
    <div className="cv-group-content" ref={setScrollParent}>
    {step === 'members' ? <>
      <div className="cv-group-search"><SearchField value={query} onChange={setQuery} label={t('chat_actions.add_members')} placeholder={t('chat_actions.search_people_hint')} /></div>
      {selected.length > 0 && <div className="cv-group-chips">{selected.map(peer => <button key={peer.id} type="button" onClick={() => toggle(peer)} aria-label={`${peer.displayname}: ${t('app.cancel')}`}><span>{peer.displayname || peer.username}</span><TelegramIcon name="close" /></button>)}</div>}
    </> : <form className="cv-group-details" onSubmit={event => { event.preventDefault(); void create(); }}>
      <GroupAvatarField value={avatar} onChange={setAvatar} disabled={busy} />
      <FormField label={t('chat_actions.group_name')}><input value={name} onChange={event => setName(event.target.value)} maxLength={128} required disabled={busy} autoComplete="off" /></FormField>
      <FormField label={t('chat_actions.group_description')}><textarea rows={2} value={description} onChange={event => setDescription(event.target.value)} maxLength={255} disabled={busy} /></FormField>
      <ListRow title={t('chat_actions.public_group')} description={t(isPublic ? 'chat_actions.public_group_hint' : 'chat_actions.private_group_hint')} accessory={<Switch checked={isPublic} onChange={setIsPublic} aria-label={t('chat_actions.public_group')} disabled={busy} />} />
      {isPublic && <FormField label={t('chat_actions.public_link')}><input value={publicUsername} onChange={event => setPublicUsername(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} placeholder="username" minLength={5} maxLength={32} pattern="[a-z][a-z0-9_]{4,31}" required disabled={busy} /></FormField>}
      <button type="submit" hidden tabIndex={-1} />
    </form>}
    {(selected.length > 0 || step === 'details') && <p className="cv-group-count">{t(step === 'members' ? 'chat_actions.selected' : 'chat_actions.member_count', { count: selected.length + (step === 'details' ? 1 : 0) })}</p>}
    {failed && <p className="cv-group-error" role="alert">{t('chat_actions.action_failed')}</p>}
    {searching && <p className="cv-group-loading" role="status">{t('messages.loading_chats')}</p>}
    {peers.length > 0 ? <div className="cv-group-peers"><Virtuoso defaultItemHeight={64} customScrollParent={scrollParent || undefined} data={peers} computeItemKey={(_, peer) => peer.id} itemContent={(_, peer) => {
      const icon = <span className="cv-group-peer-avatar"><span>{(peer.displayname || peer.username).charAt(0).toLocaleUpperCase()}</span>{peer.avatar?.file?.url && <img src={peer.avatar.file.url} alt="" onError={event => { event.currentTarget.style.display = 'none'; }} />}</span>;
      return step === 'members' ? <button type="button" role="switch" aria-checked={selected.some(item => item.id === peer.id)} aria-label={peer.displayname || peer.username} data-ripple="on" className="cv-list-row cv-group-peer-row cv-group-peer-toggle" disabled={busy} onClick={() => toggle(peer)}><span className="cv-list-icon">{icon}</span><span className="cv-list-copy"><bdi className="cv-list-title">{peer.displayname || peer.username}</bdi>{peer.username && <bdi className="cv-list-description">@{peer.username}</bdi>}</span><SwitchIndicator checked={selected.some(item => item.id === peer.id)} className="cv-chat-setting-switch" /></button> : <ListRow icon={icon} title={<bdi>{peer.displayname || peer.username}</bdi>} description={peer.username ? <bdi>@{peer.username}</bdi> : undefined} />;
    }} /></div> : !searching && !contactsLoading && <AnimatedEmptyState compact title={t(query.trim() ? 'chat_actions.no_people' : 'chat_actions.choose_people')} description={t('chat_actions.search_people_hint')} />}
    {step === 'members' && contactsLoading && !searching && <p className="cv-group-loading" role="status">{t('emoticons.loading')}</p>}
    {step === 'members' && !query.trim() && (contactsNext || contactsFailed) && <button type="button" className="cv-group-more" disabled={contactsLoading} onClick={() => void moreContacts()}>{t(contactsFailed ? 'emoticons.retry' : 'app.nav.more')}</button>}
    </div>
    {selected.length > 0 && <footer className="cv-group-footer"><button type="button" className="cv-group-next cv-group-corner" aria-label={t(step === 'members' ? onMembersSelected ? 'chat_actions.add_members' : 'app.continue' : 'chat_actions.create_group')} disabled={busy || (step === 'details' && (!name.trim() || (isPublic && !/^[a-z][a-z0-9_]{4,31}$/.test(publicUsername))))} onClick={() => { if (step === 'members') advance(); else void create(); }}><TelegramIcon name={onMembersSelected ? 'check' : 'arrow_next'} /></button></footer>}
  </section>;
}
