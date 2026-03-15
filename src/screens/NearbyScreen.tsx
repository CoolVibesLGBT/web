import { useState, useEffect, useRef, useCallback } from 'react';
import { Filter, Users, Grid, List, Square, RefreshCw, MapPin, X, Map as MapIcon, Bubbles, Earth } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { UserCard } from '../features/profile/UserCard';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '../services/api';
import { useTranslation } from 'react-i18next';

import { useAtom } from 'jotai';

import { globalState } from '../state/nearby'; // atomun tanımlı olduğu dosya
import Container from '../components/ui/Container';
import Map from '../features/map/Map';
import BubbleView from '../features/post/BubbleView';
import DomeView from '../features/post/DomeView';
import ProfileScreen from './ProfileScreen';


const NearbyScreen: React.FC = () => {
  const { theme } = useTheme();
  const { viewMode, setViewMode } = useSettings();
  const { t } = useTranslation('common');

  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRequestPendingRef = useRef(false);

  const [selectedUser, setSelectedUser] = useState<unknown>(null);

  const [state, setState] = useAtom(globalState);

  // Fetch nearby users from API
  const fetchNearbyUsers = async (refreshing: boolean = false, lat?: number, lng?: number) => {
    if (isRequestPendingRef.current) return;

    const isLoadMore = !refreshing && lat === undefined && lng === undefined;

    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoadingUsers(true);
      }
      isRequestPendingRef.current = true;
      setError(null);

      // Build filter payload
      const payload: unknown = {
        limit: 100,
        cursor: (refreshing || (lat !== undefined && lng !== undefined)) ? null : state.nearByCursor,
        latitude: lat,
        longitude: lng
      };

      const response = await api.fetchNearbyUsers(payload);

      setState((prevState: unknown) => {
        // If refreshing or map moved, we replace the list. Otherwise we append.
        const shouldReset = refreshing || (lat !== undefined && lng !== undefined);
        const existingUsers = shouldReset ? [] : prevState.nearbyUsers;
        const existingIds = new Set(existingUsers.map((user: unknown) => user.id));

        // Filter out duplicates
        const newUsers = (response.users || []).filter(
          (user: unknown) => !existingIds.has(user.id)
        );

        return {
          ...prevState,
          nearbyUsers: shouldReset ? response.users || [] : [...prevState.nearbyUsers, ...newUsers],
          nearByCursor: response?.cursor || null, // CRITICAL: Clear cursor if no more data
        };
      });

    } catch (err: unknown) {
      console.error("Error fetching nearby users:", err);
      setError(err?.message || "Could not fetch users");
    } finally {
      setLoadingUsers(false);
      setLoadingMore(false);
      setIsRefreshing(false);
      // Small delay to prevent immediate re-trigger by observer
      setTimeout(() => {
        isRequestPendingRef.current = false;
      }, 500);
    }
  };


  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && state.nearByCursor && !isRequestPendingRef.current) {
          fetchNearbyUsers();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [state.nearByCursor, loadingMore, loadingUsers]);

  useEffect(() => {
    if (state.nearbyUsers.length == 0) {
      fetchNearbyUsers()
    }

  }, [])

  useEffect(() => {
    const handleUserBlocked = (e: unknown) => {
      const blockedId = e.detail?.userId;
      if (blockedId) {
        setState((prevState: unknown) => ({
          ...prevState,
          nearbyUsers: prevState.nearbyUsers.filter((u: unknown) => u.public_id !== blockedId && u.id !== blockedId)
        }));

        setSelectedUser((prev: unknown) => {
          if (prev && (prev.public_id === blockedId || prev.id === blockedId)) {
            return null;
          }
          return prev;
        });
      }
    };

    window.addEventListener('userBlocked', handleUserBlocked);
    return () => window.removeEventListener('userBlocked', handleUserBlocked);
  }, [setState]);



  const handleRefresh = () => {
    setState((prevState: unknown) => ({
      ...prevState,
      nearbyUsers: [],
      nearByCursor: null,
    }));
    setIsRefreshing(true);
    fetchNearbyUsers(true);
  };

  const handleMarkerClick = useCallback((user: unknown) => {
    setSelectedUser(user);
  }, []);

  const handleMapMoveEnd = useCallback((lat: number, lng: number) => {
    console.log("Map move end:", lat, lng);
    fetchNearbyUsers(false, lat, lng);
  }, [state.nearByCursor]);

  const isMapView = viewMode === 'map';
  const isBubbleView = viewMode === 'bubble'
  const isDomeView = viewMode === 'dome'


  return (
    <Container>
      {/* Header - Sticky */}
      <div className={`sticky top-0 z-50 border-b ${theme === 'dark'
        ? 'border-gray-800/50 bg-black/95'
        : 'border-gray-200/50 bg-white/95'
        }`}>
        <div className="w-full flex flex-row items-center justify-between gap-2 p-2 px-2">
          {/* Top Bar */}
          <div className="hidden md:block flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${theme === 'dark'
                ? 'bg-white text-black'
                : 'bg-black text-white'
                }`}>
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h1 className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {t('nearby.title')}
                </h1>
                <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                  {t('nearby.people_nearby', { count: state.nearbyUsers.length })}
                </p>
              </div>
            </div>


          </div>

          {/* Search, Filter and View Toggle */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex gap-2">
              {/* View Mode Toggle */}
              <div className={`flex rounded-xl p-1 ${theme === 'dark' ? 'bg-gray-900 border border-gray-800' : 'bg-gray-100 border border-gray-200'}`}>

                <motion.button
                  onClick={() => setViewMode('bubble')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-2.5 py-1.5 rounded-lg transition-all ${viewMode === 'bubble'
                    ? theme === 'dark' ? 'bg-white text-black' : 'bg-gray-900 text-white'
                    : theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  title={t('nearby.view_bubble')}
                >
                  <Bubbles className="w-5 h-5" />
                </motion.button>

                <motion.button
                  onClick={() => setViewMode('dome')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-2.5 py-1.5 rounded-lg transition-all ${viewMode === 'dome'
                    ? theme === 'dark' ? 'bg-white text-black' : 'bg-gray-900 text-white'
                    : theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  title={t('nearby.view_dome')}
                >
                  <Earth className="w-5 h-5" />
                </motion.button>


                <motion.button
                  onClick={() => setViewMode('grid')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-2.5 py-1.5 rounded-lg transition-all ${viewMode === 'grid'
                    ? theme === 'dark' ? 'bg-white text-black' : 'bg-gray-900 text-white'
                    : theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  title={t('nearby.view_grid')}
                >
                  <Grid className="w-5 h-5" />
                </motion.button>
                <motion.button
                  onClick={() => setViewMode('list')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-2.5 py-1.5 rounded-lg transition-all ${viewMode === 'list'
                    ? theme === 'dark' ? 'bg-white text-black' : 'bg-gray-900 text-white'
                    : theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  title={t('nearby.view_list')}
                >
                  <List className="w-5 h-5" />
                </motion.button>
                <motion.button
                  onClick={() => setViewMode('card')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-2.5 py-1.5 rounded-lg transition-all ${viewMode === 'card'
                    ? theme === 'dark' ? 'bg-white text-black' : 'bg-gray-900 text-white'
                    : theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  title={t('nearby.view_card')}
                >
                  <Square className="w-5 h-5" />
                </motion.button>
                <motion.button
                  onClick={() => setViewMode('map')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-2.5 py-1.5 rounded-lg transition-all ${viewMode === 'map'
                    ? theme === 'dark' ? 'bg-white text-black' : 'bg-gray-900 text-white'
                    : theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  title={t('nearby.view_map')}
                >
                  <MapIcon className="w-5 h-5" />
                </motion.button>
              </div>
              <div className="flex flex-row gap-2 items-center">
                <motion.button
                  onClick={() => setShowFilters(!showFilters)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative px-3 py-2 rounded-xl font-medium text-sm transition-all ${showFilters
                    ? theme === 'dark'
                      ? 'bg-white text-black'
                      : 'bg-gray-900 text-white'
                    : theme === 'dark'
                      ? 'bg-gray-900 border border-gray-800 text-gray-300 hover:bg-gray-800'
                      : 'bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  <Filter className="w-5 h-5 inline-block" />

                </motion.button>


                <motion.button
                  onClick={handleRefresh}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-2 rounded-xl transition-colors ${theme === 'dark'
                    ? 'bg-gray-900 border border-gray-800 text-gray-300 hover:bg-gray-800'
                    : 'bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200'
                    }`}
                  title={t('nearby.refresh')}
                >
                  <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>


      {isMapView ? (
        <div className="w-full h-[calc(100dvh-205px)] sm:h-[calc(100dvh-60px)]">
          <Map onMarkerClick={handleMarkerClick} onMapMoveEnd={handleMapMoveEnd} />
        </div>
      ) : isBubbleView ? (
        <div className="w-full h-[calc(100dvh-205px)] sm:h-[calc(100dvh-60px)]">
          <BubbleView />
        </div>
      ) : isDomeView ? (
        <div className="w-full h-[calc(100dvh-205px)] sm:h-[calc(100dvh-60px)]">
          <DomeView fit={0.1} maxRadius={1000} onMemberClick={handleMarkerClick} />
        </div>
      ) : (
        <div
          className="w-full mx-auto max-w-7xl relative"
          style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}>


          {/* Content Wrapper with Non-native Scroll */}
          <motion.div className="w-full p-2 min-h-full">
            {/* Users - Different layouts based on viewMode */}
            {!loadingUsers && state.nearbyUsers.length === 0 && !error ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl p-12 md:p-16 text-center ${theme === 'dark' ? 'bg-gray-900 border border-gray-800' : 'bg-gray-50 border border-gray-200'}`}
              >
                <div className="max-w-md mx-auto">
                  <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}>
                    <Users className={`w-10 h-10 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} />
                  </div>
                  <h3 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {t('nearby.no_matches_found')}
                  </h3>
                </div>
              </motion.div>
            ) : (
              <div className='w-full flex-col py-2'>
                {viewMode === 'grid' && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {state.nearbyUsers.map((user: unknown, index: number) => (
                      <motion.div
                        key={`view_grid_item${index}`}

                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                      >
                        <UserCard user={user} viewMode={'compact'} />
                      </motion.div>
                    ))}
                  </div>
                )}

                {viewMode === 'list' && (
                  <div className="space-y-3">
                    {state.nearbyUsers.map((user: unknown, index: number) => (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <UserCard user={user} viewMode={'list'} />
                      </motion.div>
                    ))}
                  </div>
                )}

                {viewMode === 'card' && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-2">
                    {state.nearbyUsers.map((user: unknown, index: number) => (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <UserCard user={user} viewMode={'card'} />
                      </motion.div>
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
                    className={`rounded-2xl p-12 md:p-16 text-center ${theme === 'dark' ? 'bg-gray-900 border border-gray-800' : 'bg-gray-50 border border-gray-200'}`}
                  >
                    <div className="max-w-md mx-auto">
                      <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}>
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
          </motion.div>
        </div>
      )}

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
              className={`fixed bottom-0 left-0 right-0 z-[101] max-w-4xl mx-auto ${theme === 'dark' ? 'bg-gray-950 border-t border-gray-800' : 'bg-white'
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
                    {selectedUser.displayname || selectedUser.username}
                  </h2>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                    @{selectedUser.username}
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
                  username={selectedUser.username}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Container>
  );
};

export default NearbyScreen;
