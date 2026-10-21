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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        delay: index * 0.02,
        duration: 0.3,
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
      className={`group relative flex w-full cursor-pointer items-center gap-3 px-4 py-3 min-h-[64px] text-start transition-colors duration-150 hover:bg-[var(--cv-surface-2-hover)] active:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]/60 ${
        notification.is_read ? '' : 'bg-[var(--color-brand-light)]'
      }`}
    >
      {!notification.is_read && (
        <span className="absolute inset-y-3 left-0 w-0.5 rounded-r-full bg-[var(--color-brand)]" />
      )}
      <div className="relative flex-shrink-0">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-brand-light-solid)] text-[var(--color-brand)]">
          <NotificationIcon className="h-[18px] w-[18px]" strokeWidth={2} />
        </span>

        <span className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center overflow-hidden rounded-full border-2 ${
          isDark ? 'border-[var(--cv-card-bg-solid)] bg-white/[0.06]' : 'border-[var(--cv-card-bg-solid)] bg-slate-100'
        }`}>
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={notification.sender?.username || ''}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className={`text-[0.765rem] font-semibold normal-case ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
              {(notification.sender?.displayname || notification.sender?.username || '?').slice(0, 1)}
            </span>
          )}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`truncate text-[0.882rem] font-semibold leading-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>
            {notification.sender?.displayname || notification.sender?.username}
          </span>
          {!notification.is_read && (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-brand)]" />
          )}
        </div>

        <p className={`mt-0.5 line-clamp-2 text-[0.765rem] leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
          {notification.message}
        </p>
      </div>
      <span className={`shrink-0 self-start pt-0.5 text-[0.765rem] font-medium ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
        {formatTime(notification.created_at)}
      </span>
    </motion.div>
  );
};

export default NotificationItem;
