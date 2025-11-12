import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Users, RefreshCw } from 'lucide-react';
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
  date_of_birth?: string;
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

  const calculateAge = React.useCallback((dateOfBirth?: string): number | null => {
    if (!dateOfBirth) return null;
    const birthDate = new Date(dateOfBirth);
    if (Number.isNaN(birthDate.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age -= 1;
    }

    return age >= 0 ? age : null;
  }, []);

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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {Array.from({ length: limit }).map((_, index) => (
            <div
              key={`popular-skeleton-${index}`}
              className={`relative overflow-hidden rounded-3xl border ${
                theme === 'dark' ? 'border-gray-900 bg-gray-950' : 'border-gray-100 bg-gray-50'
              } aspect-[3/4] animate-pulse`}
            >
              <div className="absolute inset-0">
                <div className={`h-2/3 w-full ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-200'}`} />
                <div className={`h-1/3 w-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-300'}`} />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-4">
                <div className={`h-4 w-24 rounded ${theme === 'dark' ? 'bg-gray-700/60' : 'bg-gray-300'}`} />
                <div className={`mt-2 h-3 w-16 rounded ${theme === 'dark' ? 'bg-gray-800/70' : 'bg-gray-200'}`} />
              </div>
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {users.map((user, index) => {
          const age = calculateAge(user.date_of_birth);
          return (
            <motion.button
              key={user.id}
              type="button"
              onClick={() => navigate(`/${user.username}`)}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className={`group relative overflow-hidden rounded-3xl border ${
                theme === 'dark'
                  ? 'border-gray-900 bg-gray-950 hover:border-indigo-500/40 hover:shadow-indigo-500/20'
                  : 'border-gray-100 bg-white hover:border-gray-300 hover:shadow-[0_12px_30px_-16px_rgba(79,70,229,0.55)]'
              } aspect-[3/4] transition-all`}
            >
              <img
                src={resolveAvatar(user)}
                alt={user.displayname || user.username}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-95" />
              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-4 text-left">
                <p className="truncate text-base font-semibold text-white sm:text-lg">
                  {user.displayname || user.username}
                </p>
                <p className="text-sm font-medium text-white/80">
                  {age !== null
                    ? t('app.popular_users_age_years', {
                        age,
                        defaultValue: `${age} ${t('app.popular_users_age_suffix', { defaultValue: 'yaş' })}`,
                      })
                    : t('app.popular_users_age_unknown', { defaultValue: 'Yaş bilgisi yok' })}
                </p>
              </div>
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
      className={`rounded-3xl border p-5 sm:p-6 ${
        theme === 'dark' ? 'border-gray-900 bg-gray-950/90' : 'border-gray-100 bg-white'
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
    </motion.section>
  );
};

export default PopularUsersPanel;

