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
  RefreshCw,
  Image,
  Video
} from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import { defaultServiceServerId, serviceURL } from '../appSettings';

interface MessageItemProps {
  msg: { 
    id: string; 
    text: string; 
    time: string; 
    sender: 'me' | 'other'; 
    attachments?: Array<{
      id: string;
      file: {
        id: string;
        url: string;
        mime_type: string;
        name: string;
        storage_path?: string;
        variants?: {
          image?: {
            original?: { url: string };
            small?: { url: string };
            medium?: { url: string };
            large?: { url: string };
            thumbnail?: { url: string };
          };
        };
      };
    }>;
  };
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
        {/* Media Files - Backend Format: attachments */}
        {msg.attachments && msg.attachments.length > 0 && (
          <div className="mb-2 space-y-2">
            {msg.attachments.map((attachment, idx) => {
              const file = attachment.file;
              const imageUrl = file.variants?.image?.original?.url || 
                              file.variants?.image?.large?.url || 
                              file.variants?.image?.medium?.url || 
                              file.variants?.image?.small?.url || 
                              file.url;
              
              return (
                <div key={attachment.id || idx} className="relative rounded-lg overflow-hidden">
                  {file.mime_type?.startsWith('image/') ? (
                    <img
                      src={`${serviceURL[defaultServiceServerId]}${imageUrl}`}
                      alt={file.name}
                      className="w-full max-w-xs rounded-lg object-cover"
                      style={{ maxHeight: '300px' }}
                    />
                  ) : file.mime_type?.startsWith('video/') ? (
                    <video
                      src={file.url || file.storage_path || ''}
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
              );
            })}
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
  const { isAuthenticated, user } = useAuth();
  const { setShowBottomBar } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'groups' | 'unencrypted'>('all');
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [inputHeight, setInputHeight] = useState(0);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [messageMenuPosition, setMessageMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [openChatItemMenu, setOpenChatItemMenu] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [isRefreshingMessages, setIsRefreshingMessages] = useState(false);
  const { socket } = useSocket();
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef<number>(0);
  const typingIndicatorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle socket messages
  useEffect(() => {
    if (!socket || !user?.id) return;

    const handleSocketMessage = (msg: string | object | any[]) => {
      console.log('Socket message received (raw):', msg);
      
      try {
        // Handle array format: ["chat_id", "json_string"]
        let messageData: any;
        if (Array.isArray(msg)) {
          // If it's an array, the second element is the JSON string
          if (msg.length > 1 && typeof msg[1] === 'string') {
            messageData = JSON.parse(msg[1]);
          } else {
            // If array format is different, try to parse the whole array
            messageData = msg;
          }
        } else if (typeof msg === 'string') {
          // Parse message if it's a string
          messageData = JSON.parse(msg);
        } else {
          // Already an object
          messageData = msg;
        }
        
        const action = messageData?.action;
        const message = messageData?.message || messageData?.data;

        console.log('Socket message parsed:', { action, message, messageData });

        // Only process messages for the current chat
        if (action === Actions.CMD_SEND_MESSAGE && message) {
          // Get current chat from ref
          const currentChat = chatsListRef.current.find((chat: any) => chat.id === selectedChat);
          
          // Check if message belongs to current chat
          const messageChatId = message.contentable_id || message.chat_id;
          
          console.log('Processing message:', { 
            messageChatId, 
            currentChatId: currentChat?.chatId, 
            selectedChat,
            hasCurrentChat: !!currentChat
          });
          
          // If we have a selected chat, only process messages for that chat
          if (selectedChat && currentChat?.chatId && messageChatId && messageChatId !== currentChat.chatId) {
            // Message is for a different chat, ignore it
            console.log('Message ignored - different chat', { messageChatId, currentChatId: currentChat.chatId });
            return;
          }

          // Determine if message is from current user
          const isFromMe = message.author_id === user.id;

          // Get message content - handle both object format {en: "...", tr: "..."} and string format
          let messageText = '';
          if (typeof message.content === 'string') {
            messageText = message.content;
          } else if (message.content && typeof message.content === 'object') {
            // Try to get content in preferred language (en first, then tr, then any available)
            messageText = message.content.en || message.content.tr || Object.values(message.content).find((v: any) => v && typeof v === 'string') || '';
          }
          // Fallback to text field if content is empty
          if (!messageText && message.text) {
            messageText = message.text;
          }

          // Format time
          let messageTime = '00:00';
          if (message.created_at) {
            const messageDate = new Date(message.created_at);
            messageTime = messageDate.toLocaleTimeString('tr-TR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            });
          } else {
            // If no timestamp, use current time
            messageTime = new Date().toLocaleTimeString('tr-TR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            });
          }

          // Use attachments directly from backend format - no mapping needed
          // Create new message object
          const newMessage = {
            id: message.id || `socket-${Date.now()}`,
            text: messageText,
            time: messageTime,
            sender: isFromMe ? 'me' as const : 'other' as const,
            attachments: message.attachments || undefined
          };

          // Hide typing indicator when a new message arrives (from other user)
          if (!isFromMe) {
            setOtherUserTyping(false);
            if (typingIndicatorTimeoutRef.current) {
              clearTimeout(typingIndicatorTimeoutRef.current);
              typingIndicatorTimeoutRef.current = null;
            }
          }

          // Add message to UI (avoid duplicates by checking if message ID already exists)
          // Also check if this is a duplicate of a recently sent message (to avoid duplicates from optimistic updates)
          setMessages(prev => {
            // Check if message already exists by ID
            const existsById = prev.some(m => m.id === newMessage.id);
            if (existsById) {
              return prev;
            }
            
            // If message is from current user, check for duplicate content (optimistic update)
            // This prevents duplicate messages when we send a message optimistically and then receive it from socket
            if (isFromMe) {
              // Find the last message that matches our content and is from us
              // This is likely the optimistic message we just added
              const lastMessage = prev.length > 0 ? prev[prev.length - 1] : null;
              
              // Check if last message is from us, has same content, and has a temp ID
              if (lastMessage && 
                  lastMessage.sender === 'me' && 
                  lastMessage.text === newMessage.text &&
                  (lastMessage.id.startsWith('temp-') || lastMessage.id.startsWith('socket-'))) {
                // Update the existing optimistic message with the real ID from socket
                return prev.map(m => 
                  m.id === lastMessage.id && m.text === newMessage.text
                    ? { ...m, id: newMessage.id }
                    : m
                );
              }
              
              // Also check for any message with same content from us (fallback)
              const duplicate = prev.find(m => 
                m.sender === 'me' && 
                m.text === newMessage.text &&
                (m.id.startsWith('temp-') || m.id.startsWith('socket-'))
              );
              
              if (duplicate) {
                // Update the existing message with the real ID from socket
                return prev.map(m => 
                  m.id === duplicate.id && m.text === newMessage.text
                    ? { ...m, id: newMessage.id }
                    : m
                );
              }
            }
            
            // Add new message and sort by time
            const updated = [...prev, newMessage];
            // Sort messages by time (if we have timestamps, otherwise keep order)
            return updated;
          });
        } else if (action === Actions.CMD_TYPING) {
          // Handle typing indicator from socket
          const typingData = messageData;
          const typingChatId = typingData?.chatID || typingData?.chat_id;
          const isTypingActive = typingData?.typing === true;
          const typingUserId = typingData?.userID || typingData?.user_id;
          
          console.log('Typing indicator received:', { 
            typingChatId, 
            isTypingActive, 
            typingUserId, 
            currentUserId: user?.id,
            selectedChat,
            messageData,
            allChats: chatsListRef.current.map((c: any) => ({ id: c.id, chatId: c.chatId }))
          });
          
          // Get current chat from ref
          const currentChat = chatsListRef.current.find((chat: any) => chat.id === selectedChat);
          
          console.log('Current chat:', { 
            currentChat, 
            currentChatId: currentChat?.chatId,
            matches: typingChatId === currentChat?.chatId,
            isOtherUser: typingUserId !== user?.id,
            selectedChat
          });
          
          // Only show typing indicator if it's for the current chat and from the other user
          if (selectedChat && 
              currentChat?.chatId && 
              typingChatId === currentChat.chatId && 
              typingUserId !== user?.id) {
            console.log('✅ Showing typing indicator:', isTypingActive);
            
            // Clear any existing timeout
            if (typingIndicatorTimeoutRef.current) {
              clearTimeout(typingIndicatorTimeoutRef.current);
              typingIndicatorTimeoutRef.current = null;
            }
            
            if (isTypingActive) {
              // Show typing indicator
              setOtherUserTyping(true);
              
              // Set timeout to hide typing indicator after 3 seconds of inactivity
              typingIndicatorTimeoutRef.current = setTimeout(() => {
                console.log('Hiding typing indicator - 3 seconds of inactivity');
                setOtherUserTyping(false);
                typingIndicatorTimeoutRef.current = null;
              }, 3000);
            } else {
              // If typing is false, hide immediately
              console.log('Hiding typing indicator - typing stopped');
              setOtherUserTyping(false);
            }
          } else {
            console.log('❌ Typing indicator ignored:', {
              hasSelectedChat: !!selectedChat,
              hasCurrentChat: !!currentChat,
              chatIdMatch: typingChatId === currentChat?.chatId,
              isOtherUser: typingUserId !== user?.id,
              typingChatId,
              currentChatId: currentChat?.chatId,
              selectedChat
            });
          }
        }
      } catch (error) {
        console.error('Error processing socket message:', error);
      }
    };

    // Listen for socket messages
    socket.on('message', handleSocketMessage);
    socket.on('chat', handleSocketMessage);

    // Cleanup: remove event listener when component unmounts or dependencies change
    return () => {
      socket.off('message', handleSocketMessage);
      socket.off('chat', handleSocketMessage);
      // Clear typing timeout on cleanup
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      // Clear typing indicator timeout on cleanup
      if (typingIndicatorTimeoutRef.current) {
        clearTimeout(typingIndicatorTimeoutRef.current);
        typingIndicatorTimeoutRef.current = null;
      }
    };
  }, [socket, selectedChat, user?.id]);


  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      if (typingIndicatorTimeoutRef.current) {
        clearTimeout(typingIndicatorTimeoutRef.current);
        typingIndicatorTimeoutRef.current = null;
      }
    };
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
  }, [isMobile, selectedChat, selectedImages, selectedVideos, showEmojiPicker]);

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
  
  // Use ref to access current chatsList in socket handler
  const chatsListRef = useRef(chatsList);
  
  // Update ref when chatsList changes
  useEffect(() => {
    chatsListRef.current = chatsList;
  }, [chatsList]);

  const emojis = ['😊', '😂', '❤️', '👍', '🎉', '🔥', '💯', '✨', '🏳️‍🌈', '💪', '😍', '🤔', '😭', '😡', '🤗', '👏', '🙏', '💖', '💕', '💔', '😎', '🤩', '😴', '🤯', '🥳', '😇', '🤠', '👻', '🤖', '👽', '👾'];

  const selectedPrivateChat = chatsList.find(chat => chat.id === selectedChat);

  // Messages state - Backend format: attachments array
  const [messages, setMessages] = useState<Array<{ 
    id: string; 
    text: string; 
    time: string; 
    sender: 'me' | 'other'; 
    attachments?: Array<{
      id: string;
      file: {
        id: string;
        url: string;
        mime_type: string;
        name: string;
        storage_path?: string;
        variants?: {
          image?: {
            original?: { url: string };
            small?: { url: string };
            medium?: { url: string };
            large?: { url: string };
            thumbnail?: { url: string };
          };
        };
      };
    }>;
  }>>([]);
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
              file: {
                id: string;
                url: string;
                mime_type: string;
                name: string;
                storage_path?: string;
                variants?: {
                  image?: {
                    original?: { url: string };
                    small?: { url: string };
                    medium?: { url: string };
                    large?: { url: string };
                    thumbnail?: { url: string };
                  };
                };
              };
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

            // Use attachments directly from backend format - no mapping needed
            return {
              id: msg.id,
              text: messageText,
              time: messageTime,
              sender: isFromMe ? 'me' as const : 'other' as const,
              attachments: msg.attachments || undefined
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

  // Auto-scroll to bottom when new messages are added or chat is selected
  useEffect(() => {
    if (messagesContainerRef.current && messages.length > 0 && !isLoadingMessages) {
      // Small delay to ensure DOM is updated
      const scrollToBottom = () => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      };
      
      // Use requestAnimationFrame for smoother scrolling
      requestAnimationFrame(() => {
        setTimeout(scrollToBottom, 50);
      });
    }
  }, [messages, isLoadingMessages, selectedChat]);

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
    const totalMedia = selectedImages.length + selectedVideos.length;
    if (!selectedChat || (!message.trim() && totalMedia === 0)) {
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
    const imagesToSend = [...selectedImages];
    const videosToSend = [...selectedVideos];
    const allFiles = [...selectedImages, ...selectedVideos];
    
    // Create temporary attachments for optimistic update (will be replaced by backend response)
    const tempAttachments = allFiles.length > 0 
      ? allFiles.map((file, idx) => ({
          id: `temp-attachment-${Date.now()}-${idx}`,
          file: {
            id: `temp-file-${Date.now()}-${idx}`,
            url: URL.createObjectURL(file),
            mime_type: file.type,
            name: file.name,
            variants: file.type.startsWith('image/') ? {
              image: {
                original: { url: URL.createObjectURL(file) }
              }
            } : undefined
          }
        }))
      : undefined;
    
    // Optimistically update UI
    const tempMessageId = `temp-${Date.now()}`;
    const newMessage = {
      id: tempMessageId,
      text: messageText,
      time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      sender: 'me' as const,
      attachments: tempAttachments
    };
    
    // Add message to UI immediately
    setMessages(prev => [...prev, newMessage]);
      setMessage('');
    setSelectedImages([]);
    setSelectedVideos([]);
      setIsTyping(false);
      setShowEmojiPicker(false);
    
    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    
    // Hide other user typing indicator when we send a message
    setOtherUserTyping(false);
    if (typingIndicatorTimeoutRef.current) {
      clearTimeout(typingIndicatorTimeoutRef.current);
      typingIndicatorTimeoutRef.current = null;
    }

    // Send message to API
    try {
      const response = await api.call<{ message_id: string; id: string }>(Actions.CMD_SEND_MESSAGE, {
        method: "POST",
        body: {
          chat_id: realChatId, // Use real chat ID from backend
          content: messageText,
          images: imagesToSend.length > 0 ? imagesToSend : undefined,
          videos: videosToSend.length > 0 ? videosToSend : undefined,
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

  const handleTyping = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);
    setIsTyping(value.length > 0);

    // Send typing indicator to server on every keystroke
    if (!selectedChat || !value.trim()) {
      // Clear typing timeout if message is empty
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      return;
    }

    // Find the selected chat to get the real chat ID
    const currentChat = chatsList.find(chat => chat.id === selectedChat);
    
    if (!currentChat?.chatId) {
      return;
    }

    const realChatId = currentChat.chatId;
    
    // Validate that chatId is a UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(realChatId)) {
      return;
    }

    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    // Send typing indicator on every keystroke (with minimal debounce to avoid too many API calls)
    const now = Date.now();
    if (now - lastTypingSentRef.current < 300) {
      // If sent less than 300ms ago, debounce slightly
      typingTimeoutRef.current = setTimeout(() => {
        handleTypingIndicator(realChatId);
      }, 300);
    } else {
      // Send immediately if enough time has passed
      handleTypingIndicator(realChatId);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle Enter key to send message
    if (e.key === 'Enter') {
      handleSendMessage();
      return;
    }

    // For other keys, trigger typing indicator immediately
    // This ensures typing indicator is sent on every keypress
    if (selectedChat) {
      const currentChat = chatsList.find(chat => chat.id === selectedChat);
      
      if (currentChat?.chatId) {
        const realChatId = currentChat.chatId;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(realChatId)) {
          // Clear any existing timeout
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
          }

          // Send typing indicator immediately on keypress
          const now = Date.now();
          if (now - lastTypingSentRef.current >= 300) {
            // If enough time has passed, send immediately
            handleTypingIndicator(realChatId);
          } else {
            // Otherwise, schedule it
            typingTimeoutRef.current = setTimeout(() => {
              handleTypingIndicator(realChatId);
            }, 300 - (now - lastTypingSentRef.current));
          }
        }
      }
    }
  };

  const handleTypingIndicator = async (chatId: string) => {
    try {
      console.log('Sending typing indicator for chat:', chatId);
      const response = await api.call(Actions.CMD_TYPING, {
        method: "POST",
        body: {
          chat_id: chatId,
        },
      });
      console.log('Typing indicator sent successfully:', response);
      lastTypingSentRef.current = Date.now();
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  };

  const handleChatSelect = (chatId: string) => {
    setSelectedChat(chatId);
    setShowSidebar(false);
    // Reset typing indicator when switching chats
    if (typingIndicatorTimeoutRef.current) {
      clearTimeout(typingIndicatorTimeoutRef.current);
      typingIndicatorTimeoutRef.current = null;
    }
    setOtherUserTyping(false);
  };

  const handleEmojiClick = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    setSelectedImages(prev => [...prev, ...imageFiles]);
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const videoFiles = files.filter(file => file.type.startsWith('video/'));
    setSelectedVideos(prev => [...prev, ...videoFiles]);
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    setSelectedVideos(prev => prev.filter((_, i) => i !== index));
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
                        {selectedChat === chat.id && otherUserTyping ? (
                          <p className={`text-xs sm:text-sm truncate text-green-500 font-medium`}>
                            yazıyor...
                          </p>
                        ) : (
                          (chat.lastMessage || '').split('\n').slice(0, 2).map((line: string, idx: number) => (
                          <p key={idx} className={`text-xs sm:text-sm truncate ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>{line}</p>
                          ))
                        )}
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
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <p className={`text-sm truncate ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                            }`}>@{selectedPrivateChat.username || selectedPrivateChat.name.toLowerCase()}</p>
                              {otherUserTyping && (
                                <span className="text-xs font-medium text-green-500 flex-shrink-0">
                                  yazıyor...
                                </span>
                                
                              )}
                            </div>
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
                      ref={messagesContainerRef}
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

                    {/* Typing indicator - Other user typing */}
                    {otherUserTyping && (
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
                            <span className={`text-xs ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {selectedPrivateChat?.name || 'User'} yazıyor...
                            </span>
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
                {/* Selected Media Preview - CreatePost Style */}
                {(() => {
                  const totalMedia = selectedImages.length + selectedVideos.length;
                  const allMedia = [
                    ...selectedImages.map((file, idx) => ({ type: 'image', file, index: idx })),
                    ...selectedVideos.map((file, idx) => ({ type: 'video', file, index: idx }))
                  ];

                  if (totalMedia === 0) return null;

                  // Single media - Full Width
                  if (totalMedia === 1) {
                    const media = allMedia[0];
                    return (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="mb-3 relative group rounded-xl overflow-hidden"
                      >
                        {media.type === 'image' ? (
                          <>
                            <img
                              src={URL.createObjectURL(media.file)}
                              alt="Preview"
                              className="w-full h-auto max-h-[200px] object-cover rounded-xl"
                            />
                            <motion.button
                              onClick={() => removeImage(media.index)}
                              className="absolute top-2 right-2 w-8 h-8 rounded-lg backdrop-blur-xl bg-black/60 border border-white/20 hover:bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              whileHover={{ scale: 1.1, rotate: 90 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <X className="w-4 h-4 text-white" />
                            </motion.button>
                          </>
                        ) : (
                          <>
                            <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 aspect-video flex items-center justify-center rounded-xl">
                              <div className="absolute inset-0 flex items-center justify-center">
                                <motion.div
                                  initial={{ scale: 0.8, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  className="w-12 h-12 rounded-xl backdrop-blur-xl bg-white/10 border border-white/20 flex items-center justify-center"
                                >
                                  <Video className="w-6 h-6 text-white" />
                                </motion.div>
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/95 via-black/80 to-transparent rounded-b-xl">
                                <p className="text-xs font-semibold text-white truncate">{media.file.name}</p>
                                <p className="text-[10px] text-white/60 mt-0.5">{(media.file.size / (1024 * 1024)).toFixed(1)} MB</p>
                              </div>
                              <motion.button
                                onClick={() => removeVideo(media.index)}
                                className="absolute top-2 right-2 w-8 h-8 rounded-lg backdrop-blur-xl bg-black/60 border border-white/20 hover:bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <X className="w-4 h-4 text-white" />
                              </motion.button>
                            </div>
                          </>
                        )}
                      </motion.div>
                    );
                  }

                  // Two media - Side by Side
                  if (totalMedia === 2) {
                    return (
                      <div className="mb-3 grid grid-cols-2 gap-2">
                        {allMedia.map((media, idx) => (
                          <motion.div
                            key={`${media.type}-${idx}`}
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className="relative group rounded-xl overflow-hidden"
                          >
                            {media.type === 'image' ? (
                              <>
                                <img
                                  src={URL.createObjectURL(media.file)}
                                  alt={`Preview ${idx + 1}`}
                                  className="w-full h-full min-h-[120px] object-cover rounded-xl"
                                />
                                <motion.button
                                  onClick={() => removeImage(media.index)}
                                  className="absolute top-1.5 right-1.5 w-7 h-7 rounded-lg backdrop-blur-xl bg-black/60 border border-white/20 hover:bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                  whileHover={{ scale: 1.1, rotate: 90 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <X className="w-3.5 h-3.5 text-white" />
                                </motion.button>
                              </>
                            ) : (
                              <>
                                <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 aspect-square min-h-[120px] flex items-center justify-center rounded-xl">
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <motion.div
                                      initial={{ scale: 0.8, opacity: 0 }}
                                      animate={{ scale: 1, opacity: 1 }}
                                      className="w-10 h-10 rounded-xl backdrop-blur-xl bg-white/10 border border-white/20 flex items-center justify-center"
                                    >
                                      <Video className="w-5 h-5 text-white" />
                                    </motion.div>
                            </div>
                                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/95 via-black/80 to-transparent rounded-b-xl">
                                    <p className="text-[10px] font-semibold text-white truncate">{media.file.name}</p>
                                    <p className="text-[9px] text-white/60 mt-0.5">{(media.file.size / (1024 * 1024)).toFixed(1)} MB</p>
                          </div>
                          <motion.button
                                    onClick={() => removeVideo(media.index)}
                                    className="absolute top-1.5 right-1.5 w-7 h-7 rounded-lg backdrop-blur-xl bg-black/60 border border-white/20 hover:bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                          >
                                    <X className="w-3.5 h-3.5 text-white" />
                          </motion.button>
                        </div>
                              </>
                            )}
                          </motion.div>
                      ))}
                    </div>
                    );
                  }

                  // Three or more - Grid Layout
                  return (
                    <div className="mb-3 grid grid-cols-2 gap-2">
                      {allMedia.slice(0, 4).map((media, idx) => {
                        const showOverlay = idx === 3 && totalMedia > 4;
                        return (
                          <motion.div
                            key={`${media.type}-${idx}`}
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className="relative group rounded-xl overflow-hidden"
                          >
                            {media.type === 'image' ? (
                              <>
                                <img
                                  src={URL.createObjectURL(media.file)}
                                  alt={`Preview ${idx + 1}`}
                                  className="w-full h-full min-h-[100px] object-cover rounded-xl"
                                />
                                {showOverlay && (
                                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center rounded-xl">
                                    <p className="text-lg font-bold text-white">+{totalMedia - 4}</p>
                  </div>
                )}
                                {!showOverlay && (
                                  <motion.button
                                    onClick={() => removeImage(media.index)}
                                    className="absolute top-1.5 right-1.5 w-7 h-7 rounded-lg backdrop-blur-xl bg-black/60 border border-white/20 hover:bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <X className="w-3.5 h-3.5 text-white" />
                                  </motion.button>
                                )}
                              </>
                            ) : (
                              <>
                                <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 aspect-square min-h-[100px] flex items-center justify-center rounded-xl">
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <motion.div
                                      initial={{ scale: 0.8, opacity: 0 }}
                                      animate={{ scale: 1, opacity: 1 }}
                                      className="w-10 h-10 rounded-xl backdrop-blur-xl bg-white/10 border border-white/20 flex items-center justify-center"
                                    >
                                      <Video className="w-5 h-5 text-white" />
                                    </motion.div>
                                  </div>
                                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/95 via-black/80 to-transparent rounded-b-xl">
                                    <p className="text-[10px] font-semibold text-white truncate">{media.file.name}</p>
                                    <p className="text-[9px] text-white/60 mt-0.5">{(media.file.size / (1024 * 1024)).toFixed(1)} MB</p>
                                  </div>
                                  {showOverlay && (
                                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center rounded-xl">
                                      <p className="text-lg font-bold text-white">+{totalMedia - 4}</p>
                                    </div>
                                  )}
                                  {!showOverlay && (
                                    <motion.button
                                      onClick={() => removeVideo(media.index)}
                                      className="absolute top-1.5 right-1.5 w-7 h-7 rounded-lg backdrop-blur-xl bg-black/60 border border-white/20 hover:bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                      whileHover={{ scale: 1.1, rotate: 90 }}
                                      whileTap={{ scale: 0.9 }}
                                    >
                                      <X className="w-3.5 h-3.5 text-white" />
                                    </motion.button>
                                  )}
                                </div>
                              </>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  );
                })()}

                  <div className="flex items-center space-x-2">
                    {/* Hidden File Inputs */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <input
                      ref={videoInputRef}
                      type="file"
                      multiple
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="hidden"
                    />
                    <div className="flex-1 relative">
                      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                        {/* Image Upload Button */}
                        <motion.button 
                          onClick={() => fileInputRef.current?.click()}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className={`p-1.5 rounded-full transition-all duration-200 ${
                            selectedImages.length > 0
                              ? theme === 'dark'
                                ? 'bg-blue-500/15 text-blue-400'
                                : 'bg-blue-50 text-blue-600'
                              : theme === 'dark'
                              ? 'hover:bg-gray-700 text-gray-400'
                              : 'hover:bg-gray-200 text-gray-600'
                          }`}
                        >
                          <Image className={`w-4 h-4`} />
                        </motion.button>
                        {/* Video Upload Button */}
                        <motion.button 
                          onClick={() => videoInputRef.current?.click()}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className={`p-1.5 rounded-full transition-all duration-200 ${
                            selectedVideos.length > 0
                              ? theme === 'dark'
                                ? 'bg-purple-500/15 text-purple-400'
                                : 'bg-purple-50 text-purple-600'
                              : theme === 'dark'
                              ? 'hover:bg-gray-700 text-gray-400'
                              : 'hover:bg-gray-200 text-gray-600'
                          }`}
                        >
                          <Video className={`w-4 h-4`} />
                        </motion.button>
                        {/* Emoji Picker Button */}
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
                        onKeyPress={handleKeyPress}
                        placeholder="Send message"
                        className={`w-full pl-24 pr-12 py-2.5 sm:py-3 rounded-full border-0 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all ${
                          theme === 'dark' 
                            ? 'bg-gray-800 text-white placeholder-gray-400 focus:ring-gray-600' 
                            : 'bg-gray-100 text-gray-900 placeholder-gray-500 focus:ring-gray-300'
                        }`}
                      />
                      <motion.button
                        onClick={handleSendMessage}
                        disabled={!message.trim() && selectedImages.length === 0 && selectedVideos.length === 0}
                        whileTap={{ scale: 0.95 }}
                        className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full transition-all hover:scale-105 ${
                          (message.trim() || selectedImages.length > 0 || selectedVideos.length > 0)
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