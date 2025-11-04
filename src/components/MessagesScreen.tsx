import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AuthWizard from './AuthWizard';
import { 
  MessageCircle, 
  User, 
  Search, 
  Send, 
  MoreVertical, 
  Phone, 
  Video, 
  Image, 
  Smile,
  Paperclip,
  Mic,
  Globe,
  Check,
  CheckCheck,
  ArrowLeft,
  Star,
  Volume2,
  Info,
  Menu,
  X,
  Settings,
  PlusSquare,
  Lock
} from 'lucide-react';

const MessagesScreen: React.FC = () => {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'groups' | 'private'>('groups');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'groups' | 'unencrypted'>('all');
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
    if (!selectedChat && isMobile) {
      setShowSidebar(true);
    }
    if (selectedChat && isMobile) {
      setShowSidebar(false);
    }
  }, [selectedChat, isMobile]);

  const groupChats = [
    {
      id: 'taiwan',
      name: 'Taiwan Pride Community',
      flag: '🇹🇼',
      members: 1247,
      lastMessage: 'Happy Pride everyone! 🏳️‍🌈',
      lastTime: '2m',
      unread: 3,
      online: 89,
      pinned: true
    },
    {
      id: 'thailand',
      name: 'Thailand LGBTQ+ Network',
      flag: '🇹🇭',
      members: 892,
      lastMessage: 'Great event yesterday!',
      lastTime: '15m',
      unread: 0,
      online: 45,
      pinned: false
    },
    {
      id: 'turkey',
      name: 'Türkiye Pride Community',
      flag: '🇹🇷',
      members: 2156,
      lastMessage: 'Supporting each other! 💪',
      lastTime: '1h',
      unread: 7,
      online: 156,
      pinned: true
    },
    {
      id: 'japan',
      name: 'Japan Rainbow Network',
      flag: '🇯🇵',
      members: 678,
      lastMessage: 'Beautiful day for celebration!',
      lastTime: '2h',
      unread: 0,
      online: 34,
      pinned: false
    },
    {
      id: 'china',
      name: 'China Pride Alliance',
      flag: '🇨🇳',
      members: 1890,
      lastMessage: 'Love is love! ❤️',
      lastTime: '3h',
      unread: 12,
      online: 203,
      pinned: false
    }
  ];

  const privateChats = [
    {
      id: 'kewl',
      name: 'KEWL',
      username: 'kewlswap',
      emojis: '',
      avatar: null,
      avatarLetter: 'K',
      lastMessage: 'asda\naasd...',
      lastTime: '3 dk',
      unread: 0,
      online: true,
      verified: true,
      encrypted: false
    },
    {
      id: 'ersan',
      name: 'ersan',
      username: 'ersanyakit',
      emojis: '🐶 🐱 🦊 🦌 🐻 🐼',
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      avatarLetter: null,
      lastMessage: 'selam',
      lastTime: '3m',
      unread: 0,
      online: true,
      verified: false,
      encrypted: false
    },
    {
      id: 'alex',
      name: 'Alex Chen',
      username: 'alexchen',
      emojis: '',
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      lastMessage: 'Thanks for the support!',
      lastTime: '5m',
      unread: 2,
      online: true,
      verified: true,
      encrypted: true
    },
    {
      id: 'sam',
      name: 'Sam Kim',
      username: 'samkim',
      emojis: '',
      avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      lastMessage: 'See you at the event!',
      lastTime: '1h',
      unread: 0,
      online: false,
      verified: false,
      encrypted: true
    },
    {
      id: 'jordan',
      name: 'Jordan Lee',
      username: 'jordanlee',
      emojis: '',
      avatar: 'https://images.pexels.com/photos/1559486/pexels-photo-1559486.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      lastMessage: 'Amazing community!',
      lastTime: '2h',
      unread: 1,
      online: true,
      verified: true,
      encrypted: true
    }
  ];

  const emojis = ['😊', '😂', '❤️', '👍', '🎉', '🔥', '💯', '✨', '🏳️‍🌈', '💪', '😍', '🤔', '😭', '😡', '🤗', '👏', '🙏', '💖', '💕', '💔', '😎', '🤩', '😴', '🤯', '🥳', '😇', '🤠', '👻', '🤖', '👽', '👾'];

  const selectedGroupChat = groupChats.find(chat => chat.id === selectedChat);
  const selectedPrivateChat = privateChats.find(chat => chat.id === selectedChat);

  const handleSendMessage = () => {
    if (message.trim() || selectedFiles.length > 0) {
      setMessage('');
      setSelectedFiles([]);
      setIsTyping(false);
      setShowEmojiPicker(false);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    setIsTyping(e.target.value.length > 0);
  };

  const handleChatSelect = (chatId: string) => {
    setSelectedChat(chatId);
    setShowSidebar(false);
  };

  const handleEmojiClick = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []).filter(file => file.type.startsWith('image/'));
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // If not authenticated, show inline auth wizard
  if (!isAuthenticated) {
    return (
      <div className={`h-[100dvh] w-full overflow-hidden flex flex-col ${theme === 'dark' ? 'bg-black' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-center flex-1 px-4">
          <div className="w-full max-w-lg">
            <AuthWizard
              isOpen={true}
              onClose={() => {
                // If user closes auth wizard, navigate to home
                navigate('/');
              }}
              mode="inline"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-[100dvh] w-full overflow-hidden flex flex-col ${theme === 'dark' ? 'bg-black' : 'bg-gray-50'}`}>
      <div className="h-full w-full flex-1 overflow-hidden flex">
        <div className="flex h-full w-full flex-1 overflow-hidden">
          {/* Sidebar - Responsive Design */}
          <div className={`absolute lg:relative inset-0 z-40 lg:z-auto w-full lg:w-80 border-r ${
            theme === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
          } ${showSidebar ? 'block' : 'hidden lg:block'}`}>
            {/* Header */}
            <div className={`sticky top-0 z-40 p-3 sm:p-4 border-b ${
              theme === 'dark' 
                ? 'border-gray-800 bg-black/95 backdrop-blur-xl' 
                : 'border-gray-200 bg-white/95 backdrop-blur-xl'
            }`}>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h1 className={`text-lg sm:text-xl font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Chat</h1>
                <div className="flex items-center space-x-2">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-2 rounded-lg transition-colors ${
                      theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/10'
                    }`}
                  >
                    <Settings className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-2 rounded-lg transition-colors ${
                      theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/10'
                    }`}
                  >
                    <PlusSquare className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
                  </motion.button>
                  <motion.button 
                    onClick={() => setShowSidebar(false)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="lg:hidden p-2 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
              
              {/* Search */}
              <div className="relative mb-3 sm:mb-4">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  type="text"
                  placeholder="Search"
                  className={`w-full pl-10 pr-4 py-2 sm:py-3 rounded-full border-0 text-sm ${
                    theme === 'dark' 
                      ? 'bg-gray-800 text-white placeholder-gray-400' 
                      : 'bg-gray-100 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-nowrap">
                <motion.button
                  onClick={() => setActiveFilter('all')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                    activeFilter === 'all'
                      ? theme === 'dark'
                        ? 'bg-white text-black'
                        : 'bg-black text-white'
                      : theme === 'dark'
                      ? 'bg-gray-800 text-gray-400'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Tümü
                </motion.button>
                <motion.button
                  onClick={() => setActiveFilter('unread')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                    activeFilter === 'unread'
                      ? theme === 'dark'
                        ? 'bg-white text-black'
                        : 'bg-black text-white'
                      : theme === 'dark'
                      ? 'bg-gray-800 text-gray-400'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Okunmamış
                </motion.button>
                <motion.button
                  onClick={() => setActiveFilter('groups')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                    activeFilter === 'groups'
                      ? theme === 'dark'
                        ? 'bg-white text-black'
                        : 'bg-black text-white'
                      : theme === 'dark'
                      ? 'bg-gray-800 text-gray-400'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Gruplar
                </motion.button>
                <motion.button
                  onClick={() => setActiveFilter('unencrypted')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                    activeFilter === 'unencrypted'
                      ? theme === 'dark'
                        ? 'bg-white text-black'
                        : 'bg-black text-white'
                      : theme === 'dark'
                      ? 'bg-gray-800 text-gray-400'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Şifrelenmemiş
                </motion.button>
              </div>
            </div>

            {/* Chat List */}
            <div className="h-[calc(100%-180px)] sm:h-[calc(100%-200px)] overflow-y-auto scrollbar-hide">
              {privateChats.filter((chat: any) => {
                if (activeFilter === 'all') return true;
                if (activeFilter === 'unread') return chat.unread > 0;
                if (activeFilter === 'unencrypted') return !chat.encrypted;
                return true;
              }).length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400 text-center p-8">
                  No chats found.
                </div>
              ) : privateChats.filter((chat: any) => {
                if (activeFilter === 'all') return true;
                if (activeFilter === 'unread') return chat.unread > 0;
                if (activeFilter === 'unencrypted') return !chat.encrypted;
                return true;
              }).map((chat: any) => (
                <div
                  key={chat.id}
                  onClick={() => handleChatSelect(chat.id)}
                  className={`p-3 sm:p-4 cursor-pointer transition-colors border-b ${
                    theme === 'dark' ? 'border-gray-800' : 'border-gray-100'
                  } ${
                    selectedChat === chat.id
                      ? theme === 'dark'
                        ? 'bg-gray-800'
                        : 'bg-gray-100'
                      : theme === 'dark'
                      ? 'hover:bg-gray-800/50'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="relative flex-shrink-0">
                      {chat.avatar ? (
                        <img
                          src={chat.avatar}
                          alt={chat.name}
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover"
                        />
                      ) : (
                        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-lg font-bold ${
                          theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-black text-white'
                        }`}>
                          {chat.avatarLetter || chat.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {!chat.encrypted && (
                        <Lock className={`absolute -bottom-1 left-0 w-3 h-3 ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`} />
                      )}
                      {chat.online && (
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 border-2 rounded-full ${
                          theme === 'dark' ? 'bg-white border-black' : 'bg-black border-white'
                        }`}></div>
                      )}
                      {chat.verified && (
                        <Check className={`absolute -top-1 -right-1 w-4 h-4 ${
                          theme === 'dark' ? 'text-white' : 'text-black'
                        }`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center min-w-0 flex-1">
                          <h3 className={`font-semibold truncate text-sm sm:text-base ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>{chat.name}</h3>
                          {chat.emojis && (
                            <span className="ml-1 text-xs sm:text-sm">{chat.emojis}</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                          <span className={`text-xs ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}>{chat.lastTime}</span>
                          {chat.unread === 0 && (
                            <CheckCheck className={`w-3 h-3 ${
                              theme === 'dark' ? 'text-white' : 'text-black'
                            }`} />
                          )}
                        </div>
                      </div>
                      <div className="mt-1">
                        {(chat.lastMessage || '').split('\n').slice(0, 2).map((line: string, idx: number) => (
                          <p key={idx} className={`text-xs sm:text-sm truncate ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>{line}</p>
                        ))}
                      </div>
                      {chat.unread > 0 && (
                        <div className="flex justify-end mt-1 sm:mt-2">
                          <span className={`text-white text-xs px-2 py-1 rounded-full ${
                            theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'
                          }`}>
                            {chat.unread}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <AnimatePresence mode="wait">
            {selectedChat ? (
              <motion.div
                key="chat-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ 
                  type: 'spring',
                  stiffness: 300,
                  damping: 30
                }}
                className="flex-1 flex flex-col h-full w-full relative z-10 overflow-hidden"
              >
                {/* Chat Header */}
                <div className={`sticky top-0 z-40 p-3 sm:p-4 border-b ${
                  theme === 'dark' 
                    ? 'border-gray-800 bg-black/95 backdrop-blur-xl' 
                    : 'border-gray-200 bg-white/95 backdrop-blur-xl'
                }`}>
                  <div className="flex items-center">
                    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                      {/* Mobile back button */}
                      <motion.button 
                        onClick={() => {
                          setSelectedChat(null);
                          setShowSidebar(true);
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="lg:hidden p-2 rounded-lg flex-shrink-0 mr-1"
                      >
                        <ArrowLeft className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
                      </motion.button>
                      
                      {selectedPrivateChat ? (
                        <>
                          <div className="relative flex-shrink-0">
                            {selectedPrivateChat.avatar ? (
                              <img
                                src={selectedPrivateChat.avatar}
                                alt={selectedPrivateChat.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-bold ${
                                theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-black text-white'
                              }`}>
                                {selectedPrivateChat.avatarLetter || selectedPrivateChat.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <h2 className={`font-semibold truncate text-base ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>{selectedPrivateChat.name}</h2>
                              {selectedPrivateChat.emojis && (
                                <span className="text-base">{selectedPrivateChat.emojis}</span>
                              )}
                              {selectedPrivateChat.verified && (
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  theme === 'dark' ? 'bg-white' : 'bg-black'
                                }`}>
                                  <Check className={`w-2.5 h-2.5 ${
                                    theme === 'dark' ? 'text-black' : 'text-white'
                                  }`} />
                                </div>
                              )}
                            </div>
                            <p className={`text-sm truncate mt-0.5 ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                            }`}>@{selectedPrivateChat.username || selectedPrivateChat.name.toLowerCase()}</p>
                          </div>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className={`flex-1 overflow-y-auto p-3 sm:p-4 scrollbar-hide ${
                  theme === 'dark' 
                    ? 'bg-black' 
                    : 'bg-white'
                }`} style={{ paddingBottom: selectedFiles.length > 0 ? (isMobile ? 240 : 160) : (isMobile ? 168 : 88) }}>
                  <div className="space-y-3 max-w-4xl mx-auto">
                    {/* Date Separator */}
                    <div className="flex justify-center my-6">
                      <div className={`px-3 py-1 rounded-full ${
                        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'
                      }`}>
                        <span className={`text-xs font-medium ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>Bugün</span>
                      </div>
                    </div>

                    {/* Incoming message */}
                    <div className="flex justify-start group">
                      <div className={`max-w-[75%] sm:max-w-xs md:max-w-sm px-4 py-2.5 rounded-2xl shadow-sm ${
                        theme === 'dark' 
                          ? 'bg-gray-800 text-white' 
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`} style={{ 
                        borderBottomLeftRadius: '4px',
                        borderTopLeftRadius: '16px',
                        borderTopRightRadius: '16px',
                        borderBottomRightRadius: '16px'
                      }}>
                        <p className="text-sm leading-relaxed mb-1">selam</p>
                        <div className="flex items-center mt-1.5">
                          <span className={`text-[11px] ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}>00:24</span>
                        </div>
                      </div>
                    </div>

                    {/* Outgoing messages */}
                    <div className="flex justify-end group">
                      <div className={`max-w-[75%] sm:max-w-xs md:max-w-sm px-4 py-2.5 rounded-2xl shadow-sm ${
                        theme === 'dark' 
                          ? 'bg-gray-800 text-white' 
                          : 'bg-black text-white'
                      }`} style={{ 
                        borderBottomRightRadius: '4px',
                        borderTopLeftRadius: '16px',
                        borderTopRightRadius: '16px',
                        borderBottomLeftRadius: '16px'
                      }}>
                        <p className="text-sm leading-relaxed mb-1">naber</p>
                        <div className="flex items-center justify-end mt-1.5 gap-1.5">
                          <span className={`text-[11px] ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-300'
                          }`}>00:33</span>
                          <CheckCheck className={`w-3.5 h-3.5 ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-300'
                          }`} />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end group">
                      <div className={`max-w-[75%] sm:max-w-xs md:max-w-sm px-4 py-2.5 rounded-2xl shadow-sm ${
                        theme === 'dark' 
                          ? 'bg-gray-800 text-white' 
                          : 'bg-black text-white'
                      }`} style={{ 
                        borderBottomRightRadius: '4px',
                        borderTopLeftRadius: '16px',
                        borderTopRightRadius: '16px',
                        borderBottomLeftRadius: '16px'
                      }}>
                        <div className="text-sm leading-relaxed mb-1">
                          <p>asda</p>
                          <p>aasd</p>
                          <p>asdad</p>
                          <p>asda</p>
                          <p>asda</p>
                        </div>
                        <div className="flex items-center justify-end mt-1.5 gap-1.5">
                          <span className={`text-[11px] ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-300'
                          }`}>00:38</span>
                          <CheckCheck className={`w-3.5 h-3.5 ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-300'
                          }`} />
                        </div>
                      </div>
                    </div>

                    {/* Typing indicator */}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className={`max-w-[75%] sm:max-w-xs md:max-w-sm px-4 py-2.5 rounded-2xl shadow-sm ${
                          theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900 border border-gray-200'
                        }`} style={{ 
                          borderBottomLeftRadius: '4px',
                          borderTopLeftRadius: '16px',
                          borderTopRightRadius: '16px',
                          borderBottomRightRadius: '16px'
                        }}>
                          <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                              <div className={`w-2 h-2 rounded-full animate-bounce ${
                                theme === 'dark' ? 'bg-gray-400' : 'bg-gray-600'
                              }`}></div>
                              <div className={`w-2 h-2 rounded-full animate-bounce ${
                                theme === 'dark' ? 'bg-gray-400' : 'bg-gray-600'
                              }`} style={{ animationDelay: '0.2s' }}></div>
                              <div className={`w-2 h-2 rounded-full animate-bounce ${
                                theme === 'dark' ? 'bg-gray-400' : 'bg-gray-600'
                              }`} style={{ animationDelay: '0.4s' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Files Preview */}
                {selectedFiles.length > 0 && (
                  <div className={`sticky bottom-[64px] sm:bottom-[72px] p-3 sm:p-4 border-t z-40 ${
                    theme === 'dark' ? 'border-gray-800 bg-black/95 backdrop-blur-xl' : 'border-gray-200 bg-white/95 backdrop-blur-xl'
                  }`}>
                    <div className="space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className={`flex items-center justify-between p-2 rounded-lg ${
                          theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                        }`}>
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            {file.type.startsWith('image/') ? (
                              <img
                                src={URL.createObjectURL(file)}
                                alt={file.name}
                                className="w-8 h-8 rounded object-cover"
                              />
                            ) : (
                              <Paperclip className="w-4 h-4" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className={`text-sm truncate ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>{file.name}</p>
                              <p className={`text-xs ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                              }`}>{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <motion.button
                            onClick={() => removeFile(index)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className={`p-1 rounded ${
                              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                            }`}
                          >
                            <X className="w-4 h-4" />
                          </motion.button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message Input */}
                <div className={`sticky bottom-0 p-3 sm:p-4 border-t z-40 ${
                  theme === 'dark' ? 'border-gray-800 bg-black/95 backdrop-blur-xl' : 'border-gray-200 bg-white/95 backdrop-blur-xl'
                }`} style={{ paddingBottom: isMobile ? '80px' : undefined }}>
                  <div className="flex items-center space-x-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <input
                      ref={imageInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <div className="flex-1 relative">
                      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                        <motion.button 
                          onClick={() => fileInputRef.current?.click()}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className={`p-1.5 rounded-full ${
                            theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                          }`}
                        >
                          <PlusSquare className={`w-4 h-4 ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`} />
                        </motion.button>
                        <motion.button 
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className={`p-1.5 rounded-full ${
                            theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                          }`}
                        >
                          <Smile className={`w-4 h-4 ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`} />
                        </motion.button>
                      </div>
                      <input
                        type="text"
                        value={message}
                        onChange={handleTyping}
                        placeholder="Unencrypted message"
                        className={`w-full pl-20 pr-12 py-2 sm:py-3 rounded-full border-0 text-sm ${
                          theme === 'dark' 
                            ? 'bg-gray-800 text-white placeholder-gray-400' 
                            : 'bg-gray-100 text-gray-900 placeholder-gray-500'
                        }`}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      />
                      <motion.button
                        onClick={handleSendMessage}
                        disabled={!message.trim() && selectedFiles.length === 0}
                        whileTap={{ scale: 0.95 }}
                        className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full transition-all hover:scale-105 ${
                          (message.trim() || selectedFiles.length > 0)
                            ? theme === 'dark'
                              ? 'bg-white text-black'
                              : 'bg-black text-white'
                            : theme === 'dark'
                            ? 'bg-gray-700 text-gray-500'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        <Send className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>

                  {/* Emoji Picker */}
                  {showEmojiPicker && (
                    <div className={`mt-2 p-3 rounded-lg border ${
                      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}>
                      <div className="grid grid-cols-8 gap-2">
                        {emojis.map((emoji, index) => (
                          <motion.button
                            key={index}
                            onClick={() => handleEmojiClick(emoji)}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            className={`p-2 text-lg rounded ${
                              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                            }`}
                          >
                            {emoji}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="chat-list-placeholder"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ 
                  type: 'spring',
                  stiffness: 300,
                  damping: 30
                }}
                className="flex-1 flex flex-col h-full w-full relative z-10 overflow-hidden"
              >
                {!isMobile ? (
                <div className={`flex-1 flex items-center justify-center ${
                  theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
                }`}>
                  <div className="text-center px-4">
                    <MessageCircle className={`w-16 h-16 mx-auto mb-4 ${
                      theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                    }`} />
                    <h2 className={`text-xl font-semibold mb-2 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>Select a conversation</h2>
                    <p className={`${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>Choose a group or private chat to start messaging</p>
                  </div>
                </div>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default MessagesScreen; 