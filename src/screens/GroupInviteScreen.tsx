import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@/router';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { getLocalizedContent, getSafeImageURLEx } from '@/helpers/helpers';
import { NavigationBar } from '@/components/ui/Interface';
import AuthWizard from '@/features/auth/AuthWizard';
import ChatAvatarImage from '@/features/chat/ChatAvatarImage';
import ChatWallpaper from '@/features/appearance/ChatWallpaper';
import TelegramIcon from '@/features/chat/TelegramIcon';
import { buildGroupChatItem, type PublicGroupPreview } from '@/features/chat/groupChatItem';
import '@/features/chat/group-details.css';
import '@/features/appearance/appearance.css';

export default function GroupInviteScreen({ token, username }: { token?: string; username?: string }) {
 const { t, i18n } = useTranslation('common'); const navigate = useNavigate(); const { user, isAuthenticated } = useAuth();
 const [group, setGroup] = useState<PublicGroupPreview | null>(null), [failed, setFailed] = useState(false), [busy, setBusy] = useState(false), [auth, setAuth] = useState(false), [retry, setRetry] = useState(0);
 const text = (value?: Record<string, string>) => String(getLocalizedContent(value, i18n.language) || '');
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
   const response = await api.joinGroup({ invite_token: token, public_username: username });
   const item = buildGroupChatItem(response.chat, i18n.language, user?.id);
   navigate('/messages', { state: { groupChat: item } });
  } catch { setFailed(true); } finally { setBusy(false); }
 };
 // Private/invite-only groups keep their avatar, cover and hero hidden until
 // the viewer has actually joined.
 const avatarUrl = group && group.visibility === 'public' && group.avatar?.file?.url ? getSafeImageURLEx(group.id, group.avatar, 'thumbnail') : null;
 const coverUrl = group && group.visibility === 'public'
  ? group.cover?.file?.url ? getSafeImageURLEx(group.id, group.cover, 'large')
   : group.hero?.file?.url ? getSafeImageURLEx(group.id, group.hero, 'large')
   : null
  : null;
 // The page backdrop is the group's own hero photo (falling back to its
 // cover) when it has one — not the viewer's personal chat wallpaper, which
 // only applies once there's no group photo to show at all.
 const wallpaperUrl = group && group.visibility === 'public'
  ? group.hero?.file?.url ? getSafeImageURLEx(group.id, group.hero, 'large')
   : group.cover?.file?.url ? getSafeImageURLEx(group.id, group.cover, 'large')
   : null
  : null;
 return <section className="cv-group-invitation">
  {wallpaperUrl ? <div className="cv-group-invitation-wallpaper" style={{ backgroundImage: `url("${wallpaperUrl}")` }} aria-hidden="true" /> : <ChatWallpaper />}
  <NavigationBar title={t('chat_actions.group_info')} onBack={() => navigate('/messages')} backIcon={<TelegramIcon name="arrow_prev" />} />
  <div className="cv-group-invitation-body">
   <div className="cv-group-invitation-card">
    {!group && !failed && <p role="status">{t('emoticons.loading')}</p>}
    {group && <>
     {coverUrl && <div className="cv-group-invitation-cover" style={{ backgroundImage: `url("${coverUrl}")` }} />}
     <div className={`cv-group-info-avatar${coverUrl ? ' cv-group-info-avatar--overlap' : ''}`}>
      <span>{text(group.title).charAt(0)}</span>
      {avatarUrl && <ChatAvatarImage protectedMedia src={avatarUrl} alt="" />}
     </div>
     <h1><bdi>{text(group.title)}</bdi></h1>
     <p>{t('chat_actions.member_count', { count: group.member_count })}</p>
     <p>{text(group.description)}</p>
     <p>{t(group.visibility === 'public' ? 'chat_actions.public_group' : 'chat_actions.private_group')}</p>
     <button type="button" className="cv-group-save" disabled={busy} onClick={() => void join()}>{t('chat_actions.join_group')}</button>
    </>}
    {failed && <div role="alert"><p>{t(group ? 'chat_actions.action_failed' : 'chat_actions.invalid_group_link')}</p>{!group && <button type="button" className="cv-group-save" onClick={() => setRetry(value => value + 1)}>{t('emoticons.retry')}</button>}</div>}
   </div>
  </div>
  <AuthWizard isOpen={auth} onClose={() => setAuth(false)} />
 </section>;
}
