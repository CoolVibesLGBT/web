import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { Plus, Search, Briefcase, Home, MapPin, Clock, Tag, X, User, Mail, CheckCircle, ArrowLeft, Star } from 'lucide-react';
import Container from './Container';

interface Author {
  name: string;
  avatar: string;
  verified: boolean;
  rating: number;
  memberSince: string;
}

interface Ad {
  id: number;
  title: string;
  description: string;
  category: 'job' | 'roommate';
  location: string;
  postedDate: string;
  contact: string;
  author: string;
  authorDetails: Author;
}

const ClassifiedsScreen: React.FC = () => {
  const { theme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'job' | 'roommate'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<'list' | 'detail' | 'add'>('list');
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [newAd, setNewAd] = useState({
    title: '',
    description: '',
    category: 'job' as 'job' | 'roommate',
    location: '',
    contact: '',
  });

  const dummyAds: Ad[] = [
    {
      id: 1,
      title: 'Barista Position Available',
      description: 'We are looking for an experienced barista. Part-time position with flexible hours. Training provided.',
      category: 'job',
      location: 'New York, NY',
      postedDate: '2 hours ago',
      contact: 'apply@cafe.com',
      author: 'Coffee Shop',
      authorDetails: {
        name: 'Coffee Shop',
        avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
        verified: true,
        rating: 4.8,
        memberSince: '2020',
      },
    },
    {
      id: 2,
      title: 'Roommate Wanted - LGBT+ Friendly',
      description: 'Spacious 2-bedroom apartment. Looking for a respectful, clean roommate. All utilities included. LGBT+ friendly environment. Close to public transportation and shopping centers.',
      category: 'roommate',
      location: 'Los Angeles, CA',
      postedDate: '5 hours ago',
      contact: 'roommate@example.com',
      author: 'Sarah M.',
      authorDetails: {
        name: 'Sarah M.',
        avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
        verified: true,
        rating: 4.9,
        memberSince: '2019',
      },
    },
    {
      id: 3,
      title: 'Graphic Designer Position',
      description: 'Remote graphic designer position. Must have 3+ years of experience with Adobe Creative Suite. Great team culture and competitive salary.',
      category: 'job',
      location: 'Remote',
      postedDate: '1 day ago',
      contact: 'jobs@company.com',
      author: 'Design Agency',
      authorDetails: {
        name: 'Design Agency',
        avatar: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
        verified: true,
        rating: 4.7,
        memberSince: '2018',
      },
    },
    {
      id: 4,
      title: 'Seeking LGBT+ Friendly Roommate',
      description: 'LGBT+ friendly household seeking a roommate. Quiet neighborhood, close to public transport. Safe and inclusive environment.',
      category: 'roommate',
      location: 'San Francisco, CA',
      postedDate: '2 days ago',
      contact: 'housing@example.com',
      author: 'Alex R.',
      authorDetails: {
        name: 'Alex R.',
        avatar: 'https://images.pexels.com/photos/1102341/pexels-photo-1102341.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
        verified: true,
        rating: 5.0,
        memberSince: '2021',
      },
    },
  ];

  const filteredAds = dummyAds.filter((ad) => {
    const matchesCategory = selectedCategory === 'all' || ad.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      ad.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ad.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('New ad:', newAd);
    setActiveView('list');
    setNewAd({
      title: '',
      description: '',
      category: 'job',
      location: '',
      contact: '',
    });
  };

  const handleViewDetail = (ad: Ad) => {
    setSelectedAd(ad);
    setActiveView('detail');
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-10 ${theme === 'dark' ? 'bg-black border-b border-black' : 'bg-white border-b border-gray-100'}`}>
        {activeView === 'list' && (
          <div className="px-4 md:px-6 py-4">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="min-w-0 flex-1">
                <h1 className={`text-xl md:text-2xl font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Classifieds
                </h1>
                <p className={`text-xs md:text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Find jobs and roommates
                </p>
              </div>
              <button
                onClick={() => setActiveView('add')}
                className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 rounded-xl text-sm md:text-base font-semibold transition-all duration-200 flex-shrink-0 ${
                  theme === 'dark'
                    ? 'bg-white text-black hover:bg-gray-200'
                    : 'bg-black text-white hover:bg-gray-900'
                }`}
              >
                <Plus className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Post New Ad</span>
                <span className="sm:hidden">New</span>
              </button>
            </div>

            {/* Search Bar */}
            <div>
              <div className={`relative ${theme === 'dark' ? 'bg-gray-950 border border-gray-900' : 'bg-gray-50 border border-gray-200'} rounded-xl overflow-hidden`}>
                <Search className={`absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                <input
                  type="text"
                  placeholder="Search ads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 text-sm md:text-base bg-transparent ${theme === 'dark' ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'} focus:outline-none`}
                />
              </div>
            </div>
          </div>
        )}

        {activeView === 'detail' && selectedAd && (
          <div className="px-4 md:px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveView('list')}
                className={`p-2 rounded-full transition-all duration-200 ${
                  theme === 'dark'
                    ? 'hover:bg-white/10 text-gray-400 hover:text-white'
                    : 'hover:bg-black/5 text-gray-600 hover:text-black'
                }`}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className={`text-lg md:text-xl font-bold truncate px-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Ad Details
              </h2>
              <div className="w-12"></div>
            </div>
          </div>
        )}

        {activeView === 'add' && (
          <div className="px-4 md:px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveView('list')}
                className={`p-2 rounded-full transition-all duration-200 ${
                  theme === 'dark'
                    ? 'hover:bg-white/10 text-gray-400 hover:text-white'
                    : 'hover:bg-black/5 text-gray-600 hover:text-black'
                }`}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className={`text-lg md:text-xl font-bold truncate px-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Post New Ad
              </h2>
              <div className="w-12"></div>
            </div>
          </div>
        )}
      </div>

      {/* List View */}
      {activeView === 'list' && (
        <>
          {/* Mobile Categories */}
          <div className={`md:hidden px-4 py-3 border-b ${theme === 'dark' ? 'border-gray-900' : 'border-gray-200'} overflow-x-auto`}>
            <div className="flex gap-2">
              {[
                { id: 'all', label: 'All Ads', icon: Tag },
                { id: 'job', label: 'Jobs', icon: Briefcase },
                { id: 'roommate', label: 'Roommates', icon: Home },
              ].map((category) => {
                const Icon = category.icon;
                const isActive = selectedCategory === category.id;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                      isActive
                        ? theme === 'dark'
                          ? 'bg-white text-black'
                          : 'bg-black text-white'
                        : theme === 'dark'
                          ? 'bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-black'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{category.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col md:flex-row">
            {/* Sidebar - Categories - Hidden on mobile */}
            <aside className={`hidden md:block w-64 ${theme === 'dark' ? 'border-r border-gray-900' : 'border-r border-gray-200'}`}>
              <div className="p-6">
              <h2 className={`font-bold text-lg mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Categories
              </h2>
              <div className="space-y-2">
                {[
                  { id: 'all', label: 'All Ads', icon: Tag },
                  { id: 'job', label: 'Jobs', icon: Briefcase },
                  { id: 'roommate', label: 'Roommates', icon: Home },
                ].map((category) => {
                  const Icon = category.icon;
                  const isActive = selectedCategory === category.id;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id as any)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        isActive
                          ? theme === 'dark'
                            ? 'bg-white text-black'
                            : 'bg-black text-white'
                          : theme === 'dark'
                            ? 'hover:bg-gray-950 text-gray-400 hover:text-white'
                            : 'hover:bg-gray-100 text-gray-600 hover:text-black'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-semibold">{category.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <Container>
          <main className="flex-1 p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAds.map((ad, index) => (
                <motion.div
                  key={ad.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`cursor-pointer rounded-2xl overflow-hidden transition-all duration-200 ${
                    theme === 'dark'
                      ? 'bg-gray-950 border border-gray-900 hover:bg-gray-900/50'
                      : 'bg-white border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="p-6">
                    {/* Category Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${
                        ad.category === 'job'
                          ? 'bg-blue-500/10 text-blue-500'
                          : 'bg-green-500/10 text-green-500'
                      }`}>
                        {ad.category === 'job' ? <Briefcase className="w-3 h-3" /> : <Home className="w-3 h-3" />}
                        {ad.category === 'job' ? 'Job' : 'Roommate'}
                      </div>
                      <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                        {ad.postedDate}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className={`text-lg font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {ad.title}
                    </h3>

                    {/* Description */}
                    <p className={`text-sm mb-4 line-clamp-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {ad.description}
                    </p>

                    {/* Author Profile */}
                    <div className={`p-3 rounded-xl mb-4 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
                      <div className="flex items-center gap-3">
                        <img
                          src={ad.authorDetails.avatar}
                          alt={ad.authorDetails.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              {ad.authorDetails.name}
                            </span>
                            {ad.authorDetails.verified && (
                              <CheckCircle className="w-4 h-4 text-blue-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                              {ad.authorDetails.rating}
                            </span>
                            <span className={`text-xs ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>·</span>
                            <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                              Since {ad.authorDetails.memberSince}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {ad.location}
                        </span>
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2">
                      <motion.button
                        onClick={() => handleViewDetail(ad)}
                        whileHover={{
                          backgroundColor: theme === 'dark' ? 'rgba(17, 24, 39, 1)' : 'rgba(243, 244, 246, 1)',
                        }}
                        whileTap={{ scale: 0.98 }}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                          theme === 'dark'
                            ? 'border-gray-800 text-gray-300'
                            : 'border-gray-200 text-gray-700'
                        }`}
                      >
                        View Details
                      </motion.button>
                      <motion.button
                        whileHover={{
                          backgroundColor: theme === 'dark' ? 'rgba(229, 231, 235, 1)' : 'rgba(17, 24, 39, 1)',
                        }}
                        whileTap={{ scale: 0.98 }}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                          theme === 'dark'
                            ? 'bg-white text-black'
                            : 'bg-black text-white'
                        }`}
                      >
                        Contact
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredAds.length === 0 && (
              <div className="text-center py-16">
                <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  No ads found
                </p>
              </div>
            )}
          </main>
          </Container>
        </div>
        </>
      )}

      {/* Detail View */}
      {activeView === 'detail' && selectedAd && (
        <div className="px-6 py-6">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {/* Category Badge */}
              <div className="mb-4">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${
                  selectedAd.category === 'job'
                    ? 'bg-blue-500/10 text-blue-500'
                    : 'bg-green-500/10 text-green-500'
                }`}>
                  {selectedAd.category === 'job' ? <Briefcase className="w-3 h-3" /> : <Home className="w-3 h-3" />}
                  {selectedAd.category === 'job' ? 'Job' : 'Roommate'}
                </div>
              </div>

              {/* Title */}
              <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {selectedAd.title}
              </h2>

              {/* Author Profile */}
              <div className={`p-4 rounded-xl mb-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-4">
                  <img
                    src={selectedAd.authorDetails.avatar}
                    alt={selectedAd.authorDetails.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {selectedAd.authorDetails.name}
                      </span>
                      {selectedAd.authorDetails.verified && (
                        <CheckCircle className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {selectedAd.authorDetails.rating}
                        </span>
                      </div>
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        Member since {selectedAd.authorDetails.memberSince}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className={`font-bold text-lg mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Description
                </h3>
                <p className={`text-base leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  {selectedAd.description}
                </p>
              </div>

              {/* Details */}
              <div className={`p-4 rounded-xl mb-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <MapPin className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                    <div>
                      <div className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Location</div>
                      <div className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {selectedAd.location}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                    <div>
                      <div className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Posted</div>
                      <div className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {selectedAd.postedDate}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                    <div>
                      <div className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Contact</div>
                      <div className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {selectedAd.contact}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <motion.button
                  onClick={() => setActiveView('list')}
                  whileHover={{
                    backgroundColor: theme === 'dark' ? 'rgba(17, 24, 39, 1)' : 'rgba(243, 244, 246, 1)',
                  }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-200 border ${
                    theme === 'dark'
                      ? 'border-gray-800 text-gray-400'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  Back to List
                </motion.button>
                <motion.button
                  whileHover={{
                    backgroundColor: theme === 'dark' ? 'rgba(229, 231, 235, 1)' : 'rgba(17, 24, 39, 1)',
                  }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-200 ${
                    theme === 'dark'
                      ? 'bg-white text-black'
                      : 'bg-black text-white'
                  }`}
                >
                  Contact Now
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Add Form View */}
      {activeView === 'add' && (
        <div className="px-6 py-6">
          <div className="max-w-2xl mx-auto">
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              {/* Category */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Category
                </label>
                <select
                  value={newAd.category}
                  onChange={(e) => setNewAd({ ...newAd, category: e.target.value as 'job' | 'roommate' })}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    theme === 'dark'
                      ? 'bg-gray-900 border-gray-800 text-white'
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                  } focus:outline-none`}
                >
                  <option value="job">Job</option>
                  <option value="roommate">Roommate</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Title
                </label>
                <input
                  type="text"
                  value={newAd.title}
                  onChange={(e) => setNewAd({ ...newAd, title: e.target.value })}
                  placeholder="e.g., Barista Position Available"
                  className={`w-full px-4 py-3 rounded-xl border ${
                    theme === 'dark'
                      ? 'bg-gray-900 border-gray-800 text-white placeholder-gray-500'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                  } focus:outline-none`}
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Description
                </label>
                <textarea
                  value={newAd.description}
                  onChange={(e) => setNewAd({ ...newAd, description: e.target.value })}
                  placeholder="Describe the position or room..."
                  rows={6}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    theme === 'dark'
                      ? 'bg-gray-900 border-gray-800 text-white placeholder-gray-500'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                  } focus:outline-none`}
                  required
                />
              </div>

              {/* Location */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Location
                </label>
                <input
                  type="text"
                  value={newAd.location}
                  onChange={(e) => setNewAd({ ...newAd, location: e.target.value })}
                  placeholder="e.g., New York, NY"
                  className={`w-full px-4 py-3 rounded-xl border ${
                    theme === 'dark'
                      ? 'bg-gray-900 border-gray-800 text-white placeholder-gray-500'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                  } focus:outline-none`}
                  required
                />
              </div>

              {/* Contact */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Contact
                </label>
                <input
                  type="text"
                  value={newAd.contact}
                  onChange={(e) => setNewAd({ ...newAd, contact: e.target.value })}
                  placeholder="Email or phone number"
                  className={`w-full px-4 py-3 rounded-xl border ${
                    theme === 'dark'
                      ? 'bg-gray-900 border-gray-800 text-white placeholder-gray-500'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                  } focus:outline-none`}
                  required
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <motion.button
                  type="button"
                  onClick={() => setActiveView('list')}
                  whileHover={{
                    backgroundColor: theme === 'dark' ? 'rgba(17, 24, 39, 1)' : 'rgba(243, 244, 246, 1)',
                  }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-200 border ${
                    theme === 'dark'
                      ? 'border-gray-800 text-gray-400'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  whileHover={{
                    backgroundColor: theme === 'dark' ? 'rgba(229, 231, 235, 1)' : 'rgba(17, 24, 39, 1)',
                  }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-200 ${
                    theme === 'dark'
                      ? 'bg-white text-black'
                      : 'bg-black text-white'
                  }`}
                >
                  Post Ad
                </motion.button>
              </div>
            </motion.form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassifiedsScreen;
