import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Star, Crown, Diamond, Sparkles, Coffee, Cake, Music, Zap } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface Gift {
  id: number;
  name: string;
  icon: React.ReactNode;
  price: number;
  color: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface GiftSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGift: (gift: Gift) => void;
  userName: string;
}

const GiftSelector: React.FC<GiftSelectorProps> = ({ isOpen, onClose, onSelectGift, userName }) => {
  const { theme } = useTheme();

  const gifts: Gift[] = [

  { id: 1, name: 'Banana', icon: "/gifts/banana.svg", price: 10, color: 'text-red-400', rarity: 'common' },
  { id: 1, name: 'Carrot', icon: "/gifts/carrot.svg", price: 10, color: 'text-red-400', rarity: 'common' },
  { id: 1, name: 'Cucumber', icon: "/gifts/cucumber-original.svg", price: 10, color: 'text-red-400', rarity: 'common' },
    { id: 1, name: 'Cucumber', icon: "/gifts/cucumber-thin.svg", price: 10, color: 'text-red-400', rarity: 'common' },
    { id: 1, name: 'Aubergine', icon: "/gifts/aubergine.svg", price: 10, color: 'text-red-400', rarity: 'common' },
    { id: 1, name: 'Aubergine', icon: "/gifts/aubergine-thin.svg", price: 10, color: 'text-red-400', rarity: 'common' },

  { id: 1, name: 'Peach One', icon: "/gifts/peach-one.svg", price: 10, color: 'text-red-400', rarity: 'common' },
  { id: 1, name: 'Peach Two', icon: "/gifts/peach-two.svg", price: 10, color: 'text-red-400', rarity: 'common' },,
    { id: 1, name: 'Condom', icon: "/gifts/condom.svg", price: 10, color: 'text-red-400', rarity: 'common' },
    { id: 1, name: 'Tongue', icon: "/gifts/tongue.svg", price: 10, color: 'text-red-400', rarity: 'common' },
  { id: 1, name: 'Watermelon', icon: "/gifts/watermelon.svg", price: 10, color: 'text-red-400', rarity: 'common' },

  { id: 2, name: 'Flower', icon: "/gifts/flower.svg", price: 15, color: 'text-pink-400', rarity: 'common' },
  { id: 3, name: 'Ice Cream', icon: "/gifts/icecream.svg", price: 20, color: 'text-amber-500', rarity: 'common' },
  { id: 4, name: 'Bear Heart', icon: "/gifts/bear-heart.svg", price: 30, color: 'text-rose-500', rarity: 'uncommon' },
  { id: 5, name: 'Gem', icon: "/gifts/gem.svg", price: 100, color: 'text-cyan-500', rarity: 'rare' },
  { id: 6, name: 'Kiss', icon: "/gifts/kiss.svg", price: 35, color: 'text-pink-600', rarity: 'uncommon' },
  { id: 7, name: 'Bear', icon: "/gifts/bear.svg", price: 25, color: 'text-yellow-500', rarity: 'common' },
  { id: 8, name: 'Heart Arrow', icon: "/gifts/heart-arrow.svg", price: 40, color: 'text-red-500', rarity: 'uncommon' },
  { id: 9, name: 'Heart Circle', icon: "/gifts/heart-circle.svg", price: 30, color: 'text-pink-500', rarity: 'common' },
  { id: 10, name: 'Heart', icon: "/gifts/heart.svg", price: 25, color: 'text-red-500', rarity: 'common' },
  { id: 11, name: 'Love', icon: "/gifts/love.svg", price: 50, color: 'text-pink-500', rarity: 'rare' },
  { id: 12, name: 'Lovebirds', icon: "/gifts/lovebirds.svg", price: 80, color: 'text-red-400', rarity: 'rare' },
  { id: 13, name: 'Cheers', icon: "/gifts/cheersalcohol.svg", price: 40, color: 'text-amber-400', rarity: 'common' },
  { id: 14, name: 'Heart Hand', icon: "/gifts/hearthand.svg", price: 60, color: 'text-rose-400', rarity: 'rare' },
  { id: 15, name: 'Marriage Heart', icon: "/gifts/heartlovemarriage.svg", price: 90, color: 'text-purple-500', rarity: 'epic' },
  { id: 16, name: 'Clover', icon: "/gifts/cloverleaf.svg", price: 20, color: 'text-green-500', rarity: 'common' },
  { id: 17, name: 'Love Flower', icon: "/gifts/loveflower.svg", price: 50, color: 'text-pink-500', rarity: 'uncommon' },
  { id: 18, name: 'Love Gem', icon: "/gifts/lovegem.svg", price: 120, color: 'text-indigo-500', rarity: 'epic' },
  { id: 19, name: 'Melange', icon: "/gifts/melange.svg", price: 35, color: 'text-violet-400', rarity: 'uncommon' },
  { id: 20, name: 'Rainbow', icon: "/gifts/rainbow.svg", price: 60, color: 'text-pink-400', rarity: 'rare' },
  { id: 21, name: 'Rose', icon: "/gifts/rose.svg", price: 30, color: 'text-red-400', rarity: 'common' },
  { id: 22, name: 'Snowman', icon: "/gifts/snowman.svg", price: 20, color: 'text-blue-400', rarity: 'common' },
  { id: 23, name: 'Tape Recorder', icon: "/gifts/taperecorder.svg", price: 25, color: 'text-gray-400', rarity: 'common' },
  { id: 24, name: 'Dog With Flag', icon: "/gifts/dogwithflag.svg", price: 45, color: 'text-yellow-500', rarity: 'uncommon' },
  { id: 25, name: 'High Heels', icon: "/gifts/highheels.svg", price: 70, color: 'text-fuchsia-500', rarity: 'rare' },
  { id: 26, name: 'Home', icon: "/gifts/home.svg", price: 80, color: 'text-blue-500', rarity: 'rare' },
  { id: 27, name: 'Cocktail', icon: "/gifts/cocktail.svg", price: 35, color: 'text-orange-400', rarity: 'common' },
  { id: 28, name: 'Cocktail Glass', icon: "/gifts/cocktailglass.svg", price: 40, color: 'text-orange-500', rarity: 'common' },
  { id: 29, name: 'Cucumber', icon: "/gifts/cucumber.svg", price: 20, color: 'text-green-400', rarity: 'common' },
  { id: 30, name: 'Engagement Ring', icon: "/gifts/engagementringdiamond.svg", price: 200, color: 'text-yellow-400', rarity: 'legendary' },
  { id: 30, name: 'Rainbow Flag', icon: "/gifts/rainbow-flag.svg", price: 200, color: 'text-yellow-400', rarity: 'legendary' },
  { id: 27, name: 'Cocktail', icon: "/gifts/panda.svg", price: 35, color: 'text-orange-400', rarity: 'common' },
  { id: 27, name: 'Cocktail', icon: "/gifts/dog.svg", price: 35, color: 'text-orange-400', rarity: 'common' },
  { id: 27, name: 'Cocktail', icon: "/gifts/bear-head.svg", price: 35, color: 'text-orange-400', rarity: 'common' },

  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-slate-300/50';
      case 'rare': return 'border-blue-400/60';
      case 'epic': return 'border-purple-400/60';
      case 'legendary': return 'border-gradient-to-r from-yellow-400 to-orange-400';
      default: return 'border-slate-300/50';
    }
  };

  const getRarityGlow = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'shadow-lg shadow-slate-200/10';
      case 'rare': return 'shadow-lg shadow-blue-400/25';
      case 'epic': return 'shadow-lg shadow-purple-400/30';
      case 'legendary': return 'shadow-xl shadow-yellow-400/40';
      default: return 'shadow-lg shadow-slate-200/10';
    }
  };

  const getRarityBg = (rarity: string, isDark: boolean) => {
    const baseGlass = isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-white/10 hover:bg-white/30';
    return `${baseGlass} backdrop-blur-md`;
  };

  const handleGiftSelect = (gift: Gift) => {
    onSelectGift(gift);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className=" inset-0 z-5 w-full h-full flex items-center justify-center p-0 m-0"
          onClick={onClose}
        >
          {/* Enhanced Blur Background */}
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>

          {/* Gift Selector Modal */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 30 }}
            transition={{ type: "spring", damping: 20, stiffness: 280 }}
            className={`relative h-full w-full rounded-lg overflow-hidden  bg-transparent backdrop-blur-sm ring-1 ring-white/10`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`p-2 border-b ${
              theme === 'dark' ? 'border-white/10' : 'border-white/20'
            } ${
              theme === 'dark'
                ? 'bg-black/10'
                : 'bg-white/10'
            } backdrop-blur-sm`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-xl font-bold text-white`}>
                    Send Gift
                  </h3>
                  <p className={`text-sm mt-1 text-white`}>
                    to {userName}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className={`p-2 rounded-full transition-all duration-200  text-white border border-white/10`}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* Gifts Grid */}
            <div className="p-4 max-h-[355px] overflow-y-auto scrollbar-hide">
              <div className="grid grid-cols-4 gap-2">
                {gifts.map((gift, index) => (
                  <motion.button
                    key={gift.id}
                  
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handleGiftSelect(gift)}
                    className={`relative p-2 flex items-center justify-center rounded-xl border border-1 border-white/30 hover:border-white/50 transition-all duration-300  hover:shadow-xl group overflow-hidden`}
                  >
                 

                    {/* Glass Shimmer Effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                    </div>

                    {/* Gift Icon */}
                    <div className={`relative flex items-center justify-center z-10`}>
                      <motion.div
                        whileHover={{
                          rotate: [0, -8, 8, 0],
                          scale: [1, 1.1, 1.1, 1]
                        }}
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                        className="relative"
                      >
                        <img className='w-12 h-12' src={gift.icon ? gift.icon : "/gifts/heart.svg"}/>
                        {/* Icon Glow */}
                       
                      </motion.div>
                    </div>

             
               
                   
                     </motion.button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className={`p-6 border-t ${
              theme === 'dark'
                ? 'border-white/10 bg-black/10'
                : 'border-white/20 bg-white/10'
            } backdrop-blur-sm`}>
              <div className="flex items-center justify-center space-x-2">
                <Sparkles className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                <p className={`text-sm text-center font-medium text-white`}>
                  Choose the perfect gift for {userName}
                </p>
                <Sparkles className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GiftSelector;
