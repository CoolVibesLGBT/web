
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, Github, HeartHandshake, Banana, Carrot, Coffee, Baby, Gift, MessageCircleHeart, UserPlus, Flag } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import GiftSelector from '../GiftSelector';
import QuickMessages from '../QuickMessages';
import { getSafeImageURL } from '../../helpers/helpers';

interface UserCardProps {
  user: any;
  viewMode?: 'compact' | 'list' | 'card';
}

export const UserCard: React.FC<UserCardProps> = ({ user, viewMode = 'card' }) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [isGiftSelectorOpen, setIsGiftSelectorOpen] = useState(false);
  const [isQuickMessageSelectorOpen, setIsQuickMessageSelectorOpen] = useState(false);

  // Get username from user object (prioritize username, fallback to name slug)
  const getUsername = () => {
    if (user.username) return user.username;
    if (user.name) return user.name.toLowerCase().replace(/\s+/g, '');
    return 'profile';
  };

  const handleProfileClick = () => {
    navigate(`/${getUsername()}`);
  };

  const handleGiftSelect = (gift: any) => {
    console.log(`Sending ${gift.name} to ${user.name}`);
    // Here you can add your gift sending logic
  };

  const handleQuickMessageSelect = (message:any) => {
        console.log(`Sending ${message.text} to ${user.name}`);

  }

  // Compact view (for grid mode)
  if (viewMode === 'compact') {
    return (
      <motion.div
        className={`relative rounded-xl overflow-hidden cursor-pointer transition-all hover:scale-[1.02] ${
          theme === 'dark' ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
        }`}
        onTap={handleProfileClick}
        whileTap={{ scale: 0.98 }}
      >
        <div className="aspect-square relative">
          <motion.img
            src={getSafeImageURL(user.avatar,"thumbnail")}
            alt={user.name}
            className="w-full h-full object-cover"
            whileTap={{ filter: 'blur(4px)' }}
            transition={{ duration: 0.2 }}
          />
          {true &&(
            <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-black" />
          )}
        </div>

        
      </motion.div>
    );
  }

  // List view
  if (viewMode === 'list') {
    return (
      <div
        className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all hover:bg-opacity-50 ${
          theme === 'dark' ? 'bg-gray-900 hover:bg-gray-800' : 'bg-gray-50 hover:bg-gray-100'
        }`}
        onClick={handleProfileClick}
      >
        <div className="relative">
          <img src={getSafeImageURL(user.avatar,"small")} alt={user.name} className="w-14 h-14 rounded-xl object-cover" />
          {user.isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-black" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold text-base truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {user.displayname}
          </h3>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {user.age} · {user.distance}
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {user && user.intersts && user.interests.length > 0 && user.interests.slice(0, 2).map((interest, idx) => (
            <span key={idx} className={`text-xs px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
              {interest}
            </span>
          ))}
        </div>
        
        <GiftSelector isOpen={isGiftSelectorOpen} onClose={() => setIsGiftSelectorOpen(false)} onSelectGift={handleGiftSelect} userName={user.name} />
        <QuickMessages isOpen={isQuickMessageSelectorOpen} onClose={() => setIsQuickMessageSelectorOpen(false)} userName={user.name} onSendMessage={handleQuickMessageSelect} />
      </div>
    );
  }

  // Card view (default - full detailed card)
  return (
    <div
      key={user.id}
      className={`select-none relative rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${
        theme === 'dark' ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
      }`}
      onClick={handleProfileClick}
    >
      <div className="relative min-h-[512px]">
        <img src={getSafeImageURL(user.avatar,"small")} alt={user.name} className="w-full h-full min-h-[512px] object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
        
        {user.isOnline && (
          <div className="absolute top-4 right-4 flex items-center space-x-2">
            <div className="flex items-center space-x-1 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5">
              <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-white text-sm font-medium">Online</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 flex items-center justify-center transition-all duration-200 cursor-pointer border border-white/20"
            >
              <Flag className="w-4 h-4 text-white" />
            </motion.button>
          </div>
        )}
        
        {!user.isOnline && (
          <div className="absolute top-4 right-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 flex items-center justify-center transition-all duration-200 cursor-pointer border border-white/20"
            >
              <Flag className="w-4 h-4 text-white" />
            </motion.button>
          </div>
        )}
        
        <div className="absolute bottom-4 left-4">
          <div className="flex items-center space-x-1 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5">
            <MapPin className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-medium">{user.distance}</span>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-white truncate">{user.displayname}</h3>
            <p className="text-sm text-gray-200">{user.age} years old</p>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {user && user.intersts && user.interests.length > 0 && user.interests.slice(0, 2).map((interest, idx) => (
              <span key={idx} className="px-3 py-1.5 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm text-white">
                {interest}
              </span>
            ))}
          </div>

          <div className="absolute flex flex-col gap-2 right-3 -top-[280px] itens-end justify-center gap-2 mt-2">
            {[
              { icon: <HeartHandshake className="w-5 h-5" />, label: 'Touch', color: 'text-white/50', action: () => {} },
              { icon: <Banana className="w-5 h-5" />, label: 'Banana', color: 'text-white/50', action: () => {} },
              { icon: <Carrot className="w-5 h-5" />, label: 'Carrot', color: 'text-white/50', action: () => {} },
              { icon: <Coffee className="w-5 h-5" />, label: 'Coffee', color: 'text-white/50', action: () => {} },
              { icon: <Heart className="w-5 h-5" />, label: 'Like', color: 'text-white/50', action: () => {} },
              { icon: <Baby className="w-5 h-5" />, label: 'Kiss', color: 'text-white/50', action: () => {} },
              { icon: <Gift className="w-5 h-5" />, label: 'Gift', color: 'text-white/50', action: () => { setIsGiftSelectorOpen(true); }},
              { icon: <MessageCircleHeart className="w-5 h-5" />, label: 'Message', color: 'text-white/50', action: () => { setIsQuickMessageSelectorOpen(true); } },
              { icon: <UserPlus className="w-5 h-5" />, label: 'Follow', color: 'text-white/50', action: () => {} },
            ].map(({ icon, label, color, action }, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.92 }}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); action(); }}
                className="group relative flex items-center justify-center w-10 h-10 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/30 text-white transition-all cursor-pointer border border-white/30 hover:bg-white/30"
              >
                <div className={`${color} group-hover:text-white`}>{icon}</div>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                  <div className="bg-black/90 backdrop-blur-sm text-white text-xs rounded-lg py-1 px-3 whitespace-nowrap shadow-lg border border-white/20">
                    {label}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      <GiftSelector isOpen={isGiftSelectorOpen} onClose={() => setIsGiftSelectorOpen(false)} onSelectGift={handleGiftSelect} userName={user.name} />
      <QuickMessages isOpen={isQuickMessageSelectorOpen} onClose={() => setIsQuickMessageSelectorOpen(false)} userName={user.name} onSendMessage={handleQuickMessageSelect} />
    </div>
  );
}