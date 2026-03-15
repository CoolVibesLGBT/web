import React, { useState, Suspense, lazy } from 'react';
import ChunkErrorBoundary from './components/ui/ChunkErrorBoundary';
import { Routes, Route, useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from './components/ui/Footer';

// Lazy load screens for performance optimization
const MatchScreen = lazy(() => import('./screens/MatchScreen'));
const NearbyScreen = lazy(() => import('./screens/NearbyScreen'));
const ProfileScreen = lazy(() => import('./screens/ProfileScreen'));
const ProfileEngagementsScreen = lazy(() => import('./screens/ProfileEngagementsScreen'));
const SearchScreen = lazy(() => import('./screens/SearchScreen'));
const MessagesScreen = lazy(() => import('./screens/MessagesScreen'));
const NotificationsScreen = lazy(() => import('./screens/NotificationsScreen'));
const PlaceDetailsScreen = lazy(() => import('./screens/PlaceDetailsScreen'));
const HomeScreen = lazy(() => import('./screens/HomeScreen'));
const ClassifiedsScreen = lazy(() => import('./screens/ClassifiedsScreen'));
const ClassifiedDetailScreen = lazy(() => import('./screens/ClassifiedDetailScreen'));
const SettingsScreen = lazy(() => import('./screens/SettingsScreen'));
const LandingPage = lazy(() => import('./screens/LandingPage.tsx'));
const TestPage = lazy(() => import('./screens/TestPage.tsx'));
const PremiumScreen = lazy(() => import('./screens/PremiumScreen.tsx'));
const PostDetails = lazy(() => import('./screens/PostDetails.tsx'));
const WalletScreen = lazy(() => import('./screens/WalletScreen.tsx'));
const PlacesScreen = lazy(() => import('./screens/PlacesScreen.tsx'));
const ReferralsScreen = lazy(() => import('./screens/ReferralsScreen.tsx'));
const ReferralHandler = lazy(() => import('./screens/ReferralHandler.tsx'));
const CheckInScreen = lazy(() => import('./screens/CheckInScreen.tsx'));
const LegalScreen = lazy(() => import('./screens/LegalScreen.tsx'));

import SplashScreen from './components/ui/SplashScreen';
import { useTheme } from './contexts/ThemeContext';
import { useAuth } from './contexts/AuthContext.tsx';
import { useSettings } from './contexts/SettingsContext';
import AuthWizard from './features/auth/AuthWizard';
import { MapPin, Heart, MessageCircle, User, Users, Menu, X, Sun, Moon, MoreHorizontal, Bell, ChevronRight, LogOut, HandFist, Briefcase, Navigation, Settings as SettingsIcon, Globe } from 'lucide-react';
import TrendsPanel, { NormalizedTrend } from './features/discovery/TrendsPanel';
import PopularUsersPanel from './features/discovery/PopularUsersPanel';
import LanguageSelector from './components/ui/LanguageSelector.tsx';
import './i18n';
import { useTranslation } from 'react-i18next';
import { applicationName } from './appSettings.tsx';
import { getSafeImageURLEx } from './helpers/helpers.tsx';
import PwaInstallPrompt, { PwaInstallProvider, usePwaInstall } from './components/ui/PwaInstallPrompt';
import ConfirmationModal from './components/ui/ConfirmationModal.tsx';
const ACTIVE_SCREEN_BY_PATH: Record<string, string> = {
  '/': 'pride',
  '/pride': 'pride',
  '/search': 'search',
  '/nearby': 'nearby',
  '/match': 'match',
  '/messages': 'messages',
  '/notifications': 'notifications',
  '/places': 'places',
  '/wallet': 'wallet',
  '/referrals': 'referrals',
  '/classifieds': 'classifieds',
  '/checkin': 'checkin',
  '/settings': 'settings',
  '/profile': 'profile',
};

const DEFAULT_DOCUMENT_TITLE = 'CoolVibes – Inclusive LGBTIQA+ Gay Dating App';
const ROUTE_DEFAULT_TITLES: Record<string, string> = {
  '/': 'Home',
  '/home': 'Home',
  '/pride': 'Pride',
  '/search': 'Search',
  '/messages': 'Messages',
  '/match': 'Match',
  '/nearby': 'Nearby',
  '/wallet': 'Wallet',
  '/settings': 'Settings',
  '/notifications': 'Notifications',
  '/premium': 'Premium',
  '/referrals': 'Referrals',
  '/checkin': 'Check-in',
  '/classifieds': 'Classifieds',
  '/profile': 'Profile',
  '/landing': 'Where Every Voice Matters',
  '/places': 'LGBTQ+ Places',
  '/legal': 'Legal',
};

const RIGHT_SIDEBAR_HIDDEN_PATHS = new Set(['/messages', '/landing', '/classifieds', '/places', '/match', '/nearby', '/checkin']);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const { theme } = useTheme();

  if (!isAuthenticated) {
    return (
      <div className={`h-full w-full flex items-start lg:items-center justify-center overflow-y-auto ${theme === 'dark' ? 'bg-black' : 'bg-gray-50'}`}>
        <div className="w-full max-w-lg px-0 lg:px-4 py-4 lg:py-0">
          <AuthWizard
            isOpen={true}
            onClose={() => { }}
            mode="inline"
          />
        </div>
      </div>
    );
  }
  return <>{children}</>;
};

function AppContent() {
  const [activeScreen, setActiveScreen] = useState('pride');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthWizardOpen, setIsAuthWizardOpen] = useState(false);
  const [isLanguageSelectorOpen, setIsLanguageSelectorOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileProfileMenuOpen, setIsMobileProfileMenuOpen] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const { showBottomBar, setShowBottomBar } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('common');
  const { canInstall } = usePwaInstall();
  const previousCanInstallRef = React.useRef(false);
  const showSidebarInstallCard = canInstall && !showInstallBanner;
  const handleBannerDismiss = React.useCallback(() => {
    setShowInstallBanner(false);
  }, []);
  const languageDisplay = React.useMemo(() => {
    const lang = i18n?.language || 'en';
    const base = lang.split('-')[0] || lang;
    return base.toUpperCase();
  }, [i18n?.language]);
  const profilePath = React.useMemo(() => `/${user?.username || 'profile'}`, [user?.username]);
  const displayName = user?.displayname || user?.username || 'User';
  const username = user?.username || 'username';
  const followingCount = (user as any)?.engagements?.counts?.following_count ?? 0;
  const followerCount = (user as any)?.engagements?.counts?.follower_count ?? 0;
  const avatarIconSrc = getSafeImageURLEx((user as any)?.public_id, (user as any)?.avatar, 'icon') || undefined;
  const shouldShowRightSidebar = !Array.from(RIGHT_SIDEBAR_HIDDEN_PATHS).some(p => location.pathname === p || location.pathname.startsWith(p + '/'));

  // Default document title by route (screens with useSEO override this)
  React.useEffect(() => {
    const path = location.pathname;
    let titleKey = path;
    if (path.startsWith('/legal/')) titleKey = '/legal';
    else if (path.startsWith('/places/')) titleKey = '/places';
    else if (path.startsWith('/classifieds/')) titleKey = '/classifieds';
    const segment = ROUTE_DEFAULT_TITLES[titleKey];
    document.title = segment ? `${segment} | CoolVibes` : DEFAULT_DOCUMENT_TITLE;
  }, [location.pathname]);

  // Update activeScreen based on current URL
  React.useEffect(() => {
    const path = location.pathname;
    const nextScreen = ACTIVE_SCREEN_BY_PATH[path];

    if (path.startsWith('/classifieds')) {
      setActiveScreen('classifieds');
    } else if (nextScreen) {
      setActiveScreen(nextScreen);
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

  React.useEffect(() => {
    if (canInstall && !previousCanInstallRef.current) {
      setShowInstallBanner(true);
    }

    if (!canInstall) {
      setShowInstallBanner(false);
    }

    previousCanInstallRef.current = canInstall;
  }, [canInstall]);

  const sidebarNavItems = React.useMemo(() => [
    {
      id: 'pride',
      label: t('app.nav.home', { defaultValue: 'Pride' }),
      path: '/',
      icon: HandFist,
      accent: 'from-rose-500/90 via-fuchsia-500/80 to-purple-500/70'
    },
    {
      id: 'checkin',
      label: t('app.nav.checkin', { defaultValue: 'Check-In' }),
      path: '/checkin',
      icon: Navigation,
      accent: 'from-blue-400/80 to-indigo-500/80'
    },
    {
      id: 'nearby',
      label: t('app.nav.nearby'),
      path: '/nearby',
      icon: MapPin,
      accent: 'from-amber-400/80 to-orange-500/80'
    },
    {
      id: 'match',
      label: t('app.nav.matches'),
      path: '/match',
      icon: Heart,
      accent: 'from-rose-400/80 to-red-500/80'
    },
    {
      id: 'places',
      label: t('app.nav.places', { defaultValue: 'Places' }),
      path: '/places',
      icon: MapPin,
      accent: 'from-green-400/80 to-emerald-500/80'
    },
    {
      id: 'classifieds',
      label: t('app.nav.classifieds', { defaultValue: 'İş Dünyası' }),
      path: '/classifieds',
      icon: Briefcase,
      accent: 'from-indigo-400/80 to-blue-600/80'
    },
    {
      id: 'messages',
      label: t('app.nav.messages'),
      path: '/messages',
      icon: MessageCircle,
      accent: 'from-sky-400/80 to-indigo-500/80'
    },
    {
      id: 'notifications',
      label: t('app.nav.notifications'),
      path: '/notifications',
      icon: Bell,
      accent: 'from-emerald-400/80 to-teal-500/80'
    },
    // TODO: Re-enable wallet when ready
    // {
    //   id: 'wallet',
    //   label: t('wallet.title'),
    //   path: '/wallet',
    //   icon: Wallet,
    //   accent: 'from-cyan-400/80 to-blue-500/80'
    // },
    {
      id: 'referrals',
      label: t('app.nav.referrals', { defaultValue: 'Referrals' }),
      path: '/referrals',
      icon: Users,
      accent: 'from-fuchsia-400/80 to-purple-500/80'
    },
    {
      id: 'settings',
      label: t('app.nav.settings', { defaultValue: 'Settings' }),
      path: '/settings',
      icon: SettingsIcon,
      accent: 'from-slate-400/80 to-slate-600/80'
    },
    {
      id: 'profile',
      label: t('app.nav.profile'),
      path: profilePath,
      icon: User,
      accent: 'from-gray-900/80 to-gray-700/80'
    }
  ], [profilePath, t]);

  const mobileNavItems = React.useMemo(() => {
    const mobileOrder = ['pride', 'match', 'messages', 'nearby', 'places', 'checkin', 'classifieds', 'notifications', 'referrals', 'settings', 'profile'];
    return mobileOrder
      .map((id) => sidebarNavItems.find((item) => item.id === id))
      .filter(Boolean) as typeof sidebarNavItems;
  }, [sidebarNavItems]);

  const sidebarNavSections = React.useMemo(() => {
    const primaryOrder = ['pride', 'match', 'messages', 'nearby', 'places', 'checkin', 'classifieds'];
    const secondaryOrder = ['notifications', 'referrals', 'settings', 'profile'];

    const sortByOrder = (ids: string[]) =>
      ids
        .map((id) => sidebarNavItems.find((item) => item.id === id))
        .filter(Boolean) as typeof sidebarNavItems;

    return [
      {
        id: 'primary',
        title: t('app.sidebar.primary', { defaultValue: 'Discover' }),
        items: sortByOrder(primaryOrder)
      },
      {
        id: 'secondary',
        title: t('app.sidebar.secondary', { defaultValue: 'Manage' }),
        items: sortByOrder(secondaryOrder)
      }
    ];
  }, [sidebarNavItems, t]);

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

  const navigateByNavId = React.useCallback((id: string) => {
    if (id === 'pride') {
      navigate('/');
      return;
    }
    if (id === 'profile') {
      navigate(profilePath);
      return;
    }
    navigate(`/${id}`);
  }, [navigate, profilePath]);

  const openProfile = React.useCallback(() => {
    navigate(profilePath);
  }, [navigate, profilePath]);

  const closeMobileMenu = React.useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const closeMobileMenus = React.useCallback(() => {
    setIsMobileProfileMenuOpen(false);
    setIsMobileMenuOpen(false);
  }, []);

  const openLanguageSelector = React.useCallback(() => {
    setIsLanguageSelectorOpen(true);
    setIsMobileMenuOpen(false);
  }, []);

  const handleLogoutConfirm = React.useCallback(() => {
    logout();
    navigate('/');
    setIsLogoutModalOpen(false);
  }, [logout, navigate]);

  const requestLogout = React.useCallback((after?: () => void) => {
    after?.();
    setIsLogoutModalOpen(true);
  }, []);

  const bottomNavItems = React.useMemo(() => [
    { id: 'pride', icon: HandFist, label: 'Pride', accent: 'from-rose-500/90 via-fuchsia-500/80 to-purple-500/70' },
    { id: 'match', icon: Heart, label: t('app.nav.match'), accent: 'from-rose-400/80 to-red-500/80' },
    { id: 'messages', icon: MessageCircle, label: t('app.nav.messages'), accent: 'from-sky-400/80 to-indigo-500/80' },
    { id: 'nearby', icon: MapPin, label: t('app.nav.nearby'), accent: 'from-amber-400/80 to-orange-500/80' },
    { id: 'profile', icon: User, label: t('app.nav.profile'), accent: 'from-gray-900/80 to-gray-700/80' },
  ], [t]);




  return (
    <div className={`w-screen dark:bg-gray-950 bg-white h-screen select-none`}>
      {/* Splash Screen */}
      {showSplash && (
        <SplashScreen onComplete={() => setShowSplash(false)} />
      )}

      {/* Twitter Style Layout - 3 Columns */}
      {!showSplash && (
        <div className={`max-h-[100dvh] w-full  flex mx-auto  max-w-7xl min-h-[100dvh] overflow-y-hidden overflow-x-hidden scrollbar-hide `}>

          {/* Mobile Header - Top Navigation */}
          <header className={`lg:hidden fixed top-0 left-0 right-0 z-50 ${theme === 'dark' ? 'bg-gray-950 backdrop-blur-xl border-b border-gray-800/50' : 'bg-white/95 backdrop-blur-xl border-b border-gray-100/50'}`}>
            <div className="flex items-center justify-between px-4 py-3">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/10'
                  }`}
              >
                <Menu className={`w-6 h-6 ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
              </button>
              <button
                onClick={() => navigateByNavId('pride')}
                className="flex items-center space-x-2"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${theme === 'dark'
                  ? 'bg-gradient-to-br from-white to-gray-300 text-black'
                  : 'bg-gradient-to-br from-black to-gray-700 text-white'
                  }`}>
                  <span className="text-sm font-bold">C</span>
                </div>
                <h1 className={`text-lg font-extrabold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {applicationName}
                </h1>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={openLanguageSelector}
                  className={`p-2 rounded-full transition-colors flex items-center gap-1.5 ${theme === 'dark' ? 'hover:bg-white/10 text-white/70' : 'hover:bg-black/10 text-gray-500'}`}
                >
                  <Globe className="w-5 h-5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{languageDisplay}</span>
                </button>
                {isAuthenticated ? (
                  <button
                    onClick={() => openProfile()}
                    className={`relative p-0.5 rounded-full transition-transform active:scale-95`}
                  >
                    <div className={`w-8 h-8 rounded-full overflow-hidden ring-2 ${theme === 'dark' ? 'ring-white/10' : 'ring-black/10'}`}>
                      {avatarIconSrc ? (
                        <img src={avatarIconSrc} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center ${theme === 'dark' ? 'bg-white/10' : 'bg-black/10'}`}>
                          <User className="w-5 h-5 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ${theme === 'dark' ? 'ring-gray-950' : 'ring-white'}`} />
                  </button>
                ) : (
                  <button
                    onClick={() => setIsAuthWizardOpen(true)}
                    className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/10'
                      }`}
                  >
                    <User className={`w-6 h-6 ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
                  </button>
                )}
              </div>
            </div>
          </header>

          {/* Left Sidebar - Fixed */}
          <aside className={`hidden scrollbar-hide lg:flex flex-col w-[304px]`}>
            <div className="p-4 sticky top-0 h-screen overflow-y-auto scrollbar-hide flex flex-col">
              {/* Logo */}
              <div className="mb-4 px-1 py-1">
                <button
                  onClick={() => navigateByNavId('pride')}
                  className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors group ${theme === 'dark'
                    ? 'hover:bg-white/[0.04]'
                    : 'hover:bg-black/[0.03]'
                    }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${theme === 'dark'
                    ? 'bg-white/10 text-white'
                    : 'bg-black text-white'
                    }`}>
                    <span className="text-sm font-bold">C</span>
                  </div>
                  <div className="min-w-0 text-left">
                    <h1 className={`text-[18px] leading-5 font-black tracking-tight truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {applicationName}
                    </h1>
                    <p className={`text-[11px] mt-0.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {t('app.subtitle', { defaultValue: 'Stories from the Rainbow' })}
                    </p>
                  </div>
                </button>
              </div>

              <div className="flex flex-col gap-5 flex-1">
                {isAuthenticated ? (
                  <div className={`relative rounded-2xl border px-4 py-4 ${theme === 'dark'
                    ? 'border-gray-800/90 bg-gray-900/30'
                    : 'border-black/[0.08] bg-white'
                    }`}>
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <div className={`w-11 h-11 rounded-[16px] overflow-hidden ring-2 ${theme === 'dark' ? 'ring-white/10' : 'ring-black/10'}`}>
                          <img
                            src={avatarIconSrc}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 ring-2 ${theme === 'dark' ? 'ring-black' : 'ring-white'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {displayName}
                        </p>
                        <p className={`text-xs text-gray-500 truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          @{username}
                        </p>
                        <div className="mt-1.5 flex items-center gap-3">
                          <span className={`text-[11px] ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              {followingCount}
                            </span>{' '}
                            {t('app.following')}
                          </span>
                          <span className={`text-[11px] ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              {followerCount}
                            </span>{' '}
                            {t('app.followers')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={openLanguageSelector}
                          className={`p-1.5 rounded-lg transition-all flex items-center gap-1 ${theme === 'dark' ? 'hover:bg-white/10 text-white/50 hover:text-white' : 'hover:bg-black/5 text-gray-400 hover:text-gray-700'}`}
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold">{languageDisplay}</span>
                        </button>
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsProfileMenuOpen(!isProfileMenuOpen);
                            }}
                            className={`p-2 rounded-xl transition ${theme === 'dark'
                              ? 'text-white/70 hover:bg-white/10'
                              : 'text-gray-600 hover:bg-gray-100'
                              } ${isProfileMenuOpen ? (theme === 'dark' ? 'bg-white/10 text-white' : 'bg-gray-200 text-gray-900') : ''}`}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          
                          <AnimatePresence>
                            {isProfileMenuOpen && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -6 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -6 }}
                                transition={{ duration: 0.18 }}
                                className={`absolute top-full right-0 mt-2 w-52 z-50 rounded-xl overflow-hidden border ${theme === 'dark'
                                  ? 'bg-gray-900 border-gray-800'
                                  : 'bg-white border-gray-200 shadow-lg'
                                  }`}
                              >
                                <button
                                  onClick={() => {
                                    openProfile();
                                    setIsProfileMenuOpen(false);
                                  }}
                                  className={`w-full px-4 py-3 flex items-center gap-3 text-left ${theme === 'dark'
                                    ? 'text-white hover:bg-white/10'
                                    : 'text-gray-900 hover:bg-gray-50'
                                    }`}
                                >
                                  <User className="w-4 h-4" />
                                  <span className="text-sm font-semibold">{t('app.nav.profile')}</span>
                                </button>
                                <button
                                  onClick={() => {
                                    navigate('/settings');
                                    setIsProfileMenuOpen(false);
                                  }}
                                  className={`w-full px-4 py-3 flex items-center gap-3 text-left ${theme === 'dark'
                                    ? 'text-white hover:bg-white/10'
                                    : 'text-gray-900 hover:bg-gray-50'
                                    }`}
                                >
                                  <SettingsIcon className="w-4 h-4" />
                                  <span className="text-sm font-semibold">{t('app.nav.settings')}</span>
                                </button>
                                <div className={`h-px ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`} />
                                <button
                                  onClick={() => requestLogout(() => setIsProfileMenuOpen(false))}
                                  className={`w-full px-4 py-3 flex items-center gap-3 text-left ${theme === 'dark'
                                    ? 'text-red-400 hover:bg-red-500/10'
                                    : 'text-red-600 hover:bg-red-50'
                                    }`}
                                >
                                  <LogOut className="w-4 h-4" />
                                  <span className="text-sm font-semibold">{t('app.logout')}</span>
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                    
                    <AnimatePresence>
                      {isProfileMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="fixed inset-0 z-40"
                          onClick={() => setIsProfileMenuOpen(false)}
                        />
                      )}
                    </AnimatePresence>
                    
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <button
                        onClick={openProfile}
                        className={`rounded-xl px-3 py-2 text-sm font-semibold ${theme === 'dark'
                          ? 'bg-white text-black'
                          : 'bg-gray-900 text-white'
                          }`}
                      >
                        {t('app.view_profile', { defaultValue: 'Profile' })}
                      </button>
                      <button
                        onClick={() => requestLogout()}
                        className={`rounded-xl px-3 py-2 text-sm font-semibold ${theme === 'dark'
                          ? 'bg-white/5 text-white hover:bg-white/10'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                          }`}
                      >
                        {t('app.logout')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={`rounded-[24px] border px-4 py-4 ${theme === 'dark'
                    ? 'bg-gray-900/30 border-gray-800/90'
                    : 'bg-white border-black/[0.06]'
                    }`}>
                    <div className="flex items-center justify-between">
                      <p className={`text-[10px] uppercase tracking-[0.3em] ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {t('app.join_title', { defaultValue: 'Welcome' })}
                      </p>
                      <button
                        onClick={openLanguageSelector}
                        className={`p-1.5 rounded-lg transition-all flex items-center gap-1 ${theme === 'dark' ? 'hover:bg-white/10 text-white/50 hover:text-white' : 'hover:bg-black/5 text-gray-400 hover:text-gray-700'}`}
                      >
                        <Globe className="w-3 h-3" />
                        <span className="text-[10px] font-bold">{languageDisplay}</span>
                      </button>
                    </div>
                    <p className={`text-lg font-semibold mt-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {t('app.join_subtitle', { defaultValue: 'Create your profile' })}
                    </p>
                    <button
                      onClick={() => setIsAuthWizardOpen(true)}
                      className={`mt-4 w-full px-4 py-3 rounded-2xl font-semibold transition-all ${theme === 'dark'
                        ? 'bg-white text-black hover:bg-white/90'
                        : 'bg-black text-white hover:bg-black/90'
                        }`}
                    >
                      {t('app.join_now')}
                    </button>
                  </div>
                )}

                {/* Navigation */}
                <nav className="flex-1">
                  <div className={`rounded-2xl border p-2.5 space-y-3 ${theme === 'dark'
                    ? 'border-gray-800/90 bg-gray-900/25'
                    : 'border-black/[0.06] bg-white'
                    }`}>
                    {sidebarNavSections.map((section) => (
                      <div key={section.id}>
                        <p className={`px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {section.title}
                        </p>
                        <div className="space-y-1.5">
                          {section.items.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeScreen === item.id;
                            return (
                              <button
                                key={item.id}
                                onClick={() => navigate(item.path || '/')}
                                className={`w-full relative rounded-xl px-3 py-2.5 border transition-all flex items-center justify-between ${theme === 'dark'
                                  ? 'border-gray-800/80 bg-transparent hover:bg-gray-800/45'
                                  : 'border-black/[0.06] bg-transparent hover:bg-black/[0.03]'
                                  } ${isActive
                                    ? (theme === 'dark'
                                      ? 'ring-1 ring-gray-600/60 bg-gray-800/55'
                                      : 'ring-1 ring-black/15 bg-black/[0.03]')
                                    : ''
                                  }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${item.accent} text-white`}>
                                    <Icon className="w-4 h-4" />
                                  </div>
                                  <p className={`text-sm font-semibold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    {item.label}
                                  </p>
                                </div>
                                <ChevronRight className={`w-4 h-4 shrink-0 ${theme === 'dark' ? 'text-white/45' : 'text-black/45'}`} />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </nav>

                {/* Quick Actions */}
                <div className="flex flex-col gap-2 pt-2">
                  <motion.button
                    onClick={toggleTheme}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className={`rounded-xl border px-3 py-2.5 text-left transition-all ${theme === 'dark'
                      ? 'border-gray-800/90 bg-gray-900/35 hover:bg-gray-800/60 text-white'
                      : 'border-black/[0.06] bg-white hover:bg-black/[0.03] text-gray-900'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {theme === 'dark' ? (
                          <Sun className="w-4 h-4 text-amber-300" />
                        ) : (
                          <Moon className="w-4 h-4 text-indigo-500" />
                        )}
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.2em] opacity-70">
                            {t('app.theme', { defaultValue: 'Theme' })}
                          </p>
                          <p className="text-sm font-semibold">
                            {theme === 'dark' ? t('app.light_mode') : t('app.dark_mode')}
                          </p>
                        </div>
                      </div>
                      <div className={`w-11 h-5 rounded-full flex items-center px-1 ${theme === 'dark' ? 'bg-white/15' : 'bg-black/10'}`}>
                        <span
                          aria-hidden="true"
                          className={`block h-4 w-4 rounded-full transition-transform duration-200 ease-out ${theme === 'dark'
                            ? 'translate-x-[1.25rem] bg-white'
                            : 'translate-x-0 bg-black'
                            }`}
                        />
                      </div>
                    </div>
                  </motion.button>

                  <motion.button
                    onClick={openLanguageSelector}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className={`rounded-xl border px-3 py-2.5 text-left transition-all ${theme === 'dark'
                      ? 'border-gray-800/90 bg-gray-900/35 hover:bg-gray-800/60 text-white'
                      : 'border-black/[0.06] bg-white hover:bg-black/[0.03] text-gray-900'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className={`w-4 h-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.2em] opacity-70">
                            {t('app.language', { defaultValue: 'Language' })}
                          </p>
                          <p className="text-sm font-semibold">
                            {languageDisplay}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 opacity-50 ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
                    </div>
                  </motion.button>
                </div>
              </div>
            </div>
          </aside>


          {/* Middle Section - Scrollable */}
          <main className={`max-h-[100dvh]  min-h-[100dvh] overflow-y-hidden overflow-x-hidden scrollbar-hide flex-1 min-w-0 lg:border-l lg:border-r  ${theme === 'dark' ? 'lg:border-gray-900/70' : 'lg:border-gray-100'} pt-[56px] lg:pt-0  lg:pb-0`}>
            <ChunkErrorBoundary>
              <Suspense fallback={<div className="h-full w-full flex items-center justify-center bg-[var(--background-color)]"><SplashScreen onComplete={() => { }} /></div>}>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/landing" element={<LandingPage />} />
                  <Route path="/places" element={<PlacesScreen />} />
                  <Route path="/places/:publicId" element={<PlaceDetailsScreen />} />
                  <Route path="/ref/:code" element={<ReferralHandler />} />
                  <Route path="/:username/status/:postId" element={<PostDetails />} />
                  <Route path="/status/:postId" element={<PostDetails />} />
                  <Route path="/:username/:engagementType" element={<ProfileEngagementsScreen />} />
                  <Route path="/:username" element={<ProfileScreen />} />

                  {/* Protected Routes */}
                  <Route path="/" element={<ProtectedRoute><HomeScreen /></ProtectedRoute>} />
                  <Route path="/home" element={<ProtectedRoute><HomeScreen /></ProtectedRoute>} />
                  <Route path="/pride" element={<ProtectedRoute><HomeScreen /></ProtectedRoute>} />
                  <Route path="/testpage" element={<ProtectedRoute><TestPage /></ProtectedRoute>} />
                  <Route path="/premium" element={<ProtectedRoute><PremiumScreen /></ProtectedRoute>} />
                  <Route path="/wallet" element={<ProtectedRoute><WalletScreen /></ProtectedRoute>} />
                  <Route path="/referrals" element={<ProtectedRoute><ReferralsScreen /></ProtectedRoute>} />

                  <Route path="/checkin" element={<ProtectedRoute><CheckInScreen /></ProtectedRoute>} />

                  <Route path="/search" element={<ProtectedRoute><SearchScreen /></ProtectedRoute>} />
                  <Route path="/match" element={<ProtectedRoute><MatchScreen /></ProtectedRoute>} />
                  <Route path="/nearby" element={<ProtectedRoute><NearbyScreen /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>} />

                  <Route path="/messages" element={<ProtectedRoute><MessagesScreen /></ProtectedRoute>} />
                  <Route path="/notifications" element={<ProtectedRoute><NotificationsScreen /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><SettingsScreen /></ProtectedRoute>} />
                  <Route path="/classifieds" element={<ProtectedRoute><ClassifiedsScreen /></ProtectedRoute>} />
                  <Route path="/classifieds/:id" element={<ProtectedRoute><ClassifiedDetailScreen /></ProtectedRoute>} />

                  {/* Fallback */}
                  <Route path="*" element={<HomeScreen />} />

                  {/* Legal Pages */}
                  <Route path="/legal" element={<LegalScreen />} />
                  <Route path="/legal/:page" element={<LegalScreen />} />
                </Routes>
              </Suspense>
            </ChunkErrorBoundary>
          </main>

          {/* Right Sidebar - Fixed */}
          {/* Hide right sidebar on messages and notifications routes for better UX */}
          {shouldShowRightSidebar && (
            <aside className={`hidden xl:flex scrollbar-hide flex-col w-[380px]`}>
              <div className="p-5 sticky top-0 h-screen scrollbar-hide overflow-y-auto space-y-4">
                {showSidebarInstallCard && (
                  <PwaInstallPrompt variant="card" />
                )}


                <PopularUsersPanel limit={12} />

                <TrendsPanel limit={20} onTrendSelect={handleTrendSelect} />

                {/* Legal Footer */}
                <div className="pb-4 pt-2">
                  <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                    {[
                      { label: 'Legal', to: '/legal' },
                      { label: 'Privacy Policy', to: '/legal/privacy' },
                      { label: 'Cookie Policy', to: '/legal/cookies' },
                      { label: 'Terms of Service', to: '/legal/terms' },
                      { label: 'Code of Conduct', to: '/legal/conduct' },
                      { label: 'Community Guidelines', to: '/legal/guidelines' },
                      { label: 'Accessibility', to: '/legal/accessibility' },
                      { label: 'About', to: '/legal/about' },
                      { label: 'Help Center', to: '/legal/help' },
                    ].map((link) => (
                      <Link
                        key={link.label}
                        to={link.to}
                        className={`text-xs font-medium transition-colors hover:underline underline-offset-2 ${
                          theme === 'dark'
                            ? '!text-white hover:!text-white/80'
                            : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                  <p className={`mt-3 text-xs ${theme === 'dark' ? '!text-white' : 'text-gray-400'}`}>
                    © {new Date().getFullYear()} CoolVibes LGBT. All rights reserved.
                  </p>
                </div>

              </div>

            </aside>
          )}

          {/* Clean Professional Bottom Bar */}
          {showBottomBar && (
            <nav className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 ${theme === 'dark'
              ? 'bg-gray-950/80 border-t border-gray-900/50 shadow-[0_-8px_30px_rgb(0,0,0,0.12)]'
              : 'bg-white/80 border-t border-black/[0.04] shadow-[0_-8px_30px_rgb(0,0,0,0.04)]'
              } backdrop-blur-2xl safe-area-inset-bottom`}>
              <div className="flex items-center justify-around px-2 py-2">
                {bottomNavItems.map((item) => {
                  const isActive = activeScreen === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigateByNavId(item.id)}
                      className="relative flex flex-col items-center justify-center flex-1 py-1.5 px-1 min-w-0 transition-all duration-300"
                    >
                      {/* Premium Active Indicator (Pill or Dot) */}
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className={`absolute inset-x-3 inset-y-1 rounded-[16px] ${theme === 'dark'
                            ? 'bg-white/[0.05]'
                            : 'bg-black/[0.04]'
                            }`}
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        />
                      )}

                      <div className={`relative z-10 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        isActive ? 'scale-110' : 'scale-100 opacity-60'
                      } bg-gradient-to-br ${item.accent} text-white shadow-lg`}>
                        <Icon className="w-4 h-4" strokeWidth={2.5} />
                      </div>

                      {/* Label with micro-animation */}
                      <span
                        className={`relative z-10 text-[9px] font-black uppercase tracking-tighter mt-1.5 transition-all duration-300 ${
                          isActive 
                            ? (theme === 'dark' ? 'text-white' : 'text-black') 
                            : 'text-gray-500 opacity-40'
                        }`}>
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
                  className={`fixed inset-0 z-[100] backdrop-blur-md ${theme === 'dark' ? 'bg-black/60' : 'bg-black/40'
                    }`}
                  onClick={closeMobileMenu}
                  style={{ willChange: 'opacity' }}
                />

                {/* Mobile Menu Panel - Premium Design */}
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{
                    type: 'tween',
                    ease: [0.16, 1, 0.3, 1],
                    duration: 0.4
                  }}
                  style={{
                    willChange: 'transform',
                    transform: 'translateZ(0)',
                    backfaceVisibility: 'hidden'
                  }}
                  className={`fixed top-0 left-0 bottom-0 w-[320px] max-w-[85vw] z-[101] ${theme === 'dark'
                    ? 'bg-gray-950 border-r border-gray-800/80'
                    : 'bg-white border-r border-black/[0.08]'
                    } flex flex-col shadow-2xl`}
                  onAnimationStart={() => {
                    if (isMobileMenuOpen) {
                      document.body.style.overflow = 'hidden';
                    }
                  }}
                >
                  {/* Close Button - Floating */}
                  <motion.button
                    onClick={closeMobileMenu}
                    className={`absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${theme === 'dark'
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

                  {/* Profile Section */}
                  <div className={`px-4 pt-16 pb-5 border-b ${theme === 'dark' ? 'border-gray-800/80' : 'border-black/[0.08]'
                    }`}>
                    <motion.div
                      className={`rounded-2xl border p-3.5 ${theme === 'dark'
                        ? 'border-gray-800/90 bg-gray-900/40'
                        : 'border-black/[0.08] bg-white'
                        }`}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={avatarIconSrc}
                            alt="Profile"
                            className={`w-14 h-14 rounded-xl object-cover border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
                          />
                          <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 ${theme === 'dark' ? 'border-gray-900' : 'border-white'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-[14px] font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {user?.displayname || user?.username || t('app.guest_user')}
                          </h3>
                          <p className={`text-[12px] truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            @{username}
                          </p>
                          <div className="mt-1.5 flex items-center gap-3">
                            <span className={`text-[11px] ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                              <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {followingCount}
                              </span>{' '}
                              {t('app.following')}
                            </span>
                            <span className={`text-[11px] ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                              <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {followerCount}
                              </span>{' '}
                              {t('app.followers')}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={openLanguageSelector}
                            className={`p-2 rounded-lg transition-all flex items-center gap-1.5 ${theme === 'dark' ? 'hover:bg-white/10 text-white/50 hover:text-white' : 'hover:bg-black/5 text-gray-400 hover:text-gray-700'}`}
                          >
                            <Globe className="w-4 h-4" />
                            <span className="text-[11px] font-bold">{languageDisplay}</span>
                          </button>
                          {isAuthenticated && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsMobileProfileMenuOpen(!isMobileProfileMenuOpen);
                              }}
                              className={`p-2 rounded-lg transition-all flex-shrink-0 ${theme === 'dark'
                                ? 'hover:bg-white/10 text-gray-400 hover:text-white'
                                : 'hover:bg-black/10 text-gray-600 hover:text-black'
                                } ${isMobileProfileMenuOpen ? (theme === 'dark' ? 'bg-white/10 text-white' : 'bg-black/10 text-black') : ''}`}
                            >
                              <MoreHorizontal className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
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
                            className={`mt-3 rounded-2xl overflow-hidden ${theme === 'dark'
                              ? 'bg-gray-900/50 border border-gray-800'
                              : 'bg-white/50 border border-gray-200'
                              }`}
                          >
                            <button
                              onClick={() => {
                                openProfile();
                                closeMobileMenus();
                              }}
                              className={`w-full px-4 py-3.5 text-left flex items-center gap-3 transition-colors ${theme === 'dark'
                                ? 'hover:bg-white/10 text-white'
                                : 'hover:bg-black/5 text-gray-900'
                                }`}
                            >
                              <User className="w-5 h-5" />
                              <span className="font-semibold text-[15px]">{t('app.nav.profile')}</span>
                            </button>
                            <button
                              onClick={() => {
                                navigate('/settings');
                                closeMobileMenus();
                              }}
                              className={`w-full px-4 py-3.5 text-left flex items-center gap-3 transition-colors ${theme === 'dark'
                                ? 'hover:bg-white/10 text-white'
                                : 'hover:bg-black/5 text-gray-900'
                                }`}
                            >
                              <SettingsIcon className="w-5 h-5" />
                              <span className="font-semibold text-[15px]">{t('app.nav.settings')}</span>
                            </button>
                            <div className={`h-px ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`} />
                            <button
                              onClick={() => requestLogout(() => {
                                closeMobileMenus();
                              })}
                              className={`w-full px-4 py-3.5 text-left flex items-center gap-3 transition-colors ${theme === 'dark'
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

                  {/* Navigation - Professional List Layout */}
                  <nav className="flex-1 px-4 py-5 overflow-y-auto scrollbar-hide">
                    <div className={`rounded-2xl border p-2.5 ${theme === 'dark'
                      ? 'border-gray-800/90 bg-gray-900/30'
                      : 'border-black/[0.08] bg-white'
                      }`}>
                      <p className={`px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {t('app.sidebar.primary', { defaultValue: 'Discover' })}
                      </p>
                      <div className="space-y-1.5">
                        {mobileNavItems.map((item, _index) => {
                          const isActive = activeScreen === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => {
                                navigateByNavId(item.id);
                                closeMobileMenus();
                              }}
                              className={`w-full rounded-xl px-3 py-2.5 border transition-all flex items-center justify-between ${theme === 'dark'
                                ? 'border-gray-800/80 hover:bg-gray-800/45'
                                : 'border-black/[0.08] hover:bg-black/[0.03]'
                                } ${isActive
                                  ? (theme === 'dark'
                                    ? 'ring-1 ring-gray-600/70 bg-gray-800/55'
                                    : 'ring-1 ring-black/15 bg-black/[0.03]')
                                  : ''
                                }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br ${item.accent} text-white`}>
                                  <item.icon className="w-4 h-4" />
                                </div>
                                <span className={`text-sm font-semibold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                  {item.label}
                                </span>
                              </div>
                              <ChevronRight className={`w-4 h-4 shrink-0 ${theme === 'dark' ? 'text-white/45' : 'text-black/45'}`} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </nav>

                  {/* Footer - Enhanced */}
                  <div className={`px-4 py-4 border-t ${theme === 'dark' ? 'border-gray-800/80' : 'border-black/[0.08]'
                    }`}>
                    <div className="space-y-2">
                      {/* Theme Toggle */}
                      <motion.button
                        onClick={toggleTheme}
                        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-[16px] font-semibold text-[15px] tracking-[-0.011em] transition-all duration-200 ${theme === 'dark'
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
                        <div className={`w-11 h-6 rounded-full transition-colors duration-200 relative ${theme === 'dark' ? 'bg-white/20' : 'bg-black/20'
                          }`}>
                          <motion.div
                            className={`absolute top-0.5 w-5 h-5 rounded-full ${theme === 'dark' ? 'bg-white' : 'bg-black'
                              }`}
                            animate={{ x: theme === 'dark' ? 22 : 2 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          />
                        </div>
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

      {showInstallBanner && (
        <PwaInstallPrompt
          variant="floating"
          position="bottom-right"
          onDismiss={handleBannerDismiss}
          onInstalled={handleBannerDismiss}
        />
      )}

      {/* LanguageSelector */}
      {!showSplash && (
        <LanguageSelector isOpen={isLanguageSelectorOpen} onClose={() => setIsLanguageSelectorOpen(false)} />
      )}

      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogoutConfirm}
        title={t('app.logout_confirmation_title', { defaultValue: 'Confirm Logout' })}
        message={t('app.logout_confirmation_message', { defaultValue: 'Are you sure you want to log out?' })}
        confirmText={t('app.logout', { defaultValue: 'Logout' })}
        cancelText={t('app.cancel', { defaultValue: 'Cancel' })}
        variant="danger"
        icon={<LogOut className="w-6 h-6 text-red-500" />}
      />
    </div>
  );
}

function App() {
  return (
    <PwaInstallProvider>
      <AppContent />
    </PwaInstallProvider>
  );
}

export default App;
