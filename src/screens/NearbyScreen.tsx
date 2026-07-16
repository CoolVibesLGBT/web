import { useState, useEffect, useRef, useCallback, useMemo, type CSSProperties } from 'react';
import { Users, Grid, List, Square, RefreshCw, X, Map as MapIcon, Bubbles, Lock } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { UserCard } from '../features/profile/UserCard';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '../services/api';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@/router';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import { PremiumGateModal } from '@/components/premium/PremiumGate';

import { useAtom } from 'jotai';

import { globalState } from '../state/nearby'; // atomun tanımlı olduğu dosya
import BubbleView from '../features/post/BubbleView';
import ProfileScreen from './ProfileScreen';
import FeatureAdCard from '@/components/ads/FeatureAdCard';
import { isFeatureEnabled } from '@/config/featureFlags';

type MapComponentType = typeof import('../features/map/Map').default;

type NearbyRenderItem =
  | { kind: 'user'; id: string; user: any }
  | { kind: 'ad'; id: string };

type NearbyCursor = {
  next?: string | number | null;
  distance?: string | number | null;
} | null;

type NearbyViewMode = 'bubble' | 'grid' | 'list' | 'card' | 'map';

const DEFAULT_NEARBY_LIMIT = 50;
const NEARBY_VIEW_MODE_STORAGE_KEY = 'nearbyViewMode';
const NEARBY_VIEW_MODES: NearbyViewMode[] = ['bubble', 'grid', 'list', 'card', 'map'];

const isNearbyViewMode = (value: unknown): value is NearbyViewMode => (
  typeof value === 'string' && (NEARBY_VIEW_MODES as string[]).includes(value)
);

const nearbyGridItemStyle: CSSProperties = {
  contentVisibility: 'auto',
  contain: 'layout paint style',
  containIntrinsicSize: '260px 360px',
};

const nearbyListItemStyle: CSSProperties = {
  contentVisibility: 'auto',
  contain: 'layout paint style',
  containIntrinsicSize: '72px',
};

const nearbyCardItemStyle: CSSProperties = {
  contentVisibility: 'auto',
  contain: 'layout paint style',
  containIntrinsicSize: '320px 520px',
};

const isValidNearbyCursorValue = (value: unknown): value is string | number => (
  value !== null &&
  value !== undefined &&
  value !== '' &&
  value !== '0' &&
  value !== 'null' &&
  value !== 'undefined'
);

const normalizeNearbyCursor = (response: unknown): NearbyCursor => {
  const payload = response as any;
  const rawCursor =
    payload?.cursor ??
    payload?.data?.cursor ??
    payload?.data?.data?.cursor ??
    null;

  const fallbackDistance =
    payload?.distance ??
    payload?.data?.distance ??
    payload?.data?.data?.distance ??
    null;

  if (rawCursor && typeof rawCursor === 'object' && !Array.isArray(rawCursor)) {
    const nextValue =
      rawCursor.next ??
      rawCursor.next_cursor ??
      rawCursor.nextCursor ??
      rawCursor.cursor ??
      rawCursor.value ??
      null;

    return isValidNearbyCursorValue(nextValue)
      ? {
        next: nextValue,
        distance: rawCursor.distance ?? fallbackDistance ?? null,
      }
      : null;
  }

  const nextValue =
    rawCursor ??
    payload?.next_cursor ??
    payload?.nextCursor ??
    payload?.next ??
    payload?.data?.next_cursor ??
    payload?.data?.nextCursor ??
    payload?.data?.next ??
    payload?.data?.data?.next_cursor ??
    payload?.data?.data?.nextCursor ??
    payload?.data?.data?.next ??
    null;

  return isValidNearbyCursorValue(nextValue)
    ? {
      next: nextValue,
      distance: fallbackDistance,
    }
    : null;
};

const NearbyScreen: React.FC = () => {
  const { theme } = useTheme();
  const { setViewMode: persistGlobalViewMode } = useSettings();
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { isPremiumRequired } = usePremiumAccess();

  const [viewMode, setNearbyViewMode] = useState<NearbyViewMode>(() => {
    if (typeof window === 'undefined') {
      return 'grid';
    }
    const savedMode = window.localStorage.getItem(NEARBY_VIEW_MODE_STORAGE_KEY);
    return isNearbyViewMode(savedMode) ? savedMode : 'grid';
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasRequestedNearby, setHasRequestedNearby] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [MapComponent, setMapComponent] = useState<MapComponentType | null>(null);
  const [premiumBlockedMode, setPremiumBlockedMode] = useState<'bubble' | null>(null);

  const isRequestPendingRef = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const nearbyUsersRef = useRef<any[]>([]);
  const lastLoadMoreCursorRef = useRef<string | number | null>(null);

  const [selectedUser, setSelectedUser] = useState<any>(null);

  const [state, setState] = useAtom(globalState);
  const adsInNearbyEnabled = useMemo(() => isFeatureEnabled('ads_in_nearby'), []);

  const setViewMode = useCallback((nextMode: NearbyViewMode) => {
    setNearbyViewMode(nextMode);
    persistGlobalViewMode(nextMode);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(NEARBY_VIEW_MODE_STORAGE_KEY, nextMode);
    }
  }, [persistGlobalViewMode]);

  const nearbyRenderItems = useMemo<NearbyRenderItem[]>(() => {
    const users = state.nearbyUsers ?? [];
    const rows: NearbyRenderItem[] = [];

    users.forEach((user: any, index: number) => {
      rows.push({
        kind: 'user',
        id: String(user?.id ?? user?.public_id ?? user?.username ?? `user-${index}`),
        user,
      });

      if (adsInNearbyEnabled && (index + 1) % 8 === 0) {
        rows.push({
          kind: 'ad',
          id: `ad-${index + 1}`,
        });
      }
    });

    return rows;
  }, [adsInNearbyEnabled, state.nearbyUsers]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let active = true;
    import('../features/map/Map')
      .then((mod) => {
        if (active) setMapComponent(() => mod.default);
      })
      .catch((error) => {
        console.error('Failed to load map module', error);
      });
    return () => {
      active = false;
    };
  }, []);

  // Use a ref for cursor to avoid recreating fetchNearbyUsers on every cursor change
  const cursorRef = useRef(state.nearByCursor);
  const hasMoreRef = useRef(true);

  useEffect(() => {
    cursorRef.current = state.nearByCursor;
    // If cursor is null after we've fetched at least once, there's no more data
  }, [state.nearByCursor]);

  useEffect(() => {
    nearbyUsersRef.current = state.nearbyUsers ?? [];
  }, [state.nearbyUsers]);

  // Fetch nearby users from API
  const fetchNearbyUsers = useCallback(async (refreshing: boolean = false, lat?: number, lng?: number) => {
    if (isRequestPendingRef.current) return;
    if (!refreshing && lat === undefined && lng === undefined && !hasMoreRef.current) return;

    const isLoadMore = !refreshing && lat === undefined && lng === undefined;
    let shouldAutoContinue = false;

    try {
      setHasRequestedNearby(true);
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoadingUsers(true);
      }
      isRequestPendingRef.current = true;
      setError(null);

      const currentCursor = cursorRef.current;

      // Build filter payload
      const shouldResetPagination = refreshing || (lat !== undefined && lng !== undefined);
      const requestCursor = shouldResetPagination ? null : currentCursor?.next ?? null;

      if (
        isLoadMore &&
        isValidNearbyCursorValue(requestCursor) &&
        lastLoadMoreCursorRef.current !== null &&
        String(lastLoadMoreCursorRef.current) === String(requestCursor)
      ) {
        return;
      }

      const payload: unknown = {
        limit: DEFAULT_NEARBY_LIMIT,
        cursor: requestCursor,
        distance: shouldResetPagination ? null : currentCursor?.distance ?? null,
        latitude: lat,
        longitude: lng
      };

      if (shouldResetPagination) {
        hasMoreRef.current = true;
        lastLoadMoreCursorRef.current = null;
      } else if (isLoadMore && isValidNearbyCursorValue(requestCursor)) {
        lastLoadMoreCursorRef.current = requestCursor;
      }

      const response = (await api.fetchNearbyUsers(payload as any)) as any;
      const responseUsers = Array.isArray(response)
        ? response
        : Array.isArray(response?.users)
          ? response.users
          : Array.isArray(response?.data?.users)
            ? response.data.users
            : Array.isArray(response?.data?.data?.users)
              ? response.data.data.users
              : Array.isArray(response?.items)
                ? response.items
                : Array.isArray(response?.data?.items)
                  ? response.data.items
                  : Array.isArray(response?.data)
                    ? response.data
                    : [];
      const responseCursor = normalizeNearbyCursor(response);
      const existingUsers = shouldResetPagination ? [] : nearbyUsersRef.current;
      const existingIds = new Set(existingUsers.map((user: any) => user.id));
      const newUsers = responseUsers.filter(
        (user: any) => !existingIds.has(user.id)
      );
      const nextCursorValue = responseCursor?.next ?? null;
      const cursorAdvanced =
        !isValidNearbyCursorValue(requestCursor) ||
        !isValidNearbyCursorValue(nextCursorValue) ||
        String(nextCursorValue) !== String(requestCursor);
      const nextHasMore =
        isValidNearbyCursorValue(nextCursorValue) &&
        responseUsers.length > 0 &&
        (shouldResetPagination || newUsers.length > 0) &&
        cursorAdvanced;
      const nextCursor = nextHasMore ? responseCursor : null;
      const nextUsers = shouldResetPagination ? responseUsers : [...existingUsers, ...newUsers];

      // CRITICAL: Update cursor ref synchronously so the next observer call reads the new cursor
      cursorRef.current = nextCursor;

      // Update hasMore based on response
      hasMoreRef.current = nextHasMore;
      nearbyUsersRef.current = nextUsers;
      shouldAutoContinue = nextHasMore && nextUsers.length > 0 && (shouldResetPagination || newUsers.length > 0);

      setState((prevState: any) => ({
        ...prevState,
        nearbyUsers: nextUsers,
        nearByCursor: nextCursor,
      }));

    } catch (err: unknown) {
      console.error("Error fetching nearby users:", err);
      lastLoadMoreCursorRef.current = null;
      setError((err as any)?.message || "Could not fetch users");
    } finally {
      setLoadingUsers(false);
      setLoadingMore(false);
      setIsRefreshing(false);
      isRequestPendingRef.current = false;

      // Auto-continue: if sentinel is still visible and there's more data, fetch again
      // IntersectionObserver only fires on visibility CHANGES, not when elements stay visible
      if (shouldAutoContinue && hasMoreRef.current && observerTarget.current && scrollContainerRef.current) {
        const rect = observerTarget.current.getBoundingClientRect();
        const rootRect = scrollContainerRef.current.getBoundingClientRect();
        const isVisible = rect.top < rootRect.bottom + 200 && rect.bottom > rootRect.top;
        if (isVisible) {
          setTimeout(() => {
            if (!isRequestPendingRef.current && hasMoreRef.current) {
              fetchNearbyUsers();
            }
          }, 100);
        }
      }
    }
  }, [setState]);


  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = observerTarget.current;
    const scrollRoot = scrollContainerRef.current;
    if (!target || !scrollRoot) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreRef.current && !isRequestPendingRef.current) {
          fetchNearbyUsers();
        }
      },
      {
        root: scrollRoot,
        threshold: 0.01,
        rootMargin: '0px 0px 320px 0px',
      }
    );

    observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
      observer.disconnect();
    };
  }, [fetchNearbyUsers]);

  useEffect(() => {
    const scrollRoot = scrollContainerRef.current;
    if (!scrollRoot) return;

    const handleScroll = () => {
      if (!hasMoreRef.current || isRequestPendingRef.current) {
        return;
      }

      const remaining = scrollRoot.scrollHeight - scrollRoot.scrollTop - scrollRoot.clientHeight;
      if (remaining <= 320) {
        fetchNearbyUsers();
      }
    };

    scrollRoot.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      scrollRoot.removeEventListener('scroll', handleScroll);
    };
  }, [fetchNearbyUsers]);

  useEffect(() => {
    if (state.nearbyUsers.length == 0) {
      fetchNearbyUsers()
    }

  }, [state.nearbyUsers.length, fetchNearbyUsers]);

  useEffect(() => {
    const handleUserBlocked = (e: any) => {
      const blockedId = e.detail?.userId;
      if (blockedId) {
        setState((prevState: any) => ({
          ...prevState,
          nearbyUsers: prevState.nearbyUsers.filter((u: any) => u.public_id !== blockedId && u.id !== blockedId)
        }));

        setSelectedUser((prev: any) => {
          if (prev && (prev.public_id === blockedId || prev.id === blockedId)) {
            return null;
          }
          return prev;
        });
      }
    };

    window.addEventListener('userBlocked', (handleUserBlocked as any));
    return () => window.removeEventListener('userBlocked', (handleUserBlocked as any));
  }, [setState]);



  const handleRefresh = useCallback(() => {
    if (isRequestPendingRef.current) return;
    hasMoreRef.current = true;
    setHasRequestedNearby(true);
    setState((prevState: any) => ({
      ...prevState,
      nearbyUsers: [],
      nearByCursor: null,
    }));
    setIsRefreshing(true);
    fetchNearbyUsers(true);
  }, [fetchNearbyUsers, setState]);

  const handleMarkerClick = useCallback((user: any) => {
    setSelectedUser(user);
  }, []);

  const handleMapMoveEnd = useCallback((lat: number, lng: number) => {
    console.log("Map move end:", lat, lng);
    fetchNearbyUsers(false, lat, lng);
  }, [fetchNearbyUsers]);

  const handleChangeViewMode = useCallback((nextMode: NearbyViewMode) => {
    const isPremiumMode = nextMode === 'bubble';
    if (isPremiumMode && isPremiumRequired) {
      setPremiumBlockedMode(nextMode);
      return;
    }
    setPremiumBlockedMode(null);
    setViewMode(nextMode);
  }, [isPremiumRequired, setViewMode]);

  useEffect(() => {
    if (!isPremiumRequired) return;
    if (viewMode === 'bubble') {
      setViewMode('grid');
    }
  }, [isPremiumRequired, setViewMode, viewMode]);

  const publishNearbyControlsState = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('cv:nearby-controls-state', {
      detail: {
        viewMode,
        resultCount: state.nearbyUsers.length,
        isLoading: loadingUsers || loadingMore || isRefreshing,
        isPremiumRequired,
      },
    }));
  }, [isPremiumRequired, isRefreshing, loadingMore, loadingUsers, state.nearbyUsers.length, viewMode]);

  useEffect(() => {
    publishNearbyControlsState();
  }, [publishNearbyControlsState]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    return () => {
      window.dispatchEvent(new CustomEvent('cv:nearby-controls-state', { detail: null }));
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleControlsRequest = () => {
      publishNearbyControlsState();
    };

    window.addEventListener('cv:nearby-controls-request', handleControlsRequest);
    return () => {
      window.removeEventListener('cv:nearby-controls-request', handleControlsRequest);
    };
  }, [publishNearbyControlsState]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleViewMode = (event: Event) => {
      const mode = (event as CustomEvent<{ viewMode?: NearbyViewMode }>).detail?.viewMode;
      if (isNearbyViewMode(mode)) {
        handleChangeViewMode(mode);
      }
    };

    window.addEventListener('cv:nearby-set-view-mode', handleViewMode);
    window.addEventListener('cv:nearby-refresh', handleRefresh);

    return () => {
      window.removeEventListener('cv:nearby-set-view-mode', handleViewMode);
      window.removeEventListener('cv:nearby-refresh', handleRefresh);
    };
  }, [handleChangeViewMode, handleRefresh]);

  const isMapView = viewMode === 'map';
  const isBubbleView = viewMode === 'bubble'
  const isImmersiveView = isMapView || isBubbleView;
  const hasNearbyUsers = state.nearbyUsers.length > 0;
  const showInitialLoadingState = (!hasRequestedNearby || loadingUsers) && !error && !hasNearbyUsers;
  const showEmptyState = hasRequestedNearby && !loadingUsers && !loadingMore && !error && !hasNearbyUsers;
  const statusPanelClassName = `rounded-[30px] border p-8 text-center backdrop-blur-3xl ${theme === 'dark'
    ? 'cv-card-surface-soft border-white/10 text-zinc-400'
    : 'border-white/70 bg-white/80 text-slate-500'
    }`;
  const statusIconClassName = `mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full ${theme === 'dark'
    ? 'bg-white/[0.06] text-zinc-400'
    : 'bg-slate-100 text-slate-500'
    }`;
  const renderNearbyStatusPanel = () => {
    if (showInitialLoadingState) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={statusPanelClassName}
        >
          <div className={statusIconClassName}>
            <RefreshCw className="h-7 w-7 animate-spin" />
          </div>
          <h3 className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>
            {t('nearby.loading_users')}
          </h3>
          <p className="mt-2 text-sm font-bold">
            {t('nearby.finding_people')}
          </p>
        </motion.div>
      );
    }

    if (error) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={statusPanelClassName}
        >
          <p className="text-sm font-black text-red-500">{error}</p>
          <button
            type="button"
            onClick={handleRefresh}
            className={`mt-5 inline-flex h-10 items-center justify-center rounded-full px-5 text-[10px] font-black uppercase tracking-[0.14em] transition-all ${theme === 'dark'
              ? 'bg-white text-slate-950 hover:bg-zinc-200'
              : 'bg-slate-950 text-white hover:bg-slate-800'
              }`}
          >
            {t('nearby.try_again')}
          </button>
        </motion.div>
      );
    }

    if (showEmptyState) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={statusPanelClassName}
        >
          <div className={statusIconClassName}>
            <Users className="h-7 w-7" />
          </div>
          <h3 className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>
            {t('nearby.no_matches_found')}
          </h3>
          <button
            type="button"
            onClick={handleRefresh}
            className={`mt-5 inline-flex h-10 items-center justify-center rounded-full px-5 text-[10px] font-black uppercase tracking-[0.14em] transition-all ${theme === 'dark'
              ? 'bg-white text-slate-950 hover:bg-zinc-200'
              : 'bg-slate-950 text-white hover:bg-slate-800'
              }`}
          >
            {t('nearby.refresh')}
          </button>
        </motion.div>
      );
    }

    return null;
  };
  const premiumGateCopy = useMemo(() => ({
    badge: t('premium.gate_badge', { defaultValue: 'Premium Access' }),
    title: t('premium.nearby_title', { defaultValue: 'Bubble view requires Premium' }),
    description: t('premium.nearby_description', {
      defaultValue: 'Upgrade to Premium to unlock Bubble discovery mode in Nearby.',
    }),
    highlights: [
      t('premium.nearby_highlight_1', { defaultValue: 'Unlock Bubble view' }),
      t('premium.nearby_highlight_2', { defaultValue: 'Access premium discovery surfaces' }),
    ],
    cta: t('premium.upgrade_cta', { defaultValue: 'Upgrade to Premium' }),
    dismiss: t('premium.dismiss_cta', { defaultValue: 'Maybe later' }),
    footnote: t('premium.gate_note', {
      defaultValue: 'You can manage your plan anytime from account settings.',
    }),
  }), [t]);


  return (
    <motion.div
      ref={scrollContainerRef}
      className={isImmersiveView ? 'relative h-full w-full overflow-hidden' : 'skyline-page-scroll w-full'}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {isMapView && (
        <div className="fixed inset-0 z-0">
          {MapComponent ? (
            <MapComponent onMarkerClick={handleMarkerClick} onMapMoveEnd={handleMapMoveEnd} />
          ) : (
            <div className={`h-full w-full ${theme === 'dark' ? 'cv-card-surface-solid' : 'bg-gray-100'}`} />
          )}
        </div>
      )}
      {isBubbleView && (
        <div className="fixed inset-0 z-0">
          <BubbleView />
        </div>
      )}

      <div className={`relative z-10 flex flex-col ${isImmersiveView ? 'h-full pointer-events-none px-2 pt-24 md:pt-28' : 'px-1 pb-8 pt-24 md:px-2 md:pt-28'}`}>
        <div className={`pointer-events-auto z-50 mx-auto w-full lg:hidden ${isImmersiveView ? 'max-w-5xl px-1' : 'max-w-7xl px-1 md:px-2'}`}>
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className={`${isImmersiveView ? 'flex h-14 flex-nowrap items-center gap-2 overflow-hidden' : 'flex min-h-[50px] flex-wrap items-center gap-2 border-b pb-2'} ${isImmersiveView
              ? theme === 'dark'
                ? 'cv-card-surface-soft rounded-[22px] border border-white/10 px-2 backdrop-blur-3xl shadow-[0_18px_60px_-42px_rgba(0,0,0,0.9)]'
                : 'rounded-[22px] border border-white/70 bg-white/75 px-2 backdrop-blur-3xl shadow-[0_18px_60px_-42px_rgba(15,23,42,0.55)]'
              : theme === 'dark'
                ? 'border-white/10'
                : 'border-slate-200/80'
              }`}>
              <div className={`flex min-w-0 flex-1 items-center gap-1 overflow-x-auto rounded-full p-1 no-scrollbar ${theme === 'dark' ? 'bg-white/[0.04]' : 'bg-slate-100/85'}`}>
                <motion.button
                  onClick={() => handleChangeViewMode('bubble')}
                  whileTap={{ scale: 0.98 }}
                  className={`flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full px-3 text-[10px] font-black uppercase tracking-[0.14em] transition-all ${isImmersiveView ? 'w-9 px-0 sm:w-auto sm:px-3' : ''} ${viewMode === 'bubble'
                    ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/25'
                    : theme === 'dark' ? 'text-zinc-500 hover:bg-white/10 hover:text-white' : 'text-slate-500 hover:bg-white hover:text-slate-950'
                    }`}
                  title={t('nearby.view_bubble')}
                >
                  <Bubbles className="h-3.5 w-3.5" />
                  {isPremiumRequired && <Lock className="h-3 w-3" />}
                </motion.button>
                <motion.button
                  onClick={() => handleChangeViewMode('grid')}
                  whileTap={{ scale: 0.98 }}
                  className={`flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full px-3 text-[10px] font-black uppercase tracking-[0.14em] transition-all ${isImmersiveView ? 'w-9 px-0 sm:w-auto sm:px-3' : ''} ${viewMode === 'grid'
                    ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/25'
                    : theme === 'dark' ? 'text-zinc-500 hover:bg-white/10 hover:text-white' : 'text-slate-500 hover:bg-white hover:text-slate-950'
                    }`}
                  title={t('nearby.view_grid')}
                >
                  <Grid className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t('nearby.view_grid')}</span>
                </motion.button>
                <motion.button
                  onClick={() => handleChangeViewMode('list')}
                  whileTap={{ scale: 0.98 }}
                  className={`flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full px-3 text-[10px] font-black uppercase tracking-[0.14em] transition-all ${isImmersiveView ? 'w-9 px-0 sm:w-auto sm:px-3' : ''} ${viewMode === 'list'
                    ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/25'
                    : theme === 'dark' ? 'text-zinc-500 hover:bg-white/10 hover:text-white' : 'text-slate-500 hover:bg-white hover:text-slate-950'
                    }`}
                  title={t('nearby.view_list')}
                >
                  <List className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t('nearby.view_list')}</span>
                </motion.button>
                <motion.button
                  onClick={() => handleChangeViewMode('card')}
                  whileTap={{ scale: 0.98 }}
                  className={`flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full px-3 text-[10px] font-black uppercase tracking-[0.14em] transition-all ${isImmersiveView ? 'w-9 px-0 sm:w-auto sm:px-3' : ''} ${viewMode === 'card'
                    ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/25'
                    : theme === 'dark' ? 'text-zinc-500 hover:bg-white/10 hover:text-white' : 'text-slate-500 hover:bg-white hover:text-slate-950'
                    }`}
                  title={t('nearby.view_card')}
                >
                  <Square className="h-3.5 w-3.5" />
                </motion.button>
                <motion.button
                  onClick={() => handleChangeViewMode('map')}
                  whileTap={{ scale: 0.98 }}
                  className={`flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full px-3 text-[10px] font-black uppercase tracking-[0.14em] transition-all ${isImmersiveView ? 'w-9 px-0 sm:w-auto sm:px-3' : ''} ${viewMode === 'map'
                    ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/25'
                    : theme === 'dark' ? 'text-zinc-500 hover:bg-white/10 hover:text-white' : 'text-slate-500 hover:bg-white hover:text-slate-950'
                    }`}
                  title={t('nearby.view_map')}
                >
                  <MapIcon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t('nearby.view_map')}</span>
                </motion.button>
              </div>

              <div className="ml-auto flex shrink-0 items-center gap-2">
                <div className={`hidden h-9 shrink-0 items-center rounded-full px-3 text-[10px] font-black uppercase tracking-[0.14em] sm:flex ${theme === 'dark' ? 'bg-white/[0.04] text-zinc-400' : 'bg-white/70 text-slate-500'}`}>
                  {t('nearby.people_nearby', { count: state.nearbyUsers.length })}
                </div>
              </div>

              <motion.button
                type="button"
                onClick={handleRefresh}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                title={t('nearby.refresh')}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all ${theme === 'dark'
                  ? 'bg-white text-slate-950 hover:bg-zinc-200'
                  : 'bg-slate-950 text-white hover:bg-slate-800'
                  }`}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </motion.button>
            </div>
          </motion.section>
        </div>

        {isImmersiveView && (showInitialLoadingState || showEmptyState || error) && (
          <div className="pointer-events-auto mx-auto mt-3 w-full max-w-md px-1">
            {renderNearbyStatusPanel()}
          </div>
        )}

        {!isImmersiveView && (
          <div
            className="pointer-events-auto mx-auto w-full max-w-7xl px-0 pt-4 md:px-1"
            style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}>


            {/* Content Wrapper with Non-native Scroll */}
            <div className="w-full min-h-full p-2">
              {/* Users - Different layouts based on viewMode */}
              {(showInitialLoadingState || showEmptyState || error) ? (
                renderNearbyStatusPanel()
              ) : (
              <div className='w-full flex-col py-2'>
                {viewMode === 'grid' && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {nearbyRenderItems.map((item, index: number) => (
                      item.kind === 'ad' ? (
                        <div
                          key={`nearby-grid-${item.id}`}
                          className="col-span-2 sm:col-span-5"
                          style={nearbyGridItemStyle}
                        >
                          <FeatureAdCard theme={theme} placement="nearby" />
                        </div>
                      ) : (
                        <div
                          key={`nearby-grid-${item.id}-${index}`}
                          style={nearbyGridItemStyle}
                        >
                          <UserCard user={item.user} viewMode={'compact'} />
                        </div>
                      )
                    ))}
                  </div>
                )}

                {viewMode === 'list' && (
                  <div className="space-y-3">
                    {nearbyRenderItems.map((item, index: number) => (
                      item.kind === 'ad' ? (
                        <div
                          key={`nearby-list-${item.id}`}
                          style={nearbyListItemStyle}
                        >
                          <FeatureAdCard theme={theme} placement="nearby" />
                        </div>
                      ) : (
                        <div
                          key={`nearby-list-${item.id}-${index}`}
                          style={nearbyListItemStyle}
                        >
                          <UserCard user={item.user} viewMode={'list'} />
                        </div>
                      )
                    ))}
                  </div>
                )}

                {viewMode === 'card' && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-2">
                    {nearbyRenderItems.map((item, index: number) => (
                      item.kind === 'ad' ? (
                        <div
                          key={`nearby-card-${item.id}`}
                          className="md:col-span-4"
                          style={nearbyCardItemStyle}
                        >
                          <FeatureAdCard theme={theme} placement="nearby" />
                        </div>
                      ) : (
                        <div
                          key={`nearby-card-${item.id}-${index}`}
                          style={nearbyCardItemStyle}
                        >
                          <UserCard user={item.user} viewMode={'card'} />
                        </div>
                      )
                    ))}
                  </div>
                )}

                <div ref={observerTarget} className='w-full p-2 flex items-center justify-center min-h-[50px]'>
                  {/* Sentinel for infinite scroll */}
                </div>



                {(loadingMore || loadingUsers) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-2xl p-12 md:p-16 text-center ${theme === 'dark' ? 'cv-card-surface-solid border border-white/10' : 'bg-gray-50 border border-gray-200'}`}
                  >
                    <div className="max-w-md mx-auto">
                      <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${theme === 'dark' ? 'bg-white/[0.06]' : 'bg-gray-200'}`}>
                        <RefreshCw className={`w-10 h-10 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'} animate-spin`} />
                      </div>
                      <h3 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {t('nearby.loading_users')}
                      </h3>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {t('nearby.finding_people')}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Error State */}
                {error && !loadingUsers && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-2xl p-6 mb-4 border ${theme === 'dark'
                      ? 'bg-red-900/20 border-red-700 text-red-300'
                      : 'bg-red-50 border-red-200 text-red-700'
                      }`}
                  >
                    <p className="text-sm font-medium">{error}</p>
                    <motion.button
                      onClick={handleRefresh}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`mt-4 px-4 py-2 rounded-xl text-sm font-medium ${theme === 'dark'
                        ? 'bg-red-900/40 hover:bg-red-900/60'
                        : 'bg-red-100 hover:bg-red-200'
                        }`}
                    >
                      {t('nearby.try_again')}
                    </motion.button>
                  </motion.div>
                )}


              </div>
            )}
          </div>
        </div>
        )}
      </div>

      <PremiumGateModal
        open={premiumBlockedMode !== null}
        theme={theme}
        copy={premiumGateCopy}
        onClose={() => setPremiumBlockedMode(null)}
        onUpgrade={() => {
          setPremiumBlockedMode(null);
          navigate('/premium');
        }}
      />

      {/* Profile Bottom Sheet */}
      <AnimatePresence>
        {selectedUser && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
            />

            {/* Content */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed bottom-0 left-0 right-0 z-[101] max-w-4xl mx-auto ${theme === 'dark' ? 'cv-card-surface-solid border-t border-white/10' : 'bg-white'
                } rounded-t-[32px] shadow-2xl flex flex-col overflow-hidden`}
              style={{ maxHeight: '92vh', height: '92vh' }}
            >
              {/* Handle Bar */}
              <div className="flex justify-center pt-3 pb-2 cursor-pointer shrink-0" onClick={() => setSelectedUser(null)}>
                <div className={`w-12 h-1.5 rounded-full ${theme === 'dark' ? 'bg-white/20' : 'bg-gray-300'}`} />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
                <div className="flex flex-col">
                  <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                    {(selectedUser as any).displayname || (selectedUser as any).username}
                  </h2>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                    @{(selectedUser as any).username}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedUser(null)}
                  className={`p-2 rounded-full ${theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  <X className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
                </motion.button>
              </div>

              {/* Profile Screen Embed */}
              <div
                className="flex-1 overflow-y-auto pb-32"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                <ProfileScreen
                  inline={true}
                  isEmbed={true}
                  username={(selectedUser as any).username}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default NearbyScreen;
