import { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Music, Play } from 'lucide-react';

interface Reel {
  id: string;
  mediaUrl: string;
  mediaType: 'video' | 'image';
  username: string;
  avatar: string;
  description: string;
  music: string;
  likes: number;
  comments: number;
}

interface ReelsProps {
  reels?: Reel[];
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

export default function Vibes({ reels: initialReels }: ReelsProps) {
  const [allReels, setAllReels] = useState<Reel[]>(initialReels || generateReels());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState<number | null>(null);
  const [likedReels, setLikedReels] = useState<Set<string>>(new Set());
  const [savedReels, setSavedReels] = useState<Set<string>>(new Set());
  const [isPlaying, setIsPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const touchStartTime = useRef<number>(0);
  const lastScrollTime = useRef<number>(0);

  const currentReel = allReels[currentIndex];
  const displayReel = nextIndex !== null ? allReels[nextIndex] : currentReel;

  useEffect(() => {
    if (displayReel.mediaType === 'video' && videoRef.current) {
      if (isPlaying && nextIndex === null) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, [currentIndex, isPlaying, displayReel.mediaType, nextIndex]);

  useEffect(() => {
    if (currentIndex >= allReels.length - 3) {
      const newReels = generateReels();
      setAllReels(prev => [...prev, ...newReels]);
    }
  }, [currentIndex, allReels.length]);

  useEffect(() => {
    if (nextIndex !== null) {
      const timer = setTimeout(() => {
        setCurrentIndex(nextIndex);
        setNextIndex(null);
        setIsTransitioning(false);
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [nextIndex]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const touchEndTime = Date.now();
    const diff = touchStartY.current - touchEndY;
    const timeDiff = touchEndTime - touchStartTime.current;

    if (Math.abs(diff) > 30 && timeDiff < 500 && !isTransitioning) {
      if (diff > 0) {
        setNextIndex(currentIndex + 1);
        setIsTransitioning(true);
      } else if (diff < 0 && currentIndex > 0) {
        setNextIndex(currentIndex - 1);
        setIsTransitioning(true);
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    const now = Date.now();
    if (now - lastScrollTime.current < 600 || isTransitioning) return;

    lastScrollTime.current = now;

    if (e.deltaY > 0) {
      setNextIndex(currentIndex + 1);
      setIsTransitioning(true);
    } else if (e.deltaY < 0 && currentIndex > 0) {
      setNextIndex(currentIndex - 1);
      setIsTransitioning(true);
    }
  };

  const toggleLike = () => {
    setLikedReels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentReel.id)) {
        newSet.delete(currentReel.id);
      } else {
        newSet.add(currentReel.id);
      }
      return newSet;
    });
  };

  const toggleSave = () => {
    setSavedReels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentReel.id)) {
        newSet.delete(currentReel.id);
      } else {
        newSet.add(currentReel.id);
      }
      return newSet;
    });
  };

  const togglePlay = () => {
    if (currentReel.mediaType === 'video') {
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen bg-black overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      <div className="relative w-full h-full">
        <div
          className={`absolute inset-0 transition-all duration-500 ease-out ${
            nextIndex === null ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          {currentReel.mediaType === 'video' ? (
            <>
              <video
                ref={videoRef}
                src={currentReel.mediaUrl}
                className="absolute inset-0 w-full h-full object-cover"
                loop
                playsInline
                autoPlay
                onClick={togglePlay}
              />
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="bg-black/50 rounded-full p-6 backdrop-blur-sm">
                    <Play className="w-16 h-16 text-white" fill="white" />
                  </div>
                </div>
              )}
            </>
          ) : (
            <img
              src={currentReel.mediaUrl}
              alt={currentReel.description}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
        </div>

        {nextIndex !== null && (
          <div
            className={`absolute inset-0 transition-all duration-500 ease-out ${
              nextIndex !== null ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          >
            {allReels[nextIndex].mediaType === 'video' ? (
              <video
                src={allReels[nextIndex].mediaUrl}
                className="absolute inset-0 w-full h-full object-cover"
                loop
                playsInline
                autoPlay
              />
            ) : (
              <img
                src={allReels[nextIndex].mediaUrl}
                alt={allReels[nextIndex].description}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-32 transition-all duration-500 ease-out">
        <div className="flex items-end justify-between">
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

      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 max-h-96 overflow-hidden">
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
