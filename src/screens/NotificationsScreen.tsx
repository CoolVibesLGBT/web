import AnimatedEmptyState from '@/components/ui/AnimatedEmptyState';
import ViewTabs from '@/components/ui/ViewTabs';
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

  const divider = <div className="h-px w-full bg-[var(--cv-inner-border)]" />;
  const emptyTitle = t(`notifications.no_${activeTab}`, {
    defaultValue: activeTab === 'all' ? t('notifications.no_notifications') : t('notifications.no_other'),
  });
  const emptyMessage = t(`notifications.empty_message_${activeTab}`, {
    defaultValue: t('notifications.empty_message_all'),
  });

  return (
    <div className="skyline-page-scroll w-full bg-[var(--cv-page-bg)] text-[var(--cv-neutral-1)]">
      <div className="cv-page-toolbar">
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            aria-label={t('notifications.mark_all_read')}
            className="flex h-10 items-center gap-1.5 rounded-[16px] bg-[var(--cv-neutral-1)] px-3.5 text-[0.765rem] font-semibold text-[var(--cv-page-bg)] transition-all hover:bg-[var(--cv-neutral-1-hover)] active:scale-[0.98] disabled:cursor-default disabled:opacity-40"
          >
            <CheckCheck className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">{t('notifications.mark_all_read')}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/settings')}
            aria-label={t('notifications.settings')}
            title={t('notifications.settings')}
            className="flex h-10 w-10 items-center justify-center rounded-[16px] bg-[var(--cv-surface-3)] text-[var(--cv-neutral-1)] transition-all hover:bg-[var(--cv-surface-3-hover)]"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col gap-5 px-4 pb-10 pt-4 md:px-6">
        {/* Summary */}
        <section className="overflow-hidden rounded-[12px] border border-[var(--cv-card-border)] bg-[var(--cv-card-bg-solid)]">
          <div className="flex items-center justify-between gap-4 p-4">
            <p className="text-[0.882rem] font-medium leading-tight">{t('notifications.all')}</p>
            <p className="text-[1.0rem] font-bold leading-none">{notifications.length}</p>
          </div>
          {divider}
          <div className="flex items-center justify-between gap-4 p-4">
            <p className="text-[0.882rem] font-medium leading-tight">{t('notifications.unread')}</p>
            <p className={`text-[1.0rem] font-bold leading-none ${unreadCount > 0 ? 'text-[var(--color-brand)]' : ''}`}>{unreadCount}</p>
          </div>
        </section>

        {/* Filter chips */}
        <ViewTabs items={notificationTabs.map(({ icon: Icon, ...item }) => ({ ...item, icon: <Icon /> }))} activeId={activeTab} onSelect={id => setActiveTab(id as typeof activeTab)} label={t('notifications.title')} />

        <main className="min-h-0">
          <AnimatePresence mode="wait">
            {filteredNotifications.length === 0 ? (
              <AnimatedEmptyState title={emptyTitle} description={emptyMessage} />
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="overflow-hidden rounded-[12px] border border-[var(--cv-card-border)] bg-[var(--cv-card-bg-solid)]"
              >
                {filteredNotifications.map((notification, index) => (
                  <React.Fragment key={notification.id}>
                    <NotificationItem
                      notification={notification}
                      markAsRead={markAsRead}
                      onClick={() => handleNotificationClick(notification)}
                      theme={theme}
                      getNotificationIcon={getNotificationIcon}
                      formatTime={formatTime}
                      index={index}
                    />
                    {index < filteredNotifications.length - 1 && divider}
                  </React.Fragment>
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
