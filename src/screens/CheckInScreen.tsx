import { useState, useEffect } from 'react';
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
    Minimize2,
    Maximize2,
    Minus,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useTheme } from '../contexts/ThemeContext';
import 'leaflet/dist/leaflet.css';
import { useApp } from '../contexts/AppContext';
import { tagNameToColor } from '../helpers/colors';
import CreatePost from '../features/post/CreatePost';
import { getLocalizedContent } from '../helpers/helpers';
import { api } from '../services/api';
import Post, { ApiPost } from '../features/post/Post';
import { PostSkeleton } from '../features/post/Flows';

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

const createUserIcon = (avatar: string, isSelf = false) => {
    return L.divIcon({
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
        color: tagByTagNameToColor(tag.tag).background?.toString() || '#8b5cf6'
    } as CheckInTag));

    function tagByTagNameToColor(tag: string) {
        return tagNameToColor(tag) as any;
    }

    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [posts, setPosts] = useState<ApiPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<[number, number]>([41.0082, 28.9784]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [sheetMode, setSheetMode] = useState<'min' | 'half' | 'full'>('half');
    // useMotionValue — drag sırasında lag yok, centerOnItem'da animate() ile smooth spring
    const dragX = useMotionValue(0);
    const dragY = useMotionValue(0);

    const fetchCheckIns = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.fetchCheckIns({ limit: 50 }) as any;
            if (response && response.posts) {
                setPosts(response.posts);
            }
        } catch (err) {
            console.error('Error fetching check-ins:', err);
            setError('Failed to load check-ins. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCheckIns();
    }, []);

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


    const sheetVariants = {
        full: { y: '0vh' },
        half: { y: '45vh' },
        min: { y: '82vh' },
    };

    return (
        <div className={`relative h-full w-full overflow-hidden font-sans ${dark ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>

            {/* ── Map ── */}
            <div className="absolute inset-0 z-0">
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
                    <Marker position={userLocation} icon={createUserIcon('https://i.pravatar.cc/150?u=me', true)} />
                    {posts.map(p => {
                        const postExtras = p.extras as any;
                        const hasTags = postExtras?.tags && postExtras.tags.length > 0;
                        const firstTag = hasTags ? checkinTags.find(t => t.tag === postExtras.tags[0]) : null;
                        const TagIcon = firstTag?.icon || MapPin;
                        
                        return (
                            p.location && <Marker key={p.id} position={[p.location.latitude, p.location.longitude]} icon={createUserIcon(p.author.avatar?.variants?.image?.thumbnail?.url || p.author.avatar?.url || 'https://i.pravatar.cc/150?u=a')}>
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
                </MapContainer>
            </div>

            {/* ── UI overlay ── */}
            <div className="absolute inset-0 z-20 pointer-events-none">

                {/* FAB — Check-in button */}
                <AnimatePresence>
                    {!isModalOpen && (
                        <motion.div
                            initial={{ scale: 0, y: 15, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0, y: 15, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            className="absolute bottom-[47vh] md:bottom-[52vh] right-5 z-[110] pointer-events-auto flex flex-col items-center gap-2"
                        >
                            <motion.button
                                whileHover={{ scale: 1.06 }}
                                whileTap={{ scale: 0.94 }}
                                onClick={() => setIsModalOpen(true)}
                                className={`
                                    relative w-14 h-14 rounded-full flex items-center justify-center
                                    bg-emerald-500 text-white shadow-[0_8px_24px_rgba(16,185,129,0.35)] overflow-hidden
                                `}
                            >
                                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
                                <div className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                <MapPin className="relative z-10 w-6 h-6 drop-shadow-sm" fill="currentColor" strokeWidth={1.5} />
                            </motion.button>
                            <div className={`
                                whitespace-nowrap text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full
                                ${dark ? 'bg-gray-900/80 text-gray-300 border border-white/10 shadow-lg mt-0.5' : 'bg-white/90 text-gray-600 border border-black/5 shadow-md mt-0.5'}
                                backdrop-blur-md
                            `}>
                                Check-in
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Bottom Sheet ── */}
                <motion.div
                    drag="y"
                    dragDirectionLock
                    dragConstraints={{ top: 0, bottom: 1000 }}
                    dragElastic={0.3}
                    dragMomentum={false}
                    onDragEnd={(_, info) => {
                        const v = info.velocity.y;
                        const o = info.offset.y;
                        if (v > 400 || o > 80) {
                            setSheetMode(prev => prev === 'full' ? 'half' : 'min');
                        } else if (v < -400 || o < -80) {
                            setSheetMode(prev => prev === 'min' ? 'half' : 'full');
                        }
                    }}
                    variants={sheetVariants}
                    initial="half"
                    animate={sheetMode}
                    transition={{ type: 'spring', stiffness: 380, damping: 38, mass: 0.9 }}
                    className={`
                        absolute inset-x-0 bottom-0 h-[100vh] pointer-events-auto
                        ${dark ? 'bg-gray-950/96 border-white/[0.07]' : 'bg-white/97 border-black/[0.06]'}
                        backdrop-blur-3xl border-t rounded-t-[28px] flex flex-col z-[200]
                        shadow-[0_-8px_40px_rgba(0,0,0,0.12)]
                    `}
                >
                    {/* Drag handle */}
                    <div className="flex justify-center pt-2.5 pb-1 cursor-grab active:cursor-grabbing touch-none">
                        <div className={`w-8 h-[3px] rounded-full ${dark ? 'bg-white/15' : 'bg-gray-200'}`} />
                    </div>

                    {/* Sheet header */}
                    <div className={`px-4 pb-2 pt-1 flex items-center justify-between border-b ${dark ? 'border-white/[0.05]' : 'border-black/[0.05]'}`}>
                        <div className="flex items-center gap-2.5">
                            <span className={`text-[15px] font-black tracking-tight ${dark ? 'text-white' : 'text-gray-900'}`}>
                                Howls
                            </span>
                            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${dark ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className={`text-[9px] font-black uppercase tracking-[0.12em] ${dark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                    {posts.length}
                                </span>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className={`flex items-center gap-0.5 p-0.5 rounded-full ${dark ? 'bg-gray-900/60 border border-white/[0.06]' : 'bg-gray-100 border border-black/[0.05]'}`}>
                            {(['min', 'half', 'full'] as const).map((mode, i) => {
                                const icons = [Minimize2, Minus, Maximize2];
                                const Icon = icons[i];
                                const active = sheetMode === mode;
                                return (
                                    <button
                                        key={mode}
                                        onClick={e => { e.stopPropagation(); setSheetMode(mode); }}
                                        className={`
                                            w-7 h-7 rounded-full flex items-center justify-center transition-all
                                            ${active
                                                ? dark ? 'bg-white text-black' : 'bg-gray-900 text-white'
                                                : dark ? 'text-gray-500 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-800 hover:bg-black/[0.06]'
                                            }
                                        `}
                                    >
                                        <Icon className="w-3 h-3" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Cards list */}
                    <div className="flex-1 overflow-y-auto space-y-2 pb-24 lg:pb-6 no-scrollbar">
                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => <PostSkeleton key={i} theme={dark ? 'dark' : 'light'} />)}
                            </div>
                        ) : error ? (
                            <div className="text-center py-10">
                                <p className="text-red-500">{error}</p>
                            </div>
                        ) : posts.map(p => (
                            <Post key={p.id} post={p} />
                        ))}
                    </div>
                </motion.div>
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
                                absolute inset-0 z-[300] flex flex-col
                                ${dark ? 'bg-gray-950/98' : 'bg-white/98'}
                                backdrop-blur-2xl
                            `}
                        >
                            {/* Close + title */}
                            <div className={`flex items-center justify-between px-5 pt-12 pb-3 lg:pt-5`}>
                                <div>
                                    <h2 className={`text-[17px] font-black tracking-tight ${dark ? 'text-white' : 'text-gray-900'}`}>
                                        Check-in
                                    </h2>
                                    <p className={`text-[11px] mt-0.5 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        Durumunu seç ve paylaş
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${dark ? 'bg-white/[0.07] hover:bg-white/[0.14] text-gray-300' : 'bg-black/[0.05] hover:bg-black/[0.10] text-gray-600'}`}
                                >
                                    <X className="w-4.5 h-4.5" />
                                </button>
                            </div>

                            {/* Draggable honeycomb area */}
                            <div className="flex-1 relative overflow-hidden">
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
                            <div className={`px-5 pt-3 pb-4 border-t ${dark ? 'border-white/[0.06]' : 'border-black/[0.05]'} flex flex-col gap-3`}>

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

                                                  
                                                            className={`flex items-center gap-1.5 px-2 py-1 rounded-xl text-white`}
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
                                <div className="pt-2">
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
                                            fetchCheckIns();
                                        }}
                                    />
                                </div>

                     
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Popup styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
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
                .pb-safe { padding-bottom: max(1rem, env(safe-area-inset-bottom)); }
            `}} />
        </div>
    );
}
