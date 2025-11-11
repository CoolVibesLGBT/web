import React, { useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useTransform, useMotionValue, useViewportScroll } from 'framer-motion';
import Footer from './components/Footer';
import MatchScreen from './components/MatchScreen';
import NearbyScreen from './components/NearbyScreen';
import ProfileScreen from './components/ProfileScreen';
import ProfileEngagementsScreen from './components/ProfileEngagementsScreen';
import SearchScreen from './components/SearchScreen';
import MessagesScreen from './components/MessagesScreen';
import NotificationsScreen from './components/NotificationsScreen';
import SplashScreen from './components/SplashScreen';
import { useTheme } from './contexts/ThemeContext';
import { useAuth } from './contexts/AuthContext.tsx';
import { useSettings } from './contexts/SettingsContext';
import AuthWizard from './components/AuthWizard';
import { Home, Search, MapPin, Heart, MessageCircle, User, Building2, Menu, X, Sun, Moon, Languages, MoreHorizontal, FileText, Bell, ChevronRight, LogOut, EarIcon, Earth, EarthIcon, HandFist, TrendingUp, Filter, ArrowUpRight } from 'lucide-react';
import TrendsPanel, { NormalizedTrend } from './components/TrendsPanel';
import PopularUsersPanel from './components/PopularUsersPanel';
import PlacesScreen from './components/PlacesScreen';
import HomeScreen from './components/HomeScreen';
import LanguageSelector from './components/LanguageSelector.tsx';
import ClassifiedsScreen from './components/ClassifiedsScreen';
import './i18n';
import { useTranslation } from 'react-i18next';
import { applicationName } from './appSettings.tsx';
import LandingPage from './components/LandingPage.tsx';
import { getSafeImageURL } from './helpers/helpers.tsx';
import TestPage from './components/TestPage.tsx';




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
  const { showBottomBar, setShowBottomBar } = useSettings();
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
      // Don't set bottom bar here - MessagesScreen manages it based on selectedChat
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
    
    // Hide bottom bar on post detail screen (/:username/status/:postId)
    if (path.includes('/status/')) {
      setShowBottomBar(false);
    }
    // Show bottom bar if not on messages screen
    // Note: MessagesScreen manages its own bottom bar visibility based on selectedChat
    // Only set bottom bar for other screens, not for /messages
    else if (path !== '/messages') {
      setShowBottomBar(true);
    }
    // For /messages, MessagesScreen will handle bottom bar visibility internally
  }, [location.pathname, setShowBottomBar]);

  const mobileNavItems = [
    { id: 'pride', label: "Pride", icon: "/icons/pride.webp" },
   // { id: 'search', label: t('app.nav.search'), icon: Search },
    { id: 'nearby', label: t('app.nav.nearby'), icon: "/icons/nearby.webp" },
    { id: 'match', label: t('app.nav.match'), icon: "/icons/matches.webp" },
   // { id: 'places', label: t('app.nav.places'), icon: Building2 },
    { id: 'messages', label: t('app.nav.messages'), icon: "/icons/chat.webp" },
    //{ id: 'notifications', label: t('app.nav.notifications'), icon: Bell },
    //{ id: 'classifieds', label: t('app.nav.classifieds'), icon: FileText },
    { id: 'profile', label: t('app.nav.profile'), icon: "/icons/profile.webp" },
  ];

  const handleTrendSelect = React.useCallback((trend: NormalizedTrend) => {
    if (trend?.url) {
      window.open(trend.url, '_blank', 'noopener,noreferrer');
      return;
    }

    const query = trend?.query || trend?.label;
    if (query && query.trim().length > 0) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    } else {
      navigate('/search');
    }
  }, [navigate]);


  
  return (
    <div className={`w-screen dark:bg-gray-950 bg-white h-screen`}>
      {/* Splash Screen */}
      {showSplash && (
        <SplashScreen onComplete={() => setShowSplash(false)} />
      )}

      {/* Twitter Style Layout - 3 Columns */}
      {!showSplash && (
      <div className={`max-h-[100dvh] w-full  flex mx-auto  max-w-7xl min-h-[100dvh] overflow-y-hidden overflow-x-hidden scrollbar-hide `}>
        
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
                <span className="text-sm font-bold">C</span>
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
        <aside className={`hidden    scrollbar-hide lg:flex flex-col w-[280px]`}>
          <div className="p-4 sticky top-0 h-screen overflow-y-auto flex flex-col">
            {/* Logo */}
            <div className="flex items-center justify-center mb-4 pt-2">
              <button className="flex items-center space-x-3 p-3 rounded-full hover:bg-opacity-10 transition-colors group">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-110 ${theme === 'dark'
                    ? 'bg-gradient-to-br from-white to-gray-300 text-black'
                    : 'bg-gradient-to-br from-black to-gray-700 text-white'
                  }`}>
                  <span className="text-xl font-bold">C</span>
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
                //{ id: 'search', label: t('app.nav.explore'), icon: Search },
                { id: 'match', label: t('app.nav.matches'), icon: Heart },
                { id: 'messages', label: t('app.nav.messages'), icon: MessageCircle },
                { id: 'notifications', label: t('app.nav.notifications'), icon: Bell },
                //{ id: 'places', label: t('app.nav.places'), icon: Building2 },
                //{ id: 'classifieds', label: t('app.nav.classifieds'), icon: FileText },
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
                          ? 'bg-gray-200 text-black shadow-lg shadow-gray/20'
                          : 'bg-black text-white shadow-lg shadow-black/20'
                        : theme === 'dark'
                          ? 'text-gray-400 hover:text-white hover:bg-white/10'
                          : 'text-gray-600 hover:text-black hover:bg-gray-100'
                    }`}>
                    <Icon className={`w-6 h-6 transition-transform duration-200  rounded-full ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                    <span className=" font-semibold text-base tracking-wide">{item.label}</span>
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
                              src={getSafeImageURL((user as any)?.avatar,"icon")}
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
        <main className={`max-h-[100dvh]  min-h-[100dvh] overflow-y-hidden overflow-x-hidden scrollbar-hide flex-1 min-w-0 lg:border-l lg:border-r  ${theme === 'dark' ? 'lg:border-gray-900/70' : 'lg:border-gray-100'} pt-[56px] lg:pt-0  lg:pb-0`}>
          {!isAuthenticated ? (
            /* Show AuthWizard in inline mode when not authenticated */
            <div className={`h-full w-full flex items-start lg:items-center justify-center overflow-y-auto ${theme === 'dark' ? 'bg-black' : 'bg-gray-50'}`}>
              <div className="w-full max-w-lg px-0 lg:px-4 py-4 lg:py-0">
                <AuthWizard
                  isOpen={true}
                  onClose={() => {
                    // Prevent closing - user must authenticate
                  }}
                  mode="inline"
                />
              </div>
            </div>
          ) : (
            <Routes>
              {/* Home Routes */}
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/" element={<HomeScreen />} />
              <Route path="/home" element={<HomeScreen />} />
              <Route path="/pride" element={<HomeScreen />} />
              <Route path="/testpage" element={<TestPage />} />

              <Route
                path="/:username/:engagementType"
                element={<ProfileEngagementsScreen />}
              />
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
          )}
        </main>

        {/* Right Sidebar - Fixed */}
        {/* Hide right sidebar on messages and notifications routes for better UX */}
        {location.pathname !== '/messages' && location.pathname !== '/landing' && location.pathname !== '/classifieds' && location.pathname !== '/places' && location.pathname !== '/match' && location.pathname !== '/nearby' &&(
        <aside className={`hidden xl:flex scrollbar-hide flex-col w-[380px]`}>
          <div className="p-5 sticky top-0 h-screen scrollbar-hide overflow-y-auto space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className={`relative overflow-hidden rounded-2xl ${theme === 'dark' ? 'bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent border border-indigo-500/40' : 'bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-white border border-indigo-100/80 shadow-sm'}`}
            >
              <div className="absolute inset-0 pointer-events-none">
                <div className={`absolute -top-10 -right-10 w-48 h-48 rounded-full blur-3xl ${theme === 'dark' ? 'bg-indigo-500/30' : 'bg-indigo-300/30'}`} />
                <div className={`absolute -bottom-16 -left-12 w-56 h-56 rounded-full blur-3xl ${theme === 'dark' ? 'bg-purple-500/20' : 'bg-purple-300/25'}`} />
              </div>
              <div className="relative p-5 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className={`text-[10px] font-semibold uppercase tracking-[0.4em] ${theme === 'dark' ? 'text-indigo-200/70' : 'text-indigo-500/80'}`}>
                      {t('app.trending_title')}
                    </p>
                    <h2 className={`text-xl font-bold leading-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {t('app.trending_hero_title')}
                    </h2>
                    <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-indigo-100/80' : 'text-gray-600'}`}>
                      {t('app.trending_hero_description')}
                    </p>
                  </div>
                  <div className={`p-3 rounded-2xl ${theme === 'dark' ? 'bg-white/10 text-white' : 'bg-white text-indigo-500 shadow'}`}>
                    <TrendingUp className="w-7 h-7" />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/search')}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all ${
                    theme === 'dark'
                      ? 'bg-white text-black hover:bg-gray-200'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  <Search className="w-4 h-4" />
                  {t('app.trending_hero_cta')}
                </button>
              </div>
            </motion.div>

            <PopularUsersPanel limit={6} />

            <TrendsPanel limit={20} onTrendSelect={handleTrendSelect} />

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className={`rounded-2xl p-5 ${theme === 'dark' ? 'bg-gray-950 border border-gray-900' : 'bg-white border border-gray-200 shadow-sm'}`}
            >
              <div className="flex items-start gap-3 mb-4">
                <div className={`p-2.5 rounded-xl ${theme === 'dark' ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-700'}`}>
                  <Filter className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className={`text-base font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {t('app.trending_saved_title')}
                  </h3>
                  <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {t('app.trending_saved_description')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/search')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  theme === 'dark'
                    ? 'bg-white/10 text-white hover:bg-white/15'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {t('app.trending_saved_action')}
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </motion.div>

          </div>
        </aside>
        )}

      {/* Clean Professional Bottom Bar */}
      {showBottomBar && (
      <nav className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 ${
        theme === 'dark' 
          ? 'bg-gray-950 border-t border-gray-900' 
          : 'bg-white/95 border-t border-black/[0.08]'
      } backdrop-blur-xl safe-area-inset-bottom`}>
        <div className="flex items-center justify-around px-4 py-3">
          {[
            { id: 'pride', icon:"/icons/pride.webp", label: "Pride"},
            { id: 'nearby', label: t('app.nav.nearby'), icon:"/icons/nearby.webp" },
            { id: 'match', icon:"/icons/matches.webp", label: t('app.nav.match') },
            { id: 'messages', icon: "/icons/chat.webp", label: t('app.nav.messages') },
            { id: 'profile',  icon:"/icons/profile.webp", label: t('app.nav.profile') },
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
                    style={{
                      zIndex:-1,
                    }}
                    className={`absolute inset-0 rounded-2xl ${
                      theme === 'dark'
                        ? 'bg-gray-50/[0.08]'
                        : 'bg-gray-950/[0.06]'
                    }`}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                
                <img className='w-8 h-8' src={item.icon}/>
                
                {/* Label */}
                <span 
                  className={`relative z-10 text-[10px] font-medium tracking-tight mt-1 transition-all duration-200 `}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
      )}

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
                        src={getSafeImageURL((user as any)?.avatar,"icon")}
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
                            {
                              <img src={item.icon}/>
                            }
                           
                            
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

    </div>
  );
}

export default App;
