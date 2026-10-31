import AnimatedEmptyState from '@/components/ui/AnimatedEmptyState';
import React from 'react';
import { motion } from 'framer-motion';
import { useAtomValue } from 'jotai';
import { useNavigate } from '@/router';
import { Users2, RefreshCw } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { getLocalizedContent } from '../../helpers/helpers';
import { chatStateAtom } from '@/state/chat';
import ChatAvatarImage from '@/features/chat/ChatAvatarImage';
import { buildGroupChatItem, fetchJoinedGroupIds, getPublicGroupImage, type PublicGroupPreview } from '@/features/chat/groupChatItem';

interface PopularGroupsPanelProps {
  limit?: number;
  showHeader?: boolean;
}

/** Home-tab counterpart to PopularUsersPanel: a grid of public groups to discover/join, reusing the same `chat.group.list` + membership infrastructure as the Messages "Discover groups" strip. */
const PopularGroupsPanel: React.FC<PopularGroupsPanelProps> = ({ limit = 20, showHeader = true }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('common');
  const chatState = useAtomValue(chatStateAtom);
  const isDark = theme === 'dark';

  const [groups, setGroups] = React.useState<PublicGroupPreview[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [joinedIds, setJoinedIds] = React.useState<Set<string>>(new Set());
  // `limit` is a page size here, not a hard cap — chat.group.list is
  // cursor-paginated and there are far more public groups than one page, so
  // a single fetch with no follow-up left "load more" with nothing to do.
  const cursorRef = React.useRef<string | null | undefined>(undefined);
  const fetchingRef = React.useRef(false);
  const [hasMore, setHasMore] = React.useState(true);

  const loadPage = React.useCallback(async (cursor?: string) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    if (cursor) setIsLoadingMore(true); else setIsLoading(true);
    setError(null);
    try {
      const response: any = await api.listGroups({ limit, ...(cursor ? { cursor } : {}) });
      const rows: PublicGroupPreview[] = Array.isArray(response?.groups) ? response.groups : [];
      setGroups(previous => {
        const known = new Set(previous.map(group => group.id));
        const additions = rows.filter(group => !known.has(group.id));
        return cursor ? [...previous, ...additions] : additions;
      });
      const nextCursor = typeof response?.cursor === 'string' && response.cursor ? response.cursor : null;
      cursorRef.current = nextCursor;
      setHasMore(nextCursor !== null);
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Fetch error');
    } finally {
      fetchingRef.current = false;
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [limit]);

  const fetchPopularGroups = React.useCallback(() => {
    cursorRef.current = undefined;
    setHasMore(true);
    void loadPage();
  }, [loadPage]);

  const loadMore = React.useCallback(() => {
    const cursor = cursorRef.current;
    if (typeof cursor !== 'string') return;
    void loadPage(cursor);
  }, [loadPage]);

  React.useEffect(() => { fetchPopularGroups(); }, [fetchPopularGroups]);

  // Plain (non-virtualized) grid sitting in the page's normal scroll flow —
  // no Virtuoso/customScrollParent here, so a bottom sentinel + IntersectionObserver
  // is the right trigger, not a "Load more" button.
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore || isLoading) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting) loadMore();
    }, { rootMargin: '600px 0px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, isLoading, loadMore, groups.length]);
  // Independent of the fetched page above — needed to tell "already joined"
  // apart from "not joined yet" regardless of which page a group landed on.
  React.useEffect(() => { void fetchJoinedGroupIds().then(({ ids }) => setJoinedIds(ids)).catch(() => {}); }, []);

  // Same routing as the Messages Groups directory: a joined group opens its
  // info panel (selecting the cached chat, or rebuilding one from this
  // preview if it's outside the sidebar's capped list); a group the viewer
  // hasn't joined opens the public preview/join route instead.
  const openGroup = React.useCallback((group: PublicGroupPreview) => {
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

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 sm:gap-4">
          {Array.from({ length: limit }).map((_, index) => (
            <div
              key={`popular-group-skeleton-${index}`}
              className={`relative overflow-hidden rounded-3xl border ${
                isDark ? 'cv-card-surface-solid border-white/10' : 'border-gray-100 bg-gray-50'
              } aspect-[3/4] animate-pulse`}
            >
              <div className="absolute inset-0">
                <div className={`h-2/3 w-full ${isDark ? 'bg-gray-900' : 'bg-gray-200'}`} />
                <div className={`h-1/3 w-full ${isDark ? 'bg-gray-800' : 'bg-gray-300'}`} />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className={`rounded-2xl border p-4 ${isDark ? 'border-red-900/40 bg-red-900/10 text-red-200' : 'border-red-100 bg-red-50 text-red-600'}`}>
          <p className="text-sm font-medium">{error}</p>
          <button type="button" onClick={() => void fetchPopularGroups()} className={`mt-3 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${isDark ? 'bg-red-800/60 text-red-100 hover:bg-red-800/80' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>
            <RefreshCw className="h-4 w-4" />
            {t('app.popular_groups_retry', { defaultValue: 'Try again' })}
          </button>
        </div>
      );
    }

    if (groups.length === 0) {
      return <AnimatedEmptyState compact kind="discover" title={t('app.popular_groups_empty', { defaultValue: 'No public groups to show yet.' })} />;
    }

    return (
      <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 sm:gap-4">
        {groups.map((group, index) => {
          const title = String(getLocalizedContent(group.title, i18n.language) || '');
          const avatar = getPublicGroupImage(group);
          const joined = joinedIds.has(group.id);
          return (
            <motion.button
              key={group.id}
              type="button"
              onClick={() => openGroup(group)}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className={`group relative overflow-hidden rounded-3xl border ${
                isDark
                  ? 'cv-card-surface-solid border-white/10 hover:border-[var(--color-brand)]/40'
                  : 'border-gray-100 bg-white hover:border-gray-300'
              } aspect-[3/4] transition-all cursor-pointer`}
            >
              {/* The letter always renders underneath; the image (when it
                  loads) overlays it — ChatAvatarImage renders nothing on a
                  failed protected fetch, so a broken/auth-gated image falls
                  back to the letter instead of showing a broken-image glyph. */}
              <div className={`absolute inset-0 grid place-items-center text-4xl font-bold ${isDark ? 'bg-white/5 text-white/30' : 'bg-gray-100 text-gray-300'}`}>
                {title.charAt(0).toLocaleUpperCase()}
              </div>
              {avatar && (
                <ChatAvatarImage
                  protectedMedia
                  src={avatar}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-90" />
              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-4 text-start">
                <p className="truncate text-base font-bold text-white"><bdi>{title}</bdi></p>
                <p className="text-xs font-semibold text-[var(--color-brand)]/90">
                  {joined
                    ? t('messages.already_joined', { defaultValue: 'Joined' })
                    : t('messages.group_members', { count: group.member_count, defaultValue: '{{count}} members' })}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
      {hasMore && (
        <div ref={sentinelRef} className="mt-4 flex justify-center py-2" aria-hidden="true">
          {isLoadingMore && <RefreshCw className={`h-5 w-5 animate-spin ${isDark ? 'text-white/40' : 'text-gray-400'}`} />}
        </div>
      )}
      </>
    );
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`rounded-3xl border p-5 sm:p-6 ${isDark ? 'cv-card-surface border-white/10' : 'border-gray-100 bg-white'}`}
    >
      {showHeader && (
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className={`text-[0.765rem] font-semibold normal-case tracking-normal ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {t('app.popular_groups_badge', { defaultValue: 'COMMUNITY' })}
            </p>
            <h3 className={`mt-1 text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('app.popular_groups_title', { defaultValue: 'Discover groups' })}
            </h3>
          </div>
          <div className={`rounded-2xl p-3 ${isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-700'}`}>
            <Users2 className="h-6 w-6" />
          </div>
        </div>
      )}
      <div>{renderContent()}</div>
    </motion.section>
  );
};

export default PopularGroupsPanel;
