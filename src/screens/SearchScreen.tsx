import AnimatedEmptyState from '@/components/ui/AnimatedEmptyState';
import ViewTabs from '@/components/ui/ViewTabs';
import React, { useCallback, useEffect, useMemo, useRef, useState, startTransition } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowUpRight,
  Calendar,
  Loader2,
  MapPin,
  MessageCircle,
  Search,
  Users,
  Users2,
  X,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useSEO } from '../hooks/useSEO';
import { useLocation, useNavigate } from '@/router';
import { api, type GlobalSearchResponse, type GlobalSearchScope } from '../services/api';
import { CoolVibesPostCard, PostSkeleton } from '../features/post/Flows';
import type { ApiPost } from '../features/post/Post';
import PlaceCard from '../features/discovery/PlaceCard';
import { UserCard } from '../features/profile/UserCard';
import ChatAvatarImage from '../features/chat/ChatAvatarImage';
import { getPublicGroupImage, type PublicGroupPreview } from '../features/chat/groupChatItem';
import {
  getLocalizedContent,
  htmlToPlainText,
} from '../helpers/helpers';

type SearchFilter = 'all' | 'people' | 'events' | 'posts' | 'locations' | 'groups';
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
  groups: [],
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
  groups: Array.isArray(response?.groups) ? response.groups : [],
});

const SECTION_PREVIEW_LIMIT: Record<ResultType, number> = {
  people: 6,
  locations: 4,
  posts: 3,
  events: 4,
  groups: 4,
};

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
        startTransition(() => {
          setResponse(normalizeResponse(nextResponse));
          setIsSearching(false);
        });
      } catch (requestError: unknown) {
        if (cancelled) return;
        const message = requestError instanceof Error
          ? requestError.message
          : t('search.load_failed', { defaultValue: 'Search could not be completed. Please try again.' });
        setResponse(EMPTY_RESPONSE);
        setError(message);
        setIsSearching(false);
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
    { id: 'groups' as const, label: t('search.filters.groups', { defaultValue: 'Groups' }), icon: Users2 },
    { id: 'events' as const, label: t('search.filters.events', { defaultValue: 'Events' }), icon: Calendar },
    { id: 'posts' as const, label: t('search.filters.posts', { defaultValue: 'Posts' }), icon: MessageCircle },
    { id: 'locations' as const, label: t('search.filters.locations', { defaultValue: 'Places' }), icon: MapPin },
  ], [t]);

  const grouped = useMemo<Record<ResultType, SearchItem[]>>(() => {
    const groups: Record<ResultType, SearchItem[]> = {
      people: [],
      events: [],
      posts: [],
      locations: [],
      groups: [],
    };

    (response.users || []).forEach((user, index) => {
      const data = asRecord(user) || {};
      groups.people.push({ id: `people-${recordId(data, String(index))}`, type: 'people', data });
    });
    (response.groups || []).forEach((group, index) => {
      const data = asRecord(group) || {};
      groups.groups.push({ id: `groups-${recordId(data, String(index))}`, type: 'groups', data });
    });
    (response.events || []).forEach((event, index) => {
      const data = asRecord(event) || {};
      groups.events.push({ id: `events-${recordId(data, String(index))}`, type: 'events', data });
    });
    (response.posts || []).forEach((post, index) => {
      const data = asRecord(post) || {};
      groups.posts.push({ id: `posts-${recordId(data, String(index))}`, type: 'posts', data });
    });
    (response.places || []).forEach((place, index) => {
      const data = asRecord(place) || {};
      groups.locations.push({ id: `locations-${recordId(data, String(index))}`, type: 'locations', data });
    });

    return groups;
  }, [response]);

  const items = useMemo<SearchItem[]>(() => {
    if (activeFilter === 'all') {
      return [...grouped.people, ...grouped.groups, ...grouped.events, ...grouped.posts, ...grouped.locations];
    }
    if (activeFilter === 'locations') return grouped.locations;
    return grouped[activeFilter];
  }, [activeFilter, grouped]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setResponse(EMPTY_RESPONSE);
    setError(null);
    navigate('/search', { replace: true });
    searchInputRef.current?.focus();
  }, [navigate]);

  const submitSearch = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = searchQuery.trim();
    navigate(value ? `/search?q=${encodeURIComponent(value)}` : '/search', { replace: true });
    searchInputRef.current?.blur();
  }, [navigate, searchQuery]);

  const openResult = useCallback((item: SearchItem) => {
    if (item.type === 'people') {
      const username = getString(item.data, 'username');
      if (username) navigate(`/${encodeURIComponent(username)}`);
      return;
    }

    if (item.type === 'groups') {
      const username = getString(item.data, 'public_username');
      if (username) navigate(`/group/${encodeURIComponent(username)}`);
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

  const renderEventCard = (item: SearchItem) => {
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
      <article
        key={item.id}
        role="button"
        tabIndex={0}
        onClick={() => openResult(item)}
        onKeyDown={(event) => handleResultKeyDown(event, item)}
        className={`group flex cursor-pointer gap-4 rounded-xl border p-4 transition-colors ${
          isDark
            ? 'cv-card-surface-solid border-white/10 hover:bg-[var(--cv-list-hover)]'
            : 'border-gray-100 bg-white hover:bg-[var(--cv-list-hover)]'
        }`}
      >
        <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-[18px] ${isDark ? 'bg-fuchsia-500/15 text-fuchsia-300' : 'bg-fuchsia-50 text-fuchsia-600'}`}>
          <Calendar className="h-7 w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <h3 className={`min-w-0 flex-1 truncate text-[0.882rem] font-bold ${textColor}`}>{title}</h3>
            <ArrowUpRight className={`h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${secondaryTextColor}`} />
          </div>
          {startTime && <p className="mt-1 text-[0.765rem] font-bold text-fuchsia-500">{formatDate(startTime, i18n.language)}</p>}
          {locationText && (
            <p className={`mt-1 flex items-center gap-1 truncate text-[0.765rem] ${secondaryTextColor}`}>
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {locationText}
            </p>
          )}
          {description && <p className={`mt-2 line-clamp-2 text-[0.765rem] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{description}</p>}
        </div>
      </article>
    );
  };

  const renderGroupCard = (item: SearchItem) => {
    const group = item.data as unknown as PublicGroupPreview;
    const title = localizedText(item.data.title, language) || t('messages.groups');
    const description = localizedText(item.data.description, language);
    const memberCount = Number(item.data.member_count) || 0;
    const avatar = group.id ? getPublicGroupImage(group) : null;

    return (
      <article
        key={item.id}
        role="button"
        tabIndex={0}
        onClick={() => openResult(item)}
        onKeyDown={(event) => handleResultKeyDown(event, item)}
        className={`group flex cursor-pointer gap-4 rounded-xl border p-4 transition-colors ${
          isDark
            ? 'cv-card-surface-solid border-white/10 hover:bg-[var(--cv-list-hover)]'
            : 'border-gray-100 bg-white hover:bg-[var(--cv-list-hover)]'
        }`}
      >
        <div className={`flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[18px] ${isDark ? 'bg-sky-500/15 text-sky-300' : 'bg-sky-50 text-sky-600'}`}>
          {avatar ? <ChatAvatarImage protectedMedia src={avatar} alt="" className="h-full w-full object-cover" /> : <Users2 className="h-7 w-7" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <h3 className={`min-w-0 flex-1 truncate text-[0.882rem] font-bold ${textColor}`}>{title}</h3>
            <ArrowUpRight className={`h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${secondaryTextColor}`} />
          </div>
          <p className="mt-1 text-[0.765rem] font-bold text-sky-500">{t('chat_actions.member_count', { count: memberCount })}</p>
          {description && <p className={`mt-2 line-clamp-2 text-[0.765rem] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{description}</p>}
        </div>
      </article>
    );
  };

  const renderPeopleGrid = (people: SearchItem[]) => (
    <div className="cv-people-grid">
      {people.map((item) => (
        <UserCard
          key={item.id}
          user={item.data as any}
          viewMode="compact"
        />
      ))}
    </div>
  );

  const renderPlacesGrid = (places: SearchItem[]) => (
    <div className="grid auto-rows-[384px] grid-cols-1 gap-4 sm:grid-cols-2">
      {places.map((item) => (
        <PlaceCard
          key={item.id}
          place={item.data as any}
          selected={false}
          className="h-full"
          onClick={(place) => {
            const publicId = recordId(asRecord(place) || {}, '');
            if (publicId) navigate(`/places/${encodeURIComponent(publicId)}`, { state: { place } });
          }}
        />
      ))}
    </div>
  );

  const renderPostsList = (posts: SearchItem[]) => (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-3">
      {posts.map((item) => (
        <CoolVibesPostCard
          key={item.id}
          post={item.data as unknown as ApiPost}
          onPostClick={() => openResult(item)}
          onProfileClick={openProfile}
        />
      ))}
    </div>
  );

  const renderEventsList = (events: SearchItem[]) => (
    <div className="flex flex-col gap-2.5">
      {events.map((item) => renderEventCard(item))}
    </div>
  );

  const renderGroupsList = (groups: SearchItem[]) => (
    <div className="flex flex-col gap-2.5">
      {groups.map((item) => renderGroupCard(item))}
    </div>
  );

  const renderSectionHeader = (filterId: SearchFilter, count: number, showAll: boolean) => {
    const filter = filters.find((entry) => entry.id === filterId);
    if (!filter || count === 0) return null;
    return (
      <div className="flex items-center justify-between gap-2 px-1 pb-2 pt-1">
        <span className={`text-[0.765rem] font-semibold normal-case tracking-normal ${secondaryTextColor}`}>
          {filter.label} · {count}
        </span>
        {showAll && (
          <button
            type="button"
            onClick={() => startTransition(() => setActiveFilter(filterId))}
            className="flex shrink-0 items-center gap-0.5 text-[0.765rem] font-bold text-[var(--color-brand)] transition-opacity hover:opacity-80"
          >
            {t('search.show_all', { defaultValue: 'Show all' })}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  };

  const renderSkeletons = () => {
    if (activeFilter === 'posts') {
      return (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-3">
          {[0, 1].map((index) => (
            <PostSkeleton key={index} theme={isDark ? 'dark' : 'light'} />
          ))}
        </div>
      );
    }
    if (activeFilter === 'people') {
      return (
        <div className="cv-people-grid">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className={`aspect-[3/4] animate-pulse rounded-xl border ${isDark ? 'border-white/10 bg-white/[0.04]' : 'border-gray-100 bg-gray-50'}`}
            />
          ))}
        </div>
      );
    }
    if (activeFilter === 'locations') {
      return (
        <div className="grid auto-rows-[384px] grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className={`h-full animate-pulse rounded-2xl border p-1 ${isDark ? 'border-white/10 bg-white/[0.04]' : 'border-gray-100 bg-gray-50'}`}
            >
              <div className={`h-[220px] w-full rounded-xl ${isDark ? 'bg-white/[0.06]' : 'bg-gray-100'}`} />
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className={`h-[112px] animate-pulse rounded-xl border ${isDark ? 'border-white/10 bg-white/[0.04]' : 'border-gray-100 bg-gray-50'}`}
          />
        ))}
      </div>
    );
  };

  const renderFilteredResults = () => {
    if (activeFilter === 'people') return renderPeopleGrid(grouped.people);
    if (activeFilter === 'locations') return renderPlacesGrid(grouped.locations);
    if (activeFilter === 'posts') return renderPostsList(grouped.posts);
    if (activeFilter === 'groups') return renderGroupsList(grouped.groups);
    return renderEventsList(grouped.events);
  };

  const renderAllSections = () => {
    const sections: { id: ResultType; count: number; node: React.ReactNode }[] = [
      {
        id: 'people' as ResultType,
        count: grouped.people.length,
        node: renderPeopleGrid(grouped.people.slice(0, SECTION_PREVIEW_LIMIT.people)),
      },
      {
        id: 'groups' as ResultType,
        count: grouped.groups.length,
        node: renderGroupsList(grouped.groups.slice(0, SECTION_PREVIEW_LIMIT.groups)),
      },
      {
        id: 'locations' as ResultType,
        count: grouped.locations.length,
        node: renderPlacesGrid(grouped.locations.slice(0, SECTION_PREVIEW_LIMIT.locations)),
      },
      {
        id: 'posts' as ResultType,
        count: grouped.posts.length,
        node: renderPostsList(grouped.posts.slice(0, SECTION_PREVIEW_LIMIT.posts)),
      },
      {
        id: 'events' as ResultType,
        count: grouped.events.length,
        node: renderEventsList(grouped.events.slice(0, SECTION_PREVIEW_LIMIT.events)),
      },
    ].filter((section) => section.count > 0);

    return (
      <div className="flex flex-col gap-6">
        {sections.map((section) => (
          <section key={section.id}>
            {renderSectionHeader(section.id, section.count, section.count > SECTION_PREVIEW_LIMIT[section.id])}
            {section.node}
          </section>
        ))}
      </div>
    );
  };

  const renderContent = () => {
    if (isSearching && items.length === 0) {
      return renderSkeletons();
    }

    if (!isSearching && error) {
      return (
        <div className={`mx-auto flex max-w-xl flex-col items-center rounded-2xl border p-8 text-center ${isDark ? 'cv-card-surface-solid border-white/10' : 'border-gray-200/50 bg-white'}`} role="alert">
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
      );
    }

    if (!isSearching && trimmedQuery.length < 2) {
      return (
        <div className="flex flex-col items-center justify-center px-8 py-24 text-center">
          <div className={`flex h-16 w-16 items-center justify-center rounded-[22px] ${isDark ? 'cv-card-surface-muted' : 'bg-gray-50'}`}>
            <Search className={`h-8 w-8 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} strokeWidth={1.5} />
          </div>
          <h2 className={`mt-5 text-[1.0rem] font-bold ${textColor}`}>{t('search.start_title', { defaultValue: 'Find your community' })}</h2>
          <p className={`mt-2 max-w-sm text-[0.824rem] leading-relaxed ${secondaryTextColor}`}>
            {t('search.start_subtitle', { defaultValue: 'Enter at least two characters to search people, events, posts and places.' })}
          </p>
        </div>
      );
    }

    if (!isSearching && items.length === 0) {
      return <AnimatedEmptyState title={t('search.no_results')} description={t('search.no_results_subtitle')} />;
    }

    if (items.length === 0) return null;

    return activeFilter === 'all' ? renderAllSections() : renderFilteredResults();
  };

  return (
    <motion.div
      className="relative h-full w-full overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="skyline-page-scroll relative z-10 h-full overflow-y-auto">
        <div className="flex min-h-full flex-col px-1 md:px-2">
          <div className="pointer-events-auto z-50 mx-auto w-full max-w-7xl">
            <section className="relative">
              <div className="cv-tab-bar cv-tab-bar--top -mx-1 md:-mx-2">
                <ViewTabs items={filters.map(({ icon: Icon, ...item }) => ({ ...item, icon: <Icon /> }))} activeId={activeFilter} onSelect={id => setActiveFilter(id)} label={t('app.nav.search')} />
              </div>

              <div className="flex min-h-[44px] items-center gap-2 px-1 pb-3 pt-3 md:px-2">
                <form
                  onSubmit={submitSearch}
                  className="cv-global-search flex min-w-0 flex-1 items-center gap-2 rounded-full bg-[var(--cv-surface-3)] px-3.5"
                >
                  <Search className="h-3.5 w-3.5 shrink-0 text-[var(--cv-neutral-2)]" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    autoComplete="off"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={t('search.placeholder', { defaultValue: 'Search people, posts, events or places...' })}
                    aria-label={t('search.placeholder', { defaultValue: 'Search people, posts, events or places...' })}
                    className="min-w-0 flex-1 bg-transparent text-[0.765rem] font-semibold text-[var(--cv-neutral-1)] outline-none placeholder:text-[var(--cv-neutral-2)] placeholder:opacity-60"
                  />
                  {isSearching ? (
                    <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[var(--cv-neutral-2)]" />
                  ) : searchQuery ? (
                    <button
                      type="button"
                      onClick={clearSearch}
                      aria-label={t('search.clear', { defaultValue: 'Clear search' })}
                      className="flex shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-70"
                    >
                      <X className="h-3.5 w-3.5 text-[var(--cv-neutral-2)]" />
                    </button>
                  ) : null}
                </form>
                <span className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[var(--color-brand-light-solid)] px-3.5 text-[0.765rem] font-semibold text-[var(--color-brand)]">
                  <Search className="h-3.5 w-3.5 shrink-0" />
                  {items.length}
                </span>
              </div>
            </section>
          </div>

          <div className="pointer-events-auto mx-auto w-full max-w-7xl flex-1 px-0 pb-8 pt-2 md:px-1">
            {renderContent()}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SearchScreen;
