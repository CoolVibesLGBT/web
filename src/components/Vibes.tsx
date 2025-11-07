import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Music, Play } from 'lucide-react';
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

const generateReels = (): Reel[] => {
  const sampleData = [
    {
      username: 'mehmet_yilmaz',
      avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100',
      description: 'Harika bir gün plajda 🏖️ #deniz #tatil #günbatımı',
      music: 'Orijinal Ses - mehmet_yilmaz',
      mediaType: 'video' as const,
      mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-person-walking-on-the-beach-1937-large.mp4',
    },
    {
      username: 'ayse_demir',
      avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100',
      description: 'Bahar geldi, çiçekler açtı 🌸 #bahar #doğa #güzellik',
      music: 'Spring Vibes - Lofi Beats',
      mediaType: 'image' as const,
      mediaUrl: 'https://images.pexels.com/photos/1761279/pexels-photo-1761279.jpeg?auto=compress&cs=tinysrgb&w=600',
    },
    {
      username: 'can_ozturk',
      avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=100',
      description: 'Neon ışıkları altında 💜 #neon #gece #stil',
      music: 'Night Drive - Synthwave Mix',
      mediaType: 'video' as const,
      mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-under-multicolored-lights-1237-large.mp4',
    },
    {
      username: 'elif_kaya',
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100',
      description: 'Kahvemi içerken şehrin güzelliğini izliyorum ☕ #kafe #şehir #sakinlik',
      music: 'Coffee Shop Ambient',
      mediaType: 'image' as const,
      mediaUrl: 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=600',
    },
    {
      username: 'burak_aslan',
      avatar: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=100',
      description: 'Dağlarda doğa yürüyüşü 🏔️ #dağ #doğa #macera',
      music: 'Adventure Awaits',
      mediaType: 'video' as const,
      mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4',
    },
    {
      username: 'zeynep_tasci',
      avatar: 'https://images.pexels.com/photos/1181720/pexels-photo-1181720.jpeg?auto=compress&cs=tinysrgb&w=100',
      description: 'Günbatımı saati en güzel saattir 🌅 #gün #batımı #doğa',
      music: 'Sunset Dreams',
      mediaType: 'image' as const,
      mediaUrl: 'https://images.pexels.com/photos/1382731/pexels-photo-1382731.jpeg?auto=compress&cs=tinysrgb&w=600',
    },
    {
      username: 'ali_celik',
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100',
      description: 'Spor yapmak için harika bir gün 💪 #spor #fitness #sağlık',
      music: 'Pump It Up',
      mediaType: 'image' as const,
      mediaUrl: 'https://images.pexels.com/photos/4164840/pexels-photo-4164840.jpeg?auto=compress&cs=tinysrgb&w=600',
    },
    {
      username: 'sila_yildirim',
      avatar: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=100',
      description: 'Şehir hayatının hızı 🏙️ #şehir #gece #ışıklar',
      music: 'City Lights',
      mediaType: 'image' as const,
      mediaUrl: 'https://images.pexels.com/photos/324658/pexels-photo-324658.jpeg?auto=compress&cs=tinysrgb&w=600',
    },
    {
      username: 'fatih_demirci',
      avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100',
      description: 'Yemeği severim, özellikle bu tarifi 👨‍🍳 #yemek #aşçı #lezzet',
      music: 'Cooking Vibes',
      mediaType: 'image' as const,
      mediaUrl: 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=600',
    },
    {
      username: 'merve_oz',
      avatar: 'https://images.pexels.com/photos/1382731/pexels-photo-1382731.jpeg?auto=compress&cs=tinysrgb&w=100',
      description: 'Güzellik ve doğa bir arada 💄 #güzellik #makyaj #doğal',
      music: 'Beauty Beats',
      mediaType: 'image' as const,
      mediaUrl: 'https://images.pexels.com/photos/3621685/pexels-photo-3621685.jpeg?auto=compress&cs=tinysrgb&w=600',
    },
    {
      username: 'yusuf_kara',
      avatar: 'https://images.pexels.com/photos/1181720/pexels-photo-1181720.jpeg?auto=compress&cs=tinysrgb&w=100',
      description: 'Motosiklet turunun başı 🏍️ #motor #yol #macera',
      music: 'Road Trip Vibes',
      mediaType: 'image' as const,
      mediaUrl: 'https://images.pexels.com/photos/2103127/pexels-photo-2103127.jpeg?auto=compress&cs=tinysrgb&w=600',
    },
    {
      username: 'gamze_arslan',
      avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100',
      description: 'Sanat ve yaratıcılık başka bir seviyede 🎨 #sanat #yaratıcı #tasarım',
      music: 'Creative Flow',
      mediaType: 'image' as const,
      mediaUrl: 'https://images.pexels.com/photos/3945657/pexels-photo-3945657.jpeg?auto=compress&cs=tinysrgb&w=600',
    },
  ];

  return sampleData.map((item, index) => ({
    id: `${index}`,
    username: item.username,
    avatar: item.avatar,
    description: item.description,
    music: item.music,
    mediaType: item.mediaType,
    mediaUrl: item.mediaUrl,
    likes: Math.floor(Math.random() * 10000) + 100,
    comments: Math.floor(Math.random() * 1000) + 10,
  }));
};

export default function Vibes({ reels: initialReels, activeTab: _activeTab, onPostClick: _onPostClick }: ReelsProps) {
  const [allReels, setAllReels] = useState<Reel[]>(initialReels || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState<number | null>(null);
  const [likedReels, setLikedReels] = useState<Set<string>>(new Set());
  const [savedReels, setSavedReels] = useState<Set<string>>(new Set());
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [tabHeaderHeight, setTabHeaderHeight] = useState(0);
  const [bottomBarHeight, setBottomBarHeight] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cursor, setCursor] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const nextVideoRef = useRef<HTMLVideoElement>(null);
  const prevVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const touchStartTime = useRef<number>(0);
  const touchLastY = useRef<number>(0);
  const velocityY = useRef<number>(0);
  const lastScrollTime = useRef<number>(0);
  const isLoadingMoreRef = useRef(false);
  const [touchOffset, setTouchOffset] = useState(0);

  const currentReel = allReels[currentIndex];
  const displayReel = nextIndex !== null ? allReels[nextIndex] : currentReel;

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
      const mediaItems = response.medias?.items || [];
      const newReels: Reel[] = mediaItems
        .filter((item: any) => item.media?.role === 'post') // Sadece post'ları al (story'leri hariç tut)
        .map((item: any) => {
          const media = item.media;
          const user = item.user;
          
          // Mime type'a göre video mu image mi belirle
          const mimeType = media.file?.mime_type || '';
          const isVideo = mimeType.startsWith('video/');
          
          // Medya URL'ini güvenli bir şekilde al
          let mediaUrl = '';
          let posterUrl = '';
          
          if (isVideo) {
            // Video için - variants varsa kullan
            // Öncelik: high > medium > low > preview > original > storage_path
            mediaUrl = getSafeImageURL(media, 'high') || 
                      getSafeImageURL(media, 'medium') || 
                      getSafeImageURL(media, 'low') || 
                      getSafeImageURL(media, 'preview') || 
                      getSafeImageURL(media, 'original') || '';
            
            // Eğer variants'tan bulamadıysak, storage_path'i dene
            if (!mediaUrl && media.file?.storage_path) {
              const serviceURI = serviceURL[defaultServiceServerId];
              const path = media.file.storage_path.replace(/^\.\//, '');
              mediaUrl = `${serviceURI}/${path}`;
            }
            
            // Video poster'ı al
            posterUrl = getSafeImageURL(media, 'poster') || '';
          } else {
            // Image için - helper fonksiyonunu kullan
            // Öncelik: large > medium > small > original
            mediaUrl = getSafeImageURL(media, 'large') || 
                      getSafeImageURL(media, 'medium') || 
                      getSafeImageURL(media, 'small') || 
                      getSafeImageURL(media, 'original') || '';
          }

          // User avatar'ını al
          const avatarUrl = user?.avatar 
            ? (getSafeImageURL(user.avatar, 'small') || getSafeImageURL(user.avatar, 'medium') || '')
            : 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100';

          return {
            id: media.id || media.public_id,
            mediaUrl: mediaUrl,
            mediaType: isVideo ? 'video' : 'image',
            posterUrl: isVideo ? posterUrl : undefined,
            username: user?.username || user?.displayname || 'Kullanıcı',
            avatar: avatarUrl,
            description: media.file?.name?.replace(/\.(jpg|jpeg|png|webp|gif|mp4|mov)$/i, '') || 'Vibe',
            music: 'Orijinal Ses',
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
      if (response.medias?.next_cursor) {
        const newCursor = response.medias.next_cursor.toString();
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
        setAllReels(prev => prev.length === 0 ? generateReels() : prev);
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
      // Mobile app header height (from App.tsx: py-3 + content ≈ 56px)
      const mainHeaderHeight = 56;
      setHeaderHeight(mainHeaderHeight);
      
      // Calculate tab header height dynamically
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
      
      // Bottom navigation bar height (from App.tsx: py-3 + safe area)
      const calculateBottomBarHeight = () => {
        // Use requestAnimationFrame for accurate measurement
        requestAnimationFrame(() => {
          // Try multiple selectors to find bottom bar
          const bottomBar = document.querySelector('nav.fixed.bottom-0') as HTMLElement;
          if (bottomBar) {
            // Get the actual rendered height
            const rect = bottomBar.getBoundingClientRect();
            const height = Math.ceil(rect.height); // Round up to ensure no gap
            setBottomBarHeight(height);
          } else {
            // Fallback: typical bottom bar height with safe area
            // Base height is typically 56px (py-3 = 12px top + 12px bottom + ~32px content)
            // Safe area inset is handled by CSS, but we add it here for calculation
            const safeAreaBottom = typeof window !== 'undefined' 
              ? parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-bottom)') || '0', 10) || 0
              : 0;
            setBottomBarHeight(56 + safeAreaBottom);
          }
        });
      };
      
      calculateTabHeaderHeight();
      calculateBottomBarHeight();
      
      // Recalculate on resize
      const handleResize = () => {
        calculateTabHeaderHeight();
        calculateBottomBarHeight();
      };
      window.addEventListener('resize', handleResize);
      
      const observer = new MutationObserver(() => {
        calculateTabHeaderHeight();
        calculateBottomBarHeight();
      });
      observer.observe(document.body, { childList: true, subtree: true, attributes: true });
      
      return () => {
        window.removeEventListener('resize', handleResize);
        observer.disconnect();
      };
    } else {
      // Desktop: only calculate tab header height
      setHeaderHeight(0);
      setBottomBarHeight(0);
      
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

  // Video kontrolü - Ana, Next ve Prev video preloading
  useEffect(() => {
    // Ana video kontrolü
    if (currentReel && currentReel.mediaType === 'video' && videoRef.current) {
      const video = videoRef.current;
      
      // Ses kontrolü
      video.muted = isMuted;
      
      // Video yüklendiğinde ve geçişte otomatik başlat
      if (nextIndex === null) {
        // requestAnimationFrame ile smooth başlatma
        requestAnimationFrame(() => {
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                setIsPlaying(true);
              })
              .catch(err => {
                console.log('Video play error:', err);
                setIsPlaying(false);
              });
          }
        });
      }
    }
    
    // Prev video preload - önceki videoyu arka planda hazırla
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : null;
    if (prevIndex !== null && allReels[prevIndex]?.mediaType === 'video' && prevVideoRef.current) {
      prevVideoRef.current.load(); // Preload
    }
    
    // Next video preload - sonraki videoyu arka planda hazırla  
    const nextVideoIndex = currentIndex < allReels.length - 1 ? currentIndex + 1 : null;
    if (nextVideoIndex !== null && allReels[nextVideoIndex]?.mediaType === 'video' && nextVideoRef.current) {
      nextVideoRef.current.load(); // Preload
    }
  }, [currentIndex, currentReel, nextIndex, isMuted, allReels]);
  
  // Next video için geçiş animasyonu kontrolü
  useEffect(() => {
    if (nextIndex !== null && allReels[nextIndex]?.mediaType === 'video' && nextVideoRef.current) {
      // Geçiş başlarken videoyu başlat
      requestAnimationFrame(() => {
        nextVideoRef.current?.play().catch(err => {
          console.log('Next video play error:', err);
        });
      });
    }
  }, [nextIndex, allReels]);
  
  // Cleanup - component unmount olduğunda tüm videoları durdur
  useEffect(() => {
    return () => {
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
  }, [currentIndex, allReels.length, cursor, hasMore, isLoading, fetchVibesFromAPI]);

  useEffect(() => {
    if (nextIndex !== null) {
      const timer = setTimeout(() => {
        const wasGoingToStart = nextIndex === 0 && currentIndex === allReels.length - 1;
        
        // requestAnimationFrame ile smooth state update
        requestAnimationFrame(() => {
          setCurrentIndex(nextIndex);
          setNextIndex(null);
          setIsTransitioning(false);
          setTouchOffset(0);
          setIsMuted(true);
          setIsPlaying(true);
        });
        
        // Başa dönüldüyse, fresh data çek
        if (wasGoingToStart) {
          console.log('Loop completed - fetching fresh data');
          // Slight delay to ensure smooth transition
          setTimeout(() => {
            fetchVibesFromAPI(false);
          }, 100);
        }
      }, 300); // Optimize transition timing
      return () => clearTimeout(timer);
    }
  }, [nextIndex, currentIndex, allReels.length, fetchVibesFromAPI]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isTransitioning) return;
    touchStartY.current = e.touches[0].clientY;
    touchLastY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
    velocityY.current = 0;
  }, [isTransitioning]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isTransitioning) return;
    
    // Prevent default to avoid scroll
    e.preventDefault();
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    const now = Date.now();
    
    // Velocity hesapla (px/ms) - son hareket için
    const deltaY = currentY - touchLastY.current;
    const deltaTime = now - touchStartTime.current;
    velocityY.current = deltaY / Math.max(deltaTime, 1);
    touchLastY.current = currentY;
    
    // Resistance effect - Direnç ekle (boundaries'e yaklaşırken)
    let resistance = 1;
    
    // Sadece başta (index 0) rubber band effect - son videoda değil çünkü başa dönüyor
    if (diff > 0 && currentIndex === 0) {
      resistance = 0.25;
    } 
    // Son videoda ve daha fazla data varsa rubber band
    else if (diff < 0 && currentIndex === allReels.length - 1 && hasMore) {
      resistance = 0.25;
    } 
    // Çok fazla swipe, azalan direnç
    else if (Math.abs(diff) > 150) {
      resistance = 0.5;
    }
    
    setTouchOffset(diff * resistance);
  }, [isTransitioning, currentIndex, allReels.length, hasMore]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (isTransitioning) return;
    
    const touchEndY = e.changedTouches[0].clientY;
    const touchEndTime = Date.now();
    const diff = touchStartY.current - touchEndY;
    const timeDiff = touchEndTime - touchStartTime.current;
    
    // Velocity-based decision (px/ms -> px/s for easier understanding)
    const velocity = Math.abs(velocityY.current) * 1000;
    const isQuickSwipe = velocity > 300; // 300px/s is quick
    const isVeryQuickSwipe = velocity > 800; // 800px/s is very quick
    
    // Dynamic threshold based on velocity and time
    let threshold = 80; // Default
    if (isVeryQuickSwipe) {
      threshold = 30; // Very low threshold for flick gestures
    } else if (isQuickSwipe) {
      threshold = 50; // Low threshold for quick swipes
    } else if (timeDiff > 500) {
      threshold = 100; // Higher threshold for slow swipes
    }
    
    // Reset offset with animation
    setTouchOffset(0);
    
    // Swipe decision - yeterli mesafe veya velocity varsa
    const shouldSwipe = Math.abs(diff) > threshold || (isVeryQuickSwipe && Math.abs(diff) > 20);
    
    if (shouldSwipe && timeDiff < 1000) {
      if (diff > 0) {
        // Swipe up - next video
        if (currentIndex < allReels.length - 1) {
          setNextIndex(currentIndex + 1);
          setIsTransitioning(true);
        } else if (!hasMore) {
          // Son videoda ve daha fazla data yok - başa dön
          setNextIndex(0);
          setIsTransitioning(true);
          // Cursor'ı resetle, yeni data çekmeye hazır ol
          setCursor('');
          setHasMore(true);
        }
      } else if (diff < 0 && currentIndex > 0) {
        // Swipe down - previous video
        setNextIndex(currentIndex - 1);
        setIsTransitioning(true);
      }
    }
    
    // Reset refs
    touchStartY.current = 0;
    touchLastY.current = 0;
    velocityY.current = 0;
  }, [isTransitioning, currentIndex, allReels.length, hasMore]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (isTransitioning) return;
    
    const now = Date.now();
    const timeSinceLastScroll = now - lastScrollTime.current;
    
    // Debounce - minimum 350ms aralık (daha responsive)
    if (timeSinceLastScroll < 350) return;
    
    // Threshold - çok küçük scroll'ları ignore et
    const scrollThreshold = 15;
    if (Math.abs(e.deltaY) < scrollThreshold) return;

    lastScrollTime.current = now;

    if (e.deltaY > 0) {
      // Scroll down - next video
      if (currentIndex < allReels.length - 1) {
        setNextIndex(currentIndex + 1);
        setIsTransitioning(true);
      } else if (!hasMore) {
        // Son videoda ve daha fazla data yok - başa dön
        setNextIndex(0);
        setIsTransitioning(true);
        // Cursor'ı resetle, yeni data çekmeye hazır ol
        setCursor('');
        setHasMore(true);
      }
    } else if (e.deltaY < 0 && currentIndex > 0) {
      // Scroll up - previous video
      setNextIndex(currentIndex - 1);
      setIsTransitioning(true);
    }
  }, [isTransitioning, currentIndex, allReels.length, hasMore]);

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

  // Calculate total top offset (app header + tab header)
  const totalTopOffset = useMemo(() => 
    isMobile ? headerHeight + tabHeaderHeight : 0,
    [isMobile, headerHeight, tabHeaderHeight]
  );
  
  // Calculate container height and positioning - Memoized for performance
  const containerStyle = useMemo(() => isMobile
    ? {
        position: 'fixed' as const,
        top: `${totalTopOffset}px`,
        bottom: `${bottomBarHeight || 56}px`,
        left: 0,
        right: 0,
        width: '100%',
        overflow: 'hidden' as const,
        touchAction: 'none' as const,
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
        touchAction: 'none' as const,
      }, [isMobile, totalTopOffset, bottomBarHeight, tabHeaderHeight]);

  // Loading state
  if (isLoading && allReels.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center w-full bg-black"
        style={containerStyle}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-white text-sm">Vibes yükleniyor...</p>
        </div>
      </div>
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
    <div
      ref={containerRef}
      className="flex flex-col w-full bg-black"
      style={containerStyle}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      <div 
        className="relative w-full flex-1 min-h-0"
        style={{
          flex: '1 1 auto',
          minHeight: 0,
          height: '100%',
          overflow: 'hidden',
          overscrollBehavior: 'none',
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            transform: `translate3d(0, ${touchOffset}px, 0) scale(${nextIndex === null ? 1 : 0.92})`,
            transition: touchOffset !== 0 ? 'none' : 'transform 0.3s cubic-bezier(0.33, 1, 0.68, 1)',
            willChange: touchOffset !== 0 ? 'transform' : 'auto',
            zIndex: nextIndex === null ? 2 : 1,
            backfaceVisibility: 'hidden' as const,
            WebkitBackfaceVisibility: 'hidden' as const,
          }}
        >
          {currentReel.mediaType === 'video' ? (
            <>
              <video
                key={currentReel.id}
                ref={videoRef}
                src={currentReel.mediaUrl}
                className="absolute inset-0 w-full h-full object-cover"
                loop
                playsInline
                muted={isMuted}
                autoPlay
                onClick={togglePlay}
                poster={currentReel.posterUrl}
                preload="auto"
                style={{ objectFit: 'cover' }}
              />
              <AnimatePresence>
                {!isPlaying && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ 
                      duration: 0.15,
                      ease: [0.33, 1, 0.68, 1]
                    }}
                    className="absolute inset-0 flex items-center justify-center z-10"
                    style={{ pointerEvents: 'none' }}
                  >
                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.88 }}
                      transition={{ duration: 0.1 }}
                      onClick={togglePlay}
                      className="bg-black/50 rounded-full p-6 backdrop-blur-sm cursor-pointer"
                      style={{ pointerEvents: 'auto' }}
                    >
                      <Play className="w-16 h-16 text-white" fill="white" />
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <img
              key={currentReel.id}
              src={currentReel.mediaUrl}
              alt={currentReel.description}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
        </div>

        {nextIndex !== null && allReels[nextIndex] && (
          <div
            className="absolute inset-0"
            style={{
              transform: 'scale(1)',
              transition: 'transform 0.3s cubic-bezier(0.33, 1, 0.68, 1)',
              willChange: 'transform',
              zIndex: 3,
            }}
          >
            {allReels[nextIndex].mediaType === 'video' ? (
              <video
                key={allReels[nextIndex].id}
                ref={nextVideoRef}
                src={allReels[nextIndex].mediaUrl}
                className="absolute inset-0 w-full h-full object-cover"
                loop
                playsInline
                muted={true}
                autoPlay
                poster={allReels[nextIndex].posterUrl}
                preload="auto"
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <img
                key={allReels[nextIndex].id}
                src={allReels[nextIndex].mediaUrl}
                alt={allReels[nextIndex].description}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
          </div>
        )}
        
        {/* Hidden preload videos - önceki ve sonraki videoları arka planda yükle */}
        <div className="absolute inset-0 pointer-events-none" style={{ visibility: 'hidden', zIndex: -1 }}>
          {currentIndex > 0 && allReels[currentIndex - 1]?.mediaType === 'video' && (
            <video
              key={`prev-${allReels[currentIndex - 1].id}`}
              ref={prevVideoRef}
              src={allReels[currentIndex - 1].mediaUrl}
              preload="auto"
              muted
              playsInline
            />
          )}
          {currentIndex < allReels.length - 1 && allReels[currentIndex + 1]?.mediaType === 'video' && nextIndex === null && (
            <video
              key={`preload-${allReels[currentIndex + 1].id}`}
              src={allReels[currentIndex + 1].mediaUrl}
              preload="auto"
              muted
              playsInline
            />
          )}
        </div>
      </div>

      <div 
        className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-32 pointer-events-none"
        style={{
          transform: `translate3d(0, ${touchOffset}px, 0)`,
          transition: touchOffset !== 0 ? 'none' : 'transform 0.3s cubic-bezier(0.33, 1, 0.68, 1)',
          willChange: touchOffset !== 0 ? 'transform' : 'auto',
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
                src={displayReel.avatar}
                alt={displayReel.username}
                className="w-10 h-10 rounded-full border-2 border-white"
              />
              <span className="text-white font-semibold text-sm">
                {displayReel.username}
              </span>
              <button className="px-4 py-1 border border-white rounded text-white text-xs font-semibold hover:bg-white hover:text-black transition-all duration-300 active:scale-95">
                Takip Et
              </button>
            </div>

            <p className="text-white text-sm mb-2 line-clamp-2">
              {displayReel.description}
            </p>

            <div className="flex items-center gap-2">
              <Music className="w-3 h-3 text-white" />
              <span className="text-white text-xs truncate">
                {displayReel.music}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 ml-4">
            <button
              onClick={toggleLike}
              className="flex flex-col items-center gap-1 transition-all duration-300 active:scale-110 hover:scale-110"
            >
              <Heart
                className={`w-7 h-7 transition-all duration-300 ${
                  likedReels.has(displayReel.id)
                    ? 'text-red-500 fill-red-500 scale-125'
                    : 'text-white'
                }`}
              />
              <span className="text-white text-xs font-semibold">
                {displayReel.likes + (likedReels.has(displayReel.id) ? 1 : 0)}
              </span>
            </button>

            <button className="flex flex-col items-center gap-1 transition-all duration-300 active:scale-110 hover:scale-110">
              <MessageCircle className="w-7 h-7 text-white" />
              <span className="text-white text-xs font-semibold">
                {displayReel.comments}
              </span>
            </button>

            <button
              onClick={toggleSave}
              className="flex flex-col items-center gap-1 transition-all duration-300 active:scale-110 hover:scale-110"
            >
              <Bookmark
                className={`w-7 h-7 transition-all duration-300 ${
                  savedReels.has(displayReel.id)
                    ? 'text-yellow-400 fill-yellow-400 scale-125'
                    : 'text-white'
                }`}
              />
            </button>

            <button className="flex flex-col items-center gap-1 transition-all duration-300 active:scale-110 hover:scale-110">
              <Share2 className="w-7 h-7 text-white" />
            </button>

            <button className="flex flex-col items-center gap-1 transition-all duration-300 active:scale-110 hover:scale-110">
              <MoreHorizontal className="w-7 h-7 text-white" />
            </button>

            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-pink-500 animate-spin-slow" />
          </div>
        </div>
      </div>

      <div 
        className="absolute right-2 top-1/2 flex flex-col gap-1 overflow-hidden pointer-events-none" 
        style={{ 
          maxHeight: 'calc(100% - 2rem)',
          transform: `translate3d(0, calc(-50% + ${touchOffset}px), 0)`,
          transition: touchOffset !== 0 ? 'none' : 'transform 0.3s cubic-bezier(0.33, 1, 0.68, 1)',
          willChange: touchOffset !== 0 ? 'transform' : 'auto',
          zIndex: 20,
          backfaceVisibility: 'hidden' as const,
          WebkitBackfaceVisibility: 'hidden' as const,
        }}
      >
        {allReels.slice(0, currentIndex + 5).map((_, index) => (
          <div
            key={index}
            className={`w-1 h-12 rounded-full transition-all duration-300 ${
              index === currentIndex ? 'bg-white scale-125' : 'bg-white/30 scale-100'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
