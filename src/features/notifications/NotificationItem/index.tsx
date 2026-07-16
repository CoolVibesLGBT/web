import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { getSafeImageURLEx } from '../../../helpers/helpers';

export interface Notification {
  id: string;
  sender_id: string;
  sender: {
    public_id: string;
    id: string;
    username: string;
    displayname: string;
    avatar?: string;
    [key: string]: any;
  };
  user_id: string;
  type: string;
  title: string;
  message: string;
  payload: {
    title: string;
    body: string;
    [key: string]: any;
  };
  is_read: boolean;
  is_shown: boolean;
  created_at: string;
}

interface NotificationItemProps {
  notification: Notification;
  markAsRead: (id: string) => void;
  onClick: () => void;
  theme: string;
  getNotificationIcon: (type: string) => React.ComponentType<any>;
  formatTime: (createdAt: string) => string;
  index: number;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  markAsRead,
  onClick,
  theme,
  getNotificationIcon,
  formatTime,
  index
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const NotificationIcon = getNotificationIcon(notification.type);
  const isDark = theme === 'dark';
  const avatarSrc = getSafeImageURLEx(notification.sender?.public_id, notification.sender?.avatar || undefined, 'thumbnail') || undefined;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !notification.is_read) {
          markAsRead(notification.id);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(node);
    return () => {
      observer.unobserve(node);
    };
  }, [notification.id, notification.is_read, markAsRead]);

  return (
    <motion.div
      key={notification.id}
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ 
        delay: index * 0.02, 
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1]
      }}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      className={`group relative cursor-pointer overflow-hidden rounded-2xl border p-3.5 backdrop-blur-3xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_55px_-34px_rgba(15,23,42,0.55)] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70 sm:p-4 ${
        notification.is_read
          ? isDark
            ? 'cv-card-surface-soft border-white/10'
            : 'border-white/70 bg-white/80'
          : isDark
            ? 'cv-card-surface-soft border-sky-400/25 bg-sky-500/[0.06]'
            : 'border-sky-200/80 bg-sky-50/65'
      }`}
    >
      {!notification.is_read && (
        <div className="absolute inset-y-3 left-0 w-0.5 rounded-r-full bg-sky-600 shadow-[0_0_16px_rgba(2,132,199,0.55)]" />
      )}
      <div className={`pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${isDark ? 'bg-white/[0.025]' : 'bg-white/35'}`} />
      <div className="relative z-10 flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <div className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-105 ${
            isDark 
              ? 'bg-white/5 text-zinc-400 group-hover:bg-sky-600 group-hover:text-white'
              : 'bg-slate-100 text-slate-500 group-hover:bg-sky-600 group-hover:text-white'
          }`}>
            <NotificationIcon className="h-[18px] w-[18px]" strokeWidth={1.8} />
          </div>

          <div className={`absolute -bottom-1 -right-1 h-5 w-5 overflow-hidden rounded-full border-2 transition-transform duration-300 group-hover:scale-110 ${
            isDark ? 'border-[#121418] bg-white/[0.06]' : 'border-white bg-slate-100 shadow-sm'
          }`}>
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={notification.sender?.username || ''}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className={`flex h-full w-full items-center justify-center text-[8px] font-black uppercase ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                {(notification.sender?.displayname || notification.sender?.username || '?').slice(0, 1)}
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2">
                <span className={`truncate text-sm font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>
                  {notification.sender?.displayname || notification.sender?.username}
                </span>
                {!notification.is_read && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="h-1.5 w-1.5 rounded-full bg-sky-600 shadow-[0_0_10px_rgba(2,132,199,0.7)]"
                  />
                )}
              </div>
              
              <p className={`mt-1 line-clamp-2 text-[13px] font-semibold leading-relaxed ${isDark ? 'text-zinc-300/90' : 'text-slate-600'}`}>
                {notification.message}
              </p>
            </div>
            <span className={`shrink-0 pt-0.5 text-[9px] font-black uppercase tracking-[0.16em] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
              {formatTime(notification.created_at)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default NotificationItem;
