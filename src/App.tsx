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
const ProfileEngagementsScreen = lazy(() => import('./screens/ProfileEngagementsScreen'));
const SearchScreen = lazy(() => import('./screens/SearchScreen'));
const MessagesScreen = lazy(() => import('./screens/MessagesScreen'));
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
import { MapPin, Grid, List, Square, Map as MapIcon, Bubbles, Lock, RefreshCw, Heart, Star, Ghost, MessageCircle, User, UserSearch, Users, X, Sun, Moon, MoreHorizontal, Bell, ChevronRight, LogOut, HandFist, Briefcase, Navigation, Settings as SettingsIcon, Globe, Video, Search, Sparkles, Home, MessageSquare, Plus, Filter, Command, TrendingUp, ArrowLeft, MousePointerClick } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import LanguageSelector from './components/ui/LanguageSelector';
import { resolvePreferredLanguage } from './i18n';
import { useSEO } from '@/hooks/useSEO';
import { getRouteSeo } from '@/seo/routeSeo';
import { useTranslation } from 'react-i18next';
import { applicationName } from './appSettings';
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

const RIGHT_SIDEBAR_HIDDEN_PATHS_BASE = ['/messages', '/landing', '/classifieds', '/places', '/match', '/nearby', '/checkin', '/premium'];

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
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-600 text-white shadow-lg shadow-sky-600/25">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase leading-none tracking-[0.34em] text-slate-950 dark:text-white">
                  {DEFAULT_APP_NAME}
                </span>
                <span className="mt-0.5 text-[8px] font-bold uppercase tracking-normal text-sky-600">
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

const SkylineDockButton = ({
  icon: Icon,
  active = false,
  onClick,
  badge = false,
  ariaLabel,
}: {
  icon: LucideIcon
  active?: boolean
  onClick?: () => void
  badge?: boolean
  ariaLabel: string
}) => (
  <button
    onClick={onClick}
    aria-label={ariaLabel}
    title={ariaLabel}
    className={`elite-btn w-12 h-12 relative ${
      active
        ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
        : 'text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-800'
    }`}
  >
    <Icon className="w-5.5 h-5.5" />
    {badge && !active && (
      <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-rose-500 rounded-full glow-rose" />
    )}
  </button>
);

const normalizePath = (path: string) => {
  if (!path) return '/';
  if (path !== '/' && path.endsWith('/')) {
    return path.slice(0, -1);
  }
  return path;
};

type PlacesHeaderViewMode = 'grid' | 'map';

type PlacesHeaderControlsState = {
  viewMode: PlacesHeaderViewMode;
  selectedCategory: string;
  categories: string[];
  resultCount: number;
  isLoading: boolean;
};

type NearbyHeaderViewMode = 'bubble' | 'grid' | 'list' | 'card' | 'map';

type NearbyHeaderControlsState = {
  viewMode: NearbyHeaderViewMode;
  resultCount: number;
  isLoading: boolean;
  isPremiumRequired: boolean;
};

type CheckInHeaderViewMode = 'map' | 'list';

type CheckInHeaderControlsState = {
  viewMode: CheckInHeaderViewMode;
  resultCount: number;
  isLoading: boolean;
};

type MatchHeaderTab = 'match_now' | 'matches' | 'liked' | 'passed';

type MatchHeaderControlsState = {
  activeTab: MatchHeaderTab;
  resultCount: number;
  isLoading: boolean;
};

type ClassifiedsHeaderTab = 'hiring' | 'seeking';

type ClassifiedsHeaderControlsState = {
  activeTab: ClassifiedsHeaderTab;
  resultCount: number;
  isLoading: boolean;
  searchQuery: string;
};

function AppContent() {
  const [activeScreen, setActiveScreen] = useState('pride');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthWizardOpen, setIsAuthWizardOpen] = useState(false);
  const [isLanguageSelectorOpen, setIsLanguageSelectorOpen] = useState(false);
  const [bootSeen, setBootSeen] = useState(() => bootSplashSeen);
  const [splashMinDone, setSplashMinDone] = useState(() => bootSplashSeen);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showSkylineTrends, setShowSkylineTrends] = useState(true);
  const [shellRouteSearchValue, setShellRouteSearchValue] = useState('');
  const [placesHeaderControls, setPlacesHeaderControls] = useState<PlacesHeaderControlsState | null>(null);
  const [nearbyHeaderControls, setNearbyHeaderControls] = useState<NearbyHeaderControlsState | null>(null);
  const [checkInHeaderControls, setCheckInHeaderControls] = useState<CheckInHeaderControlsState | null>(null);
  const [matchHeaderControls, setMatchHeaderControls] = useState<MatchHeaderControlsState | null>(null);
  const [classifiedsHeaderControls, setClassifiedsHeaderControls] = useState<ClassifiedsHeaderControlsState | null>(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const rtlLangs = React.useMemo(() => new Set(['ar', 'he', 'fa', 'ur']), []);

  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, isAuthReady, logout } = useAuth();
  const { settings, showBottomBar, setShowBottomBar } = useSettings();
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
  const followingCount = (user as any)?.engagements?.counts?.following_count ?? 0;
  const followerCount = (user as any)?.engagements?.counts?.follower_count ?? 0;
  const avatarIconSrc = getSafeImageURLEx((user as any)?.public_id, (user as any)?.avatar, 'icon') || undefined;
  const rightSidebarHiddenPaths = React.useMemo(() => {
    const paths = [...RIGHT_SIDEBAR_HIDDEN_PATHS_BASE];
    if (liveEnabled) {
      paths.push('/live');
    }
    return new Set(paths);
  }, [liveEnabled]);
  const shouldShowRightSidebar = !Array.from(rightSidebarHiddenPaths).some(p => location.pathname === p || location.pathname.startsWith(p + '/'));
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
      if (liveEnabled) {
        import('./screens/LiveScreen');
      }
      import('./screens/MessagesScreen');
      import('./screens/NotificationsScreen');
      import('./screens/ProfileScreen');
    };

    let timeoutId: number | undefined;
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
      timeoutId = window.setTimeout(warmRoutes, 1800);
    }

    return () => {
      cancelled = true;
      if (typeof idleId === 'number' && 'cancelIdleCallback' in window) {
        (window as any).cancelIdleCallback(idleId);
      }
      if (typeof timeoutId === 'number') {
        window.clearTimeout(timeoutId);
      }
    };
  }, [liveEnabled, prefetch, profilePath]);

  const routeSeoPath = React.useMemo(
    () => (!liveEnabled && location.pathname === '/live' ? '/' : location.pathname),
    [liveEnabled, location.pathname]
  );
  const routeSeo = React.useMemo(() => getRouteSeo(routeSeoPath), [routeSeoPath]);
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
    if (typeof window === 'undefined') return;
    if (normalizedPath !== '/places') {
      setPlacesHeaderControls(null);
      return;
    }

    const handlePlacesControlsState = (event: Event) => {
      const detail = (event as CustomEvent<PlacesHeaderControlsState | null>).detail;
      setPlacesHeaderControls(detail ?? null);
    };

    window.addEventListener('cv:places-controls-state', handlePlacesControlsState);
    window.dispatchEvent(new Event('cv:places-controls-request'));

    return () => {
      window.removeEventListener('cv:places-controls-state', handlePlacesControlsState);
      setPlacesHeaderControls(null);
    };
  }, [normalizedPath]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (normalizedPath !== '/nearby') {
      setNearbyHeaderControls(null);
      return;
    }

    const handleNearbyControlsState = (event: Event) => {
      const detail = (event as CustomEvent<NearbyHeaderControlsState | null>).detail;
      setNearbyHeaderControls(detail ?? null);
    };

    window.addEventListener('cv:nearby-controls-state', handleNearbyControlsState);
    window.dispatchEvent(new Event('cv:nearby-controls-request'));

    return () => {
      window.removeEventListener('cv:nearby-controls-state', handleNearbyControlsState);
      setNearbyHeaderControls(null);
    };
  }, [normalizedPath]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (normalizedPath !== '/checkin') {
      setCheckInHeaderControls(null);
      return;
    }

    const handleCheckInControlsState = (event: Event) => {
      const detail = (event as CustomEvent<CheckInHeaderControlsState | null>).detail;
      setCheckInHeaderControls(detail ?? null);
    };

    window.addEventListener('cv:checkin-controls-state', handleCheckInControlsState);
    window.dispatchEvent(new Event('cv:checkin-controls-request'));

    return () => {
      window.removeEventListener('cv:checkin-controls-state', handleCheckInControlsState);
      setCheckInHeaderControls(null);
    };
  }, [normalizedPath]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (normalizedPath !== '/match') {
      setMatchHeaderControls(null);
      return;
    }

    const handleMatchControlsState = (event: Event) => {
      const detail = (event as CustomEvent<MatchHeaderControlsState | null>).detail;
      setMatchHeaderControls(detail ?? null);
    };

    window.addEventListener('cv:match-controls-state', handleMatchControlsState);
    window.dispatchEvent(new Event('cv:match-controls-request'));

    return () => {
      window.removeEventListener('cv:match-controls-state', handleMatchControlsState);
      setMatchHeaderControls(null);
    };
  }, [normalizedPath]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (normalizedPath !== '/classifieds') {
      setClassifiedsHeaderControls(null);
      return;
    }

    const handleClassifiedsControlsState = (event: Event) => {
      const detail = (event as CustomEvent<ClassifiedsHeaderControlsState | null>).detail;
      setClassifiedsHeaderControls(detail ?? null);
    };

    window.addEventListener('cv:classifieds-controls-state', handleClassifiedsControlsState);
    window.dispatchEvent(new Event('cv:classifieds-controls-request'));

    return () => {
      window.removeEventListener('cv:classifieds-controls-state', handleClassifiedsControlsState);
      setClassifiedsHeaderControls(null);
    };
  }, [normalizedPath]);

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
    if (path === '/landing') return <LandingPage />;
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
  }, [liveEnabled, normalizedPath, premiumMembershipEnabled]);

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
    const lang = (i18n?.language || 'en').toLowerCase();
    const baseLang = lang.split('-')[0] || lang;
    const dir = rtlLangs.has(baseLang) ? 'rtl' : 'ltr';
    const root = document.documentElement;
    if (root.getAttribute('lang') !== baseLang) {
      root.setAttribute('lang', baseLang);
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

  const mobileNavItems = React.useMemo(() => {
    const mobileOrder = ['pride', 'nearby', 'checkin', 'messages', 'match', 'places', 'classifieds', 'notifications', 'referrals', 'settings', 'profile'];
    return mobileOrder
      .map((id) => sidebarNavItems.find((item) => item.id === id))
      .filter(Boolean) as typeof sidebarNavItems;
  }, [sidebarNavItems]);

  const sidebarNavSections = React.useMemo(() => {
    const primaryOrder = ['live', 'pride', 'nearby', 'checkin', 'messages', 'match', 'places', 'classifieds'];
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

  const dispatchPlacesViewMode = React.useCallback((viewMode: PlacesHeaderViewMode) => {
    if (typeof window === 'undefined') {
      return;
    }
    window.dispatchEvent(new CustomEvent('cv:places-set-view-mode', { detail: { viewMode } }));
  }, []);

  const dispatchPlacesCategory = React.useCallback((category: string) => {
    if (typeof window === 'undefined') {
      return;
    }
    window.dispatchEvent(new CustomEvent('cv:places-set-category', { detail: { category } }));
  }, []);

  const dispatchNearbyViewMode = React.useCallback((viewMode: NearbyHeaderViewMode) => {
    if (typeof window === 'undefined') {
      return;
    }
    window.dispatchEvent(new CustomEvent('cv:nearby-set-view-mode', { detail: { viewMode } }));
  }, []);

  const dispatchCheckInViewMode = React.useCallback((viewMode: CheckInHeaderViewMode) => {
    if (typeof window === 'undefined') {
      return;
    }
    window.dispatchEvent(new CustomEvent('cv:checkin-set-view-mode', { detail: { viewMode } }));
  }, []);

  const dispatchMatchTab = React.useCallback((tab: MatchHeaderTab) => {
    if (typeof window === 'undefined') {
      return;
    }
    window.dispatchEvent(new CustomEvent('cv:match-set-tab', { detail: { tab } }));
  }, []);

  const dispatchClassifiedsTab = React.useCallback((tab: ClassifiedsHeaderTab) => {
    if (typeof window === 'undefined') {
      return;
    }
    window.dispatchEvent(new CustomEvent('cv:classifieds-set-tab', { detail: { tab } }));
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

  const shouldShowBootSplash = !bootSeen && (!isAuthReady || !splashMinDone);
  const isLandingRoute = normalizedPath === '/landing';
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
    if (isClassifiedDetailRoute) {
      return t('app.nav.classifieds', { defaultValue: 'Classifieds' });
    }
    if (isPlaceDetailRoute) {
      return t('app.nav.places', { defaultValue: 'Places' });
    }
    if (isCheckInDetailRoute) {
      return t('app.nav.checkin', { defaultValue: 'Check-In' });
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
      '/settings': t('settings.title', { defaultValue: 'Settings' }),
      '/search': t('app.nav.search', { defaultValue: 'Search' }),
      '/messages': t('app.nav.messages', { defaultValue: 'Chat' }),
      '/notifications': t('app.nav.notifications', { defaultValue: 'Notifications' }),
      '/nearby': t('app.nav.nearby', { defaultValue: 'Nearby' }),
      '/match': t('app.nav.match', { defaultValue: 'Match' }),
      '/places': t('app.nav.places', { defaultValue: 'Places' }),
      '/classifieds': t('app.nav.classifieds', { defaultValue: 'Classifieds' }),
      '/referrals': t('app.nav.referrals', { defaultValue: 'Referrals' }),
      '/checkin': t('app.nav.checkin', { defaultValue: 'Check-In' }),
      '/wallet': t('wallet.title', { defaultValue: 'Wallet' }),
      '/premium': t('premium.title', { defaultValue: 'Premium' }),
    };

    return routeTitles[normalizedPath] || null;
  }, [isCheckInDetailRoute, isClassifiedDetailRoute, isPlaceDetailRoute, normalizedPath, profileEngagementType, t]);
  const isContextBackRoute = isAuthenticated && (isPostDetailRoute || isCheckInDetailRoute || isClassifiedDetailRoute || isPlaceDetailRoute || Boolean(profileEngagementType) || Boolean(contextRouteTitle) || isProfileShellRoute);
  const shellBackTitle = isProfileEditRoute
    ? t('profile.edit_profile', { defaultValue: 'Edit Profile' })
    : contextRouteTitle
      ? contextRouteTitle
    : isProfileShellRoute
      ? t('profile.profile_tab', { defaultValue: 'Profile' })
    : t('post_details.title', { defaultValue: 'Post' });
  const shellBackLabel = t('post_details.back', { defaultValue: 'Back' });
  const handleShellBack = React.useCallback(() => {
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
  const showShellHud = !isLandingRoute && !isAuthGateRoute;
  const showRightRail = isAuthenticated && isHomePerformanceRoute && shouldShowRightSidebar && showSkylineTrends;
  const showDock = isAuthenticated && !isLandingRoute && showBottomBar;
  const showHomeMenuGuide = settings.showDockTips &&
    isAuthReady &&
    isAuthenticated &&
    isHomePerformanceRoute &&
    showDock &&
    !shouldShowBootSplash &&
    !isMobileMenuOpen;

  const openNavigationMenu = React.useCallback(() => {
    setIsMobileMenuOpen(true);
  }, []);

  const mainShellClassName = 'min-h-0 flex-1 min-w-0 overflow-hidden';
  const isShellSearchRoute = normalizedPath === '/classifieds' || normalizedPath === '/places';
  const shellRouteSearchEventName = normalizedPath === '/places'
    ? 'cv:places-search-query'
    : normalizedPath === '/classifieds'
      ? 'cv:classifieds-search-query'
      : normalizedPath === '/search'
        ? 'cv:search-query'
      : null;
  const shellRouteSearchPlaceholder = normalizedPath === '/places'
    ? t('places.search_placeholder', { defaultValue: 'Search places...' })
    : normalizedPath === '/classifieds'
      ? t('classifieds.search_placeholder_hiring', { defaultValue: 'Search listings...' })
      : t('search.placeholder', { defaultValue: 'Search people, posts, events or places...' });

  React.useEffect(() => {
    if (normalizedPath === '/search') {
      const params = new URLSearchParams(location.search || '');
      setShellRouteSearchValue(params.get('q') || params.get('query') || '');
      return;
    }
    setShellRouteSearchValue('');
  }, [location.search, normalizedPath]);

  const updateShellRouteSearch = React.useCallback((value: string) => {
    setShellRouteSearchValue(value);
    if (typeof window !== 'undefined' && shellRouteSearchEventName) {
      window.dispatchEvent(new CustomEvent(shellRouteSearchEventName, { detail: { query: value } }));
    }
  }, [shellRouteSearchEventName]);

  const showPlacesHeaderControls = normalizedPath === '/places';
  const showSearchHeaderControls = normalizedPath === '/search';
  const placesHeaderState: PlacesHeaderControlsState = placesHeaderControls ?? {
    viewMode: 'grid',
    selectedCategory: 'all',
    categories: ['all'],
    resultCount: 0,
    isLoading: true,
  };
  const placesHeaderCategories = placesHeaderState.categories.length > 0
    ? placesHeaderState.categories
    : ['all'];
  const showNearbyHeaderControls = normalizedPath === '/nearby';
  const nearbyHeaderState: NearbyHeaderControlsState = nearbyHeaderControls ?? {
    viewMode: 'grid',
    resultCount: 0,
    isLoading: true,
    isPremiumRequired: false,
  };
  const showCheckInHeaderControls = normalizedPath === '/checkin';
  const checkInHeaderState: CheckInHeaderControlsState = checkInHeaderControls ?? {
    viewMode: 'list',
    resultCount: 0,
    isLoading: true,
  };
  const showMatchHeaderControls = normalizedPath === '/match';
  const matchHeaderState: MatchHeaderControlsState = matchHeaderControls ?? {
    activeTab: 'match_now',
    resultCount: 0,
    isLoading: true,
  };
  const showClassifiedsHeaderControls = normalizedPath === '/classifieds';
  const classifiedsHeaderState: ClassifiedsHeaderControlsState = classifiedsHeaderControls ?? {
    activeTab: 'hiring',
    resultCount: 0,
    isLoading: true,
    searchQuery: '',
  };
  if (normalizedPath === '/splash') {
    return <SplashScreen autoDismiss={false} animate={true} />;
  }

  return (
    <div className={`w-screen h-screen select-none overflow-hidden text-slate-950 transition-colors duration-700 dark:text-white ${
      isHomePerformanceRoute ? 'cv-home-performance' : ''
    }`}>
      {shouldShowBootSplash && <SplashScreen autoDismiss={false} animate={true} />}
      {/* Skyline layout shell */}
      <div
        className={`max-h-[100dvh] w-full flex mx-auto max-w-[1440px] min-h-[100dvh] overflow-y-hidden overflow-x-hidden scrollbar-hide px-4 md:px-12 gap-0 xl:gap-12 ${
          shouldShowBootSplash ? 'pointer-events-none' : ''
        }`}
      >

          {/* Skyline HUD */}
          {showShellHud && (
            <header className="fixed top-8 inset-x-0 z-[600] pointer-events-none flex justify-center px-4 md:px-12">
              <div className="grid w-full max-w-[1440px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                <div className="flex items-center gap-3 elite-floating px-4 py-2 md:px-5 md:py-2.5 pointer-events-auto backdrop-blur-md justify-self-start">
                  {isContextBackRoute ? (
                    <>
                      <button
                        type="button"
                        className="w-9 h-9 bg-slate-950 dark:bg-white rounded-full flex items-center justify-center text-white dark:text-slate-950 shadow-lg cursor-pointer transition-transform hover:scale-105 active:scale-95"
                        onClick={handleShellBack}
                        aria-label={shellBackLabel}
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleShellBack}
                        className="flex flex-col text-left"
                      >
                        <span className="text-[11px] font-bold tracking-[0.28em] uppercase dark:text-white leading-none">
                          {shellBackTitle}
                        </span>
                        <span className="text-[8px] font-bold text-sky-600 uppercase tracking-tighter mt-0.5">
                          {shellBackLabel}
                        </span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="w-9 h-9 bg-sky-600 rounded-full flex items-center justify-center text-white shadow-lg animate-pulse-slow cursor-pointer"
                        onClick={() => navigateByNavId('pride')}
                        aria-label={t('app.nav.home', { defaultValue: 'Home' })}
                      >
                        <Sparkles className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => navigateByNavId('pride')}
                        className="flex flex-col text-left"
                      >
                        <span className="text-[11px] font-bold tracking-[0.4em] uppercase dark:text-white leading-none">
                          {DEFAULT_APP_NAME}
                        </span>
                        <span className="text-[8px] font-bold text-sky-600 uppercase tracking-tighter mt-0.5">
                          {DEFAULT_APP_MOTTO}
                        </span>
                      </button>
                    </>
                  )}
                </div>

                <div className="pointer-events-auto hidden min-w-0 justify-center lg:flex">
                  {showSearchHeaderControls && (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        const value = shellRouteSearchValue.trim();
                        navigate(value ? `/search?q=${encodeURIComponent(value)}` : '/search', { replace: true });
                      }}
                      className="elite-floating flex h-11 w-[360px] max-w-full items-center gap-2 px-3 backdrop-blur-md xl:w-[560px]"
                    >
                      <Search className="h-4 w-4 shrink-0 text-slate-400" />
                      <input
                        type="text"
                        value={shellRouteSearchValue}
                        onChange={(event) => updateShellRouteSearch(event.target.value)}
                        placeholder={shellRouteSearchPlaceholder}
                        aria-label={shellRouteSearchPlaceholder}
                        className="min-w-0 flex-1 bg-transparent text-[10px] font-bold uppercase tracking-widest text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
                      />
                      {shellRouteSearchValue && (
                        <button
                          type="button"
                          onClick={() => {
                            updateShellRouteSearch('');
                            navigate('/search', { replace: true });
                          }}
                          aria-label={t('search.clear', { defaultValue: 'Clear search' })}
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-white"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </form>
                  )}
                  {showNearbyHeaderControls && (
                    <div className="elite-floating flex h-11 w-[360px] max-w-full items-center gap-1.5 overflow-visible px-2 backdrop-blur-md">
                      <div className={`flex min-w-0 flex-1 items-center justify-center gap-0.5 overflow-visible rounded-full p-1 ${
                        theme === 'dark' ? 'bg-white/[0.04]' : 'bg-slate-100/90'
                      }`}>
                        {([
                          { id: 'bubble' as const, icon: Bubbles, label: t('nearby.view_bubble', { defaultValue: 'Bubble' }) },
                          { id: 'grid' as const, icon: Grid, label: t('nearby.view_grid', { defaultValue: 'Grid' }) },
                          { id: 'list' as const, icon: List, label: t('nearby.view_list', { defaultValue: 'List' }) },
                          { id: 'card' as const, icon: Square, label: t('nearby.view_card', { defaultValue: 'Card' }) },
                          { id: 'map' as const, icon: MapIcon, label: t('nearby.view_map', { defaultValue: 'Map' }) },
                        ]).map((mode) => {
                          const Icon = mode.icon;
                          const isActive = nearbyHeaderState.viewMode === mode.id;
                          return (
                            <motion.button
                              key={mode.id}
                              type="button"
                              onClick={() => dispatchNearbyViewMode(mode.id)}
                              disabled={!nearbyHeaderControls}
                              whileTap={{ scale: 0.96 }}
                              aria-labelledby={`nearby-header-tooltip-${mode.id}`}
                              className={`group relative flex h-8 w-10 shrink-0 items-center justify-center rounded-full text-[10px] font-black uppercase tracking-[0.12em] transition-colors disabled:cursor-default disabled:opacity-60 ${
                                isActive
                                  ? 'text-white'
                                  : theme === 'dark'
                                    ? 'text-zinc-500 hover:text-white'
                                    : 'text-slate-400 hover:text-slate-900'
                              }`}
                              aria-pressed={isActive}
                            >
                              {isActive && (
                                <motion.span
                                  layoutId="nearbyHeaderViewIndicator"
                                  className="absolute inset-0 rounded-full bg-sky-600 shadow-lg shadow-sky-600/30"
                                  transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                                />
                              )}
                              <span className="relative z-10 flex items-center gap-1.5">
                                <Icon className="h-3.5 w-3.5" />
                                {mode.id === 'bubble' && nearbyHeaderState.isPremiumRequired && <Lock className="h-3 w-3" />}
                              </span>
                              <span
                                id={`nearby-header-tooltip-${mode.id}`}
                                role="tooltip"
                                className={`pointer-events-none absolute left-1/2 top-full z-[700] mt-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-full px-2.5 py-1.5 text-[9px] font-bold normal-case tracking-normal opacity-0 shadow-xl transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 ${
                                  theme === 'dark'
                                    ? 'bg-white text-slate-950'
                                    : 'bg-slate-950 text-white'
                                }`}
                              >
                                {mode.label}
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>

                      <div className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[10px] font-black uppercase tracking-[0.12em] ${
                        theme === 'dark' ? 'bg-white/[0.04] text-zinc-400' : 'bg-white/80 text-slate-500 shadow-sm border border-slate-200/60'
                      }`}>
                        <Users className="h-3 w-3" />
                        <span>{nearbyHeaderState.resultCount}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => dispatchShellEvent('cv:nearby-refresh')}
                        disabled={nearbyHeaderState.isLoading}
                        aria-label={t('nearby.refresh', { defaultValue: 'Refresh nearby people' })}
                        title={t('nearby.refresh', { defaultValue: 'Refresh nearby people' })}
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all disabled:cursor-default disabled:opacity-60 ${
                          theme === 'dark'
                            ? 'bg-white/10 text-white hover:bg-white/20'
                            : 'bg-slate-950/90 text-white hover:bg-slate-800'
                        }`}
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${nearbyHeaderState.isLoading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  )}
                  {showCheckInHeaderControls && (
                    <div className="elite-floating flex h-11 w-[280px] max-w-full items-center gap-1.5 overflow-visible px-2 backdrop-blur-md">
                      <div className={`flex min-w-0 flex-1 items-center justify-center gap-0.5 overflow-visible rounded-full p-1 ${
                        theme === 'dark' ? 'bg-white/[0.04]' : 'bg-slate-100/90'
                      }`}>
                        {([
                          { id: 'map' as const, icon: MapIcon, label: t('nearby.view_map', { defaultValue: 'Map' }) },
                          { id: 'list' as const, icon: List, label: t('nearby.view_list', { defaultValue: 'List' }) },
                        ]).map((mode) => {
                          const Icon = mode.icon;
                          const isActive = checkInHeaderState.viewMode === mode.id;
                          return (
                            <motion.button
                              key={mode.id}
                              type="button"
                              onClick={() => dispatchCheckInViewMode(mode.id)}
                              disabled={!checkInHeaderControls}
                              whileTap={{ scale: 0.96 }}
                              aria-labelledby={`checkin-header-tooltip-${mode.id}`}
                              aria-pressed={isActive}
                              className={`group relative flex h-8 w-10 shrink-0 items-center justify-center rounded-full transition-colors disabled:cursor-default disabled:opacity-60 ${
                                isActive
                                  ? 'text-white'
                                  : theme === 'dark'
                                    ? 'text-zinc-500 hover:text-white'
                                    : 'text-slate-400 hover:text-slate-900'
                              }`}
                            >
                              {isActive && (
                                <motion.span
                                  layoutId="checkInHeaderViewIndicator"
                                  className="absolute inset-0 rounded-full bg-sky-600 shadow-lg shadow-sky-600/30"
                                  transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                                />
                              )}
                              <Icon className="relative z-10 h-3.5 w-3.5" />
                              <span
                                id={`checkin-header-tooltip-${mode.id}`}
                                role="tooltip"
                                className={`pointer-events-none absolute left-1/2 top-full z-[700] mt-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-full px-2.5 py-1.5 text-[9px] font-bold opacity-0 shadow-xl transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 ${
                                  theme === 'dark'
                                    ? 'bg-white text-slate-950'
                                    : 'bg-slate-950 text-white'
                                }`}
                              >
                                {mode.label}
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>

                      <div className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[10px] font-black uppercase tracking-[0.12em] ${
                        theme === 'dark' ? 'bg-white/[0.04] text-zinc-400' : 'bg-white/80 text-slate-500 shadow-sm border border-slate-200/60'
                      }`}>
                        <MapPin className="h-3 w-3" />
                        <span>{checkInHeaderState.resultCount}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => dispatchShellEvent('cv:checkin-open-create')}
                        disabled={!checkInHeaderControls}
                        aria-labelledby="checkin-header-tooltip-create"
                        className="group relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-600 text-white shadow-md shadow-sky-600/25 transition-transform hover:scale-105 active:scale-95 disabled:cursor-default disabled:opacity-60"
                      >
                        <MapPin className="h-3.5 w-3.5" />
                        <span
                          id="checkin-header-tooltip-create"
                          role="tooltip"
                          className={`pointer-events-none absolute left-1/2 top-full z-[700] mt-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-full px-2.5 py-1.5 text-[9px] font-bold opacity-0 shadow-xl transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 ${
                            theme === 'dark'
                              ? 'bg-white text-slate-950'
                              : 'bg-slate-950 text-white'
                          }`}
                        >
                          {t('app.nav.checkin', { defaultValue: 'Check-in' })}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => dispatchShellEvent('cv:checkin-refresh')}
                        disabled={checkInHeaderState.isLoading}
                        aria-labelledby="checkin-header-tooltip-refresh"
                        className={`group relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all disabled:cursor-default disabled:opacity-60 ${
                          theme === 'dark'
                            ? 'bg-white/10 text-white hover:bg-white/20'
                            : 'bg-slate-950/90 text-white hover:bg-slate-800'
                        }`}
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${checkInHeaderState.isLoading ? 'animate-spin' : ''}`} />
                        <span
                          id="checkin-header-tooltip-refresh"
                          role="tooltip"
                          className={`pointer-events-none absolute left-1/2 top-full z-[700] mt-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-full px-2.5 py-1.5 text-[9px] font-bold opacity-0 shadow-xl transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 ${
                            theme === 'dark'
                              ? 'bg-white text-slate-950'
                              : 'bg-slate-950 text-white'
                          }`}
                        >
                          {t('nearby.refresh', { defaultValue: 'Refresh' })}
                        </span>
                      </button>
                    </div>
                  )}
                  {showMatchHeaderControls && (
                    <div className="elite-floating flex h-11 w-[310px] max-w-full items-center gap-1.5 overflow-visible px-2 backdrop-blur-md">
                      <div className={`flex min-w-0 flex-1 items-center justify-center gap-0.5 overflow-visible rounded-full p-1 ${
                        theme === 'dark' ? 'bg-white/[0.04]' : 'bg-slate-100/90'
                      }`}>
                        {([
                          { id: 'match_now' as const, icon: Heart, label: t('match.match_now', { defaultValue: 'Match Now' }) },
                          { id: 'matches' as const, icon: Sparkles, label: t('match.my_matches', { defaultValue: 'Matches' }) },
                          { id: 'liked' as const, icon: Star, label: t('match.liked', { defaultValue: 'Liked' }) },
                          { id: 'passed' as const, icon: Ghost, label: t('match.passed', { defaultValue: 'Passed' }) },
                        ]).map((tab) => {
                          const Icon = tab.icon;
                          const isActive = matchHeaderState.activeTab === tab.id;
                          return (
                            <motion.button
                              key={tab.id}
                              type="button"
                              onClick={() => dispatchMatchTab(tab.id)}
                              disabled={!matchHeaderControls}
                              whileTap={{ scale: 0.96 }}
                              aria-labelledby={`match-header-tooltip-${tab.id}`}
                              aria-pressed={isActive}
                              className={`group relative flex h-8 w-10 shrink-0 items-center justify-center rounded-full transition-colors disabled:cursor-default disabled:opacity-60 ${
                                isActive
                                  ? 'text-white'
                                  : theme === 'dark'
                                    ? 'text-zinc-500 hover:text-white'
                                    : 'text-slate-400 hover:text-slate-900'
                              }`}
                            >
                              {isActive && (
                                <motion.span
                                  layoutId="matchHeaderTabIndicator"
                                  className="absolute inset-0 rounded-full bg-sky-600 shadow-lg shadow-sky-600/30"
                                  transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                                />
                              )}
                              <Icon
                                className="relative z-10 h-3.5 w-3.5"
                                fill={tab.id === 'match_now' || tab.id === 'liked' ? 'currentColor' : 'none'}
                              />
                              <span
                                id={`match-header-tooltip-${tab.id}`}
                                role="tooltip"
                                className={`pointer-events-none absolute left-1/2 top-full z-[700] mt-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-full px-2.5 py-1.5 text-[9px] font-bold opacity-0 shadow-xl transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 ${
                                  theme === 'dark'
                                    ? 'bg-white text-slate-950'
                                    : 'bg-slate-950 text-white'
                                }`}
                              >
                                {tab.label}
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>

                      <div className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[10px] font-black uppercase tracking-[0.12em] ${
                        theme === 'dark' ? 'bg-white/[0.04] text-zinc-400' : 'bg-white/80 text-slate-500 shadow-sm border border-slate-200/60'
                      }`}>
                        <Users className="h-3 w-3" />
                        <span>{matchHeaderState.resultCount}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => dispatchShellEvent('cv:match-refresh')}
                        disabled={matchHeaderState.isLoading}
                        aria-labelledby="match-header-tooltip-refresh"
                        className={`group relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all disabled:cursor-default disabled:opacity-60 ${
                          theme === 'dark'
                            ? 'bg-white/10 text-white hover:bg-white/20'
                            : 'bg-slate-950/90 text-white hover:bg-slate-800'
                        }`}
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${matchHeaderState.isLoading ? 'animate-spin' : ''}`} />
                        <span
                          id="match-header-tooltip-refresh"
                          role="tooltip"
                          className={`pointer-events-none absolute left-1/2 top-full z-[700] mt-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-full px-2.5 py-1.5 text-[9px] font-bold opacity-0 shadow-xl transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 ${
                            theme === 'dark'
                              ? 'bg-white text-slate-950'
                              : 'bg-slate-950 text-white'
                          }`}
                        >
                          {t('match.refresh', { defaultValue: 'Refresh' })}
                        </span>
                      </button>
                    </div>
                  )}
                  {showPlacesHeaderControls && (
                    <div className="elite-floating flex h-11 w-[360px] max-w-full items-center gap-1.5 overflow-hidden px-2 backdrop-blur-md xl:w-[560px]">
                      <div className={`relative flex shrink-0 items-center gap-0.5 rounded-full p-1 ${
                        theme === 'dark' ? 'bg-white/[0.04]' : 'bg-slate-100/90'
                      }`}>
                        {(['grid', 'map'] as const).map((mode) => {
                          const isActive = placesHeaderState.viewMode === mode;
                          const Icon = mode === 'grid' ? Grid : MapIcon;
                          const label = mode === 'grid'
                            ? t('nearby.view_grid', { defaultValue: 'Grid' })
                            : t('nearby.view_map', { defaultValue: 'Map' });
                          return (
                            <motion.button
                              key={mode}
                              type="button"
                              onClick={() => dispatchPlacesViewMode(mode)}
                              whileTap={{ scale: 0.96 }}
                              className={`relative flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-full px-2.5 text-[10px] font-black uppercase tracking-[0.12em] transition-colors xl:px-3 ${
                                isActive
                                  ? 'text-white'
                                  : theme === 'dark'
                                    ? 'text-zinc-500 hover:text-white'
                                    : 'text-slate-400 hover:text-slate-900'
                              }`}
                              title={label}
                              aria-pressed={isActive}
                            >
                              {isActive && (
                                <motion.span
                                  layoutId="placesHeaderViewIndicator"
                                  className="absolute inset-0 rounded-full bg-sky-600 shadow-lg shadow-sky-600/30"
                                  transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                                />
                              )}
                              <span className="relative z-10 flex items-center gap-1.5">
                                <Icon className="h-3.5 w-3.5" />
                                <span className="hidden xl:inline">{label}</span>
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>

                      <div className={`h-5 w-px shrink-0 ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200/80'}`} />

                      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto no-scrollbar">
                        {placesHeaderCategories.map((category) => {
                          const isAll = category === 'all';
                          const isSelected = placesHeaderState.selectedCategory === category;
                          const label = isAll
                            ? t('places.all_categories', { defaultValue: 'All' })
                            : `#${category}`;
                          return (
                            <motion.button
                              key={category}
                              type="button"
                              onClick={() => dispatchPlacesCategory(category)}
                              whileTap={{ scale: 0.95 }}
                              className={`relative flex h-8 max-w-[148px] shrink-0 items-center rounded-full px-3 text-[10px] font-black uppercase tracking-[0.12em] transition-colors ${
                                isSelected
                                  ? 'text-white'
                                  : theme === 'dark'
                                    ? 'text-zinc-500 hover:text-white'
                                    : 'text-slate-400 hover:text-slate-900'
                              }`}
                              title={label}
                              aria-pressed={isSelected}
                            >
                              {isSelected && (
                                <motion.span
                                  layoutId="placesHeaderCategoryIndicator"
                                  className="absolute inset-0 rounded-full bg-sky-600 shadow-md shadow-sky-600/30"
                                  transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                                />
                              )}
                              <span className="relative z-10 truncate">{label}</span>
                            </motion.button>
                          );
                        })}
                      </div>

                      <div className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[10px] font-black uppercase tracking-[0.12em] ${
                        theme === 'dark' ? 'bg-white/[0.04] text-zinc-400' : 'bg-white/80 text-slate-500 shadow-sm border border-slate-200/60'
                      }`}>
                        <MapPin className="h-3 w-3" />
                        <span>{placesHeaderState.resultCount}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => dispatchShellEvent('cv:places-refresh')}
                        disabled={placesHeaderState.isLoading}
                        aria-label={t('places.retry', { defaultValue: 'Refresh places' })}
                        title={t('places.retry', { defaultValue: 'Refresh places' })}
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all disabled:cursor-default disabled:opacity-60 ${
                          theme === 'dark'
                            ? 'bg-white/10 text-white hover:bg-white/20'
                            : 'bg-slate-950/90 text-white hover:bg-slate-800'
                        }`}
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${placesHeaderState.isLoading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  )}
                  {showClassifiedsHeaderControls && (
                    <div className="elite-floating flex h-11 w-[340px] max-w-full items-center gap-1.5 overflow-hidden px-2 backdrop-blur-md xl:w-[500px]">
                      <div className={`relative flex min-w-0 flex-1 items-center gap-0.5 rounded-full p-1 ${
                        theme === 'dark' ? 'bg-white/[0.04]' : 'bg-slate-100/90'
                      }`}>
                        {([
                          { id: 'hiring' as const, icon: Briefcase, label: t('classifieds.hire', { defaultValue: 'Hiring' }) },
                          { id: 'seeking' as const, icon: UserSearch, label: t('classifieds.jobs', { defaultValue: 'Looking for work' }) },
                        ]).map((tab) => {
                          const Icon = tab.icon;
                          const isActive = classifiedsHeaderState.activeTab === tab.id;
                          return (
                            <motion.button
                              key={tab.id}
                              type="button"
                              onClick={() => dispatchClassifiedsTab(tab.id)}
                              whileTap={{ scale: 0.96 }}
                              className={`relative flex h-8 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-2 text-[10px] font-black uppercase tracking-[0.12em] transition-colors ${
                                isActive
                                  ? 'text-white'
                                  : theme === 'dark'
                                    ? 'text-zinc-500 hover:text-white'
                                    : 'text-slate-400 hover:text-slate-900'
                              }`}
                              title={tab.label}
                              aria-pressed={isActive}
                            >
                              {isActive && (
                                <motion.span
                                  layoutId="classifiedsHeaderTabIndicator"
                                  className="absolute inset-0 rounded-full bg-sky-600 shadow-lg shadow-sky-600/30"
                                  transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                                />
                              )}
                              <span className="relative z-10 flex min-w-0 items-center gap-1.5">
                                <Icon className="h-3.5 w-3.5 shrink-0" />
                                <span className="hidden truncate xl:inline">{tab.label}</span>
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>

                      <div className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[10px] font-black uppercase tracking-[0.12em] ${
                        theme === 'dark' ? 'bg-white/[0.04] text-zinc-400' : 'bg-white/80 text-slate-500 shadow-sm border border-slate-200/60'
                      }`}>
                        <Briefcase className="h-3 w-3" />
                        <span>{classifiedsHeaderState.resultCount}</span>
                      </div>

                      {classifiedsHeaderState.searchQuery && (
                        <div className={`hidden h-8 min-w-0 max-w-[120px] items-center gap-1.5 rounded-full px-2.5 text-[10px] font-black uppercase tracking-[0.12em] xl:flex ${
                          theme === 'dark' ? 'bg-white/[0.04] text-zinc-400' : 'bg-white/80 text-slate-500 shadow-sm border border-slate-200/60'
                        }`}>
                          <Search className="h-3 w-3 shrink-0" />
                          <span className="truncate">{classifiedsHeaderState.searchQuery}</span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => dispatchShellEvent('cv:classifieds-refresh')}
                        disabled={classifiedsHeaderState.isLoading}
                        aria-label={t('classifieds.refresh', { defaultValue: 'Refresh listings' })}
                        title={t('classifieds.refresh', { defaultValue: 'Refresh listings' })}
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all disabled:cursor-default disabled:opacity-60 ${
                          theme === 'dark'
                            ? 'bg-white/10 text-white hover:bg-white/20'
                            : 'bg-slate-950/90 text-white hover:bg-slate-800'
                        }`}
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${classifiedsHeaderState.isLoading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 pointer-events-auto justify-self-end">
                  {isShellSearchRoute ? (
                    <>
                      <div
                        className="elite-floating flex h-11 w-32 items-center gap-2 px-3 text-slate-500 backdrop-blur-md sm:w-48 md:w-60"
                      >
                        <Search className="h-4 w-4 shrink-0 text-slate-400" />
                        <input
                          type="text"
                          value={shellRouteSearchValue}
                          onChange={(event) => updateShellRouteSearch(event.target.value)}
                          placeholder={shellRouteSearchPlaceholder}
                          className="min-w-0 flex-1 bg-transparent text-[10px] font-bold uppercase tracking-widest text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
                        />
                        {shellRouteSearchValue && (
                          <button
                            type="button"
                            onClick={() => updateShellRouteSearch('')}
                            aria-label={t('classifieds.clear_search', { defaultValue: 'Clear search' })}
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-white"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      {normalizedPath === '/classifieds' && (
                        <button
                          type="button"
                          onClick={() => dispatchShellEvent('cv:classifieds-open-create')}
                          aria-label={t('classifieds.new_job_listing', { defaultValue: 'New listing' })}
                          className="w-11 h-11 elite-floating sky-glow flex items-center justify-center !text-white transition-transform hover:scale-105 active:scale-95"
                        >
                          <Plus className="w-5 h-5 shrink-0 text-white" strokeWidth={2.6} />
                        </button>
                      )}
                    </>
                  ) : showSearchHeaderControls ? null : (
                    <button
                      type="button"
                      onClick={() => navigate('/search')}
                      aria-label={t('app.nav.search', { defaultValue: 'Search' })}
                    className={`hidden md:flex items-center elite-floating px-4 py-2 gap-3 transition-all cursor-pointer ${
                        activeScreen === 'search'
                          ? 'bg-sky-600 text-white'
                          : 'backdrop-blur-md'
                      }`}
                    >
                      <Search className={`w-3.5 h-3.5 ${activeScreen === 'search' ? 'text-white' : 'text-slate-400'}`} />
                      <input
                        type="text"
                        placeholder="Arama..."
                        readOnly
                        className={`bg-transparent border-none outline-none text-[10px] font-bold tracking-widest uppercase w-24 cursor-pointer ${
                          activeScreen === 'search'
                            ? 'text-white placeholder:text-sky-200'
                            : 'placeholder:text-slate-400 dark:text-white'
                        }`}
                      />
                    </button>
                  )}
                  {isHomePerformanceRoute && (
                    <button
                      type="button"
                      onClick={() => setShowSkylineTrends(prev => !prev)}
                      aria-label="Toggle trends"
                      className={`w-11 h-11 elite-floating flex items-center justify-center group relative transition-all ${
                        showSkylineTrends
                          ? 'text-sky-600 bg-sky-50 dark:bg-sky-900/10'
                          : 'backdrop-blur-md text-slate-400'
                      }`}
                    >
                      <TrendingUp className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      {showSkylineTrends && <div className="absolute top-3 right-3 w-2 h-2 bg-sky-600 rounded-full animate-pulse" />}
                    </button>
                  )}
                  {isAuthenticated ? (
                    <button
                      type="button"
                      className="w-11 h-11 rounded-full p-0.5 backdrop-blur-md elite-floating group cursor-pointer overflow-hidden"
                      onClick={openProfile}
                      aria-label={t('app.open_profile', { defaultValue: 'Open profile' })}
                    >
                      {avatarIconSrc ? (
                        <img src={avatarIconSrc} className="w-full h-full rounded-full object-cover transition-transform group-hover:scale-110" alt="me" />
                      ) : (
                        <div className={`flex h-full w-full items-center justify-center rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-100'}`}>
                          <User className="h-5 w-5 text-slate-500" />
                        </div>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAuthWizardOpen(true)}
                      aria-label={t('app.open_auth', { defaultValue: 'Open sign in' })}
                      className="w-11 h-11 rounded-full p-0.5 backdrop-blur-md elite-floating group cursor-pointer overflow-hidden flex items-center justify-center"
                    >
                      <User className="h-5 w-5 text-slate-500" />
                    </button>
                  )}
                </div>
              </div>
            </header>
          )}

          {/* Legacy sidebar content is kept for the slide-out navigation drawer. */}
          <aside className="hidden">
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
                  <div className={`relative rounded-2xl px-4 py-4 ${theme === 'dark'
                    ? 'bg-gray-900/30'
                    : 'bg-white'
                    }`}>
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <div className={`w-11 h-11 rounded-full overflow-hidden ring-2 ${theme === 'dark' ? 'ring-white/10' : 'ring-black/10'}`}>
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
                          aria-label={t('app.open_language_selector', { defaultValue: 'Open language selector' })}
                          className={`p-1.5 rounded-lg transition-all flex items-center gap-1 ${theme === 'dark' ? 'hover:bg-white/10 text-white/50 hover:text-white' : 'hover:bg-black/5 text-gray-500 hover:text-gray-800'}`}
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
                            aria-label={t('app.open_profile_menu', { defaultValue: 'Open profile menu' })}
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
                  <div className={`rounded-[24px] px-4 py-4 ${theme === 'dark'
                    ? 'bg-gray-900/30'
                    : 'bg-white'
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
                  <div className={`rounded-2xl p-2.5 space-y-3 ${theme === 'dark'
                    ? 'bg-gray-900/25'
                    : 'bg-white'
                    }`}>
                    {sidebarNavSections.map((section) => (
                      <div key={section.id}>
                        <p className={`px-2 pb-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {section.title}
                        </p>
                        <div className="grid grid-cols-2 gap-2 auto-rows-fr">
                          {section.items.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeScreen === item.id;
                            return (
                              <button
                                key={item.id}
                                onClick={() => navigate(item.path || '/')}
                                className={`group relative h-[84px] w-full rounded-xl px-2.5 py-2 transition-colors border flex flex-col items-center justify-center text-center ${theme === 'dark'
                                  ? 'border-gray-900 text-white bg-transparent hover:bg-gray-900/50'
                                  : 'border-gray-200/50 text-gray-900 bg-transparent hover:bg-gray-50'
                                  } ${isActive
                                    ? (theme === 'dark'
                                      ? 'bg-gray-900/50'
                                      : 'bg-gray-50')
                                  : ''
                                  }`}
                              >
                                <div className={`w-8 h-8 mb-2 rounded-full flex items-center justify-center border transition-all duration-300 ${isActive
                                  ? 'bg-black text-white'
                                  : 'bg-transparent'
                                  } ${theme === 'dark'
                                    ? 'border-white/10 text-white'
                                    : 'border-black/10 text-gray-900'
                                  }`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <p className="text-[0.9375rem] font-normal leading-snug tracking-normal">
                                  {item.label}
                                </p>
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
                    className={`rounded-xl px-3 py-2.5 text-left transition-all ${theme === 'dark'
                      ? 'bg-gray-900/35 hover:bg-gray-800/60 text-white'
                      : 'bg-white hover:bg-black/[0.03] text-gray-900'
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
                    className={`rounded-xl px-3 py-2.5 text-left transition-all ${theme === 'dark'
                      ? 'bg-gray-900/35 hover:bg-gray-800/60 text-white'
                      : 'bg-white hover:bg-black/[0.03] text-gray-900'
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


          {/* Middle Section */}
          <main className={mainShellClassName}>
            <ChunkErrorBoundary>
              <Suspense fallback={<RouteLoader />}>
                {routeElement}
              </Suspense>
            </ChunkErrorBoundary>
          </main>

          {/* Right Sidebar - Fixed */}
          {/* Hide right sidebar on messages and notifications routes for better UX */}
          {showRightRail && (
            <aside className="hidden w-[300px] shrink-0 pt-28 xl:block">
              <div className="sticky top-28 flex flex-col h-[calc(100vh-128px)] w-[300px] py-2 overflow-hidden">
                {showSidebarInstallCard && (
                  <div className="mb-4">
                    <PwaInstallPrompt variant="card" />
                  </div>
                )}

                <div className="h-full overflow-y-auto no-scrollbar pr-1">
                  <TrendsPanel limit={10} onTrendSelect={handleTrendSelect} />
                </div>
              </div>
            </aside>
          )}

          {/* Skyline Dock */}
          {showDock && (
            <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-2 p-2 elite-floating max-w-[calc(100vw-1rem)]">
              <div className="flex items-center gap-1">
                <SkylineDockButton
                  icon={Home}
                  ariaLabel={t('app.nav.home', { defaultValue: 'Feed' })}
                  active={activeScreen === 'pride'}
                  onClick={() => navigateByNavId('pride')}
                />
                <SkylineDockButton
                  icon={Search}
                  ariaLabel={t('app.nav.search', { defaultValue: 'Explore' })}
                  active={activeScreen === 'search'}
                  onClick={() => navigate('/search')}
                />
              </div>

              <div className="mx-2 flex items-center justify-center">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={openComposer}
                  aria-label={t('post.create', { defaultValue: 'Create post' })}
                  className="w-14 h-14 rounded-full sky-gradient flex items-center justify-center text-white shadow-2xl shadow-sky-600/50 cursor-pointer border-4 border-white dark:border-zinc-900"
                >
                  <Plus className="w-8 h-8" />
                </motion.button>
              </div>

              <div className="flex items-center gap-1">
                <SkylineDockButton
                  icon={MessageSquare}
                  ariaLabel={t('app.nav.messages', { defaultValue: 'Inbox' })}
                  active={activeScreen === 'messages'}
                  onClick={() => navigateByNavId('messages')}
                  badge
                />
                <button
                  type="button"
                  onClick={openProfile}
                  aria-label={t('app.open_profile', { defaultValue: 'Open profile' })}
                  className={`w-12 h-12 rounded-2xl overflow-hidden transition-all relative ${
                    activeScreen === 'profile'
                      ? 'ring-2 ring-sky-600 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 scale-100'
                      : 'opacity-50 grayscale hover:opacity-100 hover:grayscale-0 scale-90'
                  }`}
                >
                  {avatarIconSrc ? (
                    <img src={avatarIconSrc} className="w-full h-full object-cover" alt="p" />
                  ) : (
                    <div className={`flex h-full w-full items-center justify-center ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-100'}`}>
                      <User className="h-5 w-5 text-slate-500" />
                    </div>
                  )}
                </button>
                <div className="w-[1px] h-6 bg-slate-200 dark:bg-zinc-800 mx-1" />
                <SkylineDockButton
                  icon={SettingsIcon}
                  ariaLabel={t('app.nav.settings', { defaultValue: 'Settings' })}
                  active={activeScreen === 'settings'}
                  onClick={() => navigateByNavId('settings')}
                />
              </div>
            </nav>
          )}

          {showDock && (
            <div className={`fixed bottom-[calc(env(safe-area-inset-bottom)+7.5rem)] left-4 flex-col gap-4 md:bottom-10 md:left-10 ${isHomePerformanceRoute ? 'flex' : 'hidden md:flex'} ${showHomeMenuGuide ? 'z-[720]' : 'z-[300]'}`}>
              <button
                type="button"
                onClick={() => setShowSkylineTrends(prev => !prev)}
                aria-label="Toggle trends"
                className="hidden w-12 h-12 elite-floating md:flex items-center justify-center text-slate-400 hover:text-sky-600 cursor-pointer"
              >
                <Filter className="w-5.5 h-5.5" />
              </button>
              <div className="relative">
                <AnimatePresence>
                  {showHomeMenuGuide && (
                    <motion.div
                      role="status"
                      aria-live="polite"
                      aria-labelledby="home-menu-guide-title"
                      aria-describedby="home-menu-guide-description"
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute bottom-[calc(100%+1.25rem)] left-0 w-[min(18rem,calc(100vw-2rem))] rounded-3xl border border-sky-200 bg-white p-5 text-slate-950 shadow-[0_24px_80px_rgba(2,132,199,0.28)] dark:border-sky-500/30 dark:bg-zinc-950 dark:text-white md:bottom-0 md:left-[calc(100%+4.5rem)] md:w-80"
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-600 dark:text-sky-400">
                        {t('app.home_guide_badge', { defaultValue: 'Quick start' })}
                      </p>
                      <div className="mt-3 flex items-center gap-3">
                        <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-lg shadow-sky-600/30">
                          <Command className="h-6 w-6" aria-hidden="true" />
                        </span>
                        <h2 id="home-menu-guide-title" className="text-lg font-black leading-tight tracking-tight">
                          {t('app.home_guide_title', { defaultValue: 'Start from the menu' })}
                        </h2>
                      </div>
                      <p id="home-menu-guide-description" className="mt-2 text-sm font-medium leading-6 text-slate-600 dark:text-zinc-300">
                        {t('app.home_guide_description', { defaultValue: 'Press the menu button in the lower-left corner to discover CoolVibes.' })}
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate('/settings')}
                        className="mt-4 rounded-full bg-slate-950 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white transition-transform hover:scale-105 active:scale-95 dark:bg-white dark:text-slate-950"
                      >
                        {t('app.home_guide_manage', { defaultValue: 'Manage in Settings' })}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
                {showHomeMenuGuide && (
                  <motion.span
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-5 -top-5 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-sky-600 text-white shadow-[0_10px_30px_rgba(2,132,199,0.5)]"
                    animate={{ x: [4, -2, 4], y: [-4, 2, -4], rotate: [-10, 2, -10], scale: [1, 1.12, 1] }}
                    transition={{ duration: 1.15, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <MousePointerClick className="h-6 w-6" />
                  </motion.span>
                )}
                <button
                  type="button"
                  onClick={openNavigationMenu}
                  aria-label={t('app.open_navigation_menu', { defaultValue: 'Open navigation menu' })}
                  aria-describedby={showHomeMenuGuide ? 'home-menu-guide-description' : undefined}
                  className={`relative w-12 h-12 elite-floating flex items-center justify-center text-slate-400 hover:text-sky-600 cursor-pointer ${showHomeMenuGuide ? 'ring-4 ring-sky-400/50 shadow-[0_0_0_10px_rgba(56,189,248,0.14)] animate-pulse motion-reduce:animate-none' : ''}`}
                >
                  <Command className="w-5.5 h-5.5" />
                </button>
              </div>
            </div>
          )}

          {/* Skyline Navigation Modal */}
          <AnimatePresence
            mode="wait"
            onExitComplete={() => {
              document.body.style.overflow = '';
            }}
          >
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="fixed inset-0 z-[800] bg-slate-50/60 dark:bg-black/60 backdrop-blur-2xl flex items-center justify-center p-4 md:p-12"
                onClick={closeMobileMenu}
                onAnimationStart={() => {
                  if (isMobileMenuOpen) {
                    document.body.style.overflow = 'hidden';
                  }
                }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 24 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 24 }}
                  transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                  className="max-w-4xl w-full h-[80vh] relative elite-bubble flex flex-col p-5 md:p-8 border-none shadow-[0_32px_128px_rgba(0,0,0,0.12)] dark:shadow-[0_32px_128px_rgba(0,0,0,0.4)]"
                  onClick={(event) => event.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={closeMobileMenu}
                    aria-label={t('app.close_navigation_menu', { defaultValue: 'Close navigation menu' })}
                    className="absolute top-6 right-6 w-9 h-9 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-500 hover:text-sky-600 transition-all border border-slate-200/50 dark:border-white/5 z-20"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>

                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="mb-6 pr-12"
                  >
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                      <div>
                        <p className="text-sky-600 font-bold text-[10px] uppercase tracking-[0.2em] mb-1">
                          {DEFAULT_APP_NAME}
                        </p>
                        <h3 className="text-xl md:text-2xl font-medium text-slate-900 dark:text-white tracking-tight">
                          {t('app.sidebar.primary', { defaultValue: 'Discover' })}
                        </h3>
                      </div>

                      <button
                        type="button"
                        onClick={openProfile}
                        className="relative flex w-full items-center gap-3 rounded-full bg-slate-100/50 dark:bg-zinc-900/50 border border-slate-200/30 dark:border-white/5 px-3 py-2 text-left transition-all hover:bg-white dark:hover:bg-zinc-900 md:w-[320px]"
                      >
                        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/60 dark:border-white/10">
                          {avatarIconSrc ? (
                            <img src={avatarIconSrc} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-sky-100 text-sky-600 dark:bg-sky-900/30">
                              <User className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-bold text-slate-900 dark:text-white">
                            {displayName}
                          </p>
                          <p className="truncate text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            @{username}
                          </p>
                        </div>
                      </button>
                    </div>
                    <div className="h-[1px] w-full bg-slate-100 dark:bg-zinc-900/30" />
                  </motion.div>

                  <div className="flex-1 overflow-y-auto no-scrollbar">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5">
                      {mobileNavItems.map((item, index) => {
                        const Icon = item.icon;
                        const isActive = activeScreen === item.id;
                        return (
                          <motion.button
                            key={item.id}
                            type="button"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.01 }}
                            whileHover={isActive ? { scale: 0.98 } : { y: -1, backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)' }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => {
                              navigateByNavId(item.id);
                              closeMobileMenus();
                            }}
                            className={`group flex items-center justify-between px-3.5 py-3 rounded-lg border transition-all text-left cursor-pointer ${
                              isActive
                                ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white shadow-md'
                                : 'bg-slate-50/50 dark:bg-zinc-900/10 border-transparent hover:border-slate-200 dark:hover:border-white/10'
                            }`}
                          >
                            <span className="flex min-w-0 items-center gap-3">
                              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                isActive
                                  ? 'bg-white/10 text-white dark:bg-slate-900/10 dark:text-slate-900'
                                  : 'cv-card-surface-muted bg-white text-slate-400 group-hover:text-sky-600'
                              }`}>
                                <Icon className="h-4 w-4" />
                              </span>
                              <span className={`truncate text-[13px] font-medium transition-colors ${
                                isActive
                                  ? 'text-white dark:text-slate-900'
                                  : 'text-slate-600 dark:text-zinc-400 group-hover:text-slate-900 dark:group-hover:text-white'
                              }`}>
                                {item.label}
                              </span>
                            </span>
                            <ChevronRight className={`w-3 h-3 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                              isActive
                                ? 'text-white/50 dark:text-slate-400'
                                : 'text-slate-300 dark:text-zinc-700'
                            }`} />
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-5 grid shrink-0 grid-cols-1 gap-2 border-t border-slate-100 pt-4 dark:border-zinc-900/60 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={toggleTheme}
                      className="flex items-center justify-between rounded-lg bg-slate-50/50 px-3.5 py-3 text-left transition-all hover:bg-slate-100 dark:bg-zinc-900/10 dark:hover:bg-white/5"
                    >
                      <span className="flex items-center gap-3 text-[13px] font-medium text-slate-600 dark:text-zinc-400">
                        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        {theme === 'dark' ? t('app.light_mode') : t('app.dark_mode')}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={openLanguageSelector}
                      className="flex items-center justify-between rounded-lg bg-slate-50/50 px-3.5 py-3 text-left transition-all hover:bg-slate-100 dark:bg-zinc-900/10 dark:hover:bg-white/5"
                    >
                      <span className="flex items-center gap-3 text-[13px] font-medium text-slate-600 dark:text-zinc-400">
                        <Globe className="h-4 w-4" />
                        {languageDisplay}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => requestLogout(closeMobileMenus)}
                      className="flex items-center justify-between rounded-lg bg-slate-50/50 px-3.5 py-3 text-left transition-all hover:bg-red-50 dark:bg-zinc-900/10 dark:hover:bg-red-500/10"
                    >
                      <span className="flex items-center gap-3 text-[13px] font-medium text-red-600 dark:text-red-400">
                        <LogOut className="h-4 w-4" />
                        {t('app.logout')}
                      </span>
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
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
