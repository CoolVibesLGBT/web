import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import Container from './Container';
import { api } from '../services/api';
import { Actions } from '../services/actions';
import { getSafeImageURL } from '../helpers/helpers';

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

const DUMMY_ENGAGEMENTS: Record<
  EngagementType,
  { users: EngagementUser[]; next_cursor: string | null }
> = {
  followers: {
    users: [
      {
        id: 'dummy-follower-1',
        username: 'travelbuddy',
        displayname: 'Travel Buddy',
        avatar: {
          file: {
            url: '/static/dummy/avatars/avatar_01.jpg',
          },
        },
        bio: 'Always looking for the next adventure.',
        is_following: true,
      },
      {
        id: 'dummy-follower-2',
        username: 'citylights',
        displayname: 'City Lights',
        avatar: {
          file: {
            url: '/static/dummy/avatars/avatar_02.jpg',
          },
        },
        bio: 'Nightlife enthusiast and foodie.',
        is_following: false,
      },
      {
        id: 'dummy-follower-3',
        username: 'bookishbee',
        displayname: 'Bookish Bee',
        avatar: {
          file: {
            url: '/static/dummy/avatars/avatar_03.jpg',
          },
        },
        bio: 'Reading, coffee, repeat.',
        is_following: true,
      },
    ],
    next_cursor: null,
  },
  followings: {
    users: [
      {
        id: 'dummy-following-1',
        username: 'artcollective',
        displayname: 'Art Collective',
        avatar: {
          file: {
            url: '/static/dummy/avatars/avatar_04.jpg',
          },
        },
        bio: 'Curating creative minds across the globe.',
        is_following: true,
      },
      {
        id: 'dummy-following-2',
        username: 'fitnessflow',
        displayname: 'Fitness Flow',
        avatar: {
          file: {
            url: '/static/dummy/avatars/avatar_05.jpg',
          },
        },
        bio: 'Move, breathe, thrive.',
        is_following: true,
      },
    ],
    next_cursor: null,
  },
};

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
  const { t } = useTranslation('common');

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
      const response = await api.call(Actions.USER_FETCH_PROFILE, {
        method: 'POST',
        body: { nickname: username },
      });

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
    } catch (err) {
      console.error('Failed to load profile summary', err);
      setProfile({
        username,
        displayname: username,
      });
      setError(
        (err as any)?.response?.data?.message ||
          (err as Error).message ||
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

        const response = await api.call(Actions.CMD_USER_FETCH_ENGAGEMENTS, {
          method: 'POST',
          body,
        });

        const users: EngagementUser[] = Array.isArray(response?.users)
          ? response.users
          : DUMMY_ENGAGEMENTS[type].users;

        const responseCursor =
          response?.next_cursor ?? DUMMY_ENGAGEMENTS[type].next_cursor ?? null;

        setEngagements((prev) =>
          append ? [...prev, ...users] : [...users]
        );
        setCursor(responseCursor);
      } catch (err) {
        console.error('Failed to load engagements', err);
        const fallback = DUMMY_ENGAGEMENTS[type];
        setEngagements((prev) =>
          append ? [...prev, ...fallback.users] : [...fallback.users]
        );
        setCursor(fallback.next_cursor);
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
    [profile?.public_id, t, username]
  );

  useEffect(() => {
    if (!resolvedType) {
      return;
    }

    if (!profile) {
      void fetchProfile();
      return;
    }

    void loadEngagements(resolvedType);
  }, [resolvedType, profile, fetchProfile, loadEngagements]);

  const handleLoadMore = () => {
    if (!resolvedType || !cursor || loadingEngagements) {
      return;
    }

    void loadEngagements(resolvedType, cursor, true);
  };

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
      getSafeImageURL(engagementUser.avatar, 'icon') ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        engagementUser.displayname || engagementUser.username
      )}&background=random`
    );
  };

  const noResultsLabel =
    resolvedType === 'followings'
      ? t('profile.no_followings_found', {
          defaultValue: 'No followings yet.',
        })
      : t('profile.no_followers_found', { defaultValue: 'No followers yet.' });

  const loadingLabel = t('profile.loading', { defaultValue: 'Loading...' });
  const loadMoreLabel = t('profile.load_more', { defaultValue: 'Load more' });
  const viewProfileLabel = t('profile.view', { defaultValue: 'View' });

  return (
    <Container>
      <div className="max-w-3xl mx-auto min-h-[100dvh]">
        <div
          className={`sticky top-0 z-30 backdrop-blur-md border-b ${
            theme === 'dark'
              ? 'bg-black/80 border-white/10'
              : 'bg-white/80 border-black/10'
          }`}
        >
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={handleNavigateBack}
                className={`p-2 rounded-full transition-colors ${
                  theme === 'dark'
                    ? 'hover:bg-white/10 text-white'
                    : 'hover:bg-black/10 text-gray-700'
                }`}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <h1
                  className={`text-lg font-bold leading-tight ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {pageTitle}
                </h1>
                <p
                  className={`text-xs ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
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
              className={`p-2 rounded-full transition-colors ${
                theme === 'dark'
                  ? 'hover:bg-white/10 text-gray-400 hover:text-white'
                  : 'hover:bg-black/10 text-gray-500 hover:text-black'
              } ${loadingEngagements ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <RefreshCw
                className={`w-5 h-5 ${
                  loadingEngagements ? 'animate-spin' : ''
                }`}
              />
            </button>
          </div>
        </div>

        <div className="px-4 py-6 space-y-4">
          {loadingProfile ? (
            <div className="flex items-center justify-center py-20">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center gap-3"
              >
                <div
                  className={`w-10 h-10 border-4 rounded-full animate-spin ${
                    theme === 'dark'
                      ? 'border-white/10 border-t-white'
                      : 'border-gray-200 border-t-gray-700'
                  }`}
                />
                <p
                  className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  {loadingLabel}
                </p>
              </motion.div>
            </div>
          ) : (
            <>
              {profile && (
                <div
                  className={`rounded-2xl px-4 py-3 flex items-center gap-3 ${
                    theme === 'dark'
                      ? 'bg-white/5 border border-white/10'
                      : 'bg-black/[0.04] border border-black/[0.06]'
                  }`}
                >
                  <img
                    src={
                      getSafeImageURL(profile.avatar, 'icon') ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        profile.displayname || profile.username
                      )}&background=random`
                    }
                    alt={profile.displayname || profile.username}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-semibold truncate ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {profile.displayname || profile.username}
                    </p>
                    <p
                      className={`text-xs ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    >
                      @{profile.username}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      theme === 'dark'
                        ? 'bg-white/10 text-white'
                        : 'bg-black/10 text-gray-900'
                    }`}
                  >
                    {badgeLabel}
                  </span>
                </div>
              )}

              {loadingEngagements && engagements.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center gap-3"
                  >
                    <div
                      className={`w-10 h-10 border-4 rounded-full animate-spin ${
                        theme === 'dark'
                          ? 'border-white/10 border-t-white'
                          : 'border-gray-200 border-t-gray-700'
                      }`}
                    />
                    <p
                      className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    >
                      {loadingLabel}
                    </p>
                  </motion.div>
                </div>
              ) : engagements.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`text-sm text-center ${
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                    }`}
                  >
                    {noResultsLabel}
                  </motion.div>
                </div>
              ) : (
                <div className="space-y-2">
                  {engagements.map((engagementUser) => (
                    <motion.div
                      key={engagementUser.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors ${
                        theme === 'dark'
                          ? 'hover:bg-white/5'
                          : 'hover:bg-black/5'
                      }`}
                    >
                      <img
                        src={renderAvatar(engagementUser)}
                        alt={engagementUser.displayname || engagementUser.username}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-semibold truncate ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}
                        >
                          {engagementUser.displayname || engagementUser.username}
                        </p>
                        <p
                          className={`text-xs truncate ${
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                          }`}
                        >
                          @{engagementUser.username}
                        </p>
                        {engagementUser.bio && (
                          <p
                            className={`text-xs mt-1 line-clamp-2 ${
                              theme === 'dark'
                                ? 'text-gray-400'
                                : 'text-gray-600'
                            }`}
                          >
                            {engagementUser.bio}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/${engagementUser.username}`)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                          theme === 'dark'
                            ? 'bg-white text-black hover:bg-gray-200'
                            : 'bg-black text-white hover:bg-gray-900'
                        }`}
                      >
                        {viewProfileLabel}
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}

              {error && (
                <div
                  className={`text-xs rounded-xl px-3 py-2 ${
                    theme === 'dark'
                      ? 'bg-red-500/10 text-red-300'
                      : 'bg-red-50 text-red-600'
                  }`}
                >
                  {error}
                </div>
              )}

              {cursor && (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={loadingEngagements}
                    className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                      loadingEngagements
                        ? 'opacity-50 cursor-not-allowed'
                        : theme === 'dark'
                        ? 'bg-white text-black hover:bg-gray-200'
                        : 'bg-black text-white hover:bg-gray-900'
                    }`}
                  >
                    {loadingEngagements ? loadingLabel : loadMoreLabel}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Container>
  );
};

export default ProfileEngagementsScreen;

