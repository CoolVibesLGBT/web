import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MoreVertical } from 'lucide-react';
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
  isLast: boolean;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  markAsRead,
  onClick,
  theme,
  getNotificationIcon,
  formatTime,
  index,
  isLast
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const NotificationIcon = getNotificationIcon(notification.type);
  const isDark = theme === 'dark';

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
      className={`group relative px-4 py-5 cursor-pointer transition-all duration-300 ${
        !isLast ? `border-b ${isDark ? 'border-gray-900/40' : 'border-gray-100/60'}` : ''
      } ${
        !notification.is_read 
          ? isDark 
            ? 'bg-gradient-to-r from-white/[0.03] to-transparent hover:from-white/[0.05]' 
            : 'bg-gradient-to-r from-black/[0.015] to-transparent hover:from-black/[0.03]'
          : isDark
            ? 'hover:bg-gray-900/30'
            : 'hover:bg-gray-50/70'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Interaction Icon with Premium Backdrop */}
        <div className="relative flex-shrink-0">
          <div className={`w-12 h-12 rounded-[20px] flex items-center justify-center transition-all duration-300 transform group-hover:scale-105 ${
            isDark 
              ? 'bg-gray-900/60 group-hover:bg-gray-800' 
              : 'bg-gray-100 group-hover:bg-gray-200/50'
          }`}>
            <NotificationIcon className={`w-5 h-5 ${
              isDark ? 'text-gray-400 group-hover:text-white' : 'text-gray-500 group-hover:text-gray-900'
            }`} strokeWidth={1.5} />
          </div>
          
          {/* Avatar Pin */}
          <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full overflow-hidden border-2 group-hover:scale-110 transition-transform duration-300 ${
            isDark ? 'border-gray-950 bg-gray-900' : 'border-white bg-gray-100 shadow-sm'
          }`}>
            <img
              src={getSafeImageURLEx(notification.sender?.public_id, notification.sender?.avatar || undefined, 'thumbnail') || undefined}
              alt={notification.sender.username}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[15px] font-bold tracking-tight truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {notification.sender?.displayname || notification.sender?.username}
                </span>
                {!notification.is_read && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]' : 'bg-black'}`} 
                  />
                )}
              </div>
              
              <p className={`text-[14px] leading-[1.6] mb-2.5 font-medium ${isDark ? 'text-gray-300/90' : 'text-gray-600'}`}>
                {notification.message}
              </p>
              
              <div className="flex items-center gap-3">
                <span className={`text-[11px] font-bold uppercase tracking-wider opacity-60 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {formatTime(notification.created_at)}
                </span>
              </div>
            </div>

            {/* Subtle Menu Trigger */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
              }}
              className={`p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all ${
                isDark ? 'hover:bg-gray-800 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
              }`}
            >
              <MoreVertical className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default NotificationItem;
