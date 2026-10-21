import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Virtuoso } from 'react-virtuoso';
import { FormField, GroupedSection, ListRow, NavigationBar, Sheet } from '@/components/ui/Interface';
import Switch from '@/components/ui/Switch';
import { api } from '@/services/api';
import { Actions } from '@/services/actions';
import type { ChatItem } from '@/state/chat';
import { getSafeImageURLEx } from '@/helpers/helpers';
import TelegramIcon from './TelegramIcon';
import ChatAvatarImage from './ChatAvatarImage';
import GroupAvatarField from './GroupAvatarField';
import GroupComposer from './GroupComposer';
import ClipboardFeedback from './ClipboardFeedback';
import useClipboard from '@/hooks/useClipboard';
import './group-details.css';

type Participant = { user_id: string; user: { id: string; username: string; displayname: string; avatar?: unknown } };

/** Group peers have their own information/settings/member flow, never a user profile lookup. */
export default function GroupDetails({ chat, chats, viewerId, viewerName, onClose, onUpdated, onLeave }: {
 chat: ChatItem; chats: ChatItem[]; viewerId: string; viewerName: string;
 onClose: () => void; onUpdated: () => void; onLeave: () => void;
}) {
 const { t } = useTranslation('common');
 const [members, setMembers] = useState<Participant[]>([]), [loading, setLoading] = useState(true);
 const [editing, setEditing] = useState(false), [adding, setAdding] = useState(false);
 const [name, setName] = useState(chat.name), [description, setDescription] = useState(chat.description || '');
 const [isPublic, setIsPublic] = useState(chat.visibility === 'public'), [username, setUsername] = useState(chat.publicUsername || '');
 const [avatar, setAvatar] = useState<File | null>(null), [removeAvatar, setRemoveAvatar] = useState(false);
 const [invite, setInvite] = useState(''), [inviteFailed, setInviteFailed] = useState(false);
 const clipboard = useClipboard();
 const [scrollParent, setScrollParent] = useState<HTMLDivElement | null>(null);
 useEffect(() => { scrollParent?.scrollTo({ top: 0 }); clipboard.reset(); }, [editing, scrollParent, clipboard.reset]);
 const [failed, setFailed] = useState(false), [busy, setBusy] = useState(false), busyRef = useRef(false);
 const [confirmation, setConfirmation] = useState<{ kind: 'revoke' | 'remove' | 'leave'; peer?: Participant } | null>(null);
 const id = chat.chatId!;
 async function load() {
  setLoading(true); setFailed(false); setInviteFailed(false);
  try { const response = await api.fetchChatParticipants(id); setMembers(response.participants || []); }
  catch { setFailed(true); } finally { setLoading(false); }
  if (chat.canManage) {
   try { const result = await api.exportGroupInvite(id); if (!result.invite?.token) throw new Error('Missing invitation'); setInvite(result.invite.token); }
   catch { setInviteFailed(true); }
  }
 }
 useEffect(() => {
  let active = true;
  setLoading(true); setFailed(false); setInviteFailed(false);
  void api.fetchChatParticipants(id).then(response => { if (active) setMembers(response.participants || []); }).catch(() => { if (active) setFailed(true); }).finally(() => { if (active) setLoading(false); });
  if (chat.canManage) void api.exportGroupInvite(id).then(response => { if (active) { if (!response.invite?.token) throw new Error('Missing invitation'); setInvite(response.invite.token); } }).catch(() => { if (active) setInviteFailed(true); });
  return () => { active = false; };
 }, [id, chat.canManage]);
 const perform = async (work: () => Promise<void>) => {
  if (busyRef.current) return;
  busyRef.current = true; setBusy(true); setFailed(false);
  try { await work(); } catch { setFailed(true); }
  finally { busyRef.current = false; setBusy(false); }
 };
 const save = () => perform(async () => {
  await api.updateGroup(id, { title: name.trim(), description: description.trim(), avatar, remove_avatar: removeAvatar, visibility: isPublic ? 'public' : 'private', public_username: username });
  setEditing(false); setAvatar(null); onUpdated();
 });
 const inviteLink = invite ? `${location.origin}/invite/${invite}` : '';
 const publicLink = chat.visibility === 'public' && chat.publicUsername ? `${location.origin}/group/${chat.publicUsername}` : '';
 const copy = (value: string) => clipboard.copy(value);
 if (adding) return <GroupComposer chats={chats} viewerId={viewerId} viewerName={viewerName} excludedIds={members.map(member => String(member.user_id))} onClose={() => setAdding(false)} onCreated={() => {}} onMembersSelected={async ids => {
  // The server treats repeated additions as idempotent, including retry after a partial failure.
  for (const peer of ids) await api.addChatParticipant(id, peer);
  setAdding(false); await load(); onUpdated();
 }} />;
 return <section className="cv-group-info" aria-label={t(editing ? 'chat_actions.edit_group' : 'chat_actions.group_info')} aria-busy={busy}>
  <NavigationBar title={t(editing ? 'chat_actions.edit_group' : 'chat_actions.group_info')} onBack={() => { if (!busyRef.current) { if (editing) setEditing(false); else onClose(); } }} backIcon={<TelegramIcon name="arrow_prev" />} actions={chat.canManage && !editing ? <button type="button" className="cv-icon-button" aria-label={t('chat_actions.edit')} onClick={() => { setName(chat.name); setDescription(chat.description || ''); setIsPublic(chat.visibility === 'public'); setUsername(chat.publicUsername || ''); setAvatar(null); setRemoveAvatar(false); setEditing(true); }}><TelegramIcon name="edit" /></button> : undefined} />
  {failed && <div role="alert" className="cv-group-error">{t('chat_actions.action_failed')}<button type="button" onClick={() => void load()}>{t('emoticons.retry')}</button></div>}
  <div className="cv-group-info-content" ref={setScrollParent}>
  {editing ? <form className="cv-group-info-edit" onSubmit={event => { event.preventDefault(); void save(); }}>
   <GroupAvatarField value={avatar} initialUrl={removeAvatar ? undefined : chat.avatar} disabled={busy} onChange={file => { setAvatar(file); setRemoveAvatar(file === null); }} />
   <FormField label={t('chat_actions.group_name')}><input required maxLength={128} value={name} disabled={busy} onChange={event => setName(event.target.value)} /></FormField>
   <FormField label={t('chat_actions.group_description')}><textarea maxLength={255} rows={3} value={description} disabled={busy} onChange={event => setDescription(event.target.value)} /></FormField>
   <ListRow title={t('chat_actions.public_group')} description={t(isPublic ? 'chat_actions.public_group_hint' : 'chat_actions.private_group_hint')} accessory={<Switch checked={isPublic} disabled={busy} onChange={setIsPublic} aria-label={t('chat_actions.public_group')} />} />
   {isPublic && <FormField label={t('chat_actions.public_link')} hint={t('chat_actions.public_username_hint')}><input required minLength={5} maxLength={32} pattern="[a-z][a-z0-9_]{4,31}" value={username} disabled={busy} onChange={event => setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} /></FormField>}
   <button type="submit" className="cv-group-save" disabled={busy || !name.trim() || (isPublic && !/^[a-z][a-z0-9_]{4,31}$/.test(username))}>{t('chat_actions.save')}</button>
  </form> : <>
   <div className="cv-group-info-summary"><div className="cv-group-info-avatar"><span>{chat.avatarLetter || chat.name.charAt(0)}</span>{chat.avatar && <ChatAvatarImage src={chat.avatar} protectedMedia alt="" />}</div><h2><bdi>{chat.name}</bdi></h2><p>{t('chat_actions.member_count', { count: members.length || chat.participantCount || 0 })}</p></div>
   <div className="cv-group-info-sections">
    <GroupedSection>
     {chat.description && <ListRow icon={<TelegramIcon name="info" />} title={chat.description} description={t('chat_actions.group_description')} />}
     <ListRow icon={<TelegramIcon name="group" />} title={t(chat.visibility === 'public' ? 'chat_actions.public_group' : 'chat_actions.private_group')} description={t(chat.visibility === 'public' ? 'chat_actions.public_group_hint' : 'chat_actions.private_group_hint')} />
     {publicLink && <ListRow icon={<TelegramIcon name="link" />} title={<bdi>{publicLink}</bdi>} description={t('chat_actions.public_link')} onClick={() => void copy(publicLink)} />}
     {chat.canManage && <ListRow icon={<TelegramIcon name="link" />} title={t('chat_actions.invite_link')} description={inviteLink ? <bdi>{inviteLink}</bdi> : t(inviteFailed ? 'emoticons.error' : 'emoticons.loading')} onClick={inviteLink ? () => void copy(inviteLink) : inviteFailed ? () => void load() : undefined} />}
     {chat.canManage && inviteLink && <ListRow title={t('chat_actions.revoke_link')} onClick={() => setConfirmation({ kind: 'revoke' })} />}
     <ListRow title={t('chat_actions.notifications')} accessory={<Switch checked={!chat.muted} disabled={busy} onChange={() => void perform(async () => { await api.call(Actions.CMD_CHAT_SET_MUTED, { method: 'POST', body: { chat_id: id, muted: !chat.muted } }); onUpdated(); })} aria-label={t('chat_actions.notifications')} />} />
    </GroupedSection>
    {chat.canManage && <button type="button" className="cv-group-add" onClick={() => setAdding(true)}><TelegramIcon name="newgroup" />{t('chat_actions.add_members')}</button>}
    {!chat.canManage && <button type="button" className="cv-group-leave" onClick={() => setConfirmation({ kind: 'leave' })}>{t('chat_actions.leave_group')}</button>}
   </div>
   <div className="cv-group-info-members" aria-label={t('chat_actions.member_count', { count: members.length })}><Virtuoso defaultItemHeight={64} customScrollParent={scrollParent || undefined} data={members} computeItemKey={(_, peer) => peer.user_id} components={{ EmptyPlaceholder: () => <p>{t(loading ? 'emoticons.loading' : 'messages.no_chats_found')}</p> }} itemContent={(_, peer) => <ListRow icon={<span className="cv-group-member-avatar">{(peer.user.displayname || peer.user.username).charAt(0)}{peer.user.avatar ? <img src={getSafeImageURLEx(peer.user_id, peer.user.avatar, 'thumbnail') || undefined} alt="" /> : null}</span>} title={<bdi>{peer.user.displayname || peer.user.username}</bdi>} description={<bdi>@{peer.user.username}</bdi>} accessory={chat.canManage && String(peer.user_id) !== viewerId ? <button type="button" className="cv-icon-button" aria-label={`${t('chat_actions.remove_member')}: ${peer.user.displayname || peer.user.username}`} disabled={busy} onClick={() => setConfirmation({ kind: 'remove', peer })}><TelegramIcon name="delete" /></button> : null} />} /></div>
  </>}
  </div>
  <ClipboardFeedback status={clipboard.status} link />
  <Sheet isOpen={!!confirmation} onClose={() => { if (!busy) setConfirmation(null); }} variant="alert" className="cv-chat-confirm" title={t(confirmation?.kind === 'revoke' ? 'chat_actions.revoke_link' : confirmation?.kind === 'remove' ? 'chat_actions.remove_member' : 'chat_actions.leave_group')} hideCloseButton actions={<><button type="button" className="cv-confirm-cancel" disabled={busy} onClick={() => setConfirmation(null)}>{t('app.cancel')}</button><button type="button" className="cv-confirm-danger" disabled={busy} onClick={() => void perform(async () => {
   if (confirmation?.kind === 'revoke') { const response = await api.exportGroupInvite(id, true); setInvite(response.invite.token); clipboard.reset(); }
   else if (confirmation?.kind === 'remove' && confirmation.peer) { await api.removeChatParticipant(id, String(confirmation.peer.user_id)); await load(); onUpdated(); }
   else if (confirmation?.kind === 'leave') { await api.removeChatParticipant(id, viewerId); onLeave(); }
   setConfirmation(null);
  })}>{t(confirmation?.kind === 'revoke' ? 'chat_actions.revoke_link' : confirmation?.kind === 'remove' ? 'chat_actions.remove_member' : 'chat_actions.leave_group')}</button></>}><p>{t(confirmation?.kind === 'revoke' ? 'chat_actions.revoke_link_hint' : 'chat_actions.confirm_group_action', { name: confirmation?.peer?.user.displayname || chat.name })}</p></Sheet>
 </section>;
}
