import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { MapPin, Loader, RefreshCw, Grid, Map as MapIcon, ZoomIn, ZoomOut, LocateFixed, Shrink, X, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../services/api';
import type { Place } from '../types/places';
import PlaceCard from '../features/discovery/PlaceCard';
import { DEFAULT_LIMIT } from '../constants/constants';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@/router';
import { useSEO } from '../hooks/useSEO';

type CursorType = {
  next: string | null;
  distance: number | null;
} | null;

type ReactLeafletModule = typeof import('react-leaflet');
type PlaceMarkerComponentType = typeof import('../features/map/Map/PlaceMarker').default;

type MapEventsHandlerProps = {
  onMoveEnd: (lat: number, lng: number) => void;
  useMapEvents: ReactLeafletModule['useMapEvents'];
};

const MapEventsHandler: React.FC<MapEventsHandlerProps> = ({ onMoveEnd, useMapEvents }) => {
  useMapEvents({
    moveend: (event: any) => {
      const center = event.target.getCenter();
      onMoveEnd(center.lat, center.lng);
    },
  });
  return null;
};

type MapControlsProps = {
  initialCenter: [number, number];
  initialZoom: number;
  theme: string;
  useMap: ReactLeafletModule['useMap'];
  useMapEvents: ReactLeafletModule['useMapEvents'];
};

const MapControls: React.FC<MapControlsProps> = ({
  initialCenter,
  initialZoom,
  theme,
  useMap,
  useMapEvents,
}) => {
  const map = useMap();
  const [isTouched, setIsTouched] = useState(false);

  useMapEvents({
    move() { if (!isTouched) setIsTouched(true); },
    zoom() { if (!isTouched) setIsTouched(true); },
  });

  const handleLocate = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(position => {
        map.flyTo([position.coords.latitude, position.coords.longitude], 16);
      });
    }
  };

  const handleCenter = () => {
    if (!isTouched) return;
    map.flyTo(initialCenter, initialZoom);
    map.once('moveend', () => setIsTouched(false));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      className="absolute top-1/2 right-4 lg:right-6 -translate-y-1/2 z-[1000] flex flex-col gap-3"
    >
      <div className={`flex flex-col rounded-2xl border backdrop-blur-xl shadow-2xl overflow-hidden ${theme === 'dark'
        ? 'cv-card-surface-soft border-white/10'
        : 'bg-white/70 border-black/5'
        }`}>
        <button
          onClick={() => map.zoomIn()}
          className="p-3 transition-all hover:bg-black/5 dark:hover:bg-white/10 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white"
          title="Zoom In"
        >
          <ZoomIn size={20} />
        </button>
        <div className={`h-px w-full ${theme === 'dark' ? 'bg-white/5' : 'bg-black/5'}`} />
        <button
          onClick={() => map.zoomOut()}
          className="p-3 transition-all hover:bg-black/5 dark:hover:bg-white/10 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white"
          title="Zoom Out"
        >
          <ZoomOut size={20} />
        </button>
      </div>

      <div className={`flex flex-col rounded-2xl border backdrop-blur-xl shadow-2xl overflow-hidden ${theme === 'dark'
        ? 'cv-card-surface-soft border-white/10'
        : 'bg-white/70 border-black/5'
        }`}>
        <button
          onClick={handleLocate}
          className="p-3 transition-all hover:bg-black/5 dark:hover:bg-white/10 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white"
          title="Locate me"
        >
          <LocateFixed size={20} />
        </button>
        <div className={`h-px w-full ${theme === 'dark' ? 'bg-white/5' : 'bg-black/5'}`} />
        <button
          className={`p-3 transition-all ${isTouched
            ? 'hover:bg-black/5 dark:hover:bg-white/10 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white'
            : 'opacity-30 cursor-default text-black/40 dark:text-white/40'
            }`}
          onClick={handleCenter}
          title="Recenter"
        >
          <Shrink size={20} />
        </button>
      </div>
    </motion.div>
  );
};

const PlaceCardSkeleton = () => {
  const { theme } = useTheme();
  return (
    <div className="elite-card-static h-full animate-pulse overflow-hidden p-3">
      <div className={`h-[220px] w-full rounded-[28px] ${theme === 'dark' ? 'bg-zinc-800' : 'bg-slate-100'}`} />
      <div className="space-y-3 px-2 pb-2 pt-4">
        <div className={`h-5 rounded-full ${theme === 'dark' ? 'bg-zinc-800' : 'bg-slate-200'}`} />
        <div className="flex items-center gap-2 pt-1">
          <div className={`h-4 w-4 rounded-full ${theme === 'dark' ? 'bg-zinc-800' : 'bg-slate-200'}`} />
          <div className={`h-3 w-1/2 rounded-full ${theme === 'dark' ? 'bg-zinc-800' : 'bg-slate-200'}`} />
        </div>
        <div className="space-y-1 pt-1">
          <div className={`h-3 w-full rounded-full ${theme === 'dark' ? 'bg-zinc-800' : 'bg-slate-100'}`} />
          <div className={`h-3 w-5/6 rounded-full ${theme === 'dark' ? 'bg-zinc-800' : 'bg-slate-100'}`} />
        </div>
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
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [leafletComponents, setLeafletComponents] = useState<ReactLeafletModule | null>(null);
  const [PlaceMarkerComponent, setPlaceMarkerComponent] = useState<PlaceMarkerComponentType | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let active = true;
    Promise.all([
      import('react-leaflet'),
      import('../features/map/Map/PlaceMarker'),
    ])
      .then(([leafletModule, placeMarkerModule]) => {
        if (!active) return;
        setLeafletComponents(leafletModule);
        setPlaceMarkerComponent(() => placeMarkerModule.default);
      })
      .catch((error) => {
        console.error('Failed to load map dependencies', error);
      });
    return () => {
      active = false;
    };
  }, []);

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
      <div className="grid auto-rows-[384px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
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

  // Use a ref for the initial center to prevent the MapContainer from re-rendering/re-mounting
  // when the user drags and updates the 'location' state.
  const initialCenter = useRef<[number, number] | null>(null);
  if (!initialCenter.current && location) {
    initialCenter.current = [location.latitude, location.longitude];
  }

  const defaultCenter: [number, number] = initialCenter.current || [41.0082, 28.9784];

  const MapContainer = leafletComponents?.MapContainer;
  const TileLayer = leafletComponents?.TileLayer;
  const useMapEvents = leafletComponents?.useMapEvents;
  const useMap = leafletComponents?.useMap;

  const renderMap = useMemo(() => {
    if (!MapContainer || !TileLayer || !useMapEvents || !useMap || !PlaceMarkerComponent) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 z-0 bg-gray-100 dark:bg-gray-900"
        />
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 z-0 bg-gray-100 dark:bg-gray-900"
      >
        <MapContainer
          key={`map-${theme}`}
          center={defaultCenter}
          zoom={13}
          minZoom={5}
          maxZoom={19}
          style={{
            width: '100%',
            height: '100%',
            background: theme === 'dark' ? '#030712' : '#f3f4f6'
          }}
          zoomControl={false}
          preferCanvas={true}
          className="z-0"
        >
          <TileLayer
            key={`tile-${theme}`}
            attribution='&copy; CARTO'
            url={theme === 'dark'
              ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
              : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'}
            keepBuffer={2}
          />
          <MapEventsHandler useMapEvents={useMapEvents} onMoveEnd={handleMapMove} />

          {filteredPlaces.map((place: Place) => (
            <PlaceMarkerComponent
              key={place.public_id}
              place={place}
              selected={selectedPlaceId === place.public_id}
              onClick={(p: Place) => {
                setSelectedPlaceId(p.public_id);
                navigate(`/places/${p.public_id}`, { state: { place: p } });
              }}
            />
          ))}

          <MapControls useMap={useMap} useMapEvents={useMapEvents} initialCenter={defaultCenter} initialZoom={13} theme={theme} />
        </MapContainer>
      </motion.div>
    );
  }, [theme, filteredPlaces, selectedPlaceId, handleMapMove, navigate, defaultCenter, MapContainer, TileLayer, useMapEvents, useMap, PlaceMarkerComponent]);

  const renderContent = () => {
    if (loadingInitial && places.length === 0) {
      return (
        <div className="grid auto-rows-[384px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
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
      <div className="relative z-10 h-full overflow-y-auto skyline-page-scroll">
        <div className={`flex flex-col px-1 pt-24 md:px-2 md:pt-28 ${
          viewMode === 'map' ? 'pointer-events-none min-h-full' : 'min-h-full'
        }`}>

        <div className="pointer-events-auto z-50 mx-auto w-full max-w-7xl px-1 md:px-2 lg:hidden">
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative space-y-2"
          >

            {/* ── View Mode Bar ──────────────────────────────────────────────── */}
            <div className={`flex items-center gap-2 ${
              viewMode === 'map'
                ? isDark
                  ? 'cv-card-surface-soft rounded-[20px] border border-white/10 px-2 backdrop-blur-3xl h-12 shadow-[0_18px_60px_-42px_rgba(0,0,0,0.9)]'
                  : 'rounded-[20px] border border-white/70 bg-white/80 px-2 backdrop-blur-3xl h-12 shadow-[0_12px_40px_-20px_rgba(15,23,42,0.18)]'
                : isDark
                  ? 'border-b border-white/10 pb-2'
                  : 'border-b border-slate-200/80 pb-2'
            }`}>

              {/* Segmented view switcher */}
              <div className={`relative flex items-center gap-0.5 rounded-full p-1 ${
                isDark ? 'bg-white/[0.04]' : 'bg-slate-100/90'
              }`}>
                {(['grid', 'map'] as const).map((mode) => {
                  const isActive = viewMode === mode;
                  const Icon = mode === 'grid' ? Grid : MapIcon;
                  const label = mode === 'grid' ? t('nearby.view_grid') : t('nearby.view_map');
                  return (
                    <motion.button
                      key={mode}
                      type="button"
                      onClick={() => setViewMode(mode)}
                      whileTap={{ scale: 0.96 }}
                      className={`relative flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[10px] font-black uppercase tracking-[0.14em] transition-colors ${
                        isActive
                          ? 'text-white'
                          : isDark
                            ? 'text-zinc-500 hover:text-white'
                            : 'text-slate-400 hover:text-slate-900'
                      }`}
                      title={label}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="placesViewIndicator"
                          className="absolute inset-0 rounded-full bg-sky-600 shadow-lg shadow-sky-600/30"
                          transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{label}</span>
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Right-side status chips */}
              <div className="ml-auto flex shrink-0 items-center gap-2">
                {searchQuery && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`hidden h-8 min-w-0 items-center gap-2 rounded-full px-3 text-[10px] font-black uppercase tracking-[0.12em] md:flex ${
                      isDark ? 'bg-white/[0.04] text-zinc-400' : 'bg-white/80 text-slate-500 shadow-sm border border-slate-200/60'
                    }`}
                  >
                    <Search className="h-3 w-3 shrink-0" />
                    <span className="max-w-[140px] truncate md:max-w-[200px]">{searchQuery}</span>
                  </motion.div>
                )}

                <div className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[10px] font-black uppercase tracking-[0.14em] ${
                  isDark ? 'bg-white/[0.04] text-zinc-400' : 'bg-white/80 text-slate-500 shadow-sm border border-slate-200/60'
                }`}>
                  <MapPin className="h-3 w-3" />
                  <span>{filteredPlaces.length}</span>
                </div>
              </div>

              {/* Refresh button */}
              <motion.button
                type="button"
                onClick={handleInitialFetch}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                disabled={loadingInitial}
                aria-label={t('places.retry')}
                title={t('places.retry')}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all disabled:cursor-default disabled:opacity-50 ${
                  isDark
                    ? 'bg-white/10 text-white hover:bg-white/20'
                    : 'bg-slate-950/90 text-white hover:bg-slate-800'
                }`}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingInitial && places.length === 0 ? 'animate-spin' : ''}`} />
              </motion.button>
            </div>

            {/* ── Category Tags ──────────────────────────────────────────────── */}
            {categories.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                className={`flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5 ${
                  viewMode === 'map'
                    ? isDark
                      ? 'rounded-2xl border border-white/8 bg-black/40 px-2 py-1.5 backdrop-blur-2xl'
                      : 'rounded-2xl border border-white/60 bg-white/75 px-2 py-1.5 backdrop-blur-2xl shadow-sm'
                    : ''
                }`}
              >
                {categories.map((cat: any) => {
                  const isAll = cat === 'all';
                  const isSelected = selectedCategory === cat;
                  const label = isAll ? (t('places.all_categories') || 'Tümü') : `#${cat}`;
                  return (
                    <motion.button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      whileTap={{ scale: 0.95 }}
                      className={`relative h-8 whitespace-nowrap rounded-full px-3.5 text-[10px] font-black uppercase tracking-[0.14em] transition-colors ${
                        isSelected
                          ? 'text-white'
                          : isDark
                            ? 'text-zinc-500 hover:text-white'
                            : 'text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      {isSelected && (
                        <motion.span
                          layoutId="placesCategoryIndicator"
                          className="absolute inset-0 rounded-full bg-sky-600 shadow-md shadow-sky-600/30"
                          transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                        />
                      )}
                      <span className="relative z-10">{label}</span>
                    </motion.button>
                  );
                })}
              </motion.div>
            )}
          </motion.section>
        </div>

        {/* Content Area */}
        {viewMode !== 'map' && (
          <div className="pointer-events-auto mx-auto w-full max-w-7xl px-0 pt-4 md:px-1">
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
