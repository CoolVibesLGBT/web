import React, { useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useTransform, useMotionValue, useViewportScroll } from 'framer-motion';
import Footer from './components/Footer';
import MatchScreen from './components/MatchScreen';
import NearbyScreen from './components/NearbyScreen';
import ProfileScreen from './components/ProfileScreen';
import SearchScreen from './components/SearchScreen';
import MessagesScreen from './components/MessagesScreen';
import NotificationsScreen from './components/NotificationsScreen';
import SplashScreen from './components/SplashScreen';
import { useTheme } from './contexts/ThemeContext';
import { useAuth } from './contexts/AuthContext.tsx';
import AuthWizard from './components/AuthWizard';
import { Home, Search, MapPin, Heart, MessageCircle, User, Building2, Menu, X, Sun, Moon, Languages, MoreHorizontal, Flame, FileText, Bell, ChevronRight, LogOut, EarIcon, Earth, EarthIcon, Spotlight, HandFist } from 'lucide-react';
import PlacesScreen from './components/PlacesScreen';
import HomeScreen from './components/HomeScreen';
import LanguageSelector from './components/LanguageSelector.tsx';
import ClassifiedsScreen from './components/ClassifiedsScreen';
import './i18n';
import { useTranslation } from 'react-i18next';
import { applicationName } from './appSettings.tsx';




function App() {
  const [activeScreen, setActiveScreen] = useState('pride');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthWizardOpen, setIsAuthWizardOpen] = useState(false);
  const [isLanguageSelectorOpen, setIsLanguageSelectorOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileProfileMenuOpen, setIsMobileProfileMenuOpen] = useState(false);

  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation('common');

  // Update activeScreen based on current URL
  React.useEffect(() => {
    const path = location.pathname;
    if (path === '/' || path === '/pride') {
      setActiveScreen('pride');
    } else if (path === '/search') {
      setActiveScreen('search');
    } else if (path === '/nearby') {
      setActiveScreen('nearby');
    } else if (path === '/match') {
      setActiveScreen('match');
    } else if (path === '/messages') {
      setActiveScreen('messages');
    } else if (path === '/notifications') {
      setActiveScreen('notifications');
    } else if (path === '/places') {
      setActiveScreen('places');
    } else if (path === '/classifieds') {
      setActiveScreen('classifieds');
    } else if (path.startsWith('/') && path.split('/').length === 2) {
      // Profile route like /username
      setActiveScreen('profile');
    }
  }, [location.pathname]);

  const mobileNavItems = [
    { id: 'pride', label: "Pride", icon: HandFist },
    { id: 'search', label: t('app.nav.search'), icon: Search },
    { id: 'nearby', label: t('app.nav.nearby'), icon: MapPin },
    { id: 'match', label: t('app.nav.match'), icon: Heart },
    { id: 'places', label: t('app.nav.places'), icon: Building2 },
    { id: 'messages', label: t('app.nav.messages'), icon: MessageCircle },
    { id: 'notifications', label: t('app.nav.notifications'), icon: Bell },
    { id: 'classifieds', label: t('app.nav.classifieds'), icon: FileText },
    { id: 'profile', label: t('app.nav.profile'), icon: User },
  ];

  

  
  return (
    <>
      {/* Splash Screen */}
      {showSplash && (
        <SplashScreen onComplete={() => setShowSplash(false)} />
      )}

      {/* Twitter Style Layout - 3 Columns */}
      {!showSplash && (
      <div className={`max-h-[100dvh] flex  min-h-[100dvh] overflow-y-hidden overflow-x-hidden scrollbar-hide`}>
        
        {/* Mobile Header - Top Navigation */}
        <header className={`lg:hidden fixed top-0 left-0 right-0 z-50 ${theme === 'dark' ? 'bg-black/95 backdrop-blur-xl border-b border-gray-800/50' : 'bg-white/95 backdrop-blur-xl border-b border-gray-100/50'}`}>
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className={`p-2 rounded-full transition-colors ${
                theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/10'
              }`}
            >
              <Menu className={`w-6 h-6 ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
            </button>
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${theme === 'dark'
                ? 'bg-gradient-to-br from-white to-gray-300 text-black'
                : 'bg-gradient-to-br from-black to-gray-700 text-white'
              }`}>
                <span className="text-sm font-bold">P</span>
              </div>
              <h1 className={`text-lg font-extrabold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {applicationName}
              </h1>
            </div>
            <button
              onClick={() => setIsAuthWizardOpen(true)}
              className={`p-2 rounded-full transition-colors ${
                theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/10'
              }`}
            >
              <User className={`w-6 h-6 ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
            </button>
          </div>
        </header>
        
        {/* Left Sidebar - Fixed */}
        <aside className={`hidden    scrollbar-hide lg:flex flex-col w-[280px] ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
          <div className="p-4 sticky top-0 h-screen overflow-y-auto flex flex-col">
            {/* Logo */}
            <div className="flex items-center justify-center mb-4 pt-2">
              <button className="flex items-center space-x-3 p-3 rounded-full hover:bg-opacity-10 transition-colors group">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-110 ${theme === 'dark'
                    ? 'bg-gradient-to-br from-white to-gray-300 text-black'
                    : 'bg-gradient-to-br from-black to-gray-700 text-white'
                  }`}>
                  <span className="text-xl font-bold">P</span>
                </div>
                <h1 className={`text-2xl font-extrabold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {applicationName}
                </h1>
              </button>
            </div>

            {/* Navigation */}
            <nav className="space-y-1 flex-1">
              {[
                { id: 'pride',label: "Pride", icon: HandFist },
                { id: 'nearby', label: t('app.nav.nearby'), icon: MapPin },
                { id: 'search', label: t('app.nav.explore'), icon: Search },
                { id: 'match', label: t('app.nav.matches'), icon: Heart },
                { id: 'messages', label: t('app.nav.messages'), icon: MessageCircle },
                { id: 'notifications', label: t('app.nav.notifications'), icon: Bell },
                { id: 'places', label: t('app.nav.places'), icon: Building2 },
                { id: 'classifieds', label: t('app.nav.classifieds'), icon: FileText },
                { id: 'profile', label: t('app.nav.profile'), icon: User },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeScreen === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === 'home') {
                        navigate('/');
                      } else if (item.id === 'profile') {
                        navigate(`/${user?.username || 'profile'}`);
                      } else {
                        navigate(`/${item.id}`);
                      }
                    }}
                    className={`w-full flex items-center space-x-4 px-5 py-3.5 rounded-full transition-all duration-200 group ${
                      isActive
                        ? theme === 'dark'
                          ? 'bg-white text-black shadow-lg shadow-white/20'
                          : 'bg-black text-white shadow-lg shadow-black/20'
                        : theme === 'dark'
                          ? 'text-gray-400 hover:text-white hover:bg-white/10'
                          : 'text-gray-600 hover:text-black hover:bg-gray-100'
                    }`}>
                    <Icon className={`w-6 h-6 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                    <span className="font-semibold text-base tracking-wide">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Bottom Section */}
            <div className="mt-auto pt-4 pb-2 space-y-3">
              
              {/* User Profile Card */}
              {isAuthenticated ? (
                <div className="space-y-3 relative">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/${user?.username || 'profile'}`)}
                      className={`flex-1 p-3 rounded-2xl transition-all duration-200 border border-transparent hover:border-opacity-30 ${
                        theme === 'dark' 
                          ? 'hover:bg-white/5 hover:border-white/30' 
                          : 'hover:bg-black/5 hover:border-black/30'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className={`w-11 h-11 rounded-full ring-2 ${theme === 'dark' ? 'ring-white/20' : 'ring-black/20'}`}>
                            <img
                              src={
                                (user as any)?.avatar?.file?.url || 
                                user?.profile_image_url || 
                                `https://ui-avatars.com/api/?name=${user?.username || 'User'}&background=random`
                              }
                              alt="Profile"
                              className="w-full h-full rounded-full object-cover"
                            />
                          </div>
                          <div className={`absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ${theme === 'dark' ? 'ring-black' : 'ring-white'}`}></div>
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className={`font-bold text-sm truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {user?.displayname || user?.username || 'User'}
                          </p>
                          <p className={`text-xs truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            @{user?.username || 'username'}
                          </p>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsProfileMenuOpen(!isProfileMenuOpen);
                      }}
                      className={`p-2 rounded-xl transition-all duration-200 ${
                        theme === 'dark'
                          ? 'hover:bg-white/10 text-gray-400 hover:text-white'
                          : 'hover:bg-black/10 text-gray-600 hover:text-black'
                      } ${isProfileMenuOpen ? (theme === 'dark' ? 'bg-white/10 text-white' : 'bg-black/10 text-black') : ''}`}
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Profile Dropdown Menu */}
                  <AnimatePresence>
                    {isProfileMenuOpen && (
                      <>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="fixed inset-0 z-40"
                          onClick={() => setIsProfileMenuOpen(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className={`absolute bottom-full left-0 right-0 mb-2 rounded-2xl overflow-hidden z-50 ${
                            theme === 'dark'
                              ? 'bg-gray-900 border border-gray-800 shadow-2xl'
                              : 'bg-white border border-gray-200 shadow-2xl'
                          }`}
                        >
                          <button
                            onClick={() => {
                              navigate(`/${user?.username || 'profile'}`);
                              setIsProfileMenuOpen(false);
                            }}
                            className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${
                              theme === 'dark'
                                ? 'hover:bg-white/10 text-white'
                                : 'hover:bg-black/5 text-gray-900'
                            }`}
                          >
                            <User className="w-5 h-5" />
                            <span className="font-semibold text-sm">{t('app.nav.profile')}</span>
                          </button>
                          <div className={`h-px ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`} />
                          <button
                            onClick={() => {
                              if (window.confirm(t('app.logout_confirmation'))) {
                                logout();
                                navigate('/');
                                setIsProfileMenuOpen(false);
                              }
                            }}
                            className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${
                              theme === 'dark'
                                ? 'hover:bg-red-500/10 text-red-400'
                                : 'hover:bg-red-50 text-red-600'
                            }`}
                          >
                            <LogOut className="w-5 h-5" />
                            <span className="font-semibold text-sm">{t('app.logout')}</span>
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthWizardOpen(true)}
                  className={`w-full px-4 py-3.5 rounded-full font-bold transition-all duration-200 shadow-lg hover:scale-105 ${
                    theme === 'dark'
                      ? 'bg-gradient-to-r from-white to-gray-200 text-black hover:shadow-white/20'
                      : 'bg-gradient-to-r from-black to-gray-800 text-white hover:shadow-black/20'
                  }`}
                >
                  {t('app.join_now')}
                </button>
              )}

              {/* Quick Actions */}
              <div className="flex items-center justify-center gap-2 px-2">
                <button
                  onClick={toggleTheme}
                  className={`flex-1 py-2.5 rounded-full transition-all duration-200 hover:scale-105 ${
                    theme === 'dark'
                      ? 'text-gray-400 hover:text-white hover:bg-white/10'
                      : 'text-gray-600 hover:text-black hover:bg-gray-100'
                  }`}
                  title={theme === 'dark' ? t('app.light_mode') : t('app.dark_mode')}
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5 mx-auto" /> : <Moon className="w-5 h-5 mx-auto" />}
                </button>
                <button
                  onClick={() => setIsLanguageSelectorOpen(true)}
                  className={`flex-1 py-2.5 rounded-full transition-all duration-200 hover:scale-105 ${
                    theme === 'dark'
                      ? 'text-gray-400 hover:text-white hover:bg-white/10'
                      : 'text-gray-600 hover:text-black hover:bg-gray-100'
                  }`}
                  title={t('app.language')}
                >
                  <Languages className="w-5 h-5 mx-auto" />
                </button>
              </div>
            </div>
          </div>
        </aside>

  
        {/* Middle Section - Scrollable */}
        <main className={`max-h-[100dvh]  min-h-[100dvh]  overflow-y-hidden overflow-x-hidden scrollbar-hide flex-1 min-w-0 lg:border-l lg:border-r ${theme === 'dark' ? 'lg:border-gray-800/30' : 'lg:border-gray-100/50'} pt-[56px] lg:pt-0 pb-[80px] lg:pb-0`}>
          <Routes>
            {/* Home Routes */}
            <Route path="/" element={<HomeScreen />} />
            <Route path="/home" element={<HomeScreen />} />
            <Route path="/pride" element={<HomeScreen />} />
            
            {/* Profile Routes */}
            <Route path="/:username" element={<ProfileScreen />} />
            <Route path="/:username/status/:postId" element={<HomeScreen />} />
            
            {/* Other Routes */}
            <Route path="/search" element={<SearchScreen />} />
            <Route path="/match" element={<MatchScreen />} />
            <Route path="/nearby" element={<NearbyScreen />} />
            <Route path="/places" element={<PlacesScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />

            <Route path="/messages" element={<MessagesScreen />} />
            <Route path="/notifications" element={<NotificationsScreen />} />
            <Route path="/classifieds" element={<ClassifiedsScreen />} />
            
            {/* Fallback */}
            <Route path="*" element={<HomeScreen />} />
          </Routes>
        </main>

        {/* Right Sidebar - Fixed */}
        {/* Hide right sidebar on messages and notifications routes for better UX */}
        {location.pathname !== '/messages' && (
        <aside className={`hidden xl:flex scrollbar-hide flex-col w-[380px] ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
          <div className="p-5 sticky top-0 h-screen scrollbar-hide overflow-y-auto space-y-4">
            
            {/* Spotlight Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`rounded-2xl overflow-hidden ${theme === 'dark' ? 'bg-gray-950 border border-gray-900' : 'bg-white border border-gray-200'}`}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-red-500" />
                    <h2 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {t('app.new_matches')}
                    </h2>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${theme === 'dark' ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'}`}>
                    3
                  </span>
                </div>
                
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
                  {[
                    { name: 'Alex', age: 28, avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2', isNew: true, mutual: 'New York' },
                    { name: 'Jordan', age: 25, avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2', isNew: true, mutual: 'Los Angeles' },
                    { name: 'Sam', age: 30, avatar: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2', isNew: true, mutual: 'San Francisco' },
                  ].map((match, index) => (
                    <div 
                      key={index} 
                      className="flex-shrink-0 w-28 cursor-pointer group"
                      onClick={() => {
                        navigate(`/${match.name.toLowerCase()}`);
                      }}
                    >
                      <div className="relative">
                        <div className={`w-full aspect-square rounded-2xl overflow-hidden transition-all duration-200 ${match.isNew ? 'ring-2 ring-red-500' : 'ring-2 ring-transparent'} group-hover:ring-2 group-hover:ring-opacity-50 ${match.isNew ? 'group-hover:ring-red-500' : 'group-hover:ring-gray-400'}`}>
                          <img
                            src={match.avatar}
                            alt={match.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        {match.isNew && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white dark:border-gray-950"></div>
                        )}
                        <div className="absolute bottom-1 left-1 right-1">
                          <div className="backdrop-blur-sm bg-black/70 rounded-lg px-2 py-1">
                            <p className="text-white text-[10px] font-bold">{t('app.new')}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-center mt-2">
                        <p className={`text-sm font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {match.name}, {match.age}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Suggested Matches */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className={`rounded-2xl overflow-hidden ${theme === 'dark' ? 'bg-gray-950 border border-gray-900' : 'bg-white border border-gray-200'}`}
            >
              <div className="p-4">
                <div className="mb-3">
                  <h2 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {t('app.suggested_matches')}
                  </h2>
                  <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {t('app.based_on_preferences')}
                  </p>
                </div>
                
                <div className="space-y-2">
                  {[
                    { name: 'Alex Rivera', age: 28, username: 'alexr', avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2', mutual: '8 mutual friends', isOnline: true, location: 'New York, NY', verified: true },
                    { name: 'Jordan Smith', age: 25, username: 'jordansmith', avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2', mutual: '12 mutual friends', isOnline: false, location: 'Los Angeles, CA', verified: false },
                    { name: 'Taylor Davis', age: 30, username: 'taylord', avatar: 'https://images.pexels.com/photos/1102341/pexels-photo-1102341.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2', mutual: '15 mutual friends', isOnline: true, location: 'San Francisco, CA', verified: true },
                  ].map((user, index) => (
                    <div 
                      key={index} 
                      className="group cursor-pointer rounded-xl p-2 transition-all duration-200"
                      style={{ backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)';
                      }}
                      onClick={() => {
                        navigate(`/${user.username}`);
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                          <div className="relative flex-shrink-0">
                            <div className={`w-12 h-12 rounded-xl overflow-hidden ${user.isOnline ? 'ring-2 ring-green-500/50' : ''}`}>
                              <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            {user.isOnline && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-950"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <p className={`font-bold text-sm truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {user.name}
                              </p>
                              {user.verified && (
                                <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M23 12l-2.44-2.78.34-3.68-3.61-.82-1.89-3.18L12 2.96 8.6 1.54 6.71 4.72l-3.61.82.34 3.68L1 12l2.44 2.78-.34 3.68 3.61.82 1.89 3.18L12 21.04l3.4 1.42 1.89-3.18 3.61-.82-.34-3.68L23 12zm-10.29 4.8l-4.5-4.31 1.39-1.32 3.11 2.97 5.98-6.03 1.39 1.37-7.37 7.32z"/>
                                </svg>
                              )}
                            </div>
                            <p className={`text-xs truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                              {user.age} · {user.location}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => e.stopPropagation()}
                          className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                            theme === 'dark'
                              ? 'bg-white text-black hover:bg-gray-200'
                              : 'bg-black text-white hover:bg-gray-900'
                          }`}
                        >
                          {t('app.connect')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

          </div>
        </aside>
        )}

      {/* Clean Professional Bottom Bar */}
      <nav className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 ${
        theme === 'dark' 
          ? 'bg-black/95 border-t border-white/[0.08]' 
          : 'bg-white/95 border-t border-black/[0.08]'
      } backdrop-blur-xl safe-area-inset-bottom`}>
        <div className="flex items-center justify-around px-4 py-3">
          {[
            { id: 'pride', icon: Spotlight, label: "Pride"},
            { id: 'search', icon: Search, label: t('app.nav.search') },
            { id: 'match', icon: Heart, label: t('app.nav.match') },
            { id: 'messages', icon: MessageCircle, label: t('app.nav.messages') },
            { id: 'profile', icon: User, label: t('app.nav.profile') },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'pride') {
                    navigate('/');
                  } else if (item.id === 'pride') {
                    navigate(`/pride'}`);
                  } 
                   else if (item.id === 'profile') {
                    navigate(`/${user?.username || 'profile'}`);
                  } else {
                    navigate(`/${item.id}`);
                  }
                }}
                className="relative flex flex-col items-center justify-center flex-1 py-2 px-1 min-w-0"
              >
                {/* Active Background */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavBg"
                    className={`absolute inset-0 rounded-2xl ${
                      theme === 'dark'
                        ? 'bg-white/[0.08]'
                        : 'bg-black/[0.06]'
                    }`}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                
                {/* Icon */}
                <Icon 
                  className={`relative z-10 w-6 h-6 transition-colors duration-200 ${
                    isActive
                      ? theme === 'dark'
                        ? 'text-white'
                        : 'text-black'
                      : theme === 'dark'
                        ? 'text-gray-500'
                        : 'text-gray-400'
                  }`} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
                
                {/* Label */}
                <span 
                  className={`relative z-10 text-[10px] font-medium tracking-tight mt-1 transition-all duration-200 ${
                    isActive
                      ? theme === 'dark'
                        ? 'text-white opacity-100'
                        : 'text-black opacity-100'
                      : 'opacity-0'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Premium Mobile Menu - Enhanced Design */}
      <AnimatePresence
        mode="wait"
        onExitComplete={() => {
          document.body.style.overflow = '';
        }}
      >
        {isMobileMenuOpen && (
          <>
            {/* Backdrop with Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className={`fixed inset-0 z-[100] backdrop-blur-md ${
                theme === 'dark' ? 'bg-black/60' : 'bg-black/40'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
              style={{ willChange: 'opacity' }}
            />

            {/* Mobile Menu Panel - Premium Design */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{
                type: 'spring',
                stiffness: 380,
                damping: 32,
                mass: 0.7
              }}
              style={{
                willChange: 'transform',
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden'
              }}
              className={`fixed top-0 left-0 bottom-0 w-[320px] max-w-[85vw] z-[101] ${
                theme === 'dark'
                  ? 'bg-gradient-to-br from-gray-900/98 to-black/98 backdrop-blur-2xl border-r border-white/[0.08]'
                  : 'bg-gradient-to-br from-white via-gray-50 to-white backdrop-blur-2xl border-r border-black/[0.08]'
              } flex flex-col shadow-2xl`}
              onAnimationStart={() => {
                if (isMobileMenuOpen) {
                  document.body.style.overflow = 'hidden';
                }
              }}
            >
              {/* Close Button - Floating */}
              <motion.button
                onClick={() => setIsMobileMenuOpen(false)}
                className={`absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                  theme === 'dark'
                    ? 'bg-white/[0.08] hover:bg-white/[0.15] text-white'
                    : 'bg-black/[0.08] hover:bg-black/[0.15] text-black'
                }`}
                whileHover={{ scale: 1.05, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                transition={{ delay: 0.15 }}
                style={{ willChange: 'transform' }}
              >
                <X className="w-5 h-5" />
              </motion.button>

              {/* Profile Section - Enhanced */}
              <div className={`relative px-6 py-8 ${
                theme === 'dark' ? 'border-b border-white/[0.08]' : 'border-b border-black/[0.08]'
              }`}>
                <motion.div 
                  className="flex items-center space-x-4"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {/* Avatar with Gradient Ring */}
                  <div className="relative">
                    <div className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-br ${
                      theme === 'dark'
                        ? 'from-white/20 to-white/5'
                        : 'from-black/20 to-black/5'
                    } blur-sm`} />
                    <div className="relative">
                      <img
                        src={user?.profile_image_url || "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2"}
                        alt="Profile"
                        className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/10"
                      />
                      {/* Online Status */}
                      <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 ${
                        theme === 'dark' ? 'border-gray-900' : 'border-white'
                      }`} />
                    </div>
                  </div>
                  
                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-[15px] font-bold tracking-[-0.011em] truncate ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {user?.displayname || user?.username || t('app.guest_user')}
                    </h3>
                    <p className={`text-[13px] truncate ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      @{user?.username || 'username'}
                    </p>
                    {/* Stats */}
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className={`text-[11px] font-medium ${
                        theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        <span className={theme === 'dark' ? 'text-white' : 'text-black'}>234</span> {t('app.following')}
                      </span>
                      <span className={`text-[11px] font-medium ${
                        theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        <span className={theme === 'dark' ? 'text-white' : 'text-black'}>1.2K</span> {t('app.followers')}
                      </span>
                    </div>
                  </div>
                  
                  {/* More Options Button */}
                  {isAuthenticated && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMobileProfileMenuOpen(!isMobileProfileMenuOpen);
                      }}
                      className={`p-2 rounded-xl transition-all duration-200 flex-shrink-0 ${
                        theme === 'dark'
                          ? 'hover:bg-white/10 text-gray-400 hover:text-white'
                          : 'hover:bg-black/10 text-gray-600 hover:text-black'
                      } ${isMobileProfileMenuOpen ? (theme === 'dark' ? 'bg-white/10 text-white' : 'bg-black/10 text-black') : ''}`}
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  )}
                </motion.div>
                
                {/* Mobile Profile Dropdown Menu */}
                {isAuthenticated && (
                  <AnimatePresence>
                    {isMobileProfileMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`mt-4 rounded-2xl overflow-hidden ${
                          theme === 'dark'
                            ? 'bg-gray-900/50 border border-gray-800'
                            : 'bg-white/50 border border-gray-200'
                        }`}
                      >
                        <button
                          onClick={() => {
                            navigate(`/${user?.username || 'profile'}`);
                            setIsMobileProfileMenuOpen(false);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`w-full px-4 py-3.5 text-left flex items-center gap-3 transition-colors ${
                            theme === 'dark'
                              ? 'hover:bg-white/10 text-white'
                              : 'hover:bg-black/5 text-gray-900'
                          }`}
                        >
                          <User className="w-5 h-5" />
                          <span className="font-semibold text-[15px]">{t('app.nav.profile')}</span>
                        </button>
                        <div className={`h-px ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`} />
                        <button
                          onClick={() => {
                            if (window.confirm(t('app.logout_confirmation'))) {
                              logout();
                              navigate('/');
                              setIsMobileProfileMenuOpen(false);
                              setIsMobileMenuOpen(false);
                            }
                          }}
                          className={`w-full px-4 py-3.5 text-left flex items-center gap-3 transition-colors ${
                            theme === 'dark'
                              ? 'hover:bg-red-500/10 text-red-400'
                              : 'hover:bg-red-50 text-red-600'
                          }`}
                        >
                          <LogOut className="w-5 h-5" />
                          <span className="font-semibold text-[15px]">{t('app.logout')}</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>

              {/* Navigation - Modern Grid Layout */}
              <nav className="flex-1 px-4 py-6 overflow-y-auto scrollbar-hide">
                <div className="grid grid-cols-3 gap-3">
                  {mobileNavItems.map((item, index) => {
                    const isActive = activeScreen === item.id;
                    const Icon = item.icon;
                    return (
                      <motion.button
                        key={item.id}
                        className="relative"
                        onClick={() => {
                          if (item.id === 'pride') {
                            navigate('/');
                          } else if (item.id === 'profile') {
                            navigate(`/${user?.username || 'profile'}`);
                          } else {
                            navigate(`/${item.id}`);
                          }
                          setIsMobileMenuOpen(false);
                        }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          delay: 0.15 + index * 0.04,
                          duration: 0.3,
                          ease: [0.16, 1, 0.3, 1]
                        }}
                        whileTap={{ scale: 0.95 }}
                        style={{ willChange: 'transform, opacity' }}
                      >
                        {/* Card Container */}
                        <div className={`relative flex flex-col items-center justify-center p-4 rounded-[20px] transition-all duration-200 ${
                          isActive
                            ? theme === 'dark'
                              ? 'bg-white/[0.15]'
                              : 'bg-black/[0.12]'
                            : theme === 'dark'
                              ? 'bg-white/[0.06] hover:bg-white/[0.10]'
                              : 'bg-black/[0.04] hover:bg-black/[0.08]'
                        }`}>
                          {/* Icon */}
                          <div className={`mb-2.5 ${
                            isActive ? 'scale-110' : ''
                          } transition-transform duration-200`}>
                            <Icon 
                              className={`w-[26px] h-[26px] ${
                                isActive
                                  ? theme === 'dark'
                                    ? 'text-white'
                                    : 'text-black'
                                  : theme === 'dark'
                                    ? 'text-gray-400'
                                    : 'text-gray-600'
                              }`}
                              strokeWidth={isActive ? 2.5 : 2}
                            />
                          </div>
                          
                          {/* Label */}
                          <span className={`text-xs font-semibold tracking-tight text-center transition-colors duration-200 ${
                            isActive
                              ? theme === 'dark'
                                ? 'text-white'
                                : 'text-black'
                              : theme === 'dark'
                                ? 'text-gray-400'
                                : 'text-gray-600'
                          }`}>
                            {item.label}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </nav>

              {/* Footer - Enhanced */}
              <div className={`px-4 py-4 border-t ${
                theme === 'dark' ? 'border-white/[0.08]' : 'border-black/[0.08]'
              }`}>
                <div className="space-y-2">
                  {/* Theme Toggle */}
                  <motion.button
                    onClick={toggleTheme}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-[16px] font-semibold text-[15px] tracking-[-0.011em] transition-all duration-200 ${
                      theme === 'dark'
                        ? 'bg-white/[0.08] hover:bg-white/[0.12] text-white'
                        : 'bg-black/[0.08] hover:bg-black/[0.12] text-black'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{ willChange: 'transform' }}
                  >
                    <div className="flex items-center space-x-3">
                      {theme === 'dark' ? (
                        <Sun className="w-5 h-5" />
                      ) : (
                        <Moon className="w-5 h-5" />
                      )}
                      <span>{theme === 'dark' ? t('app.light_mode') : t('app.dark_mode')}</span>
                    </div>
                    <div className={`w-11 h-6 rounded-full transition-colors duration-200 relative ${
                      theme === 'dark' ? 'bg-white/20' : 'bg-black/20'
                    }`}>
                      <motion.div
                        className={`absolute top-0.5 w-5 h-5 rounded-full ${
                          theme === 'dark' ? 'bg-white' : 'bg-black'
                        }`}
                        animate={{ x: theme === 'dark' ? 22 : 2 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </div>
                  </motion.button>
                  
                  {/* Language Selector */}
                  <motion.button
                    onClick={() => {
                      setIsLanguageSelectorOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-[16px] font-semibold text-[15px] tracking-[-0.011em] transition-all duration-200 ${
                      theme === 'dark'
                        ? 'bg-white/[0.08] hover:bg-white/[0.12] text-white'
                        : 'bg-black/[0.08] hover:bg-black/[0.12] text-black'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{ willChange: 'transform' }}
                  >
                    <div className="flex items-center space-x-3">
                      <Languages className="w-5 h-5" />
                      <span>{t('app.language')}</span>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
        </div>
      )}

      {/* Footer - Only show on home screen */}
      {!showSplash && activeScreen === 'xxhome' && <Footer />}

      {/* Auth Wizard */}
      {!showSplash && (
      <AuthWizard
        isOpen={isAuthWizardOpen}
        onClose={() => setIsAuthWizardOpen(false)}
      />
      )}
      
      {/* LanguageSelector */}
      {!showSplash && (
      <LanguageSelector isOpen={isLanguageSelectorOpen} onClose={() => setIsLanguageSelectorOpen(false)} />
      )}

    </>
  );
}

export default App;
