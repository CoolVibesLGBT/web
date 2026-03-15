import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Users, UserPlus, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { useTranslation } from 'react-i18next';
import Container from '../components/ui/Container';
import { api } from '../services/api';
import { getSafeImageURLEx } from '../helpers/helpers';
import AuthWizard from '../features/auth/AuthWizard';

type EngagementType = 'followers' | 'followings';

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
  return value === 'followers' || value === 'followings';
};

const ProfileEngagementsScreen: React.FC = () => {
  const { username = '', engagementType = '' } = useParams<{
    username: string;
    engagementType: string;
  }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const { defaultLanguage } = useApp();
  const { t } = useTranslation('common');
  const [showAuthWizard, setShowAuthWizard] = useState(false);

  const resolvedType = useMemo(() => {
    const lower = engagementType.toLowerCase();
    return isEngagementType(lower) ? lower : null;
  }, [engagementType]);

  const navigationState = location.state as
    | { profileSummary?: ProfileSummary }
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

  useEffect(() => {
    if (!resolvedType) {
      navigate(`/${username}`, { replace: true });
    }
  }, [resolvedType, navigate, username]);

  const fetchProfile = useCallback(async () => {
    if (!username) {
      return;
    }

    setLoadingProfile(true);
    try {
      const response = (await api.fetchProfileByNickname(username)) as any;

      const userData = (response?.user || response) ?? null;

      if (!userData) {
        throw new Error('Profile not found');
      }

      setProfile({
        id: userData.id,
        public_id: userData.public_id,
        username: userData.username ?? username,
        displayname: userData.displayname ?? userData.username ?? username,
        avatar: userData.avatar ?? null,
      });
    } catch (err: any) {
      console.error('Failed to load profile summary', err);
      setProfile({
        username,
        displayname: username,
      });
      setError(
        err?.response?.data?.message ||
        err.message ||
        t('profile.user_not_found')
      );
    } finally {
      setLoadingProfile(false);
    }
  }, [username, t]);

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
          body.nickname = username;
        }

        if (nextCursor) {
          body.cursor = nextCursor;
        }

        const response = (await api.fetchEngagements(body)) as any;

        // API returns engagements array, not users array
        const engagementsArray = Array.isArray(response?.engagements)
          ? response.engagements
          : [];

        // Transform engagements to EngagementUser array
        // For followers: use engager (the person following us)
        // For followings: use engagee (the person we're following)
        const users: EngagementUser[] = engagementsArray
          .map((engagement: any) => {
            const userData =
               engagement.kind === 'follower' ? engagement.engager : engagement.engagee;

            if (!userData) {
              return null;
            }

            // Handle bio - can be object (multi-language HTML) or string
            let bioText: string | undefined;
            if (userData.bio) {
              if (typeof userData.bio === 'string') {
                bioText = userData.bio;
              } else if (typeof userData.bio === 'object') {
                // Try to get bio in app's default language, then user's default language, then fallback to en
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
    [profile?.public_id, t, username, defaultLanguage]
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
    isAuthenticated,
  ]);

  const handleRefresh = () => {
    if (!resolvedType || loadingEngagements) {
      return;
    }

    setCursor(null);
    void loadEngagements(resolvedType);
  };

  const handleNavigateBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(`/${username}`, { replace: true });
    }
  };

  const pageTitle =
    resolvedType === 'followings'
      ? t('profile.following', { defaultValue: 'Following' })
      : t('profile.followers', { defaultValue: 'Followers' });

  const badgeLabel =
    resolvedType === 'followings'
      ? t('profile.following', { defaultValue: 'Following' })
      : t('profile.followers', { defaultValue: 'Followers' });

  const renderAvatar = (engagementUser: EngagementUser) => {
    return (
      getSafeImageURLEx(engagementUser.id, engagementUser.avatar ?? undefined, 'icon')
    );
  };

  const noResultsLabel =
    resolvedType === 'followings'
      ? t('profile.no_followings_found', {
        defaultValue: 'No followings yet.',
      })
      : t('profile.no_followers_found', { defaultValue: 'No followers yet.' });

  const loadingLabel = t('profile.loading', { defaultValue: 'Loading...' });
  const viewProfileLabel = t('profile.view', { defaultValue: 'View' });

  return (
    <Container>
      <div className={`flex flex-col h-[100dvh] w-full max-w-[600px] mx-auto ${theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-white text-gray-900'}`}>
        <div
          className={`sticky top-0 z-30 flex items-center justify-between h-[64px] px-4 backdrop-blur-md border-b ${theme === 'dark'
            ? 'bg-gray-950/95 border-gray-900'
            : 'bg-white/95 border-gray-200/50'
            }`}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <button
              type="button"
              onClick={handleNavigateBack}
              className={`p-2.5 -ml-2 rounded-full transition-all active:scale-90 flex-shrink-0 ${theme === 'dark'
                ? 'hover:bg-gray-900/50 text-white'
                : 'hover:bg-gray-100 text-gray-700'
                }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col min-w-0">
              <h1
                className={`text-[17px] font-bold tracking-tight truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}
              >
                {pageTitle}
              </h1>
              <p
                className={`text-[11px] font-medium leading-none -mt-0.5 opacity-60 truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}
              >
                @{username}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loadingEngagements}
            className={`p-2.5 -mr-2 rounded-full transition-all active:scale-90 flex-shrink-0 ${theme === 'dark'
              ? 'hover:bg-gray-900/50 text-gray-400 hover:text-white'
              : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
              } ${loadingEngagements ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <RefreshCw
              className={`w-5 h-5 transition-transform ${loadingEngagements ? 'animate-spin' : ''
                }`}
            />
          </button>
        </div>

        <div className="px-4 py-6 space-y-5">
          {!isAuthenticated ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-6">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
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
          {loadingProfile ? (
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
              {profile && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`rounded-2xl px-4 py-3.5 flex items-center gap-3 ${theme === 'dark'
                    ? 'bg-gray-950 border border-gray-900'
                    : 'bg-white border border-gray-200/50'
                    }`}
                >
                  <div className="relative">
                    <img
                      src={getSafeImageURLEx(profile.public_id, profile.avatar ?? undefined, 'icon') ?? undefined}
                      alt={profile.displayname || profile.username}
                      className={`w-14 h-14 rounded-full object-cover ring-2 ring-offset-2 ring-offset-transparent ${theme === 'dark' ? 'ring-gray-900' : 'ring-gray-200/50'
                        }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}
                    >
                      {profile.displayname || profile.username}
                    </p>
                    <p
                      className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}
                    >
                      @{profile.username}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full ${theme === 'dark'
                      ? 'bg-gray-900/50 text-white border border-gray-900'
                      : 'bg-gray-100 text-gray-900 border border-gray-200/50'
                      }`}
                  >
                    {badgeLabel}
                  </span>
                </motion.div>
              )}

              {loadingEngagements && engagements.length === 0 ? (
                <div className="flex items-center justify-center py-24">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center gap-4"
                  >
                    <div
                      className={`w-12 h-12 border-4 rounded-full animate-spin ${theme === 'dark'
                        ? 'border-white/10 border-t-white'
                        : 'border-gray-200 border-t-gray-700'
                        }`}
                    />
                    <p
                      className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}
                    >
                      {loadingLabel}
                    </p>
                  </motion.div>
                </div>
              ) : engagements.length === 0 ? (
                <div className="flex items-center justify-center py-24">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="flex flex-col items-center gap-4 max-w-sm mx-auto px-4"
                  >
                    <div
                      className={`w-20 h-20 rounded-full flex items-center justify-center ${theme === 'dark'
                        ? 'bg-gray-900/30 border border-gray-900'
                        : 'bg-gray-100 border border-gray-200/50'
                        }`}
                    >
                      {resolvedType === 'followers' ? (
                        <Users
                          className={`w-10 h-10 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                            }`}
                        />
                      ) : (
                        <UserPlus
                          className={`w-10 h-10 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                            }`}
                        />
                      )}
                    </div>
                    <div className="text-center space-y-1">
                      <h3
                        className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}
                      >
                        {noResultsLabel}
                      </h3>
                      <p
                        className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                          }`}
                      >
                        {resolvedType === 'followers'
                          ? t('profile.no_followers_description', {
                            defaultValue: 'This user has no followers yet.',
                          })
                          : t('profile.no_followings_description', {
                            defaultValue: 'This user is not following anyone yet.',
                          })}
                      </p>
                    </div>
                  </motion.div>
                </div>
              ) : (
                <div className="space-y-2">
                  {engagements.map((engagementUser, index) => (
                    <motion.div
                      key={engagementUser.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.03 }}
                      className={`group flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-200 ${theme === 'dark'
                        ? 'bg-gray-950 border border-gray-900 hover:bg-gray-900/50 hover:border-gray-800'
                        : 'bg-white border border-gray-200/50 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                    >
                      <div className="relative flex-shrink-0">
                        <img
                          src={renderAvatar(engagementUser) ?? undefined}
                          alt={engagementUser.displayname || engagementUser.username}
                          className={`w-14 h-14 rounded-full object-cover ring-2 ring-offset-2 ring-offset-transparent transition-all duration-200 group-hover:ring-opacity-50 ${theme === 'dark' ? 'ring-gray-900' : 'ring-gray-200/50'
                            }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}
                        >
                          {engagementUser.displayname || engagementUser.username}
                        </p>
                        <p
                          className={`text-xs mt-0.5 truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                            }`}
                        >
                          @{engagementUser.username}
                        </p>
                        {engagementUser.bio && (
                          <div
                            className={`text-xs mt-1.5 line-clamp-2 leading-relaxed ${theme === 'dark'
                              ? 'text-gray-400'
                              : 'text-gray-600'
                              }`}
                            dangerouslySetInnerHTML={{ __html: engagementUser.bio }}
                          />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/${engagementUser.username}`)}
                        className={`px-4 py-2 text-xs font-semibold rounded-full transition-all duration-200 flex-shrink-0 ${theme === 'dark'
                          ? 'bg-white text-black hover:bg-gray-200 hover:scale-105 active:scale-95'
                          : 'bg-gray-900 text-white hover:bg-gray-800 hover:scale-105 active:scale-95'
                          }`}
                      >
                        {viewProfileLabel}
                      </button>
                    </motion.div>
                  ))}
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
