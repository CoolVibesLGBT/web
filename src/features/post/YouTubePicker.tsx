import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, X, AlertCircle, Youtube } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { YOUTUBE_API_KEY } from '../../appSettings';

export type YouTubeVideo = {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string;
  thumbnail: string;
};

interface YouTubePickerProps {
  onVideoSelect: (video: YouTubeVideo) => void;
  onClose: () => void;
  isProcessing?: boolean;
}

type YouTubeApiSearchResult = {
  id: { videoId?: string } | string;
  snippet?: {
    title?: string;
    description?: string;
    channelTitle?: string;
    publishedAt?: string;
    thumbnails?: {
      medium?: { url?: string };
      high?: { url?: string };
    };
  };
};

const YOUTUBE_CATEGORIES = [
  { id: 'lgbt', label: 'LGBTQ+', endpoint: 'search' as const, query: 'LGBTQ+ videos' },
  { id: 'lgbt_music', label: 'LGBTQ+ Music', endpoint: 'search' as const, query: 'LGBTQ+ music videos' },
  { id: 'lgbt_news', label: 'LGBTQ+ News', endpoint: 'search' as const, query: 'LGBTQ+ news' },
  { id: 'trending', label: 'Trending', endpoint: 'videos' as const, params: { chart: 'mostPopular' } },
  { id: 'music', label: 'Music', endpoint: 'search' as const, query: 'music video' },
  { id: 'gaming', label: 'Gaming', endpoint: 'search' as const, query: 'gaming highlights' },
  { id: 'news', label: 'News', endpoint: 'search' as const, query: 'breaking news' },
  { id: 'sports', label: 'Sports', endpoint: 'search' as const, query: 'sports highlights' },
];

const YOUTUBE_BASE_URL = 'https://www.googleapis.com/youtube/v3';
const API_KEY = YOUTUBE_API_KEY;

const YouTubePicker: React.FC<YouTubePickerProps> = ({ onVideoSelect, onClose, isProcessing = false }) => {
  const { theme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>('lgbt');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const videoCache = useRef<Map<string, YouTubeVideo[]>>(new Map());

  const canFetch = useMemo(() => Boolean(API_KEY && API_KEY.trim().length > 0), []);

  const buildCacheKey = useCallback((endpoint: string, params: Record<string, string>) => {
    const sortedEntries = Object.entries(params).sort(([a], [b]) => a.localeCompare(b));
    return `${endpoint}:${JSON.stringify(sortedEntries)}`;
  }, []);

  const mapVideoResults = useCallback((items: YouTubeApiSearchResult[]): YouTubeVideo[] => {
    return items
      .map((item) => {
        const snippet = item.snippet;
        if (!snippet) return null;

        const rawId = typeof item.id === 'string' ? item.id : item.id?.videoId;
        if (!rawId) return null;

        return {
          id: rawId,
          title: snippet.title || 'Untitled video',
          description: snippet.description || '',
          channelTitle: snippet.channelTitle || 'Unknown channel',
          publishedAt: snippet.publishedAt || '',
          thumbnail:
            snippet.thumbnails?.high?.url ||
            snippet.thumbnails?.medium?.url ||
            `https://i.ytimg.com/vi/${rawId}/mqdefault.jpg`,
        };
      })
      .filter(Boolean) as YouTubeVideo[];
  }, []);

  const fetchVideos = useCallback(
    async (endpoint: 'videos' | 'search', params: Record<string, string> = {}) => {
      if (!canFetch) return;

      const cacheKey = buildCacheKey(endpoint, params);
      const cached = videoCache.current.get(cacheKey);
      if (cached) {
        setVideos(cached);
      }

      setIsLoading(true);
      setError(null);
      const fetchId = ++requestIdRef.current;

      const url = new URL(`${YOUTUBE_BASE_URL}/${endpoint}`);
      url.searchParams.set('key', API_KEY);
      url.searchParams.set('maxResults', '24');

      if (endpoint === 'videos') {
        url.searchParams.set('part', 'snippet,contentDetails,statistics');
        url.searchParams.set('regionCode', 'US');
      } else {
        url.searchParams.set('part', 'snippet');
        url.searchParams.set('type', 'video');
        url.searchParams.set('videoEmbeddable', 'true');
        url.searchParams.set('safeSearch', 'moderate');
      }

      Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

      try {
        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error(`YouTube request failed: ${response.status}`);
        }
        const data = await response.json();
        const items: YouTubeApiSearchResult[] = Array.isArray(data.items) ? data.items : [];
        const mapped = mapVideoResults(items);
        videoCache.current.set(cacheKey, mapped);

        if (fetchId === requestIdRef.current) {
          setVideos(mapped);
        }
      } catch (err) {
        if (fetchId === requestIdRef.current) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load videos right now. Please try again shortly.',
          );
        }
      } finally {
        if (fetchId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    [buildCacheKey, canFetch, mapVideoResults],
  );

  const handleCategoryChange = (categoryId: string) => {
    const category = YOUTUBE_CATEGORIES.find((cat) => cat.id === categoryId);
    if (!category) return;
    setSelectedCategory(category.id);

    if (category.endpoint === 'videos') {
      fetchVideos('videos', { chart: 'mostPopular' });
    } else if (category.endpoint === 'search') {
      fetchVideos('search', { q: category.query ?? 'youtube' });
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      handleCategoryChange('trending');
      return;
    }

    setSelectedCategory('');
    await fetchVideos('search', { q: query.trim() });
  };

  const handleVideoSelect = (video: YouTubeVideo) => {
    if (isProcessing) return;
    onVideoSelect(video);
  };

  useEffect(() => {
    if (canFetch) {
      handleCategoryChange('lgbt');
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
          <p className="text-sm font-semibold">YouTube API key missing</p>
          <p className="text-xs mt-1">
            Set <code className="px-1 py-0.5 rounded bg-black/10">VITE_YOUTUBE_API_KEY</code> to enable video search.
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
          <p className="text-sm font-semibold">Failed to load videos</p>
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

    if (isLoading && videos.length === 0) {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className={`rounded-2xl h-32 sm:h-36 animate-pulse ${
                theme === 'dark' ? 'bg-gray-900/40' : 'bg-gray-100'
              }`}
            />
          ))}
        </div>
      );
    }

    if (videos.length === 0) {
      return (
        <div
          className={`w-full rounded-2xl border p-5 text-center text-sm font-medium ${
            theme === 'dark'
              ? 'border-gray-900 bg-gray-900/30 text-gray-400'
              : 'border-gray-200 bg-gray-50 text-gray-500'
          }`}
        >
          No videos found for your search. Try a different query.
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {videos.map((video) => (
          <motion.button
            key={video.id}
            type="button"
            disabled={isProcessing}
            onClick={() => handleVideoSelect(video)}
            whileHover={!isProcessing ? { scale: 1.02 } : {}}
            whileTap={!isProcessing ? { scale: 0.97 } : {}}
            className={`rounded-2xl border overflow-hidden text-left transition-all duration-150 ${
              theme === 'dark'
                ? 'border-gray-900 bg-gray-900/40 hover:border-white/30'
                : 'border-gray-200 bg-white hover:border-gray-400'
            } ${isProcessing ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="relative aspect-video w-full bg-black/40">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            </div>
            <div className="p-3 flex flex-col gap-1">
              <p className={`text-sm font-semibold line-clamp-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {video.title}
              </p>
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {video.channelTitle}
              </p>
              {video.publishedAt && (
                <p className="text-[11px] text-gray-500">
                  {new Date(video.publishedAt).toLocaleDateString()}
                </p>
              )}
            </div>
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
        theme === 'dark' ? 'cv-card-surface-soft border-white/10' : 'bg-white/95 border-gray-200'
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
            <Youtube className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
          </div>
          <div className="min-w-0">
            <p className={`text-base font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              YouTube
            </p>
            <p className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Search & embed videos
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={`p-2 rounded-xl transition-colors ${
            theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-900/60' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch gap-2 mt-4">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border flex-1 min-w-0 ${
            theme === 'dark' ? 'border-gray-900 bg-gray-900/30' : 'border-gray-200 bg-gray-50'
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
            placeholder="Search YouTube"
            className={`flex-1 min-w-0 bg-transparent focus:outline-none text-sm ${
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
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors sm:w-auto w-full text-center ${
            theme === 'dark' ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-900'
          }`}
        >
          Search
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap mt-4 pb-1 scrollbar-hide">
        {YOUTUBE_CATEGORIES.map((category) => (
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

export default YouTubePicker;
