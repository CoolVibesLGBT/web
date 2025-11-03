import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Star,
  Search,
  Verified,
  ArrowLeft
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import Container from './Container';

interface Place {
  id: number;
  name: string;
  image: string;
  images?: string[];
  address: string;
  city: string;
  country: string;
  description: string;
  tags: string[];
  rating: number;
  reviewCount: number;
  priceRange: string;
  phone?: string;
  website?: string;
  hours: {
    [key: string]: string;
  };
  verified: boolean;
  distance?: string;
  category: string;
}

const PlacesScreen: React.FC = () => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const categories = ['all', 'Cafe', 'Bar', 'Restaurant', 'Bookstore', 'Community Center', 'Club', 'Hotel', 'Shop'];

  const places: Place[] = [
    {
      id: 1,
      name: 'Rainbow Cafe',
      image: 'https://images.pexels.com/photos/1707828/pexels-photo-1707828.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2',
      images: [
        'https://images.pexels.com/photos/1707828/pexels-photo-1707828.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2',
        'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2',
        'https://images.pexels.com/photos/1833586/pexels-photo-1833586.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2'
      ],
      address: '123 Pride Street, City Center',
      city: 'Istanbul',
      country: 'Turkey',
      description: 'A cozy, inclusive cafe with rainbow vibes and great coffee. Perfect place for community gatherings and meaningful conversations.',
      tags: ['LGBTQ+ Friendly', 'Vegan Options', 'Free WiFi', 'Pet Friendly'],
      rating: 4.8,
      reviewCount: 127,
      priceRange: '$$',
      phone: '+90 212 555 0123',
      website: 'https://rainbowcafe.com',
      hours: {
        'Monday': '8:00 AM - 10:00 PM',
        'Tuesday': '8:00 AM - 10:00 PM',
        'Wednesday': '8:00 AM - 10:00 PM',
        'Thursday': '8:00 AM - 10:00 PM',
        'Friday': '8:00 AM - 11:00 PM',
        'Saturday': '9:00 AM - 11:00 PM',
        'Sunday': '9:00 AM - 9:00 PM'
      },
      verified: true,
      distance: '0.5 km',
      category: 'Cafe'
    },
    {
      id: 2,
      name: 'Equality Bar',
      image: 'https://images.pexels.com/photos/260922/pexels-photo-260922.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2',
      images: [
        'https://images.pexels.com/photos/260922/pexels-photo-260922.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2',
        'https://images.pexels.com/photos/274192/pexels-photo-274192.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2'
      ],
      address: '456 Freedom Avenue, Downtown',
      city: 'Istanbul',
      country: 'Turkey',
      description: 'The city\'s most vibrant LGBTQ+ bar with live music, drag shows, and an inclusive atmosphere for everyone.',
      tags: ['Live Music', 'Drag Shows', 'Cocktails', 'Dance Floor'],
      rating: 4.7,
      reviewCount: 89,
      priceRange: '$$$',
      phone: '+90 212 555 0456',
      website: 'https://equalitybar.com',
      hours: {
        'Monday': 'Closed',
        'Tuesday': 'Closed',
        'Wednesday': '7:00 PM - 2:00 AM',
        'Thursday': '7:00 PM - 2:00 AM',
        'Friday': '7:00 PM - 3:00 AM',
        'Saturday': '7:00 PM - 3:00 AM',
        'Sunday': '6:00 PM - 1:00 AM'
      },
      verified: true,
      distance: '1.2 km',
      category: 'Bar'
    },
    {
      id: 3,
      name: 'Open Arms Bookstore',
      image: 'https://images.pexels.com/photos/279222/pexels-photo-279222.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2',
      images: [
        'https://images.pexels.com/photos/279222/pexels-photo-279222.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2',
        'https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2'
      ],
      address: '789 Unity Boulevard, Midtown',
      city: 'Ankara',
      country: 'Turkey',
      description: 'A safe space bookstore specializing in queer literature, hosting regular events and book clubs.',
      tags: ['Queer Literature', 'Book Clubs', 'Events', 'Safe Space'],
      rating: 4.9,
      reviewCount: 156,
      priceRange: '$$',
      phone: '+90 312 555 0789',
      website: 'https://openarmsbookstore.com',
      hours: {
        'Monday': '10:00 AM - 8:00 PM',
        'Tuesday': '10:00 AM - 8:00 PM',
        'Wednesday': '10:00 AM - 8:00 PM',
        'Thursday': '10:00 AM - 9:00 PM',
        'Friday': '10:00 AM - 9:00 PM',
        'Saturday': '10:00 AM - 9:00 PM',
        'Sunday': '11:00 AM - 7:00 PM'
      },
      verified: true,
      distance: '2.1 km',
      category: 'Bookstore'
    },
    {
      id: 4,
      name: 'Pride Community Center',
      image: 'https://images.pexels.com/photos/1266808/pexels-photo-1266808.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2',
      images: [
        'https://images.pexels.com/photos/1266808/pexels-photo-1266808.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2'
      ],
      address: '321 Community Lane, Uptown',
      city: 'New York',
      country: 'USA',
      description: 'A welcoming community center offering support groups, events, and resources for the LGBTQ+ community.',
      tags: ['Support Groups', 'Counseling', 'Events', 'Resources'],
      rating: 4.6,
      reviewCount: 203,
      priceRange: 'Free',
      phone: '+1 212 555 0321',
      website: 'https://pridecommunitycenter.org',
      hours: {
        'Monday': '9:00 AM - 9:00 PM',
        'Tuesday': '9:00 AM - 9:00 PM',
        'Wednesday': '9:00 AM - 9:00 PM',
        'Thursday': '9:00 AM - 9:00 PM',
        'Friday': '9:00 AM - 6:00 PM',
        'Saturday': '10:00 AM - 4:00 PM',
        'Sunday': 'Closed'
      },
      verified: true,
      distance: '3.5 km',
      category: 'Community Center'
    }
  ];


  const filteredPlaces = places.filter(place => {
    const matchesSearch = place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         place.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         place.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || place.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const sortedPlaces = [...filteredPlaces].sort((a, b) => b.rating - a.rating);

    return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-10 ${theme === 'dark' ? 'bg-black border-b border-black' : 'bg-white border-b border-gray-100'}`}>
        {selectedPlace ? (
          // Place Detail Header
          <div className="px-4 md:px-6 py-4">
            <div className="flex items-center justify-between">
          <button
                onClick={() => setSelectedPlace(null)}
                className={`p-2 rounded-full transition-all duration-200 ${
                  theme === 'dark'
                    ? 'hover:bg-white/10 text-gray-400 hover:text-white'
                    : 'hover:bg-black/5 text-gray-600 hover:text-black'
                }`}
              >
                <ArrowLeft className="w-5 h-5" />
          </button>
              <h2 className={`text-lg md:text-xl font-bold truncate px-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Place Details
              </h2>
              <div className="w-12"></div>
      </div>
          </div>
        ) : (
          // Main Header
          <div className="px-4 md:px-6 py-4">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="min-w-0 flex-1">
                <h1 className={`text-xl md:text-2xl font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  LGBTIQ+ Places
                </h1>
                <p className={`text-xs md:text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Discover safe and welcoming spaces
                </p>
              </div>
              <div className={`flex-shrink-0 px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold ${
                  theme === 'dark'
                  ? 'bg-gray-900 border border-gray-800 text-gray-300'
                  : 'bg-gray-100 border border-gray-200 text-gray-700'
                }`}>
                  {sortedPlaces.length} places
              </div>
            </div>

              {/* Search Bar */}
            <div>
              <div className={`relative ${theme === 'dark' ? 'bg-gray-950 border border-gray-900' : 'bg-gray-50 border border-gray-200'} rounded-xl overflow-hidden`}>
                <Search className={`absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search places..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 text-sm md:text-base bg-transparent ${theme === 'dark' ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'} focus:outline-none`}
                />
              </div>
            </div>
          </div>
        )}
              </div>

      {/* Mobile Categories */}
      {!selectedPlace && (
        <div className={`md:hidden px-4 py-3 border-b ${theme === 'dark' ? 'border-gray-900' : 'border-gray-200'} overflow-x-auto`}>
          <div className="flex gap-2">
            {categories.slice(1, 6).map((category) => {
              const isActive = selectedCategory === category;
              return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(selectedCategory === category ? 'all' : category)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                    isActive
                        ? theme === 'dark'
                          ? 'bg-white text-black'
                          : 'bg-black text-white'
                        : theme === 'dark'
                        ? 'bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-black'
                    }`}
                  >
                    {category}
                  </button>
              );
            })}
              </div>
            </div>
      )}

      {/* List View */}
      {!selectedPlace && (
        <div className="flex flex-col md:flex-row">
          {/* Sidebar - Categories - Hidden on mobile */}
          <aside className={`hidden md:block w-64 ${theme === 'dark' ? 'border-r border-gray-900' : 'border-r border-gray-200'}`}>
            <div className="p-6">
              <h2 className={`font-bold text-lg mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Categories
              </h2>
                      <div className="space-y-2">
                {categories.map((category) => {
                  const isActive = selectedCategory === category;
                  return (
                            <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
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
                      <span className="font-semibold">{category === 'all' ? 'All' : category}</span>
                            </button>
                  );
                })}
                          </div>
                          </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-4 md:p-6">
          <Container>

        {sortedPlaces.length === 0 ? (
              <div className="text-center py-16">
                <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              No places found
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedPlaces.map((place, index) => (
              <motion.div
                key={place.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`cursor-pointer rounded-2xl overflow-hidden transition-all duration-200 ${
                  theme === 'dark'
                        ? 'bg-gray-950 border border-gray-900 hover:bg-gray-900/50'
                        : 'bg-white border border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedPlace(place)}
              >
                <div className="p-6">
                    {/* Category Badge */}
                      <div className="flex items-center justify-between mb-3">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      theme === 'dark'
                            ? 'bg-gray-900 text-gray-300'
                            : 'bg-gray-100 text-gray-700'
                    }`}>
                      {place.category}
                    </span>
                        {place.distance && (
                          <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                            {place.distance}
                          </span>
                        )}
                  </div>

                      {/* Title */}
                      <h3 className={`text-lg font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {place.name}
                      </h3>

                  {/* Description */}
                      <p className={`text-sm mb-4 line-clamp-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {place.description}
                  </p>

                      {/* Location */}
                      <div className="flex items-center gap-2 mb-4">
                        <MapPin className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {place.city}, {place.country}
                      </span>
                  </div>

                      {/* Rating and Price */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Star className={`w-4 h-4 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-500'} fill-current`} />
                          <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {place.rating}
                          </span>
                          <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                            ({place.reviewCount})
                      </span>
                    </div>
                        <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {place.priceRange}
                      </span>
                    </div>

                      {/* Verified Badge */}
                      {place.verified && (
                        <div className="mt-3 pt-3 border-t border-gray-800 dark:border-gray-900">
                          <div className="flex items-center gap-2">
                            <Verified className="w-4 h-4 text-blue-500" />
                            <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                              Verified Place
                            </span>
                  </div>
                </div>
                      )}
                    </div>
              </motion.div>
            ))}
              </div>
        )}
        </Container>
          </main>
      </div>
   
      )}

      {/* Place Detail View */}
        {selectedPlace && (
        <Container>
          {/* Hero Image */}
          <div className="relative h-[50vh] min-h-[400px] max-h-[600px] overflow-hidden">
                <img
                  src={selectedPlace.image}
                  alt={selectedPlace.name}
                  className="w-full h-full object-cover"
                />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                  </div>

          {/* Content */}
          <div className={`max-w-4xl mx-auto px-4 sm:px-6 py-8 border-x ${theme === 'dark' ? 'border-black' : 'border-gray-100'}`}>
            {/* Header Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-8"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className={`text-4xl sm:text-5xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {selectedPlace.name}
                  </h1>
                  <div className="flex items-center space-x-2 mb-3">
                    <MapPin className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                    <span className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {selectedPlace.address}
                    </span>
                </div>
                        </div>
                {selectedPlace.verified && (
                  <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${theme === 'dark' ? 'bg-gray-900 border border-gray-800' : 'bg-gray-100 border border-gray-200'}`}>
                    <Verified className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
                    <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Verified</span>
                          </div>
                        )}
                    </div>

              {/* Meta Info */}
              <div className="flex items-center space-x-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-1">
                  <Star className={`w-5 h-5 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-500'} fill-current`} />
                  <span className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {selectedPlace.rating}
                  </span>
                    </div>
                <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {selectedPlace.reviewCount} reviews
                </span>
                <span className={`font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {selectedPlace.priceRange}
                </span>
                <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {selectedPlace.category}
                </span>
                  </div>
            </motion.div>

                      {/* About Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mb-8"
            >
              <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                About
              </h2>
              <p className={`text-lg leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          {selectedPlace.description}
                        </p>
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="mb-8"
            >
              <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          Features & Amenities
              </h2>
              <div className="flex flex-wrap gap-2">
                          {selectedPlace.tags.map(tag => (
                  <span
                              key={tag}
                    className={`px-4 py-2 rounded-full text-sm font-medium ${
                                theme === 'dark'
                        ? 'bg-gray-900 border border-gray-800 text-gray-300'
                        : 'bg-gray-100 border border-gray-200 text-gray-700'
                              }`}
                            >
                    {tag}
                  </span>
                          ))}
                        </div>
            </motion.div>

                      {/* Operating Hours */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="mb-8"
            >
              <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          Operating Hours
              </h2>
              <div className="space-y-2">
                          {Object.entries(selectedPlace.hours).map(([day, hours]) => {
                            const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }) === day;
                            const isClosed = hours === 'Closed';

                            return (
                              <div
                                key={day}
                      className={`flex justify-between items-center p-3 rounded-lg ${
                                  isToday
                                    ? theme === 'dark'
                            ? 'bg-gray-900 border border-gray-800'
                            : 'bg-gray-100 border border-gray-200'
                          : ''
                      }`}
                    >
                      <span className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        {day} {isToday && <span className="text-sm opacity-75">(Today)</span>}
                                </span>
                                <span className={`font-medium ${
                        isClosed ? 'text-red-500' : theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                  {hours}
                                </span>
                              </div>
                            );
                          })}
                        </div>
            </motion.div>

            {/* Contact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="mb-8"
            >
              <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Contact
              </h2>
              <div className="space-y-3">
                          {selectedPlace.phone && (
                            <a
                              href={`tel:${selectedPlace.phone}`}
                    className={`flex items-center space-x-3 p-4 rounded-lg transition-colors ${
                                theme === 'dark'
                        ? 'bg-gray-900 border border-gray-800 hover:bg-gray-800'
                        : 'bg-gray-100 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    <span className="text-2xl">📞</span>
                    <span className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {selectedPlace.phone}
                    </span>
                            </a>
                          )}
                          {selectedPlace.website && (
                            <a
                              href={selectedPlace.website}
                              target="_blank"
                              rel="noopener noreferrer"
                    className={`flex items-center space-x-3 p-4 rounded-lg transition-colors ${
                                theme === 'dark'
                        ? 'bg-gray-900 border border-gray-800 hover:bg-gray-800'
                        : 'bg-gray-100 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    <span className="text-2xl">🌐</span>
                    <span className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Visit Website
                    </span>
                            </a>
                          )}
              </div>
            </motion.div>

            {/* Reviews */}
          <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Reviews ({selectedPlace.reviewCount})
              </h2>
              <p className={`text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                No reviews available yet.
              </p>
            </motion.div>
                </div>
                </Container>
      )}
    </div>
  );
};

export default PlacesScreen;
