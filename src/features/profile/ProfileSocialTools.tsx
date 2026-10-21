import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GroupedSection, ListRow, Sheet } from '@/components/ui/Interface';
import Switch from '@/components/ui/Switch';
import TelegramIcon from '@/features/chat/TelegramIcon';
import { socialApi, type Friend } from './socialApi';
import './profile-social.css';

export default function ProfileSocialTools({ ownerId, viewerId, own, authenticated, onLogin, onFriendshipChange }: {
 ownerId: string; viewerId: string; own: boolean; authenticated: boolean; onLogin: () => void; onFriendshipChange: (accepted: boolean) => void;
}) {
 const { t } = useTranslation('common');
 const [friend, setFriend] = useState<Friend | null>(null), [friendLoading, setFriendLoading] = useState(true), [friendFailed, setFriendFailed] = useState(false);
 const [grant, setGrant] = useState(false), [grantLoading, setGrantLoading] = useState(true), [grantFailed, setGrantFailed] = useState(false);
 const [remove, setRemove] = useState(false);
 const [failed, setFailed] = useState(false), [busy, setBusy] = useState(false), [retry, setRetry] = useState(0), locked = useRef(false);
 useEffect(() => {
  if (!authenticated || own) return;
  let active = true; setFriendLoading(true); setGrantLoading(true); setFriendFailed(false); setGrantFailed(false);
  void socialApi.status(ownerId).then(data => { if (active) { setFriend(data.friendship); onFriendshipChange(data.friendship?.status === 'accepted'); } }).catch(() => { if (active) setFriendFailed(true); }).finally(() => { if (active) setFriendLoading(false); });
  void socialApi.ownGrant(ownerId).then(data => { if (active) setGrant(data.access.status === 'approved'); }).catch(() => { if (active) setGrantFailed(true); }).finally(() => { if (active) setGrantLoading(false); });
  return () => { active = false; };
 }, [authenticated, own, ownerId, retry, onFriendshipChange]);
 useEffect(() => { if (!authenticated) { setGrant(false); setFriend(null); } }, [authenticated]);
 const mutate = async (work: () => Promise<void>) => {
  if (!authenticated) { onLogin(); return; }
  if (locked.current) return; locked.current = true; setBusy(true); setFailed(false);
  try { await work(); } catch { setFailed(true); } finally { locked.current = false; setBusy(false); }
 };
 const change = (decision?: 'accepted' | 'denied' | 'cancelled' | 'removed') => mutate(async () => {
  const response = decision && friend ? await socialApi.change(friend.request_id, decision) : await socialApi.request(ownerId);
  setFriend(response.friendship); onFriendshipChange(response.friendship.status === 'accepted'); setRemove(false);
 });
 const pending = friend?.status === 'pending', incoming = pending && String(friend.requester_id) !== viewerId;
 if (own) return null;
 return <div className="cv-profile-social-tools">
  <GroupedSection>
   <ListRow title={t('social.friends')} icon={<TelegramIcon name="group" />} description={pending ? t(incoming ? 'social.incoming_request' : 'social.request_sent') : undefined} accessory={<div className="cv-profile-social-row-actions">
    {friendFailed ? <button type="button" onClick={() => setRetry(value => value + 1)}>{t('emoticons.retry')}</button> : <>
     {incoming && <button type="button" disabled={busy} onClick={() => void change('accepted')}>{t('social.accept')}</button>}
     <button type="button" disabled={busy || (authenticated && friendLoading)} onClick={() => { if (friend?.status === 'accepted') setRemove(true); else void change(pending ? incoming ? 'denied' : 'cancelled' : undefined); }}>{t(authenticated && friendLoading ? 'emoticons.loading' : friend?.status === 'accepted' ? 'social.remove_friend' : pending ? incoming ? 'social.decline' : 'social.cancel_request' : 'social.request_friend')}</button>
    </>}
   </div>} />
   {!own && authenticated && <ListRow title={t('social.show_my_private_photos')} description={grantFailed ? t('chat_actions.action_failed') : t(grant ? 'social.access_granted' : 'social.access_hidden')} accessory={grantFailed ? <button type="button" onClick={() => setRetry(value => value + 1)}>{t('emoticons.retry')}</button> : <Switch checked={grant} disabled={busy || grantLoading} aria-label={t('social.show_my_private_photos')} onChange={show => void mutate(async () => { const result = await socialApi.setOwnGrant(ownerId, show); setGrant(result.access.status === 'approved'); })} />} />}
  </GroupedSection>
  {failed && <p className="cv-profile-social-error" role="alert">{t('chat_actions.action_failed')}</p>}
  <Sheet isOpen={remove} onClose={() => { if (!busy) setRemove(false); }} variant="alert" className="cv-chat-confirm" title={t('social.remove_friend')} hideCloseButton actions={<><button type="button" className="cv-confirm-cancel" disabled={busy} onClick={() => setRemove(false)}>{t('app.cancel')}</button><button type="button" className="cv-confirm-danger" disabled={busy} onClick={() => void change('removed')}>{t('social.remove_friend')}</button></>}><p>{t('social.friendship_confirm')}</p></Sheet>
 </div>;
}
