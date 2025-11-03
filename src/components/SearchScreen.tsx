import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Users, Calendar, Heart, MessageCircle, Share2, MoreHorizontal, Filter, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import Container from './Container';

const SearchScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { theme } = useTheme();

  const filters = [
    { id: 'all', label: 'All', icon: Search },
    { id: 'people', label: 'People', icon: Users },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'posts', label: 'Posts', icon: MessageCircle },
    { id: 'locations', label: 'Places', icon: MapPin },
  ];

  const searchResults = [
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
      id: 52,
      type: 'events',
      title: 'Pride Parade 2025',
      date: 'June 15, 2025',
      time: '10:00 AM',
      location: 'Downtown City Center',
      attendees: '1.2K',
      image: 'https://images.pexels.com/photos/1601131/pexels-photo-1601131.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&dpr=2',
    },
    {
      id: 43,
      type: 'posts',
      author: {
        name: 'Jordan Kim',
        username: 'jordankim',
        avatar: 'https://images.pexels.com/photos/1559486/pexels-photo-1559486.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      },
      content: 'Celebrating my 6-month anniversary with my amazing partner today! Feeling grateful for all the love and support from this incredible community.',
      likes: 156,
      comments: 28,
      timestamp: '4h',
    },
    {
      id: 42,
      type: 'locations',
      name: 'Rainbow Community Center',
      address: '123 Pride Street, Downtown',
      rating: 4.8,
      reviews: 127,
      image: 'https://images.pexels.com/photos/1266808/pexels-photo-1266808.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&dpr=2',
    },
      {
      id: 112,
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
      id: 523,
      type: 'events',
      title: 'Pride Parade 2025',
      date: 'June 15, 2025',
      time: '10:00 AM',
      location: 'Downtown City Center',
      attendees: '1.2K',
      image: 'https://images.pexels.com/photos/1601131/pexels-photo-1601131.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&dpr=2',
    },
    {
      id: 435,
      type: 'posts',
      author: {
        name: 'Jordan Kim',
        username: 'jordankim',
        avatar: 'https://images.pexels.com/photos/1559486/pexels-photo-1559486.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      },
      content: 'Celebrating my 6-month anniversary with my amazing partner today! Feeling grateful for all the love and support from this incredible community.',
      likes: 156,
      comments: 28,
      timestamp: '4h',
    },
    {
      id: 423,
      type: 'locations',
      name: 'Rainbow Community Center',
      address: '123 Pride Street, Downtown',
      rating: 4.8,
      reviews: 127,
      image: 'https://images.pexels.com/photos/1266808/pexels-photo-1266808.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&dpr=2',
    },
      {
      id: 11,
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
      id: 23,
      type: 'events',
      title: 'Pride Parade 2025',
      date: 'June 15, 2025',
      time: '10:00 AM',
      location: 'Downtown City Center',
      attendees: '1.2K',
      image: 'https://images.pexels.com/photos/1601131/pexels-photo-1601131.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&dpr=2',
    },
    {
      id: 34,
      type: 'posts',
      author: {
        name: 'Jordan Kim',
        username: 'jordankim',
        avatar: 'https://images.pexels.com/photos/1559486/pexels-photo-1559486.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      },
      content: 'Celebrating my 6-month anniversary with my amazing partner today! Feeling grateful for all the love and support from this incredible community.',
      likes: 156,
      comments: 28,
      timestamp: '4h',
    },
    {
      id: 42,
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
    setIsSearching(true);
    // Simulate search delay
    setTimeout(() => setIsSearching(false), 1000);
  };

  const filteredResults = searchResults.filter(result => {
    if (activeFilter !== 'all' && result.type !== activeFilter) return false;
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    switch (result.type) {
      case 'people':
        return result.name.toLowerCase().includes(query) || 
               result.username.toLowerCase().includes(query) ||
               result.bio.toLowerCase().includes(query);
      case 'events':
        return result.title.toLowerCase().includes(query) ||
               result.location.toLowerCase().includes(query);
      case 'posts':
        return result.content.toLowerCase().includes(query) ||
               result.author.name.toLowerCase().includes(query);
      case 'locations':
        return result.name.toLowerCase().includes(query) ||
               result.address.toLowerCase().includes(query);
      default:
        return true;
    }
  });

  return (
    <Container>
      <div className={`sticky top-0 z-50 ${theme === 'dark' ? 'bg-black border-gray-800' : 'bg-white border-gray-200'} border-b backdrop-blur-xl bg-opacity-80`}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="relative">
            <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search people, events, posts, places..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className={`w-full pl-12 pr-12 py-3 rounded-2xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
                theme === 'dark'
                  ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-400 focus:border-gray-500 focus:ring-gray-500'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:border-gray-400 focus:ring-gray-400'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors ${
                  theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                }`}
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-row gap-2 mt-2 px-2 pt-2 overflow-x-auto scrollbar-hide">
            {filters.map((filter) => {
              const Icon = filter.icon;
              return (
                <motion.button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 whitespace-nowrap ${
                    activeFilter === filter.id
                      ? theme === 'dark'
                        ? 'bg-gray-800 text-white'
                        : 'bg-gray-900 text-white'
                      : theme === 'dark'
                      ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{filter.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {isSearching ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-12"
            >
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  Searching...
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {filteredResults.length === 0 ? (
                <div className="text-center py-12">
                  <Search className={`w-16 h-16 mx-auto mb-4 ${
                    theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                  }`} />
                  <h3 className={`text-xl font-semibold mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    No results found
                  </h3>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    Try adjusting your search terms or filters
                  </p>
                </div>
              ) : (
                filteredResults.map((result) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-2xl p-4 transition-all duration-200 cursor-pointer ${
                      theme === 'dark'
                        ? 'bg-gray-900 border border-gray-800 hover:bg-gray-800'
                        : 'bg-white border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {result.type === 'people' && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <img
                            src={result.avatar}
                            alt={result.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className={`font-semibold ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>
                                {result.name}
                              </h3>
                              {result.verified && (
                                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <p className={`text-sm ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              @{result.username}
                            </p>
                            <p className={`text-sm mt-1 ${
                              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              {result.bio}
                            </p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className={`text-sm ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                {result.followers} followers
                              </span>
                              <span className={`text-sm ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                {result.mutual} mutual
                              </span>
                            </div>
                          </div>
                        </div>
                        <button className={`px-6 py-2 rounded-full font-medium transition-colors ${
                          theme === 'dark'
                            ? 'bg-gray-800 text-white hover:bg-gray-700'
                            : 'bg-gray-900 text-white hover:bg-gray-800'
                        }`}>
                          Follow
                        </button>
                      </div>
                    )}

                    {result.type === 'events' && (
                      <div className="flex space-x-4">
                        <img
                          src={result.image}
                          alt={result.title}
                          className="w-20 h-20 rounded-xl object-cover"
                        />
                        <div className="flex-1">
                          <h3 className={`font-semibold mb-1 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            {result.title}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                              {result.date}
                            </span>
                            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                              {result.time}
                            </span>
                            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                              {result.location}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className={`text-sm ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {result.attendees} attending
                            </span>
                            <button className={`px-4 py-1 rounded-full text-sm font-medium ${
                              theme === 'dark'
                                ? 'bg-gray-800 text-white hover:bg-gray-700'
                                : 'bg-gray-900 text-white hover:bg-gray-800'
                            }`}>
                              Join
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {result.type === 'posts' && (
                      <div>
                        <div className="flex items-center space-x-3 mb-3">
                          <img
                            src={result.author.avatar}
                            alt={result.author.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <h3 className={`font-medium ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>
                              {result.author.name}
                            </h3>
                            <p className={`text-sm ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              @{result.author.username} • {result.timestamp}
                            </p>
                          </div>
                        </div>
                        <p className={`mb-3 ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {result.content}
                        </p>
                        <div className="flex items-center space-x-6">
                          <button className={`flex items-center space-x-2 ${
                            theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                          }`}>
                            <Heart className="w-4 h-4" />
                            <span className="text-sm">{result.likes}</span>
                          </button>
                          <button className={`flex items-center space-x-2 ${
                            theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                          }`}>
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-sm">{result.comments}</span>
                          </button>
                          <button className={`flex items-center space-x-2 ${
                            theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                          }`}>
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {result.type === 'locations' && (
                      <div className="flex space-x-4">
                        <img
                          src={result.image}
                          alt={result.name}
                          className="w-20 h-20 rounded-xl object-cover"
                        />
                        <div className="flex-1">
                          <h3 className={`font-semibold mb-1 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            {result.name}
                          </h3>
                          <p className={`text-sm mb-2 ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {result.address}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <svg
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < Math.floor(result.rating)
                                        ? 'text-yellow-400'
                                        : theme === 'dark'
                                        ? 'text-gray-600'
                                        : 'text-gray-300'
                                    }`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                              </div>
                              <span className={`text-sm ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                {result.rating} ({result.reviews} reviews)
                              </span>
                            </div>
                            <button className={`px-4 py-1 rounded-full text-sm font-medium ${
                              theme === 'dark'
                                ? 'bg-gray-800 text-white hover:bg-gray-700'
                                : 'bg-gray-900 text-white hover:bg-gray-800'
                            }`}>
                              Visit
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Container>
  );
};

export default SearchScreen; 