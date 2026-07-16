import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Images } from 'lucide-react';
import { resolvePublicAssetUrl } from '@/platform/runtime';
import { useTheme } from '../../contexts/ThemeContext';

export type StickerItem = {
  id: string;
  label: string;
  src: string;
  category: string;
};

interface StickerPickerProps {
  onStickerSelect: (sticker: StickerItem) => void;
  onClose: () => void;
  isProcessing?: boolean;
}

const buildStickerCatalog = (): StickerItem[] => {
  const stickers: StickerItem[] = [];

  for (let i = 1; i <= 20; i += 1) {
    stickers.push({
      id: `cat-${i}`,
      label: `Cat ${i}`,
      src: resolvePublicAssetUrl(`/stickers/cat_${i}.png`),
      category: 'cats',
    });
  }

  for (let i = 1; i <= 19; i += 1) {
    stickers.push({
      id: `cat-valentine-${i}`,
      label: `Valentine Cat ${i}`,
      src: resolvePublicAssetUrl(`/stickers/cat_valentines_day_${i}.png`),
      category: 'valentines',
    });
  }

  for (let i = 1; i <= 20; i += 1) {
    stickers.push({
      id: `monkey-${i}`,
      label: `Monkey ${i}`,
      src: resolvePublicAssetUrl(`/stickers/monkey_${i}.png`),
      category: 'monkeys',
    });
  }

  return stickers;
};

const stickerCatalog = buildStickerCatalog();

const stickerCategories = [
  { id: 'cats', label: 'Cats' },
  { id: 'valentines', label: 'Valentines' },
  { id: 'monkeys', label: 'Monkeys' },
];

const StickerPicker: React.FC<StickerPickerProps> = ({ onStickerSelect, onClose, isProcessing = false }) => {
  const { theme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>('cats');

  const filteredStickers = useMemo(() => {
    return stickerCatalog.filter((sticker) => sticker.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className={`py-4  border-t border-b ${
        theme === 'dark'
          ? 'cv-card-surface-soft border-white/10'
          : 'bg-white/95 border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
              theme === 'dark' ? 'bg-gray-900/60 border border-gray-900' : 'bg-gray-100 border border-gray-200'
            }`}
          >
            <Images className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
          </div>
          <div className="min-w-0">
            <p className={`text-base font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Stickers
            </p>
            <p className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Tap to add a sticker to your post
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={`p-2 rounded-xl transition-colors ${
            theme === 'dark'
              ? 'text-gray-400 hover:text-white hover:bg-gray-900/60'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto mt-4 pb-1 scrollbar-hide">
        {stickerCategories.map((category) => (
          <motion.button
            key={category.id}
            type="button"
            onClick={() => setSelectedCategory(category.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors active:scale-95 ${
              selectedCategory === category.id
                ? theme === 'dark'
                  ? 'bg-white text-black'
                  : 'bg-black text-white'
                : theme === 'dark'
                ? 'bg-gray-900/60 text-gray-300 hover:text-white hover:bg-gray-900/80'
                : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            {category.label}
          </motion.button>
        ))}
      </div>

      <div className="mt-5">
        {filteredStickers.length === 0 ? (
          <div
            className={`w-full rounded-2xl border p-5 text-center text-sm font-medium ${
              theme === 'dark'
                ? 'border-gray-900 bg-gray-900/30 text-gray-400'
                : 'border-gray-200 bg-gray-50 text-gray-500'
            }`}
          >
            No stickers found
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 sm:gap-4">
            {filteredStickers.map((sticker) => (
              <motion.button
                key={sticker.id}
                type="button"
                disabled={isProcessing}
                onClick={() => onStickerSelect(sticker)}
                whileHover={!isProcessing ? { scale: 1.05, y: -2 } : {}}
                whileTap={!isProcessing ? { scale: 0.92 } : {}}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className={`relative aspect-square rounded-2xl overflow-hidden border transition-all duration-150 active:scale-95 ${
                  theme === 'dark'
                    ? 'border-gray-900 bg-gray-900/40 hover:border-white/40 active:bg-gray-800/60'
                    : 'border-gray-200 bg-white hover:border-gray-400 active:bg-gray-100'
                } ${isProcessing ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg active:shadow-md'}`}
              >
                <img
                  src={sticker.src}
                  alt={sticker.label}
                  className="w-full h-full object-contain p-2.5 sm:p-3 pointer-events-none select-none"
                  draggable={false}
                />
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StickerPicker;
