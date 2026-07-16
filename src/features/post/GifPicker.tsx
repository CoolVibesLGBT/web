import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, X, AlertCircle, Film } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { TENOR_API_KEY } from '../../appSettings';

export type GifItem = {
  id: string;
  url: string;
  previewUrl: string;
  tinyUrl: string;
  width: number;
  height: number;
  description?: string;
};

interface GifPickerProps {
  onGifSelect: (gif: GifItem) => void;
  onClose: () => void;
  isProcessing?: boolean;
}

type TenorGifResult = {
  id: string;
  content_description?: string;
  media_formats: {
    tinygif?: { url: string; dims?: number[] };
    gif?: { url: string; dims?: number[] };
    nanogif?: { url: string; dims?: number[] };
    mediumgif?: { url: string; dims?: number[] };
  };
};

const GIF_CATEGORIES = [
  { id: 'trending', label: 'Trending', endpoint: 'featured' },
  { id: 'reactions', label: 'Reactions', endpoint: 'categories_reactions' },
  { id: 'funny', label: 'Funny', endpoint: 'search', query: 'funny' },
  { id: 'gaming', label: 'Gaming', endpoint: 'search', query: 'gaming' },
  { id: 'anime', label: 'Anime', endpoint: 'search', query: 'anime' },
  { id: 'lgbt', label: 'LGBT', endpoint: 'search', query: 'lgbt' },
];

const CLIENT_KEY = 'bifrostapp-web';
const TENOR_BASE_URL = 'https://tenor.googleapis.com/v2';
const API_KEY = TENOR_API_KEY

const GifPicker: React.FC<GifPickerProps> = ({ onGifSelect, onClose, isProcessing = false }) => {
  const { theme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>('trending');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [gifs, setGifs] = useState<GifItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const gifCache = useRef<Map<string, GifItem[]>>(new Map());

  const canFetch = useMemo(() => Boolean(API_KEY && API_KEY.trim().length > 0), []);

  const buildCacheKey = useCallback((endpoint: string, params: Record<string, string>) => {
    const sortedEntries = Object.entries(params)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
    return `${endpoint}:${JSON.stringify(sortedEntries)}`;
  }, []);

  const mapGifResults = useCallback((results: TenorGifResult[]): GifItem[] => {
    return results
      .map((gif) => {
        const preview =
          gif.media_formats.tinygif?.url ||
          gif.media_formats.nanogif?.url ||
          gif.media_formats.gif?.url ||
          '';
        const full =
          gif.media_formats.gif?.url ||
          gif.media_formats.mediumgif?.url ||
          gif.media_formats.tinygif?.url ||
          preview;

        if (!preview || !full) {
          return null;
        }

        const dims = gif.media_formats.gif?.dims || gif.media_formats.tinygif?.dims || [1, 1];

        return {
          id: gif.id,
          url: full,
          previewUrl: preview,
          tinyUrl: gif.media_formats.nanogif?.url || preview,
          width: dims?.[0] ?? 1,
          height: dims?.[1] ?? 1,
          description: gif.content_description,
        };
      })
      .filter(Boolean) as GifItem[];
  }, []);

  const fetchGifs = useCallback(
    async (endpoint: string, params: Record<string, string> = {}) => {
      if (!canFetch) return;

      const cacheKey = buildCacheKey(endpoint, params);
      const cached = gifCache.current.get(cacheKey);
      if (cached) {
        setGifs(cached);
      }

      setIsLoading(true);
      setError(null);
      const fetchId = ++requestIdRef.current;

      const url = new URL(`${TENOR_BASE_URL}/${endpoint}`);
      url.searchParams.set('key', API_KEY);
      url.searchParams.set('client_key', CLIENT_KEY);
      url.searchParams.set('limit', '32');
      url.searchParams.set('media_filter', 'gif,tinygif,nanogif');
      url.searchParams.set('contentfilter', 'medium');

      Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

      try {
        const response = await fetch(url.toString());

        if (!response.ok) {
          throw new Error(`Tenor request failed: ${response.status}`);
        }

        const data = await response.json();
        const results = Array.isArray(data.results) ? data.results : [];
        const mapped = mapGifResults(results);
        gifCache.current.set(cacheKey, mapped);

        // Ignore responses from outdated requests
        if (fetchId === requestIdRef.current) {
          setGifs(mapped);
        }
      } catch (err) {
        if (fetchId === requestIdRef.current) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load GIFs right now. Please try again in a moment.'
          );
        }
      } finally {
        if (fetchId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    [buildCacheKey, canFetch, mapGifResults]
  );

  const handleCategoryChange = (categoryId: string) => {
    const category = GIF_CATEGORIES.find((cat) => cat.id === categoryId);
    if (!category) {
      return;
    }
    setSelectedCategory(category.id);

    if (category.endpoint === 'featured') {
      fetchGifs('featured', { random: 'true' });
    } else if (category.endpoint === 'categories_reactions') {
      fetchGifs('featured', { random: 'true', category: 'reactions' });
    } else if (category.endpoint === 'search') {
      fetchGifs('search', { q: category.query ?? 'gif', random: 'true' });
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      handleCategoryChange('trending');
      return;
    }

    setSelectedCategory('');
    await fetchGifs('search', { q: query.trim(), random: 'false' });
  };

  const handleGifSelect = (gif: GifItem) => {
    if (isProcessing) return;
    onGifSelect(gif);
  };

  useEffect(() => {
    if (canFetch) {
      handleCategoryChange('trending');
    }
  }, [canFetch]);

  const renderContent = () => {
    if (!canFetch) {
      return (
        <div
          className={`flex flex-col items-center justify-center w-full rounded-2xl border p-4 sm:p-6 text-center ${
            theme === 'dark'
              ? 'border-gray-900 bg-gray-900/30 text-gray-300'
              : 'border-gray-200 bg-gray-50 text-gray-700'
          }`}
        >
          <AlertCircle className="w-8 h-8 mb-3 text-orange-500" />
          <p className="text-sm font-semibold">Tenor API key missing</p>
          <p className="text-xs mt-1">
            Set <code className="px-1 py-0.5 rounded bg-black/10">VITE_TENOR_API_KEY</code> in your
            environment variables to enable GIF search.
          </p>
        </div>
      );
    }

    if (error) {
      return (
        <div
          className={`flex flex-col items-center justify-center w-full rounded-2xl border p-4 sm:p-6 text-center ${
            theme === 'dark'
              ? 'border-gray-900 bg-gray-900/30 text-gray-300'
              : 'border-gray-200 bg-gray-50 text-gray-700'
          }`}
        >
          <AlertCircle className="w-8 h-8 mb-3 text-red-500" />
          <p className="text-sm font-semibold">Failed to load GIFs</p>
          <p className="text-xs mt-1">{error}</p>
          <button
            type="button"
            onClick={() => handleCategoryChange(selectedCategory || 'trending')}
            className={`mt-3 px-3 py-1.5 rounded-lg text-xs font-semibold ${
              theme === 'dark'
                ? 'bg-gray-900/60 text-white hover:bg-gray-900/80'
                : 'bg-gray-900 text-white hover:bg-black'
            }`}
          >
            Try Again
          </button>
        </div>
      );
    }

    if (isLoading && gifs.length === 0) {
      return (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 sm:gap-4">
          {Array.from({ length: 10 }).map((_, idx) => (
            <div
              key={idx}
              className={`aspect-square rounded-2xl animate-pulse ${
                theme === 'dark' ? 'bg-gray-900/40' : 'bg-gray-100'
              }`}
            />
          ))}
        </div>
      );
    }

    if (gifs.length === 0) {
      return (
        <div
          className={`w-full rounded-2xl border p-5 text-center text-sm font-medium ${
            theme === 'dark'
              ? 'border-gray-900 bg-gray-900/30 text-gray-400'
              : 'border-gray-200 bg-gray-50 text-gray-500'
          }`}
        >
          No GIFs found for your search. Try a different query.
        </div>
      );
    }

    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
        {gifs.map((gif) => (
          <motion.button
            key={gif.id}
            type="button"
            disabled={isProcessing}
            onClick={() => handleGifSelect(gif)}
            whileHover={!isProcessing ? { scale: 1.04 } : {}}
            whileTap={!isProcessing ? { scale: 0.95 } : {}}
            className={`relative aspect-square rounded-2xl overflow-hidden border transition-all duration-150 ${
              theme === 'dark'
                ? 'border-gray-900 bg-gray-900/40 hover:border-white/30'
                : 'border-gray-200 bg-white hover:border-gray-400'
            } ${isProcessing ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <img
              src={gif.previewUrl}
              alt={gif.description || 'GIF'}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {gif.description && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1 text-[10px] text-white text-left truncate">
                {gif.description}
              </div>
            )}
          </motion.button>
        ))}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className={`py-4 border-t border-b ${
        theme === 'dark'
          ? 'cv-card-surface-soft border-white/10'
          : 'bg-white/95 border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                theme === 'dark'
                  ? 'bg-gray-900/60 border border-gray-900'
                  : 'bg-gray-100 border border-gray-200'
              }`}
            >
              <Film className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
            </div>
            <div className="min-w-0">
              <p className={`text-base font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                GIFs
              </p>
              <p className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Powered by Tenor
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

      <div className="flex flex-wrap items-center gap-2 mt-4">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
            theme === 'dark'
              ? 'border-gray-900 bg-gray-900/30'
              : 'border-gray-200 bg-gray-50'
          }`}
        >
          <Search className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch(searchQuery);
              }
            }}
            placeholder="Search GIFs"
            className={`bg-transparent focus:outline-none text-sm ${
              theme === 'dark' ? 'text-white placeholder:text-white/40' : 'text-gray-900'
            }`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                handleCategoryChange('trending');
              }}
              className={`rounded-full p-1 ${
                theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => handleSearch(searchQuery)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            theme === 'dark'
              ? 'bg-white text-black hover:bg-gray-200'
              : 'bg-black text-white hover:bg-gray-900'
          }`}
        >
          Search
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto mt-4 pb-1 scrollbar-hide">
        {GIF_CATEGORIES.map((category) => (
          <motion.button
            key={category.id}
            type="button"
            onClick={() => handleCategoryChange(category.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
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

      <div className="mt-5">{renderContent()}</div>
    </motion.div>
  );
};

export default GifPicker;
