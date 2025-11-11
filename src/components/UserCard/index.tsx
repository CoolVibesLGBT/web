import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, Gift, MapPin, HeartCrack, Shield } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import GiftSelector from '../GiftSelector';
import QuickMessages from '../QuickMessages';
import { calculateAge, getSafeImageURL } from '../../helpers/helpers';
import { Actions } from '../../services/actions';
import { api } from '../../services/api';
import { LikeIcon, DislikeIcon, ChatIcon, BlockIcon } from './icons';

type BurstType = 'like' | 'dislike' | 'block';

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

interface BurstOverlayState {
  type: BurstType;
  key: number;
  particles: OverlayParticle[];
  confetti: OverlayConfetti[];
  streaks: OverlayStreak[];
}

const burstConfig: Record<BurstType, {
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

const createOverlayParticles = (type: BurstType, key: number): OverlayParticle[] => {
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

const createOverlayConfetti = (type: BurstType, key: number): OverlayConfetti[] => {
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

const createOverlayStreaks = (type: BurstType, key: number): OverlayStreak[] => {
  const count = 12;
  return Array.from({ length: count }, (_, index) => ({
    id: `${type}-streak-${key}-${index}`,
    angle: (360 / count) * index + Math.random() * 15,
    length: 140 + Math.random() * 120,
    delay: 0.05 * index,
  }));
};

interface UserCardProps {
  user: any;
  viewMode?: 'compact' | 'list' | 'card';
}

const getLocation = (user: any): string => {
  if (user.location) {
    if (typeof user.location === 'string') {
      return user.location.trim();
    }
    if (typeof user.location === 'object') {
      return user.location.display?.trim() || '';
    }
  }
  return '';
};


interface ActionBarProps {
  liked: boolean;
  disliked: boolean,
  blocked: boolean,
  viewMode: 'compact' | 'list' | 'card',
  onLikeToggle: () => void;
  onDislikeToggle: () => void;
  onBlockToggle: () => void;
  onOpenGiftSelector: () => void;
  onOpenQuickMessageSelector: () => void;
  baseButtonStyle: string;
  onTriggerOverlay: (type: BurstType) => void;
}

const ActionBar: React.FC<ActionBarProps> = ({
  liked,
  disliked,
  blocked,
  onLikeToggle,
  onDislikeToggle,
  onBlockToggle,
  onOpenGiftSelector,
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

  const iconStyle = "h-8 w-8 min-h-8  min-w-8 max-h-8 max-w-8"
  const buttonStyle = "p-2 h-12 w-12 max-w-12 min-h-12 flex items-center justify-center"
  const viewGridStyle = {
    "compact": "grid grid-cols-2 py-2 ",
    "card": "grid grid-cols-4",
    "list": "grid sm:grid-cols-4 grid-cols-2"
  }
  return (
    <div className={`relative w-full ${viewGridStyle[viewMode]} justify-center place-items-center gap-2`}>
      <motion.button
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => {
          e.stopPropagation();
          onOpenQuickMessageSelector();
        }}
        className={`cursor-pointer rounded-full transition-all ${buttonStyle}  ${baseButtonStyle}`}
        aria-label="Send Message"
      >
        <ChatIcon className={iconStyle} />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => {
          e.stopPropagation();
          onOpenGiftSelector();
        }}
        className={`hidden cursor-pointer rounded-full transition-all ${buttonStyle} ${baseButtonStyle}`}
        aria-label="Send Gift"
      >
        <Gift className={iconStyle} />
      </motion.button>

      <div className="relative overflow-visible">
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            triggerAnimation('like');
            onLikeToggle();
          }}
          className={`cursor-pointer rounded-full transition-all ${buttonStyle} ${liked ? "text-red-500" : baseButtonStyle
            }`}
          aria-label="Like"
        >
          <LikeIcon className={iconStyle} />

        </motion.button>
        <AnimatePresence>
          {animation?.type === 'like' && (
            <motion.div
              key={`like-${animation.key}`}
              initial={{ opacity: 0, scale: 0.5, y: 0 }}
              animate={{ opacity: 0.9, scale: 1.6, y: -20 }}
              exit={{ opacity: 0, scale: 1.8, y: -30 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
            >
              <Heart className="h-9 w-9 text-red-500 drop-shadow-lg" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative overflow-visible">
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            triggerAnimation('dislike');
            onDislikeToggle();
          }}
          className={`cursor-pointer rounded-full transition-all ${buttonStyle} ${disliked ? "text-red-500" : baseButtonStyle
            }`}
          aria-label="Dislike"
        >
          <DislikeIcon className={iconStyle} />
        </motion.button>
        <AnimatePresence>
          {animation?.type === 'dislike' && (
            <motion.div
              key={`dislike-${animation.key}`}
              initial={{ opacity: 0, scale: 0.5, y: 0 }}
              animate={{ opacity: 0.9, scale: 1.6, y: -20 }}
              exit={{ opacity: 0, scale: 1.8, y: -30 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="pointer-events-none absolute inset-0 flex items-center justify-center text-red-500"
            >
              <HeartCrack className="h-9 w-9 drop-shadow-lg" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative overflow-visible">
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            triggerAnimation('block');
            onBlockToggle();
          }}
          className={`cursor-pointer rounded-full transition-all ${buttonStyle} ${blocked ? "text-red-500" : baseButtonStyle
            }`}
          aria-label="Block">
          <BlockIcon className={iconStyle} />

        </motion.button>
        <AnimatePresence>
          {animation?.type === 'block' && (
            <motion.div
              key={`block-${animation.key}`}
              initial={{ opacity: 0, scale: 0.5, y: 0 }}
              animate={{ opacity: 0.9, scale: 1.6, y: -20 }}
              exit={{ opacity: 0, scale: 1.8, y: -30 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="pointer-events-none absolute inset-0 flex items-center justify-center text-blue-400"
            >
              <Shield className="h-9 w-9 drop-shadow-lg" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {!!particles.length && (
          <motion.div
            key={`burst-${animation?.key ?? 'particles'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible z-10"
          >
            {particles.map(({ id, x, y, rotate, Icon, color }) => (
              <motion.span
                key={id}
                initial={{ opacity: 0, scale: 0, x: 0, y: 0, rotate: 0 }}
                animate={{ opacity: 1, scale: 1, x, y, rotate }}
                exit={{ opacity: 0, scale: 0.4, x: x * 1.1, y: y * 1.1, rotate: rotate + 45 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="absolute"
              >
                <Icon className={`h-5 w-5 drop-shadow-lg ${color}`} />
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const UserCard: React.FC<UserCardProps> = ({ user, viewMode = 'card' }) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [isGiftSelectorOpen, setIsGiftSelectorOpen] = useState(false);
  const [isQuickMessageSelectorOpen, setIsQuickMessageSelectorOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false)
  const [blocked, setIsBlocked] = useState(false)
  const [overlay, setOverlay] = useState<BurstOverlayState | null>(null);
  const [isOverlayReady, setIsOverlayReady] = useState(false);

  useEffect(() => {
    setIsOverlayReady(true);
  }, []);

  const getUsername = () =>
    user.username ||
    user.name?.toLowerCase().replace(/\s+/g, '') ||
    'profile';

  const handleProfileClick = () => {
    navigate(`/${getUsername()}`)
  };

  const handleSendMessage = async (profile: any) => {
    if (!user?.id || !profile?.id) {
      console.error('User or profile ID is missing');
      return;
    }

    try {
      // Create chat via API
      const chatResponse = await api.call<{
        chat: {
          id: string;
          type: string;
          participants?: Array<{
            user_id: string;
            user?: {
              id: string;
              username?: string;
              displayname?: string;
            };
          }>;
        };
        success: boolean;
      }>(Actions.CMD_CHAT_CREATE, {
        method: "POST",
        body: {
          type: 'private',
          participant_ids: [profile.id],
        },
      });

      const chatId = chatResponse?.chat?.id;

      if (chatId) {
        // Navigate to messages screen with chat ID
        navigate('/messages', {
          state: {
            openChat: chatId,
            userId: profile.id,
            publicId: profile.public_id,
            username: profile.username
          }
        });
      } else {
        console.error('Chat creation failed - no chat ID returned');
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      // Navigate anyway, MessagesScreen will handle creating a temporary chat
      navigate('/messages', {
        state: {
          openChat: profile.username || profile.id,
          userId: profile.id,
          publicId: profile.public_id
        }
      });
    }
  };

  const handleSendLike = async (user: any) => {
    //


    if (!user?.public_id) return;

    try {
      await api.call(Actions.CMD_USER_TOGGLE_LIKE, {
        method: 'POST',
        body: {
          likee_id: user.public_id,
        },
      });


    } catch (error) {
      console.error('Error toggling like:', error);
      // Optionally show error message to user
    }
  }

  const handleSendDislike = async (user: any) => {
    //


    if (!user?.public_id) return;

    try {
      await api.call(Actions.CMD_USER_TOGGLE_DISLIKE, {
        method: 'POST',
        body: {
          likee_id: user.public_id,
        },
      });


    } catch (error) {
      console.error('Error toggling like:', error);
      // Optionally show error message to user
    }
  }

  const handleBlock = async (user: any) => {
    //


    if (!user?.public_id) return;

    try {
      await api.call(Actions.CMD_USER_TOGGLE_BLOCK, {
        method: 'POST',
        body: {
          user_id: user.public_id,
        },
      });


    } catch (error) {
      console.error('Error toggling like:', error);
      // Optionally show error message to user
    }
  }

  const handleTriggerOverlay = (type: BurstType) => {
    const key = Date.now();
    setOverlay({
      type,
      key,
      particles: createOverlayParticles(type, key),
      confetti: createOverlayConfetti(type, key),
      streaks: createOverlayStreaks(type, key),
    });
  };

  useEffect(() => {
    if (!overlay) return;
    const timeout = setTimeout(() => setOverlay(null), 2600);
    return () => clearTimeout(timeout);
  }, [overlay]);

  const baseCardStyle =
    theme === 'dark'
      ? 'bg-gray-950 border border-gray-900 text-white'
      : 'bg-white border border-gray-100 text-black';

  const baseButtonStyle =
    theme === 'dark'
      ? 'border border-gray-700 text-gray-400 hover:bg-gray-950 hover:text-white'
      : 'border border-gray-300 text-gray-700 hover:bg-gray-400 hover:text-gray-900';

  const location = getLocation(user);


  // Compact View

  const CompactView = () => {
    return (
      <motion.div
        className={`select-none group rounded-xl overflow-hidden cursor-pointer transition-all hover:scale-[1.02] ${baseCardStyle}`}
        onClick={handleProfileClick}
        whileTap={{ scale: 0.98 }}
      >
        <div className="group w-full max-w-sm overflow-hidden rounded-xl shadow-md flex flex-col">
          <div className="relative flex-shrink-0 h-64">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.7) 25%, rgba(0,0,0,0) 60%), url("${getSafeImageURL(
                  user.avatar,
                  'large'
                )}")`,
              }}
            ></div>
            {/* "YENI" etiketi kaldırıldı */}
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
              <div className="flex items-baseline gap-2">
                <h2 className="text-2xl font-semibold tracking-wide">
                  {user.name || user.displayname || 'İsim Yok'},{' '}
                </h2>
                <span className="text-2xl font-light">{calculateAge(user.date_of_birth)}</span>
                {user.isOnline && <div className="w-2.5 h-2.5 rounded-full bg-green-500 ml-1"></div>}
              </div>
              <p className="text-sm font-medium opacity-90">
                {location || 'Bilinmeyen konum'}
              </p>
            </div>
          </div>

          <div
            className={`flex flex-col flex-grow ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
              }`}
          >
            <div className="flex items-center gap-3 w-full">
              <ActionBar
                viewMode='compact'
                liked={liked}
                disliked={disliked}
                blocked={blocked}
                onBlockToggle={() => {
                  setIsBlocked((prev) => !prev)
                  handleBlock(user)
                }}
                onLikeToggle={() => {
                  setLiked((prev) => !prev)
                  handleSendLike(user)
                }}
                onDislikeToggle={() => {
                  setDisliked((prev) => !prev)
                  handleSendDislike(user)
                }}
                onOpenGiftSelector={() => setIsGiftSelectorOpen(true)}
                onOpenQuickMessageSelector={() => {
                  handleSendMessage(user)
                }}
                baseButtonStyle={baseButtonStyle}
                onTriggerOverlay={handleTriggerOverlay}
              />
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  const ListView = () => {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={handleProfileClick}
      className={`select-none group flex items-center gap-4 w-full rounded-xl px-4 py-3 cursor-pointer transition-all duration-300 ${baseCardStyle}`}
    >
      <div className="relative flex-shrink-0 w-32 h-32 rounded-xl overflow-hidden shadow-md">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
          style={{
            backgroundImage: `linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.7) 25%, rgba(0,0,0,0) 60%), url("${getSafeImageURL(
              user.avatar,
              'medium'
            )}")`,
          }}
        ></div>
        {user.isOnline && (
          <div className="absolute bottom-1 right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-black animate-pulse" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg truncate">
            {user.displayname || user.name || 'İsim Yok'}
          </h3>
          <span className="text-sm opacity-70">{calculateAge(user.date_of_birth)}</span>
        </div>

        <div className="flex items-center gap-1 text-sm mt-0.5 opacity-80">
          <MapPin className="w-4 h-4" />
          {location || 'Bilinmeyen konum'}
        </div>
      </div>

      <div className="flex-shrink-0 flex items-end gap-3">
        <ActionBar
          viewMode='list'
          liked={liked}
          disliked={disliked}
          blocked={blocked}
          onBlockToggle={() => {
            setIsBlocked((prev) => !prev)
            handleBlock(user)
          }}
          onLikeToggle={() => {
            setLiked((prev) => !prev)
            handleSendLike(user)
          }}
          onDislikeToggle={() => {
            setDisliked((prev) => !prev)
            handleSendDislike(user)
          }}
          onOpenGiftSelector={() => setIsGiftSelectorOpen(true)}
          onOpenQuickMessageSelector={() => {
            handleSendMessage(user)
          }}
          baseButtonStyle={baseButtonStyle}
          onTriggerOverlay={handleTriggerOverlay}
        />
      </div>
    </motion.div>
  )
}

  const CardView = () => {
    return (
      <motion.div
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        onClick={handleProfileClick}
        className={`select-none group overflow-hidden flex items-center gap-4 w-full rounded-xl cursor-pointer transition-all duration-300 ${baseCardStyle}`}
      >
        <div className="w-full max-w-full overflow-hidden rounded-xl flex flex-col transition-transform duration-300 hover:scale-105">
          <div
            className="relative flex-grow flex flex-col justify-end bg-cover bg-center"
            style={{
              backgroundImage: `linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.7) 25%, rgba(0,0,0,0) 60%), url("${getSafeImageURL(
                user.avatar,
                'large'
              )}")`,
              aspectRatio: '3/4',
            }}
          >
            {/* "YENI" etiketi kaldırıldı */}
            <div className="p-4 pt-8">
              <div className="flex items-center gap-2 text-white">
                <p className="text-[20px]">
                  <span className="font-bold">{user.name || user.displayname || 'İsim Yok'},{' '}</span>{' '}
                  <span className="font-normal">{calculateAge(user.date_of_birth)}</span>
                </p>
                {user.isOnline && <div className="h-2 w-2 rounded-full bg-green-500 border-2 border-white" />}
              </div>
            </div>
          </div>


          <div
            className={`p-2 flex flex-col flex-grow ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
              }`}
          >
            <div className="flex items-center w-full ">
              <ActionBar
                viewMode='card'

                liked={liked}
                disliked={disliked}
                blocked={blocked}
                onBlockToggle={() => {
                  setIsBlocked((prev) => !prev)
                  handleBlock(user)
                }}
                onLikeToggle={() => {
                  setLiked((prev) => !prev)
                  handleSendLike(user)
                }}
                onDislikeToggle={() => {
                  setDisliked((prev) => !prev)
                handleSendDislike(user)
                }}
                onOpenGiftSelector={() => setIsGiftSelectorOpen(true)}
                onOpenQuickMessageSelector={() => {
                  handleSendMessage(user)
                }}
                baseButtonStyle={baseButtonStyle}
                onTriggerOverlay={handleTriggerOverlay}
              />
            </div>
          </div>
        </div>


      </motion.div>
    )
  }
  return (
    <div className='w-full'>

      {
        viewMode == "compact" ? <CompactView /> : viewMode == "list" ? <ListView /> : <CardView />
      }
      <GiftSelector
        isOpen={isGiftSelectorOpen}
        onClose={() => setIsGiftSelectorOpen(false)}
        onSelectGift={() => { }}
        userName={user.name}
      />
      <QuickMessages
        isOpen={isQuickMessageSelectorOpen}
        onClose={() => setIsQuickMessageSelectorOpen(false)}
        userName={user.name}
        onSendMessage={() => { }}
      />
      {isOverlayReady && overlay &&
        createPortal(
          <AnimatePresence initial={true}>
            <motion.div
              key={`overlay-${overlay.key}`}
              className="fixed inset-0 z-[99999] pointer-events-none flex items-center justify-center overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <motion.div
                className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
              <motion.div
                className="absolute inset-0"
                style={{ background: burstConfig[overlay.type].gradient }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              />
              <motion.div
                className="absolute inset-0"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: [0.6, 1.05, 1], opacity: [0, 0.6, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{
                  background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 65%)',
                }}
              />

              <div className="relative z-[1] flex flex-col items-center justify-center gap-8">
                <motion.div
                  className="absolute"
                  style={{ width: 260, height: 260 }}
                  initial={{ scale: 0.35, opacity: 0 }}
                  animate={{ scale: [0.35, 1.2], opacity: [0.45, 0] }}
                  transition={{ duration: 1.4, ease: 'easeOut', repeat: Infinity, repeatType: 'loop' }}
                >
                  <div className="w-full h-full rounded-full border border-white/15" />
                </motion.div>

                {['-90deg', '-30deg', '40deg', '110deg'].map((angle, idx) => (
                  <motion.div
                    key={`float-heart-${idx}`}
                    className="absolute text-white/70"
                    style={{ rotate: angle }}
                    initial={{ opacity: 0, scale: 0.4, y: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0.4, 0.9, 1.1],
                      y: [-10, -35, -55],
                    }}
                    transition={{
                      duration: 1.6 + idx * 0.1,
                      delay: 0.2 * idx,
                      repeat: Infinity,
                      repeatType: 'loop',
                      ease: 'easeOut',
                    }}
                  >
                    <Heart className="h-6 w-6 text-white/60" />
                  </motion.div>
                ))}

                {overlay.streaks.map(({ id, angle, length, delay }) => (
                  <motion.span
                    key={id}
                    className="absolute origin-center"
                    style={{
                      width: length,
                      height: 2,
                      background:
                        'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.85) 45%, rgba(255,255,255,0.05) 100%)',
                      rotate: `${angle}deg`,
                    }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0, 1.05, 0.8], opacity: [0, 0.85, 0] }}
                    transition={{
                      duration: 1.1,
                      ease: 'easeOut',
                      delay,
                      repeat: Infinity,
                      repeatType: 'loop',
                    }}
                  />
                ))}

                <motion.div
                  className="relative"
                  initial={{ scale: 0.2, opacity: 0, rotate: -25 }}
                  animate={{
                    scale: [0.2, 1.25, 1],
                    opacity: [0, 1, 1],
                    rotate: 0,
                  }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.55, ease: 'easeOut' }}
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.12, 1],
                      rotate: [0, 3, -3, 0],
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="rounded-full drop-shadow-[0_0_65px_rgba(255,255,255,0.45)]"
                  >
                    {React.createElement(burstConfig[overlay.type].Icon, {
                      className: `h-32 w-32 ${burstConfig[overlay.type].color}`,
                      strokeWidth: 1.4,
                      fill: 'currentColor',
                    })}
                  </motion.div>
                </motion.div>

                {overlay.particles.map(({ id, x, y, rotate, Icon, color }) => (
                  <motion.span
                    key={id}
                    className="absolute drop-shadow-[0_0_22px_rgba(255,255,255,0.45)]"
                    initial={{ opacity: 0, scale: 0, x: 0, y: 0, rotate: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1.25, 0.65],
                      x,
                      y,
                      rotate: rotate + 120,
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0,
                      x: x * 1.05,
                      y: y * 1.05,
                    }}
                    transition={{ duration: 0.95, ease: 'easeOut' }}
                  >
                    <Icon className={`h-12 w-12 ${color}`} strokeWidth={1.2} fill="currentColor" />
                  </motion.span>
                ))}

                {overlay.confetti.map(({ id, x, y, size, color, rotate, driftX, driftY, duration, delay, shape }) => (
                  <motion.span
                    key={id}
                    className={`absolute left-1/2 top-1/2 shadow-[0_0_18px_rgba(255,255,255,0.35)] ${shape === 'circle' ? 'rounded-full' : shape === 'square' ? 'rounded-sm' : ''}`}
                    initial={{ opacity: 0, scale: 0.6, x: 0, y: 0, rotate: 0 }}
                    animate={{
                      opacity: [0, 1, 0.8, 0],
                      scale: [0.6, 1.05, 0.95, 0.6],
                      x: [0, x * 0.6, x + driftX],
                      y: [0, y * 0.6, y + driftY],
                      rotate: [0, rotate * 0.6, rotate * 1.2],
                    }}
                    exit={{ opacity: 0, scale: 0.4, x: x * 1.05, y: y * 1.05 }}
                    transition={{
                      duration,
                      ease: 'easeInOut',
                      delay,
                      repeat: Infinity,
                      repeatType: 'mirror',
                    }}
                    style={{
                      width: size,
                      height: size,
                      backgroundColor: color,
                      mixBlendMode: 'screen',
                      borderRadius: shape === 'circle' ? '9999px' : shape === 'square' ? '4px' : undefined,
                      clipPath:
                        shape === 'triangle'
                          ? 'polygon(50% 0%, 0% 100%, 100% 100%)'
                          : undefined,
                    }}
                  />
                ))}

                <motion.div
                  className="absolute -bottom-20 text-white text-3xl font-semibold uppercase tracking-[0.4rem]"
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 40 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  {overlay.type === 'like' && 'İYİ HİSSETTİNİZ'}
                  {overlay.type === 'dislike' && 'BİR SONRAKİNE'}
                  {overlay.type === 'block' && 'ENGELLENDİ'}
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
};