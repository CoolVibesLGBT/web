import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthWizard from './AuthWizard';
import ProfileScreen from './ProfileScreen';
import { api } from '../services/api';
import { Actions } from '../services/actions';
import { 
  MessageCircle, 
  Search, 
  Send, 
  MoreVertical, 
  Smile,
  Paperclip,
  Check,
  CheckCheck,
  ArrowLeft,
  X,
  Settings,
  PlusSquare,
  Lock,
  Trash2,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import { parseJSON } from 'date-fns';

interface MessageItemProps {
  msg: { id: string; text: string; time: string; sender: 'me' | 'other'; files?: Array<{ url: string; type: string; name: string }> };
  theme: 'dark' | 'light';
  onDelete: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({ msg, theme, onDelete, onContextMenu }) => {
  const [dragX, setDragX] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);

  return (
    <div 
      className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'} group relative overflow-visible`}
      onContextMenu={(e) => onContextMenu(e, msg.id)}
    >
      {/* Delete Action Background */}
      {dragX < -50 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`absolute ${msg.sender === 'me' ? 'right-0' : 'left-0'} top-0 bottom-0 flex items-center justify-center px-4 ${
            theme === 'dark' ? 'bg-red-600' : 'bg-red-500'
          }`}
          style={{
            width: '80px',
            height: '100%',
            borderRadius: msg.sender === 'me' ? '0 16px 16px 0' : '16px 0 0 16px'
          }}
        >
          <Trash2 className="w-5 h-5 text-white" />
        </motion.div>
      )}
      
      {/* Message */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={0.2}
        onDrag={(_e, info) => {
          setDragX(info.offset.x);
          setIsDragging(true);
        }}
        onDragEnd={(_e, info) => {
          setIsDragging(false);
          // If swiped left enough (more than 80px), delete the message
          if (info.offset.x < -80) {
            onDelete(msg.id);
          }
          // Reset position
          setDragX(0);
        }}
        animate={{
          x: isDragging ? dragX : 0,
          opacity: Math.abs(dragX) > 80 ? 0.7 : 1
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
          restDelta: 0.01
        }}
        className={`max-w-[75%] sm:max-w-xs md:max-w-sm px-4 py-2.5 rounded-2xl shadow-sm cursor-pointer relative z-10 ${
          theme === 'dark' 
            ? msg.sender === 'me'
              ? 'bg-gray-800 text-white'
              : 'bg-gray-800 text-white'
            : msg.sender === 'me'
            ? 'bg-black text-white'
            : 'bg-white text-gray-900 border border-gray-200'
        }`}
        style={{ 
          borderBottomLeftRadius: msg.sender === 'me' ? '16px' : '4px',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          borderBottomRightRadius: msg.sender === 'me' ? '4px' : '16px'
        }}
      >
        {/* Media Files */}
        {msg.files && msg.files.length > 0 && (
          <div className="mb-2 space-y-2">
            {msg.files.map((file, idx) => (
              <div key={idx} className="relative rounded-lg overflow-hidden">
                {file.type.startsWith('image/') ? (
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-full max-w-xs rounded-lg object-cover"
                    style={{ maxHeight: '300px' }}
                  />
                ) : file.type.startsWith('video/') ? (
                  <video
                    src={file.url}
                    controls
                    className="w-full max-w-xs rounded-lg object-cover"
                    style={{ maxHeight: '300px' }}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className={`p-4 rounded-lg flex items-center space-x-3 ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <Paperclip className={`w-5 h-5 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>{file.name}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Text Content */}
        {msg.text && (
          <div className={`text-sm leading-relaxed mb-1 ${msg.text.includes('\n') ? '' : ''}`}>
            {msg.text.split('\n').map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}
          </div>
        )}
        
        {/* Time and Status */}
        <div className={`flex items-center ${msg.sender === 'me' ? 'justify-end' : ''} mt-1.5 gap-1.5`}>
          <span className={`text-[11px] ${
            theme === 'dark' 
              ? msg.sender === 'me' ? 'text-gray-400' : 'text-gray-400'
              : msg.sender === 'me' ? 'text-gray-300' : 'text-gray-500'
          }`}>{msg.time}</span>
          {msg.sender === 'me' && (
            <CheckCheck className={`w-3.5 h-3.5 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-300'
            }`} />
          )}
        </div>
      </motion.div>
    </div>
  );
};

const MessagesScreen: React.FC = () => {
  const { theme } = useTheme();
  const { isAuthenticated, user,token } = useAuth();
  const { setShowBottomBar } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
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
  const [inputHeight, setInputHeight] = useState(0);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [messageMenuPosition, setMessageMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [openChatItemMenu, setOpenChatItemMenu] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [isRefreshingMessages, setIsRefreshingMessages] = useState(false);
  const { socket, connected } = useSocket();


  
  useEffect(() => {

    console.log("selectedChat",selectedChat)
    if (!socket) return;

    if(selectedChat){
      //socket.emit('auth', token); // 'room1' yerine istediğin kanal adı
    }
    socket.on('message', (msg: string) => {
      var _json : any  = parseJSON(msg)
      var action = _json?.action;
      var data = _json?.message

      console.dir(_json)
      //setMessages(prev => [...prev, msg]);
    });

    socket.on('chat', (msg: string) => {
      console.log("coder",msg)
      //setMessages(prev => [...prev, msg]);
    });

    // Cleanup: bileşen kapanınca event listener'ı kaldır
    return () => {
      socket.off('message');
    };
  }, [socket,selectedChat]);


  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate input height for mobile padding
  useEffect(() => {
    if (isMobile && inputContainerRef.current && selectedChat) {
      const updateHeight = () => {
        if (inputContainerRef.current) {
          setInputHeight(inputContainerRef.current.offsetHeight);
        }
      };
      updateHeight();
      window.addEventListener('resize', updateHeight);
      // Use MutationObserver to watch for height changes (emoji picker, file preview)
      const observer = new MutationObserver(updateHeight);
      if (inputContainerRef.current) {
        observer.observe(inputContainerRef.current, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['style', 'class']
        });
      }
      return () => {
        window.removeEventListener('resize', updateHeight);
        observer.disconnect();
      };
    }
  }, [isMobile, selectedChat, selectedFiles, showEmojiPicker]);

  React.useEffect(() => {
    if (!selectedChat && isMobile) {
      setShowSidebar(true);
    }
    if (selectedChat && isMobile) {
      setShowSidebar(false);
    }
  }, [selectedChat, isMobile]);

  // Handle navigation state to open chat from MatchScreen
  React.useEffect(() => {
    const state = location.state as { openChat?: string; userId?: string; publicId?: number; username?: string } | null;
    if (state?.openChat || state?.userId || state?.publicId) {
      // Find chat by chat ID, username, or user ID
      setChatsList(prev => {
        const chatToOpen = prev.find(chat => {
          // First try to find by real chat ID (from newly created chat)
          if (state.openChat && (chat.chatId === state.openChat || chat.id === state.openChat)) {
            return true;
          }
          // Then try username
          if (state.username && chat.username === state.username) {
            return true;
          }
          // Then try user ID
          if (state.userId && chat.id === state.userId) {
            return true;
          }
          return false;
        });

        if (chatToOpen) {
          setSelectedChat(chatToOpen.id);
          setShowSidebar(false);
          return prev;
        } else {
          // Chat doesn't exist in list, create a temporary entry
          // state.openChat must be the real chat ID from backend (from MatchScreen)
          if (!state.openChat) {
            console.error('Cannot create chat entry without chat ID');
            return prev;
          }
          
          const realChatId = state.openChat; // Real chat ID from backend
          const displayId = state.userId || state.openChat || `temp-${Date.now()}`;
          const chatName = state.username || state.openChat || 'User';
          const newChat = {
            id: displayId,
            chatId: realChatId, // Real chat ID from backend - required for sending messages
            name: chatName,
            username: state.username || chatName.toLowerCase(),
            emojis: '',
            avatar: null as null,
            avatarLetter: chatName.charAt(0).toUpperCase(),
            lastMessage: '',
            lastTime: 'now',
            unread: 0,
            online: true,
            verified: false,
            encrypted: false
          };
          
          // Add to chat list if not already present
          if (!prev.find(c => c.id === displayId || c.chatId === realChatId)) {
            setSelectedChat(displayId);
            setShowSidebar(false);
            return [newChat, ...prev];
          }
          return prev;
        }
      });

      // Clear navigation state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  // Fetch chats from backend
  React.useEffect(() => {
    const fetchChats = async () => {
      if (!isAuthenticated || !user?.id) {
        return;
      }

      try {
        setIsLoadingChats(true);
        const response = await api.call<{
          chats?: Array<{
            id: string;
            type: string;
            participants?: Array<{
              user_id: string;
              user?: {
                id: string;
                username?: string;
                displayname?: string;
                avatar?: {
                  file?: {
                    url?: string;
                  };
                };
                public_id?: number;
              };
            }>;
            title?: { en?: string; tr?: string };
            last_message?: {
              content?: string;
              created_at?: string;
            };
            unread_count?: number;
          }>;
        }>(Actions.CMD_FETCH_CHATS, {
          method: "POST",
          body: {},
        });

        if (response?.chats && Array.isArray(response.chats)) {
          const mappedChats = response.chats.map((chat) => {
            // For private chats, find the other participant (not current user)
            const otherParticipant = chat.participants?.find(
              (p) => p.user_id !== user.id
            );

            const otherUser = otherParticipant?.user;
            const displayName = otherUser?.displayname || otherUser?.username || 'Unknown';
            const username = otherUser?.username || '';
            const avatar = otherUser?.avatar?.file?.url || null;
            const avatarLetter = displayName.charAt(0).toUpperCase();

            // Format last message time
            let lastTime = 'now';
            if (chat.last_message?.created_at) {
              const messageDate = new Date(chat.last_message.created_at);
              const now = new Date();
              const diffMs = now.getTime() - messageDate.getTime();
              const diffMins = Math.floor(diffMs / 60000);
              const diffHours = Math.floor(diffMs / 3600000);
              const diffDays = Math.floor(diffMs / 86400000);

              if (diffMins < 1) {
                lastTime = 'now';
              } else if (diffMins < 60) {
                lastTime = `${diffMins} dk`;
              } else if (diffHours < 24) {
                lastTime = `${diffHours} sa`;
              } else if (diffDays < 7) {
                lastTime = `${diffDays} g`;
              } else {
                lastTime = messageDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
              }
            }

            return {
              id: otherUser?.id || chat.id, // Use user ID for display, fallback to chat ID
              chatId: chat.id, // Real chat ID from backend (UUID)
              name: displayName,
              username: username,
              emojis: '',
              avatar: avatar,
              avatarLetter: avatar ? null : avatarLetter,
              lastMessage: chat.last_message?.content || '',
              lastTime: lastTime,
              unread: chat.unread_count || 0,
              online: false, // TODO: Get online status from backend if available
              verified: false, // TODO: Get verified status from backend if available
              encrypted: chat.type !== 'private', // Assume group/channel chats are encrypted
            };
          });

          setChatsList(mappedChats);
        }
      } catch (error) {
        console.error('Error fetching chats:', error);
      } finally {
        setIsLoadingChats(false);
      }
    };

    fetchChats();
  }, [isAuthenticated, user?.id]);

  // Ensure bottom bar is visible when component first mounts (chat list view)
  React.useEffect(() => {
    setShowBottomBar(true);
  }, [setShowBottomBar]);

  // Show/hide bottom bar based on selectedChat state
  React.useEffect(() => {
    // Show bottom bar if chat list is visible (no selected chat), hide if in chat view
    setShowBottomBar(!selectedChat);
    return () => {
      // Show bottom bar when leaving messages screen
      setShowBottomBar(true);
    };
  }, [selectedChat, setShowBottomBar]);

  // Group chats - will be used in future
  // const groupChats = [
  //   {
  //     id: 'taiwan',
  //     name: 'Taiwan Pride Community',
  //     flag: '🇹🇼',
  //     members: 1247,
  //     lastMessage: 'Happy Pride everyone! 🏳️‍🌈',
  //     lastTime: '2m',
  //     unread: 3,
  //     online: 89,
  //     pinned: true
  //   },
  //   {
  //     id: 'thailand',
  //     name: 'Thailand LGBTQ+ Network',
  //     flag: '🇹🇭',
  //     members: 892,
  //     lastMessage: 'Great event yesterday!',
  //     lastTime: '15m',
  //     unread: 0,
  //     online: 45,
  //     pinned: false
  //   },
  //   {
  //     id: 'turkey',
  //     name: 'Türkiye Pride Community',
  //     flag: '🇹🇷',
  //     members: 2156,
  //     lastMessage: 'Supporting each other! 💪',
  //     lastTime: '1h',
  //     unread: 7,
  //     online: 156,
  //     pinned: true
  //   },
  //   {
  //     id: 'japan',
  //     name: 'Japan Rainbow Network',
  //     flag: '🇯🇵',
  //     members: 678,
  //     lastMessage: 'Beautiful day for celebration!',
  //     lastTime: '2h',
  //     unread: 0,
  //     online: 34,
  //     pinned: false
  //   },
  //   {
  //     id: 'china',
  //     name: 'China Pride Alliance',
  //     flag: '🇨🇳',
  //     members: 1890,
  //     lastMessage: 'Love is love! ❤️',
  //     lastTime: '3h',
  //     unread: 12,
  //     online: 203,
  //     pinned: false
  //   }
  // ];

  const [chatsList, setChatsList] = useState<Array<{
    id: string;
    chatId: string | null;
    name: string;
    username: string;
    emojis: string;
    avatar: string | null;
    avatarLetter: string | null;
    lastMessage: string;
    lastTime: string;
    unread: number;
    online: boolean;
    verified: boolean;
    encrypted: boolean;
  }>>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);

  const emojis = ['😊', '😂', '❤️', '👍', '🎉', '🔥', '💯', '✨', '🏳️‍🌈', '💪', '😍', '🤔', '😭', '😡', '🤗', '👏', '🙏', '💖', '💕', '💔', '😎', '🤩', '😴', '🤯', '🥳', '😇', '🤠', '👻', '🤖', '👽', '👾'];

  const selectedPrivateChat = chatsList.find(chat => chat.id === selectedChat);

  // Messages state - will be replaced with actual data later
  const [messages, setMessages] = useState<Array<{ id: string; text: string; time: string; sender: 'me' | 'other'; files?: Array<{ url: string; type: string; name: string }> }>>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Fetch messages function (can be called manually or automatically)
  const fetchMessages = React.useCallback(async (showRefreshing = false) => {
    if (!selectedChat || !user?.id) {
      setMessages([]);
      return;
    }

    // Find the selected chat to get the real chat ID
    const currentChat = chatsList.find(chat => chat.id === selectedChat);
    
    if (!currentChat?.chatId) {
      console.error('Cannot fetch messages - chat ID not found', { selectedChat, currentChat });
      setMessages([]);
      return;
    }

    const realChatId = currentChat.chatId;

    // Validate that chatId is a UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(realChatId)) {
      console.error('Invalid chat ID format - cannot fetch messages', { chatId: realChatId });
      setMessages([]);
      return;
    }

    try {
      if (showRefreshing) {
        setIsRefreshingMessages(true);
      } else {
        setIsLoadingMessages(true);
      }
        const response = await api.call<{
          messages?: Array<{
            id: string;
            public_id?: string;
            author_id: string;
            content?: {
              en?: string;
              tr?: string;
              [key: string]: string | undefined;
            };
            text?: string;
            created_at: string;
            updated_at?: string;
            deleted_at?: string | null;
            author?: {
              id: string;
              username?: string;
              displayname?: string;
            };
            attachments?: Array<{
              id: string;
              file?: {
                url?: string;
                mime_type?: string;
                name?: string;
              };
              url?: string;
              type?: string;
              name?: string;
            }>;
            files?: Array<{
              url: string;
              type: string;
              name: string;
            }>;
          }>;
          success?: boolean;
        }>(Actions.CMD_FETCH_MESSAGES, {
          method: "POST",
          body: {
            chat_id: realChatId,
          },
        });

        if (response?.messages && Array.isArray(response.messages)) {
          const mappedMessages = response.messages.map((msg) => {
            // Determine if message is from current user
            const isFromMe = msg.author_id === user.id;

            // Get message content - handle both object format {en: "...", tr: "..."} and string format
            let messageText = '';
            if (typeof msg.content === 'string') {
              messageText = msg.content;
            } else if (msg.content && typeof msg.content === 'object') {
              // Try to get content in preferred language (en first, then tr, then any available)
              messageText = msg.content.en || msg.content.tr || Object.values(msg.content).find(v => v && typeof v === 'string') || '';
            }
            // Fallback to text field if content is empty
            if (!messageText && msg.text) {
              messageText = msg.text;
            }

            // Format time
            let messageTime = '00:00';
            if (msg.created_at) {
              const messageDate = new Date(msg.created_at);
              messageTime = messageDate.toLocaleTimeString('tr-TR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              });
            }

            // Map attachments/files
            let files: Array<{ url: string; type: string; name: string }> | undefined = undefined;
            if (msg.attachments && msg.attachments.length > 0) {
              files = msg.attachments.map((att) => ({
                url: att.file?.url || att.url || '',
                type: att.file?.mime_type || att.type || 'application/octet-stream',
                name: att.file?.name || att.name || 'file'
              }));
            } else if (msg.files && msg.files.length > 0) {
              files = msg.files;
            }

            return {
              id: msg.id,
              text: messageText,
              time: messageTime,
              sender: isFromMe ? 'me' as const : 'other' as const,
              files: files
            };
          });

          // Sort messages by created_at (oldest first)
          mappedMessages.sort((a, b) => {
            const msgA = response.messages?.find(m => m.id === a.id);
            const msgB = response.messages?.find(m => m.id === b.id);
            if (!msgA?.created_at || !msgB?.created_at) return 0;
            return new Date(msgA.created_at).getTime() - new Date(msgB.created_at).getTime();
          });

          setMessages(mappedMessages);
        } else {
          setMessages([]);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        setMessages([]);
      } finally {
        setIsLoadingMessages(false);
        setIsRefreshingMessages(false);
      }
  }, [selectedChat, chatsList, user?.id]);

  // Fetch messages when chat is selected
  React.useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Handle refresh messages
  const handleRefreshMessages = () => {
    if (!isRefreshingMessages && !isLoadingMessages) {
      fetchMessages(true);
    }
  };

  // Handle message deletion
  const handleDeleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    setSelectedMessageId(null);
    setMessageMenuPosition(null);
  };

  // Handle chat deletion
  const handleDeleteChat = (chatId: string) => {
    if (selectedChat === chatId) {
      setSelectedChat(null);
    }
    setChatsList(prev => prev.filter(chat => chat.id !== chatId));
  };

  // Clear chat history
  const handleClearChatHistory = () => {
    if (selectedChat) {
      setMessages([]);
    }
  };

  // Handle message context menu
  const handleMessageContextMenu = (e: React.MouseEvent, messageId: string) => {
    e.preventDefault();
    setSelectedMessageId(messageId);
    setMessageMenuPosition({ x: e.clientX, y: e.clientY });
  };

  // Close message menu on outside click
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.message-context-menu') && selectedMessageId && selectedMessageId !== 'menu') {
        setSelectedMessageId(null);
        setMessageMenuPosition(null);
      }
    };
    if (selectedMessageId && selectedMessageId !== 'menu') {
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 0);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [selectedMessageId]);

  // Close chat menu on outside click
  React.useEffect(() => {
    const handleClickOutside = () => {
      setShowChatMenu(false);
    };
    if (showChatMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showChatMenu]);

  // Close chat item menu on outside click
  React.useEffect(() => {
    const handleClickOutside = () => {
      setOpenChatItemMenu(null);
    };
    if (openChatItemMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openChatItemMenu]);

  const handleSendMessage = async () => {
    if (!selectedChat || (!message.trim() && selectedFiles.length === 0)) {
      return;
    }

    // Find the selected chat to get the real chat ID
    const currentChat = chatsList.find(chat => chat.id === selectedChat);
    
    // Only use chatId field, never use id as fallback (id can be username or user ID)
    if (!currentChat?.chatId) {
      console.error('Chat ID not found - chat must be created first', { selectedChat, currentChat });
      return;
    }
    
    const realChatId = currentChat.chatId;
    
    // Validate that chatId is a UUID format (not a username or user ID)
    // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (36 characters with hyphens)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(realChatId)) {
      console.error('Invalid chat ID format - must be UUID', { 
        chatId: realChatId, 
        selectedChat, 
        currentChat 
      });
      return;
    }
    
    console.log('Sending message with chat_id:', realChatId);

    const messageText = message.trim();
    // Store files before clearing state
    const filesToSend = [...selectedFiles];
    const files = filesToSend.length > 0 
      ? filesToSend.map(file => ({
          url: URL.createObjectURL(file),
          type: file.type,
          name: file.name
        }))
      : undefined;
    
    // Optimistically update UI
    const tempMessageId = Date.now().toString();
    const newMessage = {
      id: tempMessageId,
      text: messageText,
      time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      sender: 'me' as const,
      files: files
    };
    
    // Add message to UI immediately
    setMessages(prev => [...prev, newMessage]);
    setMessage('');
    setSelectedFiles([]);
    setIsTyping(false);
    setShowEmojiPicker(false);

    // Send message to API
    try {
      const response = await api.call<{ message_id: string; id: string }>(Actions.CMD_SEND_MESSAGE, {
        method: "POST",
        body: {
          chat_id: realChatId, // Use real chat ID from backend
          content: messageText,
          images: filesToSend.length > 0 ? filesToSend.map(file => ({
            file: file,
            type: file.type,
            name: file.name
          })) : undefined,
        },
      });

      // Update message ID with server response if available
      if (response?.message_id || response?.id) {
        setMessages(prev => prev.map(msg => 
          msg.id === tempMessageId 
            ? { ...msg, id: response.message_id || response.id }
            : msg
        ));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove message from UI if API call failed
      setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
      // Optionally show error message to user
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
    <div className={`h-[100dvh] w-full flex flex-col ${theme === 'dark' ? 'bg-black' : 'bg-gray-50'}`} style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div className="h-full w-full flex-1 flex flex-row min-h-0 overflow-hidden" style={{ flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'row' }}>
        <div className="flex flex-row h-full w-full flex-1 min-h-0 overflow-hidden" style={{ flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'row' }}>
          {/* Sidebar - Responsive Design */}
          <div className={`absolute lg:relative inset-0 z-40 lg:z-auto w-full lg:w-80 lg:flex-shrink-0 border-r flex flex-col h-full overflow-hidden ${
            theme === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
          } ${showSidebar ? 'flex' : 'hidden lg:flex'}`}>
            {/* Header */}
            <div className={`flex-shrink-0 sticky mb-[56px] md:mb-[0px]  top-[56px] lg:top-0 z-50 p-3 sm:p-4 border-b ${
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
                    onClick={() => {
                      setShowSidebar(false);
                      setShowBottomBar(true);
                      navigate('/');
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="lg:hidden p-2 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
              
              {/* Search */}
              <div className="relative mb-3 sm:mb-4 z-20">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 z-10 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  type="text"
                  placeholder="Search"
                  className={`relative w-full pl-10 pr-4 py-2 sm:py-3 rounded-full border-0 text-sm z-10 ${
                    theme === 'dark' 
                      ? 'bg-gray-800 text-white placeholder-gray-400' 
                      : 'bg-gray-100 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-nowrap relative z-20">
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
            <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0">
              {isLoadingChats ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className={`animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2 ${
                      theme === 'dark' ? 'border-white' : 'border-gray-900'
                    }`}></div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      Loading chats...
                    </p>
                  </div>
                </div>
              ) : chatsList.filter((chat: any) => {
                if (activeFilter === 'all') return true;
                if (activeFilter === 'unread') return chat.unread > 0;
                if (activeFilter === 'unencrypted') return !chat.encrypted;
                return true;
              }).length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400 text-center p-8">
                  No chats found.
                </div>
              ) : chatsList.filter((chat: any) => {
                if (activeFilter === 'all') return true;
                if (activeFilter === 'unread') return chat.unread > 0;
                if (activeFilter === 'unencrypted') return !chat.encrypted;
                return true;
              }).map((chat: any) => (
                <div
                  key={chat.id}
                  className={`group/item p-3 sm:p-4 cursor-pointer transition-colors border-b relative ${
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
                  onClick={() => handleChatSelect(chat.id)}
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
                  {/* More Menu Button */}
                  <div className="absolute top-2 right-2">
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenChatItemMenu(openChatItemMenu === chat.id ? null : chat.id);
                      }}
                      className={`p-1.5 rounded-full transition-colors ${
                        theme === 'dark' 
                          ? 'hover:bg-gray-700 text-gray-400' 
                          : 'hover:bg-gray-200 text-gray-500'
                      }`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </motion.button>
                    <AnimatePresence>
                      {openChatItemMenu === chat.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -5 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -5 }}
                          transition={{ duration: 0.15 }}
                          className={`absolute right-0 top-full mt-1 rounded-lg shadow-lg border z-50 ${
                            theme === 'dark' 
                              ? 'bg-gray-800 border-gray-700' 
                              : 'bg-white border-gray-200'
                          }`}
                          style={{ minWidth: '140px' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              handleDeleteChat(chat.id);
                              setOpenChatItemMenu(null);
                            }}
                            className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-opacity-50 transition-colors rounded-lg ${
                              theme === 'dark' 
                                ? 'text-red-400 hover:bg-red-500/20' 
                                : 'text-red-600 hover:bg-red-50'
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
                            Sohbeti Sil
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <AnimatePresence mode={isMobile ? "sync" : "wait"}>
            {selectedChat ? (
              <motion.div
                key="chat-view"
                initial={isMobile ? undefined : { opacity: 0 }}
                animate={isMobile ? undefined : { opacity: 1 }}
                exit={isMobile ? undefined : { opacity: 0 }}
                transition={isMobile ? undefined : { 
                  duration: 0.15,
                  ease: 'easeOut'
                }}
                className="flex-1 flex flex-col min-h-0 min-w-0 relative z-10 h-full"
                style={{
                  flex: '1 1 auto',
                  minHeight: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
              
                }}
              >
                {/* Chat Header */}
                <div
                  className={`flex-shrink-0 sticky top-0 z-50 p-3 sm:p-4 border-b ${
                    theme === 'dark' 
                      ? 'border-gray-800 bg-black/95 backdrop-blur-xl' 
                      : 'border-gray-200 bg-white/95 backdrop-blur-xl'
                  }`}
                  style={{
                    flexGrow: 0,
                    flexShrink: 0,
                    flexBasis: 'auto'
                  }}
                >
                  <div className="flex flex-row gap-2 items-center justify-between">
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
                        <motion.button
                          onClick={() => {
                            setShowProfile(!showProfile);
                          }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ type: "spring", stiffness: 400, damping: 17 }}
                          className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1 cursor-pointer"
                        >
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
                          <div className="min-w-0 flex-1 text-left">
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
                          <div className="flex items-center gap-2 flex-shrink-0">
                           
                            <motion.div
                              animate={{ rotate: showProfile ? 180 : 0 }}
                              transition={{ type: "spring", stiffness: 300, damping: 20 }}
                              className="flex-shrink-0"
                            >
                              {showProfile ? (
                                <ChevronUp className={`w-5 h-5 ${
                                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                }`} />
                              ) : (
                                <ChevronDown className={`w-5 h-5 ${
                                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                }`} />
                              )}
                            </motion.div>
                          </div>
                        </motion.button>
                      ) : null}
                    </div>
                    {/* Chat Actions Menu */}
                    <div className="relative flex flex-row gap-2 flex-shrink-0">
                    <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRefreshMessages();
                              }}
                              whileTap={{ scale: 0.95 }}
                              disabled={isRefreshingMessages || isLoadingMessages}
                              className={`p-2 rounded-lg transition-colors ${
                                theme === 'dark' 
                                  ? 'hover:bg-white/10 text-gray-400' 
                                  : 'hover:bg-black/10 text-gray-500'
                              } disabled:opacity-50`}
                            >
                              <RefreshCw 
                                className={`w-5 h-5 ${
                                  isRefreshingMessages ? 'animate-spin' : ''
                                }`} 
                              />
                            </motion.button>
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowChatMenu(!showChatMenu);
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`p-2 rounded-lg transition-colors ${
                          theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/10'
                        }`}
                      >
                        <MoreVertical className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
                      </motion.button>
                      {showChatMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className={`absolute right-0 top-full mt-2 rounded-lg shadow-lg border z-50 ${
                            theme === 'dark' 
                              ? 'bg-gray-800 border-gray-700' 
                              : 'bg-white border-gray-200'
                          }`}
                          style={{ minWidth: '180px' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              handleClearChatHistory();
                              setShowChatMenu(false);
                            }}
                            className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-opacity-50 transition-colors ${
                              theme === 'dark' 
                                ? 'text-red-400 hover:bg-red-500/20' 
                                : 'text-red-600 hover:bg-red-50'
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
                            Mesaj Geçmişini Temizle
                          </button>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages or Profile */}
                <AnimatePresence mode="wait">
                  {showProfile && selectedPrivateChat ? (
                    <motion.div
                      key="profile-view"
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ 
                        duration: 0.25,
                        ease: [0.4, 0, 0.2, 1]
                      }}
                      className="flex-1 overflow-y-auto scrollbar-hide min-h-0"
                      style={{ 
                        flexGrow: 1,
                        flexShrink: 1,
                        minHeight: 0,
                        overflowY: 'auto'
                      }}
                    >
                      <div className="h-full">
                        <ProfileScreen inline isEmbed username={selectedPrivateChat.username || selectedPrivateChat.name.toLowerCase()} />
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="messages-view"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ 
                        duration: 0.25,
                        ease: [0.4, 0, 0.2, 1]
                      }}
                      className={`flex-1 overflow-y-auto p-3 sm:p-4 scrollbar-hide min-h-0 ${
                        theme === 'dark' 
                          ? 'bg-black' 
                          : 'bg-white'
                      }`}
                      style={{ 
                        flexGrow: 1,
                        flexShrink: 1,
                        minHeight: 0,
                        overflowY: 'auto',
                        paddingBottom: isMobile && selectedChat ? `${inputHeight + 16}px` : undefined
                      }}
                    >
                      <div className="space-y-3 max-w-4xl mx-auto">
                    {isLoadingMessages ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                          <div className={`animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2 ${
                            theme === 'dark' ? 'border-white' : 'border-gray-900'
                          }`}></div>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            Loading messages...
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Date Separator */}
                        {messages.length > 0 && (
                          <div className="flex justify-center my-6">
                            <div className={`px-3 py-1 rounded-full ${
                              theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'
                            }`}>
                              <span className={`text-xs font-medium ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`}>Bugün</span>
                            </div>
                          </div>
                        )}

                        {/* Messages */}
                        {messages.length === 0 ? (
                          <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                              <MessageCircle className={`w-12 h-12 mx-auto mb-3 ${
                                theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                              }`} />
                              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                No messages yet
                              </p>
                            </div>
                          </div>
                        ) : (
                          messages.map((msg) => (
                            <MessageItem
                              key={msg.id}
                              msg={msg}
                              theme={theme}
                              onDelete={handleDeleteMessage}
                              onContextMenu={handleMessageContextMenu}
                            />
                          ))
                        )}
                      </>
                    )}

                    {/* Message Context Menu */}
                    {selectedMessageId && selectedMessageId !== 'menu' && messageMenuPosition && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`message-context-menu fixed z-50 rounded-lg shadow-lg border ${
                          theme === 'dark' 
                            ? 'bg-gray-800 border-gray-700' 
                            : 'bg-white border-gray-200'
                        }`}
                        style={{
                          left: `${messageMenuPosition.x}px`,
                          top: `${messageMenuPosition.y}px`,
                          transform: 'translate(-50%, -100%)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleDeleteMessage(selectedMessageId)}
                          className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-opacity-50 transition-colors ${
                            theme === 'dark' 
                              ? 'text-red-400 hover:bg-red-500/20' 
                              : 'text-red-600 hover:bg-red-50'
                          }`}
                        >
                          <Trash2 className="w-4 h-4" />
                          Mesajı Sil
                        </button>
                      </motion.div>
                    )}

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
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Message Input Container - Fixed on Mobile */}
                {!showProfile && (
                <div 
                  ref={inputContainerRef}
                  className={`border-t w-full transition-all duration-300 ${
                    isMobile 
                      ? 'fixed bottom-0 left-0 right-0 z-50' 
                      : 'relative flex-shrink-0 p-3 sm:p-4'
                  } ${
                    theme === 'dark' 
                      ? 'border-gray-800 bg-black' 
                      : 'border-gray-200 bg-white'
                  }`}
                  style={{
                    paddingTop: isMobile ? '12px' : undefined,
                    paddingLeft: isMobile ? '12px' : undefined,
                    paddingRight: isMobile ? '12px' : undefined,
                    paddingBottom: isMobile 
                      ? `max(12px, env(safe-area-inset-bottom, 12px))` 
                      : undefined,
                    flexGrow: isMobile ? undefined : 0,
                    flexShrink: isMobile ? undefined : 0,
                    flexBasis: isMobile ? undefined : 'auto',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {/* Selected Files Preview */}
                  {selectedFiles.length > 0 && (
                    <div className="mb-2 space-y-2">
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
                  )}

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
                        className={`w-full pl-20 pr-12 py-2.5 sm:py-3 rounded-full border-0 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all ${
                          theme === 'dark' 
                            ? 'bg-gray-800 text-white placeholder-gray-400 focus:ring-gray-600' 
                            : 'bg-gray-100 text-gray-900 placeholder-gray-500 focus:ring-gray-300'
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
                )}
              </motion.div>
            ) : (
              <motion.div
                key="chat-list-placeholder"
                initial={isMobile ? undefined : { opacity: 0 }}
                animate={isMobile ? undefined : { opacity: 1 }}
                exit={isMobile ? undefined : { opacity: 0 }}
                transition={isMobile ? undefined : { 
                  duration: 0.15,
                  ease: 'easeOut'
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