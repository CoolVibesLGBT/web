import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Clock } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import emojiData from 'emoji-datasource-facebook/emoji.json';

interface Emoji {
  name: string;
  unified: string;
  category: string;
  skin_variations?: any;
  obsoleted_by?: string;
  short_name: string;
  short_names: string[];
  image?: string;
  has_img_facebook?: boolean;
}

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose?: () => void;
  title?: string;
  description?: string;
}

// Category icons and display names
const categoryConfig: Record<string, { icon: string; label: string }> = {
  'Smileys & Emotion': { icon: '😀', label: 'Smileys & People' },
  'People & Body': { icon: '👋', label: 'People & Body' },
  'Animals & Nature': { icon: '🐶', label: 'Animals & Nature' },
  'Food & Drink': { icon: '🍎', label: 'Food & Drink' },
  'Travel & Places': { icon: '🚗', label: 'Travel & Places' },
  'Activities': { icon: '⚽', label: 'Activities' },
  'Objects': { icon: '💡', label: 'Objects' },
  'Symbols': { icon: '❤️', label: 'Symbols' },
  'Flags': { icon: '🏳️', label: 'Flags' },
};

const EmojiPicker: React.FC<EmojiPickerProps> = ({
  onEmojiSelect,
  onClose,
  title: _title = 'Add Emoji',
  description: _description = 'Express yourself with emojis',
}) => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Smileys & Emotion');
  const [frequentlyUsed, setFrequentlyUsed] = useState<string[]>([]);
  const [hoveredEmoji, setHoveredEmoji] = useState<{ name: string; emoji: string } | null>(null);
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const emojiGridRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const pickerRef = useRef<HTMLDivElement>(null);

  // Load frequently used emojis from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('frequentlyUsedEmojis');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const timer = setTimeout(() => setFrequentlyUsed(parsed), 0);
        return () => clearTimeout(timer);
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Handle click outside to close picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        if (onClose) {
          onClose();
        }
      }
    };

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      // Cleanup
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Process emoji data and group by category
  const emojisByCategory = useMemo(() => {
    const grouped: Record<string, Emoji[]> = {};
    
    (emojiData as Emoji[]).forEach((emoji: Emoji) => {
      // Skip skin tone variations and other modifiers
      if (emoji.skin_variations || emoji.obsoleted_by) {
        return;
      }
      
      const category = emoji.category || 'Symbols';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(emoji);
    });

    return grouped;
  }, []);

  // Get available categories in order
  const categories = useMemo(() => {
    const categoryOrder = [
      'Smileys & Emotion',
      'People & Body',
      'Animals & Nature',
      'Food & Drink',
      'Travel & Places',
      'Activities',
      'Objects',
      'Symbols',
      'Flags',
    ];
    
    return categoryOrder.filter(cat => emojisByCategory[cat]);
  }, [emojisByCategory]);

  // Convert unified code to emoji character
  const unifiedToEmoji = (unified: string): string => {
    try {
      return unified
        .split('-')
        .map((code) => String.fromCodePoint(parseInt(code, 16)))
        .join('');
    } catch {
      return '';
    }
  };

  // Get Facebook emoji image URL
  const getEmojiImageUrl = (emoji: Emoji): string | null => {
    // Check if emoji has Facebook image
    // has_img_facebook can be true, false, or undefined
    // We'll try to use image if it exists and has_img_facebook is not explicitly false
    if (emoji.image && emoji.has_img_facebook !== false) {
      // Try to use the image from public folder first (if copied there)
      // Otherwise fallback to node_modules path
      // In production, you should copy emoji images to public/emojis/ folder
      return `/emojis/${emoji.image}`;
    }
    return null;
  };

  // Get frequently used emojis as emoji objects
  const frequentlyUsedEmojis = useMemo(() => {
    if (frequentlyUsed.length === 0) return [];
    
    const emojiMap = new Map<string, Emoji>();
    (emojiData as Emoji[]).forEach((emoji: Emoji) => {
      const emojiChar = unifiedToEmoji(emoji.unified);
      if (emojiChar) {
        emojiMap.set(emojiChar, emoji);
      }
    });
    
    return frequentlyUsed
      .map(char => emojiMap.get(char))
      .filter((e): e is Emoji => !!e)
      .slice(0, 32); // Limit to 32 most recent
  }, [frequentlyUsed]);

  // Filter emojis based on search query - search across all categories when searching
  const filteredEmojis = useMemo(() => {
    if (searchQuery.trim()) {
      // When searching, show results from all categories
      const query = searchQuery.toLowerCase();
      const allEmojis: Emoji[] = [];
      
      Object.values(emojisByCategory).forEach(categoryEmojis => {
        categoryEmojis.forEach((emoji: Emoji) => {
          const shortName = (emoji.short_name || '').toLowerCase();
          const keywords = (emoji.short_names || []).join(' ').toLowerCase();
          const name = (emoji.name || '').toLowerCase();
          
          if (
            shortName.includes(query) ||
            keywords.includes(query) ||
            name.includes(query)
          ) {
            allEmojis.push(emoji);
          }
        });
      });
      
      return allEmojis;
    }
    
    // When not searching, show selected category
    return emojisByCategory[selectedCategory] || [];
  }, [emojisByCategory, selectedCategory, searchQuery]);

  // Scroll to selected category when category changes
  useEffect(() => {
    if (categoryScrollRef.current && !searchQuery) {
      const selectedButton = categoryScrollRef.current.querySelector(
        `[data-category="${selectedCategory}"]`
      ) as HTMLElement;
      if (selectedButton) {
        selectedButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedCategory, searchQuery]);

  // Auto-update category based on scroll position
  useEffect(() => {
    const gridElement = emojiGridRef.current;
    if (!gridElement || searchQuery.trim()) return;

    let scrollTimeout: ReturnType<typeof setTimeout>;
    
    const handleScroll = () => {
      // Throttle scroll events
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const scrollTop = gridElement.scrollTop;
        const containerHeight = gridElement.clientHeight;
        const scrollPosition = scrollTop + containerHeight / 3; // Top third of viewport

        // Find which section is currently in view
        let currentCategory = selectedCategory;
        let minDistance = Infinity;

        sectionRefs.current.forEach((element, category) => {
          if (!element) return;
          
          const rect = element.getBoundingClientRect();
          const gridRect = gridElement.getBoundingClientRect();
          const elementTop = rect.top - gridRect.top + gridElement.scrollTop;
          const elementBottom = elementTop + rect.height;

          // Check if section header is visible in top third of viewport
          if (scrollPosition >= elementTop && scrollPosition <= elementBottom) {
            const distance = Math.abs(scrollPosition - elementTop);
            if (distance < minDistance) {
              minDistance = distance;
              currentCategory = category;
            }
          }
        });

        // Also check frequently used section
        if (frequentlyUsedEmojis.length > 0) {
          const frequentSection = sectionRefs.current.get('recent');
          if (frequentSection) {
            const rect = frequentSection.getBoundingClientRect();
            const gridRect = gridElement.getBoundingClientRect();
            const elementTop = rect.top - gridRect.top + gridElement.scrollTop;
            const elementBottom = elementTop + rect.height;
            
            if (scrollPosition >= elementTop && scrollPosition <= elementBottom) {
              const distance = Math.abs(scrollPosition - elementTop);
              if (distance < minDistance) {
                currentCategory = 'recent';
              }
            }
          }
        }

        if (currentCategory !== selectedCategory && currentCategory !== 'recent' || (currentCategory === 'recent' && frequentlyUsedEmojis.length > 0)) {
          setSelectedCategory(currentCategory);
        }
      }, 50); // Throttle to 50ms
    };

    gridElement.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      clearTimeout(scrollTimeout);
      gridElement.removeEventListener('scroll', handleScroll);
    };
  }, [selectedCategory, searchQuery, frequentlyUsedEmojis.length]);

  // Group emojis by category for display with headers
  const groupedEmojisForDisplay = useMemo(() => {
    if (searchQuery.trim()) {
      // When searching, group results by their category
      const grouped: Record<string, Emoji[]> = {};
      (filteredEmojis as Emoji[]).forEach((emoji: Emoji) => {
        const category = emoji.category || 'Symbols';
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push(emoji);
      });
      return grouped;
    }
    
    // When not searching, show only selected category
    return { [selectedCategory]: filteredEmojis };
  }, [filteredEmojis, selectedCategory, searchQuery]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      transition={{ duration: 0.2 }}
      className="mb-4"
    >
      <div
        ref={pickerRef}
        className={`w-full border overflow-hidden ${
          theme === 'dark'
            ? 'bg-gray-950 border-gray-800'
            : 'bg-white border-gray-200'
        }`}
       
      >
        {/* Category Tabs - Top */}
        <div
          ref={categoryScrollRef}
          className={`flex items-center gap-0.5 px-2 py-2 border-b overflow-x-auto scrollbar-hide ${
            theme === 'dark' ? 'border-gray-800 bg-gray-900/30' : 'border-gray-200 bg-gray-50/50'
          }`}
        >
          {/* Recently Used Tab */}
          {frequentlyUsedEmojis.length > 0 && !searchQuery && (
            <button
              data-category="recent"
              onClick={() => {
                setSelectedCategory('recent');
                if (emojiGridRef.current) {
                  emojiGridRef.current.scrollTop = 0;
                }
              }}
              className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-150 relative ${
                selectedCategory === 'recent'
                  ? theme === 'dark'
                    ? 'bg-gray-800'
                    : 'bg-gray-200'
                  : theme === 'dark'
                  ? 'hover:bg-gray-800/50'
                  : 'hover:bg-gray-100'
              }`}
              title="Recently used"
            >
              <Clock className={`w-4 h-4 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`} />
              {selectedCategory === 'recent' && (
                <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full h-0.5 rounded-full ${
                  theme === 'dark' ? 'bg-blue-400' : 'bg-blue-500'
                }`} />
              )}
            </button>
          )}
          
          {categories.map((category) => {
            const isSelected = selectedCategory === category && !searchQuery;
            const config = categoryConfig[category] || { icon: '😀', label: category };
            
            return (
              <button
                key={category}
                data-category={category}
                onClick={() => {
                  setSelectedCategory(category);
                  if (emojiGridRef.current) {
                    emojiGridRef.current.scrollTop = 0;
                  }
                }}
                className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all duration-150 relative ${
                  isSelected
                    ? theme === 'dark'
                      ? 'bg-gray-800'
                      : 'bg-gray-200'
                    : theme === 'dark'
                    ? 'hover:bg-gray-800/50'
                    : 'hover:bg-gray-100'
                }`}
                title={config.label}
              >
                <span className="leading-none">{config.icon}</span>
                {isSelected && (
                  <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full h-0.5 rounded-full ${
                    theme === 'dark' ? 'bg-blue-400' : 'bg-blue-500'
                  }`} />
                )}
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className={`px-3 py-2 border-b ${
          theme === 'dark' ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="relative">
            <Search
              className={`absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              }`}
            />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim()) {
                  if (emojiGridRef.current) {
                    emojiGridRef.current.scrollTop = 0;
                  }
                }
              }}
              className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border-0 transition-all duration-200 focus:outline-none ${
                theme === 'dark'
                  ? 'bg-gray-800 text-white placeholder-gray-500 focus:bg-gray-700'
                  : 'bg-white text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20'
              }`}
            />
          </div>
        </div>

        {/* Emoji Grid */}
        <div
          ref={emojiGridRef}
          className="h-[350px] overflow-y-auto overflow-x-hidden scrollbar-hide"
        >
          {filteredEmojis.length > 0 || (selectedCategory === 'recent' && frequentlyUsedEmojis.length > 0) ? (
            <div className="p-3">
              {/* Frequently Used Section */}
              {selectedCategory === 'recent' && frequentlyUsedEmojis.length > 0 && !searchQuery && (
                <div 
                  ref={(el) => {
                    if (el) sectionRefs.current.set('recent', el);
                    else sectionRefs.current.delete('recent');
                  }}
                  className="mb-4"
                >
                  <h3 className={`font-bold text-sm mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Frequently used
                  </h3>
                  <div className="grid grid-cols-8 gap-1">
                    {frequentlyUsedEmojis.map((emoji: Emoji, index: number) => {
                      const emojiChar = unifiedToEmoji(emoji.unified);
                      if (!emojiChar) return null;

                      const emojiImageUrl = getEmojiImageUrl(emoji);
                      
                      return (
                        <motion.button
                          key={`frequent-${emoji.unified}-${index}`}
                          onClick={() => {
                            // Make sure we send the exact same emoji character that's displayed
                            onEmojiSelect(emojiChar);
                            // Also update frequently used
                            const newFrequentlyUsed = [
                              emojiChar,
                              ...frequentlyUsed.filter(e => e !== emojiChar)
                            ].slice(0, 32);
                            setFrequentlyUsed(newFrequentlyUsed);
                            localStorage.setItem('frequentlyUsedEmojis', JSON.stringify(newFrequentlyUsed));
                          }}
                          onMouseEnter={() => setHoveredEmoji({ 
                            name: emoji.short_name || emoji.name, 
                            emoji: emojiChar 
                          })}
                          onMouseLeave={() => setHoveredEmoji(null)}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center text-2xl transition-all duration-150 relative group ${
                            theme === 'dark'
                              ? 'hover:bg-gray-800 active:bg-gray-700'
                              : 'hover:bg-gray-100 active:bg-gray-200'
                          }`}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title={emoji.short_name || emoji.name}
                        >
                          {emojiImageUrl ? (
                            <img 
                              src={emojiImageUrl} 
                              alt={emoji.short_name || emoji.name}
                              className="w-8 h-8 object-contain"
                              onError={(e) => {
                                // Fallback to emoji character if image fails to load
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                if (!target.nextElementSibling) {
                                  const fallback = document.createElement('span');
                                  fallback.className = 'leading-none select-none';
                                  fallback.textContent = emojiChar;
                                  target.parentElement?.appendChild(fallback);
                                }
                              }}
                            />
                          ) : (
                            <span className="leading-none select-none">{emojiChar}</span>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Category Sections */}
              {Object.entries(groupedEmojisForDisplay).map(([category, emojis]) => {
                if (emojis.length === 0) return null;
                const config = categoryConfig[category] || { icon: '😀', label: category };
                
                return (
                  <div 
                    key={category}
                    ref={(el) => {
                      if (el) sectionRefs.current.set(category, el);
                      else sectionRefs.current.delete(category);
                    }}
                    className="mb-4"
                  >
                    <h3 className={`font-bold text-sm mb-2 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {config.label}
                    </h3>
                    <div className="grid grid-cols-8 gap-1">
                      {emojis.map((emoji: Emoji, index: number) => {
                        const emojiChar = unifiedToEmoji(emoji.unified);
                        if (!emojiChar) return null;

                        const emojiImageUrl = getEmojiImageUrl(emoji);
                        
                        return (
                          <motion.button
                            key={`${emoji.unified}-${index}`}
                            onClick={() => {
                              // Make sure we send the exact same emoji character that's displayed
                              onEmojiSelect(emojiChar);
                              // Also update frequently used
                              const newFrequentlyUsed = [
                                emojiChar,
                                ...frequentlyUsed.filter(e => e !== emojiChar)
                              ].slice(0, 32);
                              setFrequentlyUsed(newFrequentlyUsed);
                              localStorage.setItem('frequentlyUsedEmojis', JSON.stringify(newFrequentlyUsed));
                            }}
                            onMouseEnter={() => setHoveredEmoji({ 
                              name: emoji.short_name || emoji.name, 
                              emoji: emojiChar 
                            })}
                            onMouseLeave={() => setHoveredEmoji(null)}
                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-2xl transition-all duration-150 relative group ${
                              theme === 'dark'
                                ? 'hover:bg-gray-800 active:bg-gray-700'
                                : 'hover:bg-gray-100 active:bg-gray-200'
                            }`}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title={emoji.short_name || emoji.name}
                          >
                            {emojiImageUrl ? (
                              <img 
                                src={emojiImageUrl} 
                                alt={emoji.short_name || emoji.name}
                                className="w-8 h-8 object-contain"
                                onError={(e) => {
                                  // Fallback to emoji character if image fails to load
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  if (!target.nextElementSibling) {
                                    const fallback = document.createElement('span');
                                    fallback.className = 'leading-none select-none';
                                    fallback.textContent = emojiChar;
                                    target.parentElement?.appendChild(fallback);
                                  }
                                }}
                              />
                            ) : (
                              <span className="leading-none select-none">{emojiChar}</span>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              className={`flex flex-col items-center justify-center h-full py-12 ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              }`}
            >
              <Search className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm font-medium">No emojis found</p>
              <p className="text-xs mt-1 opacity-70">Try a different search</p>
            </div>
          )}
        </div>

        {/* Bottom Input Field - Facebook Style */}
        <div className={`px-3 py-2.5 border-t ${
          theme === 'dark' ? 'border-gray-800 bg-gray-900/30' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">
              {hoveredEmoji ? hoveredEmoji.emoji : '👆'}
            </span>
            <input
              type="text"
              placeholder="Pick an emoji..."
              value={hoveredEmoji ? hoveredEmoji.name : ''}
              readOnly
              className={`w-full pl-10 pr-3 py-2 text-sm rounded-lg border-0 transition-all duration-200 ${
                theme === 'dark'
                  ? 'bg-gray-800 text-gray-300 placeholder-gray-500'
                  : 'bg-white text-gray-700 placeholder-gray-400'
              }`}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EmojiPicker;
