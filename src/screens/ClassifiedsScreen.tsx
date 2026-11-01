import AnimatedEmptyState from '@/components/ui/AnimatedEmptyState';
import ViewTabs from '@/components/ui/ViewTabs';
import '@/features/classifieds/classifieds.css';
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
  RefreshCw,
  Check,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import CreatePost from '../features/post/CreatePost';
import { api } from '../services/api';
import { CoolVibesPostCard, PostSkeleton } from '../features/post/Flows';
import { GroupedSection, ListRow } from '@/components/ui/Interface';
import PropertyFieldsEditor, { type PropertyField } from '../features/classifieds/PropertyFieldsEditor';

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
  const [metadataItems, setMetadataItems] = useState<PropertyField[]>([]);
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
    setMetadataItems([]);
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

  const metadataSuggestions = useMemo(() => ([
    { label: t('classifieds.location'), hint: t('classifieds.location_hint', { defaultValue: 'e.g. Kadıköy' }) },
    { label: t('classifieds.salary'), hint: t('classifieds.salary_hint', { defaultValue: 'e.g. 25,000' }) },
    { label: t('classifieds.work_type'), hint: t('classifieds.work_type_hint', { defaultValue: 'e.g. Full-time' }) },
    { label: t('classifieds.expectations'), hint: t('classifieds.expectations_hint', { defaultValue: 'e.g. 3+ years experience' }) },
    { label: t('classifieds.date'), hint: t('classifieds.date_hint', { defaultValue: 'e.g. Nov 15' }) },
  ].filter(s => s.label)), [t]);

  const publishableMetadata = useMemo(
    () => metadataItems
      .map(item => ({ key: item.key.trim(), value: item.value.trim() }))
      .filter(item => item.key.length > 0 && item.value.length > 0),
    [metadataItems],
  );

  const templateCards = useMemo(() => ([
    {
      id: 'roommate',
      icon: Home,
      title: t('classifieds.templates.roommate_title', { defaultValue: 'Ev arkadaşı' }),
      description: t('classifieds.templates.roommate_desc', { defaultValue: 'Ev arkadaşları bul, ekonomi paylaşımı yap...' }),
      scenePosition: 0,
    },
    {
      id: 'employers',
      icon: Building2,
      title: t('classifieds.templates.employers_title', { defaultValue: 'İş verenler' }),
      description: t('classifieds.templates.employers_desc', { defaultValue: 'Eğer işveren iseniz bu alana eleman arama ilanları bırakabilirsiniz...' }),
      tab: 'hiring' as const,
      scenePosition: 25,
    },
    {
      id: 'job_seekers',
      icon: UserSearch,
      title: t('classifieds.templates.job_seekers_title', { defaultValue: 'İş arayanlar' }),
      description: t('classifieds.templates.job_seekers_desc', { defaultValue: 'Eğer iş arıyorsanız bu alana ilan bırakabilirsiniz...' }),
      tab: 'seeking' as const,
      scenePosition: 50,
    },
    {
      id: 'tutors',
      icon: GraduationCap,
      title: t('classifieds.templates.tutors_title', { defaultValue: 'Ders verenler' }),
      description: t('classifieds.templates.tutors_desc', { defaultValue: 'Herhangi bir branşta ders veriyorsanız buraya ilan bırakabilirsiniz...' }),
      scenePosition: 75,
    },
    {
      id: 'animals',
      icon: PawPrint,
      title: t('classifieds.templates.animals_title', { defaultValue: 'Hayvanlar alemi' }),
      description: t('classifieds.templates.animals_desc', { defaultValue: 'Evcil hayvanlarla ilgili ilanları, bilgi paylaşımlarını buradan yapabilirsiniz...' }),
      scenePosition: 100,
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
      className="skyline-page-scroll w-full"
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="flex min-h-full flex-col">
        <div className="mx-auto w-full max-w-7xl">
          <div className="cv-tab-bar cv-tab-bar--top -mx-1 md:-mx-2">
            <ViewTabs items={classifiedTabs.map(({ icon: Icon, ...item }) => ({ ...item, icon: <Icon /> }))} activeId={activeTab} onSelect={id => setActiveTab(id)} label={t('app.nav.classifieds')} />
          </div>
        </div>
        <section className="relative z-20 mx-auto w-full max-w-7xl">

          <div className="flex min-h-[44px] items-center gap-2 px-1 pb-3 pt-3 md:px-2">
            <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[var(--color-brand-light-solid)] px-3.5 text-[0.765rem] font-semibold text-[var(--color-brand)]">
                <ActiveClassifiedTabIcon className="h-3.5 w-3.5 shrink-0" />
                {activeClassifiedTab.label}
              </span>
              <span className="flex h-9 shrink-0 items-center rounded-full bg-[var(--cv-surface-3)] px-3.5 text-[0.765rem] font-semibold text-[var(--cv-neutral-2)]">
                {t('classifieds.active_listings', { count: filteredPosts.length })}
              </span>
              {searchQuery && (
                <span className="flex h-9 min-w-0 shrink-0 items-center gap-1.5 rounded-full bg-[var(--cv-surface-3)] px-3.5 text-[0.765rem] font-semibold text-[var(--cv-neutral-2)]">
                  <Search className="h-3.5 w-3.5 shrink-0" />
                  <span className="max-w-[140px] truncate md:max-w-[220px]">{searchQuery}</span>
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fetchClassifieds()}
              disabled={isLoading}
              aria-label={t('classifieds.refresh', { defaultValue: 'Refresh listings' })}
              title={t('classifieds.refresh', { defaultValue: 'Refresh listings' })}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--cv-surface-3)] text-[var(--cv-neutral-1)] transition-all hover:bg-[var(--cv-surface-3-hover)]"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </section>

        <main className="flex-1 w-full px-0 pt-0 pb-4">
          <div className="pt-2 pb-4">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-1 md:px-2">
              <div className={`text-[0.765rem] font-semibold normal-case tracking-normal ${dark ? 'text-zinc-500' : 'text-slate-400'}`}>
                {t('classifieds.templates.title', { defaultValue: 'İlan fikirleri' })}
              </div>
              <div className={`hidden h-px flex-1 sm:ml-4 sm:block ${dark ? 'bg-white/10' : 'bg-slate-200/80'}`} />
            </div>
            <div className="cv-classified-templates mx-auto mt-3 flex w-full max-w-7xl snap-x snap-mandatory gap-3 overflow-x-auto px-1 no-scrollbar md:px-2">
              {templateCards.map((template) => (
                <motion.button
                  key={template.id}
                  type="button"
                  onClick={() => handleTemplateClick(template)}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  aria-label={template.title}
                  className="cv-classified-template"
                >
                  <span className="cv-classified-template-art" style={{ backgroundPosition: `${template.scenePosition}% center` }} aria-hidden="true" />
                  <span className="cv-classified-template-shade" aria-hidden="true" />
                  <div className="cv-classified-template-top" aria-hidden="true">
                    <span className="cv-classified-template-icon">
                      <template.icon strokeWidth={2.2} />
                    </span>
                    <span className="cv-classified-template-add">
                      <Plus strokeWidth={2.4} />
                    </span>
                  </div>
                  <div className="cv-classified-template-copy">
                    <span className="cv-classified-template-title">{template.title}</span>
                    <span className="cv-classified-template-description">{template.description}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
          {isLoading ? (
            <div className="mx-auto flex w-full max-w-2xl flex-col">
              {[0, 1, 2].map(i => (
                <div key={i} className="cv-item overflow-hidden !px-0">
                  <PostSkeleton theme={dark ? 'dark' : 'light'} />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="py-10 text-center">
              <p className="text-red-500 text-sm font-medium">{error}</p>
            </div>
          ) : filteredPosts.length > 0 ? (
            <div className="mx-auto flex w-full max-w-2xl flex-col">
              {filteredPosts.map((post) => (
                <CoolVibesPostCard
                  key={post.id}
                  post={post}
                  onProfileClick={handleProfileClick}
                  onPostClick={handlePostClick}
                />
              ))}
              {isLoadingMore && (
                <div className="cv-item overflow-hidden !px-0">
                  <PostSkeleton theme={dark ? 'dark' : 'light'} />
                </div>
              )}
            </div>
          ) : (
            <AnimatedEmptyState title={t('classifieds.no_results')}>
              <button type="button" onClick={() => setSearchQuery('')} className="cv-btn">{t('classifieds.clear_search')}</button>
            </AnimatedEmptyState>
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
              className="w-full max-w-2xl rounded-[24px] overflow-hidden flex flex-col max-h-[calc(100vh-3rem)] bg-[var(--cv-page-bg)] text-[var(--cv-neutral-1)] shadow-[0_24px_80px_rgba(0,0,0,0.2)]"
            >
              <div className="flex items-center justify-between px-6 h-14 shrink-0 bg-[var(--cv-card-bg-solid)]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="aspect-square flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-light-solid)] text-[var(--color-brand)]">
                    <Briefcase className="w-4 h-4" strokeWidth={2} />
                  </div>
                  <h3 className="text-sm font-semibold tracking-tight truncate">
                    {postKind === JOB_KIND.offer
                      ? t('classifieds.new_job_listing')
                      : t('classifieds.new_seeking_listing')}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={closeCreateModal}
                  aria-label={t('app.close', { defaultValue: 'Close' })}
                  className="aspect-square w-9 h-9 shrink-0 appearance-none border-0 rounded-full flex items-center justify-center text-[var(--cv-neutral-2)] transition-colors hover:bg-[var(--cv-list-hover)] hover:text-[var(--cv-neutral-1)]"
                >
                  <X className="w-5 h-5 pointer-events-none" />
                </button>
              </div>
              <div className="cv-classified-form flex-1 overflow-y-auto px-4 sm:px-6 py-4 no-scrollbar">
                <GroupedSection title={t('classifieds.form_type', { defaultValue: 'Listing Type' })}>
                  <ListRow
                    icon={<Briefcase />}
                    title={t('classifieds.hire')}
                    selected={postKind === JOB_KIND.offer}
                    onClick={() => setPostKind(JOB_KIND.offer)}
                    accessory={<Check className={`cv-list-check ${postKind === JOB_KIND.offer ? 'text-[var(--color-brand)]' : 'opacity-0'}`} />}
                  />
                  <ListRow
                    icon={<Search />}
                    title={t('classifieds.jobs')}
                    selected={postKind === JOB_KIND.search}
                    onClick={() => setPostKind(JOB_KIND.search)}
                    accessory={<Check className={`cv-list-check ${postKind === JOB_KIND.search ? 'text-[var(--color-brand)]' : 'opacity-0'}`} />}
                  />
                </GroupedSection>

                <div className="cv-classified-title-field">
                  <label htmlFor="classified-title">{t('classifieds.form_title')}</label>
                  <input
                    id="classified-title"
                    value={listingTitle}
                    onChange={(e) => setListingTitle(e.target.value)}
                    placeholder={t('classifieds.form_title_placeholder')}
                  />
                </div>

                <GroupedSection
                  title={t('classifieds.form_metadata')}
                  footer={t('classifieds.form_metadata_hint', { defaultValue: 'Tap a suggestion below or add your own field.' })}
                >
                  <PropertyFieldsEditor
                    items={metadataItems}
                    onChange={setMetadataItems}
                    suggestions={metadataSuggestions}
                  />
                </GroupedSection>

                <GroupedSection className="cv-classified-create-section">
                  <CreatePost
                    title={t('classifieds.form_description')}
                    postTitle={listingTitle.trim()}
                    postKind={postKind}
                    extras={{
                      ...(publishableMetadata.length > 0 ? { metadata: publishableMetadata } : {}),
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
                </GroupedSection>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
