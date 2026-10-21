import ChatAvatarImage from './ChatAvatarImage';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ChatItem } from '@/state/chat';

export default function ChatPeerHeader({ chat, expanded, typing, onClick }: {
  chat: ChatItem; expanded: boolean; typing: boolean; onClick: () => void;
}) {
  const { t } = useTranslation('common');
  const [failedAvatar, setFailedAvatar] = useState(false);
  return <button type="button" className="cv-chat-peer" onClick={onClick} aria-expanded={expanded}>
    <span className="cv-chat-peer-avatar"><span>{chat.avatarLetter || chat.name.charAt(0).toLocaleUpperCase()}</span>{chat.avatar && !failedAvatar && <ChatAvatarImage protectedMedia={chat.type === 'group'} src={chat.avatar} alt="" onError={() => setFailedAvatar(true)} />}</span>
    <span className="cv-chat-peer-copy"><strong><bdi>{chat.name}</bdi></strong><small>{typing ? t('messages.typing') : chat.type === 'group' ? t('chat_actions.member_count', { count: chat.participantCount || 0 }) : chat.username ? <bdi>@{chat.username}</bdi> : t('messages.user')}</small></span>
  </button>;
}
