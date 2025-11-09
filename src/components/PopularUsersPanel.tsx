import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Users, RefreshCw, ChevronRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { Actions } from '../services/actions';
import { getSafeImageURL } from '../helpers/helpers';

interface PopularUsersPanelProps {
  limit?: number;
}

interface PopularUser {
  id: string;
  username: string;
  displayname: string;
  avatar?: {
    file?: {
      url?: string;
    };
  };
  profile_image_url?: string;
  engagements?: {
    counts?: {
      follower_count?: number;
    };
  };
  followers_count?: number;
}

const PopularUsersPanel: React.FC<PopularUsersPanelProps> = ({ limit = 6 }) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation('common');

  const [users, setUsers] = React.useState<PopularUser[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchPopularUsers = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.call<{ users?: PopularUser[] }>(Actions.CMD_USER_FETCH_NEARBY_USERS, {
        method: 'POST',
        body: {
          limit,
          cursor: null,
        },
      });

      const normalized = (response?.users ?? []).slice(0, limit);
      setUsers(normalized);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        t('app.popular_users_error');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [limit, t]);

  React.useEffect(() => {
    fetchPopularUsers();
  }, [fetchPopularUsers]);

  const resolveAvatar = React.useCallback((user: PopularUser) => {
    return (
      getSafeImageURL((user as any).avatar, 'icon') ||
      user.profile_image_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayname || user.username)}&background=random`
    );
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: limit }).map((_, index) => (
            <div
              key={`popular-skeleton-${index}`}
              className={`flex items-center gap-3 rounded-xl border ${
                theme === 'dark' ? 'border-gray-900 bg-gray-950' : 'border-gray-100 bg-white'
              } p-3 animate-pulse`}
            >
              <div className={`w-10 h-10 rounded-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`} />
              <div className="flex-1 space-y-2">
                <div className={`h-3 rounded ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`} />
                <div className={`h-3 w-24 rounded ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`} />
              </div>
              <div className={`w-8 h-8 rounded-full ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`} />
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div
          className={`rounded-2xl border p-4 ${
            theme === 'dark'
              ? 'border-red-900/40 bg-red-900/10 text-red-200'
              : 'border-red-100 bg-red-50 text-red-600'
          }`}
        >
          <p className="text-sm font-medium">{error}</p>
          <button
            type="button"
            onClick={fetchPopularUsers}
            className={`mt-3 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
              theme === 'dark'
                ? 'bg-red-800/60 text-red-100 hover:bg-red-800/80'
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            <RefreshCw className="h-4 w-4" />
            {t('app.popular_users_retry')}
          </button>
        </div>
      );
    }

    if (users.length === 0) {
      return (
        <div
          className={`rounded-2xl border p-5 text-center ${
            theme === 'dark' ? 'border-gray-900 bg-gray-950 text-gray-400' : 'border-gray-200 bg-white text-gray-500'
          }`}
        >
          <Users className="mx-auto mb-3 h-6 w-6" />
          <p className="text-sm font-medium">{t('app.popular_users_empty')}</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {users.map((user, index) => {
          const followers =
            user.followers_count ??
            user.engagements?.counts?.follower_count ??
            0;

          return (
            <motion.button
              key={user.id}
              type="button"
              onClick={() => navigate(`/${user.username}`)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`group flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all ${
                theme === 'dark'
                  ? 'border-gray-900 bg-gray-950 hover:border-gray-800 hover:bg-gray-900/60'
                  : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="relative">
                <img
                  src={resolveAvatar(user)}
                  alt={user.displayname || user.username}
                  className="h-12 w-12 rounded-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {user.displayname || user.username}
                </p>
                <p className={`truncate text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  @{user.username}
                </p>
                <p className={`mt-1 text-xs font-medium ${theme === 'dark' ? 'text-indigo-200' : 'text-indigo-600'}`}>
                  {t('app.popular_users_followers', { count: followers.toLocaleString() })}
                </p>
              </div>
              <div
                className={`self-stretch rounded-xl px-2 py-1 text-xs font-semibold transition-colors ${
                  theme === 'dark'
                    ? 'bg-white/10 text-white group-hover:bg-white/20'
                    : 'bg-gray-100 text-gray-700 group-hover:bg-gray-200'
                }`}
              >
                {t('app.popular_users_view')}
              </div>
              <ChevronRight
                className={`h-4 w-4 transition-transform duration-150 group-hover:translate-x-1 ${
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                }`}
              />
            </motion.button>
          );
        })}
      </div>
    );
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`rounded-2xl border p-5 ${
        theme === 'dark' ? 'border-gray-900 bg-gray-950' : 'border-gray-100 bg-white shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-[10px] font-semibold uppercase tracking-[0.4em] ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
            {t('app.popular_users_badge')}
          </p>
          <h3 className={`mt-1 text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {t('app.popular_users_title')}
          </h3>
          <p className={`mt-1 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            {t('app.popular_users_subtitle')}
          </p>
        </div>
        <div className={`rounded-2xl p-3 ${theme === 'dark' ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-700'}`}>
          <Users className="h-6 w-6" />
        </div>
      </div>

      <div className="mt-4">{renderContent()}</div>

      <button
        type="button"
        onClick={() => navigate('/nearby')}
        className={`mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
          theme === 'dark'
            ? 'bg-white text-black hover:bg-gray-200'
            : 'bg-gray-900 text-white hover:bg-gray-800'
        }`}
      >
        {t('app.popular_users_explore')}
        <ChevronRight className="h-4 w-4" />
      </button>
    </motion.section>
  );
};

export default PopularUsersPanel;

