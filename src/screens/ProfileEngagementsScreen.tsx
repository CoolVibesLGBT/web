import AnimatedEmptyState from '@/components/ui/AnimatedEmptyState';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from '@/router';
import { RefreshCw, Users, UserPlus, Lock, ShieldBan, UserX, Heart, ThumbsDown, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { useTranslation } from 'react-i18next';
import Container from '../components/ui/Container';
import { NavigationBar, ListRow } from '@/components/ui/Interface';
import './profile-engagements.css';
import { api } from '../services/api';
import { getSafeImageURLEx, htmlToPlainText } from '../helpers/helpers';
import AuthWizard from '../features/auth/AuthWizard';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import { PremiumGateInline } from '@/components/premium/PremiumGate';

type EngagementType =
  | 'followers'
  | 'followings'
  | 'blocking'
  | 'blocked_by'
  | 'like_given'
  | 'like_received'
  | 'dislike_given'
  | 'dislike_received'
  | 'matched'
  | 'view_received';

interface EngagementUser {
  id: string;
  username: string;
  displayname: string;
  avatar?: any;
  bio?: string;
  is_following?: boolean;
}

interface ProfileSummary {
  id?: string;
  public_id?: number;
  username: string;
  displayname?: string;
  avatar?: any;
}

const isEngagementType = (value: string): value is EngagementType => {
  return value === 'followers' ||
    value === 'followings' ||
    value === 'blocking' ||
    value === 'blocked_by' ||
    value === 'like_given' ||
    value === 'like_received' ||
    value === 'dislike_given' ||
    value === 'dislike_received' ||
    value === 'matched' ||
    value === 'view_received';
};

const normalizeEngagementType = (value: string): EngagementType | null => {
  const lower = value.toLowerCase();
  if (isEngagementType(lower)) return lower;
  if (lower === 'follower') return 'followers';
  if (lower === 'following') return 'followings';
  if (lower === 'match' || lower === 'matches') return 'matched';
  if (lower === 'view' || lower === 'views' || lower === 'profile_view' || lower === 'profile_views') {
    return 'view_received';
  }
  return null;
};

const isPremiumOnlyEngagementType = (type: EngagementType) =>
  type !== 'followers' && type !== 'followings';

const engagementTypeAliases: Record<EngagementType, string[]> = {
  followers: ['follower', 'followers'],
  followings: ['following', 'followings'],
  blocking: ['blocking', 'block'],
  blocked_by: ['blocked_by', 'blockedby', 'blocker'],
  like_given: ['like_given', 'like', 'liked'],
  like_received: ['like_received', 'liked_by', 'liked'],
  dislike_given: ['dislike_given', 'dislike', 'disliked'],
  dislike_received: ['dislike_received', 'disliked_by', 'dislike', 'disliked', 'dislike_recieved'],
  matched: ['matched', 'matches', 'match'],
  view_received: ['view_received', 'view', 'profile_view', 'profile_views'],
};

const isInvalidEngagementKind = (err: any) => {
  const message =
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    '';
  return /invalid\s+engag(?:e)?ment(?:\s+kind|_?kind|_?type)?|unsupported\s+engag(?:e)?ment/i.test(String(message));
};

const ProfileEngagementsScreen: React.FC = () => {
  const { username = '', engagementType = '' } = useParams<{
    username: string;
    engagementType: string;
  }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { isAuthenticated, user: authUser } = useAuth();
  const { defaultLanguage } = useApp();
  const { t } = useTranslation('common');
  const { premiumFeatureEnabled, isPremiumUser } = usePremiumAccess();
  const [showAuthWizard, setShowAuthWizard] = useState(false);
  const fallbackSegments = useMemo(
    () => (location.pathname || '').split('/').filter(Boolean),
    [location.pathname]
  );
  const fallbackUsername = fallbackSegments[0] || '';
  const fallbackEngagementType = fallbackSegments[1] || '';
  const rawEngagementType = engagementType || fallbackEngagementType;
  const resolvedType = useMemo(
    () => normalizeEngagementType(rawEngagementType || ''),
    [rawEngagementType]
  );
  const effectiveUsername = username || fallbackUsername;

  const navigationState = location.state as
    | { profileSummary?: ProfileSummary; returnTo?: string }
    | undefined;

  const [profile, setProfile] = useState<ProfileSummary | null>(
    navigationState?.profileSummary ?? null
  );
  const [loadingProfile, setLoadingProfile] = useState<boolean>(
    !navigationState?.profileSummary
  );
  const [engagements, setEngagements] = useState<EngagementUser[]>([]);
  const [loadingEngagements, setLoadingEngagements] = useState<boolean>(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const observerTarget = React.useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  const isOwnProfile = useMemo(() => {
    if (!authUser) return false;
    if (profile?.username && authUser.username === profile.username) return true;
    if (profile?.id && authUser.id === profile.id) return true;
    if (profile?.public_id && String((authUser as any).public_id) === String(profile.public_id)) return true;
    if (effectiveUsername && authUser.username === effectiveUsername) return true;
    return false;
  }, [authUser, profile?.username, profile?.id, profile?.public_id, effectiveUsername]);

  const isPremiumGateActive = useMemo(
    () =>
      Boolean(
        isAuthenticated &&
          resolvedType &&
          premiumFeatureEnabled &&
          !isPremiumUser &&
          isPremiumOnlyEngagementType(resolvedType)
      ),
    [isAuthenticated, isPremiumUser, premiumFeatureEnabled, resolvedType]
  );

  useEffect(() => {
    if (!rawEngagementType) {
      return;
    }
    if (!resolvedType) {
      navigate(effectiveUsername ? `/${effectiveUsername}` : '/', { replace: true });
    }
  }, [resolvedType, rawEngagementType, navigate, effectiveUsername]);

  const fetchProfile = useCallback(async () => {
    if (!effectiveUsername) {
      setLoadingProfile(false);
      return;
    }

    setLoadingProfile(true);
    try {
      const response = (await api.fetchProfileByNickname(effectiveUsername)) as any;

      const userData = (response?.user || response) ?? null;

      if (!userData) {
        throw new Error('Profile not found');
      }

      setProfile({
        id: userData.id,
        public_id: userData.public_id,
        username: userData.username ?? effectiveUsername,
        displayname: userData.displayname ?? userData.username ?? effectiveUsername,
        avatar: userData.avatar ?? null,
      });
    } catch (err: any) {
      console.error('Failed to load profile summary', err);
      setProfile({
        username: effectiveUsername,
        displayname: effectiveUsername,
      });
      setError(
        err?.response?.data?.message ||
        err.message ||
        t('profile.user_not_found')
      );
    } finally {
      setLoadingProfile(false);
    }
  }, [effectiveUsername, t]);

  const loadEngagements = useCallback(
    async (type: EngagementType, nextCursor?: string, append?: boolean) => {
      setLoadingEngagements(true);
      setError(null);

      try {
        const body: Record<string, unknown> = {
          engagement_type: type,
        };

        if (profile?.public_id) {
          body.user_id = profile.public_id;
        } else {
          body.nickname = effectiveUsername;
        }

        if (nextCursor) {
          body.cursor = nextCursor;
        }

        const aliases = engagementTypeAliases[type] ?? [type];
        let response: any;
        let lastError: any;

        for (const engagementType of aliases) {
          try {
            const nextResponse = (await api.fetchEngagements({
              ...body,
              engagement_type: engagementType,
            })) as any;
            const responseMessage =
              (typeof nextResponse?.message === 'string' ? nextResponse.message : '') ||
              (typeof nextResponse?.error === 'string' ? nextResponse.error : '');
            const invalidMessage =
              responseMessage &&
              /invalid\s+engag(?:e)?ment(?:\s+kind|_?kind|_?type)?|unsupported\s+engag(?:e)?ment/i.test(
                responseMessage
              );
            if (nextResponse?.success === false && invalidMessage) {
              throw new Error(responseMessage);
            }
            response = nextResponse;
            break;
          } catch (err) {
            lastError = err;
            if (!isInvalidEngagementKind(err)) {
              throw err;
            }
          }
        }

        if (!response && lastError) {
          throw lastError;
        }

        // API returns engagements array, not users array
        const engagementsArray = Array.isArray(response?.engagements)
          ? response.engagements
          : [];

        const profileIdentifiers = new Set<string>();
        if (profile?.id) profileIdentifiers.add(String(profile.id));
        if (profile?.public_id) profileIdentifiers.add(String(profile.public_id));
        if (profile?.username) profileIdentifiers.add(profile.username);
        if (effectiveUsername) profileIdentifiers.add(effectiveUsername);

        const isProfileUser = (userData: any) => {
          if (!userData) return false;
          const candidates = [
            userData.id,
            userData.public_id,
            userData.username,
          ]
            .filter(Boolean)
            .map((value) => String(value));
          return candidates.some((value) => profileIdentifiers.has(value));
        };

        const resolveEngagementUser = (engagement: any) => {
          const engager = engagement?.engager ?? engagement?.initiator ?? null;
          const engagee = engagement?.engagee ?? engagement?.recipient ?? null;

          if (engager && engagee) {
            const engagerIsProfile = isProfileUser(engager);
            const engageeIsProfile = isProfileUser(engagee);
            if (engagerIsProfile !== engageeIsProfile) {
              return engagerIsProfile ? engagee : engager;
            }
          }

          const kind =
            typeof engagement?.kind === 'string' ? engagement.kind.toLowerCase() : '';

          if (kind === 'following') {
            return engagee ?? engager;
          }
          if (kind === 'follower') {
            return engager ?? engagee;
          }
          if (kind === 'blocking') {
            return engagee ?? engager;
          }
          if (kind === 'blocked_by') {
            return engager ?? engagee;
          }
          if (kind === 'like_given') {
            return engagee ?? engager;
          }
          if (kind === 'like_received') {
            return engager ?? engagee;
          }
          if (kind === 'dislike_given') {
            return engagee ?? engager;
          }
          if (kind === 'dislike_received') {
            return engager ?? engagee;
          }
          if (kind === 'matched') {
            return engagee ?? engager;
          }
          if (kind === 'view_received') {
            return engager ?? engagee;
          }

          if (type === 'followers') return engager ?? engagee;
          if (type === 'followings') return engagee ?? engager;
          if (type === 'blocking') return engagee ?? engager;
          if (type === 'blocked_by') return engager ?? engagee;
          if (type === 'like_given') return engagee ?? engager;
          if (type === 'like_received') return engager ?? engagee;
          if (type === 'dislike_given') return engagee ?? engager;
          if (type === 'dislike_received') return engager ?? engagee;
          if (type === 'matched') return engagee ?? engager;
          if (type === 'view_received') return engager ?? engagee;

          return engagee ?? engager;
        };

        const buildEngagementUser = (userData: any): EngagementUser | null => {
          if (!userData) {
            return null;
          }

          let bioText: string | undefined;
          if (userData.bio) {
            if (typeof userData.bio === 'string') {
              bioText = userData.bio;
            } else if (typeof userData.bio === 'object') {
              const userDefaultLang = userData.default_language || defaultLanguage || 'en';
              bioText =
                userData.bio[defaultLanguage] ||
                userData.bio[userDefaultLang] ||
                userData.bio.en ||
                Object.values(userData.bio)[0] ||
                undefined;
            }
          }

          return {
            id: userData.id || '',
            username: userData.username || '',
            displayname: userData.displayname || userData.username || '',
            avatar: userData.avatar || null,
            bio: bioText,
          };
        };

        if (!response && lastError) {
          if (isInvalidEngagementKind(lastError)) {
            if (isOwnProfile && (type === 'like_given' || type === 'dislike_given' || type === 'matched')) {
              const fallbackResponse =
                type === 'like_given'
                  ? await api.fetchLikedProfiles(20, nextCursor ?? null)
                  : type === 'dislike_given'
                    ? await api.fetchPassedProfiles(20, nextCursor ?? null)
                    : await api.fetchMatchedProfiles(20, nextCursor ?? null);

              const fallbackUsers = Array.isArray((fallbackResponse as any)?.users)
                ? (fallbackResponse as any).users
                : [];
              const mappedFallback = fallbackUsers
                .map((userData: any) => buildEngagementUser(userData))
                .filter((userData: EngagementUser | null): userData is EngagementUser => userData !== null);

              setEngagements((prev) => (append ? [...prev, ...mappedFallback] : mappedFallback));
              setCursor((fallbackResponse as any)?.cursor ?? null);
              return;
            }

            // Invalid kind but no supported fallback: show empty list without throwing
            setEngagements((prev) => (append ? prev : []));
            setCursor(null);
            return;
          }
          throw lastError;
        }

        // Transform engagements to EngagementUser array
        const users: EngagementUser[] = engagementsArray
          .map((engagement: any) => {
            const userData = resolveEngagementUser(engagement);

            return buildEngagementUser(userData);
          })
          .filter((user: EngagementUser | null): user is EngagementUser => user !== null);

        const responseCursor = response?.next_cursor ?? null;

        setEngagements((prev) =>
          append ? [...prev, ...users] : [...users]
        );
        setCursor(responseCursor);
      } catch (err) {
        console.error('Failed to load engagements', err);
        setEngagements((prev) => (append ? prev : []));
        setCursor(null);
        setError(
          (err as any)?.response?.data?.message ||
          (err as Error).message ||
          t('profile.failed_to_load_engagements', {
            defaultValue: 'Failed to load engagements',
          })
        );
      } finally {
        setLoadingEngagements(false);
      }
    },
    [profile?.public_id, t, effectiveUsername, defaultLanguage, isOwnProfile]
  );

  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && cursor && !loadingEngagements && resolvedType) {
          loadEngagements(resolvedType, cursor, true);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [cursor, loadingEngagements, loadEngagements, resolvedType]);

  useEffect(() => {
    if (!resolvedType) {
      return;
    }

    if (!profile) {
      void fetchProfile();
      return;
    }

    if (isPremiumGateActive) {
      setEngagements([]);
      setCursor(null);
      setError(null);
      return;
    }

    if (isAuthenticated) {
      void loadEngagements(resolvedType);
    } else {
      // Clear data if user is not authenticated
      setEngagements([]);
      setCursor(null);
    }
  }, [
    resolvedType,
    profile,
    fetchProfile,
    loadEngagements,
    isPremiumGateActive,
    isAuthenticated,
  ]);

  const handleRefresh = () => {
    if (!resolvedType || loadingEngagements) {
      return;
    }
    if (isPremiumGateActive) {
      navigate('/premium');
      return;
    }

    setCursor(null);
    void loadEngagements(resolvedType);
  };

  const engagementMeta = useMemo(() => {
    if (!resolvedType) return null;
    switch (resolvedType) {
      case 'followings':
        return {
          title: t('profile.following', { defaultValue: 'Following' }),
          badge: t('profile.following', { defaultValue: 'Following' }),
          emptyTitle: t('profile.no_followings_found', { defaultValue: 'No followings yet.' }),
          emptyDescription: t('profile.no_followings_description', {
            defaultValue: 'This user is not following anyone yet.',
          }),
          icon: UserPlus,
        };
      case 'followers':
        return {
          title: t('profile.followers', { defaultValue: 'Followers' }),
          badge: t('profile.followers', { defaultValue: 'Followers' }),
          emptyTitle: t('profile.no_followers_found', { defaultValue: 'No followers yet.' }),
          emptyDescription: t('profile.no_followers_description', {
            defaultValue: 'This user has no followers yet.',
          }),
          icon: Users,
        };
      case 'blocking':
        return {
          title: t('profile.blocking', { defaultValue: 'Blocking' }),
          badge: t('profile.blocking', { defaultValue: 'Blocking' }),
          emptyTitle: t('profile.no_blocking_found', { defaultValue: 'No blocked users yet.' }),
          emptyDescription: t('profile.no_blocking_description', {
            defaultValue: 'This user has not blocked anyone yet.',
          }),
          icon: ShieldBan,
        };
      case 'blocked_by':
        return {
          title: t('profile.blocked_by', { defaultValue: 'Blocked by' }),
          badge: t('profile.blocked_by', { defaultValue: 'Blocked by' }),
          emptyTitle: t('profile.no_blocked_by_found', { defaultValue: 'No blocks found.' }),
          emptyDescription: t('profile.no_blocked_by_description', {
            defaultValue: 'No users have blocked this account.',
          }),
          icon: UserX,
        };
      case 'like_given':
        return {
          title: t('profile.like_given', { defaultValue: 'Likes given' }),
          badge: t('profile.like_given', { defaultValue: 'Likes given' }),
          emptyTitle: t('profile.no_like_given_found', { defaultValue: 'No likes given yet.' }),
          emptyDescription: t('profile.no_like_given_description', {
            defaultValue: 'This user has not liked anyone yet.',
          }),
          icon: Heart,
        };
      case 'like_received':
        return {
          title: t('profile.like_received', { defaultValue: 'Likes received' }),
          badge: t('profile.like_received', { defaultValue: 'Likes received' }),
          emptyTitle: t('profile.no_like_received_found', { defaultValue: 'No likes received yet.' }),
          emptyDescription: t('profile.no_like_received_description', {
            defaultValue: 'This user has not received likes yet.',
          }),
          icon: Heart,
        };
      case 'dislike_given':
        return {
          title: t('profile.dislike_given', { defaultValue: 'Dislikes given' }),
          badge: t('profile.dislike_given', { defaultValue: 'Dislikes given' }),
          emptyTitle: t('profile.no_dislike_given_found', { defaultValue: 'No dislikes given yet.' }),
          emptyDescription: t('profile.no_dislike_given_description', {
            defaultValue: 'This user has not disliked anyone yet.',
          }),
          icon: ThumbsDown,
        };
      case 'dislike_received':
        return {
          title: t('profile.dislike_received', { defaultValue: 'Dislikes received' }),
          badge: t('profile.dislike_received', { defaultValue: 'Dislikes received' }),
          emptyTitle: t('profile.no_dislike_received_found', { defaultValue: 'No dislikes received yet.' }),
          emptyDescription: t('profile.no_dislike_received_description', {
            defaultValue: 'This user has not received dislikes yet.',
          }),
          icon: ThumbsDown,
        };
      case 'matched':
        return {
          title: t('profile.matches', { defaultValue: 'Matches' }),
          badge: t('profile.matches', { defaultValue: 'Matches' }),
          emptyTitle: t('profile.no_matches_found', { defaultValue: 'No matches yet.' }),
          emptyDescription: t('profile.no_matches_description', {
            defaultValue: 'No matches found yet.',
          }),
          icon: Users,
        };
      case 'view_received':
        return {
          title: t('profile.view_received', { defaultValue: 'Profile views' }),
          badge: t('profile.view_received', { defaultValue: 'Profile views' }),
          emptyTitle: t('profile.no_view_received_found', { defaultValue: 'No views yet.' }),
          emptyDescription: t('profile.no_view_received_description', {
            defaultValue: 'No one has viewed this profile yet.',
          }),
          icon: Eye,
        };
      default:
        return null;
    }
  }, [resolvedType, t]);

  const renderAvatar = (engagementUser: EngagementUser) => {
    return (
      getSafeImageURLEx(engagementUser.id, engagementUser.avatar ?? undefined, 'icon')
    );
  };

  const noResultsLabel = t('discovery.empty_people');

  const loadingLabel = t('profile.loading', { defaultValue: 'Loading...' });

  return (
    <Container className="cv-engagement-page">
      <div className={`mx-auto flex min-h-full w-full max-w-5xl flex-col gap-5 px-1 pb-8 pt-4 md:px-2 md:pt-6 ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>
        <div className="cv-engagement-context">
          <button type="button" className="cv-engagement-profile" onClick={() => navigate(navigationState?.returnTo || `/${effectiveUsername}`, {replace:true})} aria-label={`${t('app.view_profile')}: ${profile?.displayname || effectiveUsername}`}>
            <span className="cv-engagement-avatar">{(profile?.displayname || effectiveUsername).charAt(0).toUpperCase()}{profile && <img src={getSafeImageURLEx(profile.public_id, profile.avatar, 'icon') ?? undefined} alt="" onError={event => { event.currentTarget.style.display = 'none'; }} />}</span>
            <span><strong>{profile?.displayname || effectiveUsername}</strong><span dir="auto">@{effectiveUsername}</span></span>
          </button>
          <NavigationBar title={engagementMeta?.title || t('profile.profile_tab')} onBack={() => navigate(navigationState?.returnTo || `/${effectiveUsername}`, {replace:true})} actions={<button type="button" className="cv-icon-button" aria-label={t('nearby.refresh')} onClick={handleRefresh} disabled={loadingEngagements}><RefreshCw className={loadingEngagements ? 'animate-spin' : ''} /></button>} />
        </div>

        <div className="space-y-5">
          {!isAuthenticated ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-6">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center ${theme === 'dark' ? 'cv-card-surface-muted' : 'bg-gray-100'}`}>
                <Lock className={`w-10 h-10 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
              </div>
              <div className="max-w-xs mx-auto">
                <h3 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {t('profile.private_profile', { defaultValue: 'Private List' })}
                </h3>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t('profile.login_to_view_details', { defaultValue: 'Log in to view this list.' })}
                </p>
              </div>
              <button
                onClick={() => setShowAuthWizard(true)}
                className={`px-8 py-3 rounded-xl font-bold text-sm transition-all transform active:scale-95 ${theme === 'dark'
                  ? 'bg-white text-black hover:bg-gray-200'
                  : 'bg-black text-white hover:bg-gray-800'
                  }`}
              >
                {t('auth.sign_in')}
              </button>
            </div>
          ) : (
            <>
          {isPremiumGateActive ? (
            <div className="py-16">
              <div className="mx-auto max-w-lg">
                <PremiumGateInline
                  theme={theme}
                  copy={{
                    badge: t('premium.gate_badge', { defaultValue: 'Premium Access' }),
                    title: t('premium.required_title', { defaultValue: 'Premium membership required' }),
                    description: t('premium.profile_engagements_description', {
                      defaultValue: 'Upgrade to Premium to view engagement lists beyond Followers and Following.',
                    }),
                    highlights: [
                      t('premium.profile_engagements_highlight_1', { defaultValue: 'Access likes, dislikes, matches, and profile views' }),
                      t('premium.profile_engagements_highlight_2', { defaultValue: 'Get complete engagement analytics in one place' }),
                    ],
                    cta: t('premium.upgrade_cta', { defaultValue: 'Upgrade to Premium' }),
                    footnote: t('premium.gate_note', {
                      defaultValue: 'You can manage your plan anytime from account settings.',
                    }),
                  }}
                  onUpgrade={() => navigate('/premium')}
                />
              </div>
            </div>
          ) : loadingProfile ? (
            <div className="flex items-center justify-center py-20">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center gap-3"
              >
                <div
                  className={`w-10 h-10 border-4 rounded-full animate-spin ${theme === 'dark'
                    ? 'border-white/10 border-t-white'
                    : 'border-gray-200 border-t-gray-700'
                    }`}
                />
                <p
                  className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}
                >
                  {loadingLabel}
                </p>
              </motion.div>
            </div>
          ) : (
            <>
              {loadingEngagements && engagements.length === 0 ? (
                <p role="status" className="py-8 text-center">{loadingLabel}</p>
              ) : engagements.length === 0 ? (
                <AnimatedEmptyState title={noResultsLabel} />
              ) : (
                <div className="cv-engagement-list">
                  {engagements.map(engagementUser => <ListRow key={engagementUser.id} icon={<span className="cv-engagement-row-avatar">{(engagementUser.displayname || engagementUser.username).charAt(0)}<img src={renderAvatar(engagementUser) ?? undefined} alt="" onError={event => { event.currentTarget.style.display = 'none'; }} /></span>} title={<bdi>{engagementUser.displayname || engagementUser.username}</bdi>} description={<><bdi>@{engagementUser.username}</bdi>{engagementUser.bio && <span>{htmlToPlainText(engagementUser.bio)}</span>}</>} onClick={() => navigate(`/${engagementUser.username}`)} />)}
                </div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-sm rounded-xl px-4 py-3 border ${theme === 'dark'
                    ? 'bg-red-500/10 text-red-300 border-red-500/20'
                    : 'bg-red-50 text-red-600 border-red-200'
                    }`}
                >
                  {error}
                </motion.div>
              )}

              <div ref={observerTarget} className="flex justify-center pt-4 min-h-[50px]">
                {loadingEngagements && engagements.length > 0 && (
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <div
                      className={`w-4 h-4 border-2 rounded-full animate-spin ${theme === 'dark'
                        ? 'border-white/10 border-t-white'
                        : 'border-gray-200 border-t-gray-700'
                        }`}
                    />
                    <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                      {loadingLabel}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
      </div>
      <AuthWizard
        isOpen={showAuthWizard}
        onClose={() => setShowAuthWizard(false)}
      />
    </Container>
  );
};

export default ProfileEngagementsScreen;
