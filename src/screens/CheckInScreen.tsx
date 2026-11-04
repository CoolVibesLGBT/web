import AnimatedEmptyState from '@/components/ui/AnimatedEmptyState';
import ViewTabs from '@/components/ui/ViewTabs';
import { Sheet } from '@/components/ui/Interface';
import { useState, useEffect, useCallback, useMemo, useRef, startTransition, memo } from 'react';
import { motion, AnimatePresence, useMotionValue, useMotionValueEvent, animate } from 'framer-motion';
import { MapPin, Map as MapIcon, X, List, RefreshCw, CircleCheck } from 'lucide-react';
import CheckInTagArtwork from '@/features/checkin/CheckInTagArtwork';
import type { CheckInTagItem } from '@/contexts/AppContext';
import { useNavigate, useLocation } from '@/router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useApp } from '../contexts/AppContext';
import CreatePost from '../features/post/CreatePost';
import { getLocalizedContent } from '../helpers/helpers';
import Post from '../features/post/Post';
import { PostSkeleton } from '../features/post/Flows';
import GameMap, { type GameMarkerContent } from '../features/map/Map/game/GameMap';
import { useAtom, useSetAtom } from 'jotai';
import { checkinsStateAtom, fetchCheckinsAtom } from '@/state/checkins';

// Walk complete axial hex rings so every tag has its own position.
function hexPositions(count: number, rowHeight = 160) {
    const cells = [{ q: 0, r: 0 }];
    const directions = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
    for (let ring = 1; cells.length < count; ring++) {
        let q = -ring, r = ring;
        for (const [dq, dr] of directions) {
            for (let step = 0; step < ring && cells.length < count; step++) {
                cells.push({ q, r }); q += dq; r += dr;
            }
        }
    }
    return cells.slice(0, count).map(({ q, r }) => ({ x: 128 * (q + r / 2), y: rowHeight * r }));
}

const CheckInTagSelector = memo(function CheckInTagSelector({ tags, selected, onToggle, language }: {
    tags: CheckInTagItem[];
    selected: string[];
    onToggle: (tag: string) => void;
    language: string;
}) {
    const viewport = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ width: 320, height: 300 });
    const [camera, setCamera] = useState({ x: 0, y: 0 });
    const dragX = useMotionValue(0), dragY = useMotionValue(0);
    // Motion values move the plane without rendering React on every animation frame.
    // Refresh the overscanned window only when entering another 96px cell.
    const cameraCell = useRef({ x: 0, y: 0 });
    const updateWindow = () => {
        const next = { x: Math.round(dragX.get() / 96) * 96, y: Math.round(dragY.get() / 96) * 96 };
        if (next.x === cameraCell.current.x && next.y === cameraCell.current.y) return;
        cameraCell.current = next;
        setCamera(next);
    };
    useMotionValueEvent(dragX, 'change', updateWindow);
    useMotionValueEvent(dragY, 'change', updateWindow);
    const [rowHeight, setRowHeight] = useState(160);
    const positions = useMemo(() => hexPositions(tags.length, rowHeight), [tags.length, rowHeight]);
    useEffect(() => {
        const element = viewport.current;
        if (!element) return;
        const observer = new ResizeObserver(([entry]) => {
            const width = Math.round(entry.contentRect.width), height = Math.round(entry.contentRect.height);
            setSize(previous => previous.width === width && previous.height === height ? previous : { width, height });
        });
        observer.observe(element);
        return () => observer.disconnect();
    }, []);
    const extentX = Math.max(0, ...positions.map(position => Math.abs(position.x)));
    const extentY = Math.max(0, ...positions.map(position => Math.abs(position.y)));
    // Cull off-screen circles while keeping one ring for drag/keyboard overscan.
    const visible = useMemo(() => tags.flatMap((tag, index) => {
        const position = positions[index];
        return Math.abs(position.x + camera.x) < size.width / 2 + 190 && Math.abs(position.y + camera.y) < size.height / 2 + Math.max(190, rowHeight)
            ? [{ tag, position, index }] : [];
    }), [tags, positions, camera, size, rowHeight]);
    useEffect(() => {
        // Let translations and enlarged text wrap completely, then reserve row space.
        const observer = new ResizeObserver(entries => {
            const required = Math.ceil(Math.max(...entries.map(entry => entry.target.getBoundingClientRect().height))) + 16;
            setRowHeight(previous => Math.max(previous, required));
        });
        viewport.current?.querySelectorAll('.cv-checkin-tag-option').forEach(element => observer.observe(element));
        return () => observer.disconnect();
    }, [visible]);
    const center = (index: number, focus = false) => {
        const position = positions[index];
        if (!position) return;
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        animate(dragX, -position.x, reduced ? { duration: 0 } : { type: 'spring', stiffness: 200, damping: 28 });
        animate(dragY, -position.y, { ...(reduced ? { duration: 0 } : { type: 'spring' as const, stiffness: 200, damping: 28 }), onComplete: () => {
            if (focus) requestAnimationFrame(() => viewport.current?.querySelector<HTMLButtonElement>(`[data-checkin-index="${index}"]`)?.focus({ preventScroll: true }));
        } });
    };
    return <div ref={viewport} className="cv-checkin-honeycomb">
        <motion.div className="cv-checkin-honeycomb-plane" drag dragConstraints={{ left: -extentX, right: extentX, top: -extentY, bottom: extentY }} dragElastic={0.04} dragMomentum={false} style={{ x: dragX, y: dragY }}>
            {visible.map(({ tag, position, index }) => <motion.button
                key={tag.id}
                type="button"
                className="cv-checkin-tag-option"
                style={{ x: position.x, y: position.y }}
                aria-pressed={selected.includes(tag.tag)}
                data-checkin-index={index}
                onClick={() => onToggle(tag.tag)}
                onKeyDown={event => {
                    const next = event.key === 'ArrowRight' ? index + 1 : event.key === 'ArrowLeft' ? index - 1 : event.key === 'Home' ? 0 : event.key === 'End' ? tags.length - 1 : null;
                    if (next === null || next < 0 || next >= tags.length) return;
                    event.preventDefault(); center(next, true);
                }}
            >
                <span className="cv-checkin-tag-portrait">
                    <CheckInTagArtwork tag={tag} sizes="72px" />
                    {selected.includes(tag.tag) && <CircleCheck aria-hidden="true" className="cv-checkin-tag-check" />}
                </span>
                <span className="cv-checkin-tag-label" lang={language}>{String(getLocalizedContent(tag.name, language))}</span>
            </motion.button>)}
        </motion.div>
    </div>;
});

/* ─── Main Component ────────────────────────────────────────────────────────── */
export default function CheckInScreen() {
    const { theme } = useTheme();
    const dark = theme === 'dark';
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation('common');
    const { data: appData,defaultLanguage } = useApp();
    const checkinTags = useMemo(() => (appData?.checkin_tag_types ?? []).filter(tag => tag.is_visible !== false), [appData?.checkin_tag_types]);

    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [checkinsState] = useAtom(checkinsStateAtom);
    const runFetchCheckins = useSetAtom(fetchCheckinsAtom);
    const posts = checkinsState.items;
    const loading = checkinsState.isLoading;
    const error = checkinsState.error;
    const [userLocation, setUserLocation] = useState<[number, number]>([41.0082, 28.9784]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [checkInViewMode, setCheckInViewMode] = useState<'map' | 'list'>('list');

    const fetchCheckIns = useCallback(async () => {
        await runFetchCheckins({ limit: 50 });
    }, [runFetchCheckins]);

    const handleRefresh = useCallback(() => {
        void fetchCheckIns();
    }, [fetchCheckIns]);

    const handleOpenCreate = useCallback(() => {
        setIsModalOpen(true);
    }, []);

    useEffect(() => {
        void fetchCheckIns();
    }, [fetchCheckIns]);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(pos => {
                setUserLocation([pos.coords.latitude, pos.coords.longitude]);
            });
        }
    }, []);

    useEffect(() => {
        if (isModalOpen) setSelectedTags([]);
    }, [isModalOpen]);

    const toggleTag = useCallback((tag: string) => {
        setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    }, []);
    // Sheet's modal lifecycle depends on onClose; keep it stable across selections.
    const handleCloseCreate = useCallback(() => setIsModalOpen(false), []);

    const handleProfileClick = useCallback((username: string) => {
        const returnTo = `${location.pathname}${location.search}`;
        navigate(`/${username}`, { state: { returnTo } });
    }, [navigate, location.pathname, location.search]);

    const handleCheckinClick = useCallback((postId: string) => {
        const returnTo = `${location.pathname}${location.search}`;
        navigate(`/checkin/${postId}`, { state: { returnTo } });
    }, [navigate, location.pathname, location.search]);

    const publishCheckInControlsState = useCallback(() => {
        if (typeof window === 'undefined') return;
        window.dispatchEvent(new CustomEvent('cv:checkin-controls-state', {
            detail: {
                viewMode: checkInViewMode,
                resultCount: posts.length,
                isLoading: loading,
            },
        }));
    }, [checkInViewMode, loading, posts.length]);

    useEffect(() => {
        publishCheckInControlsState();
    }, [publishCheckInControlsState]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        return () => {
            window.dispatchEvent(new CustomEvent('cv:checkin-controls-state', { detail: null }));
        };
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleControlsRequest = () => {
            publishCheckInControlsState();
        };

        window.addEventListener('cv:checkin-controls-request', handleControlsRequest);
        return () => {
            window.removeEventListener('cv:checkin-controls-request', handleControlsRequest);
        };
    }, [publishCheckInControlsState]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleViewMode = (event: Event) => {
            const viewMode = (event as CustomEvent<{ viewMode?: 'map' | 'list' }>).detail?.viewMode;
            if (viewMode === 'map' || viewMode === 'list') {
                startTransition(() => setCheckInViewMode(viewMode));
            }
        };

        window.addEventListener('cv:checkin-set-view-mode', handleViewMode);
        window.addEventListener('cv:checkin-open-create', handleOpenCreate);
        window.addEventListener('cv:checkin-refresh', handleRefresh);

        return () => {
            window.removeEventListener('cv:checkin-set-view-mode', handleViewMode);
            window.removeEventListener('cv:checkin-open-create', handleOpenCreate);
            window.removeEventListener('cv:checkin-refresh', handleRefresh);
        };
    }, [handleOpenCreate, handleRefresh]);


    const isMapView = checkInViewMode === 'map';
    const panelClassName = dark
        ? 'cv-card-surface-soft border-white/10'
        : 'border-white/70 bg-white/75';

    const checkInMarkerContent = useCallback((p: any): GameMarkerContent => ({
        imageUrl: p?.author?.avatar?.variants?.image?.thumbnail?.url || p?.author?.avatar?.url || null,
        label: p?.author?.username,
        variant: 'pokestop',
    }), []);
    const checkInMarkerCoords = useCallback((p: any): [number, number] | null => (
        p?.location ? [p.location.latitude, p.location.longitude] : null
    ), []);
    const checkInMarkerId = useCallback((p: any): string => String(p?.id), []);
    const handleCheckInMarkerClick = useCallback((p: any) => {
        if (p?.id) handleCheckinClick(p.id);
    }, [handleCheckinClick]);

    const mapContent = (
        <GameMap
            locations={posts}
            getMarkerId={checkInMarkerId}
            getMarkerCoords={checkInMarkerCoords}
            getMarkerContent={checkInMarkerContent}
            onMarkerClick={handleCheckInMarkerClick}
            playerPosition={userLocation}
            initialCenter={userLocation}
        />
    );

    return (
        <div className={`relative ${isMapView ? 'h-full overflow-hidden' : 'skyline-page-scroll'} w-full font-sans ${dark ? 'text-white' : 'text-slate-950'}`}>
            {isMapView && (
                <div className="fixed inset-0 z-0 h-full w-full">
                    {mapContent}
                </div>
            )}

            <div className={`relative z-10 flex flex-col ${isMapView ? 'h-full pointer-events-none px-1 md:px-2' : 'px-1 pb-8 md:px-2'}`}>
                <div className="pointer-events-auto z-50 mx-auto w-full max-w-7xl">
                    <section className="relative">
                        <div className="cv-tab-bar cv-tab-bar--top -mx-1 md:-mx-2">
                            <ViewTabs items={(
                                    [
                                        { id: 'map' as const, icon: MapIcon, label: t('nearby.view_map') },
                                        { id: 'list' as const, icon: List, label: t('nearby.view_list', { defaultValue: 'List' }) },
                                    ]
                                ).map(({ icon: Icon, ...item }) => ({ ...item, icon: <Icon /> }))} activeId={checkInViewMode} onSelect={id => setCheckInViewMode(id)} label={t('app.nav.checkin')} />
                        </div>
                        <div className="flex min-h-[44px] items-center gap-2 px-1 pb-3 pt-3 md:px-2">
                            <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto no-scrollbar">
                                <span className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[var(--color-brand-light-solid)] px-3.5 text-[0.765rem] font-semibold text-[var(--color-brand)]">
                                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                                    {isMapView ? t('nearby.view_map') : t('nearby.view_list', { defaultValue: 'List' })}
                                </span>
                                <span className="flex h-9 shrink-0 items-center rounded-full bg-[var(--cv-surface-3)] px-3.5 text-[0.765rem] font-semibold text-[var(--cv-neutral-2)]">
                                    {posts.length}
                                </span>
                            </div>

                            <motion.button
                                type="button"
                                onClick={handleOpenCreate}
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                aria-label={t('app.nav.checkin', { defaultValue: 'Check-in' })}
                                className="sky-glow flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition-all"
                            >
                                <MapPin className="h-4 w-4" />
                            </motion.button>

                            <motion.button
                                type="button"
                                onClick={handleRefresh}
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                title={t('nearby.refresh')}
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all ${dark
                                    ? 'bg-white text-slate-950 hover:bg-zinc-200'
                                    : 'bg-slate-950 text-white hover:bg-slate-800'
                                    }`}
                            >
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            </motion.button>
                        </div>
                    </section>
                </div>

                {!isMapView && (
                    <div className="pointer-events-auto mx-auto w-full max-w-2xl px-0 pt-2 md:px-1">
                        {loading ? (
                            <div className="flex flex-col">
                                {[0, 1, 2].map(i => (
                                    <div key={i} className="cv-item overflow-hidden !px-0">
                                        <PostSkeleton theme={dark ? 'dark' : 'light'} />
                                    </div>
                                ))}
                            </div>
                        ) : error ? (
                            <div className={`mx-auto max-w-xl rounded-[30px] border p-10 text-center backdrop-blur-3xl ${panelClassName}`}>
                                <p className="text-sm font-semibold text-red-500">{error}</p>
                            </div>
                        ) : posts.length === 0 ? (
                            <AnimatedEmptyState title={t('nearby.no_matches_found')} />
                        ) : (
                            <div className="flex flex-col">
                                {posts.map(p => (
                                    <Post
                                        key={p.id}
                                        post={p}
                                        onProfileClick={handleProfileClick}
                                        onPostClick={(postId) => handleCheckinClick(postId)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Check-in Modal ── */}
            <AnimatePresence>
                {isModalOpen && (
                    <>
                        <Sheet
                            isOpen={isModalOpen}
                            onClose={handleCloseCreate}
                            title={t('app.nav.checkin')}
                            className="cv-checkin-selector-sheet"
                            hideCloseButton
                        >
                            <div className="cv-checkin-composer">
                                <CreatePost
                                    title={t('app.nav.checkin')}
                                    postKind="checkin"
                                    extras={{ tags: selectedTags }}
                                    buttonText={t('app.nav.checkin')}
                                    fullScreen={false}
                                    allowFullScreenToggle={false}
                                    compact
                                    canClose
                                    onClose={handleCloseCreate}
                                    composerAttachment={
                                        <div className="cv-checkin-attachment">
                                            <CheckInTagSelector tags={checkinTags} selected={selectedTags} onToggle={toggleTag} language={defaultLanguage} />
                                                <div className="cv-checkin-selected-tags" aria-live="polite">
                                                    {selectedTags.map(value => {
                                                        const tag = checkinTags.find(item => item.tag === value);
                                                        return (
                                                            <button type="button" key={value} onClick={() => toggleTag(value)} aria-pressed="true">
                                                                {tag && <CheckInTagArtwork tag={tag} className="cv-checkin-selected-artwork" sizes="32px" />}
                                                                <span>{tag ? String(getLocalizedContent(tag.name, defaultLanguage)) : value}</span>
                                                                <X aria-hidden="true" />
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                        </div>
                                    }
                                    onPostCreated={() => {
                                        setIsModalOpen(false);
                                        void fetchCheckIns();
                                    }}
                                />
                            </div>
                        </Sheet>
                    </>
                )}
            </AnimatePresence>

            {/* Popup styles */}
            <style>{`
                .custom-popup .leaflet-popup-content-wrapper {
                    background: ${dark ? 'rgba(15,15,20,0.85)' : 'rgba(255,255,255,0.95)'};
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'};
                    border-radius: 20px;
                    box-shadow: 0 10px 40px ${dark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.15)'};
                    padding: 0;
                    overflow: hidden;
                }
                .custom-popup .leaflet-popup-tip-container { display: none; }
                .custom-popup .leaflet-popup-content { margin: 0; width: auto !important; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
