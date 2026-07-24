import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from '@/router';
import { Users, RefreshCw, Sparkles, CheckCircle2, Flame, UserPlus, ChevronRight } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { generateFallbackImage, getSafeImageURLEx } from '../../helpers/helpers';

interface PopularUsersPanelProps {
  limit?: number;
  variant?: 'grid' | 'horizontal';
  showHeader?: boolean;
}

interface PopularUser {
  id: string;
  public_id?: string | number;
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

const PopularUsersPanel: React.FC<PopularUsersPanelProps> = ({
  limit = 20,
  variant = 'grid',
  showHeader = true,
}) => {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const isDark = theme === 'dark';

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
      const response = await api.fetchNearbyUsers({
        limit: limit,
        cursor: null,
      }) as any;

      const responseUsers = Array.isArray(response)
        ? response
        : Array.isArray(response?.users)
          ? response.users
          : Array.isArray(response?.data?.users)
            ? response.data.users
            : Array.isArray(response?.data?.data?.users)
              ? response.data.data.users
              : Array.isArray(response?.data)
                ? response.data
                : Array.isArray(response?.items)
                  ? response.items
                  : Array.isArray(response?.data?.items)
                    ? response.data.items
                    : [];
      const normalized = responseUsers.slice(0, limit);
      setUsers(normalized);
    } catch (err: unknown) {
      const message =
        (err as any)?.response?.data?.message ||
        (err as Error)?.message ||
        'Fetch error';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  React.useEffect(() => {
    fetchPopularUsers();
  }, [limit, fetchPopularUsers]);

  const resolveAvatar = useCallback((user: PopularUser) => {
    return (
      getSafeImageURLEx(user.username, user.avatar || undefined, 'icon') as string
    );
  }, []);

  const handleAvatarError = (e: React.SyntheticEvent<HTMLImageElement, Event>, user: PopularUser) => {
    const target = e.currentTarget;
    target.onerror = null;
    target.src = generateFallbackImage(user.username);
  };

  const formatFollowers = (count: number): string => {
    if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
    if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
    return String(count);
  };

  /* ─── HORIZONTAL VARIANT ─────────────────────────────────────────────── */
  const renderHorizontalContent = () => {
    if (isLoading) {
      return (
        <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-4">
          {Array.from({ length: 7 }).map((_, idx) => (
            <div
              key={`skel-${idx}`}
              className="flex-shrink-0 w-[140px] h-[210px] rounded-[22px] animate-pulse"
              style={{
                background: isDark
                  ? 'linear-gradient(135deg,#1e293b 0%,#0f172a 100%)'
                  : 'linear-gradient(135deg,#e2e8f0 0%,#cbd5e1 100%)',
              }}
            />
          ))}
        </div>
      );
    }

    if (error || users.length === 0) return null;

    return (
      <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-4 snap-x snap-mandatory">
        {users.map((user, index) => {
          const age = calculateAge(user.date_of_birth);
          const followers = user.followers_count ?? user.engagements?.counts?.follower_count;

          return (
            <motion.button
              key={`pop-h-${user.id || user.username || index}`}
              type="button"
              onClick={() => navigate(`/${user.username}`)}
              initial={{ opacity: 0, scale: 0.88, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: index * 0.045, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6, scale: 1.035 }}
              whileTap={{ scale: 0.96 }}
              className="group relative flex-shrink-0 snap-start overflow-hidden rounded-[22px] cursor-pointer"
              style={{ width: 148, height: 220 }}
            >
              {/* Cover photo */}
              <img
                src={resolveAvatar(user)}
                onError={(e) => handleAvatarError(e, user)}
                alt={user.displayname || user.username}
                loading="lazy"
                className={`absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 ${
                  !isAuthenticated ? 'blur-[3px]' : ''
                }`}
              />

              {/* Deep gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" style={{ opacity: 0.88 }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Top badges */}
              <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                <span className="flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-300 border border-amber-400/20">
                  <Flame className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                  Hot
                </span>
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.7)]" />
              </div>

              {/* Bottom info */}
              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-3 text-left">
                <div className="flex items-center gap-1 min-w-0">
                  <p className="truncate text-[13px] font-extrabold text-white leading-tight">
                    {user.displayname || user.username}
                  </p>
                  <CheckCircle2 className="h-3 w-3 shrink-0 text-sky-400 fill-sky-400/20" />
                </div>
                <p className="text-[10px] font-semibold text-white/50 truncate">@{user.username}{age !== null ? ` · ${age}` : ''}</p>
                {followers !== undefined && followers > 0 && (
                  <p className="text-[10px] font-bold text-amber-300/90 mt-0.5">
                    {formatFollowers(followers)} takipçi
                  </p>
                )}

                {/* Follow CTA */}
                <div className="mt-1.5 flex items-center justify-center gap-1 rounded-xl bg-white/[0.12] group-hover:bg-sky-500 backdrop-blur-sm py-1.5 text-[10px] font-bold text-white transition-all duration-200 border border-white/10 group-hover:border-sky-400">
                  <UserPlus className="h-2.5 w-2.5" />
                  <span>Takip Et</span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    );
  };

  /* ─── GRID VARIANT ───────────────────────────────────────────────────── */
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 sm:gap-4">
          {Array.from({ length: limit }).map((_, index) => (
            <div
              key={`popular-skeleton-${index}`}
              className={`relative overflow-hidden rounded-3xl border ${
                isDark ? 'cv-card-surface-solid border-white/10' : 'border-gray-100 bg-gray-50'
              } aspect-[3/4] animate-pulse`}
            >
              <div className="absolute inset-0">
                <div className={`h-2/3 w-full ${isDark ? 'bg-gray-900' : 'bg-gray-200'}`} />
                <div className={`h-1/3 w-full ${isDark ? 'bg-gray-800' : 'bg-gray-300'}`} />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className={`rounded-2xl border p-4 ${isDark ? 'border-red-900/40 bg-red-900/10 text-red-200' : 'border-red-100 bg-red-50 text-red-600'}`}>
          <p className="text-sm font-medium">{error}</p>
          <button type="button" onClick={fetchPopularUsers} className={`mt-3 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${isDark ? 'bg-red-800/60 text-red-100 hover:bg-red-800/80' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>
            <RefreshCw className="h-4 w-4" />
            {t('app.popular_users_retry', { defaultValue: 'Yeniden Dene' })}
          </button>
        </div>
      );
    }

    if (users.length === 0) {
      return (
        <div className={`rounded-2xl border p-5 text-center ${isDark ? 'cv-card-surface-solid border-white/10 text-gray-400' : 'border-gray-200 bg-white text-gray-500'}`}>
          <Users className="mx-auto mb-3 h-6 w-6" />
          <p className="text-sm font-medium">{t('app.popular_users_empty', { defaultValue: 'Henüz kullanıcı bulunamadı' })}</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 sm:gap-4">
        {users.map((user, index) => {
          const age = calculateAge(user.date_of_birth);
          return (
            <motion.button
              key={`${user.id ?? user.public_id ?? user.username ?? 'user'}-${index}`}
              type="button"
              onClick={() => navigate(`/${user.username}`)}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className={`group relative overflow-hidden rounded-3xl border ${
                isDark
                  ? 'cv-card-surface-solid border-white/10 hover:border-sky-500/40'
                  : 'border-gray-100 bg-white hover:border-gray-300'
              } aspect-[3/4] transition-all cursor-pointer`}
            >
              <img
                src={resolveAvatar(user)}
                onError={(e) => handleAvatarError(e, user)}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                className={`absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${!isAuthenticated ? 'blur-md' : ''}`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-90" />
              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-4 text-left">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-base font-bold text-white">{user.displayname || user.username}</p>
                  <CheckCircle2 className="h-4 w-4 text-sky-400 fill-sky-400/20 shrink-0" />
                </div>
                <p className="text-xs font-semibold text-sky-300/90">@{user.username} {age !== null ? `· ${age} yaş` : ''}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    );
  };

  /* ─── HORIZONTAL LAYOUT WRAPPER ─────────────────────────────────────── */
  if (variant === 'horizontal') {
    return (
      <div className="w-full">
        {showHeader && (
          <div className="flex items-center justify-between px-4 pb-3 pt-1">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-[14px] text-white shadow-lg shadow-sky-600/30"
                style={{ background: 'linear-gradient(135deg,#0ea5e9 0%,#6366f1 100%)' }}
              >
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <h4 className={`text-[13px] font-black uppercase tracking-[0.12em] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {t('app.popular_users_title', { defaultValue: 'Popüler İçerik Üreticileri' })}
                </h4>
                <p className="text-[11px] font-medium text-slate-400 dark:text-zinc-500">
                  {t('app.popular_users_subtitle', { defaultValue: 'Öne çıkan üreticileri keşfet' })}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/nearby')}
              className="flex items-center gap-0.5 text-[11px] font-black uppercase tracking-wider text-sky-500 hover:text-sky-400 transition-colors"
            >
              Tümü
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        {renderHorizontalContent()}
      </div>
    );
  }

  /* ─── GRID LAYOUT WRAPPER ────────────────────────────────────────────── */
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`rounded-3xl border p-5 sm:p-6 ${isDark ? 'cv-card-surface border-white/10' : 'border-gray-100 bg-white'}`}
    >
      {showHeader && (
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className={`text-[10px] font-semibold uppercase tracking-[0.4em] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {t('app.popular_users_badge', { defaultValue: 'Keşfet' })}
            </p>
            <h3 className={`mt-1 text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('app.popular_users_title', { defaultValue: 'Popüler İçerik Üreticileri' })}
            </h3>
          </div>
          <div className={`rounded-2xl p-3 ${isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-700'}`}>
            <Users className="h-6 w-6" />
          </div>
        </div>
      )}
      <div>{renderContent()}</div>
    </motion.section>
  );
};

export default PopularUsersPanel;
