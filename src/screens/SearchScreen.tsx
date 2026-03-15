import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Users, Calendar, Heart, MessageCircle, Share2, X, ArrowLeft, MoreVertical, Star } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSEO } from '../hooks/useSEO';

interface SearchResult {
  id: number;
  type: 'people' | 'events' | 'posts' | 'locations';
  name?: string;
  username?: string;
  avatar?: string;
  verified?: boolean;
  bio?: string;
  followers?: string;
  mutual?: number;
  title?: string;
  date?: string;
  time?: string;
  location?: string;
  attendees?: string;
  image?: string;
  author?: {
    name: string;
    username: string;
    avatar: string;
  };
  content?: string;
  likes?: number;
  comments?: number;
  timestamp?: string;
  address?: string;
  rating?: number;
  reviews?: number;
}

const SearchScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation('common');

  useSEO({
    title: 'Search',
    description: 'Search for people, events, posts and LGBTQ+ places on CoolVibes.',
    canonical: '/search',
    noindex: true,
  });

  const isDark = theme === 'dark';
  const bgColor = isDark ? 'bg-gray-950' : 'bg-white';
  const textColor = isDark ? 'text-white' : 'text-gray-900';
  const secTextColor = isDark ? 'text-gray-400' : 'text-gray-600';
  const borderColor = isDark ? 'border-gray-900' : 'border-gray-200/50';

  const filters = [
    { id: 'all', label: 'All', icon: Search },
    { id: 'people', label: 'People', icon: Users },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'posts', label: 'Posts', icon: MessageCircle },
    { id: 'locations', label: 'Places', icon: MapPin },
  ];

  // Dummy data for visual demonstration
  const searchResults: SearchResult[] = [
    {
      id: 1,
      type: 'people',
      name: 'Alex Rivera',
      username: 'alexr_pride',
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      verified: true,
      bio: 'LGBTQ+ activist and community organizer',
      followers: '2.4K',
      mutual: 12,
    },
    {
      id: 2,
      type: 'events',
      title: 'Pride Parade 2025',
      date: 'June 15, 2025',
      time: '10:00 AM',
      location: 'Downtown City Center',
      attendees: '1.2K',
      image: 'https://images.pexels.com/photos/1601131/pexels-photo-1601131.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&dpr=2',
    },
    {
      id: 3,
      type: 'posts',
      author: {
        name: 'Jordan Kim',
        username: 'jordankim',
        avatar: 'https://images.pexels.com/photos/1559486/pexels-photo-1559486.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      },
      content: 'Celebrating our amazing community today! Feeling grateful for all the love and support.',
      likes: 156,
      comments: 28,
      timestamp: '4h',
    },
    {
      id: 4,
      type: 'locations',
      name: 'Rainbow Community Center',
      address: '123 Pride Street, Downtown',
      rating: 4.8,
      reviews: 127,
      image: 'https://images.pexels.com/photos/1266808/pexels-photo-1266808.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&dpr=2',
    },
  ];

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length > 2) {
      setIsSearching(true);
      setTimeout(() => setIsSearching(false), 800);
    }
  };

  const filteredResults = searchResults.filter(result => {
    if (activeFilter !== 'all' && result.type !== activeFilter) return false;
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      result.name?.toLowerCase().includes(query) ||
      result.username?.toLowerCase().includes(query) ||
      result.title?.toLowerCase().includes(query) ||
      result.content?.toLowerCase().includes(query) ||
      result.location?.toLowerCase().includes(query)
    );
  });

  return (
    <div className={`flex flex-col h-[100dvh] w-full max-w-[600px] mx-auto ${bgColor} ${textColor}`}>
      {/* Header */}
      <div className={`flex-shrink-0 sticky top-0 z-50 ${isDark ? 'bg-gray-950/95' : 'bg-white/95'} backdrop-blur-md border-b ${borderColor}`}>
        <div className="flex items-center gap-2 h-[64px] px-4">
          <button
            onClick={() => navigate(-1)}
            className={`p-2.5 -ml-2 rounded-full transition-all active:scale-90 ${isDark ? 'hover:bg-gray-900/50' : 'hover:bg-gray-100'}`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <h1 className="text-[17px] font-bold tracking-tight whitespace-nowrap mr-2">
            {t('search.title', { defaultValue: 'Search' })}
          </h1>

          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${secTextColor}`} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={t('search.placeholder', { defaultValue: 'Search vibes...' })}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className={`w-full bg-transparent pl-10 pr-10 py-2.5 text-[15px] focus:outline-none placeholder:text-gray-500`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors ${isDark ? 'hover:bg-gray-900' : 'hover:bg-gray-100'}`}
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 pb-3 overflow-x-auto scrollbar-hide">
          <div className="flex space-x-1">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-[14px] text-[13px] font-bold transition-all duration-200 whitespace-nowrap ${
                  activeFilter === filter.id
                    ? (isDark ? 'bg-white text-black' : 'bg-gray-900 text-white')
                    : (isDark ? 'text-gray-400 hover:text-white hover:bg-gray-900/50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100')
                }`}
              >
                <filter.icon className="w-4 h-4" />
                <span>{filter.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pt-6 pb-24">
        {isSearching ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className={`w-[64px] h-[64px] rounded-[22px] flex items-center justify-center mb-6 animate-pulse ${isDark ? 'bg-gray-900/30' : 'bg-gray-50'}`}>
              <Search className={`w-8 h-8 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
            </div>
            <p className={`text-[15px] font-medium ${secTextColor}`}>Finding your vibes...</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredResults.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-24 px-8 text-center"
              >
                <div className={`w-[64px] h-[64px] rounded-[22px] flex items-center justify-center mb-6 ${isDark ? 'bg-gray-900/30' : 'bg-gray-50'}`}>
                  <Search className={`w-8 h-8 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} strokeWidth={1.5} />
                </div>
                <h3 className={`text-[17px] font-bold mb-2 ${textColor}`}>No results found</h3>
                <p className={`text-[14px] max-w-[260px] leading-relaxed ${secTextColor}`}>
                  Try a different search term or explore one of the categories above.
                </p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {filteredResults.map((result, index) => (
                  <motion.div
                    key={`${result.type}-${result.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`group p-5 rounded-[24px] border transition-all duration-200 cursor-pointer ${
                      isDark 
                        ? 'bg-gray-900/20 hover:bg-gray-900/40 border-gray-900/50' 
                        : 'bg-white hover:bg-gray-50 border-gray-100 shadow-sm'
                    }`}
                  >
                    {result.type === 'people' && (
                      <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-[20px] overflow-hidden flex-shrink-0 ring-2 ${isDark ? 'ring-gray-900' : 'ring-gray-100'}`}>
                          <img src={result.avatar} alt={result.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <h3 className={`text-[16px] font-bold truncate ${textColor}`}>{result.name}</h3>
                            {result.verified && <div className="w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center"><svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg></div>}
                          </div>
                          <p className={`text-[13px] font-medium mb-1.5 ${secTextColor}`}>@{result.username} • {result.followers} followers</p>
                          <p className={`text-[14px] line-clamp-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{result.bio}</p>
                        </div>
                        <button className={`px-4 py-1.5 rounded-[12px] text-[13px] font-bold transition-all ${isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>Follow</button>
                      </div>
                    )}

                    {result.type === 'events' && (
                      <div className="flex gap-4">
                        <img src={result.image} alt={result.title} className="w-24 h-24 rounded-[18px] object-cover flex-shrink-0" />
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <h3 className={`text-[16px] font-bold mb-1 truncate ${textColor}`}>{result.title}</h3>
                          <div className="flex items-center gap-2 text-[13px] mb-2">
                            <span className="text-pink-500 font-bold">{result.date}</span>
                            <span className="text-gray-500">•</span>
                            <span className={`truncate ${secTextColor}`}>{result.location}</span>
                          </div>
                          <span className={`text-[12px] font-medium ${secTextColor}`}>{result.attendees} attending</span>
                        </div>
                      </div>
                    )}

                    {result.type === 'posts' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <img src={result.author?.avatar} alt={result.author?.name} className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-900" />
                          <div className="flex-1 min-w-0">
                            <h3 className={`text-[14px] font-bold truncate ${textColor}`}>{result.author?.name}</h3>
                            <p className={`text-[12px] ${secTextColor}`}>@{result.author?.username} • {result.timestamp}</p>
                          </div>
                          <button className={`p-1.5 rounded-full transition-colors ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}><MoreVertical className="w-4 h-4 text-gray-500" /></button>
                        </div>
                        <p className={`text-[14px] leading-relaxed line-clamp-3 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{result.content}</p>
                        <div className="flex items-center gap-6 pt-1">
                          <button className={`flex items-center gap-2 text-[13px] font-medium ${secTextColor} hover:text-white transition-colors`}><Heart className="w-4 h-4" /> {result.likes}</button>
                          <button className={`flex items-center gap-2 text-[13px] font-medium ${secTextColor} hover:text-white transition-colors`}><MessageCircle className="w-4 h-4" /> {result.comments}</button>
                          <button className={`p-1.5 -m-1.5 rounded-full ${secTextColor} hover:text-white transition-colors ml-auto`}><Share2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    )}

                    {result.type === 'locations' && (
                      <div className="flex gap-4">
                        <img src={result.image} alt={result.name} className="w-20 h-20 rounded-[18px] object-cover flex-shrink-0" />
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <h3 className={`text-[16px] font-bold mb-1 truncate ${textColor}`}>{result.name}</h3>
                          <p className={`text-[13px] mb-2 truncate ${secTextColor}`}>{result.address}</p>
                          <div className="flex items-center gap-1.5 text-[13px] font-bold">
                            <div className="flex items-center text-yellow-500"><Star className="w-3.5 h-3.5 fill-current" /> <span className="ml-1">{result.rating}</span></div>
                            <span className="text-gray-500">•</span>
                            <span className={secTextColor}>{result.reviews} reviews</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default SearchScreen;