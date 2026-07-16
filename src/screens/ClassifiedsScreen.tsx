import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { UIEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from '@/router';
import {
  Search,
  X,
  Plus,
  Briefcase,
  Home,
  Building2,
  UserSearch,
  GraduationCap,
  PawPrint,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import CreatePost from '../features/post/CreatePost';
import { api } from '../services/api';
import { CoolVibesPostCard, PostSkeleton } from '../features/post/Flows';

const JOB_KIND = {
  offer: 'job_offer',
  search: 'job_search',
} as const;

type JobPostKind = typeof JOB_KIND[keyof typeof JOB_KIND];
type ClassifiedsTab = 'seeking' | 'hiring';

export default function ClassifiedsScreen() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('common');
  const dark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<ClassifiedsTab>('hiring');
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [postKind, setPostKind] = useState<JobPostKind>(JOB_KIND.offer);
  const [listingTitle, setListingTitle] = useState('');
  const [metadataKeyInput, setMetadataKeyInput] = useState('');
  const [metadataValueInput, setMetadataValueInput] = useState('');
  const [metadataItems, setMetadataItems] = useState<Array<{ key: string; value: string }>>([]);
  const [isMetadataEnabled, setIsMetadataEnabled] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const openCreateModal = useCallback((options?: { tab?: ClassifiedsTab; title?: string }) => {
    const resolvedTab = options?.tab ?? activeTab;
    const defaultKind = resolvedTab === 'hiring' ? JOB_KIND.offer : JOB_KIND.search;
    if (options?.tab) {
      setActiveTab(options.tab);
    }
    setPostKind(defaultKind);
    setListingTitle(options?.title ?? '');
    setMetadataKeyInput('');
    setMetadataValueInput('');
    setMetadataItems([]);
    setIsMetadataEnabled(true);
    setIsAddingTopic(true);
  }, [activeTab]);

  const closeCreateModal = useCallback(() => {
    setIsAddingTopic(false);
  }, []);

  useEffect(() => {
    const handleSearchQuery = (event: Event) => {
      const query = (event as CustomEvent<{ query?: string }>).detail?.query ?? '';
      setSearchQuery(query);
    };
    const handleOpenCreate = () => openCreateModal();

    window.addEventListener('cv:classifieds-search-query', handleSearchQuery);
    window.addEventListener('cv:classifieds-open-create', handleOpenCreate);

    return () => {
      window.removeEventListener('cv:classifieds-search-query', handleSearchQuery);
      window.removeEventListener('cv:classifieds-open-create', handleOpenCreate);
    };
  }, [openCreateModal]);

  const extractPosts = (response: unknown) => {
    const payload = response as any;
    const posts = payload?.posts ?? payload?.items ?? payload?.data ?? [];
    return Array.isArray(posts) ? posts : [];
  };

  const resolveCursor = (response: unknown) => {
    const payload = response as any;
    const rawCursor = payload?.cursor ?? payload?.next_cursor ?? payload?.nextCursor ?? null;
    if (rawCursor === null || rawCursor === undefined) return '';
    return String(rawCursor);
  };

  const computeHasMore = (cursorValue: string) => (
    cursorValue !== '' &&
    cursorValue !== '0' &&
    cursorValue !== 'null' &&
    cursorValue !== 'undefined'
  );

  const fetchClassifieds = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = activeTab === 'hiring'
        ? await api.fetchJobOffers({ limit: 20 })
        : await api.fetchJobSearches({ limit: 20 });
      const incomingPosts = extractPosts(response);
      const cursorValue = resolveCursor(response);
      const hasMorePosts = computeHasMore(cursorValue);
      setPosts(incomingPosts);
      setCursor(hasMorePosts ? cursorValue : null);
      setHasMore(hasMorePosts);
    } catch (err) {
      console.error('Error fetching classifieds:', err);
      setError(t('classifieds.fetch_error', { defaultValue: 'İlanlar yüklenemedi. Lütfen tekrar deneyin.' }));
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, t]);

  const loadMoreClassifieds = useCallback(async () => {
    if (isLoadingMore || isLoading || !hasMore || !cursor) return;
    try {
      setIsLoadingMore(true);
      const response = activeTab === 'hiring'
        ? await api.fetchJobOffers({ limit: 20, cursor })
        : await api.fetchJobSearches({ limit: 20, cursor });
      const incomingPosts = extractPosts(response);
      const cursorValue = resolveCursor(response);
      const hasMorePosts = computeHasMore(cursorValue);
      setPosts(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newUnique = incomingPosts.filter((post: any) => !existingIds.has(post.id));
        return newUnique.length > 0 ? [...prev, ...newUnique] : prev;
      });
      setCursor(hasMorePosts ? cursorValue : null);
      setHasMore(hasMorePosts);
    } catch (err) {
      console.error('Error loading more classifieds:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [activeTab, cursor, hasMore, isLoading, isLoadingMore]);

  useEffect(() => {
    fetchClassifieds();
  }, [fetchClassifieds]);

  const handleScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget;
    const threshold = 240;
    if (el.scrollHeight - el.scrollTop - el.clientHeight <= threshold) {
      loadMoreClassifieds();
    }
  }, [loadMoreClassifieds]);

  const handleProfileClick = useCallback((username: string) => {
    const returnTo = `${location.pathname}${location.search}`;
    navigate(`/${username}`, { state: { returnTo } });
  }, [navigate, location.pathname, location.search]);

  const handlePostClick = useCallback((postId: string, _username?: string) => {
    navigate(`/classifieds/${postId}`);
  }, [navigate]);

  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return posts;
    return posts.filter((post) => {
      const extras = (post as any)?.extras;
      const title = typeof extras?.title === 'string' ? extras.title : '';
      const metadata = Array.isArray(extras?.metadata)
        ? extras.metadata.map((item: { key?: string; value?: string }) => `${item.key ?? ''} ${item.value ?? ''}`.trim())
        : [];
      return title.toLowerCase().includes(query) || metadata.some(entry => entry.toLowerCase().includes(query));
    });
  }, [posts, searchQuery]);

  const classifiedColumns = useMemo(() => {
    const columns: any[][] = [[], [], []];
    filteredPosts.forEach((post, index) => {
      columns[index % columns.length].push(post);
    });
    return columns;
  }, [filteredPosts]);

  const handleMetadataToggle = () => {
    setIsMetadataEnabled(prev => {
      if (prev) {
        setMetadataKeyInput('');
        setMetadataValueInput('');
        setMetadataItems([]);
      }
      return !prev;
    });
  };

  const addMetadataItem = () => {
    const key = metadataKeyInput.trim();
    const value = metadataValueInput.trim();
    if (!key || !value) return;
    setMetadataItems(prev => {
      const existingIndex = prev.findIndex(item => item.key.toLowerCase() === key.toLowerCase());
      if (existingIndex >= 0) {
        const nextItems = [...prev];
        nextItems[existingIndex] = { key, value };
        return nextItems;
      }
      return [...prev, { key, value }];
    });
    setMetadataKeyInput('');
    setMetadataValueInput('');
  };

  const removeMetadataItem = (key: string) => {
    setMetadataItems(prev => prev.filter(entry => entry.key !== key));
  };

  const templateCards = useMemo(() => ([
    {
      id: 'roommate',
      icon: Home,
      title: t('classifieds.templates.roommate_title', { defaultValue: 'Ev arkadaşı' }),
      description: t('classifieds.templates.roommate_desc', { defaultValue: 'Ev arkadaşları bul, ekonomi paylaşımı yap...' }),
      surface: 'from-emerald-500 via-teal-500 to-sky-700',
      glow: 'shadow-emerald-500/20',
    },
    {
      id: 'employers',
      icon: Building2,
      title: t('classifieds.templates.employers_title', { defaultValue: 'İş verenler' }),
      description: t('classifieds.templates.employers_desc', { defaultValue: 'Eğer işveren iseniz bu alana eleman arama ilanları bırakabilirsiniz...' }),
      tab: 'hiring' as const,
      surface: 'from-sky-600 via-indigo-600 to-slate-950',
      glow: 'shadow-sky-600/20',
    },
    {
      id: 'job_seekers',
      icon: UserSearch,
      title: t('classifieds.templates.job_seekers_title', { defaultValue: 'İş arayanlar' }),
      description: t('classifieds.templates.job_seekers_desc', { defaultValue: 'Eğer iş arıyorsanız bu alana ilan bırakabilirsiniz...' }),
      tab: 'seeking' as const,
      surface: 'from-fuchsia-500 via-rose-500 to-orange-500',
      glow: 'shadow-rose-500/20',
    },
    {
      id: 'tutors',
      icon: GraduationCap,
      title: t('classifieds.templates.tutors_title', { defaultValue: 'Ders verenler' }),
      description: t('classifieds.templates.tutors_desc', { defaultValue: 'Herhangi bir branşta ders veriyorsanız buraya ilan bırakabilirsiniz...' }),
      surface: 'from-amber-400 via-orange-500 to-red-600',
      glow: 'shadow-orange-500/20',
    },
    {
      id: 'animals',
      icon: PawPrint,
      title: t('classifieds.templates.animals_title', { defaultValue: 'Hayvanlar alemi' }),
      description: t('classifieds.templates.animals_desc', { defaultValue: 'Evcil hayvanlarla ilgili ilanları, bilgi paylaşımlarını buradan yapabilirsiniz...' }),
      surface: 'from-lime-400 via-emerald-500 to-cyan-600',
      glow: 'shadow-emerald-500/20',
    },
  ]), [t]);

  const handleTemplateClick = (template: { title: string; tab?: ClassifiedsTab }) => {
    openCreateModal({ title: template.title, tab: template.tab });
  };

  const classifiedTabs = [
    {
      id: 'hiring' as const,
      icon: Briefcase,
      label: t('classifieds.hire'),
    },
    {
      id: 'seeking' as const,
      icon: UserSearch,
      label: t('classifieds.jobs'),
    },
  ];
  const activeClassifiedTab = classifiedTabs.find(tab => tab.id === activeTab) ?? classifiedTabs[0];
  const ActiveClassifiedTabIcon = activeClassifiedTab.icon;

  const publishClassifiedsControlsState = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('cv:classifieds-controls-state', {
      detail: {
        activeTab,
        resultCount: filteredPosts.length,
        isLoading,
        searchQuery,
      },
    }));
  }, [activeTab, filteredPosts.length, isLoading, searchQuery]);

  useEffect(() => {
    publishClassifiedsControlsState();
  }, [publishClassifiedsControlsState]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    return () => {
      window.dispatchEvent(new CustomEvent('cv:classifieds-controls-state', { detail: null }));
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleControlsRequest = () => {
      publishClassifiedsControlsState();
    };

    const handleTab = (event: Event) => {
      const tab = (event as CustomEvent<{ tab?: ClassifiedsTab }>).detail?.tab;
      if (tab === 'hiring' || tab === 'seeking') {
        setActiveTab(tab);
      }
    };

    const handleRefresh = () => {
      fetchClassifieds();
    };

    window.addEventListener('cv:classifieds-controls-request', handleControlsRequest);
    window.addEventListener('cv:classifieds-set-tab', handleTab);
    window.addEventListener('cv:classifieds-refresh', handleRefresh);

    return () => {
      window.removeEventListener('cv:classifieds-controls-request', handleControlsRequest);
      window.removeEventListener('cv:classifieds-set-tab', handleTab);
      window.removeEventListener('cv:classifieds-refresh', handleRefresh);
    };
  }, [fetchClassifieds, publishClassifiedsControlsState]);

  return (
    <motion.div
      ref={containerRef}
      onScroll={handleScroll}
      className="skyline-page-scroll w-full pt-24 md:pt-28"
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="flex min-h-full flex-col">
        <section className="relative z-20 mx-auto w-full max-w-7xl px-1 md:px-2 lg:hidden">
          <div className={`flex min-h-[50px] flex-wrap items-center gap-2 border-b pb-2 ${dark ? 'border-white/10' : 'border-slate-200/80'}`}>
            <div className={`flex max-w-full min-w-0 items-center gap-1 overflow-x-auto rounded-full p-1 no-scrollbar ${dark ? 'bg-white/[0.04]' : 'bg-slate-100/85'}`}>
              {classifiedTabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    whileTap={{ scale: 0.98 }}
                    className={`relative flex h-9 shrink-0 items-center gap-2 overflow-hidden rounded-full px-3 text-[10px] font-black uppercase tracking-[0.14em] transition-colors ${active
                      ? 'text-white'
                      : dark
                        ? 'text-zinc-500 hover:text-white'
                        : 'text-slate-500 hover:text-slate-950'
                      }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="classifiedsTabIndicator"
                        className="absolute inset-0 rounded-full bg-sky-600 shadow-lg shadow-sky-600/20"
                        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5" />
                      {tab.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            <div className="ml-auto flex min-w-0 items-center gap-2">
              <div className={`hidden h-9 shrink-0 items-center gap-2 rounded-full px-3 text-[10px] font-black uppercase tracking-[0.14em] sm:flex ${dark ? 'bg-white/[0.04] text-zinc-400' : 'bg-white/70 text-slate-500'}`}>
                <ActiveClassifiedTabIcon className="h-3.5 w-3.5" />
                <span>{activeClassifiedTab.label}</span>
              </div>
              <div className={`flex h-9 shrink-0 items-center rounded-full px-3 text-[10px] font-black uppercase tracking-[0.14em] ${dark ? 'bg-white/[0.04] text-zinc-400' : 'bg-white/70 text-slate-500'}`}>
                {t('classifieds.active_listings', { count: filteredPosts.length })}
              </div>
              {searchQuery && (
                <div className={`flex h-9 min-w-0 items-center gap-2 rounded-full px-3 text-[10px] font-black uppercase tracking-[0.12em] ${dark ? 'bg-white/[0.04] text-zinc-400' : 'bg-white/70 text-slate-500'}`}>
                  <Search className="h-3.5 w-3.5 shrink-0" />
                  <span className="max-w-[140px] truncate md:max-w-[220px]">{searchQuery}</span>
                </div>
              )}
            </div>
          </div>
        </section>

        <main className="flex-1 w-full px-0 pt-0 pb-4">
          <div className="pt-3 pb-4">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-1 md:px-2">
              <div className={`text-[10px] font-black uppercase tracking-[0.24em] ${dark ? 'text-zinc-500' : 'text-slate-400'}`}>
                {t('classifieds.templates.title', { defaultValue: 'İlan fikirleri' })}
              </div>
              <div className={`hidden h-px flex-1 sm:ml-4 sm:block ${dark ? 'bg-white/10' : 'bg-slate-200/80'}`} />
            </div>
            <div className="mx-auto mt-3 flex w-full max-w-7xl snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1 no-scrollbar md:px-2">
              {templateCards.map((template) => (
                <motion.button
                  key={template.id}
                  type="button"
                  onClick={() => handleTemplateClick(template)}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  aria-label={template.title}
                  className={`group relative h-[172px] w-[122px] shrink-0 snap-start overflow-hidden rounded-[28px] bg-gradient-to-br ${template.surface} p-3 text-left text-white shadow-xl ${template.glow} transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 ${dark ? 'focus-visible:ring-offset-gray-950' : 'focus-visible:ring-offset-white'}`}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_18%,rgba(255,255,255,0.34),transparent_28%),linear-gradient(to_top,rgba(0,0,0,0.58),transparent_58%)]" />
                  <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/20 blur-xl transition-transform duration-500 group-hover:scale-125" />
                  <div className="absolute -bottom-10 left-2 h-24 w-24 rounded-full bg-black/20 blur-2xl" />

                  <div className="relative z-10 flex h-full flex-col">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white/70 bg-white/20 shadow-lg backdrop-blur-md">
                      <template.icon className="h-5 w-5" strokeWidth={2.2} />
                    </span>
                    <span className="mt-auto flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-950 shadow-lg transition-transform group-hover:scale-110">
                      <Plus className="h-4 w-4" strokeWidth={2.4} />
                    </span>
                    <div className="mt-2 min-w-0">
                      <div className="line-clamp-2 text-[13px] font-black leading-tight tracking-tight">
                        {template.title}
                      </div>
                      <p className="mt-1 line-clamp-2 text-[10px] font-semibold leading-snug text-white/80">
                        {template.description}
                      </p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
          {isLoading ? (
            <div className="flex items-start justify-center gap-6 px-1 md:gap-8">
              {[0, 1, 2].map((columnIndex) => (
                <div
                  key={columnIndex}
                  className={`flex-col flex-1 gap-6 md:gap-8 min-w-0 max-w-[420px] ${
                    columnIndex === 0
                      ? 'flex'
                      : columnIndex === 1
                        ? 'hidden sm:flex'
                        : 'hidden lg:flex'
                  }`}
                >
                  {[0, 1, 2].map(i => (
                    <div key={`${columnIndex}-${i}`} className="skyline-feed-card elite-card overflow-hidden">
                      <PostSkeleton theme={dark ? 'dark' : 'light'} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="py-10 text-center">
              <p className="text-red-500 text-sm font-medium">{error}</p>
            </div>
          ) : filteredPosts.length > 0 ? (
            <div className="flex items-start justify-center gap-6 px-1 md:gap-8">
              {classifiedColumns.map((column, columnIndex) => (
                <div
                  key={columnIndex}
                  className={`flex-col flex-1 gap-6 md:gap-8 min-w-0 max-w-[420px] ${
                    columnIndex === 0
                      ? 'flex'
                      : columnIndex === 1
                        ? 'hidden sm:flex'
                        : 'hidden lg:flex'
                  }`}
                >
                  {column.map((post) => (
                    <CoolVibesPostCard
                      key={post.id}
                      post={post}
                      onProfileClick={handleProfileClick}
                      onPostClick={handlePostClick}
                    />
                  ))}
                  {isLoadingMore && (
                    <div className="skyline-feed-card elite-card overflow-hidden">
                      <PostSkeleton theme={dark ? 'dark' : 'light'} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center">
              <Search className={`w-10 h-10 mx-auto mb-4 ${dark ? 'text-gray-800' : 'text-slate-200'}`} />
              <p className={`text-xs font-semibold ${dark ? 'text-gray-500' : 'text-slate-400'}`}>
                {t('classifieds.no_results')}
              </p>
              <button onClick={() => setSearchQuery('')} className="mt-3 text-xs font-semibold text-indigo-500 hover:underline">
                {t('classifieds.clear_search')}
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Adding Topic Modal */}
      <AnimatePresence>
        {isAddingTopic && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-md z-[1000] flex items-start md:items-center justify-center p-4 md:p-6 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-2xl rounded-[24px] overflow-hidden flex flex-col max-h-[calc(100vh-3rem)] ${dark ? 'cv-card-surface-solid border border-white/10 text-white' : 'bg-white border border-slate-200 text-slate-900'} shadow-[0_24px_80px_rgba(0,0,0,0.2)]`}
            >
              <div className={`flex items-center justify-between px-6 h-14 border-b ${dark ? 'cv-card-surface-soft border-white/10' : 'bg-white/70 border-slate-200'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${dark ? 'bg-white text-black' : 'bg-slate-900 text-white'}`}>
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-semibold tracking-tight">
                    {postKind === JOB_KIND.offer
                      ? t('classifieds.new_job_listing')
                      : t('classifieds.new_seeking_listing')}
                  </h3>
                </div>
                <button
                  onClick={closeCreateModal}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${dark ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 no-scrollbar">
                <div className={`grid grid-cols-2 gap-2 p-1 rounded-full ${dark ? 'bg-white/5 border border-white/10' : 'bg-slate-100 border border-slate-200'}`}>
                  <button
                    onClick={() => setPostKind(JOB_KIND.offer)}
                    className={`h-9 rounded-full text-xs font-semibold tracking-tight transition-all flex items-center justify-center gap-2 ${postKind === JOB_KIND.offer
                      ? dark ? 'bg-white text-black' : 'bg-slate-900 text-white'
                      : dark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                      }`}
                  >
                    <Briefcase className="w-4 h-4" />
                    {t('classifieds.hire')}
                  </button>
                  <button
                    onClick={() => setPostKind(JOB_KIND.search)}
                    className={`h-9 rounded-full text-xs font-semibold tracking-tight transition-all flex items-center justify-center gap-2 ${postKind === JOB_KIND.search
                      ? dark ? 'bg-white text-black' : 'bg-slate-900 text-white'
                      : dark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                      }`}
                  >
                    <Search className="w-4 h-4" />
                    {t('classifieds.jobs')}
                  </button>
                </div>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <label className={`text-xs font-semibold ${dark ? 'text-gray-300' : 'text-slate-600'}`}>
                      {t('classifieds.form_title')}
                    </label>
                    <input
                      value={listingTitle}
                      onChange={(e) => setListingTitle(e.target.value)}
                      placeholder={t('classifieds.form_title_placeholder')}
                      className={`w-full h-11 px-4 rounded-xl text-sm font-medium outline-none transition-all border ${dark
                        ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-white/30'
                        : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-400'
                        }`}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <label className={`text-xs font-semibold ${dark ? 'text-gray-300' : 'text-slate-600'}`}>
                        {t('classifieds.form_metadata')}
                      </label>
                      <button
                        onClick={handleMetadataToggle}
                        aria-pressed={isMetadataEnabled}
                        aria-label={t('classifieds.form_metadata')}
                        title={t('classifieds.form_metadata')}
                        className={`flex items-center gap-2 text-xs font-semibold transition-colors ${dark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
                      >
                        <span className={`relative inline-flex w-9 h-5 rounded-full transition-colors ${isMetadataEnabled ? (dark ? 'bg-emerald-500/70' : 'bg-emerald-500') : (dark ? 'bg-white/10' : 'bg-slate-200')}`}>
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-all ${isMetadataEnabled ? 'translate-x-4 bg-white' : (dark ? 'bg-gray-400' : 'bg-white')}`} />
                        </span>
                      </button>
                    </div>
                    {isMetadataEnabled && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.4fr_auto] gap-2">
                          <input
                            value={metadataKeyInput}
                            onChange={(e) => setMetadataKeyInput(e.target.value)}
                            placeholder={t('classifieds.form_metadata_key', { defaultValue: 'Key' })}
                            className={`w-full h-10 px-3.5 rounded-xl text-sm font-medium outline-none transition-all border ${dark
                              ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-white/30'
                              : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-400'
                              }`}
                          />
                          <input
                            value={metadataValueInput}
                            onChange={(e) => setMetadataValueInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addMetadataItem();
                              }
                            }}
                            placeholder={t('classifieds.form_metadata_value', { defaultValue: 'Value' })}
                            className={`w-full h-10 px-3.5 rounded-xl text-sm font-medium outline-none transition-all border ${dark
                              ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-white/30'
                              : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-400'
                              }`}
                          />
                          <button
                            onClick={addMetadataItem}
                            className={`h-10 px-4 rounded-xl text-xs font-semibold tracking-tight flex items-center justify-center gap-2 transition-all ${dark
                              ? 'bg-white text-black hover:bg-gray-200'
                              : 'bg-slate-900 text-white hover:bg-slate-800'
                              }`}
                          >
                            <Plus className="w-4 h-4" />
                            {t('classifieds.form_metadata_add', { defaultValue: 'Ekle' })}
                          </button>
                        </div>
                        {metadataItems.length > 0 && (
                          <div className={`rounded-xl border p-2 space-y-2 ${dark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
                            {metadataItems.map(item => (
                              <div
                                key={item.key}
                                className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg ${dark ? 'cv-card-surface-muted border border-white/10' : 'bg-white border border-slate-200'}`}
                              >
                                <div className="min-w-0">
                                  <div className={`text-[11px] font-semibold ${dark ? 'text-gray-300' : 'text-slate-500'}`}>{item.key}</div>
                                  <div className={`text-sm font-medium truncate ${dark ? 'text-white' : 'text-slate-900'}`}>{item.value}</div>
                                </div>
                                <button
                                  onClick={() => removeMetadataItem(item.key)}
                                  className={`w-8 h-8 rounded-full flex items-center justify-center ${dark ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className={`rounded-[20px] border overflow-hidden ${dark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}>
                  <CreatePost
                    title={t('classifieds.form_description')}
                    postTitle={listingTitle.trim()}
                    postKind={postKind}
                    extras={{
                      ...(isMetadataEnabled && metadataItems.length > 0 ? { metadata: metadataItems } : {}),
                    }}
                    buttonText={t('classifieds.form_publish')}
                    fullScreen={false}
                    placeholder={t('classifieds.form_description_placeholder')}
                    canClose={false}
                    onPostCreated={() => {
                      closeCreateModal();
                      fetchClassifieds();
                    }}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
