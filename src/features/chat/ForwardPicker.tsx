import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Virtuoso } from 'react-virtuoso';
import { Sheet } from '@/components/ui/Interface';
import type { ChatItem, ChatMessage } from '@/state/chat';
import TelegramIcon from './TelegramIcon';
import TelegramChatListRow from './TelegramChatListRow';
import './forward-picker.css';

const AVATAR_COLORS = ['#cc5049', '#d67722', '#955cd7', '#41a344', '#26aaa5', '#368ad1', '#c7508b'];
function PeerAvatar({ chat }: { chat: ChatItem }) {
  const color = AVATAR_COLORS[Array.from(chat.id).reduce((sum, c) => sum + c.charCodeAt(0), 0) % AVATAR_COLORS.length];
  return <span className="cv-forward-peer-avatar" style={{ background: color }}><span>{chat.avatarLetter || chat.name.charAt(0).toLocaleUpperCase()}</span>{chat.avatar && <img src={chat.avatar} alt="" onError={event => { event.currentTarget.style.display = 'none'; }} />}</span>;
}

/** Adapted from tweb popups/forward, pickUser, appSelectPeers and _selector.scss. */
export default function ForwardPicker({ chats, messages, onClose, onOpenChat, onSend }: {
  chats: ChatItem[];
  messages: ChatMessage[];
  onClose: () => void;
  onOpenChat: (chat: ChatItem) => void;
  // Successful recipients are removed before retrying; their messages are not sent twice.
  onSend: (targets: ChatItem[], comment: string) => Promise<ChatItem[]>;
}) {
  const { t } = useTranslation('common');
  const [query, setQuery] = useState('');
  const [multiSelect, setMultiSelect] = useState(false);
  const [selected, setSelected] = useState<ChatItem[]>([]);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const busyRef = useRef(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const available = useMemo(() => chats.filter(chat => chat.chatId), [chats]);
  const filtered = useMemo(() => available.filter(chat => `${chat.name} ${chat.username}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())), [available, query]);
  const recent = available.slice(0, 8);
  const pick = (chat: ChatItem) => {
    if (busyRef.current) return;
    if (!multiSelect) { onOpenChat(chat); return; }
    setFailed(false);
    setSelected(previous => previous.some(item => item.chatId === chat.chatId) ? previous.filter(item => item.chatId !== chat.chatId) : [...previous, chat]);
    setQuery('');
  };
  const send = async () => {
    if (busyRef.current || !selected.length) return;
    busyRef.current = true; setBusy(true); setFailed(false);
    try {
      const remaining = await onSend(selected, comment.trim());
      setSelected(remaining);
      if (remaining.length) setFailed(true); else onClose();
    } catch { setFailed(true); }
    finally { busyRef.current = false; setBusy(false); }
  };
  return <Sheet isOpen onClose={() => { if (!busyRef.current) onClose(); }} title={t('chat_actions.share_with')} closeIcon={<TelegramIcon name="close" />} className="cv-forward-picker popup-forward" headerActions={!multiSelect && <button type="button" className="cv-forward-select-toggle" aria-label={t('chat_actions.select')} onClick={() => { setMultiSelect(true); searchRef.current?.focus(); }}><TelegramIcon name="select" /></button>} actions={multiSelect && selected.length > 0 && <div className="cv-forward-comment simple-message-input-container"><textarea rows={1} maxLength={4096} value={comment} onChange={event => setComment(event.target.value)} placeholder={t('chat_actions.add_comment')} aria-label={t('chat_actions.add_comment')} disabled={busy} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(); } }} /><button type="button" className="cv-forward-send" aria-label={t('messages.send')} disabled={busy} onClick={() => void send()}><TelegramIcon name="logo" /></button></div>}>
    <span className="cv-forward-announcement">{t('chat_actions.selected', { count: messages.length })}</span>
    <div className="cv-forward-selector selector" data-multiselect={multiSelect} aria-busy={busy}>
      <div className="cv-forward-search-section selector-search">
        {multiSelect && selected.map(chat => <button key={chat.chatId} type="button" className="cv-forward-chip selector-user" aria-label={`${chat.name}: ${t('app.cancel')}`} disabled={busy} onClick={() => setSelected(previous => previous.filter(item => item.chatId !== chat.chatId))}><PeerAvatar chat={chat} /><span>{chat.name}</span><TelegramIcon name="close" /></button>)}
        <label className="cv-forward-search-label"><TelegramIcon name="search" /><input ref={searchRef} type="search" className="cv-forward-search selector-search-input" value={query} onChange={event => setQuery(event.target.value)} placeholder={t('messages.search')} aria-label={t('messages.search')} disabled={busy} /></label>
      </div>
      {!query && recent.length > 0 && <div className="cv-forward-top-peers popup-forward-top-peers scrollable scrollable-x" aria-label={t('chat_actions.forward_to')}>{recent.map(chat => <button key={chat.chatId} type="button" className="cv-forward-top-peer" aria-label={chat.name} aria-pressed={multiSelect ? selected.some(item => item.chatId === chat.chatId) : undefined} disabled={busy} onClick={() => pick(chat)}><PeerAvatar chat={chat} /><span><bdi>{chat.name.split(/\s+/)[0]}</bdi></span></button>)}</div>}
      {failed && <p className="cv-forward-error" role="alert">{t('chat_actions.action_failed')}</p>}
      <div className="cv-forward-destinations selector-list-section-container">
        <Virtuoso data={filtered} computeItemKey={(_, chat) => chat.chatId!} components={{ EmptyPlaceholder: () => <div className="cv-forward-empty"><TelegramIcon name="search" /><p>{t('chat_actions.no_chats')}</p></div> }} itemContent={(_, chat) => {
          const isSelected = selected.some(item => item.chatId === chat.chatId);
          return <div className="cv-forward-recipient" data-selected={isSelected} data-multiselect={multiSelect}>
            <TelegramChatListRow ripple={false} selection={multiSelect} chat={{ ...chat, lastMessage: chat.type === 'group' ? t('messages.groups') : chat.username ? `@${chat.username}` : t('messages.user'), lastTime: '', unread: 0, lastMessageOutgoing: false, encrypted: false }} selected={isSelected} typing={false} onSelect={() => pick(chat)} onMenu={() => {}}>{multiSelect && <span className="cv-forward-selection-mark" aria-hidden="true">{isSelected && <TelegramIcon name="check" />}</span>}</TelegramChatListRow>
          </div>;
        }} />
      </div>
      <span className="cv-forward-announcement" role="status">{multiSelect && t('chat_actions.selected', { count: selected.length })}</span>
    </div>
  </Sheet>;
}
