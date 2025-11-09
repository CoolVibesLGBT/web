import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Mail, Gift, MapPin } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import GiftSelector from '../GiftSelector';
import QuickMessages from '../QuickMessages';
import { getSafeImageURL } from '../../helpers/helpers';

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

export const UserCard: React.FC<UserCardProps> = ({ user, viewMode = 'card' }) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [isGiftSelectorOpen, setIsGiftSelectorOpen] = useState(false);
  const [isQuickMessageSelectorOpen, setIsQuickMessageSelectorOpen] = useState(false);
  const [liked, setLiked] = useState(false);

  const getUsername = () =>
    user.username ||
    user.name?.toLowerCase().replace(/\s+/g, '') ||
    'profile';

  const handleProfileClick = () => navigate(`/${getUsername()}`);

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
        className={`relative rounded-xl overflow-hidden cursor-pointer transition-all hover:scale-[1.02] ${baseCardStyle}`}
        onTap={handleProfileClick}
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
                <span className="text-2xl font-light">{user.age || ''}</span>
                {user.isOnline && <div className="w-2.5 h-2.5 rounded-full bg-green-500 ml-1"></div>}
              </div>
              <p className="text-sm font-medium opacity-90">
                {location || 'Bilinmeyen konum'}
              </p>
            </div>
          </div>

          <div
            className={`p-4 flex flex-col flex-grow ${
              theme === 'dark' ? 'bg-[#111]' : 'bg-[#fafafa]'
            }`}
          >
            {/* Bio kaldırıldı */}
            <div className="flex items-center gap-3 ml-2">
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className={`p-2 rounded-full transition-all ${baseButtonStyle}`}
              >
                <Mail className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className={`p-2 rounded-full transition-all ${baseButtonStyle}`}
                onClickCapture={() => setIsGiftSelectorOpen(true)}
              >
                <Gift className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setLiked((prev) => !prev);
                }}
                className={`p-2 rounded-full transition-all ${
                  liked ? 'text-red-500' : baseButtonStyle
                }`}
              >
                <Heart className="w-5 h-5" />
              </motion.button>
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
        className={`group flex items-center gap-4 w-full rounded-xl px-4 py-3 cursor-pointer transition-all duration-300 ${baseCardStyle}`}
      >
        <div className="relative flex-shrink-0">
          <img
            src={getSafeImageURL(user.avatar, 'medium')}
            alt={user.name || user.displayname || 'profile'}
            className="w-16 h-16 rounded-xl object-cover shadow-md group-hover:scale-105 transition-transform duration-300"
          />
          {user.isOnline && (
            <div className="absolute bottom-1 right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-black animate-pulse" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg truncate">
              {user.displayname || user.name || 'İsim Yok'}
            </h3>
            <span className="text-sm opacity-70">{user.age || ''}</span>
          </div>

          <div className="flex items-center gap-1 text-sm mt-0.5 opacity-80">
            <MapPin className="w-4 h-4" />
            {location || 'Bilinmeyen konum'}
          </div>
          {/* Bio kaldırıldı */}
        </div>

        <div className="flex-shrink-0 flex items-center gap-3 ml-2">
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            className={`p-2 rounded-full transition-all ${baseButtonStyle}`}
          >
            <Mail className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              setIsGiftSelectorOpen(true);
            }}
            className={`p-2 rounded-full transition-all ${baseButtonStyle}`}
          >
            <Gift className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              setLiked((prev) => !prev);
            }}
            className={`p-2 rounded-full transition-all ${
              liked ? 'text-red-500' : baseButtonStyle
            }`}
          >
            <Heart className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>
    )
  }


  const CardView = () => {
    return(
    <motion.div
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        onClick={handleProfileClick}
        className={`group overflow-hidden flex items-center gap-4 w-full rounded-xl cursor-pointer transition-all duration-300 ${baseCardStyle}`}
      >
      <div className="w-full max-w-sm overflow-hidden rounded-xl flex flex-col transition-transform duration-300 hover:scale-105">
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
                <span className="font-normal">{user.age || ''}</span>
              </p>
              {user.isOnline && <div className="h-2 w-2 rounded-full bg-green-500 border-2 border-white" />}
            </div>
          </div>
        </div>

        <div className={`p-4 ${theme === 'dark' ? 'bg-[#0f0f0f]' : 'bg-[#f9f9f9]'}`}>


          <div className="flex items-center gap-3 ml-2">
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className={`p-2 rounded-full transition-all ${baseButtonStyle}`}
            >
              <Mail className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                setIsGiftSelectorOpen(true);
              }}
              className={`p-2 rounded-full transition-all ${baseButtonStyle}`}
            >
              <Gift className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                setLiked((prev) => !prev);
              }}
              className={`p-2 rounded-full transition-all ${
                liked ? 'text-red-500' : baseButtonStyle
              }`}
            >
              <Heart className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>

    
    </motion.div>
    )
  } 
  // Card View (Full)
  return (
 <div className='w-full'>

    {
      viewMode == "compact" ? <CompactView/> : viewMode == "list" ? <ListView/> : <CardView/>
    }
      <GiftSelector
        isOpen={isGiftSelectorOpen}
        onClose={() => setIsGiftSelectorOpen(false)}
        onSelectGift={() => {}}
        userName={user.name}
      />
      <QuickMessages
        isOpen={isQuickMessageSelectorOpen}
        onClose={() => setIsQuickMessageSelectorOpen(false)}
        userName={user.name}
        onSendMessage={() => {}}
      />
</div>
  );
};