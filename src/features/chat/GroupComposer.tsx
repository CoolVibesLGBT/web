import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Virtuoso } from 'react-virtuoso';
import { FormField, ListRow, NavigationBar } from '@/components/ui/Interface';
import Switch from '@/components/ui/Switch';
import { api } from '@/services/api';
import type { ChatItem } from '@/state/chat';
import TelegramIcon from './TelegramIcon';
import './group-composer.css';

interface Peer { id: string; username: string; displayname: string; avatar?: { file?: { url?: string } } }
export interface CreatedGroup { id: string; participants?: { user_id: string }[] }

/** tweb sidebarLeft/tabs/newGroup.tsx: member selection and group details stay in Messages. */
export default function GroupComposer({ chats, viewerId, viewerName, onClose, onCreated }: {
  chats: ChatItem[]; viewerId: string; viewerName: string;
  onClose: () => void; onCreated: (chat: CreatedGroup, title: string) => void;
}) {
  const { t } = useTranslation('common');
  const [step, setStep] = useState<'members' | 'details'>('members');
  const [query, setQuery] = useState('');
  const [found, setFound] = useState<Peer[]>([]);
  const [selected, setSelected] = useState<Peer[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
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
      void api.searchUserLookup(query.trim()).then(response => {
        if (!active) return;
        setFound(Array.isArray(response) ? response : response.users || []);
      }).catch(() => { if (active) setFailed(true); }).finally(() => { if (active) setSearching(false); });
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [query]);
  const candidates = useMemo(() => {
    const peers = new Map<string, Peer>();
    chats.filter(chat => chat.type !== 'group' && chat.username).forEach(chat => peers.set(chat.id, { id: chat.id, username: chat.username, displayname: chat.name, avatar: chat.avatar ? { file: { url: chat.avatar } } : undefined }));
    found.forEach(peer => peers.set(String(peer.id), peer));
    return Array.from(peers.values()).filter(peer => String(peer.id) !== viewerId && `${peer.displayname} ${peer.username}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  }, [chats, found, query, viewerId]);
  const toggle = (peer: Peer) => setSelected(previous => previous.some(item => item.id === peer.id) ? previous.filter(item => item.id !== peer.id) : [...previous, peer]);
  const advance = () => {
    if (!selected.length) return;
    if (!name) setName([viewerName, ...selected.slice(0, 3).map(peer => peer.displayname || peer.username)].filter(Boolean).join(' & ').slice(0, 128));
    setStep('details'); setFailed(false);
  };
  const create = async () => {
    if (busyRef.current || !name.trim() || !selected.length) return;
    busyRef.current = true; setBusy(true); setFailed(false);
    try {
      const response = await api.createChat(selected.map(peer => String(peer.id)), 'group', name.trim(), description.trim()) as { chat?: CreatedGroup };
      if (!response.chat?.id) throw new Error('Missing created group');
      onCreated(response.chat, name.trim());
    } catch { setFailed(true); }
    finally { busyRef.current = false; setBusy(false); }
  };
  const peers = step === 'members' ? candidates : selected;
  return <section className="cv-group-composer" aria-busy={busy}>
    <NavigationBar title={t('chat_actions.new_group')} onBack={() => { if (!busyRef.current) { if (step === 'details') setStep('members'); else onClose(); } }} backIcon={<TelegramIcon name="arrow_prev" />} />
    {step === 'members' ? <>
      <div className="cv-group-search"><TelegramIcon name="search" /><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={t('chat_actions.add_members')} aria-label={t('chat_actions.add_members')} /></div>
      {selected.length > 0 && <div className="cv-group-chips">{selected.map(peer => <button key={peer.id} type="button" onClick={() => toggle(peer)} aria-label={`${peer.displayname}: ${t('app.cancel')}`}><span>{peer.displayname || peer.username}</span><TelegramIcon name="close" /></button>)}</div>}
    </> : <form className="cv-group-details" onSubmit={event => { event.preventDefault(); void create(); }}>
      <div className="cv-group-avatar" aria-hidden="true"><TelegramIcon name="group" /></div>
      <FormField label={t('chat_actions.group_name')}><input value={name} onChange={event => setName(event.target.value)} maxLength={128} required disabled={busy} autoComplete="off" /></FormField>
      <FormField label={t('chat_actions.group_description')}><textarea rows={2} value={description} onChange={event => setDescription(event.target.value)} maxLength={255} disabled={busy} /></FormField>
      <button type="submit" hidden tabIndex={-1} />
    </form>}
    <p className="cv-group-count">{t('chat_actions.member_count', { count: selected.length + (step === 'details' ? 1 : 0) })}</p>
    {failed && <p className="cv-group-error" role="alert">{t('chat_actions.action_failed')}</p>}
    {searching && <p className="cv-group-loading" role="status">{t('messages.loading_chats')}</p>}
    <div className="cv-group-peers"><Virtuoso data={peers} computeItemKey={(_, peer) => peer.id} components={{ EmptyPlaceholder: () => <p className="cv-group-empty">{t('messages.no_chats_found')}</p> }} itemContent={(_, peer) => <ListRow icon={<span className="cv-group-peer-avatar"><span>{(peer.displayname || peer.username).charAt(0).toLocaleUpperCase()}</span>{peer.avatar?.file?.url && <img src={peer.avatar.file.url} alt="" onError={event => { event.currentTarget.style.display = 'none'; }} />}</span>} title={step === 'members' ? <button type="button" className="cv-group-peer-toggle" onClick={() => toggle(peer)} disabled={busy}>{peer.displayname || peer.username}</button> : <bdi>{peer.displayname || peer.username}</bdi>} description={<bdi>@{peer.username}</bdi>} accessory={step === 'members' ? <Switch checked={selected.some(item => item.id === peer.id)} onChange={() => toggle(peer)} className="cv-chat-setting-switch" aria-label={peer.displayname || peer.username} disabled={busy} /> : null} />} /></div>
    <button type="button" className="cv-group-next cv-group-corner" aria-label={t(step === 'members' ? 'app.continue' : 'chat_actions.create_group')} disabled={busy || !selected.length || (step === 'details' && !name.trim())} onClick={() => { if (step === 'members') advance(); else void create(); }}><TelegramIcon name={step === 'members' ? 'arrow_next' : 'check'} /></button>
  </section>;
}
