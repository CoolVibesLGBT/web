import React, { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { random } from '../../../helpers/helpers';
import { Ban, Heart, MessageCircle, Plus, X } from './Icons';
import { BurstType, BurstOverlayState, BurstParticle, BurstConfetti, BurstStreak } from '../../../types/custom';

// --- ANIMATION CONFIG ---
export const burstConfig: Record<BurstType, { Icon: React.ComponentType<{ className?: string; strokeWidth?: number; fill?: string }>; color: string; gradient: string }> = {
    [BurstType.LIKE]: {
        Icon: Heart,
        color: 'text-red-500',
        gradient: 'radial-gradient(circle, rgba(255,82,82,0.3) 0%, rgba(255,82,82,0) 60%)',
    },
    [BurstType.DISLIKE]: {
        Icon: X,
        color: 'text-gray-400',
        gradient: 'radial-gradient(circle, rgba(156,163,175,0.3) 0%, rgba(156,163,175,0) 60%)',
    },
    [BurstType.BLOCK]: {
        Icon: Ban,
        color: 'text-yellow-500',
        gradient: 'radial-gradient(circle, rgba(234,179,8,0.3) 0%, rgba(234,179,8,0) 60%)',
    },
};

const particleIcons = [Heart];
const particleColors = ['text-red-500', 'text-pink-500', 'text-rose-500', 'text-white'];
const confettiColors = ['#ef4444', '#ec4899', '#f97316', '#eab308', '#ffffff'];

export const createOverlayParticles = (_type: BurstType, key: number) => Array.from({ length: 12 }).map((_, i) => {
    const angle = (i / 12) * 360;
    const radius = random(100, 160);
    return {
        id: `p-${key}-${i}`,
        x: Math.cos(angle * (Math.PI / 180)) * radius,
        y: Math.sin(angle * (Math.PI / 180)) * radius,
        rotate: random(-30, 30),
        Icon: particleIcons[i % particleIcons.length],
        color: particleColors[i % particleColors.length],
    };
});

export const createOverlayConfetti = (_type: BurstType, key: number) => Array.from({ length: 30 }).map((_, i) => {
    const angle = random(0, 360);
    const radius = random(50, 250);
    const drift = 50;
    return {
        id: `c-${key}-${i}`,
        x: Math.cos(angle * (Math.PI / 180)) * radius,
        y: Math.sin(angle * (Math.PI / 180)) * radius,
        size: random(6, 14),
        color: confettiColors[i % confettiColors.length],
        rotate: random(0, 360),
        driftX: random(-drift, drift),
        driftY: random(-drift, drift),
        duration: random(0.8, 1.5),
        delay: random(0, 0.3),
        shape: ['square', 'circle', 'triangle'][i % 3] as 'square' | 'circle' | 'triangle',
    };
});

export const createOverlayStreaks = (_type: BurstType, key: number) => Array.from({ length: 6 }).map((_, i) => ({
    id: `s-${key}-${i}`,
    angle: random(0, 360),
    length: random(200, 400),
    delay: random(0, 0.4),
}));

// --- ACTION BAR COMPONENT ---
interface ActionBarProps {
    avatarUrl: string;
    onLike: () => void;
    onMessage: () => void;
    openProfile : () => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({ avatarUrl, onLike, onMessage,openProfile }) => {
    const [overlay, setOverlay] = useState<BurstOverlayState | null>(null);
    const [isOverlayReady, setIsOverlayReady] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsOverlayReady(true), 0);
        return () => clearTimeout(timer);
    }, []);
    useEffect(() => {
        if (!overlay) return;
        const timeout = setTimeout(() => setOverlay(null), 2600);
        return () => clearTimeout(timeout);
    }, [overlay]);

    const handleTriggerOverlay = useCallback((type: BurstType) => {
        const now = Date.now();
        setOverlay({
            type,
            key: now,
            particles: createOverlayParticles(type, now),
            confetti: createOverlayConfetti(type, now),
            streaks: createOverlayStreaks(type, now),
        });
    }, []);
    
    const createHandler = (action: () => void, type: BurstType) => () => {
        action();
        handleTriggerOverlay(type);
    };

    const portalRoot = typeof document !== 'undefined' ? document.body : null;

    return (
        <>
            <div className="flex flex-col items-center justify-end gap-5 text-white">
                <div onClick={()=>{
                         openProfile()
                }} className="relative mb-2">
                    <img src={avatarUrl} className="w-14 h-14 rounded-full border-2 border-white object-cover bg-gray-700" alt="User avatar" />
                    <button onClick={()=>{
                        openProfile()
                    }} className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center border-2 border-black hover:bg-rose-600 transition-colors" aria-label="Follow user">
                        <Plus className="w-4 h-4 text-white" strokeWidth={3} />
                    </button>
                </div>
                
                <ActionButton icon={Heart} label="Like" onClick={createHandler(onLike, BurstType.LIKE)} />
                <ActionButton icon={MessageCircle} label="Message" onClick={onMessage} />

              
                {/* <ActionButton icon={Share} label="Share" onClick={onShare} /> */}

                {/* <div className="relative">
                    <button onClick={() => setShowMoreMenu(prev => !prev)} className="flex flex-col items-center gap-1.5 transition-transform hover:scale-110" aria-label="More options">
                        <MoreHorizontal className="w-9 h-9 drop-shadow-md" />
                    </button>
                    <AnimatePresence>
                        {showMoreMenu && (
                            <motion.div 
                                className="absolute bottom-full right-0 mb-2 w-48 bg-gray-800/90 backdrop-blur-md rounded-lg shadow-xl overflow-hidden"
                                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                transition={{ duration: 0.2, ease: 'easeOut' }}
                            >
                                <button onClick={() => { createHandler(onBlock, BurstType.BLOCK)(); setShowMoreMenu(false); }} className="w-full flex items-center px-4 py-3 text-left text-sm text-white hover:bg-red-500/50 transition-colors">
                                    <Ban className="w-5 h-5 mr-3 text-yellow-500" />
                                    <span>Block User</span>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div> */}
            </div>
            {portalRoot && isOverlayReady && overlay && createPortal(<BurstOverlay overlay={overlay} />, portalRoot)}
        </>
    );
};

// --- HELPER COMPONENTS ---
const ActionButton: React.FC<{ icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void; }> = ({ icon: Icon, label, onClick }) => (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 transition-transform hover:scale-110" aria-label={label}>
        <Icon className="w-9 h-9 drop-shadow-md" />
        <span className="text-xs font-semibold">{label}</span>
    </button>
);

const BurstOverlay: React.FC<{ overlay: BurstOverlayState }> = ({ overlay }) => {
    return (
        <AnimatePresence>
            <motion.div
                key={`overlay-${overlay.key}`}
                className="fixed inset-0 z-[999] pointer-events-none flex items-center justify-center overflow-hidden"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }}
            >
                <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />
                <motion.div className="absolute inset-0" style={{ background: burstConfig[overlay.type].gradient }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, ease: 'easeOut' }} />
                <motion.div className="absolute inset-0" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: [0.6, 1.05, 1], opacity: [0, 0.6, 0] }} exit={{ opacity: 0 }} transition={{ duration: 0.8, ease: 'easeOut' }} style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 65%)' }} />
                
                <div className="relative z-[1] flex flex-col items-center justify-center gap-8">
                     {overlay.streaks.map(({ id, angle, length, delay }: BurstStreak) => (
                        <motion.span key={id} className="absolute origin-center" style={{ width: length, height: 2, background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.85) 45%, rgba(255,255,255,0.05) 100%)', rotate: `${angle}deg` }} initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 1.05, 0.8], opacity: [0, 0.85, 0] }} transition={{ duration: 1.1, ease: 'easeOut', delay, repeat: Infinity, repeatType: 'loop' }} />
                    ))}
                    <motion.div className="relative" initial={{ scale: 0.2, opacity: 0, rotate: -25 }} animate={{ scale: [0.2, 1.25, 1], opacity: [0, 1, 1], rotate: 0 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.55, ease: 'easeOut' }}>
                        <motion.div animate={{ scale: [1, 1.12, 1], rotate: [0, 3, -3, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }} className="rounded-full drop-shadow-[0_0_65px_rgba(255,255,255,0.45)]">
                            {React.createElement(burstConfig[overlay.type].Icon, { className: `h-32 w-32 ${burstConfig[overlay.type].color}`, strokeWidth: 1.4, fill: 'currentColor' })}
                        </motion.div>
                    </motion.div>
                    {overlay.particles.map(({ id, x, y, rotate, Icon, color }: BurstParticle) => (
                        <motion.span key={id} className="absolute drop-shadow-[0_0_22px_rgba(255,255,255,0.45)]" initial={{ opacity: 0, scale: 0, x: 0, y: 0, rotate: 0 }} animate={{ opacity: [0, 1, 0], scale: [0, 1.25, 0.65], x, y, rotate: rotate + 120 }} exit={{ opacity: 0, scale: 0, x: x * 1.05, y: y * 1.05 }} transition={{ duration: 0.95, ease: 'easeOut' }}>
                            <Icon className={`h-12 w-12 ${color}`} strokeWidth={1.2} fill="currentColor" />
                        </motion.span>
                    ))}
                    {overlay.confetti.map(({ id, x, y, size, color, rotate, driftX, driftY, duration, delay, shape }: BurstConfetti) => (
                        <motion.span key={id} className={`absolute left-1/2 top-1/2 shadow-[0_0_18px_rgba(255,255,255,0.35)]`} initial={{ opacity: 0, scale: 0.6, x: 0, y: 0, rotate: 0 }} animate={{ opacity: [0, 1, 0.8, 0], scale: [0.6, 1.05, 0.95, 0.6], x: [0, x * 0.6, x + driftX], y: [0, y * 0.6, y + driftY], rotate: [0, rotate * 0.6, rotate * 1.2] }} exit={{ opacity: 0, scale: 0.4, x: x * 1.05, y: y * 1.05 }} transition={{ duration, ease: 'easeInOut', delay, repeat: Infinity, repeatType: 'mirror' }} style={{ width: size, height: size, backgroundColor: color, mixBlendMode: 'screen', borderRadius: shape === 'circle' ? '9999px' : shape === 'square' ? '4px' : undefined, clipPath: shape === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : undefined }} />
                    ))}
                    <motion.div className="absolute -bottom-20 text-white text-3xl font-semibold uppercase tracking-[0.4rem]" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} transition={{ duration: 0.4, delay: 0.1 }}>
                        {overlay.type === BurstType.LIKE && 'LIKED'}
                        {overlay.type === BurstType.BLOCK && 'BLOCKED'}
                    </motion.div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
