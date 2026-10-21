import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@/router';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { getSafeImageURLEx } from '@/helpers/helpers';
import { NavigationBar } from '@/components/ui/Interface';
import AuthWizard from '@/features/auth/AuthWizard';
import ChatAvatarImage from '@/features/chat/ChatAvatarImage';
import TelegramIcon from '@/features/chat/TelegramIcon';
import type { ChatItem } from '@/state/chat';
import '@/features/chat/group-details.css';

type Preview = { id: string; title: Record<string, string>; description?: Record<string, string>; visibility: string; public_username?: string; avatar?: unknown; member_count: number };
export default function GroupInviteScreen({ token, username }: { token?: string; username?: string }) {
 const { t, i18n } = useTranslation('common'); const navigate = useNavigate(); const { user, isAuthenticated } = useAuth();
 const [group, setGroup] = useState<Preview | null>(null), [failed, setFailed] = useState(false), [busy, setBusy] = useState(false), [auth, setAuth] = useState(false), [retry, setRetry] = useState(0);
 const text = (value?: Record<string, string>) => value?.[i18n.language] || value?.en || Object.values(value || {}).find(Boolean) || '';
 useEffect(() => {
  let active = true; setFailed(false); setGroup(null);
  void api.previewGroup({ invite_token: token, public_username: username }).then(response => { if (active) setGroup(response.group); }).catch(() => { if (active) setFailed(true); });
  return () => { active = false; };
 }, [token, username, retry]);
 const join = async () => {
  if (!isAuthenticated) { setAuth(true); return; }
  if (busy || !group) return;
  setBusy(true); setFailed(false);
  try {
   const response = await api.joinGroup({ invite_token: token, public_username: username }), chat = response.chat;
   const title = text(chat.title);
   const item: ChatItem = { id: chat.id, chatId: chat.id, type: 'group', name: title, description: text(chat.description), visibility: chat.visibility, publicUsername: chat.public_username, participantCount: chat.participants?.length, username: '', emojis: '', avatar: chat.avatar ? getSafeImageURLEx(chat.id, chat.avatar, 'thumbnail') : null, avatarLetter: title.charAt(0).toLocaleUpperCase(), lastMessage: '', lastTime: '', unread: 0, online: false, verified: false, encrypted: false, canManage: String(chat.creator_id) === String(user?.id) };
   navigate('/messages', { state: { groupChat: item } });
  } catch { setFailed(true); } finally { setBusy(false); }
 };
 return <section className="cv-group-invitation">
  <NavigationBar title={t('chat_actions.group_info')} onBack={() => navigate('/messages')} backIcon={<TelegramIcon name="arrow_prev" />} />
  <div className="cv-group-invitation-card">
   {!group && !failed && <p role="status">{t('emoticons.loading')}</p>}
   {group && <><div className="cv-group-info-avatar"><span>{text(group.title).charAt(0)}</span>{group.visibility === 'public' && group.avatar ? <ChatAvatarImage src={getSafeImageURLEx(group.id, group.avatar, 'thumbnail') || undefined} alt="" /> : null}</div><h1><bdi>{text(group.title)}</bdi></h1><p>{t('chat_actions.member_count', { count: group.member_count })}</p><p>{text(group.description)}</p><p>{t(group.visibility === 'public' ? 'chat_actions.public_group' : 'chat_actions.private_group')}</p><button type="button" className="cv-group-save" disabled={busy} onClick={() => void join()}>{t('chat_actions.join_group')}</button></>}
   {failed && <div role="alert"><p>{t(group ? 'chat_actions.action_failed' : 'chat_actions.invalid_group_link')}</p>{!group && <button type="button" className="cv-group-save" onClick={() => setRetry(value => value + 1)}>{t('emoticons.retry')}</button>}</div>}
  </div>
  <AuthWizard isOpen={auth} onClose={() => setAuth(false)} />
 </section>;
}
