import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from '@/router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  UserPlus,
  UserMinus,
  Heart,
  MessageCircle,
  Settings,
  CheckCheck,
  Gift,
  Sparkles,
  Eye,
  Users,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { useAtom } from 'jotai';
import { globalState } from '../state/nearby';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import NotificationItem, { type Notification } from '../features/notifications/NotificationItem';
import { Actions } from '../services/actions';
import { useTranslation } from 'react-i18next';

const NotificationsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const [activeTab, setActiveTab] = useState<'all' | 'messages' | 'matches' | 'likes' | 'follows' | 'gifts' | 'other'>('all');
  const [state, setState] = useAtom(globalState);
  const notifications: Notification[] = (state as any).notifications || [];
  const { socket } = useSocket();
  const { isAuthenticated, user } = useAuth();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'chat_message': return MessageCircle;
      case 'new_match': return Heart;
      case 'profile_visit': return Eye;
      case 'friend_request': return UserPlus;
      case 'event_reminder': return Bell;
      case 'system_alert': return AlertCircle;
      case 'like': return Heart;
      case 'gift': return Gift;
      case 'follow': return UserPlus;
      case 'unfollow': return UserMinus;
      case 'super_like': return Sparkles;
      case 'message_read': return CheckCheck;
      case 'match_unmatch': return Users;
      case 'referral': return Users;
      default: return Bell;
    }
  };

  const messageCount = notifications.filter(n => n.type === 'chat_message' || n.type === 'message_read').length;
  const matchCount = notifications.filter(n => n.type === 'new_match' || n.type === 'match_unmatch').length;
  const likeCount = notifications.filter(n => n.type === 'like' || n.type === 'super_like').length;
  const followCount = notifications.filter(n => n.type === 'follow' || n.type === 'unfollow').length;
  const giftCount = notifications.filter(n => n.type === 'gift').length;
  const unreadCount = notifications.filter(n => !n.is_read).length;
  const notificationNextCursor = (state as any).notificationNextCursor;
  const otherCount = notifications.filter(n =>
    ['profile_visit', 'friend_request', 'event_reminder', 'system_alert', 'referral'].includes(n.type)
  ).length;

  const notificationTabs = useMemo(() => ([
    { id: 'all', label: t('notifications.all'), count: notifications.length, icon: Bell },
    { id: 'messages', label: t('notifications.messages'), count: messageCount, icon: MessageCircle },
    { id: 'matches', label: t('notifications.matches'), count: matchCount, icon: Heart },
    { id: 'likes', label: t('notifications.likes'), count: likeCount, icon: Sparkles },
    { id: 'follows', label: t('notifications.follows'), count: followCount, icon: UserPlus },
    { id: 'gifts', label: t('notifications.gifts'), count: giftCount, icon: Gift },
    { id: 'other', label: t('notifications.other'), count: otherCount, icon: Bell },
  ]), [followCount, giftCount, likeCount, matchCount, messageCount, notifications.length, otherCount, t]);

  const filteredNotifications = activeTab === 'all'
    ? notifications
    : activeTab === 'messages'
      ? notifications.filter(n => n.type === 'chat_message' || n.type === 'message_read')
      : activeTab === 'matches'
        ? notifications.filter(n => n.type === 'new_match' || n.type === 'match_unmatch')
        : activeTab === 'likes'
          ? notifications.filter(n => n.type === 'like' || n.type === 'super_like')
          : activeTab === 'follows'
            ? notifications.filter(n => n.type === 'follow' || n.type === 'unfollow')
            : activeTab === 'gifts'
              ? notifications.filter(n => n.type === 'gift')
              : notifications.filter(n =>
                ['profile_visit', 'friend_request', 'event_reminder', 'system_alert', 'referral'].includes(n.type)
              );
  const activeTabMeta = notificationTabs.find(tab => tab.id === activeTab) ?? notificationTabs[0];
  const ActiveTabIcon = activeTabMeta.icon;

  const formatTime = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('notifications.just_now');
    if (diffMins < 60) return t('notifications.mins_ago', { count: diffMins });
    if (diffHours < 24) return t('notifications.hours_ago', { count: diffHours });
    if (diffDays < 7) return t('notifications.day_ago', { count: diffDays });
    return created.toLocaleDateString();
  };

  useEffect(() => {
    if (!socket) return;
    const onConnect = () => {
      if (user?.public_id) {
        const savedToken = localStorage.getItem("authToken");
        if (savedToken) socket.emit('auth', savedToken);
      }
    };
    onConnect();
    socket.on('connect', onConnect);
    return () => {
      socket.off('connect', onConnect);
    };
  }, [socket, isAuthenticated, user?.public_id]);

  const fetchNotifications = useCallback(async (cursor: unknown = null, reset: boolean = false) => {
    const res = (await api.checkNewNotifications(20, cursor)) as any;
    setState((prev: any) => ({
      ...prev,
      notifications: reset ? (res.notifications ?? []) : [...(prev.notifications ?? []), ...(res.notifications ?? [])],
      notificationNextCursor: res.next_cursor,
      notificationPrevCursor: res.prev_cursor
    }));
  }, [setState]);

  useEffect(() => {
    fetchNotifications(null, true);
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (isAuthenticated && socket) {
      const savedToken = localStorage.getItem("authToken");
      socket.emit("notifications", JSON.stringify({
        action: Actions.CMD_USER_MARK_NOTIFICATIONS_SEEN,
        token: savedToken,
        notification_id: notificationId
      }));
    }
    setState((prev: any) => ({
      ...prev,
      notifications: prev.notifications?.map((n: any) => n.id === notificationId ? { ...n, is_read: true } : n) || []
    }));
  }, [isAuthenticated, setState, socket]);

  const markAllAsRead = useCallback(() => {
    notifications
      .filter(notification => !notification.is_read)
      .forEach(notification => {
        void markAsRead(notification.id);
      });
  }, [markAsRead, notifications]);

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && notificationNextCursor) {
          fetchNotifications(notificationNextCursor);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );
    observer.observe(target);
    return () => {
      if (target) observer.unobserve(target);
    };
  }, [notificationNextCursor, fetchNotifications]);

  const handleNotificationClick = (notification: Notification) => {
    if (notification.type === 'chat_message') navigate('/messages');
    else if (notification.type === 'new_match' || notification.type === 'match_unmatch') navigate('/match');
    else if (notification.type === 'referral') navigate('/referrals');
    else if (notification.sender?.username) navigate(`/${notification.sender.username}`);
  };

  const isDark = theme === 'dark';
  const textColor = isDark ? 'text-white' : 'text-slate-950';
  const secTextColor = isDark ? 'text-zinc-400' : 'text-slate-500';
  const panelClassName = isDark
    ? 'cv-card-surface-soft border-white/10'
    : 'border-white/70 bg-white/75';
  const emptyTitle = t(`notifications.no_${activeTab}`, {
    defaultValue: activeTab === 'all' ? t('notifications.no_notifications') : t('notifications.no_other'),
  });
  const emptyMessage = t(`notifications.empty_message_${activeTab}`, {
    defaultValue: t('notifications.empty_message_all'),
  });

  return (
    <div className={`skyline-page-scroll w-full ${textColor}`}>
      <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col gap-4 px-1 pb-8 pt-24 md:gap-5 md:px-2 md:pt-28">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className={`relative overflow-hidden rounded-[28px] border p-4 backdrop-blur-3xl md:p-5 ${panelClassName} shadow-[0_24px_70px_-48px_rgba(15,23,42,0.55)]`}
        >
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-sky-500/50 to-transparent" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="sky-glow flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white">
                <Bell className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.32em] text-sky-600">
                  {activeTabMeta.label}
                </p>
                <div className="mt-1 flex min-w-0 items-center gap-2">
                  <h1 className="truncate text-2xl font-black leading-none tracking-tight md:text-[27px]">
                    {t('notifications.title')}
                  </h1>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${unreadCount > 0
                    ? 'bg-sky-600/10 text-sky-600 dark:bg-sky-400/10 dark:text-sky-300'
                    : isDark ? 'bg-white/5 text-zinc-500' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {unreadCount} {t('notifications.unread')}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
              <motion.button
                type="button"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                aria-label={t('notifications.mark_all_read')}
                whileHover={unreadCount > 0 ? { scale: 1.03 } : undefined}
                whileTap={unreadCount > 0 ? { scale: 0.97 } : undefined}
                className={`inline-flex h-10 items-center justify-center gap-2 rounded-full px-3 text-xs font-black transition-all disabled:cursor-default disabled:opacity-45 ${isDark
                  ? 'bg-white text-black hover:bg-zinc-200'
                  : 'bg-slate-950 text-white hover:bg-slate-800'
                }`}
                >
                <CheckCheck className="h-4 w-4" />
                <span className="hidden sm:inline">{t('notifications.mark_all_read')}</span>
              </motion.button>
              <button
                type="button"
                onClick={() => navigate('/settings')}
                aria-label={t('notifications.settings')}
                title={t('notifications.settings')}
                className={`inline-flex h-10 items-center justify-center gap-2 rounded-full px-3 text-xs font-black transition-all ${isDark ? 'bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-950'}`}
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">{t('notifications.settings')}</span>
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-200/60 pt-3 dark:border-white/10">
            {[
              { label: t('notifications.all'), value: notifications.length, icon: Bell },
              { label: t('notifications.unread'), value: unreadCount, icon: CheckCheck },
              { label: activeTabMeta.label, value: filteredNotifications.length, icon: ActiveTabIcon },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={`${stat.label}-${stat.value}`} className={`flex min-w-0 items-center gap-2 rounded-2xl border px-2.5 py-2.5 sm:px-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/70'}`}>
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${isDark ? 'bg-white/5 text-zinc-400' : 'bg-slate-100 text-slate-500'}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-black leading-none sm:text-xl">{stat.value}</p>
                    <p className={`mt-1 truncate text-[8px] font-black uppercase tracking-[0.14em] sm:text-[9px] ${secTextColor}`}>
                      {stat.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>

        <section className={`flex min-w-0 items-center rounded-[20px] border p-1.5 backdrop-blur-3xl ${panelClassName} shadow-[0_18px_60px_-42px_rgba(15,23,42,0.4)]`}>
          <div role="tablist" aria-label={t('notifications.title')} className={`flex min-w-0 flex-1 items-center gap-1 overflow-x-auto rounded-full p-1 no-scrollbar ${isDark ? 'bg-white/[0.04]' : 'bg-slate-100/90'}`}>
            {notificationTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  whileTap={{ scale: 0.96 }}
                  title={tab.label}
                  className={`group relative flex h-9 shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full px-3 text-[10px] font-black uppercase tracking-[0.14em] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500/70 sm:flex-1 sm:px-2.5 ${
                    isActive
                      ? 'text-white'
                      : isDark
                        ? 'text-zinc-500 hover:bg-white/10 hover:text-white'
                        : 'text-slate-500 hover:bg-white hover:text-slate-950'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="activeNotifTab"
                      className="absolute inset-0 rounded-full bg-sky-600 shadow-lg shadow-sky-600/25"
                      transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {tab.label}
                    </span>
                  </span>
                  {tab.count > 0 && (
                    <span className={`relative z-10 min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] font-black ${isActive
                      ? 'bg-white/20 text-white'
                      : isDark ? 'bg-white/10 text-zinc-300' : 'bg-white text-slate-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </section>

        <main className="min-h-0">
          <AnimatePresence mode="wait">
            {filteredNotifications.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`flex min-h-[360px] flex-col items-center justify-center rounded-[30px] border px-8 py-16 text-center backdrop-blur-3xl ${panelClassName} shadow-[0_24px_70px_-48px_rgba(15,23,42,0.45)]`}
              >
                <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-full ${isDark ? 'bg-white/5 text-zinc-500' : 'bg-slate-100 text-slate-400'}`}>
                  <Bell className="h-8 w-8" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-black tracking-tight">{emptyTitle}</h3>
                <p className={`mt-2 max-w-[320px] text-sm font-medium leading-relaxed ${secTextColor}`}>
                  {emptyMessage}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-2"
              >
                {filteredNotifications.map((notification, index) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    markAsRead={markAsRead}
                    onClick={() => handleNotificationClick(notification)}
                    theme={theme}
                    getNotificationIcon={getNotificationIcon}
                    formatTime={formatTime}
                    index={index}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={observerTarget} className="h-16 w-full" />
        </main>
      </div>
    </div>
  );
};

export default NotificationsScreen;
