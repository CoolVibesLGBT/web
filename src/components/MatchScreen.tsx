import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo, useMotionValue } from 'framer-motion';
import { Heart, X, Star, MapPin, Camera, Shield, Sparkles, MessageCircle, Ghost, RefreshCw, Info } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Container from './Container';
import ProfileScreen from './ProfileScreen';
import { api } from '../services/api';
import { Actions } from '../services/actions';
import { getSafeImageURL } from '../helpers/helpers';

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
      const imageUrl = getSafeImageURL(apiUser.avatar, "small");
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

  // Fetch profiles from API
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setIsLoading(true);
        const response = await api.call<{ users: ApiUser[] } | ApiUser[]>(Actions.CMD_MATCH_GET_UNSEEN, {
          method: "POST",
          body: { limit: 100 },
        });
        
        // Handle both array and object response formats
        let apiUsers: ApiUser[] = [];
        if (Array.isArray(response)) {
          apiUsers = response;
        } else if (response && typeof response === 'object' && 'users' in response) {
          apiUsers = response.users;
        }
        
        // Map API users to Profile format
        const mappedProfiles = apiUsers.map(mapApiUserToProfile);
        setProfiles(mappedProfiles);
      } catch (error) {
        console.error('Error fetching profiles:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfiles();
  }, [mapApiUserToProfile]);

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
  
  // Keep refs in sync with state
  useEffect(() => {
    processedProfilesRef.current = processedProfiles;
  }, [processedProfiles]);

  // Debug: Track match animation state changes
  useEffect(() => {
    console.log('🎭 showMatchAnimation changed:', showMatchAnimation);
    console.log('👤 matchedProfile:', matchedProfile ? `${matchedProfile.name} (ID: ${matchedProfile.id})` : 'null');
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
      const response = await api.call<MatchResponse>(Actions.CMD_MATCH_CREATE, {
        method: "POST",
        body: {
          public_id: currentProfile.public_id,
          reaction: reaction,
        },
      });

      console.log('🔍 Match API response:', JSON.stringify(response, null, 2));

      // Handle response
      if (response) {
        if (reaction === 'like' || reaction === 'superlike') {
          // Check if matched FIRST - CRITICAL: Check response.matched explicitly
          console.log('🔎 Checking match status - response.matched:', response.matched, 'type:', typeof response.matched);
          
          const isMatched = response.matched === true || 
            (typeof response.matched === 'string' && (response.matched as string).toLowerCase() === 'true') ||
            (typeof response.matched === 'number' && response.matched === 1);
          
          console.log('🎯 isMatched result:', isMatched);
          
          if (isMatched) {
            console.log('✅ Match detected! Showing animation for profile:', profileForMatch);
            console.log('🎬 Setting match animation states...');
            
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
            console.log('🎭 Triggering match animation NOW!');
            setMatchedProfile(profileForMatch);
            setShowMatchAnimation(true);
            
            // Hide animation after 2.5 seconds
            setTimeout(() => {
              console.log('🎬 Hiding match animation...');
              setShowMatchAnimation(false);
              setMatchedProfile(null);
            }, 2500);
          } else {
            console.log('❌ No match - response.matched:', response.matched, typeof response.matched);
            
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
      } else {
        console.log('⚠️ No response from API');
      }
    } catch (error) {
      console.error('❌ Error creating match:', error);
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

  const handleDragEnd = (_event: any, info: PanInfo) => {
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
  }, [currentIndex]);

  // Reset processed profiles when profiles list changes (new profiles loaded)
  useEffect(() => {
    setProcessedProfiles(new Set());
  }, [profiles.length]);

  // Fetch matched profiles from API
  const fetchMatchedProfiles = useCallback(async (limit: number = 20) => {
    try {
      setIsLoadingMatches(true);
      const response = await api.call<{ users: ApiUser[]; cursor: string | null }>(Actions.CMD_MATCH_FETCH_MATCHED, {
        method: "POST",
        body: {
          cursor: null,
          limit: limit,
        },
      });
      
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
      const response = await api.call<{ users: ApiUser[]; cursor: string | null }>(Actions.CMD_MATCH_FETCH_LIKED, {
        method: "POST",
        body: {
          cursor: null,
          limit: limit,
        },
      });
      
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
      const response = await api.call<{ users: ApiUser[]; cursor: string | null }>(Actions.CMD_MATCH_FETCH_PASSED, {
        method: "POST",
        body: {
          cursor: null,
          limit: limit,
        },
      });
      
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Handle send message - create chat and navigate
  const handleSendMessage = async (profile: Profile) => {
    if (!user?.id || !profile?.id) {
      console.error('User or profile ID is missing');
      return;
    }

    try {
      // Create chat via API
      const chatResponse = await api.call<{ 
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
      }>(Actions.CMD_CHAT_CREATE, {
        method: "POST",
        body: {
          type: 'private',
          participant_ids: [profile.id],
        },
      });

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

  if (isLoading) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('match.loading_profiles') || 'Loading profiles...'}
            </p>
          </div>
        </div>
      </Container>
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

      <Container>
        <div className='w-full'>
      {profiles.length === 0 ? (
        <div className="flex items-center justify-center p-4 h-[100dvh] min-h-[60dvh] md:min-h-[75dvh]">
          <div className="text-center">
            <div className={`rounded-3xl flex flex-col gap-2 h-[100dvh] justify-center items-center p-8 mb-6 ${theme === 'dark' 
              ? 'bg-white/5' 
              : 'bg-gray-50'
            }`}>
              <Heart className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
              <p className={`text-base font-semibold mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              {t('match.no_profiles') || 'No profiles to show right now. Come back soon!'}
              </p>
              <motion.button
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all ${
                  theme === 'dark'
                    ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                    : 'bg-gray-900 text-white hover:bg-gray-800 border border-gray-300'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={async () => {
                  try {
                    setIsLoading(true);
                    const response = await api.call<{ users: ApiUser[] } | ApiUser[]>(Actions.CMD_MATCH_GET_UNSEEN, {
                      method: "POST",
                      body: { limit: 100 },
                    });
                    
                    let apiUsers: ApiUser[] = [];
                    if (Array.isArray(response)) {
                      apiUsers = response;
                    } else if (response && typeof response === 'object' && 'users' in response) {
                      apiUsers = response.users;
                    }
                    
                    const mappedProfiles = apiUsers.map(mapApiUserToProfile);
                    setProfiles(mappedProfiles);
                  } catch (error) {
                    console.error('Error fetching profiles:', error);
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{t('match.refresh') || 'Refresh'}</span>
              </motion.button>
            </div>
          </div>
        </div>
      ) : (
        <>
      <motion.div
        className="w-full max-w-md mx-auto  p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >



        {/* Cards Container */}
        <div className="relative max-h-[60dvh] min-h-[60dvh] md:min-h-[75dvh] md:max-h-[75dvh]">
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
                className={`h-full rounded-[28px] sm:rounded-[32px] overflow-hidden relative ${theme === 'dark'
                    ? 'bg-[#111111] shadow-xl shadow-black/40'
                    : 'bg-white shadow-xl shadow-black/5 border border-gray-100'
                  }`}
              >
                <div className="absolute inset-0 w-full h-full">
                  <img
                    src={nextProfile.images[0]}
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
                className={`h-full rounded-[28px] sm:rounded-[32px] overflow-hidden relative ${theme === 'dark'
                    ? 'bg-[#111111] shadow-2xl shadow-black/60'
                    : 'bg-white shadow-2xl shadow-black/10 border border-gray-100'
                  }`}
              >
                {/* Image Section - Full Height */}
                <div className="absolute inset-0 w-full h-full z-0">
                  {/* Image Container */}
                  <div
                    className="relative h-full overflow-hidden rounded-[28px] sm:rounded-[32px] cursor-pointer"
                    onClick={handleImageClick}
                  >
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={currentImageIndex}
                        src={currentProfile.images[currentImageIndex]}
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent pointer-events-none" />
                    <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />

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
                    <div className="absolute top-4 sm:top-6 right-4 sm:right-6 flex flex-row gap-2">
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
                        className={`backdrop-blur-xl rounded-full px-3 sm:px-4 py-1.5 sm:py-2 border ${theme === 'dark'
                            ? 'bg-white text-black border-white/20'
                            : 'bg-black text-white border-black/20'
                          }`}
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
                              <span className="text-xs sm:text-sm font-medium text-white/90 truncate drop-shadow-lg">{currentProfile.location}</span>
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
                        className="mt-3 sm:mt-4 backdrop-blur-xl bg-white/15 hover:bg-white/25 active:bg-white/30 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full border border-white/40 flex items-center justify-center gap-2 transition-all duration-200 shadow-lg"
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
                        className={`absolute bottom-0 left-0 right-0 z-40 ${theme === 'dark' ? 'bg-[#111111]' : 'bg-white'
                          } rounded-t-[32px] shadow-2xl`}
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
                        <div className="flex items-center justify-between px-4 sm:px-6 pb-4 border-b border-gray-200 dark:border-gray-800">
                          <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                            {currentProfile.displayname || currentProfile.name}
                          </h2>
                          <motion.button
                            className={`p-2 rounded-full ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                            onClick={() => setShowProfileModal(false)}
                            whileTap={{ scale: 0.95 }}
                          >
                            <X className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
                          </motion.button>
                        </div>

                        {/* Scrollable Profile Content */}
                        <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 100px)' }}>
                          <div className={`${theme === 'dark' ? 'bg-[#111111]' : 'bg-white'}`}>
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
          className="flex justify-center items-center gap-4 sm:gap-5 mt-4 sm:mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Pass Button */}
          <motion.button
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center border-2 transition-all shadow-lg ${theme === 'dark'
                ? 'bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30'
                : 'bg-gray-50 border-gray-300 hover:bg-gray-100 hover:border-gray-400'
              }`}
            whileHover={{ scale: 1.1, rotate: -15 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleSwipe('left', 'dislike')}
          >
            <X className={`w-6 h-6 sm:w-7 sm:h-7 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} strokeWidth={2.5} />
          </motion.button>

          {/* Super Like Button */}
          <motion.button
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border-2 transition-all shadow-lg ${theme === 'dark'
                ? 'bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30'
                : 'bg-gray-50 border-gray-300 hover:bg-gray-100 hover:border-gray-400'
              }`}
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleSwipe('right', 'superlike')}
          >
            <Star className={`w-5 h-5 sm:w-6 sm:h-6 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`} fill="currentColor" strokeWidth={2} />
          </motion.button>

          {/* Like Button */}
          <motion.button
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${theme === 'dark'
                ? 'bg-white text-black hover:bg-gray-100'
                : 'bg-black text-white hover:bg-gray-900'
              }`}
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
        </div>

      {/* History Section - Side by side on desktop, stacked on mobile */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 px-4 pb-6">
        {/* Matches Column */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className={`w-5 h-5 ${theme === 'dark' ? 'text-pink-400' : 'text-pink-500'}`} />
              <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                {t('match.my_matches') || 'Matches'}
              </h3>
            </div>
            {matchedProfiles.length > 0 && (
              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${theme === 'dark' ? 'bg-white/10 text-white' : 'bg-gray-200 text-black'}`}>
                {matchedProfiles.length}
              </span>
            )}
          </div>
          
          {isLoadingMatches && matchedProfiles.length === 0 ? (
            <div className={`text-center py-8 rounded-2xl ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto mb-2"></div>
              <p className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {t('match.loading') || 'Loading...'}
              </p>
            </div>
          ) : matchedProfiles.length === 0 ? (
            <div className={`text-center py-8 rounded-2xl ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
              <Sparkles className={`w-8 h-8 mx-auto mb-2 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {t('match.no_matches') || 'No matches'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {(expandedMatches ? matchedProfiles : matchedProfiles.slice(0, 6)).map((profile) => (
                  <motion.div
                    key={profile.id}
                    className="relative rounded-2xl overflow-hidden aspect-[3/4] cursor-pointer group"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <img
                      src={profile.images[0]}
                      alt={profile.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <h3 className="text-white font-semibold text-xs truncate">
                        {profile.name}, {profile.age}
                      </h3>
                    </div>
                    <div className="absolute top-2 right-2">
                      <Sparkles className="w-4 h-4 text-pink-500" fill="currentColor" />
                    </div>
                    <motion.button
                      className="absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-xl text-white bg-white/20 border border-white/30"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendMessage(profile);
                      }}
                    >
                      <MessageCircle className="w-4 h-4" strokeWidth={2.5} />
                    </motion.button>
                  </motion.div>
                ))}
              </div>
              {matchedProfiles.length > 6 && (
                <motion.button
                  className={`w-full py-2.5 text-sm font-semibold rounded-xl transition-all ${
                    theme === 'dark' 
                      ? 'bg-white/10 text-white hover:bg-white/15 border border-white/10' 
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-200'
                  }`}
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

        {/* Liked Column */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Heart className={`w-5 h-5 ${theme === 'dark' ? 'text-pink-400' : 'text-pink-500'}`} />
              <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                {t('match.liked') || 'Liked'}
              </h3>
            </div>
            {likedProfiles.length > 0 && (
              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${theme === 'dark' ? 'bg-white/10 text-white' : 'bg-gray-200 text-black'}`}>
                {likedProfiles.length}
              </span>
            )}
          </div>
          
          {isLoadingLiked && likedProfiles.length === 0 ? (
            <div className={`text-center py-8 rounded-2xl ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto mb-2"></div>
              <p className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {t('match.loading') || 'Loading...'}
              </p>
            </div>
          ) : likedProfiles.length === 0 ? (
            <div className={`text-center py-8 rounded-2xl ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
              <Heart className={`w-8 h-8 mx-auto mb-2 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {t('match.no_profiles_liked') || 'No likes'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {(expandedLiked ? likedProfiles : likedProfiles.slice(0, 6)).map((profile) => (
                  <motion.div
                    key={profile.id}
                    className="relative rounded-2xl overflow-hidden aspect-[3/4] cursor-pointer group"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <img
                      src={profile.images[0]}
                      alt={profile.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <h3 className="text-white font-semibold text-xs truncate">
                        {profile.name}, {profile.age}
                      </h3>
                    </div>
                    <div className="absolute top-2 right-2">
                      <Heart className="w-4 h-4 text-pink-500" fill="currentColor" />
                    </div>
                  </motion.div>
                ))}
              </div>
              {likedProfiles.length > 6 && (
                <motion.button
                  className={`w-full py-2.5 text-sm font-semibold rounded-xl transition-all ${
                    theme === 'dark' 
                      ? 'bg-white/10 text-white hover:bg-white/15 border border-white/10' 
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-200'
                  }`}
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

        {/* Passed Column */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Ghost className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
              <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                {t('match.passed') || 'Passed'}
              </h3>
            </div>
            {passedProfiles.length > 0 && (
              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${theme === 'dark' ? 'bg-white/10 text-white' : 'bg-gray-200 text-black'}`}>
                {passedProfiles.length}
              </span>
            )}
          </div>
          
          {isLoadingPassed && passedProfiles.length === 0 ? (
            <div className={`text-center py-8 rounded-2xl ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto mb-2"></div>
              <p className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {t('match.loading') || 'Loading...'}
              </p>
            </div>
          ) : passedProfiles.length === 0 ? (
            <div className={`text-center py-8 rounded-2xl ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
              <Ghost className={`w-8 h-8 mx-auto mb-2 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {t('match.no_profiles_passed') || 'No passes'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {(expandedPassed ? passedProfiles : passedProfiles.slice(0, 6)).map((profile) => (
                  <motion.div
                    key={profile.id}
                    className="relative rounded-2xl overflow-hidden aspect-[3/4] cursor-pointer group opacity-60"
                    whileHover={{ scale: 1.02, opacity: 0.8 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 0.6, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <img
                      src={profile.images[0]}
                      alt={profile.name}
                      className="w-full h-full object-cover grayscale"
                    />
                    <div className="absolute inset-0 bg-black/50" />
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <h3 className="text-white font-semibold text-xs truncate">
                        {profile.name}, {profile.age}
                      </h3>
                    </div>
                    <div className="absolute top-2 right-2">
                      <Ghost className="w-4 h-4 text-red-500" strokeWidth={3} />
                    </div>
                  </motion.div>
                ))}
              </div>
              {passedProfiles.length > 6 && (
                <motion.button
                  className={`w-full py-2.5 text-sm font-semibold rounded-xl transition-all ${
                    theme === 'dark' 
                      ? 'bg-white/10 text-white hover:bg-white/15 border border-white/10' 
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-200'
                  }`}
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
      </div>
    </Container>
    </>
  );
};

export default MatchScreen;
