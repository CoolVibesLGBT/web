import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Mail, Gift, MapPin, Skull, HeartCrack, HeartOff, MessageCircleHeart, Shield } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import GiftSelector from '../GiftSelector';
import QuickMessages from '../QuickMessages';
import { calculateAge, getSafeImageURL } from '../../helpers/helpers';
import { Actions } from '../../services/actions';
import { api } from '../../services/api';
import { LikeIcon, DislikeIcon, ChatIcon, BlockIcon } from './icons';

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
}) => {

  const iconStyle = "h-8 w-8 min-h-8  min-w-8 max-h-8 max-w-8"
  const buttonStyle = "p-2 h-12 w-12 max-w-12 min-h-12 flex items-center justify-center"
  const viewGridStyle = {
    "compact": "grid grid-cols-2 py-2 ",
    "card": "grid grid-cols-4",
    "list": "grid sm:grid-cols-4 grid-cols-2"
  }
  return (
    <div className={`w-full ${viewGridStyle[viewMode]} justify-center place-items-center gap-2`}>
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

      <motion.button
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => {
          e.stopPropagation();
          onLikeToggle();
        }}
        className={`cursor-pointer rounded-full transition-all ${buttonStyle} ${liked ? "text-red-500" : baseButtonStyle
          }`}
        aria-label="Like"
      >
        <LikeIcon className={iconStyle} />

      </motion.button>

      <motion.button
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => {
          e.stopPropagation();
          onDislikeToggle();
        }}
        className={`cursor-pointer rounded-full transition-all ${buttonStyle} ${disliked ? "text-red-500" : baseButtonStyle
          }`}
        aria-label="Dislike"
      >
        <DislikeIcon className={iconStyle} />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => {
          e.stopPropagation();
          onBlockToggle();
        }}
        className={`cursor-pointer rounded-full transition-all ${buttonStyle} ${blocked ? "text-red-500" : baseButtonStyle
          }`}
        aria-label="Block">
        <BlockIcon className={iconStyle} />

      </motion.button>
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

  const getUsername = () =>
    user.username ||
    user.name?.toLowerCase().replace(/\s+/g, '') ||
    'profile';

  const handleProfileClick = (e: any) => {
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

  const baseCardStyle =
    theme === 'dark'
      ? 'bg-[#0a0a0a] border border-[#1c1c1c] text-white'
      : 'bg-[#ffffff] border border-[#e5e5e5] text-black';

  const baseButtonStyle =
    theme === 'dark'
      ? 'border border-[#333] text-gray-300 hover:bg-[#222] hover:text-white'
      : 'border border-[#ddd] text-gray-700 hover:bg-[#f5f5f5] hover:text-black';

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
            className={`flex flex-col flex-grow ${theme === 'dark' ? 'bg-[#111]' : 'bg-[#fafafa]'
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
                }}
                onOpenGiftSelector={() => setIsGiftSelectorOpen(true)}
                onOpenQuickMessageSelector={() => {
                  handleSendMessage(user)
                }}
                baseButtonStyle={baseButtonStyle}
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
          }}
          onOpenGiftSelector={() => setIsGiftSelectorOpen(true)}
          onOpenQuickMessageSelector={() => {
            handleSendMessage(user)
          }}
          baseButtonStyle={baseButtonStyle}
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
            className={`p-2 flex flex-col flex-grow ${theme === 'dark' ? 'bg-[#111]' : 'bg-[#fafafa]'
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
                }}
                onOpenGiftSelector={() => setIsGiftSelectorOpen(true)}
                onOpenQuickMessageSelector={() => {
                  handleSendMessage(user)
                }}
                baseButtonStyle={baseButtonStyle}
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
    </div>
  );
};