import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Share2, X, Facebook, MessageCircle, Instagram, Twitter, Youtube, Send, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

interface ShareButtonProps {
  url: string;
  title?: string;
  description?: string;
  trigger?: React.ReactNode;
  className?: string;
}

// Social media platforms with their icons and share URLs
const socialPlatforms = [
  {
    id: 'facebook',
    name: 'Facebook',
    icon: Facebook,
    color: '#1877F2',
    getShareUrl: (url: string) => 
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: MessageCircle,
    color: '#25D366',
    getShareUrl: (url: string, title?: string) => 
      `https://wa.me/?text=${encodeURIComponent(title ? `${title} ${url}` : url)}`
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: Instagram,
    color: '#E4405F',
    getShareUrl: () => 
      `https://www.instagram.com/`
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: Share2,
    color: '#000000',
    getShareUrl: () => 
      `https://www.tiktok.com/`
  },
  {
    id: 'twitter',
    name: 'Twitter (X)',
    icon: Twitter,
    color: '#000000',
    getShareUrl: (url: string, title?: string) => 
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title || '')}`
  },
  {
    id: 'snapchat',
    name: 'Snapchat',
    icon: Send,
    color: '#FFFC00',
    getShareUrl: () => 
      `https://www.snapchat.com/`
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: Youtube,
    color: '#FF0000',
    getShareUrl: () => 
      `https://www.youtube.com/`
  },
  {
    id: 'wechat',
    name: 'WeChat',
    icon: MessageCircle,
    color: '#07C160',
    getShareUrl: () => 
      `weixin://`
  },
  {
    id: 'douyin',
    name: 'Douyin',
    icon: Share2,
    color: '#000000',
    getShareUrl: () => 
      `https://www.douyin.com/`
  },
  {
    id: 'weibo',
    name: 'Weibo',
    icon: Share2,
    color: '#E6162D',
    getShareUrl: (url: string, title?: string) => 
      `https://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title || '')}`
  },
  {
    id: 'qq',
    name: 'QQ',
    icon: MessageCircle,
    color: '#12B7F5',
    getShareUrl: (url: string, title?: string) => 
      `https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title || '')}`
  },
  {
    id: 'bilibili',
    name: 'Bilibili',
    icon: Share2,
    color: '#FB7299',
    getShareUrl: () => 
      `https://www.bilibili.com/`
  },
  {
    id: 'kuaishou',
    name: 'Kuaishou',
    icon: Share2,
    color: '#FF6600',
    getShareUrl: () => 
      `https://www.kuaishou.com/`
  },
  {
    id: 'line',
    name: 'LINE',
    icon: MessageCircle,
    color: '#00C300',
    getShareUrl: (url: string) => 
      `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`
  },
  {
    id: 'zalo',
    name: 'Zalo',
    icon: MessageCircle,
    color: '#0068FF',
    getShareUrl: () => 
      `https://zalo.me/`
  },
  {
    id: 'kakaotalk',
    name: 'KakaoTalk',
    icon: MessageCircle,
    color: '#3C1E1E',
    getShareUrl: (url: string) => 
      `https://story.kakao.com/share?url=${encodeURIComponent(url)}`
  },
  {
    id: 'helo',
    name: 'Helo',
    icon: Share2,
    color: '#FF6B00',
    getShareUrl: () => 
      `https://helo.com/`
  },
  {
    id: 'telegram',
    name: 'Telegram',
    icon: Send,
    color: '#0088cc',
    getShareUrl: (url: string, title?: string) => 
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title || '')}`
  },
];

const ShareButton: React.FC<ShareButtonProps> = ({
  url,
  title,
  trigger,
  className = '',
}) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close modal on ESC key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showShareModal) {
        setShowShareModal(false);
      }
    };

    if (showShareModal) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showShareModal]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowShareModal(false);
      }
    };

    if (showShareModal) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showShareModal]);

  const handleOpenModal = () => {
    setShowShareModal(true);
    setCopied(false);
  };

  const handleShare = (platform: typeof socialPlatforms[0]) => {
    const shareUrl = platform.getShareUrl(url, title);
    
    // For mobile apps (WeChat, Viber, etc.), try to open the app
    if (shareUrl.startsWith('weixin://') || shareUrl.startsWith('viber://')) {
      window.location.assign(shareUrl);
    } else {
      // Open in new window
      window.open(shareUrl, '_blank', 'width=600,height=400,noopener,noreferrer');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  const defaultTrigger = (
    <motion.button
      onClick={handleOpenModal}
      whileTap={{ scale: 0.9 }}
      className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-colors duration-200 ${theme === 'dark' ? 'text-gray-400 hover:text-green-500 hover:bg-green-500/10' : 'text-gray-500 hover:text-green-500 hover:bg-green-500/10'}`}
    >
      <Share2 className="w-5 h-5" />
      <span className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>0</span>
    </motion.button>
  );

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    handleOpenModal();
  };

  return (
    <>
      {trigger ? (
        <div
          className={className}
          onClick={handleTriggerClick}
          style={{ pointerEvents: 'auto' }}
        >
          {React.isValidElement(trigger)
            ? React.cloneElement(trigger as React.ReactElement<any>, {
                onClick: (e: React.MouseEvent) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleOpenModal();
                },
                style: { pointerEvents: 'auto' as const, ...(trigger.props as any)?.style }
              })
            : trigger
          }
        </div>
      ) : (
        defaultTrigger
      )}

      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {showShareModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-2 md:p-4"
              onClick={(e) => {
                // Only close if clicking directly on backdrop (not on modal content)
                if (e.target === e.currentTarget) {
                  setShowShareModal(false);
                }
              }}
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(4px)',
              }}
            >
              <motion.div
                ref={modalRef}
                initial={{ 
                  opacity: 0, 
                  y: isMobile ? '100%' : 20,
                  scale: isMobile ? 1 : 0.95
                }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  scale: 1
                }}
                exit={{ 
                  opacity: 0, 
                  y: isMobile ? '100%' : 20,
                  scale: isMobile ? 1 : 0.95
                }}
                transition={{ 
                  duration: isMobile ? 0.3 : 0.2,
                  ease: [0.4, 0, 0.2, 1]
                }}
                onClick={(e) => e.stopPropagation()}
                className={`w-full sm:w-full sm:max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl shadow-2xl ${
                  theme === 'dark'
                    ? 'bg-gray-900 border-t border-l border-r border-gray-800 sm:border'
                    : 'bg-white border-t border-l border-r border-gray-200 sm:border'
                }`}
              >
                {/* Mobile Drag Handle */}
                {isMobile && (
                  <div className="flex justify-center pt-3 pb-2">
                    <div className={`w-12 h-1.5 rounded-full ${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                    }`} />
                  </div>
                )}
                
                {/* Modal Header */}
                <div className={`px-4 py-3 sm:px-6 sm:py-5 border-b ${
                  theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        theme === 'dark'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-green-50 text-green-600'
                      }`}>
                        <Share2 className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className={`text-base sm:text-lg font-semibold truncate ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          Share Post
                        </h3>
                        <p className={`text-xs sm:text-sm mt-0.5 ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Share this post on social media
                        </p>
                      </div>
                    </div>
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowShareModal(false);
                      }}
                      whileTap={{ scale: 0.9 }}
                      className={`p-1.5 sm:p-2 rounded-full transition-colors duration-200 flex-shrink-0 ${
                        theme === 'dark'
                          ? 'hover:bg-gray-800 text-gray-400 hover:text-white'
                          : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </motion.button>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="px-4 py-3 sm:px-6 sm:py-5">
                  {/* Social Media Grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 sm:gap-3 max-h-[40vh] sm:max-h-[35vh] overflow-y-auto scrollbar-hide mb-4 sm:mb-6">
                    {socialPlatforms.map((platform) => {
                      const Icon = platform.icon;
                      return (
                        <motion.button
                          key={platform.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(platform);
                          }}
                          whileTap={{ scale: 0.96 }}
                          whileHover={{ 
                            scale: 1.02,
                            transition: { duration: 0.15 }
                          }}
                          className={`group relative flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl transition-all duration-200 ${
                            theme === 'dark'
                              ? 'bg-gray-800/50 hover:bg-gray-800 border border-gray-700/30 hover:border-gray-700/50'
                              : 'bg-gray-50/80 hover:bg-gray-100 border border-gray-200/60 hover:border-gray-300/80'
                          }`}
                        >
                          {/* Icon container */}
                          <div
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mb-1.5 sm:mb-2 transition-all duration-200 group-hover:scale-105"
                            style={{ 
                              backgroundColor: theme === 'dark' 
                                ? platform.color + '15' 
                                : platform.color + '08',
                            }}
                          >
                            <Icon
                              className="w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-200"
                              style={{ color: platform.color }}
                            />
                          </div>
                          
                          {/* Platform name */}
                          <span className={`text-[10px] sm:text-[11px] font-medium text-center leading-tight transition-colors duration-200 ${
                            theme === 'dark' 
                              ? 'text-gray-400 group-hover:text-gray-300' 
                              : 'text-gray-600 group-hover:text-gray-700'
                          }`}>
                            {platform.name}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Copy Link Section */}
                  <div className={`p-3 sm:p-4 rounded-lg sm:rounded-xl ${
                    theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'
                  }`}>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                      <div className={`flex-1 px-3 sm:px-4 py-2 rounded-lg min-w-0 ${
                        theme === 'dark' ? 'bg-gray-900 text-gray-300' : 'bg-white text-gray-700'
                      }`}>
                        <p className="text-xs sm:text-sm truncate">{url}</p>
                      </div>
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyLink();
                        }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap ${
                          copied
                            ? theme === 'dark'
                              ? 'bg-green-600 text-white'
                              : 'bg-green-600 text-white'
                            : theme === 'dark'
                              ? 'bg-gray-700 text-white hover:bg-gray-600'
                              : 'bg-gray-900 text-white hover:bg-gray-800'
                        }`}
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default ShareButton;
