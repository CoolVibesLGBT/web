import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from '@/router';
import { useTheme } from '../contexts/ThemeContext';
import Stories from '../features/post/Stories';
import Flows from '../features/post/Flows';
import CreatePost from '../features/post/CreatePost';
import { useSettings } from '../contexts/SettingsContext';
import VibesGL from '../features/post/VibesGL/VibesGL';
import { AnimatePresence, motion } from 'framer-motion';
import { isFeatureEnabled } from '@/config/featureFlags';
import { resolvePublicAssetUrl } from '@/platform/runtime';
import { useSetAtom } from 'jotai';
import { flowsStateAtom } from '@/state/flows';
import { api } from '@/services/api';
import type { ApiPost } from '@/features/post/Post';
import {
  filterDeletedPosts,
  getTimelineCursor,
  getTimelinePosts,
  hasUsableTimelineCursor,
  type TimelineResponse,
  withTimeout,
} from '@/features/post/timelineUtils';

const LiveTab = React.lazy(() => import('./LiveTab'));

const MAX_HEADER_HEIGHT = 335;
const MIN_HEADER_HEIGHT = 80;

const getFeedPostKey = (post: ApiPost) => post.id || post.public_id;

const mergeFeedPosts = (...postGroups: Array<Array<ApiPost | undefined>>) => {
  const merged = new Map<string, ApiPost>();
  postGroups.flat().forEach((post) => {
    if (!post || post.deleted_at) return;
    const key = getFeedPostKey(post);
    if (!key || merged.has(key)) return;
    merged.set(key, post);
  });
  return Array.from(merged.values());
};

const HomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const liveEnabled = isFeatureEnabled('live_enabled');
  const setFeedState = useSetAtom(flowsStateAtom);
  const [activeTab, setActiveTab] = useState('flows');
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const { setShowBottomBar } = useSettings();

  useEffect(() => {
    const tab = new URLSearchParams(location.search || '').get('tab');
    if (tab === 'live') {
      setActiveTab(liveEnabled ? 'live' : 'flows');
      return;
    }
    if (tab === 'cool' || tab === 'flows') {
      setActiveTab('flows');
      return;
    }
    if (tab === 'vibes') {
      setActiveTab('vibes');
    }
  }, [location.search, liveEnabled]);

  useEffect(() => {
    setShowBottomBar(activeTab === 'flows');
  }, [activeTab, setShowBottomBar]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleCreatePost = () => {
      setActiveTab('flows');
      setShowBottomBar(true);
      setIsCreatePostOpen(true);
    };

    window.addEventListener('cv:create-post', handleCreatePost);
    return () => window.removeEventListener('cv:create-post', handleCreatePost);
  }, [setShowBottomBar]);

  // Handle post click - update URL
  const handlePostClick = useCallback((postId: string, username: string) => {
    navigate(`/${username}/status/${postId}`, { replace: true });
  }, [navigate]);

  // Handle profile click - navigate to profile page
  const handleProfileClick = useCallback((username: string) => {
    navigate(`/${username}`, { replace: true });
  }, [navigate]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const storiesShellRef = useRef<HTMLDivElement>(null);
  const lastScrollTopRef = useRef(0);
  const isTickingRef = useRef(false);

  const updateHeaderVisibility = useCallback(() => {
    const scrollTop = lastScrollTopRef.current;
    const nextHeight = Math.max(MIN_HEADER_HEIGHT, MAX_HEADER_HEIGHT - scrollTop);
    const progress = Math.max(
      0,
      Math.min(
        1,
        (nextHeight - MIN_HEADER_HEIGHT) / (MAX_HEADER_HEIGHT - MIN_HEADER_HEIGHT)
      )
    );
    const storiesShell = storiesShellRef.current;
    if (storiesShell) {
      storiesShell.style.opacity = progress.toFixed(3);
      storiesShell.style.pointerEvents = progress < 0.2 ? 'none' : 'auto';
    }
    isTickingRef.current = false;
  }, []);

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    lastScrollTopRef.current = scrollContainerRef.current.scrollTop;

    if (!isTickingRef.current) {
      isTickingRef.current = true;
      requestAnimationFrame(updateHeaderVisibility);
    }
  }, [updateHeaderVisibility]);

  useEffect(() => {
    const current = scrollContainerRef.current;
    if (current) {
      current.addEventListener('scroll', handleScroll, { passive: true });
    }
    return () => {
      if (current) {
        current.removeEventListener('scroll', handleScroll);
      }
    };
  }, [handleScroll]);

  const refreshFeedAfterPostCreated = useCallback(async (createdPost?: ApiPost) => {
    setActiveTab('flows');
    setShowBottomBar(true);
    setIsCreatePostOpen(false);

    if (createdPost && !createdPost.deleted_at) {
      setFeedState(prev => ({
        ...prev,
        items: mergeFeedPosts([createdPost], prev.items),
        isLoading: false,
        error: null,
      }));
    }

    requestAnimationFrame(() => {
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    });

    try {
      const response = await withTimeout(
        api.fetchTimeline({ limit: 10 }) as Promise<TimelineResponse>,
        8000
      );
      const freshPosts = filterDeletedPosts(getTimelinePosts(response));
      const rawCursor = getTimelineCursor(response);
      const cursor = rawCursor !== null && rawCursor !== undefined ? String(rawCursor) : null;

      setFeedState(prev => ({
        ...prev,
        items: mergeFeedPosts(freshPosts, createdPost ? [createdPost] : [], prev.items),
        cursor,
        hasMore: hasUsableTimelineCursor(rawCursor),
        isLoading: false,
        isLoadingMore: false,
        error: null,
      }));
    } catch (error) {
      console.error('Error refreshing feed after post creation:', error);
      setFeedState(prev => ({
        ...prev,
        isLoading: false,
        isLoadingMore: false,
        error: prev.items.length > 0 ? null : prev.error,
      }));
    }
  }, [setFeedState, setShowBottomBar]);


  return (
    <div
      ref={scrollContainerRef}
      style={{
        height: '100%',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
      className="flex h-full flex-col overflow-y-auto no-scrollbar pt-24 md:pt-28">

      {
        activeTab == "flows" && <div
          ref={storiesShellRef}
          className="flex-shrink-0 px-1 pb-12 transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            opacity: 1,
            pointerEvents: 'auto',
            minHeight: 112
          }}>
          <Stories />
        </div>
      }

      {activeTab !== 'flows' && (
      <header className="sticky top-0 z-30 mb-8 flex flex-col items-center gap-0 px-1"

        style={{
          transition: 'height 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
          willChange: 'height',

        }}
      >



        <div className="w-full max-w-[560px] flex-grow">
          <div className="elite-floating z-40 p-1.5">
            {/* Tab Navigation */}
            <div className="relative z-10 flex gap-1">
              {liveEnabled && (
                <motion.button
                  type="button"
                  onClick={() => {
                    setActiveTab('live')
                    setShowBottomBar(false)
                  }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative flex-1 cursor-pointer overflow-hidden rounded-full py-2.5 font-bold uppercase tracking-[0.16em] text-[10px] transition-all duration-300 ${
                    activeTab === 'live'
                      ? 'text-white'
                      : theme === 'dark' ? 'text-zinc-500 hover:bg-zinc-800 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-sky-600'
                    }`}
                >
                  <div className='relative z-10 w-full flex flex-row gap-2 items-center justify-center'>
                    <img src={resolvePublicAssetUrl('/icons/live.webp')} alt="Live tab" className='h-7 w-7 rounded-full object-cover' />
                    <span>Live</span>
                  </div>

                  {activeTab === 'live' && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-sky-600"
                      layoutId="homeScreenTabIndicator"
                      layout="position"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      style={{ willChange: 'transform' }}
                    />
                  )}
                </motion.button>
              )}
              <motion.button
                type="button"
                onClick={() => {
                  setActiveTab('flows')
                  setShowBottomBar(true)
                }}
                whileTap={{ scale: 0.98 }}
                className={`relative flex-1 cursor-pointer overflow-hidden rounded-full py-2.5 font-bold uppercase tracking-[0.16em] text-[10px] transition-all duration-300 ${
                  activeTab === 'flows'
                    ? 'text-white'
                    : theme === 'dark' ? 'text-zinc-500 hover:bg-zinc-800 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-sky-600'
                }`}
              >
                <div className='relative z-10 w-full flex flex-row gap-2 items-center justify-center'>
                  <img src={resolvePublicAssetUrl('/icons/flows.webp')} alt="Cool tab" className='h-7 w-7 rounded-full object-cover' />
                  <span>Cool</span>
                </div>

                {activeTab === 'flows' && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-sky-600"
                    layoutId="homeScreenTabIndicator"
                    layout="position"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    style={{ willChange: 'transform' }}
                  />
                )}
              </motion.button>
              <motion.button
                type="button"
                onClick={() => {
                  setActiveTab('vibes')
                  setShowBottomBar(false)
                }}
                whileTap={{ scale: 0.98 }}
                className={`relative flex-1 cursor-pointer overflow-hidden rounded-full py-2.5 font-bold uppercase tracking-[0.16em] text-[10px] transition-all duration-300 ${
                  activeTab === 'vibes'
                    ? 'text-white'
                    : theme === 'dark' ? 'text-zinc-500 hover:bg-zinc-800 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-sky-600'
                }`}
              >
                <div className='relative z-10 w-full flex flex-row gap-2 items-center justify-center'>
                  <img src={resolvePublicAssetUrl('/icons/vibes.webp')} alt="Vibes tab" className='h-7 w-7 rounded-full object-cover' />
                  <span>Vibes</span>
                </div>

                {activeTab === 'vibes' && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-sky-600"
                    layoutId="homeScreenTabIndicator"
                    layout="position"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    style={{ willChange: 'transform' }}
                  />
                )}
              </motion.button>
            </div>
          </div>

        </div>
      </header>
      )}




      <main className="min-h-0 flex-grow w-full min-w-0 pb-4">
        {/* Posts Feed or Vibes Grid */}
        <AnimatePresence mode="wait">
          {activeTab === 'flows' ? (
            <Flows
              key="flows"
              onPostClick={handlePostClick}
              onProfileClick={handleProfileClick}
              scrollParentRef={scrollContainerRef}
            />
          ) : activeTab === 'live' && liveEnabled ? (
            <React.Suspense fallback={null}>
              <LiveTab key="live" theme={theme} />
            </React.Suspense>
          ) : (
            <VibesGL key="vibes" />
          )}
        </AnimatePresence>
      </main>

      {/* CreatePost Modal */}
      <AnimatePresence>
        {isCreatePostOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="cv-modal-glass-backdrop fixed inset-0 z-[900] flex items-start justify-center overflow-y-auto p-3 md:items-center md:p-6"
            onClick={() => setIsCreatePostOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 18 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className={`cv-modal-glass-panel mt-16 flex max-h-[calc(100vh-6rem)] w-full max-w-2xl flex-col overflow-y-auto rounded-[28px] border no-scrollbar md:mt-0 ${theme === 'dark'
                ? 'text-white'
                : 'text-slate-950'
                }`}
              onClick={(event) => event.stopPropagation()}
            >
              <CreatePost
                title="Create Post"
                buttonText="Post"
                fullScreen={false}
                allowFullScreenToggle={false}
                placeholder="Every vibe tells a story. What's yours? 🌈"
                canClose={true}
                onClose={() => setIsCreatePostOpen(false)}
                onPostCreated={refreshFeedAfterPostCreated}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HomeScreen;
