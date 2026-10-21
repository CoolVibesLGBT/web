// Adapted from tweb _chatlist.scss / _row.scss and base.scss's avatar palette.
import { Check, CheckCheck, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import type { ChatItem } from '@/state/chat';
import TelegramIcon from './TelegramIcon';

const AVATARS = [
  ['#ff845e', '#d45246'], ['#febb5b', '#f68136'], ['#b694f9', '#6c61df'],
  ['#9ad164', '#46ba43'], ['#53edd6', '#28c9b7'], ['#5caffa', '#408acf'], ['#ff8aac', '#d95574'],
];

export default function TelegramChatListRow({ chat, selected, typing, onSelect, onMenu, children, selection = false, ripple = true }: {
  selection?: boolean;
  ripple?: boolean;
  chat: ChatItem;
  selected: boolean;
  typing: boolean;
  onSelect: () => void;
  onMenu: (point: { x: number; y: number }) => void;
  children: ReactNode;
}) {
  const { t } = useTranslation('common');
  const color = AVATARS[Array.from(chat.id).reduce((hash, letter) => hash + letter.charCodeAt(0), 0) % AVATARS.length];
  const preview = typing ? t('messages.typing') : (chat.lastMessage || '').replace(/\s+/g, ' ');
  return <div className={`cv-chat-row chatlist-chat${selected ? ' is-active' : ''}`} data-selected={selected} onContextMenu={event => { event.preventDefault(); const box = event.currentTarget.getBoundingClientRect(); onMenu({ x: event.clientX || box.left + box.width / 2, y: event.clientY || box.top + box.height / 2 }); }}>
    <button type="button" className="cv-chat-row-main" aria-current={!selection && selected ? 'true' : undefined} aria-pressed={selection ? selected : undefined} data-ripple={ripple ? undefined : 'off'} onClick={onSelect}>
      <span className="cv-dialog-avatar dialog-avatar" style={{ background: `linear-gradient(180deg, ${color[0]}, ${color[1]})` }}>
        <span className="cv-dialog-initial">{chat.avatarLetter || chat.name.charAt(0).toLocaleUpperCase()}</span>
        {chat.avatar && <img src={chat.avatar} alt="" onError={event => { event.currentTarget.style.display = 'none'; }} />}
        {chat.online && <span className="cv-dialog-online" />}
      </span>
      <span className="cv-dialog-copy">
        <span className="cv-dialog-title-row">
          <span className="cv-dialog-title user-title"><bdi>{chat.name}</bdi>{chat.verified && <Check aria-hidden="true" />}{chat.muted && <TelegramIcon name="mute" className="cv-dialog-muted" />}{chat.emojis && <span>{chat.emojis}</span>}</span>
          <span className="cv-dialog-time dialog-title-details">{chat.lastMessageOutgoing && (chat.lastMessageRead ? <CheckCheck aria-hidden="true" /> : <Check aria-hidden="true" />)}<bdi>{chat.lastTime}</bdi></span>
        </span>
        <span className="cv-dialog-subtitle-row">
          <span className="cv-dialog-preview user-last-message" data-typing={typing}>{chat.encrypted && <Lock aria-hidden="true" />}<bdi>{preview}</bdi></span>
          {chat.unread > 0 && <span className="cv-dialog-unread unread" data-muted={chat.muted}>{new Intl.NumberFormat(document.documentElement.lang || undefined).format(chat.unread)}</span>}
        </span>
      </span>
    </button>
    {children}
  </div>;
}
