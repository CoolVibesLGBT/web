import AnimatedEmptyState from '@/components/ui/AnimatedEmptyState';
import ViewTabs from '@/components/ui/ViewTabs';
import { useState, useEffect, useCallback, startTransition } from 'react';
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';
import {
    MapPin,
    Clock,
    Home,
    Car,
    Building2,
    Wallet,
    Heart,
    Zap,
    MessageSquare,
    Banknote,
    Moon,
    Coffee,
    Smile,
    ShieldCheck,
    Hand,
    X,
    Globe,
    Sparkles,
    Droplet,
    Feather,
    Dumbbell,
    FlaskRound,
    List,
    Map as MapIcon,
    RefreshCw,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useNavigate, useLocation } from '@/router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useApp } from '../contexts/AppContext';
import { tagNameToColor } from '../helpers/colors';
import CreatePost from '../features/post/CreatePost';
import { getLocalizedContent } from '../helpers/helpers';
import Post from '../features/post/Post';
import { PostSkeleton } from '../features/post/Flows';
import GameMap, { type GameMarkerContent } from '../features/map/Map/game/GameMap';
import { useAtom, useSetAtom } from 'jotai';
import { checkinsStateAtom, fetchCheckinsAtom } from '@/state/checkins';

type TagCategory = 'capacity' | 'intent' | 'availability' | 'personality' | 'safety';

interface CheckInTag {
    id: string;
    tag: string;
    name: { en: string; tr: string };
    icon: LucideIcon;
    category: TagCategory;
    color: string;
}



const LUCIDE_ICON_MAP: Record<string, LucideIcon> = {
    home: Home,
    car: Car,
    building: Building2,
    wallet: Wallet,
    heart: Heart,
    zap: Zap,
    'message-circle': MessageSquare,
    banknote: Banknote,
    sparkles: Sparkles,
    droplet: Droplet,
    feather: Feather,
    dumbbell: Dumbbell,
    'flask-round': FlaskRound,
    clock: Clock,
    moon: Moon,
    coffee: Coffee,
    smile: Smile,
    'shield-check': ShieldCheck,
    hand: Hand,
    globe: Globe,
};

const resolveTagIcon = (icon?: string | LucideIcon): LucideIcon => {
    if (!icon) return MapPin;
    if (typeof icon === 'function') return icon as LucideIcon;
    const key = icon.toLowerCase();
    return LUCIDE_ICON_MAP[key] ?? MapPin;
};

/* ─── Hex position helper (Apple Watch spiral layout) ─────────────────────── */
const getHexPosition = (index: number) => {
    const hexCoords = [
        { q: 0, r: 0 },
        { q: 1, r: -1 }, { q: 1, r: 0 }, { q: 0, r: 1 },
        { q: -1, r: 1 }, { q: -1, r: 0 }, { q: 0, r: -1 },
        { q: 2, r: -2 }, { q: 2, r: -1 }, { q: 2, r: 0 }, { q: 1, r: 1 },
        { q: 0, r: 2 }, { q: -1, r: 2 }, { q: -2, r: 2 }, { q: -2, r: 1 },
        { q: -2, r: 0 }, { q: -1, r: -1 }, { q: 0, r: -2 }, { q: 1, r: -2 },
    ];
    const coord = hexCoords[index] || { q: 0, r: 0 };
    const size = 98;
    const x = size * (Math.sqrt(3) * coord.q + (Math.sqrt(3) / 2) * coord.r);
    const y = size * ((3 / 2) * coord.r);
    return { x, y };
};

/* ─── Honeycomb Item ────────────────────────────────────────────────────────── */
function HoneycombItem({ tag, pos, isSelected, hasSelection, onToggle, dark, defaultLanguage }: {
    tag: CheckInTag;
    pos: { x: number; y: number };
    isSelected: boolean;
    hasSelection: boolean;
    onToggle: (pos: { x: number; y: number }) => void;
    dark: boolean;
    defaultLanguage: string;
}) {
   const Icon = tag.icon ?? MapPin;
    // pos hiç değişmediği için spring gereksiz — doğrudan kullanıyoruz
    return (
        <motion.button
            style={{ x: pos.x, y: pos.y, zIndex: isSelected ? 20 : 1 }}
            animate={{ opacity: hasSelection && !isSelected ? 0.55 : 1 }}
            transition={{ opacity: { duration: 0.25, ease: 'easeInOut' } }}
            whileTap={{ scale: 0.93 }}
            onClick={e => { e.stopPropagation(); onToggle(pos); }}
            className={`
                absolute w-[116px] h-[116px] rounded-full flex flex-col items-center justify-center gap-2
                border-2 overflow-hidden
                ${isSelected
                    ? 'border-transparent'
                    : dark
                        ? 'bg-gray-900/60 border-white/[0.10] hover:border-white/[0.22] hover:bg-gray-800/45'
                        : 'bg-white/80 border-black/[0.08] hover:border-black/[0.18] hover:bg-black/[0.03]'
                }
            `}
        >
            <motion.div
                 style={tagNameToColor(tag.category)}

                className={`absolute inset-0`}
                initial={false}
                animate={{ opacity: isSelected ? 1 : 0 }}
                transition={{ duration: 0.22, ease: 'easeInOut' }}
            />
            <div className="relative flex flex-col items-center gap-1">
                
               <Icon
            className={`w-8 h-8 transition-colors duration-250 ${
                isSelected
                    ? 'text-white'
                    : dark
                        ? 'text-gray-200'
                        : 'text-gray-700'
            }`}
            strokeWidth={1.8}
        />
                <span className={`text-[0.765rem] font-semibold normal-case tracking-tight text-center px-1 leading-none transition-colors duration-250 ${isSelected ? 'text-white' : dark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {getLocalizedContent(tag.name, defaultLanguage) as any}
                </span>
            </div>
        </motion.button>
    );
}

/* ─── Main Component ────────────────────────────────────────────────────────── */
export default function CheckInScreen() {
    const { theme } = useTheme();
    const dark = theme === 'dark';
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation('common');
    const { data: appData,defaultLanguage } = useApp();
    interface RawTag {
        id: string;
        tag: string;
        name: { en: string; tr: string };
        icon?: string;
        category: TagCategory;
    }

    const checkinTags: CheckInTag[] = ((appData?.checkin_tag_types as RawTag[]) ?? []).map((tag: RawTag) => ({
        ...tag,
        icon: resolveTagIcon(tag.icon),
        color: tagByTagNameToColor(tag.category).background?.toString() || '#8b5cf6'
    } as CheckInTag));

    function tagByTagNameToColor(category: string) {
        return tagNameToColor(category) as any;
    }

    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [checkinsState] = useAtom(checkinsStateAtom);
    const runFetchCheckins = useSetAtom(fetchCheckinsAtom);
    const posts = checkinsState.items;
    const loading = checkinsState.isLoading;
    const error = checkinsState.error;
    const [userLocation, setUserLocation] = useState<[number, number]>([41.0082, 28.9784]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [checkInViewMode, setCheckInViewMode] = useState<'map' | 'list'>('list');
    // useMotionValue — drag sırasında lag yok, centerOnItem'da animate() ile smooth spring
    const dragX = useMotionValue(0);
    const dragY = useMotionValue(0);

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
        if (isModalOpen) {
            animate(dragX, 0, { duration: 0 });
            animate(dragY, 0, { duration: 0 });
            setSelectedTags([]);
        }
    }, [isModalOpen, dragX, dragY]);

    const centerOnItem = (pos: { x: number; y: number }) => {
        // animate() — spring ile smooth kayma, drag sırasında ise anlık
        animate(dragX, -pos.x, { type: 'spring', stiffness: 200, damping: 28, mass: 0.7 });
        animate(dragY, -pos.y, { type: 'spring', stiffness: 200, damping: 28, mass: 0.7 });
    };

    const toggleTag = (tag: string, pos?: { x: number; y: number }) => {
        const willSelect = !selectedTags.includes(tag);
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
        if (willSelect && pos) centerOnItem(pos);
    };

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
                        {/* Modal: fullscreen honeycomb + bottom panel */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={`
                                pointer-events-auto fixed inset-0 z-[700] flex min-h-0 flex-col
                                ${dark ? 'bg-slate-950/96 text-white' : 'bg-white/95 text-slate-950'}
                                backdrop-blur-3xl
                            `}
                        >
                            <div className={`mx-3 mt-[calc(env(safe-area-inset-top)+0.75rem)] shrink-0 rounded-[26px] border px-3 py-2 backdrop-blur-3xl md:mx-auto md:w-full md:max-w-3xl ${panelClassName} shadow-[0_24px_80px_-48px_rgba(15,23,42,0.7)]`}>
                                <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-brand)] to-transparent opacity-50" />
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="sky-glow flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white">
                                            <MapPin className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-[0.765rem] font-semibold normal-case tracking-normal text-[var(--color-brand)]">
                                                {t('app.nav.checkin', { defaultValue: 'Check-in' })}
                                            </p>
                                            <div className="mt-0.5 flex items-center gap-2">
                                                <h2 className="truncate text-base font-semibold leading-none tracking-tight md:text-lg">
                                                    Durumunu seç
                                                </h2>
                                                {selectedTags.length > 0 && (
                                                    <span className={`rounded-full px-2 py-0.5 text-[0.765rem] font-semibold ${dark ? 'bg-white/[0.08] text-zinc-300' : 'bg-slate-100 text-slate-500'}`}>
                                                        {selectedTags.length}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all ${dark
                                            ? 'bg-white text-slate-950 hover:bg-zinc-200'
                                            : 'bg-slate-950 text-white hover:bg-slate-800'
                                            }`}
                                        aria-label="Kapat"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Draggable honeycomb area */}
                            <div className="relative min-h-[240px] flex-1 overflow-hidden">
                                <motion.div
                                    drag
                                    dragConstraints={{ left: -320, right: 320, top: -240, bottom: 240 }}
                                    dragElastic={0.06}
                                    dragMomentum={false}
                                    style={{ x: dragX, y: dragY }}
                                    className="absolute inset-0 flex items-center justify-center cursor-grab active:cursor-grabbing"
                                >
                                    {checkinTags.map((tag, idx) => {
                                        const pos = getHexPosition(idx);
                                        return (
                                            <HoneycombItem
                                                key={tag.id}
                                                tag={tag}
                                                pos={pos}
                                                isSelected={selectedTags.includes(tag.tag)}
                                                hasSelection={selectedTags.length > 0}
                                                onToggle={pos => toggleTag(tag.tag, pos)}
                                                dark={dark}
                                                defaultLanguage={defaultLanguage}
                                            />
                                        );
                                    })}
                                </motion.div>

                                {/* Hint label */}
                                <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 text-[0.765rem] font-bold normal-case tracking-normal px-3 py-1 rounded-full pointer-events-none ${dark ? 'text-gray-600 bg-gray-900/60' : 'text-gray-400 bg-gray-100/80'}`}>
                                    Sürükle &amp; Seç
                                </div>
                            </div>

                            {/* Bottom panel */}
                            <div className={`mx-3 mb-[calc(env(safe-area-inset-bottom)+0.75rem)] max-h-[48vh] shrink-0 overflow-y-auto rounded-[20px] border p-3 backdrop-blur-3xl no-scrollbar md:mx-auto md:w-full md:max-w-3xl ${panelClassName}`}>

                                {/* Selected tags row */}
                                <AnimatePresence>
                                    {selectedTags.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className={`px-3.5 py-2.5 rounded-2xl flex flex-wrap gap-1.5 ${dark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-gray-50 border border-black/[0.06]'}`}>
                                                {selectedTags.map(t => {
                                                    const tag = checkinTags.find(ct => ct.tag === t);
                                                    if (!tag) {
                                                        return (
                                                            <button
                                                                key={t}
                                                                onClick={() => toggleTag(t)}
                                                                className={`flex items-center gap-1.5 px-2 py-1 rounded-xl ${dark ? 'bg-white/10 text-white' : 'bg-black/10 text-gray-800'}`}
                                                            >
                                                                <span className="text-[0.765rem] font-bold">{t}</span>
                                                                <X className="w-2 h-2 opacity-60" />
                                                            </button>
                                                        );
                                                    }
                                                    const Icon = tag.icon;
                                                    return (
                                                        <button
                                                            key={t}
                                                            onClick={() => toggleTag(t)}
                                                            style={tagNameToColor(tag.category) as any}
                                                            className="flex items-center gap-1.5 rounded-xl px-2 py-1"
                                                        >
                                                            <Icon className="w-3 h-3" strokeWidth={2} />
                                                            <span className="text-[0.765rem] font-bold">{getLocalizedContent(tag.name, defaultLanguage) as any}</span>
                                                            <X className="w-2 h-2 opacity-60" />
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Shout + media input — replaced with CreatePost */}
                                <div className={`mt-3 overflow-hidden rounded-[22px] border ${dark ? 'cv-card-surface-soft border-white/10' : 'border-white/70 bg-white/80'}`}>
                                    <CreatePost
                                        title="CheckIn"
                                        postKind="checkin"
                                        extras={{ tags: selectedTags }}
                                        buttonText="CheckIn"
                                        fullScreen={false}
                                        placeholder="Ne söylemek istersin?"
                                        canClose={false}
                                        onPostCreated={() => {
                                            setIsModalOpen(false);
                                            void fetchCheckIns();
                                        }}
                                    />
                                </div>

                     
                            </div>
                        </motion.div>
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
