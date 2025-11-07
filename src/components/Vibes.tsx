import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { getSafeImageURL } from '../helpers/helpers';
import { serviceURL, defaultServiceServerId } from '../appSettings';

interface Reel {
  id: string;
  mediaUrl: string;
  mediaType: 'video' | 'image';
  posterUrl?: string; // Video için poster image
  username: string;
  avatar: string;
  description: string;
  music: string;
  likes: number;
  comments: number;
}

interface ReelsProps {
  reels?: Reel[];
  activeTab?: string;
  onPostClick?: (postId: string, username: string) => void;
}


export default function Vibes({ reels: initialReels, activeTab: _activeTab, onPostClick: _onPostClick }: ReelsProps) {
  const [allReels, setAllReels] = useState<Reel[]>(initialReels || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedReels, setLikedReels] = useState<Set<string>>(new Set());
  const [savedReels, setSavedReels] = useState<Set<string>>(new Set());
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [tabHeaderHeight, setTabHeaderHeight] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cursor, setCursor] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const nextVideoRef = useRef<HTMLVideoElement>(null);
  const prevVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isLoadingMoreRef = useRef(false);
  const [isVideoBuffering, setIsVideoBuffering] = useState(false);
  const [containerHeight, setContainerHeight] = useState(window.innerHeight);
  const [calculatedTopOffset, setCalculatedTopOffset] = useState(0);

  const currentReel = allReels[currentIndex];

  // Fetch vibes from API
  const fetchVibesFromAPI = useCallback(async (loadMore = false) => {
    try {
      setIsLoading(true);
      
      // loadMore ise mevcut cursor'ı kullan, değilse boş string
      const currentCursor = loadMore ? cursor : '';
      console.log('Fetching vibes with cursor:', currentCursor, 'loadMore:', loadMore);
      
      const response = await api.fetchVibes({
        limit: 10,
        cursor: currentCursor,
      });

      console.log('Vibes API Response:', response);

      // API'den gelen veriyi Reel formatına dönüştür
      // Yeni format: response.posts array'i
      const posts = response.posts || [];
      const newReels: Reel[] = posts
        .filter((post: any) => post.attachments && post.attachments.length > 0) // En az bir attachment olan post'ları al
        .map((post: any) => {
          // İlk attachment'ı kullan (reel için tek medya)
          const attachment = post.attachments[0];
          const file = attachment.file;
          const author = post.author;
          
          // Mime type'a göre video mu image mi belirle
          const mimeType = file?.mime_type || '';
          const isVideo = mimeType.startsWith('video/');
          
          // Medya URL'ini güvenli bir şekilde al
          let mediaUrl = '';
          let posterUrl = '';
          
          if (isVideo) {
            // Video için - variants varsa kullan
            // Öncelik: high > medium > low > preview > original > storage_path
            mediaUrl = getSafeImageURL(attachment, 'high') || 
                      getSafeImageURL(attachment, 'medium') || 
                      getSafeImageURL(attachment, 'low') || 
                      getSafeImageURL(attachment, 'preview') || 
                      getSafeImageURL(attachment, 'original') || '';
            
            // Eğer variants'tan bulamadıysak, storage_path'i dene
            if (!mediaUrl && file?.storage_path) {
              const serviceURI = serviceURL[defaultServiceServerId];
              const path = file.storage_path.replace(/^\.\//, '');
              mediaUrl = `${serviceURI}/${path}`;
            }
            
            // Video poster'ı al
            posterUrl = getSafeImageURL(attachment, 'poster') || '';
          } else {
            // Image için - helper fonksiyonunu kullan
            // Öncelik: large > medium > small > original
            mediaUrl = getSafeImageURL(attachment, 'large') || 
                      getSafeImageURL(attachment, 'medium') || 
                      getSafeImageURL(attachment, 'small') || 
                      getSafeImageURL(attachment, 'original') || '';
          }

          // User avatar'ını al
          const avatarUrl = (getSafeImageURL(author.avatar, 'small') || getSafeImageURL(author.avatar, 'medium') || '')

          return {
            id: attachment.id || attachment.public_id || post.id || post.public_id,
            mediaUrl: mediaUrl,
            mediaType: isVideo ? 'video' : 'image',
            posterUrl: isVideo ? posterUrl : undefined,
            username: author?.username || author?.displayname || 'Kullanıcı',
            avatar: avatarUrl,
            description: file?.name?.replace(/\.(jpg|jpeg|png|webp|gif|mp4|mov)$/i, '') || 'Vibe',
            likes: Math.floor(Math.random() * 10000) + 100, // Random like sayısı
            comments: Math.floor(Math.random() * 1000) + 10, // Random yorum sayısı
          };
        });

      if (loadMore) {
        setAllReels(prev => [...prev, ...newReels]);
      } else {
        setAllReels(newReels);
      }

      // Cursor'ı güncelle - eğer next_cursor varsa daha fazla veri var demektir
      // Yeni format: response.next_cursor (en üst seviyede)
      if (response.next_cursor) {
        const newCursor = response.next_cursor.toString();
        console.log('New cursor received:', newCursor);
        setCursor(newCursor);
        setHasMore(true);
      } else {
        console.log('No more cursor - end of data');
        setCursor('');
        setHasMore(false);
      }
    } catch (error) {
      console.error('Vibes yüklenirken hata:', error);
      // Hata durumunda fallback olarak örnek data kullan
      if (!loadMore) {
      }
    } finally {
      setIsLoading(false);
    }
  }, [cursor]);

  // İlk yükleme
  useEffect(() => {
    if (!initialReels) {
      fetchVibesFromAPI(false);
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // İlk yükleme sadece bir kez çalışmalı

  // Detect mobile and calculate header/bottom bar heights
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate header, tab header and bottom bar heights
  useEffect(() => {
    if (isMobile) {
      // Calculate tab header height dynamically
      const calculateTabHeaderHeight = () => {
        requestAnimationFrame(() => {
          // Find the tab header in HomeScreen (sticky top-0 with z-40)
          // Try multiple selectors to find the tab bar
          let tabHeader = document.querySelector('div.sticky.top-0.z-40.border-b') as HTMLElement;
          
          // If not found, try alternative selector
          if (!tabHeader) {
            tabHeader = document.querySelector('[class*="sticky"][class*="top-0"][class*="z-40"]') as HTMLElement;
          }
          
          // If still not found, look for element containing "Cool" and "Vibes" text
          if (!tabHeader) {
            const allSticky = document.querySelectorAll('[class*="sticky"]');
            for (const el of allSticky) {
              if (el.textContent?.includes('Cool') || el.textContent?.includes('Vibes')) {
                tabHeader = el as HTMLElement;
                break;
              }
            }
          }
          
          if (tabHeader) {
            const height = tabHeader.getBoundingClientRect().height;
            console.log('Tab header height calculated:', height, 'element:', tabHeader);
            setTabHeaderHeight(height);
          } else {
            // Fallback: py-4 + icon + text ≈ 80px
            console.log('Tab header not found, using fallback height: 80px');
            setTabHeaderHeight(80);
          }
        });
      };
      
      calculateTabHeaderHeight();
      
      // Recalculate on resize
      window.addEventListener('resize', calculateTabHeaderHeight);
      
      const observer = new MutationObserver(() => {
        calculateTabHeaderHeight();
      });
      observer.observe(document.body, { childList: true, subtree: true, attributes: true });
      
      return () => {
        window.removeEventListener('resize', calculateTabHeaderHeight);
        observer.disconnect();
      };
    } else {
      // Desktop: only calculate tab header height
      const calculateTabHeaderHeight = () => {
        requestAnimationFrame(() => {
          // Find the tab header in HomeScreen (sticky top-0 with z-40)
          const tabHeader = document.querySelector('div.sticky.top-0.z-40.border-b') as HTMLElement;
          if (tabHeader) {
            const height = tabHeader.getBoundingClientRect().height;
            setTabHeaderHeight(height);
          } else {
            // Fallback: py-4 + content ≈ 64px
            setTabHeaderHeight(64);
          }
        });
      };
      
      calculateTabHeaderHeight();
      
      window.addEventListener('resize', calculateTabHeaderHeight);
      const observer = new MutationObserver(() => {
        calculateTabHeaderHeight();
      });
      observer.observe(document.body, { childList: true, subtree: true, attributes: true });
      
      return () => {
        window.removeEventListener('resize', calculateTabHeaderHeight);
        observer.disconnect();
      };
    }
  }, [isMobile]);

  // Video kontrolü - Current video playback with buffer monitoring
  useEffect(() => {
    if (currentReel && currentReel.mediaType === 'video' && videoRef.current) {
      const video = videoRef.current;
      
      // Ses kontrolü
      video.muted = isMuted;
      
      // Buffer event listeners
      const handleWaiting = () => setIsVideoBuffering(true);
      const handleCanPlay = () => setIsVideoBuffering(false);
      const handlePlaying = () => setIsVideoBuffering(false);
      
      video.addEventListener('waiting', handleWaiting);
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('playing', handlePlaying);
      
      // Video yüklendiğinde otomatik başlat
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                setIsPlaying(true);
                setIsVideoBuffering(false);
              })
              .catch(err => {
                console.log('Video play error:', err);
                setIsPlaying(false);
              });
          }
        });
      });
      
      // Cleanup
      return () => {
        video.removeEventListener('waiting', handleWaiting);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('playing', handlePlaying);
      };
    }
  }, [currentIndex, currentReel, isMuted]);
  
  // Hide bottom navigation bar when Vibes is active
  useEffect(() => {
    if (isMobile) {
      // Find and hide bottom navigation
      const bottomNav = document.querySelector('nav.fixed.bottom-0') as HTMLElement;
      if (bottomNav) {
        bottomNav.style.display = 'none';
      }
      
      return () => {
        // Restore bottom navigation on unmount
        if (bottomNav) {
          bottomNav.style.display = '';
        }
      };
    }
  }, [isMobile]);
  
  // Setup scroll event listener to track current index
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const newIndex = Math.round(scrollTop / containerHeight);
      
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < allReels.length) {
        setCurrentIndex(newIndex);
        setIsMuted(true);
        setIsPlaying(true);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [containerHeight, currentIndex, allReels.length]);
  
  // Cleanup - component unmount olduğunda tüm videoları durdur
  useEffect(() => {
    return () => {
      // Stop and clear videos
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
      }
      if (nextVideoRef.current) {
        nextVideoRef.current.pause();
        nextVideoRef.current.src = '';
      }
      if (prevVideoRef.current) {
        prevVideoRef.current.pause();
        prevVideoRef.current.src = '';
      }
    };
  }, []);

  // Auto-load more when nearing end
  useEffect(() => {
    // Son 3 item'a geldiğinde ve daha fazla veri varsa otomatik yükle
    const shouldLoadMore = currentIndex >= allReels.length - 3 && 
                          !isLoading && 
                          hasMore && 
                          cursor && 
                          !isLoadingMoreRef.current;
    
    if (shouldLoadMore) {
      console.log('Load more triggered, cursor:', cursor, 'currentIndex:', currentIndex, 'length:', allReels.length);
      isLoadingMoreRef.current = true;
      fetchVibesFromAPI(true).finally(() => {
        isLoadingMoreRef.current = false;
      });
    }
    
    // Kayıtlar bitti ama hala scroll ediyorsa - cursor'u sıfırla ve sonuna ekle (infinite loop)
    if (currentIndex >= allReels.length - 3 && !hasMore && allReels.length > 0 && !isLoading && !isLoadingMoreRef.current) {
      console.log('End reached, resetting cursor for infinite loop');
      // Cursor'u sıfırla ve hasMore'u true yap
      setCursor('');
      setHasMore(true);
      
      // Baştan yeni veri çek ve SONUNA EKLE
      isLoadingMoreRef.current = true;
      fetchVibesFromAPI(true).finally(() => {
        isLoadingMoreRef.current = false;
      });
    }
  }, [currentIndex, allReels.length, cursor, hasMore, isLoading, fetchVibesFromAPI]);

  const toggleLike = useCallback(() => {
    if (!currentReel) return;
    setLikedReels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentReel.id)) {
        newSet.delete(currentReel.id);
      } else {
        newSet.add(currentReel.id);
      }
      return newSet;
    });
  }, [currentReel]);

  const toggleSave = useCallback(() => {
    if (!currentReel) return;
    setSavedReels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentReel.id)) {
        newSet.delete(currentReel.id);
      } else {
        newSet.add(currentReel.id);
      }
      return newSet;
    });
  }, [currentReel]);

  const togglePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Event bubbling'i engelle
    
    if (!currentReel || currentReel.mediaType !== 'video' || !videoRef.current) return;
    
    const video = videoRef.current;
    
    // İlk tıklamada sesi aç
    if (isMuted) {
      setIsMuted(false);
      video.muted = false;
    }
    
    // Video'nun gerçek durumunu kontrol et
    if (video.paused) {
      // Video durduysa, başlat
      video.play().catch(err => {
        console.log('Toggle play error:', err);
      });
      setIsPlaying(true);
    } else {
      // Video oynuyorsa, durdur
      video.pause();
      setIsPlaying(false);
    }
  }, [currentReel, isMuted]);

  // Calculate total top offset - Tab bar'ın altından başlamalı
  useEffect(() => {
    if (isMobile) {
      const calculateTopOffset = () => {
        requestAnimationFrame(() => {
          // Tab bar element'ini bul
          let tabBar = document.querySelector('div.sticky.top-0.z-40.border-b') as HTMLElement;
          
          if (!tabBar) {
            // Alternative selector
            const allSticky = document.querySelectorAll('[class*="sticky"]');
            for (const el of allSticky) {
              if (el.textContent?.includes('Cool') || el.textContent?.includes('Vibes')) {
                tabBar = el as HTMLElement;
                break;
              }
            }
          }
          
          if (tabBar) {
            const rect = tabBar.getBoundingClientRect();
            const tabBarBottom = rect.bottom; // Tab bar'ın alt kenarı (viewport'a göre)
            console.log('Tab bar bottom position:', tabBarBottom, 'height:', rect.height);
            setCalculatedTopOffset(tabBarBottom);
          } else {
            // Fallback: tab header height kullan
            console.log('Tab bar not found, using tabHeaderHeight:', tabHeaderHeight || 80);
            setCalculatedTopOffset(tabHeaderHeight || 80);
          }
        });
      };
      
      calculateTopOffset();
      
      // Recalculate on resize and scroll
      window.addEventListener('resize', calculateTopOffset);
      window.addEventListener('scroll', calculateTopOffset);
      
      return () => {
        window.removeEventListener('resize', calculateTopOffset);
        window.removeEventListener('scroll', calculateTopOffset);
      };
    } else {
      setCalculatedTopOffset(tabHeaderHeight || 0);
    }
  }, [isMobile, tabHeaderHeight]);
  
  // Use calculated offset
  const totalTopOffset = calculatedTopOffset;
  
  // Update container height when dimensions change
  useEffect(() => {
    const updateContainerHeight = () => {
      const height = isMobile 
        ? window.innerHeight - totalTopOffset
        : (tabHeaderHeight > 0 ? window.innerHeight - tabHeaderHeight : window.innerHeight);
      setContainerHeight(height);
    };
    
    updateContainerHeight();
    window.addEventListener('resize', updateContainerHeight);
    return () => window.removeEventListener('resize', updateContainerHeight);
  }, [isMobile, totalTopOffset, tabHeaderHeight]);
  
  // Set initial scroll position to current index
  useEffect(() => {
    const container = containerRef.current;
    if (container && containerHeight > 0) {
      container.scrollTo({
        top: currentIndex * containerHeight,
        behavior: 'auto', // Instant scroll on mount
      });
    }
  }, [containerHeight]); // Only on initial render when height is set
  
  // Calculate container height and positioning - Memoized for performance
  const containerStyle = useMemo(() => isMobile
    ? {
        position: 'fixed' as const,
        top: `${totalTopOffset}px`,
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        height: `100dvh`,
        overflowX: 'hidden' as const,
        overflowY: 'hidden' as const,
        touchAction: 'pan-y' as const,
        overscrollBehavior: 'none' as const,
        WebkitOverflowScrolling: 'touch' as const,
        WebkitUserSelect: 'none' as const,
        userSelect: 'none' as const,
        zIndex: 10,
      }
    : {
        position: 'relative' as const,
        height: tabHeaderHeight > 0 ? `calc(100vh - ${tabHeaderHeight}px)` : '100vh',
        marginTop: 0,
        touchAction: 'pan-y' as const,
      }, [isMobile, totalTopOffset, tabHeaderHeight]);

  // Loading state
  if (isLoading && allReels.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center w-full bg-black"
        style={containerStyle}
      >
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full"
          />
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white text-sm"
          >
            Vibes yükleniyor...
          </motion.p>
        </div>
      </motion.div>
    );
  }

  // No data state
  if (!currentReel) {
    return (
      <div
        className="flex flex-col items-center justify-center w-full bg-black"
        style={containerStyle}
      >
        <p className="text-white text-sm">Henüz vibe yok</p>
      </div>
    );
  }

  return (
    <>
    <div
      ref={containerRef}
        className="flex flex-col w-full bg-black select-none [&::-webkit-scrollbar]:hidden"
        style={{
          ...containerStyle,
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          scrollBehavior: 'smooth',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Render all videos with scroll-snap - TikTok/Instagram style */}
        {allReels.map((reel, index) => (
        <div
          key={reel.id}
          style={{
            height: `${containerHeight}px`,
            width: '100%',
            scrollSnapAlign: 'start',
            scrollSnapStop: 'always',
            position: 'relative',
            flexShrink: 0,
          }}
        >
          {reel.mediaType === 'video' ? (
            <>
              <video
                ref={index === currentIndex ? videoRef : index === currentIndex + 1 ? nextVideoRef : index === currentIndex - 1 ? prevVideoRef : null}
                src={reel.mediaUrl}
                className="w-full h-full object-cover"
                loop
                playsInline
                muted={index === currentIndex ? isMuted : true}
                autoPlay={index === currentIndex}
                onClick={index === currentIndex ? togglePlay : undefined}
                poster={reel.posterUrl}
                preload="auto"
              />
              {index === currentIndex && (
                <AnimatePresence mode="wait">
                  {!isPlaying && !isVideoBuffering && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ 
                        duration: 0.12,
                        ease: [0.25, 0.1, 0.25, 1]
                      }}
                      className="absolute inset-0 flex items-center justify-center z-10"
                      style={{ pointerEvents: 'none' }}
                    >
                      <motion.button
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.88 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        onClick={togglePlay}
                        className="bg-black/50 rounded-full p-6 backdrop-blur-md cursor-pointer shadow-2xl"
                        style={{ pointerEvents: 'auto' }}
                      >
                        <Play className="w-16 h-16 text-white drop-shadow-lg" fill="white" />
                      </motion.button>
                    </motion.div>
                  )}
                  {isVideoBuffering && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
                    >
                      <div className="bg-black/40 rounded-full p-4 backdrop-blur-md">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                          className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full"
                        />
                  </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </>
          ) : (
            <img
              src={reel.mediaUrl}
              alt={reel.description}
              className="w-full h-full object-cover"
            />
          )}
          
          {/* Overlay for every video - always visible */}
          <div 
            className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-32 pointer-events-none"
            style={{
              zIndex: 10,
              backfaceVisibility: 'hidden' as const,
              WebkitBackfaceVisibility: 'hidden' as const,
              WebkitFontSmoothing: 'antialiased' as const,
            }}
          >
        <div className="pointer-events-auto flex items-end justify-between">
          <div className="flex-1 pb-2">
            <div className="flex items-center gap-3 mb-3">
              <img
                    src={reel.avatar}
                    alt={reel.username}
                className="w-10 h-10 rounded-full border-2 border-white"
              />
              <span className="text-white font-semibold text-sm">
                    {reel.username}
              </span>
                  <motion.button 
                    whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,1)', color: '#000' }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-1 border border-white rounded text-white text-xs font-semibold"
                  >
                Takip Et
                  </motion.button>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 ml-4">
                <motion.button
                  onClick={index === currentIndex ? toggleLike : undefined}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.85 }}
                  className="flex flex-col items-center gap-1"
            >
              <Heart
                    className={`w-7 h-7 transition-colors duration-200 ${
                      likedReels.has(reel.id)
                        ? 'text-red-500 fill-red-500'
                    : 'text-white'
                }`}
              />
              <span className="text-white text-xs font-semibold">
                    {reel.likes + (likedReels.has(reel.id) ? 1 : 0)}
              </span>
                </motion.button>

                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.85 }}
                  className="flex flex-col items-center gap-1"
                >
              <MessageCircle className="w-7 h-7 text-white" />
              <span className="text-white text-xs font-semibold">
                    {reel.comments}
              </span>
                </motion.button>

                <motion.button
                  onClick={index === currentIndex ? toggleSave : undefined}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.85 }}
                  className="flex flex-col items-center gap-1"
            >
              <Bookmark
                    className={`w-7 h-7 transition-colors duration-200 ${
                      savedReels.has(reel.id)
                        ? 'text-yellow-400 fill-yellow-400'
                    : 'text-white'
                }`}
              />
                </motion.button>

                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.85 }}
                  className="flex flex-col items-center gap-1"
                >
              <Share2 className="w-7 h-7 text-white" />
                </motion.button>

                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.85 }}
                  className="flex flex-col items-center gap-1"
                >
              <MoreHorizontal className="w-7 h-7 text-white" />
                </motion.button>

                {/* Loading spinner - only visible on current video when loading */}
                {index === currentIndex && (
                  <div className="flex flex-col items-center">
                    <motion.div
                      animate={isLoading && allReels.length > 0 ? { rotate: 360 } : {}}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        ))}
      </div>

      {/* Progress Indicator - Fixed position, always visible */}
      {allReels.length > 0 && (
        <div 
          className="fixed flex flex-col gap-1 overflow-hidden pointer-events-none" 
          style={{ 
            right: isMobile ? '8px' : '8px',
            top: isMobile ? `calc(${totalTopOffset}px + 50vh)` : '50vh',
            transform: 'translateY(-50%)',
            maxHeight: isMobile ? 'calc(50vh - 4rem)' : 'calc(100vh - 4rem)',
            zIndex: 9999,
            backfaceVisibility: 'hidden' as const,
            WebkitBackfaceVisibility: 'hidden' as const,
            position: 'fixed' as const,
          }}
        >
          {allReels.slice(Math.max(0, currentIndex - 3), Math.min(currentIndex + 7, allReels.length)).map((_, arrayIndex) => {
            const index = Math.max(0, currentIndex - 3) + arrayIndex;
            return (
              <motion.div
            key={index}
                animate={{
                  scale: index === currentIndex ? 1.4 : 1,
                  opacity: index === currentIndex ? 1 : 0.3,
                  height: index === currentIndex ? 12 : 8,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 25,
                }}
                className={`w-1 rounded-full ${
                  index === currentIndex ? 'bg-white shadow-lg shadow-white/50' : 'bg-white/40'
            }`}
          />
            );
          })}
      </div>
      )}
    </>
  );
}
