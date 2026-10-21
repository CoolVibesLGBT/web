import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from '@/router';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart } from '@/components/ui/illustratedIcons';
import GiftSelector from './GiftSelector';
import QuickMessages from '../../post/QuickMessages';
import { calculateAge, getSafeImageURLEx } from '../../../helpers/helpers';
import { api } from '../../../services/api';
import { burstConfig, type BurstOverlayState } from './ActionBar';

import UserCardView, { type User, type UserCardViewProps } from './UserCardView';

interface UserCardProps {
  user: User;
  viewMode?: 'compact' | 'list' | 'card';
}

const getLocation = (user: User): string => {
  if (user.location) {
    if (typeof user.location === 'string') {
      return user.location.trim();
    }
    if (typeof user.location === 'object' && user.location !== null) {
      return (user.location as { display?: string }).display?.trim() || '';
    }
  }
  return '';
};

export const UserCard = React.memo(function UserCard({ user, viewMode = 'card' }: UserCardProps) {
  const navigate = useNavigate();
  const [isGiftSelectorOpen, setIsGiftSelectorOpen] = useState(false);
  const [isQuickMessageSelectorOpen, setIsQuickMessageSelectorOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false)
  const [blocked, setIsBlocked] = useState(false)
  const [overlay, setOverlay] = useState<BurstOverlayState | null>(null);

  const getUsername = () =>
    user.username ||
    user.name?.toLowerCase().replace(/\s+/g, '') ||
    'profile';

  const handleProfileClick = () => {
    navigate(`/${getUsername()}`)
  };

  const handleSendMessage = async (profile: User) => {
    if (!user?.id || !profile?.id) {
      console.error('User or profile ID is missing');
      return;
    }

    try {
      // Create chat via API
      const chatResponse = await api.createChat([profile.id], 'private') as {
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
      };

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

  const handleSendLike = async (profile: User) => {
    if (!profile?.public_id) return;
    try {
      setLiked(p => !p);
      await api.toggleUserLike({
        likee_id: profile.public_id as string,
      });
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  }

  const handleSendDislike = async (profile: User) => {
    if (!profile?.public_id) return;
    try {
      setDisliked(p => !p);
      await api.toggleUserDislike({
        likee_id: profile.public_id as string,
      });
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  }

  const handleBlock = async (profile: User) => {
    if (!profile?.public_id) return;
    try {
      setIsBlocked(p => !p);
      await api.toggleBlockUser(profile.public_id as string);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  }

  useEffect(() => {
    if (!overlay) return;
    const timeout = setTimeout(() => setOverlay(null), 2600);
    return () => clearTimeout(timeout);
  }, [overlay]);

  const locationValue = getLocation(user);
  const avatarURLValue = getSafeImageURLEx(String(user.public_id ?? user.id), (user.avatar as any), "large") || "";
  let userAgeValue = calculateAge(user.date_of_birth as string);
  userAgeValue = userAgeValue === "-" ? "" : userAgeValue;

  const portalRoot = typeof document !== 'undefined' ? document.body : null;

  const renderView = () => {
    const props: UserCardViewProps = {
      user,
      viewMode,
      liked,
      disliked,
      blocked,
      handleSendMessage,
      handleSendLike,
      handleSendDislike,
      handleBlock,
      handleProfileClick,
      avatarURL: avatarURLValue,
      userAge: userAgeValue.toString(),
      location: locationValue
    };

    return <UserCardView {...props} />;
  };

  return (
    <div className='w-full'>
      {renderView()}
      {isGiftSelectorOpen && (
        <GiftSelector
          isOpen={isGiftSelectorOpen}
          onClose={() => setIsGiftSelectorOpen(false)}
          onSelectGift={() => { }}
          userName={user.name || user.displayname || 'User'}
        />
      )}
      {isQuickMessageSelectorOpen && (
        <QuickMessages
          isOpen={isQuickMessageSelectorOpen}
          onClose={() => setIsQuickMessageSelectorOpen(false)}
          userName={user.name || user.displayname || 'User'}
          onSendMessage={() => { }}
        />
      )}
      {portalRoot && overlay &&
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
                  className="absolute -bottom-20 text-white text-3xl font-semibold normal-case tracking-[0.4rem]"
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
          portalRoot
        )}
    </div>
  );
});
