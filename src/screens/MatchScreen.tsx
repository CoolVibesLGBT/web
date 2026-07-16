import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { Heart, X, Star, MapPin, Camera, Shield, Sparkles, MessageCircle, Ghost, RefreshCw, Info } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@/router';
import ProfileScreen from './ProfileScreen';
import { api } from '../services/api';
import { getSafeImageURLEx } from '../helpers/helpers';

interface Fantasy {
  id: string;
  user_id: string;
  fantasy_id: string;
  fantasy?: {
    id: string;
    category: string;
    translations?: Array<{
      id: string;
      fantasy_id: string;
      language: string;
      label: string;
      description?: string;
    }>;
  };
}

interface InterestItem {
  id: string;
  user_id: string;
  interest_item_id: string;
  interest_item?: {
    id: string;
    interest_id: string;
    name: Record<string, string>;
    emoji?: string;
    interest?: {
      id: string;
      name: Record<string, string>;
    };
  };
}

interface ApiUser {
  id: string;
  public_id: number;
  username: string;
  displayname: string;
  date_of_birth?: string;
  location?: {
    display?: string;
    city?: string;
    country?: string;
  };
  avatar?: {
    file?: {
      url?: string;
    };
  };
  bio?: string;
  website?: string;
  created_at?: string;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
  interests?: InterestItem[];
  fantasies?: Fantasy[];
  user_attributes?: Array<{
    id: string;
    user_id: string;
    category_type: string;
    attribute_id: string;
    attribute: {
      id: string;
      category: string;
      display_order: number;
      name: Record<string, string>;
    };
  }>;
  occupation?: string;
  education?: string;
}

interface Profile {
  id: string;
  public_id: number;
  name: string;
  displayname?: string;
  username?: string;
  age: number;
  location: string;
  bio: string;
  website?: string;
  images: string[];
  interests?: InterestItem[];
  occupation?: string;
  education?: string;
  distance: string;
  verified?: boolean;
  lastActive?: string;
  created_at?: string;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
  fantasies?: Fantasy[];
  user_attributes?: Array<{
    id: string;
    user_id: string;
    category_type: string;
    attribute_id: string;
    attribute: {
      id: string;
      category: string;
      display_order: number;
      name: Record<string, string>;
    };
  }>;
}

interface MatchResponse {
  matched: boolean;
  target_user: string;
}

type MatchHistoryTab = 'match_now' | 'matches' | 'liked' | 'passed';

const MatchScreen: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate age from date_of_birth
  const calculateAge = useCallback((dateOfBirth?: string): number => {
    if (!dateOfBirth) return 0;
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }, []);

  // Map API user to Profile format
  const mapApiUserToProfile = useCallback((apiUser: ApiUser): Profile => {
    const images: string[] = [];
    if (apiUser.avatar) {
      const imageUrl = getSafeImageURLEx(apiUser.public_id,apiUser.avatar, "small");
      if (imageUrl) {
        images.push(imageUrl);
      }
    }

    return {
      id: apiUser.id,
      public_id: apiUser.public_id,
      name: apiUser.displayname || apiUser.username || 'Unknown',
      displayname: apiUser.displayname,
      username: apiUser.username,
      age: calculateAge(apiUser.date_of_birth),
      location: apiUser.location?.display || apiUser.location?.city || 'Unknown',
      bio: apiUser.bio || '',
      website: apiUser.website,
      images: images.length > 0 ? images : ['https://via.placeholder.com/400x600?text=No+Image'],
      interests: apiUser.interests,
      occupation: apiUser.occupation,
      education: apiUser.education,
      distance: 'Unknown', // TODO: Calculate distance if location data available
      verified: false, // TODO: Add verified field from API if available
      lastActive: undefined, // TODO: Add last_active field from API if available
      created_at: apiUser.created_at,
      followers_count: apiUser.followers_count,
      following_count: apiUser.following_count,
      posts_count: apiUser.posts_count,
      fantasies: apiUser.fantasies,
      user_attributes: apiUser.user_attributes,
    };
  }, [calculateAge]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [matchPercentage] = useState(96);
  const [exitingProfileId, setExitingProfileId] = useState<string | null>(null);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMatchAnimation, setShowMatchAnimation] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null);
  const [likedProfiles, setLikedProfiles] = useState<Profile[]>([]);
  const [isLoadingLiked, setIsLoadingLiked] = useState(false);
  const [hasLoadedLiked, setHasLoadedLiked] = useState(false);
  const [passedProfiles, setPassedProfiles] = useState<Profile[]>([]);
  const [isLoadingPassed, setIsLoadingPassed] = useState(false);
  const [hasLoadedPassed, setHasLoadedPassed] = useState(false);
  const [matchedProfiles, setMatchedProfiles] = useState<Profile[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [hasLoadedMatches, setHasLoadedMatches] = useState(false);
  const [expandedMatches, setExpandedMatches] = useState(false);
  const [expandedLiked, setExpandedLiked] = useState(false);
  const [expandedPassed, setExpandedPassed] = useState(false);
  const [historyTab, setHistoryTab] = useState<MatchHistoryTab>('match_now');
  const [processedProfiles, setProcessedProfiles] = useState<Set<string>>(new Set()); // Track processed profile IDs
  const cardRef = useRef<HTMLDivElement>(null);
  const processedProfilesRef = useRef<Set<string>>(new Set());
  const fetchMatchedProfilesRef = useRef<((limit: number) => Promise<void>) | null>(null);
  const fetchLikedProfilesRef = useRef<((limit: number) => Promise<void>) | null>(null);
  const fetchPassedProfilesRef = useRef<((limit: number) => Promise<void>) | null>(null);
  const hasLoadedMatchesRef = useRef<boolean>(false);
  const isLoadingMatchesRef = useRef<boolean>(false);
  const hasLoadedLikedRef = useRef<boolean>(false);
  const isLoadingLikedRef = useRef<boolean>(false);
  const hasLoadedPassedRef = useRef<boolean>(false);
  const isLoadingPassedRef = useRef<boolean>(false);
  const isCurrentTabLoading =
    historyTab === 'match_now'
      ? isLoading
      : historyTab === 'matches'
        ? isLoadingMatches
        : historyTab === 'liked'
        ? isLoadingLiked
          : isLoadingPassed;
  const currentTabResultCount =
    historyTab === 'match_now'
      ? profiles.length
      : historyTab === 'matches'
        ? matchedProfiles.length
        : historyTab === 'liked'
          ? likedProfiles.length
          : passedProfiles.length;
  const isDark = theme === 'dark';
  const pageTextColor = isDark ? 'text-white' : 'text-slate-950';
  // Keep refs in sync with state
  useEffect(() => {
    processedProfilesRef.current = processedProfiles;
  }, [processedProfiles]);

  // Debug: Track match animation state changes
  useEffect(() => {
  }, [showMatchAnimation, matchedProfile]);
  
  useEffect(() => {
    hasLoadedMatchesRef.current = hasLoadedMatches;
  }, [hasLoadedMatches]);
  
  useEffect(() => {
    isLoadingMatchesRef.current = isLoadingMatches;
  }, [isLoadingMatches]);
  
  useEffect(() => {
    hasLoadedLikedRef.current = hasLoadedLiked;
  }, [hasLoadedLiked]);
  
  useEffect(() => {
    isLoadingLikedRef.current = isLoadingLiked;
  }, [isLoadingLiked]);
  
  useEffect(() => {
    hasLoadedPassedRef.current = hasLoadedPassed;
  }, [hasLoadedPassed]);
  
  useEffect(() => {
    isLoadingPassedRef.current = isLoadingPassed;
  }, [isLoadingPassed]);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const fetchMatchNowProfiles = useCallback(async (limit: number = 100) => {
    try {
      setIsLoading(true);
      const response = await api.fetchMatchUnseen(limit);

      // Handle both array and object response formats
      let apiUsers: ApiUser[] = [];
      if (Array.isArray(response)) {
        apiUsers = response as ApiUser[];
      } else if (response && typeof response === 'object' && 'users' in (response as any)) {
        apiUsers = (response as any).users as ApiUser[];
      }

      // Map API users to Profile format
      const mappedProfiles = apiUsers.map(mapApiUserToProfile);
      setProfiles(mappedProfiles);
      setCurrentIndex(0);
      setCurrentImageIndex(0);
      setExitingProfileId(null);
      setExitDirection(null);
      setShowProfileModal(false);
      setProcessedProfiles(new Set());
      processedProfilesRef.current = new Set();
      x.set(0);
      y.set(0);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setIsLoading(false);
    }
  }, [mapApiUserToProfile, x, y]);

  const handleSwipe = async (direction: 'left' | 'right', reactionType: 'like' | 'dislike' | 'superlike') => {
    const currentProfile = profiles[currentIndex];

    if (!currentProfile || !profiles.length) return;

    // Check if already processed using ref (synchronous check)
    if (processedProfilesRef.current.has(currentProfile.id)) {
      return; // Already processed, ignore
    }

    // Store profile reference BEFORE any state changes (for match animation)
    const profileForMatch = { ...currentProfile };
    const profileId = currentProfile.id;

    // Mark as processed immediately
    setProcessedProfiles(prev => {
      const newSet = new Set(prev).add(profileId);
      // Update ref immediately for synchronous access
      processedProfilesRef.current = newSet;
      return newSet;
    });

    // Determine reaction type - reactionType parameter takes priority
    let reaction: 'like' | 'dislike' | 'favorite' | 'bookmark' | 'superlike' = 'like';
    if (reactionType === 'superlike') {
      reaction = 'superlike';
    } else if (reactionType === 'dislike') {
      reaction = 'dislike';
    } else if (reactionType === 'like') {
      reaction = 'like';
    } else {
      // Fallback to direction if reactionType not provided (shouldn't happen)
      reaction = direction === 'right' ? 'like' : 'dislike';
    }

    // Reset motion values BEFORE exit animation
    x.set(0);
    y.set(0);

    // Trigger exit animation IMMEDIATELY with correct direction
    setExitingProfileId(profileId);
    setExitDirection(direction);

    // Remove profile from profiles list AFTER setting exit animation
    const currentIdx = currentIndex;
    setProfiles(prev => {
      const filtered = prev.filter(p => p.id !== profileId);
      
      // Update index synchronously
      if (filtered.length === 0) {
        setCurrentIndex(0);
      } else {
        // If current index is out of bounds, adjust it
        const nextIdx = currentIdx >= filtered.length ? filtered.length - 1 : currentIdx;
        setCurrentIndex(nextIdx);
      }
      setCurrentImageIndex(0);
      
      return filtered;
    });

    // Call API to create match/reaction
    try {
      const response = await api.createMatch(currentProfile.public_id, reaction) as MatchResponse;

      // Handle response
      if (response) {
        if (reaction === 'like' || reaction === 'superlike') {
          // Check if matched FIRST - CRITICAL: Check response.matched explicitly
          const isMatched = response.matched === true || 
            (typeof response.matched === 'string' && (response.matched as string).toLowerCase() === 'true') ||
            (typeof response.matched === 'number' && response.matched === 1);
          
          if (isMatched) {
            // Add to matched profiles ONLY (not to liked profiles)
            setMatchedProfiles(prev => {
              if (!prev.find(p => p.id === profileId)) {
                return [...prev, profileForMatch];
              }
              return prev;
            });
            
            // Remove from liked profiles if it was added before (shouldn't happen but just in case)
            setLikedProfiles(prev => prev.filter(p => p.id !== profileId));
            
            // Show match animation IMMEDIATELY
            setMatchedProfile(profileForMatch);
            setShowMatchAnimation(true);
            
            // Hide animation after 2.5 seconds
            setTimeout(() => {
              setShowMatchAnimation(false);
              setMatchedProfile(null);
            }, 2500);
          } else {
            // No match - add to liked profiles only
            setLikedProfiles(prev => {
              if (!prev.find(p => p.id === profileId)) {
                return [...prev, profileForMatch];
              }
              return prev;
            });
          }
        } else if (reaction === 'dislike') {
          // Pass edildi - history'ye ekle
          setPassedProfiles(prev => {
            if (!prev.find(p => p.id === profileId)) {
              return [...prev, profileForMatch];
            }
            return prev;
          });
        }
      }
    } catch (error) {
      console.error('Error creating match:', error);
      // Remove from processed set if API call failed, so user can retry
      setProcessedProfiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(profileId);
        // Update ref immediately
        processedProfilesRef.current = newSet;
        return newSet;
      });
    }
  };

  const handleDragEnd = (_event: React.PointerEvent | PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    const threshold = 100;
    const velocityThreshold = 500;

    // Check velocity first (fast swipe)
    if (Math.abs(info.velocity.x) > velocityThreshold) {
      if (info.velocity.x > 0) {
        handleSwipe('right', 'like');
      } else {
        handleSwipe('left', 'dislike');
      }
      return;
    }

    // Check offset (slow drag)
    if (info.offset.x > threshold) {
      handleSwipe('right', 'like');
    } else if (info.offset.x < -threshold) {
      handleSwipe('left', 'dislike');
    } else {
      // Spring back to center
      x.set(0);
      y.set(0);
    }
  };

  const currentProfile = profiles[currentIndex];
  const nextProfile = profiles[(currentIndex + 1) % profiles.length];

  const handleImageTap = (side: 'left' | 'right') => {
    if (side === 'left') {
      // Loop: if at first image, go to last image
      if (currentImageIndex === 0) {
        setCurrentImageIndex(currentProfile.images.length - 1);
      } else {
        setCurrentImageIndex(currentImageIndex - 1);
      }
    } else if (side === 'right') {
      // Loop: if at last image, go to first image
      if (currentImageIndex === currentProfile.images.length - 1) {
        setCurrentImageIndex(0);
      } else {
        setCurrentImageIndex(currentImageIndex + 1);
      }
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const middle = width / 2;

    // Left side: previous image, Right side: next image
    if (clickX < middle) {
      handleImageTap('left');
    } else {
      handleImageTap('right');
    }
  };

  const renderMatchNowPanel = () => (
    <motion.div
      key="match_now"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
      className="w-full"
    >
      {profiles.length === 0 ? (
        <div className="flex min-h-[430px] items-center justify-center px-1 py-6">
          <div className="elite-bubble flex w-full max-w-xl flex-col items-center justify-center rounded-[36px] px-8 py-14 text-center">
            <div className="sky-glow mb-5 flex h-16 w-16 items-center justify-center rounded-full text-white">
              <Heart className="h-8 w-8" fill="currentColor" />
            </div>
            <p className={`mb-6 max-w-sm text-base font-bold leading-relaxed ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
              {t('match.no_profiles') || 'No profiles to show right now. Come back soon!'}
            </p>
            <button
              className="elite-floating sky-glow flex items-center gap-2 px-6 py-3 text-sm font-black text-white transition-all hover:scale-105 active:scale-95"
              onClick={() => fetchMatchNowProfiles(100)}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{t('match.refresh') || 'Refresh'}</span>
            </button>
          </div>
        </div>
      ) : (
        <>
      <motion.div
        className="mx-auto w-full max-w-[470px] px-1 sm:px-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >



        {/* Cards Container */}
        <div className="relative h-[62dvh] min-h-[430px] max-h-[700px] md:h-[68dvh] md:min-h-[540px]">
          {/* Next Card (Background) */}
          {nextProfile && (
            <motion.div
              key={`next-${nextProfile.id}`}
              className="absolute inset-0 z-0"
              initial={{ scale: 0.92, opacity: 0.5 }}
              animate={{ scale: 0.96, opacity: 0.6 }}
              transition={{ duration: 0.3 }}
            >
              <div
                className="elite-card relative h-full overflow-hidden rounded-[32px] p-0 shadow-xl"
              >
                <div className="absolute inset-0 w-full h-full">
                  <img
                    src={getSafeImageURLEx(nextProfile.public_id,null,"cover") || undefined}
                    alt={nextProfile.name}
                    className="w-full h-full object-cover opacity-60 blur-[1px]"
                    draggable={false}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </div>
              </div>
            </motion.div>
          )}

          {/* Current Card (Foreground) */}
          <AnimatePresence
            mode="wait"
            onExitComplete={() => {
              // Reset exit state after animation completes
              setExitingProfileId(null);
              setExitDirection(null);
            }}
          >
            {currentProfile && (
              <motion.div
                key={currentProfile.id}
                ref={cardRef}
                className="absolute inset-0 z-10"
                initial={{ scale: 0.96, opacity: 0, y: 20, x: 0, rotate: 0 }}
                animate={{
                  scale: 1,
                  opacity: 1,
                  y: 0,
                  x: 0,
                  rotate: 0
                }}
                exit={{
                  x: exitingProfileId === currentProfile.id && exitDirection
                    ? (exitDirection === 'right' ? 800 : -800)
                    : 0,
                  opacity: 0,
                  scale: 0.85,
                  rotate: exitingProfileId === currentProfile.id && exitDirection
                    ? (exitDirection === 'right' ? 15 : -15)
                    : 0,
                  transition: {
                    type: "spring",
                    damping: 35,
                    stiffness: 400,
                    mass: 0.5,
                    duration: 0.3
                  }
                }}
                transition={{
                  type: "spring",
                  damping: 25,
                  stiffness: 400
                }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                whileDrag={{ cursor: 'grabbing' }}
                style={{ x, y }}
              >
              <div
                className="elite-card relative h-full overflow-hidden rounded-[32px] p-0 shadow-2xl"
              >
                {/* Image Section - Full Height */}
                <div className="absolute inset-0 w-full h-full z-0">
                  {/* Image Container */}
                  <div
                    className="relative h-full cursor-pointer overflow-hidden rounded-[32px]"
                    onClick={handleImageClick}
                  >
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={currentImageIndex}
                          src={getSafeImageURLEx(currentProfile.public_id,null,"cover") || undefined}

                        alt={currentProfile.name}
                        className="w-full h-full object-cover"
                        initial={{ opacity: 0, scale: 1.08 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.08 }}
                        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                        draggable={false}
                      />
                    </AnimatePresence>

                    {/* Gradient Overlays */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />
                    <div className="pointer-events-none absolute left-0 right-0 top-0 h-32 bg-gradient-to-b from-black/55 to-transparent" />

                    {/* Image Indicators - Only show if more than 1 image */}
                    {currentProfile.images.length > 1 && (
                      <div className="absolute top-4 sm:top-6 left-4 sm:left-6 right-20 sm:right-28 flex gap-1.5 sm:gap-2">
                        {currentProfile.images.map((_, index) => (
                          <motion.div
                            key={index}
                            className={`h-[2.5px] sm:h-[3px] flex-1 rounded-full transition-all duration-500 ${index === currentImageIndex
                                ? 'bg-white'
                                : 'bg-white/25'
                              }`}
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: index * 0.1 }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Top Right Actions */}
                    <div className="absolute right-4 top-4 flex flex-row gap-2 sm:right-6 sm:top-6">
                      {/* Photo Count */}
                      <motion.div
                        className="backdrop-blur-xl bg-black/50 rounded-full px-2.5 sm:px-3.5 py-1.5 sm:py-2 flex items-center gap-1.5 sm:gap-2 border border-white/10"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                        <span className="text-[10px] sm:text-xs font-semibold text-white tracking-wide">
                          {currentImageIndex + 1}/{currentProfile.images.length}
                        </span>
                      </motion.div>

                      {/* Match Percentage */}
                      <motion.div
                        className="sky-glow rounded-full border border-white/20 px-3 py-1.5 text-white backdrop-blur-xl sm:px-4 sm:py-2"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <span className="text-[10px] sm:text-xs font-bold tracking-wider">
                          {matchPercentage}% {t('match.match') || 'MATCH'}
                        </span>
                      </motion.div>
                    </div>

                    {/* Profile Info Overlay - Always Visible with Name & Age */}
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 pb-6 sm:pb-8 z-10"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {/* Name & Age - Always Visible */}
                          <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2 flex-wrap">
                            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight truncate drop-shadow-lg">
                              {currentProfile.name}
                            </h2>
                            <span className="text-2xl sm:text-3xl font-light text-white/95 whitespace-nowrap drop-shadow-lg">
                              {currentProfile.age}
                            </span>
                            {currentProfile.verified && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className="backdrop-blur-xl bg-white/20 rounded-full p-1 sm:p-1.5 border border-white/30 flex-shrink-0"
                              >
                                <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" />
                              </motion.div>
                            )}
                          </div>

                          {/* Additional Info - Always Visible */}
                          <div className="flex items-center gap-2 sm:gap-3 mb-1.5 flex-wrap mt-2">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/80 flex-shrink-0" strokeWidth={2.5} />
                              <span className="truncate text-xs font-bold text-white/90 drop-shadow-lg sm:text-sm">{currentProfile.location}</span>
                            </div>
                            <span className="text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full backdrop-blur-xl bg-white/20 text-white border border-white/20 whitespace-nowrap">
                              {currentProfile.distance}
                            </span>
                          </div>
                          {currentProfile.lastActive && (
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-400 animate-pulse shadow-lg shadow-green-400/50" />
                              <span className="text-[10px] sm:text-xs font-medium text-white/85 tracking-wide drop-shadow-lg">
                                {t('match.active') || 'Active'} {currentProfile.lastActive}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* View Profile Button */}
                      <motion.button
                        className="mt-3 flex items-center justify-center gap-2 rounded-full border border-white/40 bg-white/15 px-3 py-2 shadow-lg backdrop-blur-xl transition-all duration-200 hover:bg-white/25 active:bg-white/30 sm:mt-4 sm:px-4 sm:py-2.5"
                        whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.25)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowProfileModal(true);
                        }}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" strokeWidth={2.5} />
                        <span className="text-[11px] sm:text-xs font-semibold text-white tracking-tight">{t('match.view_profile') || 'View Profile'}</span>
                      </motion.button>
                    </motion.div>
                  </div>
                </div>

                {/* Profile Bottom Sheet - Inside Card */}
                <AnimatePresence>
                  {showProfileModal && (
                    <>
                      {/* Backdrop inside card */}
                      <motion.div
                        key={`backdrop-${currentProfile.id}`}
                        className="absolute inset-0 z-30 bg-black/50 rounded-[28px] sm:rounded-[32px]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowProfileModal(false)}
                        transition={{ duration: 0.2 }}
                      />

                      {/* Compact Profile Sheet */}
                      <motion.div
                        key={`profile-${currentProfile.id}`}
                        className={`absolute bottom-0 left-0 right-0 z-40 rounded-t-[32px] border shadow-2xl backdrop-blur-3xl ${isDark ? 'cv-card-surface-solid border-white/10' : 'border-white/70 bg-white/95'
                          }`}
                        style={{ maxHeight: '85%' }}
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                      >
                        {/* Handle Bar */}
                        <div className="flex justify-center pt-3 pb-2">
                          <div className={`w-12 h-1.5 rounded-full ${theme === 'dark' ? 'bg-white/20' : 'bg-gray-300'}`} />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 pb-4 dark:border-white/10 sm:px-6">
                          <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>
                            {currentProfile.displayname || currentProfile.name}
                          </h2>
                          <motion.button
                            className={`elite-btn h-10 w-10 ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
                            onClick={() => setShowProfileModal(false)}
                            whileTap={{ scale: 0.95 }}
                          >
                            <X className={`h-5 w-5 ${isDark ? 'text-white' : 'text-slate-950'}`} />
                          </motion.button>
                        </div>

                        {/* Scrollable Profile Content */}
                        <div className="overflow-y-auto no-scrollbar" style={{ maxHeight: 'calc(85vh - 100px)' }}>
                          <div className="w-full pb-8">
                            <ProfileScreen
                              inline={true}
                              isEmbed={true}
                              username={currentProfile.username}
                            />
                          </div>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Action Buttons */}
        <motion.div
          className="mt-4 flex items-center justify-center gap-4 sm:mt-5 sm:gap-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Pass Button */}
          <motion.button
            className={`elite-floating flex h-14 w-14 items-center justify-center transition-all sm:h-16 sm:w-16 ${isDark ? 'text-rose-400' : 'text-rose-600'}`}
            whileHover={{ scale: 1.1, rotate: -15 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleSwipe('left', 'dislike')}
          >
            <X className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2.5} />
          </motion.button>

          {/* Super Like Button */}
          <motion.button
            className={`elite-floating flex h-12 w-12 items-center justify-center transition-all sm:h-14 sm:w-14 ${isDark ? 'text-amber-300' : 'text-amber-500'}`}
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleSwipe('right', 'superlike')}
          >
            <Star className="h-5 w-5 sm:h-6 sm:w-6" fill="currentColor" strokeWidth={2} />
          </motion.button>

          {/* Like Button */}
          <motion.button
            className="sky-glow flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-all sm:h-16 sm:w-16"
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleSwipe('right', 'like')}
          >
            <Heart className="w-6 h-6 sm:w-7 sm:h-7" fill="currentColor" strokeWidth={2} />
          </motion.button>
        </motion.div>


      </motion.div>
      </>
      )}
    </motion.div>
  );

  // Ensure currentIndex is always valid
  useEffect(() => {
    if (profiles.length > 0 && currentIndex >= profiles.length) {
      setCurrentIndex(profiles.length - 1);
      setCurrentImageIndex(0);
    } else if (profiles.length === 0 && currentIndex !== 0) {
      setCurrentIndex(0);
      setCurrentImageIndex(0);
    }
  }, [profiles.length, currentIndex]);

  // Reset position when profile changes
  useEffect(() => {
    x.set(0);
    y.set(0);
    setCurrentImageIndex(0);
    setShowProfileModal(false);
    // Don't reset exitDirection here - let animation complete first
  }, [currentIndex, x, y]);

  // Reset processed profiles when profiles list changes (new profiles loaded)
  useEffect(() => {
    setProcessedProfiles(new Set());
  }, [profiles.length]);

  // Fetch matched profiles from API
  const fetchMatchedProfiles = useCallback(async (limit: number = 20) => {
    try {
      setIsLoadingMatches(true);
      const response = await api.fetchMatchedProfiles(limit, null) as { users: ApiUser[]; cursor: string | null };
      
      if (response && response.users) {
        const mappedMatches = response.users.map(mapApiUserToProfile);
        setMatchedProfiles(mappedMatches);
      }
    } catch (error) {
      console.error('Error fetching matched profiles:', error);
    } finally {
      setIsLoadingMatches(false);
    }
  }, [mapApiUserToProfile]);

  // Fetch liked profiles from API
  const fetchLikedProfiles = useCallback(async (limit: number = 20) => {
    try {
      setIsLoadingLiked(true);
      const response = await api.fetchLikedProfiles(limit, null) as { users: ApiUser[]; cursor: string | null };
      
      if (response && response.users) {
        const mappedLiked = response.users.map(mapApiUserToProfile);
        setLikedProfiles(mappedLiked);
      }
    } catch (error) {
      console.error('Error fetching liked profiles:', error);
    } finally {
      setIsLoadingLiked(false);
    }
  }, [mapApiUserToProfile]);

  // Fetch passed profiles from API
  const fetchPassedProfiles = useCallback(async (limit: number = 20) => {
    try {
      setIsLoadingPassed(true);
      const response = await api.fetchPassedProfiles(limit, null) as { users: ApiUser[]; cursor: string | null };
      
      if (response && response.users) {
        const mappedPassed = response.users.map(mapApiUserToProfile);
        setPassedProfiles(mappedPassed);
      }
    } catch (error) {
      console.error('Error fetching passed profiles:', error);
    } finally {
      setIsLoadingPassed(false);
    }
  }, [mapApiUserToProfile]);

  // Keep function refs in sync
  useEffect(() => {
    fetchMatchedProfilesRef.current = fetchMatchedProfiles;
  }, [fetchMatchedProfiles]);

  useEffect(() => {
    fetchLikedProfilesRef.current = fetchLikedProfiles;
  }, [fetchLikedProfiles]);

  useEffect(() => {
    fetchPassedProfilesRef.current = fetchPassedProfiles;
  }, [fetchPassedProfiles]);

  // Load all history data on initial mount
  useEffect(() => {
    fetchMatchNowProfiles();

    // Load matches, liked, and passed profiles on page load
    if (!hasLoadedMatchesRef.current && !isLoadingMatchesRef.current) {
      setHasLoadedMatches(true);
      fetchMatchedProfilesRef.current?.(20);
    }
    if (!hasLoadedLikedRef.current && !isLoadingLikedRef.current) {
      setHasLoadedLiked(true);
      fetchLikedProfilesRef.current?.(20);
    }
    if (!hasLoadedPassedRef.current && !isLoadingPassedRef.current) {
      setHasLoadedPassed(true);
      fetchPassedProfilesRef.current?.(20);
    }
     
  }, [fetchMatchNowProfiles]); // Only run once on mount

  // Handle send message - create chat and navigate
  const handleSendMessage = async (profile: Profile) => {
    if (!user?.id || !profile?.id) {
      console.error('User or profile ID is missing');
      return;
    }

    try {
      // Create chat via API
      const chatResponse = await api.createChat([profile.id], 'private') as { 
        chat: { 
          id: string;
          type: string;
          participants?: Array<{
            user_id: string;
            user?: {
              id: string;
              username?: string;
              displayname?: string;
            };
          }>;
        };
        success: boolean;
      };

      const chatId = chatResponse?.chat?.id;
      
      if (chatId) {
        // Navigate to messages screen with chat ID
        navigate('/messages', { 
          state: { 
            openChat: chatId,
            userId: profile.id,
            publicId: profile.public_id,
            username: profile.username
          } 
        });
      } else {
        console.error('Chat creation failed - no chat ID returned');
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      // Navigate anyway, MessagesScreen will handle creating a temporary chat
      navigate('/messages', { 
        state: { 
          openChat: profile.username || profile.id,
          userId: profile.id,
          publicId: profile.public_id
        } 
      });
    }
  };

  const refreshCurrentTab = useCallback(() => {
    if (historyTab === 'match_now') {
      fetchMatchNowProfiles(100);
      return;
    }

    if (historyTab === 'matches') {
      fetchMatchedProfilesRef.current?.(20);
      return;
    }

    if (historyTab === 'liked') {
      fetchLikedProfilesRef.current?.(20);
      return;
    }

    fetchPassedProfilesRef.current?.(20);
  }, [fetchMatchNowProfiles, historyTab]);

  const publishMatchControlsState = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('cv:match-controls-state', {
      detail: {
        activeTab: historyTab,
        resultCount: currentTabResultCount,
        isLoading: isCurrentTabLoading,
      },
    }));
  }, [currentTabResultCount, historyTab, isCurrentTabLoading]);

  useEffect(() => {
    publishMatchControlsState();
  }, [publishMatchControlsState]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    return () => {
      window.dispatchEvent(new CustomEvent('cv:match-controls-state', { detail: null }));
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleControlsRequest = () => {
      publishMatchControlsState();
    };

    window.addEventListener('cv:match-controls-request', handleControlsRequest);
    return () => {
      window.removeEventListener('cv:match-controls-request', handleControlsRequest);
    };
  }, [publishMatchControlsState]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleTab = (event: Event) => {
      const tab = (event as CustomEvent<{ tab?: MatchHistoryTab }>).detail?.tab;
      if (tab === 'match_now' || tab === 'matches' || tab === 'liked' || tab === 'passed') {
        setHistoryTab(tab);
      }
    };

    window.addEventListener('cv:match-set-tab', handleTab);
    window.addEventListener('cv:match-refresh', refreshCurrentTab);
    return () => {
      window.removeEventListener('cv:match-set-tab', handleTab);
      window.removeEventListener('cv:match-refresh', refreshCurrentTab);
    };
  }, [refreshCurrentTab]);

  const renderMatchHeader = () => {
    const tabs: Array<{ id: MatchHistoryTab; label: string; count: number }> = [
      { id: 'match_now', label: t('match.match_now') || 'Match Now', count: profiles.length },
      { id: 'matches', label: t('match.my_matches') || 'Matches', count: matchedProfiles.length },
      { id: 'liked', label: t('match.liked') || 'Liked', count: likedProfiles.length },
      { id: 'passed', label: t('match.passed') || 'Passed', count: passedProfiles.length },
    ];
    const activeTab = tabs.find(tab => tab.id === historyTab) ?? tabs[0];
    const ActiveIcon = historyTab === 'matches'
      ? Sparkles
      : historyTab === 'liked'
        ? Star
        : historyTab === 'passed'
          ? Ghost
          : Heart;

    return (
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative lg:hidden"
      >
        <div className={`flex min-h-[50px] flex-wrap items-center gap-2 border-b pb-2 ${isDark ? 'border-white/10' : 'border-slate-200/80'}`}>
          <div className={`flex max-w-full min-w-0 gap-1 overflow-x-auto rounded-full p-1 no-scrollbar ${isDark ? 'bg-white/[0.04]' : 'bg-slate-100/85'}`}>
            {tabs.map((tab) => {
              const active = historyTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  type="button"
                  onClick={() => setHistoryTab(tab.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex h-9 shrink-0 items-center gap-2 rounded-full px-3 text-[10px] font-black uppercase tracking-[0.14em] transition-all ${active
                    ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20'
                    : isDark
                      ? 'text-zinc-500 hover:bg-white/10 hover:text-white'
                      : 'text-slate-500 hover:bg-white hover:text-slate-950'
                    }`}
                >
                  <span>{tab.label}</span>
                  <span className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] ${active ? 'bg-white/20 text-white' : isDark ? 'bg-white/10 text-white' : 'bg-white text-slate-700'}`}>
                    {tab.count}
                  </span>
                </motion.button>
              );
            })}
          </div>

          <div className="ml-auto flex min-w-0 items-center gap-2">
            <div className={`hidden h-9 shrink-0 items-center gap-2 rounded-full px-3 text-[10px] font-black uppercase tracking-[0.14em] sm:flex ${isDark ? 'bg-white/[0.04] text-zinc-400' : 'bg-white/70 text-slate-500'}`}>
              <ActiveIcon className="h-3.5 w-3.5" fill={ActiveIcon === Heart || ActiveIcon === Star ? 'currentColor' : 'none'} />
              <span>{activeTab.label}</span>
            </div>
            <div className={`flex h-9 shrink-0 items-center rounded-full px-3 text-[10px] font-black uppercase tracking-[0.14em] ${isDark ? 'bg-white/[0.04] text-zinc-400' : 'bg-white/70 text-slate-500'}`}>
              {activeTab.count}
            </div>
          </div>

          <motion.button
            type="button"
            onClick={refreshCurrentTab}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            disabled={isCurrentTabLoading}
            aria-label={t('match.refresh') || 'Refresh'}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all disabled:cursor-default disabled:opacity-60 ${isDark
              ? 'bg-white text-slate-950 hover:bg-zinc-200'
              : 'bg-slate-950 text-white hover:bg-slate-800'
              }`}
          >
            <RefreshCw className={`h-4 w-4 ${isCurrentTabLoading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </motion.section>
    );
  };

  const renderHistoryProfileCard = (
    profile: Profile,
    variant: 'matched' | 'liked' | 'passed'
  ) => {
    const Icon = variant === 'matched' ? Sparkles : variant === 'liked' ? Heart : Ghost;
    const faded = variant === 'passed';

    return (
      <motion.article
        key={profile.id}
        className={`elite-card group relative aspect-[3/4] cursor-pointer overflow-hidden p-2 ${faded ? 'opacity-70 hover:opacity-90' : ''}`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: faded ? 0.7 : 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="cv-card-surface-muted relative h-full overflow-hidden rounded-[26px] bg-slate-100">
          <img
            src={getSafeImageURLEx(profile.public_id, null, "cover") || undefined}
            alt={profile.name}
            className={`h-full w-full object-cover transition-transform duration-[3000ms] group-hover:scale-105 ${faded ? 'grayscale' : ''}`}
          />
          <div className={`absolute inset-0 ${faded ? 'bg-black/55' : 'bg-gradient-to-t from-black/85 via-black/10 to-transparent'}`} />
          <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-xl">
            <Icon className="h-4 w-4" fill={variant === 'passed' ? 'none' : 'currentColor'} strokeWidth={2.5} />
          </div>
          <div className="absolute inset-x-0 bottom-0 p-3">
            <h3 className="truncate text-sm font-black tracking-tight text-white">
              {profile.name}{profile.age ? `, ${profile.age}` : ''}
            </h3>
            {profile.location && (
              <div className="mt-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/75">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{profile.location}</span>
              </div>
            )}
          </div>
          {variant === 'matched' && (
            <motion.button
              className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white backdrop-blur-xl"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                handleSendMessage(profile);
              }}
            >
              <MessageCircle className="h-4 w-4" strokeWidth={2.5} />
            </motion.button>
          )}
        </div>
      </motion.article>
    );
  };

  const renderHistoryPanel = () => {
    if (historyTab === 'matches') {
      return (
        <motion.div
          key="matches"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
          className="w-full"
        >
          {isLoadingMatches && matchedProfiles.length === 0 ? (
            <div className="elite-bubble rounded-[28px] px-6 py-10 text-center">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-b-2 border-slate-950 dark:border-white"></div>
              <p className={`text-xs font-bold ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                {t('match.loading') || 'Loading...'}
              </p>
            </div>
          ) : matchedProfiles.length === 0 ? (
            <div className="elite-bubble rounded-[28px] px-6 py-10 text-center">
              <Sparkles className={`mx-auto mb-3 h-8 w-8 ${isDark ? 'text-zinc-600' : 'text-slate-400'}`} />
              <p className={`text-xs font-bold ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                {t('match.no_matches') || 'No matches'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {(expandedMatches ? matchedProfiles : matchedProfiles.slice(0, 6)).map((profile) => (
                  renderHistoryProfileCard(profile, 'matched')
                ))}
              </div>
              {matchedProfiles.length > 6 && (
                <motion.button
                  className="elite-floating w-full py-3 text-sm font-black transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setExpandedMatches(!expandedMatches)}
                >
                  {expandedMatches
                    ? t('match.show_less') || 'Show Less'
                    : `${t('match.view_all') || 'View All'} (${matchedProfiles.length})`
                  }
                </motion.button>
              )}
            </div>
          )}
        </motion.div>
      );
    }

    if (historyTab === 'liked') {
      return (
        <motion.div
          key="liked"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
          className="w-full"
        >
          {isLoadingLiked && likedProfiles.length === 0 ? (
            <div className="elite-bubble rounded-[28px] px-6 py-10 text-center">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-b-2 border-slate-950 dark:border-white"></div>
              <p className={`text-xs font-bold ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                {t('match.loading') || 'Loading...'}
              </p>
            </div>
          ) : likedProfiles.length === 0 ? (
            <div className="elite-bubble rounded-[28px] px-6 py-10 text-center">
              <Heart className={`mx-auto mb-3 h-8 w-8 ${isDark ? 'text-zinc-600' : 'text-slate-400'}`} />
              <p className={`text-xs font-bold ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                {t('match.no_profiles_liked') || 'No likes'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {(expandedLiked ? likedProfiles : likedProfiles.slice(0, 6)).map((profile) => (
                  renderHistoryProfileCard(profile, 'liked')
                ))}
              </div>
              {likedProfiles.length > 6 && (
                <motion.button
                  className="elite-floating w-full py-3 text-sm font-black transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setExpandedLiked(!expandedLiked)}
                >
                  {expandedLiked
                    ? t('match.show_less') || 'Show Less'
                    : `${t('match.view_all') || 'View All'} (${likedProfiles.length})`
                  }
                </motion.button>
              )}
            </div>
          )}
        </motion.div>
      );
    }

    return (
      <motion.div
        key="passed"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.2 }}
        className="w-full"
      >
        {isLoadingPassed && passedProfiles.length === 0 ? (
          <div className="elite-bubble rounded-[28px] px-6 py-10 text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-b-2 border-slate-950 dark:border-white"></div>
            <p className={`text-xs font-bold ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
              {t('match.loading') || 'Loading...'}
            </p>
          </div>
        ) : passedProfiles.length === 0 ? (
          <div className="elite-bubble rounded-[28px] px-6 py-10 text-center">
            <Ghost className={`mx-auto mb-3 h-8 w-8 ${isDark ? 'text-zinc-600' : 'text-slate-400'}`} />
            <p className={`text-xs font-bold ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
              {t('match.no_profiles_passed') || 'No passes'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {(expandedPassed ? passedProfiles : passedProfiles.slice(0, 6)).map((profile) => (
                renderHistoryProfileCard(profile, 'passed')
              ))}
            </div>
            {passedProfiles.length > 6 && (
              <motion.button
                className="elite-floating w-full py-3 text-sm font-black transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setExpandedPassed(!expandedPassed)}
              >
                {expandedPassed
                  ? t('match.show_less') || 'Show Less'
                  : `${t('match.view_all') || 'View All'} (${passedProfiles.length})`
                }
              </motion.button>
            )}
          </div>
        )}
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <div className={`skyline-page-scroll w-full ${pageTextColor}`}>
        <div className="mx-auto flex min-h-full w-full max-w-7xl flex-col gap-4 px-1 pb-8 pt-24 md:px-2 md:pt-28">
          {renderMatchHeader()}
          <div className="flex min-h-[430px] items-center justify-center px-4">
            <div className="elite-bubble rounded-[32px] px-10 py-12 text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-slate-950 dark:border-white"></div>
              <p className={`text-sm font-bold ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                {t('match.loading_profiles') || 'Loading profiles...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Match Animation - Outside Container for full screen display */}
      <AnimatePresence>
        {showMatchAnimation && matchedProfile && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Dark backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Main Match Content */}
            <div className="relative z-10 flex flex-col items-center justify-center">
              {/* Center Pulsing Heart - Üstte */}
              <motion.div
                className="relative mb-8"
                initial={{ scale: 0, rotate: 0, y: -100 }}
                animate={{
                  scale: 1,
                  rotate: 0,
                  y: 0
                }}
                transition={{
                  duration: 0.8,
                  delay: 0.2,
                  type: "spring",
                  stiffness: 200,
                  damping: 15
                }}
              >
                <motion.div
                  animate={{
                    scale: [1, 1.15, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Heart
                    className="w-32 h-32 text-pink-500"
                    fill="currentColor"
                    strokeWidth={2}
                  />
                </motion.div>
              </motion.div>

              {/* Exploding Hearts */}
              {[...Array(20)].map((_, i) => {
                const angle = (i * 360) / 20;
                const distance = 200;
                const x = Math.cos((angle * Math.PI) / 180) * distance;
                const y = Math.sin((angle * Math.PI) / 180) * distance;

                return (
                  <motion.div
                    key={i}
                    className="absolute"
                    initial={{
                      x: 0,
                      y: -100,
                      scale: 0,
                      opacity: 1,
                      rotate: 0
                    }}
                    animate={{
                      x: x,
                      y: y - 100,
                      scale: [0, 1.5, 0],
                      opacity: [1, 1, 0],
                      rotate: 360
                    }}
                    transition={{
                      duration: 1.5,
                      delay: 0.3 + i * 0.02,
                      ease: "easeOut"
                    }}
                  >
                    <Heart
                      className="w-8 h-8 text-pink-500"
                      fill="currentColor"
                    />
                  </motion.div>
                );
              })}

              {/* IT'S A MATCH Text - Altta */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                  delay: 0.1
                }}
                className="mt-8"
              >
                <motion.h1
                  className="text-5xl sm:text-6xl font-bold text-white text-center tracking-tight"
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  {t('match.its_a_match') || 'IT\'S A MATCH!'}
                </motion.h1>
                <motion.p
                  className="text-xl sm:text-2xl text-white/90 text-center mt-4"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {t('match.you_and_liked', { name: matchedProfile?.displayname || matchedProfile?.name || t('match.someone') || 'someone' }) || `You and ${matchedProfile?.displayname || matchedProfile?.name || 'someone'} liked each other`}
                </motion.p>
              </motion.div>

              {/* Confetti Particles */}
              {[...Array(30)].map((_, i) => {
                const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF8B94', '#A8E6CF', '#FFD93D'];
                const color = colors[i % colors.length];
                const angle = Math.random() * 360;
                const distance = 300 + Math.random() * 200;
                const x = Math.cos((angle * Math.PI) / 180) * distance;
                const y = Math.sin((angle * Math.PI) / 180) * distance;
                const size = 8 + Math.random() * 12;

                return (
                  <motion.div
                    key={`confetti-${i}`}
                    className="absolute rounded-full"
                    initial={{
                      x: 0,
                      y: 0,
                      scale: 0,
                      opacity: 1,
                      rotate: 0
                    }}
                    animate={{
                      x: x,
                      y: y,
                      scale: [0, 1, 0.8, 0],
                      opacity: [1, 1, 1, 0],
                      rotate: 720
                    }}
                    transition={{
                      duration: 2,
                      delay: 0.4 + i * 0.03,
                      ease: "easeOut"
                    }}
                    style={{
                      width: `${size}px`,
                      height: `${size}px`,
                      backgroundColor: color
                    }}
                  />
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`skyline-page-scroll w-full ${pageTextColor}`}>
        <div className="mx-auto flex min-h-full w-full max-w-7xl flex-col gap-4 px-1 pb-8 pt-24 md:px-2 md:pt-28">
          {renderMatchHeader()}
          <div className="w-full">
            <AnimatePresence mode="wait">
              {historyTab === 'match_now' ? renderMatchNowPanel() : renderHistoryPanel()}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
};

export default MatchScreen;
