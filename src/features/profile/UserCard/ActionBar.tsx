import { Heart, HeartOff, MessageCircleHeart, ShieldBan } from "lucide-react";
import { useEffect, useState } from "react";
import { BlockIcon, DislikeIcon, LikeIcon } from "./icons";

interface ActionBarProps {
  liked: boolean;
  disliked: boolean,
  blocked: boolean,
  viewMode: 'compact' | 'list' | 'card' | 'bubble',
  onLikeToggle: () => void;
  onDislikeToggle: () => void;
  onBlockToggle: () => void;
  onOpenGiftSelector: () => void;
  onOpenQuickMessageSelector: () => void;
  baseButtonStyle: string;
  onTriggerOverlay: (type: BurstType) => void;
}



export type BurstType = 'like' | 'dislike' | 'block';

type BurstIconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

interface OverlayParticle {
  id: string;
  x: number;
  y: number;
  rotate: number;
  Icon: BurstIconComponent;
  color: string;
}

interface OverlayConfetti {
  id: string;
  x: number;
  y: number;
  size: number;
  color: string;
  rotate: number;
  driftX: number;
  driftY: number;
  duration: number;
  delay: number;
  shape: 'circle' | 'square' | 'triangle';
}

export interface BurstOverlayState {
  type: BurstType;
  key: number;
  particles: OverlayParticle[];
  confetti: OverlayConfetti[];
  streaks: OverlayStreak[];
}

export const burstConfig: Record<BurstType, {
  Icon: BurstIconComponent;
  color: string;
  gradient: string;
}> = {
  like: {
    Icon: LikeIcon,
    color: 'text-red-500',
    gradient: 'radial-gradient(circle at center, rgba(244,63,94,0.35) 0%, rgba(244,63,94,0) 70%)',
  },
  dislike: {
    Icon: DislikeIcon,
    color: 'text-rose-500',
    gradient: 'radial-gradient(circle at center, rgba(244,114,182,0.32) 0%, rgba(244,114,182,0) 70%)',
  },
  block: {
    Icon: BlockIcon,
    color: 'text-blue-400',
    gradient: 'radial-gradient(circle at center, rgba(59,130,246,0.28) 0%, rgba(59,130,246,0) 70%)',
  },
};

export const createOverlayParticles = (type: BurstType, key: number): OverlayParticle[] => {
  const { Icon, color } = burstConfig[type];
  const particleCount = 18;

  return Array.from({ length: particleCount }, (_, index) => {
    const angle = (360 / particleCount) * index + Math.random() * 20;
    const distance = 160 + Math.random() * 160;
    const rad = (angle * Math.PI) / 180;

    return {
      id: `${type}-overlay-${key}-${index}`,
      x: Math.cos(rad) * distance,
      y: Math.sin(rad) * distance,
      rotate: angle + Math.random() * 180,
      Icon,
      color,
    };
  });
};

export const createOverlayConfetti = (type: BurstType, key: number): OverlayConfetti[] => {
  const palette: Record<BurstType, string[]> = {
    like: ['#F87171', '#FB7185', '#FDE68A', '#F97316', '#FBB6CE', '#F9A8D4'],
    dislike: ['#FB7185', '#F43F5E', '#FDA4AF', '#FECACA', '#FDE68A', '#F97316'],
    block: ['#60A5FA', '#38BDF8', '#818CF8', '#A5B4FC', '#FBBF24', '#22D3EE'],
  };
  const count = 32;
  return Array.from({ length: count }, (_, index) => {
    const angle = Math.random() * 360;
    const distance = 220 + Math.random() * 260;
    const rad = (angle * Math.PI) / 180;
    const driftAngle = Math.random() * 360;
    const driftRadius = 40 + Math.random() * 60;
    return {
      id: `${type}-confetti-${key}-${index}`,
      x: Math.cos(rad) * distance,
      y: Math.sin(rad) * distance,
      size: 8 + Math.random() * 14,
      color: palette[type][index % palette[type].length],
      rotate: Math.random() * 720,
      driftX: Math.cos(driftAngle) * driftRadius,
      driftY: Math.sin(driftAngle) * driftRadius,
      duration: 1.4 + Math.random() * 0.8,
      delay: (index % 5) * 0.05,
      shape: ['circle', 'square', 'triangle'][Math.floor(Math.random() * 3)] as OverlayConfetti['shape'],
    };
  });
};

interface OverlayStreak {
  id: string;
  angle: number;
  length: number;
  delay: number;
}

export const createOverlayStreaks = (type: BurstType, key: number): OverlayStreak[] => {
  const count = 12;
  return Array.from({ length: count }, (_, index) => ({
    id: `${type}-streak-${key}-${index}`,
    angle: (360 / count) * index + Math.random() * 15,
    length: 140 + Math.random() * 120,
    delay: 0.05 * index,
  }));
};






export const ActionBar: React.FC<ActionBarProps> = ({
  liked,
  disliked,
  blocked,
  onLikeToggle,
  onDislikeToggle,
  onBlockToggle,
  onOpenGiftSelector: _onOpenGiftSelector,
  onOpenQuickMessageSelector,
  baseButtonStyle,
  viewMode,
  onTriggerOverlay,
}) => {
  interface Particle {
    id: string;
    x: number;
    y: number;
    rotate: number;
    Icon: BurstIconComponent;
    color: string;
  }


  const [animation, setAnimation] = useState<{ type: BurstType; key: number } | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);

  const createButtonParticles = (type: BurstType): Particle[] => {
    const { Icon, color } = burstConfig[type];
    const particleCount = 12;
    const now = Date.now();

    return Array.from({ length: particleCount }, (_, index) => {
      const angle = (360 / particleCount) * index + Math.random() * 25;
      const distance = 60 + Math.random() * 50;
      const rad = (angle * Math.PI) / 180;

      return {
        id: `${type}-button-${now}-${index}`,
        x: Math.cos(rad) * distance,
        y: Math.sin(rad) * distance,
        rotate: angle + Math.random() * 90,
        Icon,
        color,
      };
    });
  };

  const triggerAnimation = (type: BurstType) => {
    const key = Date.now();
    setAnimation({ type, key });
    setParticles(createButtonParticles(type));
    onTriggerOverlay(type);
  };

  useEffect(() => {
    if (!animation) return;
    const timeout = setTimeout(() => setAnimation(null), 600);
    return () => clearTimeout(timeout);
  }, [animation]);

  useEffect(() => {
    if (!particles.length) return;
    const timeout = setTimeout(() => setParticles([]), 650);
    return () => clearTimeout(timeout);
  }, [particles]);

  const btnCls = "p-2.5 h-11 w-11 flex items-center justify-center rounded-xl cursor-pointer transition-colors";
  const iconCls = "w-5 h-5";
  const viewGridStyle = {
    "compact": "flex flex-row items-center justify-around",
    "card": "flex flex-row items-center justify-around",
    "list": "flex flex-col items-center justify-center h-full",
    "bubble": "flex flex-row items-center justify-around"
  };

  return (
    <div className={`relative w-full ${viewGridStyle[viewMode]}`}>
      {/* Message */}
      <button
        onClick={(e) => { e.stopPropagation(); onOpenQuickMessageSelector(); }}
        className={`${btnCls} ${baseButtonStyle}`}
        aria-label="Send Message"
      >
        <MessageCircleHeart className={iconCls} />
      </button>

      {/* Like */}
      <button
        onClick={(e) => { e.stopPropagation(); triggerAnimation('like'); onLikeToggle(); }}
        className={`${btnCls} ${liked ? "text-red-500 bg-red-500/10" : baseButtonStyle}`}
        aria-label="Like"
      >
        <Heart className={`${iconCls} ${liked ? 'fill-red-500' : ''}`} />
      </button>

      {/* Dislike */}
      <button
        onClick={(e) => { e.stopPropagation(); triggerAnimation('dislike'); onDislikeToggle(); }}
        className={`${btnCls} ${disliked ? "text-orange-500 bg-orange-500/10" : baseButtonStyle}`}
        aria-label="Dislike"
      >
        <HeartOff className={iconCls} />
      </button>

      {/* Block */}
      <button
        onClick={(e) => { e.stopPropagation(); triggerAnimation('block'); onBlockToggle(); }}
        className={`${btnCls} ${blocked ? "text-blue-500 bg-blue-500/10" : baseButtonStyle}`}
        aria-label="Block"
      >
        <ShieldBan className={iconCls} />
      </button>
    </div>
  );
};