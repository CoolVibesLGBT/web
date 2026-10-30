import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Virtuoso } from 'react-virtuoso';
import { useAtom } from 'jotai';
import { useNavigate } from '@/router';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { getLocalizedContent } from '@/helpers/helpers';
import { chatStateAtom } from '@/state/chat';
import { buildGroupChatItem, fetchJoinedGroupIds, getPublicGroupImage, type PublicGroupPreview } from '@/features/chat/groupChatItem';
import { NavigationBar, Sheet } from '@/components/ui/Interface';
import ViewTabs from '@/components/ui/ViewTabs';
import AnimatedEmptyState from '@/components/ui/AnimatedEmptyState';
import ChatAvatarImage from '@/features/chat/ChatAvatarImage';
import TelegramIcon from '@/features/chat/TelegramIcon';
import '@/features/chat/group-details.css';
import '@/features/chat/chat-confirm.css';
import '@/features/chat/groups-browse.css';

type GroupScope = 'all' | 'joined' | 'not_joined';

/** The full public-groups directory; reached from the Messages discover strip's "See all". */
export default function GroupsBrowseScreen() {
  const { t, i18n } = useTranslation('common');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [chatState, setChatState] = useAtom(chatStateAtom);
  const [scrollParent, setScrollParent] = useState<HTMLDivElement | null>(null);
  const [scope, setScope] = useState<GroupScope>('all');

  const [groups, setGroups] = useState<PublicGroupPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const cursorRef = useRef<string | null | undefined>(undefined);
  const fetchingRef = useRef(false);
  const seqRef = useRef(0);

  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [leaveTarget, setLeaveTarget] = useState<PublicGroupPreview | null>(null);
  // Virtuoso recycles each visible row's DOM node for whatever item scrolls
  // into that slot next, but a plain CSS :hover/:active stays pinned to that
  // node — so wheel-scrolling under a stationary cursor "teleports" the
  // highlight onto unrelated rows. Keying the highlight off the group's own
  // id (always current for whatever Virtuoso just rendered into a slot)
  // instead of the DOM node fixes that.
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [pressedRowId, setPressedRowId] = useState<string | null>(null);
  // Joining/leaving while scoped to Joined or Not-joined makes a row stop
  // matching its own filter, so it would otherwise vanish the instant the
  // action resolves and snap every row below it up into its place. Holding
  // the id here for a beat keeps the row in `visibleGroups` long enough for
  // the `is-leaving` fade/collapse below to play before it's actually gone.
  const [leavingRowId, setLeavingRowId] = useState<string | null>(null);
  const leavingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleRowLeave = useCallback((id: string) => {
    if (leavingTimeoutRef.current) clearTimeout(leavingTimeoutRef.current);
    setLeavingRowId(id);
    leavingTimeoutRef.current = setTimeout(() => {
      setLeavingRowId(previous => previous === id ? null : previous);
    }, 260);
  }, []);
  useEffect(() => () => { if (leavingTimeoutRef.current) clearTimeout(leavingTimeoutRef.current); }, []);

  const load = useCallback(async (cursor?: string) => {
    if (fetchingRef.current || cursorRef.current === null) return;
    fetchingRef.current = true;
    const requestId = ++seqRef.current;
    setLoading(true);
    try {
      const response: any = await api.listGroups({ limit: 20, ...(cursor ? { cursor } : {}) });
      const rows: PublicGroupPreview[] = Array.isArray(response?.groups) ? response.groups : [];
      if (requestId !== seqRef.current) return;
      if (rows.length > 0) {
        setGroups(previous => {
          const known = new Set(previous.map(group => group.id));
          return [...previous, ...rows.filter(group => !known.has(group.id))];
        });
      }
      const nextCursor = typeof response?.cursor === 'string' && response.cursor ? response.cursor : null;
      cursorRef.current = nextCursor;
      setHasMore(nextCursor !== null);
      if (!cursor) setFailed(false);
    } catch {
      if (requestId === seqRef.current) setFailed(true);
    } finally {
      if (requestId === seqRef.current) { fetchingRef.current = false; setLoading(false); }
    }
  }, []);

  useEffect(() => {
    void load();
    return () => { seqRef.current += 1; fetchingRef.current = false; };
  }, [load]);

  const retry = useCallback(() => {
    if (fetchingRef.current) return;
    cursorRef.current = undefined;
    seqRef.current += 1;
    setGroups([]);
    setFailed(false);
    setHasMore(true);
    void load();
  }, [load]);

  const loadMore = useCallback(() => {
    const cursor = cursorRef.current;
    if (typeof cursor !== 'string' || fetchingRef.current || failed) return;
    void load(cursor);
  }, [load, failed]);

  // The shared chatsList atom only holds the sidebar's first, uncursored page
  // of chats (20 rows), so it under-reports membership for anyone in more
  // than 20 chats. This screen's whole point is to show every group, so it
  // needs the fully-paginated truth, not that capped snapshot.
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [membershipLoaded, setMembershipLoaded] = useState(false);
  useEffect(() => {
    let active = true;
    void fetchJoinedGroupIds()
      .then(({ ids }) => { if (active) setJoinedIds(ids); })
      .finally(() => { if (active) setMembershipLoaded(true); });
    return () => { active = false; };
  }, []);

  const visibleGroups = useMemo(() => {
    if (scope === 'all') return groups;
    return groups.filter(group => joinedIds.has(group.id) === (scope === 'joined') || leavingRowId === group.id);
  }, [groups, joinedIds, scope, leavingRowId]);

  // Filtering happens client-side on top of server-paginated pages: once a
  // scope other than "all" leaves only a handful of rows (or none), the
  // virtualized list is too short to scroll and `endReached` never fires, so
  // nothing ever loads the next page. Keep walking pages until the filtered
  // view has enough rows to scroll on its own, matching the strip's own
  // backfill-to-minimum behavior.
  const GROUPS_BACKFILL_MIN = 15;
  useEffect(() => {
    if (scope === 'all' || failed || loading || !membershipLoaded || !hasMore) return;
    if (visibleGroups.length >= GROUPS_BACKFILL_MIN) return;
    loadMore();
  }, [scope, failed, loading, membershipLoaded, hasMore, visibleGroups.length, loadMore]);

  // Tapping a row shows the group's info (GroupDetails), not the message
  // thread — this directory is for browsing groups, not reading them. A
  // joined group may already sit in the sidebar's capped chatsList (then a
  // lightweight `openChat` selects it), or it may be one of the ones beyond
  // that 20-row cap (then a `groupChat` item is rebuilt from this preview so
  // MessagesScreen still gets a correctly-typed group entry to insert);
  // either way `openGroupInfo` tells MessagesScreen to open the info panel
  // instead of leaving the thread view showing. A not-yet-joined group has no
  // chat to select, so it opens the existing public preview route instead.
  const openGroup = useCallback((group: PublicGroupPreview) => {
    if (joinedIds.has(group.id)) {
      if (chatState.chatsList.some(chat => chat.id === group.id)) {
        navigate('/messages', { state: { openChat: group.id, openGroupInfo: true } });
      } else {
        navigate('/messages', { state: { groupChat: buildGroupChatItem(group, i18n.language, user?.id), openGroupInfo: true } });
      }
      return;
    }
    if (group.public_username) navigate(`/group/${group.public_username}`);
  }, [joinedIds, chatState.chatsList, navigate, i18n.language, user?.id]);

  const join = useCallback(async (group: PublicGroupPreview) => {
    if (!group.public_username || pendingId) return;
    setPendingId(group.id);
    setErrorId(null);
    try {
      const response: any = await api.joinGroup({ public_username: group.public_username });
      if (response?.chat) {
        const item = buildGroupChatItem(response.chat, i18n.language, user?.id);
        setChatState(previous => ({ ...previous, chatsList: [item, ...previous.chatsList.filter(existing => existing.id !== item.id)] }));
      }
      setJoinedIds(previous => new Set(previous).add(group.id));
      if (scope === 'not_joined') scheduleRowLeave(group.id);
    } catch {
      setErrorId(group.id);
    } finally { setPendingId(null); }
  }, [pendingId, i18n.language, user?.id, setChatState, scope, scheduleRowLeave]);

  const leave = useCallback(async () => {
    const group = leaveTarget;
    if (!group || !user?.id) return;
    setLeaveTarget(null);
    setPendingId(group.id);
    setErrorId(null);
    try {
      await api.removeChatParticipant(group.id, user.id);
      setChatState(previous => ({
        ...previous,
        chatsList: previous.chatsList.filter(chat => chat.id !== group.id),
        selectedChatId: previous.selectedChatId === group.id ? null : previous.selectedChatId,
      }));
      setJoinedIds(previous => { const next = new Set(previous); next.delete(group.id); return next; });
      if (scope === 'joined') scheduleRowLeave(group.id);
    } catch {
      setErrorId(group.id);
    } finally { setPendingId(null); }
  }, [leaveTarget, user?.id, setChatState, scope, scheduleRowLeave]);

  const scopeEmptyTitle = scope === 'joined'
    ? t('messages.no_joined_groups', { defaultValue: "You haven't joined any groups yet" })
    : scope === 'not_joined'
      ? t('messages.no_unjoined_groups', { defaultValue: "You've joined every group" })
      : t('messages.no_public_groups', { defaultValue: 'No public groups yet' });

  return (
    <div ref={setScrollParent} className="skyline-page-scroll">
      <NavigationBar title={t('messages.groups')} onBack={() => navigate('/messages')} backIcon={<TelegramIcon name="arrow_prev" />} />
      <div className="cv-groups-browse-content">
        {!(failed && groups.length === 0) && groups.length > 0 && (
          <div className="cv-groups-browse-scope">
            <ViewTabs
              variant="segmented"
              items={[
                { id: 'all' as const, label: t('messages.all') },
                { id: 'joined' as const, label: t('messages.filter_joined', { defaultValue: 'Joined' }) },
                { id: 'not_joined' as const, label: t('messages.filter_not_joined', { defaultValue: 'Not joined' }) },
              ]}
              activeId={scope}
              onSelect={setScope}
              label={t('messages.groups')}
            />
          </div>
        )}
        {failed && groups.length === 0 ? (
          <div className="cv-groups-browse-retry">
            <p>{t('chat_actions.action_failed')}</p>
            <button type="button" className="cv-btn cv-discover-retry" onClick={retry}>{t('nearby.try_again', { defaultValue: 'Try Again' })}</button>
          </div>
        ) : (loading && groups.length === 0) || (!membershipLoaded && groups.length > 0) || (scope !== 'all' && hasMore && visibleGroups.length < GROUPS_BACKFILL_MIN) ? (
          <div className="cv-groups-browse-list" aria-busy="true">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="cv-groups-browse-skeleton-row" aria-hidden="true"><span /><span /></div>
            ))}
          </div>
        ) : visibleGroups.length === 0 ? (
          <AnimatedEmptyState title={scopeEmptyTitle} />
        ) : (
          <div className="cv-groups-browse-list">
            <Virtuoso
              customScrollParent={scrollParent || undefined}
              data={visibleGroups}
              computeItemKey={(_, group) => group.id}
              endReached={() => { if (hasMore) loadMore(); }}
              components={{
                Footer: () => (loading && visibleGroups.length > 0 ? <p className="cv-groups-browse-footer">{t('emoticons.loading')}</p> : null),
              }}
              itemContent={(_, group) => {
                const title = String(getLocalizedContent(group.title, i18n.language) || '');
                const avatar = getPublicGroupImage(group);
                const joined = joinedIds.has(group.id);
                const busy = pendingId === group.id;
                const canOpen = joined || !!group.public_username;
                const rowClass = `cv-list-row cv-groups-browse-row${hoveredRowId === group.id ? ' is-hovered' : ''}${pressedRowId === group.id ? ' is-pressed' : ''}${leavingRowId === group.id ? ' is-leaving' : ''}`;
                return (
                  <div className={rowClass}>
                    <button
                      type="button"
                      className="cv-groups-browse-row-main"
                      disabled={!canOpen}
                      onClick={() => openGroup(group)}
                      onPointerEnter={event => { if (event.pointerType === 'mouse') setHoveredRowId(group.id); }}
                      onPointerLeave={() => setHoveredRowId(previous => previous === group.id ? null : previous)}
                      onPointerDown={() => setPressedRowId(group.id)}
                      onPointerUp={() => setPressedRowId(previous => previous === group.id ? null : previous)}
                      onPointerCancel={() => setPressedRowId(previous => previous === group.id ? null : previous)}
                    >
                      <span className="cv-list-icon" aria-hidden="true">
                        <span className="cv-group-member-avatar">{title.charAt(0).toLocaleUpperCase()}{avatar && <ChatAvatarImage protectedMedia src={avatar} alt="" loading="lazy" />}</span>
                      </span>
                      <span className="cv-list-copy">
                        <span className="cv-list-title"><bdi>{title}</bdi></span>
                        <span className="cv-list-description">
                          {t('messages.group_members', { count: group.member_count, defaultValue: '{{count}} members' })}
                          {errorId === group.id && <> · <span className="cv-groups-browse-error">{t('chat_actions.action_failed')}</span></>}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      className={`cv-btn cv-groups-browse-action${joined ? ' is-leave' : ''}`}
                      disabled={busy || !membershipLoaded || (!joined && !group.public_username)}
                      onClick={() => { if (joined) setLeaveTarget(group); else void join(group); }}
                    >
                      {busy
                        ? t(joined ? 'messages.leaving' : 'messages.joining', { defaultValue: joined ? 'Leaving…' : 'Joining…' })
                        : t(joined ? 'messages.leave' : 'messages.join', { defaultValue: joined ? 'Leave' : 'Join' })}
                    </button>
                  </div>
                );
              }}
            />
          </div>
        )}
      </div>
      <Sheet
        isOpen={!!leaveTarget}
        onClose={() => setLeaveTarget(null)}
        variant="alert"
        className="cv-chat-confirm"
        title={t('chat_actions.leave_group')}
        hideCloseButton
        actions={<>
          <button type="button" className="cv-confirm-cancel" onClick={() => setLeaveTarget(null)}>{t('app.cancel')}</button>
          <button type="button" className="cv-confirm-danger" onClick={() => void leave()}>{t('chat_actions.leave_group')}</button>
        </>}
      >
        <p>{t('chat_actions.confirm_group_action', { name: leaveTarget ? String(getLocalizedContent(leaveTarget.title, i18n.language) || '') : '' })}</p>
      </Sheet>
    </div>
  );
}
