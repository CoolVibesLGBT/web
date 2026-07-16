import { useState, useEffect, useCallback, useMemo } from 'react';
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
import type * as Leaflet from 'leaflet';
import { useNavigate, useLocation } from '@/router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useApp } from '../contexts/AppContext';
import { tagNameToColor } from '../helpers/colors';
import CreatePost from '../features/post/CreatePost';
import { getLocalizedContent } from '../helpers/helpers';
import Post from '../features/post/Post';
import { PostSkeleton } from '../features/post/Flows';
import useLeafletReady from '../features/map/Map/useLeafletReady';
import { useAtom, useSetAtom } from 'jotai';
import { checkinsStateAtom, fetchCheckinsAtom } from '@/state/checkins';

type ReactLeafletModule = typeof import('react-leaflet');

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

const createUserIcon = (leaflet: typeof import('leaflet') | null, avatar: string, isSelf = false): Leaflet.DivIcon | undefined => {
    if (!leaflet) {
        return undefined;
    }
    return leaflet.divIcon({
        className: '',
        html: `
          <div style="position:relative;width:48px;height:48px;display:flex;align-items:center;justify-content:center;transition:transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);">
            <div style="width:42px;height:42px;border-radius:50%;overflow:hidden;border:2.5px solid ${isSelf ? '#8b5cf6' : '#ffffff'};box-shadow:0 6px 16px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05);background-color:#f3f4f6;">
              <img src="${avatar}" style="width:100%;height:100%;object-fit:cover;" referrerpolicy="no-referrer" onerror="this.src='https://i.pravatar.cc/150?u=a'"/>
            </div>
            ${isSelf ? `<div style="position:absolute;bottom:1px;right:1px;width:14px;height:14px;border-radius:50%;background:#10b981;border:2.5px solid #ffffff;box-shadow:0 2px 5px rgba(0,0,0,0.2);"></div>` : `<div style="position:absolute;bottom:2px;right:2px;width:12px;height:12px;border-radius:50%;background:#10b981;border:2px solid #ffffff;box-shadow:0 2px 4px rgba(0,0,0,0.2);"></div>`}
          </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
    });
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
                 style={tagNameToColor(tag.tag)}

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
                <span className={`text-[10px] font-black uppercase tracking-tight text-center px-1 leading-none transition-colors duration-250 ${isSelected ? 'text-white' : dark ? 'text-gray-300' : 'text-gray-600'}`}>
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
    const [leafletComponents, setLeafletComponents] = useState<ReactLeafletModule | null>(null);
    const isLeafletReady = useLeafletReady();
    const leaflet = (isLeafletReady && typeof window !== 'undefined'
        ? ((window as any).L as typeof import('leaflet'))
        : null);
    const MapContainer = leafletComponents?.MapContainer;
    const TileLayer = leafletComponents?.TileLayer;
    const Marker = leafletComponents?.Marker;
    const Popup = leafletComponents?.Popup;
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
        color: tagByTagNameToColor(tag.tag).background?.toString() || '#8b5cf6'
    } as CheckInTag));

    function tagByTagNameToColor(tag: string) {
        return tagNameToColor(tag) as any;
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

    useEffect(() => {
        if (typeof window === 'undefined') return;
        let active = true;
        import('react-leaflet')
            .then((mod) => {
                if (active) setLeafletComponents(mod);
            })
            .catch((error) => {
                console.error('Failed to load react-leaflet', error);
            });
        return () => {
            active = false;
        };
    }, []);

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
                setCheckInViewMode(viewMode);
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
    const checkinColumns = useMemo(() => {
        return [0, 1, 2].map(columnIndex =>
            posts.filter((_, postIndex) => postIndex % 3 === columnIndex)
        );
    }, [posts]);

    let mapContent = <div className={`h-full w-full ${dark ? 'cv-card-surface-solid' : 'bg-gray-100'}`} />;
    if (MapContainer && TileLayer && Marker && Popup) {
        mapContent = (
            <MapContainer
                center={userLocation}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                attributionControl={false}
            >
                <TileLayer
                    url={dark
                        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
                    }
                />
                {leaflet && (
                    <>
                        <Marker position={userLocation} icon={createUserIcon(leaflet, 'https://i.pravatar.cc/150?u=me', true)} />
                        {posts.map(p => {
                            const postExtras = p.extras as any;
                            const hasTags = postExtras?.tags && postExtras.tags.length > 0;
                            const firstTag = hasTags ? checkinTags.find(t => t.tag === postExtras.tags[0]) : null;
                            const TagIcon = firstTag?.icon || MapPin;

                            return (
                                p.location && <Marker key={p.id} position={[p.location.latitude, p.location.longitude]} icon={createUserIcon(leaflet, p.author.avatar?.variants?.image?.thumbnail?.url || p.author.avatar?.url || 'https://i.pravatar.cc/150?u=a')}>
                                    <Popup className="custom-popup" closeButton={false}>
                                        <div className="flex flex-col min-w-[150px] max-w-[220px]">
                                            <div className="p-3.5">
                                                <div className="flex items-center gap-2.5 mb-2">
                                                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-gray-100 border border-black/5 shadow-sm">
                                                        <img src={p.author.avatar?.variants?.image?.thumbnail?.url || p.author.avatar?.url || `https://i.pravatar.cc/150?u=${p.author_id}`} alt="avatar" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className={`text-[13px] font-bold truncate leading-tight tracking-tight ${dark ? 'text-white' : 'text-gray-900'}`}>{p.author.displayname}</h4>
                                                        <p className={`text-[11px] font-medium truncate leading-tight ${dark ? 'text-gray-400' : 'text-gray-500'}`}>@{p.author.username}</p>
                                                    </div>
                                                </div>

                                                {hasTags && firstTag && (
                                                    <div className="flex items-center gap-1.5 mt-2.5 mb-2">
                                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border" style={{ ...tagNameToColor(firstTag.tag), background: 'transparent', color: (tagNameToColor(firstTag.tag) as any).background, borderColor: dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }}>
                                                            <TagIcon className="w-3.5 h-3.5" />
                                                            <span className="text-[10px] font-bold uppercase tracking-wider">{getLocalizedContent(firstTag.name, defaultLanguage) as any}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {p.content && (
                                                    <p className={`text-[12px] leading-relaxed mt-2 line-clamp-3 font-medium ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                        {getLocalizedContent(p.content, defaultLanguage) as any}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </>
                )}
            </MapContainer>
        );
    }

    return (
        <div className={`relative ${isMapView ? 'h-full overflow-hidden' : 'skyline-page-scroll'} w-full font-sans ${dark ? 'text-white' : 'text-slate-950'}`}>
            {isMapView && (
                <div className="fixed inset-0 z-0 h-full w-full">
                    {mapContent}
                </div>
            )}

            <div className={`relative z-10 flex flex-col ${isMapView ? 'h-full pointer-events-none px-1 pt-24 md:px-2 md:pt-28' : 'px-1 pb-8 pt-24 md:px-2 md:pt-28'}`}>
                <div className="pointer-events-auto z-50 mx-auto w-full max-w-7xl px-1 md:px-2 lg:hidden">
                    <motion.section
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        className="relative"
                    >
                        <div className={`${isMapView ? 'flex h-14 flex-nowrap items-center gap-2 overflow-hidden' : 'flex min-h-[50px] flex-nowrap items-center gap-2 overflow-hidden border-b pb-2'} ${isMapView
                            ? dark
                                ? 'cv-card-surface-soft rounded-[24px] border border-white/10 px-2 backdrop-blur-3xl shadow-[0_18px_60px_-42px_rgba(0,0,0,0.9)]'
                                : 'rounded-[24px] border border-white/70 bg-white/75 px-2 backdrop-blur-3xl shadow-[0_18px_60px_-42px_rgba(15,23,42,0.55)]'
                            : dark
                                ? 'border-white/10'
                                : 'border-slate-200/80'
                            }`}>
                            <div className={`flex min-w-0 flex-1 items-center gap-1 overflow-x-auto rounded-full p-1 no-scrollbar ${dark ? 'bg-white/[0.04]' : 'bg-slate-100/85'}`}>
                                <button
                                    type="button"
                                    onClick={() => setCheckInViewMode('map')}
                                    className={`flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full px-3 text-[10px] font-black uppercase tracking-[0.14em] transition-all ${isMapView
                                        ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/25'
                                        : dark
                                            ? 'text-zinc-500 hover:bg-white/10 hover:text-white'
                                            : 'text-slate-500 hover:bg-white hover:text-slate-950'
                                        }`}
                                    title={t('nearby.view_map')}
                                >
                                    <MapIcon className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">{t('nearby.view_map')}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCheckInViewMode('list')}
                                    className={`flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full px-3 text-[10px] font-black uppercase tracking-[0.14em] transition-all ${!isMapView
                                        ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/25'
                                        : dark
                                            ? 'text-zinc-500 hover:bg-white/10 hover:text-white'
                                            : 'text-slate-500 hover:bg-white hover:text-slate-950'
                                        }`}
                                    title={t('nearby.view_list', { defaultValue: 'List' })}
                                >
                                    <List className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">{t('nearby.view_list', { defaultValue: 'List' })}</span>
                                </button>
                            </div>

                            <div className="ml-auto flex shrink-0 items-center gap-2">
                                <div className={`hidden h-9 shrink-0 items-center gap-2 rounded-full px-3 text-[10px] font-black uppercase tracking-[0.14em] sm:flex ${dark ? 'bg-white/[0.04] text-zinc-400' : 'bg-white/70 text-slate-500'}`}>
                                    <MapPin className="h-3.5 w-3.5" />
                                    <span>{isMapView ? t('nearby.view_map') : t('nearby.view_list', { defaultValue: 'List' })}</span>
                                </div>
                                <div className={`flex h-9 shrink-0 items-center rounded-full px-3 text-[10px] font-black uppercase tracking-[0.14em] ${dark ? 'bg-white/[0.04] text-zinc-400' : 'bg-white/70 text-slate-500'}`}>
                                    {posts.length}
                                </div>
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
                    </motion.section>
                </div>

                {!isMapView && (
                    <div className="pointer-events-auto mx-auto w-full max-w-7xl px-0 pt-4 md:px-1">
                        {loading ? (
                            <div className="flex items-start justify-center gap-6 px-1 md:gap-8">
                                {[0, 1, 2].map((columnIndex) => (
                                    <div
                                        key={columnIndex}
                                        className={`flex-col flex-1 gap-6 md:gap-8 min-w-0 max-w-[420px] ${columnIndex === 0 ? 'flex' : columnIndex === 1 ? 'hidden sm:flex' : 'hidden lg:flex'}`}
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
                            <div className={`mx-auto max-w-xl rounded-[30px] border p-10 text-center backdrop-blur-3xl ${panelClassName}`}>
                                <p className="text-sm font-black text-red-500">{error}</p>
                            </div>
                        ) : posts.length === 0 ? (
                            <div className={`mx-auto flex min-h-[340px] max-w-xl flex-col items-center justify-center rounded-[30px] border p-10 text-center backdrop-blur-3xl ${panelClassName}`}>
                                <div className="sky-glow mb-5 flex h-14 w-14 items-center justify-center rounded-full text-white">
                                    <MapPin className="h-7 w-7" />
                                </div>
                                <p className={`text-sm font-black ${dark ? 'text-zinc-300' : 'text-slate-600'}`}>{t('nearby.no_matches_found')}</p>
                            </div>
                        ) : (
                            <div className="flex items-start justify-center gap-6 px-1 md:gap-8">
                                {checkinColumns.map((column, columnIndex) => (
                                    <div
                                        key={columnIndex}
                                        className={`flex-col flex-1 gap-6 md:gap-8 min-w-0 max-w-[420px] ${columnIndex === 0 ? 'flex' : columnIndex === 1 ? 'hidden sm:flex' : 'hidden lg:flex'}`}
                                    >
                                        {column.map(p => (
                                            <div key={p.id} className="skyline-feed-card elite-card overflow-hidden">
                                                <Post
                                                    post={p}
                                                    onProfileClick={handleProfileClick}
                                                    onPostClick={(postId) => handleCheckinClick(postId)}
                                                />
                                            </div>
                                        ))}
                                    </div>
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
                                ${dark ? 'bg-slate-950/96 text-white' : 'bg-sky-50/95 text-slate-950'}
                                backdrop-blur-3xl
                            `}
                        >
                            <div className={`mx-3 mt-[calc(env(safe-area-inset-top)+0.75rem)] shrink-0 rounded-[26px] border px-3 py-2 backdrop-blur-3xl md:mx-auto md:w-full md:max-w-3xl ${panelClassName} shadow-[0_24px_80px_-48px_rgba(15,23,42,0.7)]`}>
                                <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-sky-500/50 to-transparent" />
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="sky-glow flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white">
                                            <MapPin className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-[9px] font-black uppercase tracking-[0.3em] text-sky-600">
                                                {t('app.nav.checkin', { defaultValue: 'Check-in' })}
                                            </p>
                                            <div className="mt-0.5 flex items-center gap-2">
                                                <h2 className="truncate text-base font-black leading-none tracking-tight md:text-lg">
                                                    Durumunu seç
                                                </h2>
                                                {selectedTags.length > 0 && (
                                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${dark ? 'bg-white/[0.08] text-zinc-300' : 'bg-slate-100 text-slate-500'}`}>
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
                                <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-[0.18em] px-3 py-1 rounded-full pointer-events-none ${dark ? 'text-gray-600 bg-gray-900/60' : 'text-gray-400 bg-gray-100/80'}`}>
                                    Sürükle &amp; Seç
                                </div>
                            </div>

                            {/* Bottom panel */}
                            <div className={`mx-3 mb-[calc(env(safe-area-inset-bottom)+0.75rem)] max-h-[48vh] shrink-0 overflow-y-auto rounded-[28px] border p-3 backdrop-blur-3xl no-scrollbar md:mx-auto md:w-full md:max-w-3xl ${panelClassName}`}>

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
                                                                <span className="text-[10px] font-bold">{t}</span>
                                                                <X className="w-2 h-2 opacity-60" />
                                                            </button>
                                                        );
                                                    }
                                                    const Icon = tag.icon;
                                                    return (
                                                        <button
                                                            key={t}
                                                            onClick={() => toggleTag(t)}
                                                            style={tagNameToColor(tag.tag) as any}
                                                            className="flex items-center gap-1.5 rounded-xl px-2 py-1 text-white"
                                                        >
                                                            <Icon className="w-3 h-3" strokeWidth={2} />
                                                            <span className="text-[10px] font-bold">{getLocalizedContent(tag.name, defaultLanguage) as any}</span>
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
