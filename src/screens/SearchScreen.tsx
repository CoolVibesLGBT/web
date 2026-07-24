import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowUpRight,
  Calendar,
  Loader2,
  MapPin,
  MessageCircle,
  Search,
  Users,
  X,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useSEO } from '../hooks/useSEO';
import { useLocation, useNavigate } from '@/router';
import { api, type GlobalSearchResponse, type GlobalSearchScope } from '../services/api';
import { CoolVibesPostCard, FlowMasonryItem, isWideMediaPost } from '../features/post/Flows';
import type { ApiPost } from '../features/post/Post';
import {
  generateFallbackImage,
  generatePlaceImage,
  getLocalizedContent,
  getSafeImageURLEx,
  htmlToPlainText,
} from '../helpers/helpers';

type SearchFilter = 'all' | 'people' | 'events' | 'posts' | 'locations';
type ResultType = Exclude<SearchFilter, 'all' | 'locations'> | 'locations';
type SearchRecord = Record<string, unknown>;

interface SearchItem {
  id: string;
  type: ResultType;
  data: SearchRecord;
}

const EMPTY_RESPONSE: GlobalSearchResponse = {
  query: '',
  users: [],
  events: [],
  posts: [],
  places: [],
};

const asRecord = (value: unknown): SearchRecord | null => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as SearchRecord;
  }

  if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? parsed as SearchRecord
        : null;
    } catch {
      return null;
    }
  }

  return null;
};

const asString = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'bigint') return String(value);
  return '';
};

const getString = (record: SearchRecord | null | undefined, key: string): string => (
  asString(record?.[key])
);

const getRecord = (record: SearchRecord | null | undefined, key: string): SearchRecord | null => (
  asRecord(record?.[key])
);

const localizedText = (value: unknown, language: string): string => {
  if (typeof value === 'string') return htmlToPlainText(value);
  const record = asRecord(value);
  if (!record) return '';
  const localized = getLocalizedContent(record, language);
  return htmlToPlainText(asString(localized));
};

const recordId = (record: SearchRecord, fallback: string): string => (
  getString(record, 'public_id') || getString(record, 'id') || fallback
);

const formatDate = (value: unknown, language: string): string => {
  const raw = asString(value);
  if (!raw) return '';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return '';

  try {
    return new Intl.DateTimeFormat(language || 'en', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
};

const normalizeResponse = (response: GlobalSearchResponse | null | undefined): GlobalSearchResponse => ({
  query: asString(response?.query),
  users: Array.isArray(response?.users) ? response.users : [],
  events: Array.isArray(response?.events) ? response.events : [],
  posts: Array.isArray(response?.posts) ? response.posts : [],
  places: Array.isArray(response?.places) ? response.places : [],
});

const getPlaceData = (record: SearchRecord): SearchRecord => (
  getRecord(getRecord(record, 'extras'), 'place') || {}
);

const SearchScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation('common');
  const location = useLocation();
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<SearchFilter>('all');
  const [response, setResponse] = useState<GlobalSearchResponse>(EMPTY_RESPONSE);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);

  const language = (i18n.language || 'en').split('-')[0];
  const isDark = theme === 'dark';
  const textColor = isDark ? 'text-white' : 'text-gray-900';
  const secondaryTextColor = isDark ? 'text-gray-400' : 'text-gray-600';

  useSEO({
    title: 'Search',
    description: 'Search for people, events, posts and LGBTQ+ places on CoolVibes.',
    canonical: '/search',
    noindex: true,
  });

  const queryFromUrl = useMemo(() => {
    const params = new URLSearchParams(location.search || '');
    return params.get('q') || params.get('query') || '';
  }, [location.search]);

  useEffect(() => {
    setSearchQuery(queryFromUrl);
  }, [queryFromUrl]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleHeaderQuery = (event: Event) => {
      const query = (event as CustomEvent<{ query?: string }>).detail?.query ?? '';
      setSearchQuery(query);
    };

    window.addEventListener('cv:search-query', handleHeaderQuery);
    return () => window.removeEventListener('cv:search-query', handleHeaderQuery);
  }, []);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const scope: GlobalSearchScope = activeFilter === 'locations' ? 'places' : activeFilter;
  const trimmedQuery = searchQuery.trim();

  useEffect(() => {
    let cancelled = false;

    if (trimmedQuery.length < 2) {
      setResponse(EMPTY_RESPONSE);
      setError(null);
      setIsSearching(false);
      return undefined;
    }

    setIsSearching(true);
    setError(null);

    const timeoutId = window.setTimeout(async () => {
      try {
        const nextResponse = await api.searchGlobal({
          query: trimmedQuery,
          scope,
          limit: 12,
        });
        if (cancelled) return;
        setResponse(normalizeResponse(nextResponse));
      } catch (requestError: unknown) {
        if (cancelled) return;
        const message = requestError instanceof Error
          ? requestError.message
          : t('search.load_failed', { defaultValue: 'Search could not be completed. Please try again.' });
        setResponse(EMPTY_RESPONSE);
        setError(message);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 280);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [retryNonce, scope, t, trimmedQuery]);

  const filters = useMemo(() => [
    { id: 'all' as const, label: t('search.filters.all', { defaultValue: 'All' }), icon: Search },
    { id: 'people' as const, label: t('search.filters.people', { defaultValue: 'People' }), icon: Users },
    { id: 'events' as const, label: t('search.filters.events', { defaultValue: 'Events' }), icon: Calendar },
    { id: 'posts' as const, label: t('search.filters.posts', { defaultValue: 'Posts' }), icon: MessageCircle },
    { id: 'locations' as const, label: t('search.filters.locations', { defaultValue: 'Places' }), icon: MapPin },
  ], [t]);

  const items = useMemo<SearchItem[]>(() => {
    const nextItems: SearchItem[] = [];

    if (activeFilter === 'all' || activeFilter === 'people') {
      (response.users || []).forEach((user, index) => {
        const data = asRecord(user) || {};
        nextItems.push({ id: `people-${recordId(data, String(index))}`, type: 'people', data });
      });
    }
    if (activeFilter === 'all' || activeFilter === 'events') {
      (response.events || []).forEach((event, index) => {
        const data = asRecord(event) || {};
        nextItems.push({ id: `events-${recordId(data, String(index))}`, type: 'events', data });
      });
    }
    if (activeFilter === 'all' || activeFilter === 'posts') {
      (response.posts || []).forEach((post, index) => {
        const data = asRecord(post) || {};
        nextItems.push({ id: `posts-${recordId(data, String(index))}`, type: 'posts', data });
      });
    }
    if (activeFilter === 'all' || activeFilter === 'locations') {
      (response.places || []).forEach((place, index) => {
        const data = asRecord(place) || {};
        nextItems.push({ id: `locations-${recordId(data, String(index))}`, type: 'locations', data });
      });
    }

    return nextItems;
  }, [activeFilter, response]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setResponse(EMPTY_RESPONSE);
    setError(null);
    navigate('/search', { replace: true });
  }, [navigate]);

  const submitSearch = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = searchQuery.trim();
    navigate(value ? `/search?q=${encodeURIComponent(value)}` : '/search', { replace: true });
    searchInputRef.current?.focus();
  }, [navigate, searchQuery]);

  const openResult = useCallback((item: SearchItem) => {
    if (item.type === 'people') {
      const username = getString(item.data, 'username');
      if (username) navigate(`/${encodeURIComponent(username)}`);
      return;
    }

    const publicId = recordId(item.data, '');
    if (!publicId) return;

    if (item.type === 'locations') {
      navigate(`/places/${encodeURIComponent(publicId)}`, { state: { place: item.data } });
      return;
    }

    const author = getRecord(item.data, 'author');
    const username = getString(author, 'username');
    const path = username
      ? `/${encodeURIComponent(username)}/status/${encodeURIComponent(publicId)}`
      : `/status/${encodeURIComponent(publicId)}`;
    navigate(path);
  }, [navigate]);

  const openProfile = useCallback((username: string) => {
    if (username) navigate(`/${encodeURIComponent(username)}`);
  }, [navigate]);

  const handleResultKeyDown = useCallback((event: React.KeyboardEvent<HTMLElement>, item: SearchItem) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openResult(item);
    }
  }, [openResult]);

  const renderResult = (item: SearchItem) => {
    const id = recordId(item.data, item.id);
    const cardClass = `group rounded-[24px] border p-4 transition-all duration-200 ${
      isDark
        ? 'cv-card-surface-solid border-white/10 hover:bg-white/[0.06]'
        : 'border-gray-100 bg-white shadow-sm hover:bg-gray-50'
    }`;

    if (item.type === 'people') {
      const username = getString(item.data, 'username');
      const displayName = getString(item.data, 'displayname') || username || t('search.unknown_user', { defaultValue: 'CoolVibes member' });
      const bio = localizedText(item.data.bio, language);
      const avatar = getSafeImageURLEx(id, item.data.avatar, 'medium') || generateFallbackImage(id);
      const locationRecord = getRecord(item.data, 'location');
      const locationText = getString(locationRecord, 'display') || getString(locationRecord, 'city');

      return (
        <motion.article
          key={item.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          role="button"
          tabIndex={0}
          onClick={() => openResult(item)}
          onKeyDown={(event) => handleResultKeyDown(event, item)}
          className={cardClass}
        >
          <div className="flex items-center gap-4">
            <img
              src={avatar}
              alt={displayName}
              loading="lazy"
              className={`h-16 w-16 shrink-0 rounded-[20px] object-cover ring-2 ${isDark ? 'ring-white/10' : 'ring-gray-100'}`}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className={`truncate text-[16px] font-bold ${textColor}`}>{displayName}</h3>
                {(item.data.is_verified === true || item.data.verified === true) && (
                  <span className="rounded-full bg-sky-500 px-1.5 py-0.5 text-[9px] font-black text-white">✓</span>
                )}
              </div>
              {username && <p className={`mt-0.5 truncate text-[13px] font-medium ${secondaryTextColor}`}>@{username}</p>}
              {(bio || locationText) && (
                <p className={`mt-1 line-clamp-2 text-[13px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {bio || locationText}
                </p>
              )}
            </div>
            <ArrowUpRight className={`h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${secondaryTextColor}`} />
          </div>
        </motion.article>
      );
    }

    if (item.type === 'events') {
      const event = getRecord(item.data, 'event') || item.data;
      const title = localizedText(event.title, language)
        || localizedText(item.data.title, language)
        || t('search.untitled_event', { defaultValue: 'Untitled event' });
      const description = localizedText(event.description, language) || localizedText(item.data.content, language);
      const startTime = getString(event, 'start_time') || getString(item.data, 'start_time');
      const eventLocation = getRecord(event, 'location') || getRecord(item.data, 'location');
      const locationText = [
        getString(eventLocation, 'address'),
        getString(eventLocation, 'city') || getString(eventLocation, 'town'),
        getString(eventLocation, 'country'),
      ].filter(Boolean).join(', ');

      return (
        <motion.article
          key={item.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          role="button"
          tabIndex={0}
          onClick={() => openResult(item)}
          onKeyDown={(event) => handleResultKeyDown(event, item)}
          className={cardClass}
        >
          <div className="flex gap-4">
            <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-[18px] ${isDark ? 'bg-fuchsia-500/15 text-fuchsia-300' : 'bg-fuchsia-50 text-fuchsia-600'}`}>
              <Calendar className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-3">
                <h3 className={`min-w-0 flex-1 truncate text-[16px] font-bold ${textColor}`}>{title}</h3>
                <ArrowUpRight className={`h-4 w-4 shrink-0 ${secondaryTextColor}`} />
              </div>
              {startTime && <p className="mt-1 text-[12px] font-bold text-fuchsia-500">{formatDate(startTime, i18n.language)}</p>}
              {locationText && (
                <p className={`mt-1 flex items-center gap-1 truncate text-[12px] ${secondaryTextColor}`}>
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {locationText}
                </p>
              )}
              {description && <p className={`mt-2 line-clamp-2 text-[13px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{description}</p>}
            </div>
          </div>
        </motion.article>
      );
    }

    if (item.type === 'posts') {
      return (
        <CoolVibesPostCard
          key={item.id}
          post={item.data as unknown as ApiPost}
          onPostClick={() => openResult(item)}
          onProfileClick={openProfile}
        />
      );
    }

    const place = getPlaceData(item.data);
    const placeName = getString(place, 'name') || localizedText(item.data.title, language) || t('search.untitled_place', { defaultValue: 'Untitled place' });
    const address = [
      getString(place, 'address'),
      getString(place, 'town') || getString(place, 'city'),
      getString(place, 'province'),
      getString(place, 'country'),
    ].filter(Boolean).join(', ');
    const placeImage = getString(place, 'image') || getSafeImageURLEx(id, item.data.attachments, 'medium') || generatePlaceImage(id);

    return (
      <motion.article
        key={item.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        role="button"
        tabIndex={0}
        onClick={() => openResult(item)}
        onKeyDown={(event) => handleResultKeyDown(event, item)}
        className={cardClass}
      >
        <div className="flex gap-4">
          <img src={placeImage} alt={placeName} loading="lazy" className="h-20 w-20 shrink-0 rounded-[18px] object-cover" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-3">
              <h3 className={`min-w-0 flex-1 truncate text-[16px] font-bold ${textColor}`}>{placeName}</h3>
              <ArrowUpRight className={`h-4 w-4 shrink-0 ${secondaryTextColor}`} />
            </div>
            {address && <p className={`mt-1 line-clamp-2 text-[13px] ${secondaryTextColor}`}>{address}</p>}
            <p className={`mt-2 flex items-center gap-1 text-[12px] font-semibold ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`}>
              <MapPin className="h-3.5 w-3.5" />
              {t('search.open_place', { defaultValue: 'Open place details' })}
            </p>
          </div>
        </div>
      </motion.article>
    );
  };

  const panelClass = isDark ? 'cv-card-surface-soft border-white/10' : 'border-white/70 bg-white/75';

  return (
    <div className={`skyline-page-scroll w-full ${textColor}`}>
        <main className="mx-auto flex min-h-full w-full max-w-[1360px] flex-col gap-5 px-1 pb-8 pt-[88px] md:px-2 md:pt-24">
        <section className={`shrink-0 rounded-[30px] border backdrop-blur-3xl lg:self-center lg:w-fit lg:max-w-full ${panelClass} shadow-[0_28px_90px_-48px_rgba(15,23,42,0.55)]`}>
          <form onSubmit={submitSearch} className="flex items-center gap-2 px-4 pt-4">
            <div className="relative flex-1">
              <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${secondaryTextColor}`} />
              <input
                ref={searchInputRef}
                type="text"
                autoComplete="off"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t('search.placeholder', { defaultValue: 'Search people, posts, events or places...' })}
                aria-label={t('search.placeholder', { defaultValue: 'Search people, posts, events or places...' })}
                className="w-full bg-transparent py-2.5 pl-10 pr-10 text-[15px] outline-none placeholder:text-gray-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label={t('search.clear', { defaultValue: 'Clear search' })}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className={`hidden rounded-full px-4 py-2 text-xs font-bold sm:block ${isDark ? 'bg-white text-black' : 'bg-gray-900 text-white'}`}
            >
              {t('search.submit', { defaultValue: 'Search' })}
            </button>
          </form>

          <div className="overflow-x-auto px-4 pb-3 pt-2 scrollbar-hide">
            <div className="flex gap-1">
              {filters.map((filter) => {
                const Icon = filter.icon;
                const active = activeFilter === filter.id;
                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setActiveFilter(filter.id)}
                    className={`flex shrink-0 items-center gap-2 rounded-[14px] px-4 py-2 text-[13px] font-bold transition-all ${
                      active
                        ? (isDark ? 'bg-white text-black' : 'bg-gray-900 text-white')
                        : (isDark ? 'text-gray-400 hover:bg-white/[0.06] hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900')
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{filter.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="flex-1">
          {isSearching && (
            <div className="flex items-center justify-center gap-3 py-12" role="status" aria-live="polite">
              <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
              <span className={`text-sm font-medium ${secondaryTextColor}`}>
                {t('search.loading', { defaultValue: 'Searching...' })}
              </span>
            </div>
          )}

          {!isSearching && error && (
            <div className={`mx-auto flex max-w-xl flex-col items-center rounded-[24px] border p-8 text-center ${panelClass}`} role="alert">
              <AlertCircle className="h-8 w-8 text-rose-500" />
              <h2 className={`mt-3 text-base font-bold ${textColor}`}>{t('search.error_title', { defaultValue: 'Search failed' })}</h2>
              <p className={`mt-2 text-sm ${secondaryTextColor}`}>{error}</p>
              <button
                type="button"
                onClick={() => setRetryNonce((current) => current + 1)}
                className={`mt-5 rounded-full px-4 py-2 text-xs font-bold ${isDark ? 'bg-white text-black' : 'bg-gray-900 text-white'}`}
              >
                {t('search.retry', { defaultValue: 'Try again' })}
              </button>
            </div>
          )}

          {!isSearching && !error && trimmedQuery.length < 2 && (
            <div className="flex flex-col items-center justify-center px-8 py-24 text-center">
              <div className={`flex h-16 w-16 items-center justify-center rounded-[22px] ${isDark ? 'cv-card-surface-muted' : 'bg-gray-50'}`}>
                <Search className={`h-8 w-8 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} strokeWidth={1.5} />
              </div>
              <h2 className={`mt-5 text-[17px] font-bold ${textColor}`}>{t('search.start_title', { defaultValue: 'Find your community' })}</h2>
              <p className={`mt-2 max-w-sm text-[14px] leading-relaxed ${secondaryTextColor}`}>
                {t('search.start_subtitle', { defaultValue: 'Enter at least two characters to search people, events, posts and places.' })}
              </p>
            </div>
          )}

          {!isSearching && !error && trimmedQuery.length >= 2 && items.length === 0 && (
            <AnimatePresence mode="wait">
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center px-8 py-24 text-center"
              >
                <div className={`flex h-16 w-16 items-center justify-center rounded-[22px] ${isDark ? 'cv-card-surface-muted' : 'bg-gray-50'}`}>
                  <Search className={`h-8 w-8 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} strokeWidth={1.5} />
                </div>
                <h2 className={`mt-5 text-[17px] font-bold ${textColor}`}>{t('search.no_results', { defaultValue: 'No results found' })}</h2>
                <p className={`mt-2 max-w-sm text-[14px] leading-relaxed ${secondaryTextColor}`}>
                  {t('search.no_results_subtitle', { defaultValue: 'Try another search term or choose a different category.' })}
                </p>
              </motion.div>
            </AnimatePresence>
          )}

          {!isSearching && !error && items.length > 0 && (
            <div>
              <div className={`px-1 text-[11px] font-black uppercase tracking-[0.16em] ${secondaryTextColor}`}>
                {t('search.result_count', { defaultValue: '{{count}} results', count: items.length })}
              </div>
              <div className="flow-masonry px-1 pt-3">
                <AnimatePresence initial={false} mode="sync">
                  {items.map((item) => (
                    <FlowMasonryItem
                      key={item.id}
                      wide={item.type === 'posts' && isWideMediaPost(item.data as unknown as ApiPost)}
                    >
                      {renderResult(item)}
                    </FlowMasonryItem>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default SearchScreen;
