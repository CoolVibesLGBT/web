import React, { useState, Suspense, lazy } from 'react';
import ChunkErrorBoundary from './components/ui/ChunkErrorBoundary';
import { armHomeHistoryGuard, useLocation, useNavigate, usePrefetch } from '@/router';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from './components/ui/Footer';

// Lazy load screens for performance optimization
const MatchScreen = lazy(() => import('./screens/MatchScreen'));
const NearbyScreen = lazy(() => import('./screens/NearbyScreen'));
const LiveScreen = lazy(() => import('./screens/LiveScreen'));
const ProfileScreen = lazy(() => import('./screens/ProfileScreen'));
const AppearanceScreen = lazy(() => import('./screens/AppearanceScreen'));
const ChatBackgroundScreen = lazy(() => import('./screens/AppearanceScreen').then(module => ({ default: module.ChatBackgroundScreen })));
const ProfileEngagementsScreen = lazy(() => import('./screens/ProfileEngagementsScreen'));
const SearchScreen = lazy(() => import('./screens/SearchScreen'));
const MessagesScreen = lazy(() => import('./screens/MessagesScreen'));
const GroupInviteScreen = lazy(() => import('./screens/GroupInviteScreen'));
const NotificationsScreen = lazy(() => import('./screens/NotificationsScreen'));
const PlaceDetailsScreen = lazy(() => import('./screens/PlaceDetailsScreen'));
const HomeScreen = lazy(() => import('./screens/HomeScreen'));
const ClassifiedsScreen = lazy(() => import('./screens/ClassifiedsScreen'));
const ClassifiedDetailScreen = lazy(() => import('./screens/ClassifiedDetailScreen'));
const SettingsScreen = lazy(() => import('./screens/SettingsScreen'));
const LandingPage = lazy(() => import('./screens/LandingPage'));
const TestPage = lazy(() => import('./screens/TestPage'));
const PremiumScreen = lazy(() => import('./screens/PremiumScreen'));
const PostDetails = lazy(() => import('./screens/PostDetails'));
const WalletScreen = lazy(() => import('./screens/WalletScreen'));
const PlacesScreen = lazy(() => import('./screens/PlacesScreen'));
const ReferralsScreen = lazy(() => import('./screens/ReferralsScreen'));
const ReferralHandler = lazy(() => import('./screens/ReferralHandler'));
const CheckInScreen = lazy(() => import('./screens/CheckInScreen'));
const LegalScreen = lazy(() => import('./screens/LegalScreen'));

import SplashScreen from './components/ui/SplashScreen';
import RouteLoader from './components/ui/RouteLoader';
import { useTheme } from './contexts/ThemeContext';
import { useAuth } from './contexts/AuthContext';
import { useSettings } from './contexts/SettingsContext';
import AuthWizard from './features/auth/AuthWizard';
import { MapPin, Heart, MessageCircle, User, Users, Sun, Moon, MoreHorizontal, Bell, LogOut, HandFist, Briefcase, Navigation, Settings as SettingsIcon, Globe, Video, Search, Sparkles, Home, Plus, Menu, ArrowLeft } from 'lucide-react';
import { AppHeader, AppTabBar, GroupedSection, ListRow, Sheet } from '@/components/ui/Interface';
import LanguageSelector from './components/ui/LanguageSelector';
import { resolvePreferredLanguage } from './i18n';
import IllustratedIcon from '@/components/ui/IllustratedIcon';
import '@/features/illustrations/IllustratedNavigation.css';
import { getLanguageTag, normalizeLanguage } from '@/i18n/language';
import { useSEO } from '@/hooks/useSEO';
import { getRouteSeo } from '@/seo/routeSeo';
import { useTranslation } from 'react-i18next';
import { DEFAULT_APP_MOTTO, DEFAULT_APP_NAME } from './constants/constants';
import { getSafeImageURLEx } from './helpers/helpers';
import TrendsPanel, { type NormalizedTrend } from './features/discovery/TrendsPanel';
import PwaInstallPrompt, { PwaInstallProvider, usePwaInstall } from './components/ui/PwaInstallPrompt';
import ConfirmationModal from './components/ui/ConfirmationModal';
import { isFeatureEnabled } from '@/config/featureFlags';
const ACTIVE_SCREEN_BY_PATH: Record<string, string> = {
  '/': 'pride',
  '/pride': 'pride',
  '/live': 'live',
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

const RESERVED_SINGLE_SEGMENT_ROUTES = new Set([
  'classifieds',
  'checkin',
  'home',
  'landing',
  'legal',
  'live',
  'match',
  'messages',
  'nearby',
  'notifications',
  'places',
  'premium',
  'pride',
  'profile',
  'referrals',
  'search',
  'settings',
  'splash',
  'wallet',
]);

const RIGHT_SIDEBAR_HIDDEN_PATHS_BASE = ['/messages', '/landing', '/premium'];

let bootSplashSeen = false;

const PROTECTED_SINGLE_SEGMENT_ROUTES = new Set([
  'checkin',
  'classifieds',
  'home',
  'live',
  'match',
  'messages',
  'nearby',
  'notifications',
  'premium',
  'pride',
  'profile',
  'referrals',
  'search',
  'settings',
  'testpage',
  'wallet',
]);

const isProtectedRoutePath = (path: string) => {
  if (path === '/') return false;
  if (/^\/checkin\/[^/]+$/.test(path)) return true;
  if (/^\/classifieds\/[^/]+$/.test(path)) return true;
  const segment = path.match(/^\/([^/]+)$/)?.[1] || null;
  return Boolean(segment && PROTECTED_SINGLE_SEGMENT_ROUTES.has(segment));
};

const publicHomeHighlights = [
  { icon: Heart, label: 'Stories', tone: 'text-rose-500 bg-rose-500/10' },
  { icon: MapPin, label: 'Nearby', tone: 'text-emerald-600 bg-emerald-500/10' },
  { icon: MessageCircle, label: 'Chat', tone: 'text-sky-600 bg-sky-500/10' },
];

const publicHomeStats = [
  { value: '24K', label: 'Members' },
  { value: '128', label: 'Cities' },
  { value: '4.9', label: 'Trust' },
];

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const { theme } = useTheme();

  if (!isAuthenticated) {
    return (
      <div className="relative h-full w-full overflow-y-auto text-slate-950 dark:text-white">
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden cv-pride-hero-bg">
          <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-black/18' : 'bg-white/18'}`} />
        </div>

        <header className="fixed top-4 inset-x-0 z-20 pointer-events-none flex justify-center px-4 md:top-8 md:px-12">
          <div className="w-full max-w-[1440px]">
            <div className="elite-floating pointer-events-auto inline-flex items-center gap-3 px-4 py-2 md:px-5 md:py-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-brand/25">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase leading-none tracking-[0.34em] text-slate-950 dark:text-white">
                  {DEFAULT_APP_NAME}
                </span>
                <span className="mt-0.5 text-[8px] font-bold uppercase tracking-normal text-brand">
                  {DEFAULT_APP_MOTTO}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="relative z-10 mx-auto grid min-h-full w-full max-w-[1180px] grid-cols-1 items-center gap-8 px-4 py-6 sm:px-6 md:py-10 lg:grid-cols-[minmax(0,1fr)_minmax(360px,430px)] lg:gap-12">
          <section className="order-2 hidden lg:block">
            <div className="max-w-[620px]">
              <h1 className="max-w-2xl text-[clamp(3rem,5.6vw,5.8rem)] font-black uppercase leading-[0.88] tracking-normal text-slate-950 dark:text-white">
                {DEFAULT_APP_NAME}
                <span className="mt-2 block h-2 w-full max-w-[430px] rounded-full bg-[linear-gradient(90deg,#e11d48,#f97316,#facc15,#10b981,#0ea5e9,#7c3aed)]" />
              </h1>
              <p className={`mt-7 max-w-xl text-lg font-semibold leading-relaxed ${theme === 'dark' ? 'text-white/68' : 'text-slate-600'}`}>
                Güvenli topluluk, yakınındaki kişiler, hikayeler ve sohbetler tek sakin akışta.
              </p>

              <div className="mt-8 flex flex-wrap gap-2.5">
                {publicHomeHighlights.map((item) => {
                  const Icon = item.icon;
                                    return (
                    <div
                      key={item.label}
                      className={`inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/68 px-4 py-2 text-sm font-black uppercase tracking-[0.12em] shadow-[0_14px_40px_rgba(15,23,42,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.06] ${theme === 'dark' ? 'text-white/82' : 'text-slate-700'}`}
                    >
                      <span className={`flex h-7 w-7 items-center justify-center rounded-full ${item.tone}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      {item.label}
                    </div>
                  );
                })}
              </div>

              <div className="mt-10 grid max-w-[520px] grid-cols-3 gap-2.5">
                {publicHomeStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-[22px] border border-white/70 bg-white/58 px-4 py-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.055]"
                  >
                    <p className="text-2xl font-black leading-none text-slate-950 dark:text-white">{stat.value}</p>
                    <p className="mt-2 text-[9px] font-black uppercase tracking-[0.22em] text-slate-400">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="order-1">
            <div className="mx-auto w-full max-w-[430px]">
              <AuthWizard
                isOpen={true}
                onClose={() => { }}
                mode="inline"
              />
            </div>
          </section>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};

const normalizePath = (path: string) => {
  if (!path) return '/';
  if (path !== '/' && path.endsWith('/')) {
    return path.slice(0, -1);
  }
  return path;
};

function AppContent() {
  const [activeScreen, setActiveScreen] = useState('pride');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthWizardOpen, setIsAuthWizardOpen] = useState(false);
  const [isLanguageSelectorOpen, setIsLanguageSelectorOpen] = useState(false);
  const [bootSeen, setBootSeen] = useState(() => bootSplashSeen);
  const [splashMinDone, setSplashMinDone] = useState(() => bootSplashSeen);
  const [isRailProfileMenuOpen, setIsRailProfileMenuOpen] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const rtlLangs = React.useMemo(() => new Set(['ar', 'he', 'fa', 'ur']), []);

  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, isAuthReady, logout } = useAuth();
  const { showBottomBar, setShowBottomBar } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const prefetch = usePrefetch();
  const { t, i18n } = useTranslation('common');
  const { canInstall } = usePwaInstall();
  const previousCanInstallRef = React.useRef(false);
  const showSidebarInstallCard = canInstall && !showInstallBanner;
  const liveEnabled = isFeatureEnabled('live_enabled');
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
  const avatarIconSrc = getSafeImageURLEx((user as any)?.public_id, (user as any)?.avatar, 'icon') || undefined;
  const rightSidebarHiddenPaths = React.useMemo(() => {
    return new Set(RIGHT_SIDEBAR_HIDDEN_PATHS_BASE);
  }, []);
  const shouldShowRightSidebar = !Array.from(rightSidebarHiddenPaths).some(p => location.pathname === p || location.pathname.startsWith(p + '/'));

  // Nearby'nin bubble/map, Places'in ve Check-In'in de map gibi immersive
  // (tam ekran) görünümlerindeyken sol/sağ navigasyon rail'leri haritanın
  // arkasında kalıp tıklanamaz hale gelmesin diye tamamen kaldırılıyor — her
  // ekran da kendi 'cv:*-controls-state' eventiyle hangi modda olduğunu
  // bildiriyor.
  const [isNearbyImmersiveView, setIsNearbyImmersiveView] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleNearbyControlsState = (event: Event) => {
      const detail = (event as CustomEvent<{ viewMode?: string } | null>).detail;
      const mode = detail?.viewMode;
      setIsNearbyImmersiveView(mode === 'map' || mode === 'bubble');
    };
    window.addEventListener('cv:nearby-controls-state', handleNearbyControlsState);
    return () => window.removeEventListener('cv:nearby-controls-state', handleNearbyControlsState);
  }, []);
  const [isPlacesImmersiveView, setIsPlacesImmersiveView] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePlacesControlsState = (event: Event) => {
      const detail = (event as CustomEvent<{ viewMode?: string } | null>).detail;
      setIsPlacesImmersiveView(detail?.viewMode === 'map');
    };
    window.addEventListener('cv:places-controls-state', handlePlacesControlsState);
    return () => window.removeEventListener('cv:places-controls-state', handlePlacesControlsState);
  }, []);
  const [isCheckInImmersiveView, setIsCheckInImmersiveView] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleCheckInControlsState = (event: Event) => {
      const detail = (event as CustomEvent<{ viewMode?: string } | null>).detail;
      setIsCheckInImmersiveView(detail?.viewMode === 'map');
    };
    window.addEventListener('cv:checkin-controls-state', handleCheckInControlsState);
    return () => window.removeEventListener('cv:checkin-controls-state', handleCheckInControlsState);
  }, []);
  const premiumMembershipEnabled = React.useMemo(() => isFeatureEnabled('premium_membership'), []);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const connection = (navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }).connection;
    if (connection?.saveData) return;
    if (connection?.effectiveType && ['slow-2g', '2g', '3g'].includes(connection.effectiveType)) {
      return;
    }

    const routesToPrefetch = [
      ...(liveEnabled ? ['/live'] : []),
      '/messages',
      '/notifications',
      profilePath
    ].filter(Boolean);

    const warmChunks = () => {
      // Prefetching is optional: failures must not become unhandled page errors.
      void Promise.allSettled([
        ...(liveEnabled ? [import('./screens/LiveScreen')] : []),
        import('./screens/MessagesScreen'),
        import('./screens/NotificationsScreen'),
        import('./screens/ProfileScreen'),
      ]);
    };

    let timeoutId: ReturnType<typeof globalThis.setTimeout> | undefined;
    let idleId: number | undefined;
    let cancelled = false;

    const warmRoutes = () => {
      if (cancelled) return;
      routesToPrefetch.forEach((route) => prefetch(route));
      warmChunks();
    };

    if ('requestIdleCallback' in window) {
      idleId = (window as any).requestIdleCallback(warmRoutes, { timeout: 2000 });
    } else {
      timeoutId = globalThis.setTimeout(warmRoutes, 1800);
    }

    return () => {
      cancelled = true;
      if (typeof idleId === 'number' && 'cancelIdleCallback' in window) {
        (window as any).cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) {
        globalThis.clearTimeout(timeoutId);
      }
    };
  }, [liveEnabled, prefetch, profilePath]);

  const routeSeoPath = React.useMemo(
    () => (!liveEnabled && location.pathname === '/live' ? '/' : location.pathname),
    [liveEnabled, location.pathname]
  );
  const routeSeo = React.useMemo(() => {
    const seo = getRouteSeo(routeSeoPath);
    if (routeSeoPath === '/landing' || (routeSeoPath === '/' && !isAuthenticated)) {
      return { ...seo, title: t('seo_title', { ns: 'landing' }), description: t('seo_description', { ns: 'landing' }), canonical: '/' };
    }
    return seo;
  }, [isAuthenticated, routeSeoPath, t]);
  useSEO(routeSeo);

  const hasTrackedInitialView = React.useRef(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!hasTrackedInitialView.current) {
      hasTrackedInitialView.current = true;
      return;
    }

    const pagePath = `${location.pathname}${location.search || ''}`;
    const payload = {
      page_path: pagePath,
      page_location: window.location.href,
      page_title: document.title,
    };

    const gtag = (window as any).gtag;
    if (typeof gtag === 'function') {
      gtag('config', 'G-ZSKTH9D2CQ', payload);
      return;
    }

    const dataLayer = (window as any).dataLayer;
    if (Array.isArray(dataLayer)) {
      dataLayer.push(['config', 'G-ZSKTH9D2CQ', payload]);
    }
  }, [location.pathname, location.search]);

  const normalizedPath = React.useMemo(
    () => normalizePath(location.pathname || '/'),
    [location.pathname]
  );
  const isHomePerformanceRoute = normalizedPath === '/' || normalizedPath === '/home' || normalizedPath === '/pride';

  React.useEffect(() => {
    if (isAuthReady && isAuthenticated && isHomePerformanceRoute) {
      armHomeHistoryGuard();
    }
  }, [isAuthReady, isAuthenticated, isHomePerformanceRoute]);

  React.useEffect(() => {
    if (!isAuthReady || isAuthenticated || !isProtectedRoutePath(normalizedPath)) {
      return;
    }
    navigate('/', { replace: true });
  }, [isAuthReady, isAuthenticated, navigate, normalizedPath]);

  const routeElement = React.useMemo(() => {
    const path = normalizedPath;

    // Public routes
    if (path === '/splash') return <SplashScreen autoDismiss={false} animate={true} />;
    if (path === '/landing' || (path === '/' && !isAuthenticated)) return <LandingPage />;
    if (path === '/places') return <PlacesScreen />;
    if (/^\/places\/[^/]+$/.test(path)) return <PlaceDetailsScreen />;
    if (/^\/ref\/[^/]+$/.test(path)) return <ReferralHandler />;
    if (/^\/[^/]+\/status\/[^/]+$/.test(path) || /^\/status\/[^/]+$/.test(path)) {
      return <PostDetails />;
    }
    if (/^\/checkin\/[^/]+$/.test(path)) {
      return (
        <ProtectedRoute>
          <PostDetails />
        </ProtectedRoute>
      );
    }
    if (/^\/[^/]+\/(followers|followings|blocking|blocked_by|like_given|like_received|dislike_given|dislike_received|matched|view_received)$/.test(path)) {
      return <ProfileEngagementsScreen />;
    }
    if (path === '/legal' || path.startsWith('/legal/')) return <LegalScreen />;

    // Protected routes
    if (path === '/' || path === '/home' || path === '/pride') {
      return (
        <ProtectedRoute>
          <HomeScreen />
        </ProtectedRoute>
      );
    }
    if (path === '/testpage') {
      return (
        <ProtectedRoute>
          <TestPage />
        </ProtectedRoute>
      );
    }
    if (path === '/premium') {
      if (!premiumMembershipEnabled) {
        return (
          <ProtectedRoute>
            <HomeScreen />
          </ProtectedRoute>
        );
      }
      return (
        <ProtectedRoute>
          <PremiumScreen />
        </ProtectedRoute>
      );
    }
    if (path === '/wallet') {
      return (
        <ProtectedRoute>
          <WalletScreen />
        </ProtectedRoute>
      );
    }
    if (path === '/referrals') {
      return (
        <ProtectedRoute>
          <ReferralsScreen />
        </ProtectedRoute>
      );
    }
    if (path === '/checkin') {
      return (
        <ProtectedRoute>
          <CheckInScreen />
        </ProtectedRoute>
      );
    }
    if (path === '/search') {
      return (
        <ProtectedRoute>
          <SearchScreen />
        </ProtectedRoute>
      );
    }
    if (path === '/match') {
      return (
        <ProtectedRoute>
          <MatchScreen />
        </ProtectedRoute>
      );
    }
    if (path === '/nearby') {
      return (
        <ProtectedRoute>
          <NearbyScreen />
        </ProtectedRoute>
      );
    }
    if (path === '/live') {
      if (!liveEnabled) {
        return (
          <ProtectedRoute>
            <HomeScreen />
          </ProtectedRoute>
        );
      }
      return <LiveScreen />;
    }
    if (path === '/profile') {
      return (
        <ProtectedRoute>
          <ProfileScreen />
        </ProtectedRoute>
      );
    }
    if (/^\/invite\/[A-Za-z0-9_-]{43}$/.test(path)) return <GroupInviteScreen token={path.split('/')[2]} />;
    if (/^\/group\/[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(path)) return <GroupInviteScreen username={path.split('/')[2]} />;
    if (path === '/messages') {
      return (
        <ProtectedRoute>
          <MessagesScreen />
        </ProtectedRoute>
      );
    }
    if (path === '/notifications') {
      return (
        <ProtectedRoute>
          <NotificationsScreen />
        </ProtectedRoute>
      );
    }
    if (path === '/settings/appearance' || path === '/settings/appearance/background') {
      return <ProtectedRoute>{path.endsWith('/background') ? <ChatBackgroundScreen /> : <AppearanceScreen />}</ProtectedRoute>;
    }
    if (path === '/settings') {
      return (
        <ProtectedRoute>
          <SettingsScreen />
        </ProtectedRoute>
      );
    }
    if (path === '/classifieds') {
      return (
        <ProtectedRoute>
          <ClassifiedsScreen />
        </ProtectedRoute>
      );
    }
    if (/^\/classifieds\/[^/]+$/.test(path)) {
      return (
        <ProtectedRoute>
          <ClassifiedDetailScreen />
        </ProtectedRoute>
      );
    }

    // Public profile route (must be last among dynamic routes)
    if (/^\/[^/]+$/.test(path)) {
      return <ProfileScreen />;
    }

    return <HomeScreen />;
  }, [isAuthenticated, liveEnabled, normalizedPath, premiumMembershipEnabled]);

  // Update activeScreen based on current URL
  React.useEffect(() => {
    const path = location.pathname;
    const tab = new URLSearchParams(location.search || '').get('tab');
    const nextScreen = ACTIVE_SCREEN_BY_PATH[path];

    if (path === '/live' && !liveEnabled) {
      setActiveScreen('pride');
    } else if (path.startsWith('/classifieds')) {
      setActiveScreen('classifieds');
    } else if (path.startsWith('/checkin/')) {
      setActiveScreen('checkin');
    } else if (path === '/' && tab === 'live') {
      setActiveScreen(liveEnabled ? 'live' : 'pride');
    } else if (path.startsWith('/settings/')) {
      setActiveScreen('settings');
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
    else if (path.includes('/checkin/')) {
      setShowBottomBar(false);
    }
    else if (path === '/match') {
      setShowBottomBar(false);
    }
    // Show bottom bar if not on messages screen
    // Note: MessagesScreen manages its own bottom bar visibility based on selectedChat
    // Only set bottom bar for other screens, not for /messages
    else if (path !== '/messages') {
      setShowBottomBar(true);
    }
    // For /messages, MessagesScreen will handle bottom bar visibility internally
  }, [liveEnabled, location.pathname, location.search, setShowBottomBar]);

  React.useEffect(() => {
    if (canInstall && !previousCanInstallRef.current) {
      setShowInstallBanner(true);
    }

    if (!canInstall) {
      setShowInstallBanner(false);
    }

    previousCanInstallRef.current = canInstall;
  }, [canInstall]);

  React.useEffect(() => {
    if (bootSeen) return;
    const timer = window.setTimeout(() => {
      setSplashMinDone(true);
    }, 800);
    return () => window.clearTimeout(timer);
  }, [bootSeen]);

  React.useEffect(() => {
    if (!bootSeen && splashMinDone && isAuthReady) {
      bootSplashSeen = true;
      setBootSeen(true);
    }
  }, [bootSeen, splashMinDone, isAuthReady]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const preferred = resolvePreferredLanguage();
    if (preferred && preferred !== i18n?.language) {
      i18n.changeLanguage(preferred);
    }
  }, [i18n]);

  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    const baseLang = normalizeLanguage(i18n?.language);
    const languageTag = getLanguageTag(baseLang);
    const dir = rtlLangs.has(baseLang) ? 'rtl' : 'ltr';
    const root = document.documentElement;
    if (root.getAttribute('lang') !== languageTag) {
      root.setAttribute('lang', languageTag);
    }
    if (root.getAttribute('dir') !== dir) {
      root.setAttribute('dir', dir);
    }
  }, [i18n?.language, rtlLangs]);

  const sidebarNavItems = React.useMemo(() => [
    {
      id: 'pride',
      label: t('app.nav.home', { defaultValue: 'Pride' }),
      path: '/',
      icon: HandFist,
      accent: 'from-rose-500/90 via-fuchsia-500/80 to-purple-500/70'
    },
    {
      id: 'live',
      label: t('app.nav.live', { defaultValue: 'Live' }),
      path: '/live',
      icon: Video,
      accent: 'from-emerald-400/90 to-teal-500/80'
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
  ], [profilePath, t]).filter((item) => liveEnabled || item.id !== 'live');



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
    if (id === 'live') {
      navigate(liveEnabled ? '/live' : '/');
      return;
    }
    if (id === 'profile') {
      navigate(profilePath);
      return;
    }
    navigate(`/${id}`);
  }, [liveEnabled, navigate, profilePath]);

  const openProfile = React.useCallback(() => {
    navigate(profilePath);
  }, [navigate, profilePath]);

  const openComposer = React.useCallback(() => {
    navigate('/');
    window.setTimeout(() => {
      window.dispatchEvent(new Event('cv:create-post'));
    }, 0);
  }, [navigate]);

  const dispatchShellEvent = React.useCallback((eventName: string) => {
    if (typeof window === 'undefined') {
      return;
    }
    window.dispatchEvent(new Event(eventName));
  }, []);

  const closeMobileMenu = React.useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const closeMobileMenus = React.useCallback(() => {
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

  const isLandingRoute = normalizedPath === '/landing' || (normalizedPath === '/' && !isAuthenticated);
  const isLegalRoute = normalizedPath === '/legal' || normalizedPath.startsWith('/legal/');
  const isPublicPage = isLandingRoute || isLegalRoute;
  const shouldShowBootSplash = !isPublicPage && !bootSeen && (!isAuthReady || !splashMinDone);
  const isPostDetailRoute = /^\/[^/]+\/status\/[^/]+$/.test(normalizedPath) || /^\/status\/[^/]+$/.test(normalizedPath);
  const singleSegment = normalizedPath.match(/^\/([^/]+)$/)?.[1] || null;
  const isProfileShellRoute = normalizedPath === '/profile' || Boolean(singleSegment && !RESERVED_SINGLE_SEGMENT_ROUTES.has(singleSegment));
  const isProfileEditRoute = isProfileShellRoute && new URLSearchParams(location.search || '').get('edit') === '1';
  const isCheckInDetailRoute = /^\/checkin\/[^/]+$/.test(normalizedPath);
  const isClassifiedDetailRoute = /^\/classifieds\/[^/]+$/.test(normalizedPath);
  const isPlaceDetailRoute = /^\/places\/[^/]+$/.test(normalizedPath);
  const profileEngagementMatch = React.useMemo(
    () => normalizedPath.match(/^\/([^/]+)\/(followers|followings|blocking|blocked_by|like_given|like_received|dislike_given|dislike_received|matched|view_received)$/),
    [normalizedPath]
  );
  const profileEngagementType = profileEngagementMatch?.[2] || null;
  const contextRouteTitle = React.useMemo(() => {
    if (normalizedPath === '/settings/appearance/background') return t('appearance.wallpaper');
    if (normalizedPath === '/settings/appearance') return t('appearance.title');
    if (isPlaceDetailRoute) return t('app.nav.places');
    if (isCheckInDetailRoute) return t('app.nav.checkin');
    if (isClassifiedDetailRoute) {
      return t('app.nav.classifieds', { defaultValue: 'Classifieds' });
    }
    if (profileEngagementType) {
      const engagementTitles: Record<string, string> = {
        followers: t('profile.followers', { defaultValue: 'Followers' }),
        followings: t('profile.following', { defaultValue: 'Following' }),
        blocking: t('profile.blocking', { defaultValue: 'Blocking' }),
        blocked_by: t('profile.blocked_by', { defaultValue: 'Blocked by' }),
        like_given: t('profile.like_given', { defaultValue: 'Likes given' }),
        like_received: t('profile.like_received', { defaultValue: 'Likes received' }),
        dislike_given: t('profile.dislike_given', { defaultValue: 'Dislikes given' }),
        dislike_received: t('profile.dislike_received', { defaultValue: 'Dislikes received' }),
        matched: t('profile.matches', { defaultValue: 'Matches' }),
        view_received: t('profile.view_received', { defaultValue: 'Profile views' }),
      };
      return engagementTitles[profileEngagementType] || t('profile.profile_tab', { defaultValue: 'Profile' });
    }
    if (normalizedPath.startsWith('/legal')) {
      return t('legal.title', { defaultValue: 'Legal' });
    }

    const routeTitles: Record<string, string> = {
      '/wallet': t('wallet.title', { defaultValue: 'Wallet' }),
      '/premium': t('premium.title', { defaultValue: 'Premium' }),
    };

    return routeTitles[normalizedPath] || null;
  }, [isClassifiedDetailRoute, isPlaceDetailRoute, isCheckInDetailRoute, normalizedPath, profileEngagementType, t]);
  const isContextBackRoute = (isPostDetailRoute || isClassifiedDetailRoute || Boolean(profileEngagementType) || Boolean(contextRouteTitle) || isProfileShellRoute);
  const shellBackTitle = isProfileEditRoute
    ? t('profile.edit_profile', { defaultValue: 'Edit Profile' })
    : contextRouteTitle
      ? contextRouteTitle
    : isProfileShellRoute
      ? t('profile.profile_tab', { defaultValue: 'Profile' })
    : t('post_details.title', { defaultValue: 'Post' });
  const shellBackLabel = t('post_details.back', { defaultValue: 'Back' });
  const handleShellBack = React.useCallback(() => {
    if (normalizedPath.startsWith('/settings/appearance')) {
      navigate(normalizedPath.endsWith('/background') ? '/settings/appearance' : '/settings', { replace: true });
      return;
    }
    const state = location.state as { fromPostDetails?: boolean; postId?: string; postUsername?: string; returnTo?: string } | null;
    if (isProfileEditRoute) {
      const params = new URLSearchParams(location.search || '');
      params.delete('edit');
      const nextSearch = params.toString();
      navigate(`${normalizedPath}${nextSearch ? `?${nextSearch}` : ''}`, { replace: true });
      return;
    }

    if (state?.returnTo) {
      navigate(state.returnTo, { replace: true });
      return;
    }

    if (state?.fromPostDetails && state.postId && state.postUsername) {
      navigate(`/${state.postUsername}/status/${state.postId}`, { replace: true });
      return;
    }

    if (isCheckInDetailRoute) {
      navigate('/checkin', { replace: true });
      return;
    }

    if (isClassifiedDetailRoute) {
      navigate('/classifieds', { replace: true });
      return;
    }

    if (isPlaceDetailRoute) {
      navigate('/places', { replace: true });
      return;
    }

    if (profileEngagementMatch) {
      navigate(`/${profileEngagementMatch[1]}`, { replace: true });
      return;
    }

    if (isProfileShellRoute || contextRouteTitle) {
      if (typeof window !== 'undefined' && window.history.length > 1) {
        navigate(-1);
        return;
      }
      navigate('/', { replace: true });
      return;
    }

    navigate('/', { replace: true });
  }, [contextRouteTitle, isCheckInDetailRoute, isClassifiedDetailRoute, isPlaceDetailRoute, isProfileEditRoute, isProfileShellRoute, location.search, location.state, navigate, normalizedPath, profileEngagementMatch]);
  const isAuthGateRoute = !isAuthenticated && (
    normalizedPath === '/' ||
    normalizedPath === '/home' ||
    normalizedPath === '/pride' ||
    isProtectedRoutePath(normalizedPath)
  );
  const showShellHud = !isPublicPage && !isAuthGateRoute;
  const showRightRail = isAuthenticated && !isPublicPage && shouldShowRightSidebar;
  const showLeftRail = isAuthenticated && !isPublicPage && !isAuthGateRoute;
  // Nearby (bubble/map), Places (map) ve Check-In (map) gibi immersive
  // görünümlerdeyken rail'in GENİŞLİĞİ (dolayısıyla ana içeriğin/üst bardaki
  // tab'ların yatay konumu) sabit kalsın diye aside kaldırılmıyor; sadece
  // içindeki nav içeriği gizlenip arkadaki tam ekran harita/bubble görünür
  // hale geliyor.
  const hideImmersiveRailContent =
    (normalizedPath === '/nearby' && isNearbyImmersiveView) ||
    (normalizedPath === '/places' && isPlacesImmersiveView) ||
    (normalizedPath === '/checkin' && isCheckInImmersiveView);
  const showDock = isAuthenticated && !isPublicPage && showBottomBar;


  const openNavigationMenu = React.useCallback(() => {
    setIsMobileMenuOpen(true);
  }, []);

  const mainShellClassName = isPublicPage || isAuthGateRoute || !shouldShowRightSidebar || hideImmersiveRailContent
    // Auth-gate (logged-out), landing ve geniş düzen ekranları (sağ rail'i
    // gizleyen rotalar: mesajlar, harita/liste görünümleri vb.) 600px'lik
    // feed kolonuna sıkışmamalı — aksi halde çok-sütunlu içerik kırık/boş
    // alanlı görünür. Dar, tek-sütun ekranlar (Ana Sayfa, Ayarlar, Profil…)
    // bu sınırı korur. Nearby immersive (bubble/map) modundayken de bölücü
    // çizgiler (border-x) ve 600px sınırı kaldırılır — arka plan tam ekran
    // bleed yapar.
    ? 'min-h-0 flex-1 min-w-0 overflow-hidden'
    : 'min-h-0 flex-1 min-w-0 overflow-hidden xl:max-w-[600px] xl:border-x xl:border-[var(--cv-inner-border)]';
  if (normalizedPath === '/splash') {
    return <SplashScreen autoDismiss={false} animate={true} />;
  }

  return (
    <div data-tab-bar={showDock ? 'true' : 'false'} className={`cv-app-shell overflow-hidden text-slate-950 transition-colors duration-700 dark:text-white ${
      isHomePerformanceRoute ? 'cv-home-performance' : ''
    }`}>
      {shouldShowBootSplash && <SplashScreen autoDismiss={false} animate={true} />}
      {showShellHud && <AppHeader
        title={isContextBackRoute ? shellBackTitle : sidebarNavItems.find(item => item.id === activeScreen)?.label || contextRouteTitle || DEFAULT_APP_NAME}
        leading={<button type="button" className="cv-icon-button" onClick={isContextBackRoute ? handleShellBack : openNavigationMenu} aria-label={isContextBackRoute ? shellBackLabel : t('app.sidebar.primary')}>
          {isContextBackRoute ? <ArrowLeft aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>}
        actions={<>
          {isAuthenticated && <button type="button" className="cv-icon-button" onClick={normalizedPath === '/classifieds' ? () => dispatchShellEvent('cv:classifieds-open-create') : openComposer} aria-label={normalizedPath === '/classifieds' ? t('classifieds.new_job_listing') : t('post.create')}><Plus aria-hidden="true" /></button>}
          <button type="button" className="cv-icon-button" onClick={isAuthenticated ? openProfile : () => setIsAuthWizardOpen(true)} aria-label={isAuthenticated ? t('app.open_profile') : t('app.open_auth')}>
            {avatarIconSrc ? <img src={avatarIconSrc} alt="" className="h-8 w-8 rounded-full object-cover" /> : <User aria-hidden="true" />}
          </button>
        </>}
      />}
      {/* Main application columns */}
      <div
        className={`cv-shell-columns max-h-[100dvh] w-full flex mx-auto min-h-[100dvh] overflow-y-hidden overflow-x-hidden scrollbar-hide gap-0 ${isPublicPage ? '' : 'max-w-[1265px] px-4 md:px-6'} ${
          shouldShowBootSplash ? 'pointer-events-none' : ''
        }`}
      >

          {/* Left Rail — persistent primary navigation (desktop) */}
          {showLeftRail && (
            <aside className="relative z-10 cv-desktop-navigation hidden shrink-0 pt-4 xl:flex xl:w-[275px]">
              {!hideImmersiveRailContent && (
              <nav aria-label={t('app.sidebar.primary', { defaultValue: 'Discover' })} className="flex h-[calc(100vh-6rem)] w-full flex-col overflow-hidden pb-6 pr-3">
                <div className="cv-nav-grid min-h-0 flex-1 overflow-y-auto no-scrollbar">
                  {sidebarNavItems.map((item) => {
                                        const isActive = activeScreen === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => navigate(item.path || '/')}
                        title={item.label}
                        aria-current={isActive ? 'page' : undefined}
                        className={`cv-nav-tile ${
                          isActive
                            ? 'bg-[var(--cv-surface-3)] font-bold text-[var(--color-brand)]'
                            : 'cv-row-interactive font-medium'
                        } ${!isActive && (theme === 'dark' ? 'text-zinc-100' : 'text-slate-900')}`}
                      >
                        <IllustratedIcon name={`nav-${item.id}`} className="cv-nav-art" />
                        <span className="cv-nav-label">{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="shrink-0 pt-2">
                <button
                  type="button"
                  onClick={openComposer}
                  className="sky-gradient flex h-12 w-full items-center justify-center gap-2 rounded-[12px] font-black text-white shadow-lg shadow-brand/30 transition-transform hover:scale-[1.02] active:scale-95 [outline:none]"
                >
                  <Plus className="h-5 w-5" />
                  <span>{t('post.create', { defaultValue: 'Gönder' })}</span>
                </button>

                {/* Profile cell — pinned at the very bottom of the rail */}
                <div className="relative mt-3">
                  <AnimatePresence>
                    {isRailProfileMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40 cursor-default"
                          onClick={() => setIsRailProfileMenuOpen(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.98 }}
                          transition={{ duration: 0.16 }}
                          className={`absolute bottom-full left-0 z-50 mb-2 w-[260px] overflow-hidden rounded-2xl border py-2 ${theme === 'dark'
                            ? 'border-white/10 bg-zinc-900 shadow-2xl shadow-black/50'
                            : 'border-slate-200 bg-white shadow-xl shadow-slate-950/10'
                            }`}
                        >
                          <button
                            type="button"
                            onClick={() => { setIsRailProfileMenuOpen(false); openProfile(); }}
                            className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold ${theme === 'dark' ? 'text-white hover:bg-[var(--cv-list-hover)]' : 'text-slate-900 hover:bg-[var(--cv-list-hover)]'}`}
                          >
                            <User className="h-4 w-4 shrink-0" />
                            <span className="truncate">{t('app.view_profile', { defaultValue: 'Profile' })}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => { setIsRailProfileMenuOpen(false); navigate('/settings'); }}
                            className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold ${theme === 'dark' ? 'text-white hover:bg-[var(--cv-list-hover)]' : 'text-slate-900 hover:bg-[var(--cv-list-hover)]'}`}
                          >
                            <SettingsIcon className="h-4 w-4 shrink-0" />
                            <span className="truncate">{t('app.nav.settings', { defaultValue: 'Settings' })}</span>
                          </button>
                          <div className={`mx-4 my-1 h-px ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'}`} />
                          <button
                            type="button"
                            onClick={() => requestLogout(() => setIsRailProfileMenuOpen(false))}
                            className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold ${theme === 'dark' ? 'text-red-400 hover:bg-[var(--cv-list-hover)]' : 'text-red-600 hover:bg-[var(--cv-list-hover)]'}`}
                          >
                            <LogOut className="h-4 w-4 shrink-0" />
                            <span className="truncate">{t('app.logout', { defaultValue: 'Log out' })}</span>
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                  <button
                    type="button"
                    onClick={() => setIsRailProfileMenuOpen((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={isRailProfileMenuOpen}
                    title={displayName}
                    className="cv-row-interactive flex w-full items-center gap-3 rounded-[12px] p-3 text-left [outline:none]"
                  >
                    {avatarIconSrc ? (
                      <img src={avatarIconSrc} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                    ) : (
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${theme === 'dark' ? 'bg-white/10 text-zinc-300' : 'bg-slate-200 text-slate-500'}`}>
                        <User className="h-5 w-5" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-[15px] font-bold leading-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {displayName}
                      </span>
                      <span className={`block truncate text-sm leading-tight ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'}`}>
                        @{username}
                      </span>
                    </span>
                    <MoreHorizontal className={`h-5 w-5 shrink-0 ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'}`} />
                  </button>
                </div>
                </div>
              </nav>
              )}
            </aside>
          )}

          {/* Middle Section */}
          <main className={`${mainShellClassName} ${isPublicPage || isAuthGateRoute ? '' : 'cv-center-col'}`}>
            <ChunkErrorBoundary key={normalizedPath}>
              <Suspense fallback={<RouteLoader />}>
                <div className="cv-interface-screen" data-screen={normalizedPath}>{routeElement}</div>
              </Suspense>
            </ChunkErrorBoundary>
          </main>

          {/* Right Sidebar - Fixed */}
          {/* Hide right sidebar on messages and notifications routes for better UX */}
          {showRightRail && (
            <aside className="relative z-10 hidden w-[350px] shrink-0 pt-4 xl:block">
              {!hideImmersiveRailContent && (
              <div className="sticky top-0 flex flex-col h-full w-[350px] py-2 pl-3 overflow-hidden">
                {showSidebarInstallCard && (
                  <div className="mb-4">
                    <PwaInstallPrompt variant="card" />
                  </div>
                )}

                <div className="h-full overflow-y-auto no-scrollbar pr-1">
                  <form
                    className="mb-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const query = new FormData(event.currentTarget).get('q');
                      if (typeof query === 'string' && query.trim()) {
                        navigate(`/search?q=${encodeURIComponent(query.trim())}`);
                      } else {
                        navigate('/search');
                      }
                    }}
                  >
                    <label className="cv-search">
                      <Search className="h-[18px] w-[18px] shrink-0" />
                      <input
                        name="q"
                        type="text"
                        placeholder={t('app.search_placeholder', { defaultValue: 'Ara' })}
                      />
                    </label>
                  </form>
                  <TrendsPanel limit={10} onTrendSelect={handleTrendSelect} />
                </div>
              </div>
              )}
            </aside>
          )}

          {/* Persistent navigation contains destinations; creation stays in the toolbar. */}
          {showDock && <AppTabBar label={t('app.sidebar.primary', { defaultValue: 'Discover' })} items={[
            { id: 'pride', label: t('app.nav.home'), icon: Home, active: activeScreen === 'pride', onSelect: () => navigateByNavId('pride') },
            { id: 'nearby', label: t('app.nav.nearby'), icon: MapPin, active: activeScreen === 'nearby', onSelect: () => navigateByNavId('nearby') },
            { id: 'messages', label: t('app.nav.messages'), icon: MessageCircle, active: activeScreen === 'messages', onSelect: () => navigateByNavId('messages') },
            { id: 'profile', label: t('app.nav.profile'), icon: User, active: activeScreen === 'profile', onSelect: openProfile },
            { id: 'more', label: t('app.nav.more', { defaultValue: 'More' }), icon: MoreHorizontal, active: isMobileMenuOpen, onSelect: openNavigationMenu },
          ]} />}

          <Sheet isOpen={isMobileMenuOpen} onClose={closeMobileMenu} title={t('app.sidebar.primary', { defaultValue: 'Discover' })}>
            <GroupedSection>
              <ListRow title={displayName} description={`@${username}`} onClick={openProfile} icon={avatarIconSrc ? <img src={avatarIconSrc} alt="" className="h-8 w-8 rounded-full" /> : <User />} />
            </GroupedSection>
            <nav aria-label={t('app.sidebar.primary')}>
              <GroupedSection>
                {sidebarNavItems.map(item => <ListRow key={item.id} title={item.label} selected={activeScreen === item.id} icon={<IllustratedIcon name={`nav-${item.id}`} className="h-8 w-8" />} onClick={() => { navigateByNavId(item.id); closeMobileMenus(); }} />)}
              </GroupedSection>
            </nav>
            <GroupedSection>
              <ListRow title={theme === 'dark' ? t('app.light_mode') : t('app.dark_mode')} icon={theme === 'dark' ? <Sun /> : <Moon />} onClick={toggleTheme} />
              <ListRow title={t('app.language')} value={languageDisplay} icon={<Globe />} onClick={openLanguageSelector} />
              <ListRow title={t('app.logout')} destructive icon={<LogOut />} onClick={() => requestLogout(closeMobileMenus)} />
            </GroupedSection>
          </Sheet>
      </div>

      {/* Footer - Only show on home screen */}
      {activeScreen === 'xxhome' && <Footer />}

      {/* Auth Wizard */}
      <AuthWizard
        isOpen={isAuthWizardOpen}
        onClose={() => setIsAuthWizardOpen(false)}
      />

      {showInstallBanner && (
        <PwaInstallPrompt
          variant="floating"
          position="bottom-right"
          onDismiss={handleBannerDismiss}
          onInstalled={handleBannerDismiss}
        />
      )}

      {/* LanguageSelector */}
      <LanguageSelector isOpen={isLanguageSelectorOpen} onClose={() => setIsLanguageSelectorOpen(false)} />

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
