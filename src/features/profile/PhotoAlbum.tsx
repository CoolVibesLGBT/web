import { useEffect, useRef, useState, forwardRef, type ReactNode, type HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';
import { Virtuoso, VirtuosoGrid } from 'react-virtuoso';
import { Sheet, ListRow } from '@/components/ui/Interface';
import ViewTabs from '@/components/ui/ViewTabs';
import Switch from '@/components/ui/Switch';
import { useSocket } from '@/contexts/SocketContext';
import TelegramIcon from '@/features/chat/TelegramIcon';
import ChatAvatarImage from '@/features/chat/ChatAvatarImage';
import { socialApi, type Photo, type PhotoAccess, type AccessRequest } from './socialApi';
import ContentPanel from '@/components/ui/ContentPanel';
import PhotoUploadSheet from './PhotoUploadSheet';
import LottieAnimation from '@/features/animations/LottieAnimation';

const Grid = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function Grid(props, ref) { return <div {...props} ref={ref} className="cv-profile-photo-grid" />; });
const GridItem = (props: HTMLAttributes<HTMLDivElement>) => <div {...props} className="cv-profile-photo-cell" />;
const photoURL = (photo: Photo) => photo.file.variants?.image?.medium?.url || photo.file.variants?.image?.thumbnail?.url || photo.file.url;
const gridComponents = { List: Grid, Item: GridItem };

/** A measured, bounded grid: empty albums never reserve a full modal of blank space. */
function AlbumGrid({ count, own, children }: { count: number; own: boolean; children: ReactNode }) {
 const ref = useRef<HTMLDivElement>(null), [height, setHeight] = useState(160);
 useEffect(() => {
  const node = ref.current;
  if (!node) return;
  const measure = () => {
   const columns = matchMedia('(max-width:360px)').matches ? 2 : 3, rows = Math.ceil(count / columns);
   const style = getComputedStyle(node), inset = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
   const width = node.clientWidth - inset;
   setHeight(Math.ceil(rows * ((width - (columns - 1) * 4) / columns + (own ? 44 : 0)) + Math.max(0, rows - 1) * 4 + inset));
  };
  const observer = new ResizeObserver(measure); observer.observe(node); measure();
  return () => observer.disconnect();
 }, [count, own]);
 return <div ref={ref} className="cv-profile-social-list cv-panel-card cv-profile-photo-grid-container" style={{ height }}>{children}</div>;
}

export default function PhotoAlbum({ ownerId, own, onClose, embedded = false }: { ownerId: string; own: boolean; onClose: () => void; embedded?: boolean }) {
 const { t } = useTranslation('common'), { socket } = useSocket();
 const [tab, setTab] = useState('private'), [requests, setRequests] = useState<AccessRequest[]>([]), [photos, setPhotos] = useState<Photo[]>([]);
 const [access, setAccess] = useState<PhotoAccess>({ status: 'none' }), [count, setCount] = useState(0), [reload, setReload] = useState(0);
 const [loading, setLoading] = useState(true), [failed, setFailed] = useState(false), [busy, setBusy] = useState(false);
 const [viewing, setViewing] = useState<Photo | null>(null), [deleting, setDeleting] = useState<Photo | null>(null);
 const [uploadOpen, setUploadOpen] = useState(false);
 const locked = useRef(false);
 useEffect(() => {
  let active = true; setLoading(true); setFailed(false); setPhotos([]);
  const request = tab === 'requests' ? socialApi.accessRequests().then(data => { if (active) setRequests(data.requests || []); }) : socialApi.photos(ownerId, tab === 'private').then(data => { if (active) { setPhotos(data.photos || []); setCount(data.count); setAccess(data.access || { status: 'owner' }); if (!own && data.access?.status !== 'approved') setViewing(null); } });
  void request.catch(() => { if (active) setFailed(true); }).finally(() => { if (active) setLoading(false); });
  return () => { active = false; };
 }, [ownerId, own, tab, reload]);
 useEffect(() => {
  const invalidated = (raw: unknown) => {
   try {
    const event = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (event?.version !== '1' || String(event.data?.owner_id) !== ownerId) return;
    if (event.type === 'private_photos.access.revoked' || event.type === 'private_photos.access.invalidated') { setPhotos([]); setViewing(null); setAccess({ status: 'revoked' }); }
    setReload(value => value + 1);
   } catch { /* Ignore unknown socket envelopes. */ }
  };
  const visible = () => { if (!document.hidden) setReload(value => value + 1); };
  socket?.on('private_photo_changed', invalidated); socket?.on('connect', visible); document.addEventListener('visibilitychange', visible);
  return () => { socket?.off('private_photo_changed', invalidated); socket?.off('connect', visible); document.removeEventListener('visibilitychange', visible); };
 }, [socket, ownerId]);
 const mutate = async (work: () => Promise<unknown>) => {
  if (locked.current) return; locked.current = true; setBusy(true); setFailed(false);
  try { await work(); setReload(value => value + 1); } catch { setFailed(true); }
  finally { locked.current = false; setBusy(false); }
 };
 const permitted = own || access.status === 'approved';
 return <ContentPanel embedded={embedded} isOpen onClose={() => { if (!busy) onClose(); }} title={t(own ? 'social.photos' : 'social.private_photos')} className="cv-profile-social-sheet cv-photo-album cv-panel-sheet" closeIcon={<TelegramIcon name="close" />} headerActions={own && tab === 'private' ? <button type="button" className="cv-icon-button cv-panel-header-action" disabled={busy} aria-label={t('social.upload_photos')} onClick={() => setUploadOpen(true)}><TelegramIcon name="plus" /></button> : undefined}>
  {own && <ViewTabs items={[{ id: 'private', label: t('social.private_photos') }, { id: 'public', label: t('social.public_photos') }, { id: 'requests', label: t('social.access_requests') }]} activeId={tab} onSelect={id => { if (!busy) setTab(id); }} label={t('social.photos')} />}
  {failed && <p role="alert" className="cv-profile-social-error">{t('chat_actions.action_failed')} <button type="button" onClick={() => setReload(value => value + 1)}>{t('emoticons.retry')}</button></p>}
  {uploadOpen && <PhotoUploadSheet onClose={() => setUploadOpen(false)} onUploaded={() => { setFailed(false); setReload(value => value + 1); }} />}
  {!own && !loading && !permitted && <div className="cv-profile-photo-locked cv-panel-card"><LottieAnimation src="/animations/telegram/assets/UtyanPasscode.json" size={128} /><p>{t(access.status === 'pending' ? 'social.photos_pending' : 'social.photos_locked', { count })}</p><button type="button" className="cv-profile-social-primary" disabled={busy || access.status === 'pending' || count === 0} onClick={() => void mutate(async () => { const response = await socialApi.requestPhotos(ownerId); setAccess(response.access); })}>{t(access.status === 'pending' ? 'social.request_sent' : 'social.request_photos')}</button></div>}
  {!loading && !failed && (tab === 'requests' ? requests.length ? <div className="cv-profile-social-list cv-panel-card" style={{ height: `min(44dvh, ${Math.max(96, requests.length * 80)}px)` }}><Virtuoso defaultItemHeight={80} data={requests} computeItemKey={(_, item) => item.request_id} components={{ EmptyPlaceholder: () => <p className="cv-profile-social-empty">{t(loading ? 'emoticons.loading' : 'social.no_photo_requests')}</p> }} itemContent={(_, item) => <ListRow title={<bdi>{item.viewer.displayname || item.viewer.username}</bdi>} description={<bdi>@{item.viewer.username}</bdi>} accessory={<div className="cv-profile-social-row-actions">{item.status === 'pending' && <button type="button" disabled={busy} onClick={() => void mutate(() => socialApi.respondPhotos(item.request_id, 'denied'))}>{t('social.decline')}</button>}<Switch checked={item.status === 'approved'} disabled={busy} aria-label={`${item.viewer.displayname || item.viewer.username}: ${t('social.show_my_private_photos')}`} onChange={show => void mutate(() => show ? item.status === 'pending' ? socialApi.respondPhotos(item.request_id, 'approved') : socialApi.setOwnGrant(String(item.viewer_id), true) : socialApi.setOwnGrant(String(item.viewer_id), false))} /></div>} />} /></div> : <div className="cv-panel-card cv-panel-empty"><TelegramIcon name="group" /><p>{t('social.no_photo_requests')}</p></div> : permitted && (photos.length ? <AlbumGrid count={photos.length} own={own}><VirtuosoGrid data={photos} components={gridComponents} itemContent={(_, photo) => <article className="cv-profile-photo"><button type="button" className="cv-profile-photo-open" aria-label={t('social.photos')} disabled={!photoURL(photo)} onClick={() => setViewing(photo)}>{photoURL(photo) ? <ChatAvatarImage src={photoURL(photo)} protectedMedia alt="" /> : <span>{t('emoticons.loading')}</span>}</button>{own && <div className="cv-profile-photo-actions"><Switch checked={tab === 'private'} disabled={busy} aria-label={`${photo.public_id}: ${t('social.private_photos')}`} onChange={privateAlbum => void mutate(() => socialApi.move(photo.public_id, privateAlbum))} />{tab === 'private' && <button type="button" className="cv-icon-button" aria-label={t('chat_actions.remove_photo')} disabled={busy} onClick={() => setDeleting(photo)}><TelegramIcon name="delete" /></button>}</div>}</article>} /></AlbumGrid> : <div className="cv-panel-card cv-panel-empty"><TelegramIcon name="image" /><p>{t('social.no_photos')}</p>{own && tab === 'private' && <><span>{t('social.private_upload_hint')}</span><button type="button" onClick={() => setUploadOpen(true)}>{t('social.choose_photos')}</button></>}</div>))}
  {loading && <div role="status" className="cv-panel-loading"><progress aria-label={t('emoticons.loading')} /><span>{t('emoticons.loading')}</span></div>}
  <Sheet isOpen={!!viewing} onClose={() => setViewing(null)} title={t('social.photos')} className="cv-profile-photo-preview" closeIcon={<TelegramIcon name="close" />}>{viewing && <ChatAvatarImage src={photoURL(viewing)} protectedMedia alt="" />}</Sheet>
  <Sheet isOpen={!!deleting} onClose={() => { if (!busy) setDeleting(null); }} variant="alert" className="cv-chat-confirm" title={t('chat_actions.remove_photo')} hideCloseButton actions={<><button type="button" className="cv-confirm-cancel" disabled={busy} onClick={() => setDeleting(null)}>{t('app.cancel')}</button><button type="button" className="cv-confirm-danger" disabled={busy} onClick={() => void mutate(async () => { if (deleting) await socialApi.delete(deleting.public_id); setDeleting(null); })}>{t('chat_actions.remove_photo')}</button></>}><p>{t('social.delete_photo_confirm')}</p></Sheet>
 </ContentPanel>;
}
