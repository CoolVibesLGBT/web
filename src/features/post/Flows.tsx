import React, { useState, useEffect, useLayoutEffect, useCallback, useRef, useMemo, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { PostLexicalContent } from './Post';
import type { ApiPost as PostComponentApiPost } from './Post';
import PostReply from './PostReply';
import ReportButton from '@/components/ui/ReportButton';
import { api } from '../../services/api';
import { RefreshCw, AlertCircle, Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Zap, PlayCircle, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAtom } from 'jotai';
import { flowsStateAtom } from '@/state/flows';
import FeatureAdCard from '@/components/ads/FeatureAdCard';
import ShareButton from '@/components/ui/ShareButton';
import { isFeatureEnabled } from '@/config/featureFlags';
import { getLocalizedContent, getSafeImageURL, getSafeImageURLEx } from '@/helpers/helpers';
import { useDwellView } from '@/hooks/useDwellView';
import {
  filterDeletedPosts,
  getTimelineCursor,
  getTimelinePosts,
  type TimelineResponse,
  withTimeout,
} from '@/features/post/timelineUtils';

// Shimmer styles - defined once globally
if (typeof document !== 'undefined' && !document.getElementById('skeleton-shimmer-styles')) {
  const style = document.createElement('style');
  style.id = 'skeleton-shimmer-styles';
  style.textContent = `
    @keyframes shimmer {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }
    .shimmer-animation {
      animation: shimmer 1.5s infinite linear;
    }
  `;
  document.head.appendChild(style);
}

// Post Skeleton Component - exported for use in other components
export const PostSkeleton: React.FC<{ theme: 'dark' | 'light' }> = ({ theme }) => {
  return (
    <div className={`${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>

      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Avatar */}
          <div className={`w-10 h-10 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-gray-900/70' : 'bg-gray-200'
            }`}>
            <div className="w-full h-full shimmer-animation"
              style={{
                background: theme === 'dark'
                  ? 'linear-gradient(90deg, rgba(17,24,39,0.5) 0%, rgba(31,41,55,0.8) 50%, rgba(17,24,39,0.5) 100%)'
                  : 'linear-gradient(90deg, #e5e7eb 0%, #d1d5db 50%, #e5e7eb 100%)',
                backgroundSize: '200% 100%'
              }} />
          </div>

          {/* Username and timestamp */}
          <div className="space-y-2">
            <div className={`h-4 w-32 rounded overflow-hidden ${theme === 'dark' ? 'bg-gray-900/70' : 'bg-gray-200'
              }`}>
              <div className="w-full h-full shimmer-animation"
                style={{
                  background: theme === 'dark'
                    ? 'linear-gradient(90deg, rgba(17,24,39,0.5) 0%, rgba(31,41,55,0.8) 50%, rgba(17,24,39,0.5) 100%)'
                    : 'linear-gradient(90deg, #e5e7eb 0%, #d1d5db 50%, #e5e7eb 100%)',
                  backgroundSize: '200% 100%'
                }} />
            </div>
            <div className={`h-3 w-24 rounded overflow-hidden ${theme === 'dark' ? 'bg-gray-900/70' : 'bg-gray-200'
              }`}>
              <div className="w-full h-full shimmer-animation"
                style={{
                  background: theme === 'dark'
                    ? 'linear-gradient(90deg, rgba(17,24,39,0.5) 0%, rgba(31,41,55,0.8) 50%, rgba(17,24,39,0.5) 100%)'
                    : 'linear-gradient(90deg, #e5e7eb 0%, #d1d5db 50%, #e5e7eb 100%)',
                  backgroundSize: '200% 100%'
                }} />
            </div>
          </div>
        </div>

        {/* Menu button */}
        <div className={`w-8 h-8 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-gray-900/70' : 'bg-gray-200'
          }`}>
          <div className="w-full h-full shimmer-animation"
            style={{
              background: theme === 'dark'
                ? 'linear-gradient(90deg, rgba(17,24,39,0.5) 0%, rgba(31,41,55,0.8) 50%, rgba(17,24,39,0.5) 100%)'
                : 'linear-gradient(90deg, #e5e7eb 0%, #d1d5db 50%, #e5e7eb 100%)',
              backgroundSize: '200% 100%'
            }} />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3 space-y-3">
        {/* Text lines */}
        <div className="space-y-2">
          <div className={`h-4 w-full rounded overflow-hidden ${theme === 'dark' ? 'bg-gray-900/70' : 'bg-gray-200'
            }`}>
            <div className="w-full h-full shimmer-animation"
              style={{
                background: theme === 'dark'
                  ? 'linear-gradient(90deg, rgba(17,24,39,0.5) 0%, rgba(31,41,55,0.8) 50%, rgba(17,24,39,0.5) 100%)'
                  : 'linear-gradient(90deg, #e5e7eb 0%, #d1d5db 50%, #e5e7eb 100%)',
                backgroundSize: '200% 100%'
              }} />
          </div>
          <div className={`h-4 w-5/6 rounded overflow-hidden ${theme === 'dark' ? 'bg-gray-900/70' : 'bg-gray-200'
            }`}>
            <div className="w-full h-full shimmer-animation"
              style={{
                background: theme === 'dark'
                  ? 'linear-gradient(90deg, rgba(17,24,39,0.5) 0%, rgba(31,41,55,0.8) 50%, rgba(17,24,39,0.5) 100%)'
                  : 'linear-gradient(90deg, #e5e7eb 0%, #d1d5db 50%, #e5e7eb 100%)',
                backgroundSize: '200% 100%'
              }} />
          </div>
          <div className={`h-4 w-4/6 rounded overflow-hidden ${theme === 'dark' ? 'bg-gray-900/70' : 'bg-gray-200'
            }`}>
            <div className="w-full h-full shimmer-animation"
              style={{
                background: theme === 'dark'
                  ? 'linear-gradient(90deg, rgba(17,24,39,0.5) 0%, rgba(31,41,55,0.8) 50%, rgba(17,24,39,0.5) 100%)'
                  : 'linear-gradient(90deg, #e5e7eb 0%, #d1d5db 50%, #e5e7eb 100%)',
                backgroundSize: '200% 100%'
              }} />
          </div>
        </div>

        {/* Image placeholder */}
        <div className={`w-full h-64 rounded-2xl overflow-hidden ${theme === 'dark' ? 'bg-gray-900/70' : 'bg-gray-200'
          }`}>
          <div className="w-full h-full shimmer-animation"
            style={{
              background: theme === 'dark'
                ? 'linear-gradient(90deg, rgba(17,24,39,0.5) 0%, rgba(31,41,55,0.8) 50%, rgba(17,24,39,0.5) 100%)'
                : 'linear-gradient(90deg, #e5e7eb 0%, #d1d5db 50%, #e5e7eb 100%)',
              backgroundSize: '200% 100%'
            }} />
        </div>
      </div>

      {/* Actions */}
      <div className={`px-4 py-3 flex items-center justify-between border-t ${theme === 'dark' ? 'border-gray-800/50' : 'border-gray-100'
        }`}>
        <div className="flex items-center gap-6">
          <div className={`w-6 h-6 rounded overflow-hidden ${theme === 'dark' ? 'bg-gray-900/70' : 'bg-gray-200'
            }`}>
            <div className="w-full h-full shimmer-animation"
              style={{
                background: theme === 'dark'
                  ? 'linear-gradient(90deg, rgba(17,24,39,0.5) 0%, rgba(31,41,55,0.8) 50%, rgba(17,24,39,0.5) 100%)'
                  : 'linear-gradient(90deg, #e5e7eb 0%, #d1d5db 50%, #e5e7eb 100%)',
                backgroundSize: '200% 100%'
              }} />
          </div>
          <div className={`w-6 h-6 rounded overflow-hidden ${theme === 'dark' ? 'bg-gray-900/70' : 'bg-gray-200'
            }`}>
            <div className="w-full h-full shimmer-animation"
              style={{
                background: theme === 'dark'
                  ? 'linear-gradient(90deg, rgba(17,24,39,0.5) 0%, rgba(31,41,55,0.8) 50%, rgba(17,24,39,0.5) 100%)'
                  : 'linear-gradient(90deg, #e5e7eb 0%, #d1d5db 50%, #e5e7eb 100%)',
                backgroundSize: '200% 100%'
              }} />
          </div>
          <div className={`w-6 h-6 rounded overflow-hidden ${theme === 'dark' ? 'bg-gray-900/70' : 'bg-gray-200'
            }`}>
            <div className="w-full h-full shimmer-animation"
              style={{
                background: theme === 'dark'
                  ? 'linear-gradient(90deg, rgba(17,24,39,0.5) 0%, rgba(31,41,55,0.8) 50%, rgba(17,24,39,0.5) 100%)'
                  : 'linear-gradient(90deg, #e5e7eb 0%, #d1d5db 50%, #e5e7eb 100%)',
                backgroundSize: '200% 100%'
              }} />
          </div>
        </div>
        <div className={`w-16 h-4 rounded overflow-hidden ${theme === 'dark' ? 'bg-gray-900/70' : 'bg-gray-200'
          }`}>
          <div className="w-full h-full shimmer-animation"
            style={{
              background: theme === 'dark'
                ? 'linear-gradient(90deg, rgba(17,24,39,0.5) 0%, rgba(31,41,55,0.8) 50%, rgba(17,24,39,0.5) 100%)'
                : 'linear-gradient(90deg, #e5e7eb 0%, #d1d5db 50%, #e5e7eb 100%)',
              backgroundSize: '200% 100%'
            }} />
        </div>
      </div>
    </div>
  );
};

type ApiPost = PostComponentApiPost;
interface MemoizedPostItemProps {
  post: ApiPost;
  onPostClick: (postId: string, username: string) => void;
  onProfileClick: (username: string) => void;
}

const MemoizedPostItem = React.memo(({ post, onPostClick, onProfileClick }: MemoizedPostItemProps) => {
  return (
    <CoolVibesPostCard
      post={post}
      onPostClick={onPostClick}
      onProfileClick={onProfileClick}
    />
  );
}, (prevProps, nextProps) => {
  // Sadece ana prop değişikliklerinde re-render et (fonksiyon referanslarını es geç)
  return prevProps.post === nextProps.post;
});

const FeedFooter = React.memo(({ context }: any) => {
  const { theme, loadingMore, hasMore, postsLength } = context || {};
  const { t } = useTranslation('common');
  return (
    <div className="pb-32">
      {loadingMore && (
        <div className="py-8 flex justify-center items-center">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--brand-color,#ec4899)] border-t-transparent animate-spin" />
        </div>
      )}
      {!hasMore && postsLength > 0 && (
        <div className={`p-8 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          {t('post_feed.no_more')}
        </div>
      )}
    </div>
  );
});

interface FlowsProps {
  onPostClick: (postId: string, username: string) => void;
  onProfileClick: (username: string) => void;
  scrollParentRef?: React.RefObject<HTMLDivElement | null>;
}

type FeedRowItem =
  | { kind: 'post'; id: string; post: ApiPost }
  | { kind: 'ad'; id: string };

export const FlowMasonryItem = ({
  wide,
  children,
}: {
  wide: boolean
  children: React.ReactNode
}) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const item = itemRef.current;
    const content = contentRef.current;
    if (!item || !content) return;

    let frame = 0;
    const updateSpan = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const grid = item.parentElement;
        if (!grid) return;
        const gridStyle = window.getComputedStyle(grid);
        const rowHeight = Number.parseFloat(gridStyle.gridAutoRows) || 4;
        const rowGap = Number.parseFloat(gridStyle.rowGap) || 0;
        const height = content.getBoundingClientRect().height;
        const rowSpan = Math.max(1, Math.ceil((height + rowGap) / (rowHeight + rowGap)));
        item.style.gridRowEnd = `span ${rowSpan}`;
      });
    };

    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(updateSpan);
    resizeObserver?.observe(content);
    window.addEventListener('resize', updateSpan);
    updateSpan();

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', updateSpan);
      resizeObserver?.disconnect();
    };
  }, []);

  return (
    <div ref={itemRef} className={`min-w-0 self-start ${wide ? 'sm:col-span-2' : ''}`}>
      <div ref={contentRef} className="pb-6 md:pb-8 [&>article]:mb-0">
        {children}
      </div>
    </div>
  );
};

const flowCardRenderStyle: CSSProperties = {
  contentVisibility: 'auto',
  contain: 'layout paint style',
  containIntrinsicSize: '1px 680px',
};

const getNumericPostValue = (post: ApiPost, keys: string[]) => {
  const source = post as Record<string, unknown>;
  const counts = post.engagements?.counts as Record<string, unknown> | undefined;

  for (const key of keys) {
    const value = counts?.[key] ?? source[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return 0;
};

const getPrimaryMedia = (post: ApiPost) => {
  const attachments = Array.isArray(post.attachments) ? post.attachments : [];
  const media = attachments.find((attachment) => {
    const mimeType = attachment?.file?.mime_type || '';
    return mimeType.startsWith('image/') || mimeType.startsWith('video/');
  });

  if (!media) {
    return { url: null as string | null, isVideo: false };
  }

  const url =
    getSafeImageURL(media, 'large') ||
    getSafeImageURL(media, 'medium') ||
    getSafeImageURL(media, 'small') ||
    getSafeImageURL(media, 'original') ||
    media.file?.url ||
    null;

  return {
    url,
    isVideo: Boolean(media.file?.mime_type?.startsWith('video/')),
  };
};

const YOUTUBE_URL_PATTERN = /(?:youtube(?:-nocookie)?\.com\/(?:watch\?[^\s#]*v=|embed\/|shorts\/|live\/)|youtu\.be\/)/i;
const VIDEO_POST_KINDS = new Set(['video', 'youtube', 'youtube_video', 'youtube-video']);

const containsWideEmbedContent = (value: unknown): boolean => {
  const seen = new WeakSet<object>();

  const visit = (candidate: unknown, depth: number): boolean => {
    if (depth > 12 || candidate === null || candidate === undefined) return false;

    if (typeof candidate === 'string') {
      if (YOUTUBE_URL_PATTERN.test(candidate)) return true;
      const trimmed = candidate.trim();
      if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return false;
      try {
        return visit(JSON.parse(trimmed), depth + 1);
      } catch {
        return false;
      }
    }

    if (Array.isArray(candidate)) {
      return candidate.some((item) => visit(item, depth + 1));
    }

    if (typeof candidate !== 'object') return false;
    if (seen.has(candidate)) return false;
    seen.add(candidate);

    const record = candidate as Record<string, unknown>;
    const nodeType = typeof record.type === 'string' ? record.type.toLowerCase() : '';
    if (nodeType === 'youtube' || nodeType === 'youtube-video' || nodeType === 'youtube_video') {
      return true;
    }
    if (typeof record.videoID === 'string' && record.videoID.length > 0) {
      return true;
    }
    const oembed = record.oembed;
    if (oembed && typeof oembed === 'object') {
      const oembedType = (oembed as Record<string, unknown>).type;
      if (typeof oembedType === 'string' && ['video', 'rich'].includes(oembedType.toLowerCase())) {
        return true;
      }
    }

    return Object.values(record).some((item) => visit(item, depth + 1));
  };

  return visit(value, 0);
};

export const isWideMediaPost = (post: ApiPost): boolean => {
  const source = post as unknown as Record<string, unknown>;
  const kinds = [post.post_kind, post.type, source.kind]
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.toLowerCase());
  if (kinds.some((kind) => VIDEO_POST_KINDS.has(kind))) return true;

  const attachments = Array.isArray(post.attachments) ? post.attachments : [];
  if (attachments.some((attachment) => attachment?.file?.mime_type?.toLowerCase().startsWith('video/'))) {
    return true;
  }

  return containsWideEmbedContent(post.content);
};

export const CoolVibesPostCard = React.memo(({
  post,
  onPostClick,
  onProfileClick,
}: {
  post: ApiPost
  onPostClick: (postId: string, username: string) => void
  onProfileClick: (username: string) => void
}) => {
  const { t, i18n } = useTranslation('common');
  const { theme } = useTheme();
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [replyCountOffset, setReplyCountOffset] = useState(0);
  const author = post.author;
  const media = getPrimaryMedia(post);
  const avatarUrl = getSafeImageURLEx(author?.public_id, author?.avatar, 'icon');
  const localizedContent = getLocalizedContent(post.content, i18n.language || author?.default_language || 'en') || '';
  const hasContent = typeof localizedContent === 'string'
    ? localizedContent.trim().length > 0
    : Boolean(localizedContent);
  const likes = getNumericPostValue(post, ['like_received_count', 'likes_count', 'like_count', 'likes']);
  const comments = getNumericPostValue(post, ['comment_count', 'comments_count', 'replies_count', 'comments']);
  const shares = getNumericPostValue(post, ['share_count', 'shares_count', 'shares']);
  const bookmarks = getNumericPostValue(post, ['bookmark_count', 'bookmarks_count', 'saved_count', 'saves_count', 'bookmarks']);
  const views = getNumericPostValue(post, ['view_count', 'views_count', 'views']);
  const [displayedViews, setDisplayedViews] = useState(views);
  const displayName = author?.displayname || author?.username || 'User';
  const username = author?.username || 'user';
  const actionPressClassName = 'transition-all duration-150 ease-out active:scale-95';
  const actionPressMotion = { scale: 0.94 };
  const actionPressTransition = { type: 'spring', stiffness: 520, damping: 28 } as const;
  const postViewRef = useDwellView<HTMLElement>({
    key: user && post.public_id ? `post:${user.id}:${post.public_id}` : null,
    enabled: Boolean(
      user &&
      post.public_id &&
      String(user.id) !== String(post.author?.id || post.author_id)
    ),
    onDwell: async () => {
      const result = await api.handlePostView(post.public_id);
      if (result.counted) {
        setDisplayedViews((current) => Math.max(current, views) + 1);
      }
    },
  });

  useEffect(() => {
    setDisplayedViews(views);
  }, [post.id, post.public_id, views]);

  const formattedViews = useMemo(() => new Intl.NumberFormat(i18n.language || 'en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(displayedViews), [displayedViews, i18n.language]);

  const handleOpen = () => {
    onPostClick(post.public_id || post.id, username);
  };

  const handleProfile = (event: React.MouseEvent) => {
    event.stopPropagation();
    onProfileClick(username);
  };

  return (
    <>
      <article
        ref={postViewRef}
        style={flowCardRenderStyle}
        className="elite-card overflow-hidden group mb-6 break-inside-avoid cursor-pointer"
        onClick={handleOpen}
      >
        <div className="px-4 py-3 flex items-center justify-between" onClick={e => e.stopPropagation()}>
          <button className="flex items-center gap-2.5 min-w-0 text-left" onClick={handleProfile}>
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-slate-50 dark:border-zinc-800/50 p-0.5 shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} className="w-full h-full rounded-full object-cover" alt={displayName} />
              ) : (
                <div className="w-full h-full rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-[12px] font-black text-sky-600">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="leading-none min-w-0">
              <div className="flex items-center gap-1 mb-0.5">
                <h5 className="text-[12px] font-bold tracking-tight text-slate-900 dark:text-white uppercase truncate">
                  {displayName}
                </h5>
                {(author as any)?.is_verified && <Zap className="w-2.5 h-2.5 text-sky-600 fill-current shrink-0" />}
              </div>
              <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest truncate">@{username}</p>
            </div>
          </button>
          <div className="flex shrink-0 items-center gap-1.5">
            <span
              className="inline-flex h-7 items-center gap-1.5 rounded-full border border-slate-200/70 bg-slate-50/80 px-2.5 text-[10px] font-bold tabular-nums text-slate-500 dark:border-white/10 dark:bg-white/[0.045] dark:text-zinc-400"
              title={t('post_feed.views', { count: displayedViews })}
              aria-label={t('post_feed.views', { count: displayedViews })}
            >
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{formattedViews}</span>
            </span>
            <ReportButton
              type="post"
              id={post.public_id || post.id}
              className="shrink-0"
              trigger={
                <button
                  type="button"
                  className="rounded-full p-1.5 text-slate-300 transition-colors hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-sky-500/10"
                  aria-label="Report post"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              }
            />
          </div>
        </div>

        {media.url && (
          <div className="px-3 pb-2">
            <div className={`relative rounded-[28px] overflow-hidden bg-slate-50 dark:bg-black group/media ${media.isVideo ? 'aspect-video' : 'aspect-auto'}`}>
              {media.isVideo ? (
                <video
                  src={media.url}
                  controls
                  playsInline
                  preload="metadata"
                  className="h-full w-full bg-black object-contain"
                  onClick={(event) => event.stopPropagation()}
                />
              ) : (
                <img
                  src={media.url}
                  className="w-full h-full object-cover transition-transform duration-[4s] group-hover:scale-110"
                  alt=""
                />
              )}
              {media.isVideo && (
                <div className="pointer-events-none absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white">
                  <PlayCircle className="w-4 h-4" />
                </div>
              )}
            </div>
          </div>
        )}

        <div className="px-5 py-3">
          {hasContent && (
            <PostLexicalContent
              content={localizedContent}
              theme={theme === 'dark' ? 'dark' : 'light'}
              className="relative skyline-card-lexical mb-4"
              contentEditableClassName="editor-input lexical-editor pointer-events-none py-0 px-0"
              placeholder={null}
            />
          )}

          <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50 dark:border-white/5" onClick={e => e.stopPropagation()}>
            <div className="flex gap-8 px-2">
              <motion.button
                type="button"
                onClick={() => setLiked(!liked)}
                whileTap={actionPressMotion}
                transition={actionPressTransition}
                className={`group flex flex-col items-center gap-1.5 ${actionPressClassName}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  liked
                    ? 'bg-rose-50 text-rose-500 dark:bg-rose-500/10'
                    : 'text-slate-400 group-hover:bg-rose-50 group-hover:text-rose-500 dark:group-hover:bg-rose-500/10'
                }`}>
                  <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                </div>
                <span className={`text-[11px] font-bold ${liked ? 'text-rose-500' : 'text-slate-400'}`}>
                  {likes + (liked ? 1 : 0)}
                </span>
              </motion.button>
              <motion.button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setShowReply(true);
                }}
                whileTap={actionPressMotion}
                transition={actionPressTransition}
                className={`group flex flex-col items-center gap-1.5 text-slate-400 hover:text-sky-500 ${actionPressClassName}`}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center group-hover:bg-sky-50 dark:group-hover:bg-sky-500/10 transition-all">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold">{comments + replyCountOffset}</span>
              </motion.button>
              <ShareButton
                url={typeof window !== 'undefined' ? `${window.location.origin}/${username}/status/${post.public_id || post.id}` : ''}
                title={displayName ? `${displayName}'s post` : 'Post'}
                trigger={
                  <motion.button
                    type="button"
                    whileTap={actionPressMotion}
                    transition={actionPressTransition}
                    className={`group flex flex-col items-center gap-1.5 text-slate-400 hover:text-emerald-500 ${actionPressClassName}`}
                    aria-label="Share post"
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center group-hover:bg-emerald-50 dark:group-hover:bg-emerald-500/10 transition-all">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold">{shares}</span>
                  </motion.button>
                }
              />
            </div>
            <motion.button
              type="button"
              onClick={() => setSaved(!saved)}
              whileTap={actionPressMotion}
              transition={actionPressTransition}
              className={`group flex flex-col items-center gap-1.5 ${actionPressClassName} ${
                saved
                  ? 'text-amber-600'
                  : 'text-slate-300 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                saved
                  ? 'bg-amber-100 dark:bg-amber-600/20'
                  : 'group-hover:bg-slate-100 dark:group-hover:bg-white/5'
              }`}>
                <Bookmark className={`w-5 h-5 ${saved ? 'fill-current' : ''}`} />
              </div>
              <span className={`text-[11px] font-bold ${saved ? 'text-amber-600' : 'text-slate-400'}`}>
                {bookmarks + (saved ? 1 : 0)}
              </span>
            </motion.button>
          </div>
        </div>
      </article>

      {showReply && typeof window !== 'undefined' && createPortal(
        <div
          className="cv-modal-glass-backdrop fixed inset-0 z-[900] flex items-start justify-center overflow-y-auto p-3 pt-20 md:items-center md:p-6 md:pt-6"
          onClick={() => setShowReply(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 18 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className={`cv-modal-glass-panel flex max-h-[calc(100dvh-7rem)] w-full max-w-2xl flex-col overflow-y-auto rounded-[28px] border no-scrollbar ${
              theme === 'dark'
                ? 'text-white'
                : 'text-slate-950'
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <PostReply
              isOpen={true}
              onClose={() => setShowReply(false)}
              parentPostId={`${post.public_id || post.id}`}
              onReply={() => {
                setShowReply(false);
                setReplyCountOffset((count) => count + 1);
              }}
            />
          </motion.div>
        </div>,
        document.body
      )}
    </>
  );
});

CoolVibesPostCard.displayName = 'CoolVibesPostCard';

const injectFlowAds = (posts: ApiPost[], enabled: boolean, interval = 6): FeedRowItem[] => {
  const rows: FeedRowItem[] = [];
  posts.forEach((post, index) => {
    rows.push({
      kind: 'post',
      id: `post-${post.id}`,
      post,
    });
    if (enabled && (index + 1) % interval === 0) {
      rows.push({
        kind: 'ad',
        id: `ad-${index + 1}`,
      });
    }
  });
  return rows;
};

const Flows: React.FC<FlowsProps> = ({ onPostClick, onProfileClick, scrollParentRef }) => {
  const { theme } = useTheme();
  const { t } = useTranslation('common');
  const [feedState, setFeedState] = useAtom(flowsStateAtom);
  const posts = feedState.items;
  const loading = feedState.isLoading;
  const loadingMore = feedState.isLoadingMore;
  const error = feedState.error;
  const hasMore = feedState.hasMore;
  const nextCursor = feedState.cursor !== null && feedState.cursor !== undefined ? String(feedState.cursor) : '';
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isMountedRef = useRef(true);
  const requestIdRef = useRef(0);
  // debug response removed

  useEffect(() => {
    if (scrollParentRef?.current) {
      setScrollElement(scrollParentRef.current);
    }
  }, [scrollParentRef]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Use refs to track values and avoid stale closures
  const isRequestPendingRef = useRef(false);
  const loadingMoreRef = useRef(loadingMore);
  const hasMoreRef = useRef(hasMore);
  const loadingRef = useRef(loading);
  const nextCursorRef = useRef(nextCursor);
  const containerRef = useRef<HTMLDivElement>(null);
  const adsInFlowsEnabled = useMemo(() => isFeatureEnabled('ads_in_flows'), []);

  // Update refs when state changes
  useEffect(() => {
    loadingMoreRef.current = loadingMore;
  }, [loadingMore]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    nextCursorRef.current = nextCursor;
  }, [nextCursor]);

  // Wait for posts to render before hiding loading
  useEffect(() => {
    if (posts.length > 0 && loading) {
      // Use requestAnimationFrame for better performance
      let rafId: number;
      const timeoutId = setTimeout(() => {
        rafId = requestAnimationFrame(() => {
          setFeedState(prev => ({ ...prev, isLoading: false }));
        });
      }, 50); // Reduced delay

      return () => {
        clearTimeout(timeoutId);
        if (rafId) {
          cancelAnimationFrame(rafId);
        }
      };
    }
  }, [posts, loading]);

  // Safety: if we already have posts, don't keep initial loading on
  useEffect(() => {
    if (loading && posts.length > 0) {
      setFeedState(prev => ({ ...prev, isLoading: false }));
    }
  }, [loading, posts.length, setFeedState]);

  // Fetch posts from API
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        if (!isMountedRef.current) return;
        setFeedState(prev => ({ ...prev, isLoading: true, error: null }));
        const requestId = ++requestIdRef.current;
        const response: TimelineResponse = await withTimeout(
          api.fetchTimeline({ limit: 10 }),
          8000
        );
        if (requestId !== requestIdRef.current) return;
        if (!isMountedRef.current) return;
        console.log('Initial fetch response:', response);
        const filteredPosts = filterDeletedPosts(getTimelinePosts(response));

        const rawCursor = getTimelineCursor(response);
        let newCursor = '';
        if (rawCursor !== null && rawCursor !== undefined) {
          newCursor = String(rawCursor);
        }

        console.log('Initial cursor:', newCursor);
        // hasMore should be based on whether there's a next cursor
        const hasMorePosts = newCursor !== '' && newCursor !== '0' && newCursor !== 'null' && newCursor !== 'undefined';
        console.log('Initial hasMore:', hasMorePosts);
        setFeedState(prev => ({
          ...prev,
          items: filteredPosts,
          cursor: newCursor !== '' ? newCursor : null,
          hasMore: hasMorePosts,
          isLoading: false
        }));
      } catch (err) {
        console.error('Error fetching posts:', err);
        if (!isMountedRef.current) return;
        setFeedState(prev => ({
          ...prev,
          error: t('post_feed.error_generic'),
          isLoading: false
        }));
      }
    };

    fetchPosts();
  }, [t]);  

  // Load more posts function - using refs to avoid dependency issues
  const loadMorePosts = useCallback(async () => {
    // Get current values from refs to avoid stale closure
    const currentNextCursor = nextCursorRef.current;
    const currentLoadingMore = loadingMoreRef.current;
    const currentHasMore = hasMoreRef.current;

    console.log('loadMorePosts called with:', {
      currentNextCursor,
      currentLoadingMore,
      currentHasMore,
      isPending: isRequestPendingRef.current
    });

    // Check if nextCursor is valid (not empty string, not '0', and not null/undefined)
    if (
      !currentNextCursor ||
      currentNextCursor === '' ||
      currentNextCursor === '0' ||
      currentNextCursor === 'null' ||
      currentNextCursor === 'undefined' ||
      currentLoadingMore ||
      !currentHasMore ||
      isRequestPendingRef.current
    ) {
      console.log('Load more skipped:', {
        nextCursor: currentNextCursor,
        loadingMore: currentLoadingMore,
        hasMore: currentHasMore,
        isPending: isRequestPendingRef.current
      });
      return;
    }

    try {
      if (!isMountedRef.current) return;
      console.log('Loading more posts with cursor:', currentNextCursor);
      setFeedState(prev => ({ ...prev, isLoadingMore: true }));
      isRequestPendingRef.current = true;

      // Wait for skeleton to render (single frame is enough)
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          resolve(undefined);
        });
      });

      // Minimum loading time to ensure skeleton is visible
      const minLoadingTime = 300; // Reduced to 300ms for better UX
      const startTime = Date.now();

      const requestId = ++requestIdRef.current;
      const response: TimelineResponse = await withTimeout(
        api.fetchTimeline({ limit: 10, cursor: currentNextCursor }),
        8000
      );
      if (requestId !== requestIdRef.current) return;
      if (!isMountedRef.current) return;

      console.log('Load more response:', response);

      const filteredPosts = filterDeletedPosts(getTimelinePosts(response));
      const rawCursor = getTimelineCursor(response);
      let newCursor = '';
      if (rawCursor !== null && rawCursor !== undefined) {
        newCursor = String(rawCursor);
      }

      console.log('New cursor after load more:', newCursor);
      // Update hasMore based on whether there's a next cursor
      const hasMorePosts = newCursor !== '' && newCursor !== '0' && newCursor !== 'null' && newCursor !== 'undefined';
      console.log('Has more after load more:', hasMorePosts);
      setFeedState(prev => {
        const existingIds = new Set(prev.items.map(p => p.id));
        const newUniquePosts = filteredPosts.filter(p => !existingIds.has(p.id));
        const mergedItems = newUniquePosts.length > 0 ? [...prev.items, ...newUniquePosts] : prev.items;
        if (!hasMorePosts && filteredPosts.length === 0) {
          console.log('No more posts available');
        }
        return {
          ...prev,
          items: mergedItems,
          cursor: newCursor !== '' ? newCursor : null,
          hasMore: hasMorePosts,
          isLoadingMore: false
        };
      });

      // Ensure minimum loading time for skeleton visibility
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);

      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
    } catch (err) {
      console.error('Error loading more posts:', err);
      if (!isMountedRef.current) return;
      setFeedState(prev => ({ ...prev, error: t('post_feed.error_generic') }));
    } finally {
      if (isMountedRef.current) {
        setFeedState(prev => ({ ...prev, isLoadingMore: false }));
      }
      isRequestPendingRef.current = false;
    }
  }, [t]);

  useEffect(() => {
    const target = scrollElement;
    const threshold = 900;

    const handleNearEnd = () => {
      if (target) {
        const remaining = target.scrollHeight - target.scrollTop - target.clientHeight;
        if (remaining < threshold) {
          loadMorePosts();
        }
        return;
      }

      const documentElement = document.documentElement;
      const remaining = documentElement.scrollHeight - window.scrollY - window.innerHeight;
      if (remaining < threshold) {
        loadMorePosts();
      }
    };

    if (target) {
      target.addEventListener('scroll', handleNearEnd, { passive: true });
      return () => target.removeEventListener('scroll', handleNearEnd);
    }

    window.addEventListener('scroll', handleNearEnd, { passive: true });
    return () => window.removeEventListener('scroll', handleNearEnd);
  }, [loadMorePosts, scrollElement]);

  const refreshPosts = async () => {
    try {
      const shouldShowSkeleton = posts.length === 0;
      if (shouldShowSkeleton) {
        if (isMountedRef.current) {
          setFeedState(prev => ({ ...prev, isLoading: true }));
        }
      } else {
        if (isMountedRef.current) {
          setIsRefreshing(true);
        }
      }
      if (isMountedRef.current) {
        setFeedState(prev => ({ ...prev, error: null }));
      }
      const requestId = ++requestIdRef.current;
      const response: TimelineResponse = await withTimeout(
        api.fetchTimeline({ limit: 10 }),
        8000
      );
      if (requestId !== requestIdRef.current) return;
      if (!isMountedRef.current) return;
      console.log('Refresh response:', response);
      const filteredPosts = filterDeletedPosts(getTimelinePosts(response));
      setFeedState(prev => {
        if (prev.items.length === 0) {
          return {
            ...prev,
            items: filteredPosts
          };
        }
        const merged = new Map<string, ApiPost>();
        filteredPosts.forEach(post => merged.set(post.id, post));
        prev.items.forEach(post => {
          if (!post.deleted_at && !merged.has(post.id)) merged.set(post.id, post);
        });
        return {
          ...prev,
          items: Array.from(merged.values())
        };
      });

      // Handle next_cursor - can be number, string, or null/undefined
      const rawCursor = getTimelineCursor(response);
      let newCursor = '';
      if (rawCursor !== null && rawCursor !== undefined) {
        newCursor = String(rawCursor);
      }

      console.log('Refresh cursor:', newCursor);
      // hasMore should be based on whether there's a next cursor
      const hasMorePosts = newCursor !== '' && newCursor !== '0' && newCursor !== 'null' && newCursor !== 'undefined';
      console.log('Refresh hasMore:', hasMorePosts);
      setFeedState(prev => ({
        ...prev,
        cursor: newCursor !== '' ? newCursor : null,
        hasMore: hasMorePosts,
        isLoading: false
      }));
    } catch (err) {
      console.error('Error refreshing posts:', err);
      if (!isMountedRef.current) return;
      setFeedState(prev => ({
        ...prev,
        error: t('post_feed.error_generic'),
        isLoading: false
      }));
    } finally {
      if (isMountedRef.current) {
        setIsRefreshing(false);
      }
    }
  };

  const footerContext = useMemo(() => ({
    theme,
    loadingMore,
    hasMore,
    postsLength: posts.length
  }), [theme, loadingMore, hasMore, posts.length]);

  const showInitialLoading = loading && posts.length === 0;
  const feedRows = useMemo(
    () => injectFlowAds(posts, adsInFlowsEnabled),
    [posts, adsInFlowsEnabled]
  );
  return (
    <div ref={containerRef} className='w-full relative'>
      {isRefreshing && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="absolute top-0 left-0 right-0 z-20 pointer-events-none"
        >
          <div className="h-0.5 bg-gradient-to-r from-transparent via-pink-500/80 to-transparent animate-pulse" />
        </motion.div>
      )}
      {/* Posts Feed - Virtualized */}
      <div className='w-full'>
        {showInitialLoading ? (
          <div>
            <div className="space-y-6 px-1">
              {[1, 2, 3, 4, 5].map((index) => (
                <div key={`initial-skeleton-${index}`} className="skyline-feed-card elite-card overflow-hidden">
                  <PostSkeleton theme={theme} />
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center py-12 px-4"
          >
            {/* Error UI content */}
            <div className={`w-full`}>
              <div className="p-4">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center backdrop-blur-xl ${theme === 'dark'
                    ? 'bg-red-500/10 border border-red-500/20'
                    : 'bg-red-50 border border-red-200/50'
                    }`}>
                    <AlertCircle className={`w-8 h-8 sm:w-10 sm:h-10 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'
                      }`} />
                  </div>
                  <div>
                    <h3 className={`text-lg sm:text-xl font-semibold tracking-tight mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                      {t('post_feed.error_title')}
                    </h3>
                    <p className={`text-sm sm:text-base font-medium ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'
                      }`}>
                      {t('post_feed.error_description')}
                    </p>
                  </div>
                  <motion.button
                    onClick={refreshPosts}
                    disabled={loading}
                    className={`flex items-center gap-2.5 px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base transition-all duration-200 backdrop-blur-xl ${loading
                      ? theme === 'dark'
                        ? 'bg-gray-800/50 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-200/50 text-gray-400 cursor-not-allowed'
                      : theme === 'dark'
                        ? 'bg-white text-black hover:bg-gray-100 active:bg-gray-100'
                        : 'bg-black text-white hover:bg-gray-800 active:bg-gray-800'
                      }`}
                    whileHover={!loading ? { scale: 1.02 } : {}}
                    whileTap={!loading ? { scale: 0.98 } : {}}
                  >
                    <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? 'animate-spin' : ''}`} />
                    <span>{loading ? t('post_feed.reloading') : t('post_feed.reload')}</span>
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : posts.length === 0 ? (
          <div className={`elite-bubble mx-1 p-10 text-center font-semibold ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'}`}>
            {t('post_feed.empty')}
          </div>
        ) : (
          <>
            <div className="flow-masonry px-1">
              {feedRows.map((item) => {
                const isWidePost = item.kind === 'post' && isWideMediaPost(item.post);
                return (
                  <FlowMasonryItem
                    key={item.id}
                    wide={isWidePost}
                  >
                    {item.kind === 'ad' ? (
                      <div style={flowCardRenderStyle} className="skyline-feed-card elite-card overflow-hidden">
                        <FeatureAdCard theme={theme} placement="flows" />
                      </div>
                    ) : (
                      <MemoizedPostItem
                        post={item.post}
                        onPostClick={onPostClick}
                        onProfileClick={onProfileClick}
                      />
                    )}
                  </FlowMasonryItem>
                );
              })}
            </div>
            <FeedFooter context={footerContext} />
          </>
        )}
      </div>
    </div>
  );
};

export default Flows;
