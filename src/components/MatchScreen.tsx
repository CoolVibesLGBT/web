import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo, useMotionValue } from 'framer-motion';
import { Heart, X, Star, MapPin, Briefcase, GraduationCap, MessageCircle, Camera, Shield, Sparkles, ChevronRight, Wine, Cigarette, Baby, PawPrint, Church, Eye, Paintbrush, Ruler, RulerDimensionLine, Palette, Users, Accessibility, PersonStanding, Drama, Vegan, HeartHandshake, Panda, Ghost, Frown, UserCircle, Rainbow, Smile, Banana, Link, Calendar, RefreshCw } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useApp } from '../contexts/AppContext';
import { useTranslation } from 'react-i18next';
import Container from './Container';
import { api } from '../services/api';
import { Actions } from '../services/actions';

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
  const { defaultLanguage } = useApp();
  const { t } = useTranslation('common');
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
    if (apiUser.avatar?.file?.url) {
      images.push(apiUser.avatar.file.url);
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
  const [activeTab, setActiveTab] = useState<'about' | 'details' | 'interests' | 'fantasies'>('about');
  const [exitX, setExitX] = useState(0);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showMatchAnimation, setShowMatchAnimation] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null);
  const [historyTab, setHistoryTab] = useState<'liked' | 'passed' | 'matches'>('matches');
  const [likedProfiles, setLikedProfiles] = useState<Profile[]>([]);
  const [likedProfilesCursor, setLikedProfilesCursor] = useState<string | null>(null);
  const [isLoadingLiked, setIsLoadingLiked] = useState(false);
  const [hasMoreLiked, setHasMoreLiked] = useState(true);
  const [hasLoadedLiked, setHasLoadedLiked] = useState(false);
  const [passedProfiles, setPassedProfiles] = useState<Profile[]>([]);
  const [passedProfilesCursor, setPassedProfilesCursor] = useState<string | null>(null);
  const [isLoadingPassed, setIsLoadingPassed] = useState(false);
  const [hasMorePassed, setHasMorePassed] = useState(true);
  const [hasLoadedPassed, setHasLoadedPassed] = useState(false);
  const [matchedProfiles, setMatchedProfiles] = useState<Profile[]>([]);
  const [matchedProfilesCursor, setMatchedProfilesCursor] = useState<string | null>(null);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [hasMoreMatches, setHasMoreMatches] = useState(true);
  const [hasLoadedMatches, setHasLoadedMatches] = useState(false); // Track if matches have been loaded
  const [processedProfiles, setProcessedProfiles] = useState<Set<string>>(new Set()); // Track processed profile IDs
  const cardRef = useRef<HTMLDivElement>(null);
  const processedProfilesRef = useRef<Set<string>>(new Set());
  const fetchMatchedProfilesRef = useRef<((cursor: string | null, limit: number) => Promise<void>) | null>(null);
  const fetchLikedProfilesRef = useRef<((cursor: string | null, limit: number) => Promise<void>) | null>(null);
  const fetchPassedProfilesRef = useRef<((cursor: string | null, limit: number) => Promise<void>) | null>(null);
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

  // USER_ATTRIBUTES definition (same as ProfileScreen)
  const USER_ATTRIBUTES = [
    { field: 'gender_identity', label: t('profile.gender_identity'), icon: UserCircle },
    { field: 'sexual_orientation', label: t('profile.sexual_orientation'), icon: Rainbow },
    { field: 'sex_role', label: t('profile.sex_role'), icon: Smile },
    { field: 'height', label: t('profile.height'), icon: Ruler },
    { field: 'weight', label: t('profile.weight'), icon: RulerDimensionLine },
    { field: 'hair_color', label: t('profile.hair_color'), icon: Paintbrush },
    { field: 'eye_color', label: t('profile.eye_color'), icon: Eye },
    { field: 'skin_color', label: t('profile.skin_color'), icon: Palette },
    { field: 'body_type', label: t('profile.body_type'), icon: PersonStanding },
    { field: 'ethnicity', label: t('profile.ethnicity'), icon: Users },
    { field: 'zodiac_sign', label: t('profile.zodiac_sign'), icon: Sparkles },
    { field: 'circumcision', label: t('profile.circumcision'), icon: Banana },
    { field: 'physical_disability', label: t('profile.physical_disability'), icon: Accessibility },
    { field: 'smoking', label: t('profile.smoking'), icon: Cigarette },
    { field: 'drinking', label: t('profile.drinking'), icon: Wine },
    { field: 'religion', label: t('profile.religion'), icon: Church },
    { field: 'education', label: t('profile.education_level'), icon: GraduationCap },
    { field: 'relationship_status', label: t('profile.relationship_status'), icon: Heart },
    { field: 'pets', label: t('profile.pets'), icon: PawPrint },
    { field: 'personality', label: t('profile.personality'), icon: Drama },
    { field: 'kids_preference', label: t('profile.kids'), icon: Baby },
    { field: 'dietary', label: t('profile.dietary'), icon: Vegan },
    { field: 'hiv_aids_status', label: t('profile.hiv_aids_status'), icon: HeartHandshake },
    { field: 'bdsm_interest', label: t('profile.bdsm_interest'), icon: Panda },
    { field: 'bdsm_plays', label: t('profile.bdsm_plays'), icon: Ghost },
    { field: 'bdsm_roles', label: t('profile.bdsm_roles'), icon: Frown },
  ];

  // Fantasy category names (same as ProfileScreen)
  const fantasyCategoryNames: Record<string, Record<string, string>> = {
    joy_or_tabu: { en: 'Joy or Taboo', tr: 'Zevk veya Tabu' },
    sexual_adventure: { en: 'Sexual Adventure', tr: 'Cinsel Macera' },
    physical_pref: { en: 'Physical Preference', tr: 'Fiziksel Tercih' },
    sexual_pref: { en: 'Sexual Preference', tr: 'Cinsel Tercih' },
    amusement: { en: 'Amusement', tr: 'Eğlence' },
  };

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleSwipe = async (direction: 'left' | 'right' = 'right', reactionType: 'like' | 'dislike' | 'superlike' = 'like') => {
    const targetX = direction === 'right' ? 600 : -600;
    const currentProfile = profiles[currentIndex];

    if (!currentProfile || !profiles.length) return;

    // Check if already processed using ref (synchronous check)
    if (processedProfilesRef.current.has(currentProfile.id)) {
      // Already processed, remove from profiles list and move to next profile silently
      const currentIdx = currentIndex;
      
      // Remove profile from list and update index
      setProfiles(prev => {
        const filtered = prev.filter(p => p.id !== currentProfile.id);
        
        // Update index based on filtered list
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
      
      // Reset motion values
      x.set(0);
      y.set(0);
      
      // Trigger exit animation
      setExitX(targetX);
      
      return;
    }

    // Mark as processed immediately
    setProcessedProfiles(prev => {
      const newSet = new Set(prev).add(currentProfile.id);
      // Update ref immediately for synchronous access
      processedProfilesRef.current = newSet;
      return newSet;
    });

    // Trigger exit animation immediately for better UX
    setExitX(targetX);

    // Determine reaction type based on direction and explicit type
    let reaction: 'like' | 'dislike' | 'favorite' | 'bookmark' | 'superlike' = 'like';
    if (reactionType === 'superlike') {
      reaction = 'superlike';
    } else if (direction === 'right') {
      reaction = 'like';
    } else {
      reaction = 'dislike';
    }

    // Call API to create match/reaction (fire and forget for better UX)
    api.call<MatchResponse>(Actions.CMD_MATCH_CREATE, {
      method: "POST",
      body: {
        public_id: currentProfile.public_id,
        reaction: reaction,
      },
    }).then((response) => {

      // Handle response
      if (response) {
        if (reaction === 'like' || reaction === 'superlike') {
          // Like edildi - history'ye ekle
          setLikedProfiles(prev => {
            if (!prev.find(p => p.id === currentProfile.id)) {
              return [...prev, currentProfile];
            }
            return prev;
          });

          // Check if matched
          if (response.matched) {
            setMatchedProfiles(prev => {
              if (!prev.find(p => p.id === currentProfile.id)) {
                return [...prev, currentProfile];
              }
              return prev;
            });
            setMatchedProfile(currentProfile);
          setShowMatchAnimation(true);
          setTimeout(() => {
            setShowMatchAnimation(false);
              setMatchedProfile(null);
          }, 2000);
        }
        } else if (reaction === 'dislike') {
          // Pass edildi - history'ye ekle
          setPassedProfiles(prev => {
            if (!prev.find(p => p.id === currentProfile.id)) {
              return [...prev, currentProfile];
            }
            return prev;
          });
        }
      }
    }).catch((error) => {
      console.error('Error creating match:', error);
      // Remove from processed set if API call failed, so user can retry
      setProcessedProfiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentProfile.id);
        // Update ref immediately
        processedProfilesRef.current = newSet;
        return newSet;
      });
    });

    // Remove profile from profiles list immediately (don't wait for API)
    const currentIdx = currentIndex;
    setProfiles(prev => {
      const filtered = prev.filter(p => p.id !== currentProfile.id);
      
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
  };

  const handleDragEnd = (_event: any, info: PanInfo) => {
    const threshold = 100;
    const velocityThreshold = 500;

    // Check velocity first (fast swipe)
    if (Math.abs(info.velocity.x) > velocityThreshold) {
      if (info.velocity.x > 0) {
        handleSwipe('right');
      } else {
        handleSwipe('left');
      }
      return;
    }

    // Check offset (slow drag)
    if (info.offset.x > threshold) {
      handleSwipe('right');
    } else if (info.offset.x < -threshold) {
      handleSwipe('left');
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
    setShowBottomSheet(false);
    setExitX(0);
    setActiveTab('about');
  }, [currentIndex]);

  // Reset processed profiles when profiles list changes (new profiles loaded)
  useEffect(() => {
    setProcessedProfiles(new Set());
  }, [profiles.length]);

  // Fetch matched profiles from API
  const fetchMatchedProfiles = useCallback(async (cursor: string | null = null, limit: number = 20) => {
    try {
      setIsLoadingMatches(true);
      const response = await api.call<{ users: ApiUser[]; cursor: string | null }>(Actions.CMD_MATCH_FETCH_MATCHED, {
        method: "POST",
        body: {
          cursor: cursor,
          limit: limit,
        },
      });
      
      if (response && response.users) {
        const mappedMatches = response.users.map(mapApiUserToProfile);
        
        if (cursor) {
          // Append to existing matches (pagination)
          setMatchedProfiles(prev => [...prev, ...mappedMatches]);
        } else {
          // Initial load - replace matches
          setMatchedProfiles(mappedMatches);
        }
        
        // Update cursor for next page
        setMatchedProfilesCursor(response.cursor);
        setHasMoreMatches(response.cursor !== null && response.cursor !== undefined);
      }
    } catch (error) {
      console.error('Error fetching matched profiles:', error);
    } finally {
      setIsLoadingMatches(false);
    }
  }, [mapApiUserToProfile]);

  // Fetch liked profiles from API
  const fetchLikedProfiles = useCallback(async (cursor: string | null = null, limit: number = 20) => {
    try {
      setIsLoadingLiked(true);
      const response = await api.call<{ users: ApiUser[]; cursor: string | null }>(Actions.CMD_MATCH_FETCH_LIKED, {
        method: "POST",
        body: {
          cursor: cursor,
          limit: limit,
        },
      });
      
      if (response && response.users) {
        const mappedLiked = response.users.map(mapApiUserToProfile);
        
        if (cursor) {
          // Append to existing liked profiles (pagination)
          setLikedProfiles(prev => [...prev, ...mappedLiked]);
        } else {
          // Initial load - replace liked profiles
          setLikedProfiles(mappedLiked);
        }
        
        // Update cursor for next page
        setLikedProfilesCursor(response.cursor);
        setHasMoreLiked(response.cursor !== null && response.cursor !== undefined);
      }
    } catch (error) {
      console.error('Error fetching liked profiles:', error);
    } finally {
      setIsLoadingLiked(false);
    }
  }, [mapApiUserToProfile]);

  // Fetch passed profiles from API
  const fetchPassedProfiles = useCallback(async (cursor: string | null = null, limit: number = 20) => {
    try {
      setIsLoadingPassed(true);
      const response = await api.call<{ users: ApiUser[]; cursor: string | null }>(Actions.CMD_MATCH_FETCH_PASSED, {
        method: "POST",
        body: {
          cursor: cursor,
          limit: limit,
        },
      });
      
      if (response && response.users) {
        const mappedPassed = response.users.map(mapApiUserToProfile);
        
        if (cursor) {
          // Append to existing passed profiles (pagination)
          setPassedProfiles(prev => [...prev, ...mappedPassed]);
        } else {
          // Initial load - replace passed profiles
          setPassedProfiles(mappedPassed);
        }
        
        // Update cursor for next page
        setPassedProfilesCursor(response.cursor);
        setHasMorePassed(response.cursor !== null && response.cursor !== undefined);
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

  // Load matched profiles when matches tab is selected (only once)
  useEffect(() => {
    if (historyTab === 'matches') {
      // Check if we need to load matches
      if (!hasLoadedMatchesRef.current && !isLoadingMatchesRef.current) {
        setHasLoadedMatches(true);
        fetchMatchedProfilesRef.current?.(null, 20);
      }
    } else {
      // Reset flag when switching away from matches tab
      setHasLoadedMatches(false);
    }
  }, [historyTab]); // Only depend on historyTab to avoid infinite loops

  // Load liked profiles when liked tab is selected (only once)
  useEffect(() => {
    if (historyTab === 'liked') {
      // Check if we need to load liked profiles
      if (!hasLoadedLikedRef.current && !isLoadingLikedRef.current) {
        setHasLoadedLiked(true);
        fetchLikedProfilesRef.current?.(null, 20);
      }
    } else {
      // Reset flag when switching away from liked tab
      setHasLoadedLiked(false);
    }
  }, [historyTab]); // Only depend on historyTab to avoid infinite loops

  // Load passed profiles when passed tab is selected (only once)
  useEffect(() => {
    if (historyTab === 'passed') {
      // Check if we need to load passed profiles
      if (!hasLoadedPassedRef.current && !isLoadingPassedRef.current) {
        setHasLoadedPassed(true);
        fetchPassedProfilesRef.current?.(null, 20);
      }
    } else {
      // Reset flag when switching away from passed tab
      setHasLoadedPassed(false);
    }
  }, [historyTab]); // Only depend on historyTab to avoid infinite loops

  // Load all history data on initial mount
  useEffect(() => {
    // Load matches, liked, and passed profiles on page load
    if (!hasLoadedMatchesRef.current && !isLoadingMatchesRef.current) {
      setHasLoadedMatches(true);
      fetchMatchedProfilesRef.current?.(null, 20);
    }
    if (!hasLoadedLikedRef.current && !isLoadingLikedRef.current) {
      setHasLoadedLiked(true);
      fetchLikedProfilesRef.current?.(null, 20);
    }
    if (!hasLoadedPassedRef.current && !isLoadingPassedRef.current) {
      setHasLoadedPassed(true);
      fetchPassedProfilesRef.current?.(null, 20);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Format join date
  const formatJoinDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const locale = defaultLanguage === 'tr' ? 'tr-TR' : 'en-US';
    return `${t('profile.joined') || 'Joined'} ${date.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}`;
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
    <Container>
      <div className='grid sm:grid-cols-2 grid-cols-1 gap-2'>
        <div className='w-full'>
      {profiles.length === 0 ? (
        <div className="flex items-center justify-center min-h-[60dvh] md:min-h-[75dvh]">
          <div className="text-center">
            <div className={`rounded-3xl flex flex-col gap-2 items-center p-8 mb-6 ${theme === 'dark' 
              ? 'border border-white/10' 
              : 'border border-gray-200/50'
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
      <AnimatePresence>
        {showMatchAnimation && matchedProfile && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
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
          <AnimatePresence mode="wait">
            <motion.div
              key={currentProfile.id}
              ref={cardRef}
              className="absolute inset-0 z-10"
              initial={{ scale: 0.96, opacity: 0, y: 20, x: 0, rotate: 0 }}
              animate={{ scale: 1, opacity: 1, y: 0, x: 0, rotate: 0 }}
              exit={{
                x: exitX,
                opacity: 0,
                scale: 0.9,
                rotate: exitX > 0 ? 12 : -12,
                transition: {
                  type: "spring",
                  damping: 40,
                  stiffness: 300,
                  mass: 0.6,
                  duration: 0.25,
                  ease: [0.4, 0, 0.6, 1]
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

                      {/* Bottom Sheet Toggle Button - Professional & Compact */}
                      <motion.button
                        className="mt-3 sm:mt-4 backdrop-blur-xl bg-white/15 hover:bg-white/25 active:bg-white/30 p-2 sm:p-2.5 rounded-full border border-white/40 flex items-center justify-center gap-1.5 transition-all duration-200 shadow-lg"
                        whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.25)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowBottomSheet(true);
                        }}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <span className="text-[11px] sm:text-xs font-semibold text-white tracking-tight">{t('match.profile') || 'Profile'}</span>
                        <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" strokeWidth={3} />
                      </motion.button>
                    </motion.div>
                  </div>
                </div>

                {/* Bottom Sheet - Inside Card */}
                <AnimatePresence>
                  {showBottomSheet && (
                    <>
                      {/* Backdrop inside card */}
                      <motion.div
                        key={`backdrop-${currentProfile.id}`}
                        className="absolute inset-0 z-30 bg-black/50 rounded-[28px] sm:rounded-[32px]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowBottomSheet(false)}
                        transition={{ duration: 0.2 }}
                      />

                      {/* Bottom Sheet */}
                      <motion.div
                        key={`sheet-${currentProfile.id}`}
                        className={`absolute bottom-0 left-0 right-0 z-30 ${theme === 'dark' ? 'bg-[#111111]' : 'bg-white'
                          } rounded-t-[32px] shadow-2xl`}
                        style={{ maxHeight: '85%' }}
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                      >
                        {/* Handle Bar */}
                        <div className="flex justify-center pt-3 pb-2">
                          <div className={`w-12 h-1.5 rounded-full ${theme === 'dark' ? 'bg-white/20' : 'bg-gray-300'
                            }`} />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-4 sm:px-6 pb-4 border-b border-gray-200 dark:border-gray-800">
                          <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                            {currentProfile.displayname || currentProfile.name}
                          </h2>
                          <motion.button
                            className={`p-2 rounded-full ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                            onClick={() => setShowBottomSheet(false)}
                            whileTap={{ scale: 0.95 }}
                          >
                            <X className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
                          </motion.button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 100px)' }}>
                          <div className="p-4 sm:p-6">
                            {/* Tabs Navigation */}
                            <div className={`flex gap-1.5 sm:gap-2 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b overflow-x-auto scrollbar-hide ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'
                              }`}>
                              {[
                                { id: 'about' as const, label: t('match.about') || 'About', count: null },
                                { id: 'details' as const, label: t('match.attributes') || 'Attributes', count: currentProfile.user_attributes?.filter(ua => ua.attribute?.name).length || 0 },
                                { id: 'interests' as const, label: t('match.interests') || 'Interests', count: currentProfile.interests?.length || 0 },
                                { id: 'fantasies' as const, label: t('match.fantasies') || 'Fantasies', count: currentProfile.fantasies?.length || 0 }
                              ].map((tab) => (
                                <motion.button
                                  key={tab.id}
                                  onClick={() => setActiveTab(tab.id)}
                                  className={`px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${activeTab === tab.id
                                      ? theme === 'dark'
                                        ? 'bg-white text-black'
                                        : 'bg-black text-white'
                                      : theme === 'dark'
                                        ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-black'
                                    }`}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  {tab.label}
                                  {tab.count !== null && tab.count > 0 && (
                                    <span className={`ml-1.5 sm:ml-2 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs ${activeTab === tab.id
                                        ? theme === 'dark'
                                          ? 'bg-black/10'
                                          : 'bg-white/20'
                                        : theme === 'dark'
                                          ? 'bg-white/10'
                                          : 'bg-gray-200'
                                      }`}>
                                      {tab.count}
                                    </span>
                                  )}
                                </motion.button>
                              ))}
                            </div>

                            {/* Tab Content */}
                            <AnimatePresence mode="wait">
                              <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                                className="space-y-6"
                              >
                                {/* About Tab */}
                                {activeTab === 'about' && (
                                  <div className="space-y-6">
                                    {/* User Info */}
                                    <div>
                                      <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                        }`}>{t('match.profile') || 'Profile'}</h3>
                                      <div className="space-y-3">
                                        {currentProfile.displayname && (
                                          <div className={`flex items-center p-4 rounded-2xl border transition-all ${theme === 'dark'
                                              ? 'bg-white/5 border-white/10 hover:bg-white/10'
                                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                            }`}>
                                            <div className="flex-1">
                                              <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                                }`}>{t('match.display_name') || 'Display Name'}</p>
                                              <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-black'
                                                }`}>{currentProfile.displayname}</p>
                                            </div>
                                          </div>
                                        )}
                                        {currentProfile.username && (
                                          <div className={`flex items-center p-4 rounded-2xl border transition-all ${theme === 'dark'
                                              ? 'bg-white/5 border-white/10 hover:bg-white/10'
                                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                            }`}>
                                            <div className="flex-1">
                                              <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                                }`}>{t('match.username') || 'Username'}</p>
                                              <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-black'
                                                }`}>@{currentProfile.username}</p>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Bio */}
                                    <div>
                                      <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                        }`}>{t('match.bio') || 'Bio'}</h3>
                                      <p className={`text-base leading-relaxed font-light ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                        }`}>{currentProfile.bio}</p>
                                    </div>

                                    {/* Meta Info */}
                                    {(currentProfile.website || currentProfile.created_at) && (
                                      <div>
                                        <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                          }`}>{t('match.information') || 'Information'}</h3>
                                        <div className="space-y-3">
                                          {currentProfile.website && (
                                            <div className={`flex items-center p-4 rounded-2xl border transition-all ${theme === 'dark'
                                                ? 'bg-white/5 border-white/10 hover:bg-white/10'
                                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                              }`}>
                                              <div className={`p-2.5 rounded-xl mr-4 ${theme === 'dark' ? 'bg-white/10' : 'bg-white'
                                                }`}>
                                                <Link className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-black'
                                                  }`} strokeWidth={2} />
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                                  }`}>{t('match.website') || 'Website'}</p>
                                                <a
                                                  href={currentProfile.website}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className={`text-sm font-semibold hover:underline truncate block ${theme === 'dark' ? 'text-white' : 'text-black'
                                                    }`}
                                                >
                                                  {currentProfile.website.replace(/^https?:\/\//, '')}
                                                </a>
                                              </div>
                                            </div>
                                          )}
                                          {currentProfile.created_at && (
                                            <div className={`flex items-center p-4 rounded-2xl border transition-all ${theme === 'dark'
                                                ? 'bg-white/5 border-white/10 hover:bg-white/10'
                                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                              }`}>
                                              <div className={`p-2.5 rounded-xl mr-4 ${theme === 'dark' ? 'bg-white/10' : 'bg-white'
                                                }`}>
                                                <Calendar className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-black'
                                                  }`} strokeWidth={2} />
                                              </div>
                                              <div>
                                                <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                                  }`}>{t('match.joined') || 'Joined'}</p>
                                                <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-black'
                                                  }`}>{formatJoinDate(currentProfile.created_at)}</p>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Stats */}
                                    {(currentProfile.followers_count !== undefined || currentProfile.following_count !== undefined || currentProfile.posts_count !== undefined) && (
                                      <div>
                                        <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                          }`}>{t('match.stats') || 'Stats'}</h3>
                                        <div className={`rounded-[18px] overflow-hidden ${theme === 'dark'
                                          ? 'bg-gradient-to-br from-gray-900/95 to-gray-900/60 backdrop-blur-xl border border-white/[0.06]'
                                          : 'bg-white backdrop-blur-xl border border-black/[0.06]'
                                          }`}>
                                          <div className="flex items-center justify-around p-4">
                                            {currentProfile.posts_count !== undefined && (
                                              <div className="text-center">
                                                <p className={`text-[22px] font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                                                  {(currentProfile.posts_count ?? 0).toLocaleString()}
                                                </p>
                                                <p className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                                  {t('profile.posts') || 'Posts'}
                                                </p>
                                              </div>
                                            )}
                                            {currentProfile.following_count !== undefined && (
                                              <div className="text-center">
                                                <p className={`text-[22px] font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                                                  {(currentProfile.following_count ?? 0).toLocaleString()}
                                                </p>
                                                <p className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                                  {t('profile.following') || 'Following'}
                                                </p>
                                              </div>
                                            )}
                                            {currentProfile.followers_count !== undefined && (
                                              <div className="text-center">
                                                <p className={`text-[22px] font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                                                  {(currentProfile.followers_count ?? 0).toLocaleString()}
                                                </p>
                                                <p className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                                  {t('profile.followers') || 'Followers'}
                                                </p>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Professional Info in About */}
                                    {(currentProfile.occupation || currentProfile.education) && (
                                      <div>
                                        <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                          }`}>{t('match.professional') || 'Professional'}</h3>
                                        <div className="space-y-3">
                                          {currentProfile.occupation && (
                                            <div className={`flex items-center p-4 rounded-2xl border transition-all ${theme === 'dark'
                                                ? 'bg-white/5 border-white/10 hover:bg-white/10'
                                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                              }`}>
                                              <div className={`p-2.5 rounded-xl mr-4 ${theme === 'dark' ? 'bg-white/10' : 'bg-white'
                                                }`}>
                                                <Briefcase className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-black'
                                                  }`} strokeWidth={2} />
                                              </div>
                                              <div>
                                                <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                                  }`}>{t('match.occupation') || 'Occupation'}</p>
                                                <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-black'
                                                  }`}>{currentProfile.occupation}</p>
                                              </div>
                                            </div>
                                          )}
                                          {currentProfile.education && (
                                            <div className={`flex items-center p-4 rounded-2xl border transition-all ${theme === 'dark'
                                                ? 'bg-white/5 border-white/10 hover:bg-white/10'
                                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                              }`}>
                                              <div className={`p-2.5 rounded-xl mr-4 ${theme === 'dark' ? 'bg-white/10' : 'bg-white'
                                                }`}>
                                                <GraduationCap className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-black'
                                                  }`} strokeWidth={2} />
                                              </div>
                                              <div>
                                                <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                                  }`}>{t('match.education') || 'Education'}</p>
                                                <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-black'
                                                  }`}>{currentProfile.education}</p>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Details Tab - Attributes */}
                                {activeTab === 'details' && (
                                  <div className="space-y-6">
                                    <div>
                                      <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                        }`}>{t('match.attributes') || 'Attributes'}</h3>
                                      <div className={`rounded-[18px] overflow-hidden ${theme === 'dark'
                                        ? 'bg-gradient-to-br from-gray-900/95 to-gray-900/60 backdrop-blur-xl border border-white/[0.06]'
                                        : 'bg-white backdrop-blur-xl border border-black/[0.06]'
                                        }`}>
                                        {USER_ATTRIBUTES.map((item, index) => {
                                          // Find attribute from user_attributes
                                          const currentUserAttribute = currentProfile.user_attributes?.find(
                                            (ua: any) => ua.category_type === item.field
                                          );

                                          // Get display value
                                          let displayValue = '';
                                          let hasValue = false;

                                          if (currentUserAttribute?.attribute?.name) {
                                            displayValue = currentUserAttribute.attribute.name[defaultLanguage] ||
                                              currentUserAttribute.attribute.name.en ||
                                              Object.values(currentUserAttribute.attribute.name)[0] || '';
                                            hasValue = !!displayValue;
                                          }

                                          if (!hasValue) {
                                            displayValue = t('profile.select_option');
                                          }

                                          const isLast = index === USER_ATTRIBUTES.length - 1;

                                          return (
                                            <div
                                              key={item.field}
                                              className={`group flex items-center justify-between px-4 py-3 transition-all duration-200 ${!isLast ? `border-b ${theme === 'dark' ? 'border-white/[0.06]' : 'border-black/[0.04]'}` : ''
                                                } ${theme === 'dark' ? 'hover:bg-white/[0.03] active:bg-white/[0.05]' : 'hover:bg-black/[0.02] active:bg-black/[0.03]'}`}
                                            >
                                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <div className={`p-2.5 rounded-[10px] transition-all duration-200 ${theme === 'dark'
                                                  ? 'bg-white/[0.08] group-hover:bg-white/[0.12]'
                                                  : 'bg-black/[0.04] group-hover:bg-black/[0.06]'
                                                  }`}>
                                                  <item.icon className={`w-7 h-7 ${theme === 'dark' ? 'text-white/90' : 'text-black/90'}`} />
                                                </div>
                                                <span className={`text-[15px] font-medium tracking-[-0.011em] ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                                                  {item.label}
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-2 flex-shrink-0">
                                                {!hasValue && (
                                                  <div className={`w-1.5 h-1.5 rounded-full ${theme === 'dark' ? 'bg-yellow-400/80' : 'bg-yellow-500/80'}`} />
                                                )}
                                                <span className={`text-[13px] font-medium tracking-[-0.006em] whitespace-nowrap ${hasValue
                                                  ? (theme === 'dark' ? 'text-gray-400' : 'text-gray-500')
                                                  : (theme === 'dark' ? 'text-yellow-400/90' : 'text-yellow-600/90')
                                                  }`}>
                                                  {displayValue}
                                                </span>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Interests Tab */}
                                {activeTab === 'interests' && (
                                  <div>
                                    <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                      }`}>{t('match.interests') || 'Interests'}</h3>
                                    {(() => {
                                      const interestsSource = currentProfile.interests;

                                      if (!interestsSource || interestsSource.length === 0) {
                                        return (
                                          <div className={`text-center py-16 rounded-[18px] ${theme === 'dark'
                                            ? 'bg-gradient-to-br from-gray-900/95 to-gray-900/60 backdrop-blur-xl border border-white/[0.06]'
                                            : 'bg-white/95 backdrop-blur-xl border border-black/[0.06]'
                                            }`}>
                                            <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${theme === 'dark' ? 'bg-white/[0.08]' : 'bg-black/[0.04]'}`}>
                                              <Heart className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                                            </div>
                                            <p className={`text-[15px] font-medium ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>{t('profile.no_interests_added')}</p>
                                          </div>
                                        );
                                      }

                                      // Group interests by category
                                      const interestsByCategory: Record<string, Array<{ id: string; name: string; emoji?: string; categoryId: string; categoryName: string }>> = {};

                                      interestsSource.forEach((interest: any) => {
                                        if (typeof interest === 'object' && interest !== null && interest.interest_item) {
                                          const itemName = interest.interest_item.name[defaultLanguage] ||
                                            interest.interest_item.name.en ||
                                            Object.values(interest.interest_item.name)[0] ||
                                            `Interest ${interest.interest_item.id}`;

                                          const categoryId = interest.interest_item.interest_id || interest.interest_item.interest?.id || 'other';
                                          const categoryName = interest.interest_item.interest?.name?.[defaultLanguage] ||
                                            interest.interest_item.interest?.name?.en ||
                                            (interest.interest_item.interest?.name ? Object.values(interest.interest_item.interest.name)[0] : null) ||
                                            'Other';

                                          if (!interestsByCategory[categoryId]) {
                                            interestsByCategory[categoryId] = [];
                                          }

                                          interestsByCategory[categoryId].push({
                                            id: interest.interest_item.id || interest.id,
                                            name: itemName,
                                            emoji: interest.interest_item.emoji,
                                            categoryId,
                                            categoryName,
                                          });
                                        }
                                      });

                                      return (
                                        <div className="space-y-3">
                                          {Object.entries(interestsByCategory).map(([categoryId, categoryInterests]) => {
                                            const categoryName = categoryInterests[0]?.categoryName || 'Other';
                                            return (
                                              <div
                                                key={categoryId}
                                                className={`rounded-[18px] overflow-hidden ${theme === 'dark'
                                                  ? 'bg-gradient-to-br from-gray-900/95 to-gray-900/60 backdrop-blur-xl border border-white/[0.06]'
                                                  : 'bg-white backdrop-blur-xl border border-black/[0.06]'
                                                  }`}
                                              >
                                                <div className={`px-4 py-2.5 border-b ${theme === 'dark' ? 'border-white/[0.06]' : 'border-black/[0.04]'}`}>
                                                  <h3 className={`text-[11px] font-bold uppercase tracking-[0.08em] ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                                                    {categoryName}
                                                  </h3>
                                                </div>
                                                <div className="p-3.5 flex flex-wrap gap-2">
                                                  {categoryInterests.map((item, index) => (
                                                    <motion.span
                                                      key={item.id}
                                                      className={`inline-flex items-center gap-1.5 px-4 py-2 text-[14px] font-medium tracking-[-0.006em] rounded-full transition-all duration-200 cursor-default ${theme === 'dark'
                                                        ? 'bg-white/[0.08] text-gray-200 hover:bg-white/[0.12] active:scale-[0.98]'
                                                        : 'bg-black/[0.04] text-gray-800 hover:bg-black/[0.06] active:scale-[0.98]'
                                                        }`}
                                                      initial={{ opacity: 0, scale: 0 }}
                                                      animate={{ opacity: 1, scale: 1 }}
                                                      transition={{ delay: 0.7 + index * 0.05, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                                                    >
                                                      {item.emoji && <span className="text-[15px] leading-none">{item.emoji}</span>}
                                                      <span>{item.name}</span>
                                                    </motion.span>
                                                  ))}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                )}

                                {/* Fantasies Tab */}
                                {activeTab === 'fantasies' && (
                                  <div>
                                    <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                      }`}>{t('match.fantasies_preferences') || 'Fantasies & Preferences'}</h3>
                                    {currentProfile.fantasies && currentProfile.fantasies.length > 0 ? (
                                      (() => {
                                        // Group fantasies by category
                                        const fantasiesByCategory: Record<string, typeof currentProfile.fantasies> = {};
                                        currentProfile.fantasies.forEach((f) => {
                                          const categoryId = f.fantasy?.category || 'other';
                                          if (!fantasiesByCategory[categoryId]) {
                                            fantasiesByCategory[categoryId] = [];
                                          }
                                          fantasiesByCategory[categoryId].push(f);
                                        });

                                        return (
                                          <div className="space-y-3">
                                            {Object.entries(fantasiesByCategory).map(([categoryId, categoryFantasies]) => {
                                              const categoryName = fantasyCategoryNames[categoryId]?.[defaultLanguage] ||
                                                fantasyCategoryNames[categoryId]?.en ||
                                                categoryId;
                                              return (
                                                <div
                                                  key={categoryId}
                                                  className={`rounded-[18px] overflow-hidden ${theme === 'dark'
                                                    ? 'bg-gradient-to-br from-gray-900/95 to-gray-900/60 backdrop-blur-xl border border-white/[0.06]'
                                                    : 'bg-white backdrop-blur-xl border border-black/[0.06]'
                                                    }`}
                                                >
                                                  <div className={`px-4 py-2.5 border-b ${theme === 'dark' ? 'border-white/[0.06]' : 'border-black/[0.04]'}`}>
                                                    <h3 className={`text-[11px] font-bold uppercase tracking-[0.08em] ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                                                      {categoryName}
                                                    </h3>
                                                  </div>
                                                  <div className="p-3.5 flex flex-wrap gap-2">
                                                    {categoryFantasies.map((f, index) => {
                                                      const translation = f.fantasy?.translations?.find(t => t.language === defaultLanguage) ||
                                                        f.fantasy?.translations?.find(t => t.language === 'en') ||
                                                        f.fantasy?.translations?.[0];
                                                      const label = translation?.label || `Fantasy ${f.fantasy_id || f.id}`;
                                                      return (
                                                        <motion.span
                                                          key={f.id || f.fantasy_id}
                                                          className={`px-4 py-2 text-[14px] font-medium tracking-[-0.006em] rounded-full transition-all duration-200 cursor-default ${theme === 'dark'
                                                            ? 'bg-white/[0.08] text-gray-200 hover:bg-white/[0.12] active:scale-[0.98]'
                                                            : 'bg-black/[0.04] text-gray-800 hover:bg-black/[0.06] active:scale-[0.98]'
                                                            }`}
                                                          initial={{ opacity: 0, scale: 0 }}
                                                          animate={{ opacity: 1, scale: 1 }}
                                                          transition={{ delay: 0.9 + index * 0.05, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                                                        >
                                                          {label}
                                                        </motion.span>
                                                      );
                                                    })}
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        );
                                      })()
                                    ) : (
                                      <div className={`text-center py-16 rounded-[18px] ${theme === 'dark'
                                        ? 'bg-gradient-to-br from-gray-900/95 to-gray-900/60 backdrop-blur-xl border border-white/[0.06]'
                                        : 'bg-white/95 backdrop-blur-xl border border-black/[0.06]'
                                        }`}>
                                        <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${theme === 'dark' ? 'bg-white/[0.08]' : 'bg-black/[0.04]'}`}>
                                          <Sparkles className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                                        </div>
                                        <p className={`text-[15px] font-medium ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>{t('profile.no_fantasies_added')}</p>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Action Buttons at Bottom */}
                                <motion.div
                                  className="pt-4 sm:pt-6 pb-3 sm:pb-4"
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <motion.button
                                    className={`w-full flex items-center justify-center gap-2 sm:gap-3 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base transition-all ${theme === 'dark'
                                        ? 'bg-white text-black hover:bg-gray-100'
                                        : 'bg-black text-white hover:bg-gray-900'
                                      }`}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
                                    <span>{t('match.send_message') || 'Send Message'}</span>
                                  </motion.button>
                                </motion.div>
                              </motion.div>
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
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
            onClick={() => handleSwipe('left')}
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
            onClick={() => handleSwipe('right')}
          >
            <Heart className="w-6 h-6 sm:w-7 sm:h-7" fill="currentColor" strokeWidth={2} />
          </motion.button>
        </motion.div>


      </motion.div>
      </>
      )}
      </div>

      {/* History Section - Inline below buttons */}
      <motion.div
        className="mt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {/* Tabs */}
        <div className={`flex gap-2 px-4 mb-4 overflow-x-auto scrollbar-hide ${theme === 'dark' ? '' : ''
          }`}>
          {[
            { id: 'matches' as const, label: t('match.my_matches') || 'My Matches', icon: Sparkles, count: matchedProfiles.length },
            { id: 'liked' as const, label: t('match.liked') || 'Liked', icon: Heart, count: likedProfiles.length },
            { id: 'passed' as const, label: t('match.passed') || 'Passed', icon: Ghost, count: passedProfiles.length }
          ].map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setHistoryTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${historyTab === tab.id
                  ? theme === 'dark'
                    ? 'bg-white text-black'
                    : 'bg-black text-white'
                  : theme === 'dark'
                    ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-black'
                }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${historyTab === tab.id
                    ? theme === 'dark'
                      ? 'bg-black/10'
                      : 'bg-white/20'
                    : theme === 'dark'
                      ? 'bg-white/10'
                      : 'bg-gray-200'
                  }`}>
                  {tab.count}
                </span>
              )}
            </motion.button>
          ))}
        </div>

        {/* Content */}
        <div className={`w-full overflow-hidden`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={historyTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="p-4 sm:p-6"
            >
              {/* Matched Profiles */}
              {historyTab === 'matches' && (
                <div className="space-y-4">
                  {isLoadingMatches && matchedProfiles.length === 0 ? (
                    <div className={`text-center py-12 rounded-2xl ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'
                      }`}>
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
                      <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                        {t('match.loading_matches') || 'Loading matches...'}
                      </p>
                    </div>
                  ) : matchedProfiles.length === 0 ? (
                    <div className={`text-center py-12 rounded-2xl ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'
                      }`}>
                      <Sparkles className={`w-12 h-12 mx-auto mb-3 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                        }`} />
                      <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                        {t('match.no_matches') || 'No matches yet'}
                      </p>
                    </div>
                  ) : (
                    <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {matchedProfiles.map((profile) => (
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
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <h3 className="text-white font-semibold text-sm truncate">
                              {profile.name}, {profile.age}
                            </h3>
                          </div>
                          <div className="absolute top-2 right-2">
                            <Sparkles className="w-5 h-5 text-pink-500" fill="currentColor" />
                          </div>
                          {/* Send Message Button - Icon */}
                          <motion.button
                            className={`absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-xl text-white bg-white/20 rounded-full border border-white/30`}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ 
                              type: "spring",
                              stiffness: 300,
                              damping: 20
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle message action
                            }}
                          >
                            <MessageCircle className="w-5 h-5" strokeWidth={2.5} />
                          </motion.button>
                        </motion.div>
                      ))}
                    </div>
                      {/* Load More Button */}
                      {hasMoreMatches && (
                        <div className="flex justify-center mt-6">
                          <motion.button
                            className={`px-6 py-3 rounded-full text-sm font-semibold transition-all ${theme === 'dark'
                              ? 'bg-white/10 text-white hover:bg-white/20'
                              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => fetchMatchedProfiles(matchedProfilesCursor, 20)}
                            disabled={isLoadingMatches}
                          >
                            {isLoadingMatches ? (
                              <span className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                {t('match.loading') || 'Loading...'}
                              </span>
                            ) : (
                              t('match.load_more') || 'Load More'
                            )}
                          </motion.button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Liked Profiles */}
              {historyTab === 'liked' && (
                <div className="space-y-4">
                  {isLoadingLiked && likedProfiles.length === 0 ? (
                    <div className={`text-center py-12 rounded-2xl ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'
                      }`}>
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
                      <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                        {t('match.loading_liked') || 'Loading liked profiles...'}
                      </p>
                    </div>
                  ) : likedProfiles.length === 0 ? (
                    <div className={`text-center py-12 rounded-2xl ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'
                      }`}>
                      <Heart className={`w-12 h-12 mx-auto mb-3 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                        }`} />
                      <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                        {t('match.no_profiles_liked') || 'No profiles liked yet'}
                      </p>
                    </div>
                  ) : (
                    <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {likedProfiles.map((profile) => (
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
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <h3 className="text-white font-semibold text-sm truncate">
                              {profile.name}, {profile.age}
                            </h3>
                          </div>
                          <div className="absolute top-2 right-2">
                            <Heart className="w-5 h-5 text-pink-500" fill="currentColor" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                      {/* Load More Button */}
                      {hasMoreLiked && (
                        <div className="flex justify-center mt-6">
                          <motion.button
                            className={`px-6 py-3 rounded-full text-sm font-semibold transition-all ${theme === 'dark'
                              ? 'bg-white/10 text-white hover:bg-white/20'
                              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => fetchLikedProfilesRef.current?.(likedProfilesCursor, 20)}
                            disabled={isLoadingLiked}
                          >
                            {isLoadingLiked ? (
                              <span className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                {t('match.loading') || 'Loading...'}
                              </span>
                            ) : (
                              t('match.load_more') || 'Load More'
                            )}
                          </motion.button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Passed Profiles */}
              {historyTab === 'passed' && (
                <div className="space-y-4">
                  {isLoadingPassed && passedProfiles.length === 0 ? (
                    <div className={`text-center py-12 rounded-2xl ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'
                      }`}>
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
                      <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                        {t('match.loading_passed') || 'Loading passed profiles...'}
                      </p>
                    </div>
                  ) : passedProfiles.length === 0 ? (
                    <div className={`text-center py-12 rounded-2xl ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'
                      }`}>
                      <Ghost className={`w-12 h-12 mx-auto mb-3 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                        }`} />
                      <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                        {t('match.no_profiles_passed') || 'No profiles passed yet'}
                      </p>
                    </div>
                  ) : (
                    <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {passedProfiles.map((profile) => (
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
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <h3 className="text-white font-semibold text-sm truncate">
                              {profile.name}, {profile.age}
                            </h3>
                          </div>
                          <div className="absolute top-2 right-2">
                            <Ghost className="w-5 h-5 text-red-500" strokeWidth={3} />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                      {/* Load More Button */}
                      {hasMorePassed && (
                        <div className="flex justify-center mt-6">
                          <motion.button
                            className={`px-6 py-3 rounded-full text-sm font-semibold transition-all ${theme === 'dark'
                              ? 'bg-white/10 text-white hover:bg-white/20'
                              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => fetchPassedProfilesRef.current?.(passedProfilesCursor, 20)}
                            disabled={isLoadingPassed}
                          >
                            {isLoadingPassed ? (
                              <span className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                {t('match.loading') || 'Loading...'}
                              </span>
                            ) : (
                              t('match.load_more') || 'Load More'
                            )}
                          </motion.button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
      </div>
    </Container>
  );
};

export default MatchScreen;
