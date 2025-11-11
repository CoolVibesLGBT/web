import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Filter, Search, Users, Grid, List, Square, ChevronDown, RefreshCw, MapPin, Users2, X, Map as MapIcon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { UserCard } from './UserCard';
import { AnimatePresence, motion, useSpring, useTransform, useMotionValue, useMotionValueEvent, animate } from 'framer-motion';
import { api } from '../services/api';
import { Actions } from '../services/actions';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';

import { useAtom } from 'jotai';

import { globalState } from '../state/nearby'; // atomun tanımlı olduğu dosya
import Container from './Container';
import Map from './Map';


const NearbyScreen: React.FC = () => {
  const { theme } = useTheme();
  const { viewMode, setViewMode } = useSettings();
  const { defaultLanguage } = useApp();

  const { user: authUser } = useAuth(); // For future use if needed to filter own user
  const [showFilters, setShowFilters] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const [state, setState] = useAtom(globalState);

  // Fetch nearby users from API
  const fetchNearbyUsers = async (refreshing: boolean = false) => {
    try {
      setLoadingUsers(true);
      // Build filter payload - always include all filters
      const payload: any = {
        limit: 100,
        cursor: refreshing ? null : state.nearByCursor
      };


      const response = await api.call(Actions.CMD_USER_FETCH_NEARBY_USERS, {
        method: "POST",
        body: payload,
      });







      setState((prevState: any) => {
        // Mevcut nearbyUsers listesindeki user id’lerini alıyoruz
        const existingIds = new Set(prevState.nearbyUsers.map(user => user.id));

        // Sadece yeni kullanıcıları filtreliyoruz
        const filteredNewUsers = response.users.filter(
          (user: any) => !existingIds.has(user.id)
        );

        if (filteredNewUsers.length > 0) {
          // Gelen kullanıcıları uygun formata çeviriyoruz
          if (filteredNewUsers.length > 0) {
            return {
              ...prevState,
              nearbyUsers: [...prevState.nearbyUsers, ...filteredNewUsers],
              nearByCursor: response?.next_cursor || prevState.nearByCursor, // yeni cursor
            };
          }
        }

        return prevState;
      });






      setLoadingUsers(false);
      setLoadingMore(false);
      setIsRefreshing(false);

    } catch (error) {
      setLoadingUsers(false);
      setLoadingMore(false);
      setIsRefreshing(false);
    }
  };


  useEffect(() => {
    if (state.nearbyUsers.length == 0) {
      fetchNearbyUsers()
    }

  }, [])


  const handleRefresh = () => {
    setState((prevState: any) => ({
      ...prevState,
      nearbyUsers: [],
      nearByCursor: null,
    }));
    fetchNearbyUsers(true);
  };

  const isMapView = viewMode === 'map';



  return (
    <Container>
      {/* Header - Sticky */}
      <div className={`sticky top-0 z-50 border-b ${theme === 'dark'
        ? 'border-gray-800/50 bg-black/95'
        : 'border-gray-200/50 bg-white/95'
        }`}>
        <div className="w-full px-4 lg:px-6">
          {/* Top Bar */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${theme === 'dark'
                ? 'bg-white text-black'
                : 'bg-black text-white'
                }`}>
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h1 className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Nearby People
                </h1>
                <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                  {state.nearbyUsers.length} people nearby
                </p>
              </div>
            </div>

            <div className="flex items-center">
              <motion.button
                onClick={handleRefresh}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-2 rounded-full transition-colors ${theme === 'dark'
                  ? 'hover:bg-white/10 text-gray-400 hover:text-white'
                  : 'hover:bg-black/10 text-gray-500 hover:text-gray-900'
                  }`}
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </motion.button>
            </div>
          </div>

          {/* Search, Filter and View Toggle */}
          <div className="flex flex-col sm:flex-row gap-2 pb-4">


            <div className="flex gap-2">
              {/* View Mode Toggle */}
              <div className={`flex rounded-xl p-1 ${theme === 'dark' ? 'bg-gray-900 border border-gray-800' : 'bg-gray-100 border border-gray-200'}`}>
                <motion.button
                  onClick={() => setViewMode('grid')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-2.5 py-1.5 rounded-lg transition-all ${viewMode === 'grid'
                    ? theme === 'dark' ? 'bg-white text-black' : 'bg-gray-900 text-white'
                    : theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  title="Grid View"
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
                  title="List View"
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
                  title="Card View"
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
                  title="Map View"
                >
                  <MapIcon className="w-5 h-5" />
                </motion.button>
              </div>

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
            </div>
          </div>
        </div>
      </div>


      {isMapView ? (
        <div className="w-full mt-0">
          <Map />
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
                    No matches found
                  </h3>
                </div>
              </motion.div>
            ) : (
              <div className='w-full flex-col py-2'>
                {viewMode === 'grid' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {state.nearbyUsers.map((user: any, index) => (
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
                    {state.nearbyUsers.map((user: any, index) => (
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-2">
                    {state.nearbyUsers.map((user: any, index) => (
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

                <div className='w-full p-2 flex items-center justify-center'>
                  {state.nearByCursor && !loadingMore && (
                    <motion.button
                      onClick={() => {
                        setLoadingMore(true)
                        fetchNearbyUsers()
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-6 py-3 rounded-xl font-medium text-sm transition-all ${theme === 'dark'
                        ? 'bg-white text-black hover:bg-gray-200'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                        }`}
                    >
                      Load More
                    </motion.button>
                  )}
                </div>



                {loadingMore || loadingUsers && (
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
                        Loading nearby users...
                      </h3>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Finding people in your area
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
                      Try Again
                    </motion.button>
                  </motion.div>
                )}


              </div>
            )}
          </motion.div>
        </div>
      )}
    </Container>
  );
};

export default NearbyScreen;