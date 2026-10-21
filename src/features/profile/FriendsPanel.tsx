import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Virtuoso } from 'react-virtuoso';
import { ListRow } from '@/components/ui/Interface';
import ContentPanel from '@/components/ui/ContentPanel';
import ViewTabs from '@/components/ui/ViewTabs';
import TelegramIcon from '@/features/chat/TelegramIcon';
import { socialApi, type Friend } from './socialApi';

export default function FriendsPanel({ onClose, embedded = false }: { onClose: () => void; embedded?: boolean }) {
 const { t } = useTranslation('common');
 const [tab, setTab] = useState('friends'), [rows, setRows] = useState<Friend[]>([]), [next, setNext] = useState<string>();
 const [loading, setLoading] = useState(true), [failed, setFailed] = useState(false), [busy, setBusy] = useState('');
 const fetching = useRef(false), generation = useRef(0);
 useEffect(() => {
  const current = ++generation.current; setLoading(true); setFailed(false); setRows([]); setNext(undefined); fetching.current = true;
  void socialApi.friends(tab).then(data => { if (current === generation.current) { setRows(data.friendships || []); setNext(data.cursor); } }).catch(() => { if (current === generation.current) setFailed(true); }).finally(() => { if (current === generation.current) { setLoading(false); fetching.current = false; } });
  return () => { generation.current++; };
 }, [tab]);
 const more = async () => {
  if (fetching.current || (!next && rows.length)) return;
  const current = generation.current; fetching.current = true; setLoading(true); setFailed(false);
  try { const data = await socialApi.friends(tab, next); if (current === generation.current) { setRows(previous => [...previous, ...(data.friendships || []).filter(item => !previous.some(peer => peer.request_id === item.request_id))]); setNext(data.cursor); } }
  catch { if (current === generation.current) setFailed(true); }
  finally { if (current === generation.current) { fetching.current = false; setLoading(false); } }
 };
 const change = async (peer: Friend, decision: 'accepted' | 'denied' | 'cancelled' | 'removed') => {
  if (busy) return; setBusy(peer.request_id); setFailed(false);
  try { await socialApi.change(peer.request_id, decision); setRows(previous => previous.filter(item => item.request_id !== peer.request_id)); }
  catch { setFailed(true); } finally { setBusy(''); }
 };
 return <ContentPanel embedded={embedded} isOpen onClose={onClose} title={t('social.friends')} className="cv-profile-social-sheet cv-panel-sheet" closeIcon={<TelegramIcon name="close" />}>
  <ViewTabs items={['friends','incoming','outgoing'].map(id => ({ id, label: t(`social.${id}`) }))} activeId={tab} onSelect={setTab} label={t('social.friends')} />
  {failed && <p role="alert">{t('chat_actions.action_failed')} <button type="button" onClick={() => void more()}>{t('emoticons.retry')}</button></p>}
  <div className="cv-profile-social-list cv-panel-card" style={{ height: `min(48dvh, ${Math.max(96, rows.length * 80)}px)`, flex: '0 0 auto' }}><Virtuoso defaultItemHeight={80} data={rows} computeItemKey={(_, peer) => peer.request_id} endReached={() => { if (next) void more(); }} components={{ EmptyPlaceholder: () => <p className="cv-profile-social-empty">{t(loading ? 'emoticons.loading' : tab === 'friends' ? 'social.no_friends' : tab === 'incoming' ? 'social.incoming_empty' : 'social.outgoing_empty')}</p> }} itemContent={(_, peer) => <ListRow icon={<span className="cv-profile-social-avatar">{(peer.user.displayname || peer.user.username).charAt(0)}{peer.user.avatar?.file?.url && <img src={peer.user.avatar.file.url} alt="" />}</span>} title={<bdi>{peer.user.displayname || peer.user.username}</bdi>} description={<bdi>@{peer.user.username}</bdi>} accessory={<div className="cv-profile-social-row-actions">{tab === 'incoming' && <button type="button" disabled={!!busy} onClick={() => void change(peer, 'accepted')}>{t('social.accept')}</button>}<button type="button" disabled={!!busy} className={tab === 'friends' ? 'is-danger' : ''} onClick={() => void change(peer, tab === 'incoming' ? 'denied' : tab === 'outgoing' ? 'cancelled' : 'removed')}>{t(tab === 'incoming' ? 'social.decline' : tab === 'outgoing' ? 'app.cancel' : 'social.remove_friend')}</button></div>} />} /></div>
 </ContentPanel>;
}
