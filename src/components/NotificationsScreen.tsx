import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  UserPlus, 
  Heart, 
  MessageCircle, 
  Check, 
  MoreVertical,
  Settings,
  CheckCheck
} from 'lucide-react';
import Container from './Container';

interface Notification {
  id: number;
  type: 'follow' | 'like' | 'mention' | 'message' | 'reply' | 'repost';
  user: { 
    name: string; 
    username: string; 
    avatar: string; 
    verified: boolean;
  };
  message: string;
  time: string;
  read: boolean;
  postId?: string;
}

const NotificationsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'mentions' | 'follows'>('all');

  const notifications: Notification[] = [
    {
      id: 1,
      type: 'follow',
      user: { 
        name: 'Alex Chen', 
        username: 'alexchen', 
        avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2', 
        verified: true 
      },
      message: 'started following you',
      time: '2m',
      read: false
    },
    {
      id: 2,
      type: 'like',
      user: { 
        name: 'Jordan Lee', 
        username: 'jordanl', 
        avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2', 
        verified: false 
      },
      message: 'liked your post',
      time: '15m',
      read: false
    },
    {
      id: 3,
      type: 'mention',
      user: { 
        name: 'Sam Kim', 
        username: 'samkim', 
        avatar: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2', 
        verified: true 
      },
      message: 'mentioned you in a post',
      time: '1h',
      read: true
    },
    {
      id: 4,
      type: 'message',
      user: { 
        name: 'Taylor Swift', 
        username: 'taylorswift', 
        avatar: 'https://images.pexels.com/photos/1102341/pexels-photo-1102341.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2', 
        verified: true 
      },
      message: 'sent you a message',
      time: '2h',
      read: true
    },
    {
      id: 5,
      type: 'reply',
      user: { 
        name: 'Chris Brown', 
        username: 'chrisbrown', 
        avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2', 
        verified: false 
      },
      message: 'replied to your post',
      time: '3h',
      read: true
    },
    {
      id: 6,
      type: 'follow',
      user: { 
        name: 'Emma Watson', 
        username: 'emmawatson', 
        avatar: 'https://images.pexels.com/photos/1559486/pexels-photo-1559486.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2', 
        verified: true 
      },
      message: 'started following you',
      time: '5h',
      read: true
    },
    {
      id: 7,
      type: 'repost',
      user: { 
        name: 'Michael Johnson', 
        username: 'michaelj', 
        avatar: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2', 
        verified: false 
      },
      message: 'shared your post',
      time: '6h',
      read: true
    },
    {
      id: 8,
      type: 'like',
      user: { 
        name: 'Sarah Williams', 
        username: 'sarahw', 
        avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2', 
        verified: true 
      },
      message: 'liked your post',
      time: '1d',
      read: false
    }
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow':
        return UserPlus;
      case 'like':
        return Heart;
      case 'mention':
        return Bell;
      case 'message':
        return MessageCircle;
      case 'reply':
        return MessageCircle;
      case 'repost':
        return Bell;
      default:
        return Bell;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const mentionCount = notifications.filter(n => n.type === 'mention').length;
  const followCount = notifications.filter(n => n.type === 'follow').length;

  const filteredNotifications = activeTab === 'all' 
    ? notifications 
    : activeTab === 'mentions'
    ? notifications.filter(n => n.type === 'mention')
    : notifications.filter(n => n.type === 'follow');

  const formatTime = (time: string) => {
    if (time.endsWith('m')) {
      return `${time.replace('m', '')} min ago`;
    } else if (time.endsWith('h')) {
      return `${time.replace('h', '')} hour${parseInt(time) > 1 ? 's' : ''} ago`;
    } else if (time.endsWith('d')) {
      return `${time.replace('d', '')} day${parseInt(time) > 1 ? 's' : ''} ago`;
    }
    return time;
  };

  return (
    <Container>
      {/* Header - Sticky */}
      <div className={`sticky top-0 z-50 border-b ${
        theme === 'dark' 
          ? 'border-gray-800/50 bg-black/95 backdrop-blur-xl' 
          : 'border-gray-100/50 bg-white/95 backdrop-blur-xl'
      }`}>
        <div className="w-full px-4 lg:px-6">
          {/* Top Bar */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                theme === 'dark'
                  ? 'bg-white text-black'
                  : 'bg-black text-white'
              }`}>
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h1 className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Notifications
                </h1>
                <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                  {unreadCount} unread
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-2 rounded-full transition-colors ${
                  theme === 'dark' 
                    ? 'hover:bg-white/10 text-gray-400 hover:text-white' 
                    : 'hover:bg-black/10 text-gray-500 hover:text-gray-900'
                }`}
                title="Mark all as read"
              >
                <CheckCheck className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-2 rounded-full transition-colors ${
                  theme === 'dark' 
                    ? 'hover:bg-white/10 text-gray-400 hover:text-white' 
                    : 'hover:bg-black/10 text-gray-500 hover:text-gray-900'
                }`}
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 -mb-px">
            <button
              onClick={() => setActiveTab('all')}
              className={`relative px-6 py-3 text-sm font-bold transition-all duration-200 ${
                activeTab === 'all'
                  ? theme === 'dark'
                    ? 'text-white'
                    : 'text-black'
                  : theme === 'dark'
                  ? 'text-gray-500 hover:text-gray-300'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              All
              {activeTab === 'all' && (
                <motion.div
                  layoutId="activeTab"
                  className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                    theme === 'dark' ? 'bg-white' : 'bg-black'
                  }`}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('mentions')}
              className={`relative px-6 py-3 text-sm font-bold transition-all duration-200 ${
                activeTab === 'mentions'
                  ? theme === 'dark'
                    ? 'text-white'
                    : 'text-black'
                  : theme === 'dark'
                  ? 'text-gray-500 hover:text-gray-300'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Mentions
              {mentionCount > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                  theme === 'dark'
                    ? 'bg-white/10 text-white'
                    : 'bg-black/10 text-black'
                }`}>
                  {mentionCount}
                </span>
              )}
              {activeTab === 'mentions' && (
                <motion.div
                  layoutId="activeTab"
                  className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                    theme === 'dark' ? 'bg-white' : 'bg-black'
                  }`}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('follows')}
              className={`relative px-6 py-3 text-sm font-bold transition-all duration-200 ${
                activeTab === 'follows'
                  ? theme === 'dark'
                    ? 'text-white'
                    : 'text-black'
                  : theme === 'dark'
                  ? 'text-gray-500 hover:text-gray-300'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Follows
              {followCount > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                  theme === 'dark'
                    ? 'bg-white/10 text-white'
                    : 'bg-black/10 text-black'
                }`}>
                  {followCount}
                </span>
              )}
              {activeTab === 'follows' && (
                <motion.div
                  layoutId="activeTab"
                  className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                    theme === 'dark' ? 'bg-white' : 'bg-black'
                  }`}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="w-full">
        <AnimatePresence mode="wait">
          {filteredNotifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 px-4"
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'
              }`}>
                <Bell className={`w-8 h-8 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
              </div>
              <h3 className={`text-lg font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {activeTab === 'all' ? 'No notifications' : `No ${activeTab === 'mentions' ? 'mentions' : 'follows'} yet`}
              </h3>
              <p className={`text-sm text-center max-w-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                {activeTab === 'all' 
                  ? "You're all caught up! When you get notifications, they'll show up here."
                  : `When someone ${activeTab === 'mentions' ? 'mentions you' : 'follows you'}, you'll see it here.`
                }
              </p>
            </motion.div>
          ) : (
            <div>
              {filteredNotifications.map((notification, index) => {
                const Icon = getNotificationIcon(notification.type);
                const isLast = index === filteredNotifications.length - 1;
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.02, duration: 0.2 }}
                    onClick={() => {
                      if (notification.type === 'message') {
                        navigate('/messages');
                      } else if (notification.user.username) {
                        navigate(`/${notification.user.username}`);
                      }
                    }}
                    className={`group relative px-4 lg:px-6 py-5 cursor-pointer transition-all duration-200 ${
                      !isLast ? `border-b ${theme === 'dark' ? 'border-gray-900/30' : 'border-gray-100/50'}` : ''
                    } ${
                      !notification.read 
                        ? theme === 'dark' 
                          ? 'bg-white/[0.03] hover:bg-white/[0.05]' 
                          : 'bg-black/[0.02] hover:bg-black/[0.04]'
                        : theme === 'dark'
                          ? 'hover:bg-white/[0.02]'
                          : 'hover:bg-black/[0.02]'
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      {/* Icon Container */}
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                        theme === 'dark'
                          ? 'bg-gray-950 group-hover:bg-gray-900'
                          : 'bg-gray-50 group-hover:bg-gray-100'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                        }`} strokeWidth={2} />
                      </div>

                      {/* User Avatar */}
                      <div className="flex-shrink-0">
                        <div className="relative">
                          <div className={`w-12 h-12 rounded-full overflow-hidden ring-2 ${
                            theme === 'dark' ? 'ring-gray-800' : 'ring-gray-200'
                          }`}>
                            <img
                              src={notification.user.avatar}
                              alt={notification.user.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {notification.user.verified && (
                            <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center ring-2 ${
                              theme === 'dark' ? 'bg-black ring-black' : 'bg-white ring-white'
                            }`}>
                              <Check className={`w-2.5 h-2.5 ${
                                theme === 'dark' ? 'text-white' : 'text-black'
                              }`} strokeWidth={3} />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-1.5 mb-1 flex-wrap">
                              <span className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {notification.user.name}
                              </span>
                              {notification.user.verified && (
                                <svg 
                                  className={`w-4 h-4 flex-shrink-0 ${
                                    theme === 'dark' ? 'text-white' : 'text-black'
                                  }`} 
                                  fill="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M23 12l-2.44-2.78.34-3.68-3.61-.82-1.89-3.18L12 2.96 8.6 1.54 6.71 4.72l-3.61.82.34 3.68L1 12l2.44 2.78-.34 3.68 3.61.82 1.89 3.18L12 21.04l3.4 1.42 1.89-3.18 3.61-.82-.34-3.68L23 12zm-10.29 4.8l-4.5-4.31 1.39-1.32 3.11 2.97 5.98-6.03 1.39 1.37-7.37 7.32z"/>
                                </svg>
                              )}
                            </div>
                            <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                              {notification.message}
                            </p>
                            <span className={`text-xs mt-2 block ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                              {formatTime(notification.time)}
                            </span>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center space-x-1 flex-shrink-0">
                            {!notification.read && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className={`w-2 h-2 rounded-full ${
                                  theme === 'dark' ? 'bg-white' : 'bg-black'
                                }`}
                              />
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              className={`p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
                                theme === 'dark' 
                                  ? 'hover:bg-white/10 text-gray-500 hover:text-white' 
                                  : 'hover:bg-black/10 text-gray-400 hover:text-gray-900'
                              }`}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>
      </Container>
  );
};

export default NotificationsScreen;
