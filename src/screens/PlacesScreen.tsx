import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { MapPin, Loader, RefreshCw, Grid, Map as MapIcon, X, Search, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../services/api';
import type { Place } from '../types/places';
import PlaceCard from '../features/discovery/PlaceCard';
import { DEFAULT_LIMIT } from '../constants/constants';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@/router';
import { useSEO } from '../hooks/useSEO';
import GameMap, { type GameMarkerContent } from '../features/map/Map/game/GameMap';
import { generatePlaceImage } from '../helpers/helpers';

type CursorType = {
  next: string | null;
  distance: number | null;
} | null;

const PlaceCardSkeleton = () => {
  const { theme } = useTheme();
  return (
    <div className="h-full animate-pulse overflow-hidden rounded-2xl border border-[var(--cv-surface-3)] p-1">
      <div className={`h-[220px] w-full rounded-xl ${theme === 'dark' ? 'bg-zinc-800' : 'bg-slate-100'}`} />
      <div className="space-y-2 px-3 py-2">
        <div className={`h-4 w-3/4 rounded-full ${theme === 'dark' ? 'bg-zinc-800' : 'bg-slate-200'}`} />
        <div className={`h-3 w-1/2 rounded-full ${theme === 'dark' ? 'bg-zinc-800' : 'bg-slate-100'}`} />
      </div>
    </div>
  );
};

const PlacesScreen: React.FC = () => {
  const { t } = useTranslation('common');
  const { theme } = useTheme();
  const navigate = useNavigate();

  useSEO({
    title: 'Discover LGBTQ+ Places Near You',
    description: 'Find LGBTQ+ friendly bars, clubs, saunas, cafes, and community spaces near you. Discover safe and welcoming places on CoolVibes.',
    keywords: 'LGBTQ+ places, gay bars, queer friendly cafes, LGBTQ friendly venues, gay clubs near me',
    canonical: '/places',
    type: 'website',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [places, setPlaces] = useState<Place[]>([]);
  const [cursor, setCursor] = useState<CursorType>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const fetchNearbyPlaces = useCallback(
    async (
      { center, reset = false }:
        { center: { latitude: number; longitude: number }; reset?: boolean }
    ) => {
      const isAppend = !reset;

      if (isAppend && loadingMore) return;

      if (isAppend) {
        setLoadingMore(true);
      } else {
        setLoadingInitial(true);
      }
      setError(null);

      const cursorToUse = reset ? null : cursor;

      try {
        const response = (await api.fetchNearbyPlaces(
          center.latitude,
          center.longitude,
          cursorToUse?.next || null,
          cursorToUse?.distance ? String(cursorToUse.distance) : null,
          DEFAULT_LIMIT
        )) as any;

        if (response && response.places) {
          setPlaces((prev: Place[]) => {
            if (reset) return response.places;
            const existingIds = new Set(prev.map(p => p.public_id));
            const newPlaces = response.places.filter((p: Place) => !existingIds.has(p.public_id));
            return [...prev, ...newPlaces];
          });

          if (response.cursor && response.cursor.next) {
            setCursor({
              next: response.cursor.next,
              distance: response.cursor.distance || null
            });
          } else {
            setCursor(null);
          }
        } else {
          setCursor(null);
          throw new Error(response?.error || t('places.no_places'));
        }
      } catch (err: any) {
        console.error('Mekanlar alınırken hata:', err);
        setError(err.message || t('places.no_places'));
        setCursor(null);
      } finally {
        if (isAppend) {
          setLoadingMore(false);
        } else {
          setLoadingInitial(false);
        }
      }
    },
    [cursor, loadingInitial, loadingMore, t]
  );

  const handleInitialFetch = useCallback(() => {
    setLoadingInitial(true);
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      const istanbul = { latitude: 41.0082, longitude: 28.9784 };
      setLocation(istanbul);
      setPlaces([]);
      setCursor(null);
      fetchNearbyPlaces({ center: istanbul, reset: true });
      setError(t('places.location_permission_error'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setLocation(loc);
        setPlaces([]);
        setCursor(null);
        fetchNearbyPlaces({ center: loc, reset: true });
      },
      (geoError) => {
        if (import.meta.env.DEV) {
          console.warn('Konum hatası:', geoError);
        }
        const errorCode = (geoError as { code?: number } | null)?.code;
        // If permission is denied or the error is unknown, use a default location but notify the user
        if (errorCode === 1 || errorCode == null) { // PERMISSION_DENIED or unknown
          const istanbul = { latitude: 41.0082, longitude: 28.9784 };
          setLocation(istanbul);
          fetchNearbyPlaces({ center: istanbul, reset: true });
          setError('LOCATION_DENIED');
        } else {
          setError(t('places.location_permission_error'));
          setLoadingInitial(false);
        }
      },
      { timeout: 10000 }
    );
  }, [fetchNearbyPlaces, t]);

  useEffect(() => {
    handleInitialFetch();
     
  }, []);

  const categories = useMemo<string[]>(() => {
    const allHashtags = places.flatMap((p: Place) => (
      Array.isArray(p.hashtags)
        ? p.hashtags.map((h: any) => h.tag).filter(Boolean)
        : []
    ));
    const uniqueHashtags = [...new Set(allHashtags.map((tag: any) => String(tag)))];
    return ['all', ...uniqueHashtags.slice(0, 10)];
  }, [places]);

  const filteredPlaces = useMemo(() => {
    return places.filter((place: Place) => {
      const tags = Array.isArray(place.hashtags) ? place.hashtags : [];
      if (selectedCategory !== 'all' && !tags.some((h: any) => h.tag === selectedCategory)) {
        return false;
      }
      if (searchQuery) {
        const name = (place.extras?.place?.name ?? '').toLowerCase();
        const description = (place.extras?.place?.description ?? '').toLowerCase();
        const query = searchQuery.toLowerCase();
        return name.includes(query) || description.includes(query);
      }
      return true;
    });
  }, [places, selectedCategory, searchQuery]);

  useEffect(() => {
    const handleSearchQuery = (event: Event) => {
      const query = (event as CustomEvent<{ query?: string }>).detail?.query ?? '';
      setSearchQuery(query);
    };

    window.addEventListener('cv:places-search-query', handleSearchQuery);
    return () => {
      window.removeEventListener('cv:places-search-query', handleSearchQuery);
    };
  }, []);

  useEffect(() => {
    if (selectedCategory !== 'all' && !categories.includes(selectedCategory)) {
      setSelectedCategory('all');
    }
  }, [categories, selectedCategory]);

  const publishPlacesControlsState = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('cv:places-controls-state', {
      detail: {
        viewMode,
        selectedCategory,
        categories,
        resultCount: filteredPlaces.length,
        isLoading: loadingInitial,
      },
    }));
  }, [categories, filteredPlaces.length, loadingInitial, selectedCategory, viewMode]);

  useEffect(() => {
    publishPlacesControlsState();
  }, [publishPlacesControlsState]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    return () => {
      window.dispatchEvent(new CustomEvent('cv:places-controls-state', { detail: null }));
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleControlsRequest = () => {
      publishPlacesControlsState();
    };

    window.addEventListener('cv:places-controls-request', handleControlsRequest);
    return () => {
      window.removeEventListener('cv:places-controls-request', handleControlsRequest);
    };
  }, [publishPlacesControlsState]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleViewMode = (event: Event) => {
      const mode = (event as CustomEvent<{ viewMode?: 'grid' | 'map' }>).detail?.viewMode;
      if (mode === 'grid' || mode === 'map') {
        setViewMode(mode);
      }
    };

    const handleCategory = (event: Event) => {
      const category = (event as CustomEvent<{ category?: string }>).detail?.category;
      if (category) {
        setSelectedCategory(category);
      }
    };

    const handleRefresh = () => {
      handleInitialFetch();
    };

    window.addEventListener('cv:places-set-view-mode', handleViewMode);
    window.addEventListener('cv:places-set-category', handleCategory);
    window.addEventListener('cv:places-refresh', handleRefresh);

    return () => {
      window.removeEventListener('cv:places-set-view-mode', handleViewMode);
      window.removeEventListener('cv:places-set-category', handleCategory);
      window.removeEventListener('cv:places-refresh', handleRefresh);
    };
  }, [handleInitialFetch]);

  const observerTarget = useRef<HTMLDivElement>(null);
  const cursorRef = useRef(cursor);
  const loadingMoreRef = useRef(loadingMore);
  const locationRef = useRef(location);
  const lastMapCenterRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const isRequestPendingRef = useRef(false);

  useEffect(() => { cursorRef.current = cursor; }, [cursor]);
  useEffect(() => { loadingMoreRef.current = loadingMore; }, [loadingMore]);
  useEffect(() => {
    locationRef.current = location;
    if (location) {
      lastMapCenterRef.current = location;
    }
  }, [location]);

  const loadMore = useCallback(async () => {
    if (isRequestPendingRef.current || !cursorRef.current || !locationRef.current) return;

    isRequestPendingRef.current = true;
    await fetchNearbyPlaces({ center: locationRef.current });

    // Add a small delay to prevent immediate re-trigger by observer
    setTimeout(() => {
      isRequestPendingRef.current = false;
    }, 500);
  }, [fetchNearbyPlaces]);

  useEffect(() => {
    const target = observerTarget.current;
    if (!target || viewMode === 'map') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && cursorRef.current && !loadingMoreRef.current && !isRequestPendingRef.current) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [loadMore, viewMode]);

  const handleMapMove = useCallback((lat: number, lng: number) => {
    const newLoc = { latitude: lat, longitude: lng };
    const lastCenter = lastMapCenterRef.current;
    const hasCenterChanged = !lastCenter
      || Math.abs(lastCenter.latitude - newLoc.latitude) > 0.0001
      || Math.abs(lastCenter.longitude - newLoc.longitude) > 0.0001;
    if (!hasCenterChanged) {
      return;
    }
    lastMapCenterRef.current = newLoc;
    locationRef.current = newLoc;
    // When moving the map, we treat it as a "load more" or "discovery" in the new area.
    // We don't reset the list to allow the user to see all items they've found.
    fetchNearbyPlaces({ center: newLoc });
  }, [fetchNearbyPlaces]);

  const renderGrid = () => (
    <div className="space-y-4 pb-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
        {filteredPlaces.map(place => (
          <PlaceCard
            key={place.public_id}
            place={place}
            selected={false}
            className="h-full"
            onClick={p => navigate(`/places/${p.public_id}`, { state: { place: p } })}
          />
        ))}
      </div>
      <div ref={observerTarget} className="h-10 w-full flex items-center justify-center">
        {loadingMore && (
          <div className="flex items-center justify-center gap-2 text-sm p-4">
            <Loader className="w-5 h-5 animate-spin" />
            <span>{t('places.loading_more')}</span>
          </div>
        )}
      </div>
    </div>
  );

  // Use a ref for the initial center to prevent the map from re-rendering/re-mounting
  // when the user drags and updates the 'location' state.
  const initialCenter = useRef<[number, number] | null>(null);
  if (!initialCenter.current && location) {
    initialCenter.current = [location.latitude, location.longitude];
  }

  const defaultCenter: [number, number] = initialCenter.current || [41.0082, 28.9784];

  const getPlaceMarkerId = useCallback((place: Place): string => place.public_id, []);
  const getPlaceMarkerCoords = useCallback((place: Place): [number, number] | null => {
    const { latitude, longitude } = (place as any).extras?.place ?? {};
    return typeof latitude === 'number' && typeof longitude === 'number' ? [latitude, longitude] : null;
  }, []);
  const getPlaceMarkerContent = useCallback((place: Place): GameMarkerContent => {
    const { image, name } = (place as any).extras?.place ?? {};
    return {
      imageUrl: image || generatePlaceImage(place.public_id),
      label: name,
      variant: 'pokestop',
    };
  }, []);
  const handlePlaceMarkerClick = useCallback((place: Place) => {
    navigate(`/places/${place.public_id}`, { state: { place } });
  }, [navigate]);

  const renderMap = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-0"
    >
      <GameMap
        locations={filteredPlaces}
        getMarkerId={getPlaceMarkerId}
        getMarkerCoords={getPlaceMarkerCoords}
        getMarkerContent={getPlaceMarkerContent}
        onMarkerClick={handlePlaceMarkerClick}
        onMapMoveEnd={handleMapMove}
        playerPosition={location ? [location.latitude, location.longitude] : null}
        initialCenter={defaultCenter}
      />
    </motion.div>
  );

  const renderContent = () => {
    if (loadingInitial && places.length === 0) {
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {Array.from({ length: 9 }).map((_, i) => (
            <PlaceCardSkeleton key={i} />
          ))}
        </div>
      );
    }

    // Show full-page error ONLY for fatal issues (API errors, etc.)
    if (error && error !== 'LOCATION_DENIED') {
      return (
        <div className={`rounded-2xl p-8 mt-8 border text-center max-w-xl mx-auto relative z-10 ${theme === 'dark' ? 'cv-card-surface-solid border-white/10' : 'bg-white border-gray-200/50'
          }`}>
          <div className="relative">
            <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-black'
              }`}>
              <MapPin className="w-8 h-8" />
            </div>
            <h2 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {(t('places.error_title') || 'Oops! Something went wrong')}
            </h2>
            <p className={`text-sm mb-8 leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              {error}
            </p>
            <button
              type="button"
              onClick={handleInitialFetch}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98] ${theme === 'dark' ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'
                }`}
            >
              <RefreshCw className="w-4 h-4" />
              {t('places.retry') || 'Tekrar Dene'}
            </button>
          </div>
        </div>
      );
    }

    const showLocationBanner = error === 'LOCATION_DENIED';

    return (
      <div className="space-y-4">
        {showLocationBanner && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`elite-bubble relative z-20 flex flex-col items-center justify-between gap-4 rounded-[28px] p-3.5 pointer-events-auto sm:flex-row md:p-4 ${theme === 'dark' ? 'cv-card-surface-soft border-white/10' : 'border-white/70 bg-white/80'
              }`}
          >
            <div className="flex items-center gap-3">
              <div className="sky-glow flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className={`text-sm font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>
                  {t('places.location_banner_title', { defaultValue: 'Konum keşfi' })}
                </p>
                <p className={`mt-0.5 text-[11px] font-semibold leading-snug ${theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'}`}>
                  {t('places.location_banner_description', {
                    defaultValue: 'Yakınındaki mekanlar için konum izni ver. Şimdilik İstanbul sonuçları gösteriliyor.'
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleInitialFetch}
                className="sky-glow flex-1 whitespace-nowrap rounded-full px-4 py-2.5 text-xs font-black text-white transition-all active:scale-95 sm:flex-none"
              >
                {t('places.allow_location', { defaultValue: 'Konum Aç' })}
              </button>
              <button
                onClick={() => setError(null)}
                className={`elite-btn h-9 w-9 shrink-0 ${theme === 'dark' ? 'text-zinc-500 hover:bg-white/10 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-950'
                  }`}
                aria-label={t('common.close', { defaultValue: 'Kapat' })}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {filteredPlaces.length === 0 && !loadingInitial ? (
          <div className="py-16 text-center relative z-10">
            <MapPin className={`mx-auto w-12 h-12 mb-4 ${theme === 'dark' ? 'text-gray-700' : 'text-gray-300'}`} />
            <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
              {t('places.no_places_found_title') || 'No places found'}
            </h3>
            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              {t('places.no_places_found_subtitle') || 'Try adjusting your search or filters.'}
            </p>
          </div>
        ) : (
          viewMode === 'grid' && renderGrid()
        )}
      </div>
    );
  };

  const isDark = theme === 'dark';

  return (
    <motion.div
      className="relative h-full w-full overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Map layer — always mounted but only visible in map mode */}
      <motion.div
        animate={{ opacity: viewMode === 'map' ? 1 : 0, pointerEvents: viewMode === 'map' ? 'auto' : 'none' }}
        transition={{ duration: 0.3 }}
        className={viewMode === 'map' ? 'fixed inset-0 z-0' : 'absolute inset-0 z-0'}
      >
        {renderMap}
      </motion.div>

      {/* Scrollable overlay — always the same structure */}
      <div className={`relative z-10 h-full skyline-page-scroll ${
        viewMode === 'map' ? 'overflow-hidden pointer-events-none' : 'overflow-y-auto'
      }`}>
        <div className={`flex flex-col px-1 md:px-2 ${
          viewMode === 'map' ? 'pointer-events-none min-h-full' : 'min-h-full'
        }`}>

        <div className="pointer-events-auto z-50 mx-auto w-full max-w-7xl">
          <section className="relative">

            {/* ── View Mode Bar ──────────────────────────────────────────────── */}
            <div className="cv-tab-bar cv-tab-bar--top -mx-1 md:-mx-2">
              {/* View switcher */}
              <div className="cv-tab-row">
                <div className="flex shrink-0 items-center pl-4">
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    aria-label={t('app.back', { defaultValue: 'Back' })}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand)] text-white transition-all hover:bg-[var(--color-brand-hovered)]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                </div>
                {(['grid', 'map'] as const).map((mode) => {
                  const isActive = viewMode === mode;
                  const Icon = mode === 'grid' ? Grid : MapIcon;
                  const label = mode === 'grid' ? t('nearby.view_grid') : t('nearby.view_map');
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setViewMode(mode)}
                      style={{ minWidth: 0 }}
                      className={`cv-tab ${isActive ? 'is-active' : ''}`}
                      title={label}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="min-w-0 truncate">{label}</span>
                      <span className={`cv-tab-underline ${isActive ? 'is-on' : ''}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex min-h-[44px] items-center gap-2 px-1 pb-3 pt-3 md:px-2">
              <span className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[var(--color-brand-light-solid)] px-3.5 text-[13px] font-semibold text-[var(--color-brand)]">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {filteredPlaces.length}
              </span>
              {searchQuery && (
                <span className="flex h-9 min-w-0 shrink-0 items-center gap-1.5 rounded-full bg-[var(--cv-surface-3)] px-3.5 text-[13px] font-semibold text-[var(--cv-neutral-2)]">
                  <Search className="h-3.5 w-3.5 shrink-0" />
                  <span className="max-w-[140px] truncate md:max-w-[200px]">{searchQuery}</span>
                </span>
              )}

              {/* ── Category Tags (sayaç ile yenile arasında, ortada) ── */}
              {categories.length > 1 && (
                <div
                  className={`flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto no-scrollbar ${
                    viewMode === 'map'
                      ? isDark
                        ? 'rounded-full border border-white/8 bg-black/40 px-2 py-1 backdrop-blur-2xl'
                        : 'rounded-full border border-white/60 bg-white/75 px-2 py-1 backdrop-blur-2xl shadow-sm'
                      : ''
                  }`}
                >
                  {categories.map((cat: any) => {
                    const isAll = cat === 'all';
                    const isSelected = selectedCategory === cat;
                    const label = isAll ? (t('places.all_categories') || 'Tümü') : `#${cat}`;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        aria-pressed={isSelected}
                        className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors ${isSelected
                          ? 'bg-[var(--color-brand)] text-white'
                          : 'bg-[var(--cv-surface-3)] text-[var(--cv-neutral-2)] hover:bg-[var(--cv-surface-3-hover)]'
                          }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}

              <button
                type="button"
                onClick={handleInitialFetch}
                disabled={loadingInitial}
                aria-label={t('places.retry')}
                title={t('places.retry')}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--cv-surface-3)] text-[var(--cv-neutral-1)] transition-all hover:bg-[var(--cv-surface-3-hover)] disabled:cursor-default disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loadingInitial && places.length === 0 ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </section>
        </div>

        {/* Content Area */}
        {viewMode !== 'map' && (
          <div className="pointer-events-auto mx-auto w-full max-w-7xl px-0 pt-2 md:px-1">
            {renderContent()}
          </div>
        )}

        {/* Spacer so the overlay div has height in map mode */}
        {viewMode === 'map' && <div className="flex-1" />}
      </div>
    </div>
    </motion.div>
  );
};

export default PlacesScreen;
