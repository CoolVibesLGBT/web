import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
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
  ArrowLeft
} from 'lucide-react';
import { api } from '../services/api';
import { useAtom } from 'jotai';
import { globalState } from '../state/nearby';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import NotificationItem, { Notification } from '../features/notifications/NotificationItem';
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
  const otherCount = notifications.filter(n =>
    ['profile_visit', 'friend_request', 'event_reminder', 'system_alert', 'referral'].includes(n.type)
  ).length;

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
    socket.on('notifications', onConnect);
    return () => {
      socket.off('notifications');
    };
  }, [socket, isAuthenticated, user?.public_id]);

  const fetchNotifications = useCallback(async (reset: boolean = false) => {
    const stateAny = state as any;
    const res = (await api.checkNewNotifications(20, reset ? null : stateAny.notificationNextCursor)) as any;
    setState((prev: any) => ({
      ...prev,
      notifications: reset ? (res.notifications ?? []) : [...prev.notifications, ...(res.notifications ?? [])],
      notificationNextCursor: res.next_cursor,
      notificationPrevCursor: res.prev_cursor
    }));
  }, [state, setState]);

  useEffect(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
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
  };

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && state.notificationNextCursor) {
          fetchNotifications();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );
    observer.observe(target);
    return () => {
      if (target) observer.unobserve(target);
    };
  }, [state.notificationNextCursor, fetchNotifications]);

  const handleNotificationClick = (notification: Notification) => {
    if (notification.type === 'chat_message') navigate('/messages');
    else if (notification.type === 'new_match' || notification.type === 'match_unmatch') navigate('/matches');
    else if (notification.type === 'referral') navigate('/referrals');
    else if (notification.sender?.username) navigate(`/${notification.sender.username}`);
  };

  const isDark = theme === 'dark';
  const bgColor = isDark ? 'bg-gray-950' : 'bg-white';
  const textColor = isDark ? 'text-white' : 'text-gray-900';
  const secTextColor = isDark ? 'text-gray-400' : 'text-gray-600';
  const borderColor = isDark ? 'border-gray-900' : 'border-gray-200/50';

  return (
    <div className={`flex flex-col h-[100dvh] w-full max-w-[600px] mx-auto ${bgColor} ${textColor}`}>
      {/* Premium Header */}
      <div className={`flex-shrink-0 sticky top-0 z-50 flex items-center justify-between h-[64px] px-4 ${isDark ? 'bg-gray-950/95' : 'bg-white/95'} backdrop-blur-md border-b ${borderColor}`}>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate(-1)} 
            className={`p-2.5 -ml-2 rounded-full transition-all active:scale-90 ${isDark ? 'hover:bg-gray-900/50' : 'hover:bg-gray-100'}`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[17px] font-bold tracking-tight">
            {t('notifications.title', { defaultValue: 'Notifications' })}
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }} 
            className={`p-2.5 rounded-full transition-colors ${isDark ? 'hover:bg-gray-900/50 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'}`}
          >
            <CheckCheck className="w-5 h-5" />
          </motion.button>
          <button 
            onClick={() => navigate('/settings')} 
            className={`p-2.5 rounded-full transition-colors ${isDark ? 'hover:bg-gray-900/50 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'}`}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {/* Capsule Tab Switcher */}
        <div className={`flex-shrink-0 px-4 py-4 overflow-x-auto scrollbar-hide border-b ${borderColor}`}>
          <div className="flex space-x-2 min-w-max">
            {[
              { id: 'all', label: t('notifications.all') },
              { id: 'messages', label: t('notifications.messages'), count: messageCount },
              { id: 'matches', label: t('notifications.matches'), count: matchCount },
              { id: 'likes', label: t('notifications.likes'), count: likeCount },
              { id: 'follows', label: t('notifications.follows'), count: followCount },
              { id: 'gifts', label: t('notifications.gifts'), count: giftCount },
              { id: 'other', label: t('notifications.other'), count: otherCount }
            ].map((tab) => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as any)} 
                className={`relative px-4 py-2 rounded-2xl text-[13px] font-bold transition-all duration-300 whitespace-nowrap ${
                  activeTab === tab.id 
                    ? (isDark ? 'text-white' : 'text-gray-950') 
                    : (isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-900')
                }`}
              >
                <span className="relative z-10 flex items-center gap-2">
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-lg text-[10px] font-black transition-colors ${
                      activeTab === tab.id 
                        ? (isDark ? 'bg-white text-black' : 'bg-gray-950 text-white') 
                        : (isDark ? 'bg-gray-900 text-gray-400' : 'bg-gray-100 text-gray-600')
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </span>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeNotifTab"
                    className={`absolute inset-0 rounded-2xl border ${
                      isDark ? 'bg-gray-900/40 border-white/10' : 'bg-gray-100 border-gray-200/50'
                    }`}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <AnimatePresence mode="wait">
            {filteredNotifications.length === 0 ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-24 px-8 text-center">
                <div className={`w-[64px] h-[64px] rounded-[22px] flex items-center justify-center mb-6 ${isDark ? 'bg-gray-900/30' : 'bg-gray-50'}`}>
                  <Bell className={`w-8 h-8 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} strokeWidth={1.5} />
                </div>
                <h3 className={`text-[17px] font-bold mb-2 ${textColor}`}>{activeTab === 'all' ? t('notifications.no_notifications') : 'No updates found'}</h3>
                <p className={`text-[14px] max-w-[260px] leading-relaxed ${secTextColor}`}>Check back later for new interactions and system updates.</p>
              </motion.div>
            ) : (
              <div className="divide-y divide-transparent">
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
                    isLast={index === filteredNotifications.length - 1}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>
          <div ref={observerTarget} className="h-24 w-full" />
        </div>
      </div>
    </div>
  );
};

export default NotificationsScreen;
