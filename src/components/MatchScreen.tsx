import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { Heart, X, Star, MapPin, Briefcase, GraduationCap, MessageCircle, Info, Camera, Shield, Sparkles, ChevronLeft, ChevronRight, Wine, Cigarette, Baby, PawPrint, Church, Eye, Paintbrush, Ruler, RulerDimensionLine, Palette, Users, Accessibility, PersonStanding, Drama, Vegan, HeartHandshake, Panda, Ghost, Frown, UserCircle, Rainbow, Smile, Banana } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useApp } from '../contexts/AppContext';
import { useTranslation } from 'react-i18next';
import Container from './Container';

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

interface Profile {
  id: number;
  name: string;
  age: number;
  location: string;
  bio: string;
  images: string[];
  interests?: InterestItem[];
  occupation?: string;
  education?: string;
  distance: string;
  verified?: boolean;
  lastActive?: string;
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

const MatchScreen: React.FC = () => {
  const { theme } = useTheme();
  const { defaultLanguage } = useApp();
  const { t } = useTranslation('common');
  const [profiles] = useState<Profile[]>([
    {
      id: 1,
      name: 'Alex Rivera',
      age: 26,
      location: 'Downtown, New Jersey',
      bio: 'Artist & activist. Love hiking, coffee, and meaningful conversations. Looking for genuine connections. 🏳️‍🌈✨',
      images: [
        'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=800&h=1200&dpr=2',
        'https://images.pexels.com/photos/1559486/pexels-photo-1559486.jpeg?auto=compress&cs=tinysrgb&w=800&h=1200&dpr=2',
        'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=800&h=1200&dpr=2'
      ],
      interests: [
        {
          id: '1',
          user_id: '1',
          interest_item_id: '175',
          interest_item: {
            id: '175',
            interest_id: 'hobbies',
            name: { en: 'Art', tr: 'Sanat' },
            emoji: '🎨',
            interest: {
              id: 'hobbies',
              name: { en: 'Hobbies', tr: 'Hobiler' }
            }
          }
        },
        {
          id: '2',
          user_id: '1',
          interest_item_id: '221',
          interest_item: {
            id: '221',
            interest_id: 'outdoor',
            name: { en: 'Hiking', tr: 'Doğa Yürüyüşü' },
            emoji: '🥾',
            interest: {
              id: 'outdoor',
              name: { en: 'Outdoor', tr: 'Açık Hava' }
            }
          }
        },
        {
          id: '3',
          user_id: '1',
          interest_item_id: '247',
          interest_item: {
            id: '247',
            interest_id: 'hobbies',
            name: { en: 'Photography', tr: 'Fotoğrafçılık' },
            emoji: '📸',
            interest: {
              id: 'hobbies',
              name: { en: 'Hobbies', tr: 'Hobiler' }
            }
          }
        }
      ],
      occupation: 'Graphic Designer',
      education: 'Art Institute',
      distance: '2 km away',
      verified: true,
      lastActive: '5 min ago',
      user_attributes: [
        {
          id: 'attr1',
          user_id: '1',
          category_type: 'height',
          attribute_id: 'height_178',
          attribute: {
            id: 'height_178',
            category: 'height',
            display_order: 1,
            name: { en: '178 cm', tr: '178 cm' }
          }
        },
        {
          id: 'attr2',
          user_id: '1',
          category_type: 'weight',
          attribute_id: 'weight_75',
          attribute: {
            id: 'weight_75',
            category: 'weight',
            display_order: 1,
            name: { en: '75 kg', tr: '75 kg' }
          }
        },
        {
          id: 'attr3',
          user_id: '1',
          category_type: 'body_type',
          attribute_id: 'body_athletic',
          attribute: {
            id: 'body_athletic',
            category: 'body_type',
            display_order: 1,
            name: { en: 'Athletic', tr: 'Atletik' }
          }
        },
        {
          id: 'attr4',
          user_id: '1',
          category_type: 'hair_color',
          attribute_id: 'hair_dark_brown',
          attribute: {
            id: 'hair_dark_brown',
            category: 'hair_color',
            display_order: 1,
            name: { en: 'Dark Brown', tr: 'Koyu Kahverengi' }
          }
        },
        {
          id: 'attr5',
          user_id: '1',
          category_type: 'eye_color',
          attribute_id: 'eye_hazel',
          attribute: {
            id: 'eye_hazel',
            category: 'eye_color',
            display_order: 1,
            name: { en: 'Hazel', tr: 'Ela' }
          }
        },
        {
          id: 'attr6',
          user_id: '1',
          category_type: 'zodiac_sign',
          attribute_id: 'zodiac_leo',
          attribute: {
            id: 'zodiac_leo',
            category: 'zodiac_sign',
            display_order: 1,
            name: { en: 'Leo', tr: 'Aslan' }
          }
        },
        {
          id: 'attr7',
          user_id: '1',
          category_type: 'smoking',
          attribute_id: 'smoking_never',
          attribute: {
            id: 'smoking_never',
            category: 'smoking',
            display_order: 1,
            name: { en: 'Never', tr: 'Hiç' }
          }
        },
        {
          id: 'attr8',
          user_id: '1',
          category_type: 'drinking',
          attribute_id: 'drinking_socially',
          attribute: {
            id: 'drinking_socially',
            category: 'drinking',
            display_order: 1,
            name: { en: 'Socially', tr: 'Sosyal' }
          }
        }
      ],
      fantasies: [
        {
          id: '1',
          user_id: '1',
          fantasy_id: '1',
          fantasy: {
            id: '1',
            category: 'joy_or_tabu',
            translations: [{
              id: '1',
              fantasy_id: '1',
              language: 'en',
              label: 'Blowjob',
              description: 'Oral stimulation of the penis with the mouth'
            }]
          }
        },
        {
          id: '2',
          user_id: '1',
          fantasy_id: '2',
          fantasy: {
            id: '2',
            category: 'joy_or_tabu',
            translations: [{
              id: '2',
              fantasy_id: '2',
              language: 'en',
              label: 'Slow sex',
              description: 'Combining sex with mindfulness for deeper connection'
            }]
          }
        },
        {
          id: '3',
          user_id: '1',
          fantasy_id: '3',
          fantasy: {
            id: '3',
            category: 'amusement',
            translations: [{
              id: '3',
              fantasy_id: '3',
              language: 'en',
              label: 'Photography',
              description: 'Capturing erotic poses on camera'
            }]
          }
        },
        {
          id: '4',
          user_id: '1',
          fantasy_id: '4',
          fantasy: {
            id: '4',
            category: 'sexual_adventure',
            translations: [{
              id: '4',
              fantasy_id: '4',
              language: 'en',
              label: 'Outdoor',
              description: 'Open-air sexual adventures'
            }]
          }
        }
      ]
    },
    {
      id: 2,
      name: 'Jordan Kim',
      age: 24,
      location: 'Brooklyn, New York',
      bio: 'Software engineer by day, musician by night. Love indie music, good books, and exploring the city. 🎵📚',
      images: [
        'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=800&h=1200&dpr=2',
        'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=800&h=1200&dpr=2',
        'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=800&h=1200&dpr=2'
      ],
      interests: [
        {
          id: '7',
          user_id: '2',
          interest_item_id: '125',
          interest_item: {
            id: '125',
            interest_id: 'entertainment',
            name: { en: 'Music', tr: 'Müzik' },
            emoji: '🎵',
            interest: {
              id: 'entertainment',
              name: { en: 'Entertainment', tr: 'Eğlence' }
            }
          }
        },
        {
          id: '8',
          user_id: '2',
          interest_item_id: '136',
          interest_item: {
            id: '136',
            interest_id: 'entertainment',
            name: { en: 'Books', tr: 'Kitaplar' },
            emoji: '📚',
            interest: {
              id: 'entertainment',
              name: { en: 'Entertainment', tr: 'Eğlence' }
            }
          }
        }
      ],
      occupation: 'Software Engineer',
      education: 'MIT',
      distance: '5 km away',
      verified: true,
      lastActive: '2 min ago'
    },
    {
      id: 3,
      name: 'Sam Chen',
      age: 28,
      location: 'Manhattan, New York',
      bio: 'Yoga instructor and wellness coach. Passionate about mental health, sustainability, and creating safe spaces. 🧘‍♀️🌱',
      images: [
        'https://images.pexels.com/photos/1674752/pexels-photo-1674752.jpeg?auto=compress&cs=tinysrgb&w=800&h=1200&dpr=2',
        'https://images.pexels.com/photos/1102341/pexels-photo-1102341.jpeg?auto=compress&cs=tinysrgb&w=800&h=1200&dpr=2',
        'https://images.pexels.com/photos/3764119/pexels-photo-3764119.jpeg?auto=compress&cs=tinysrgb&w=800&h=1200&dpr=2'
      ],
      interests: [
        {
          id: '13',
          user_id: '3',
          interest_item_id: '228',
          interest_item: {
            id: '228',
            interest_id: 'fitness',
            name: { en: 'Yoga', tr: 'Yoga' },
            emoji: '🧘',
            interest: {
              id: 'fitness',
              name: { en: 'Fitness', tr: 'Fitness' }
            }
          }
        },
        {
          id: '14',
          user_id: '3',
          interest_item_id: '88',
          interest_item: {
            id: '88',
            interest_id: 'lifestyle',
            name: { en: 'Wellness', tr: 'Sağlık' },
            emoji: '🌿',
            interest: {
              id: 'lifestyle',
              name: { en: 'Lifestyle', tr: 'Yaşam Tarzı' }
            }
          }
        }
      ],
      occupation: 'Yoga Instructor',
      education: 'Wellness Institute',
      distance: '3 km away',
      verified: false,
      lastActive: '1 hour ago'
    }
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [matchPercentage] = useState(96);
  const [showInfo, setShowInfo] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'details' | 'interests' | 'fantasies'>('about');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
  const rotate = useTransform(x, [-200, 0, 200], [-25, 0, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const handleSwipe = () => {
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentImageIndex(0);
      setShowInfo(false);
    } else {
      setCurrentIndex(0);
      setCurrentImageIndex(0);
      setShowInfo(false);
    }
  };

  const handleDragEnd = (_event: any, info: PanInfo) => {
    const threshold = 150;
    if (info.offset.x > threshold) {
      handleSwipe();
    } else if (info.offset.x < -threshold) {
      handleSwipe();
    }
  };

  const currentProfile = profiles[currentIndex];

  const handleImageTap = (side: 'left' | 'right') => {
    if (side === 'left' && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    } else if (side === 'right' && currentImageIndex < currentProfile.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  return (
<Container>
<motion.div 
        className="w-full max-w-md mx-auto"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      >
        {/* Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className="flex items-center justify-center mb-3">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <Sparkles className={`w-7 h-7 mr-2 ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
            </motion.div>
            <h1 className={`text-4xl font-bold tracking-tight ${
              theme === 'dark' ? 'text-white' : 'text-black'
            }`}>
              Discover
            </h1>
          </div>
          <p className={`text-sm font-medium tracking-wide ${
            theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
          }`}>Find your perfect match</p>
        </motion.div>

        {/* Card Stack Container */}
        <div className="relative" style={{ height: 'calc(100vh - 280px)', maxHeight: '700px', minHeight: '500px' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentProfile.id}
              className="absolute inset-0"
              style={{ x, rotate, opacity }}
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              onDragEnd={handleDragEnd}
            >
              <div 
                ref={scrollContainerRef}
                className={`h-full rounded-[32px] overflow-y-auto overflow-x-hidden ${
                  theme === 'dark' 
                    ? 'bg-[#111111] shadow-2xl shadow-black/60' 
                    : 'bg-white shadow-2xl shadow-black/10 border border-gray-100'
                } scrollbar-hide`}
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                {/* Image Section */}
                <div className="relative h-[500px] flex-shrink-0">
                  {/* Image Container */}
                  <div className="relative h-full overflow-hidden rounded-t-[32px]">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={currentImageIndex}
                        src={currentProfile.images[currentImageIndex]}
                        alt={currentProfile.name}
                        className="w-full h-full object-cover"
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                      />
                    </AnimatePresence>
                    
                    {/* Image Navigation Buttons */}
                    <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
                      <motion.button
                        className={`pointer-events-auto w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-opacity ${
                          currentImageIndex === 0 
                            ? 'opacity-0' 
                            : 'opacity-100 bg-black/30 hover:bg-black/50'
                        }`}
                        onClick={() => handleImageTap('left')}
                        disabled={currentImageIndex === 0}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <ChevronLeft className="w-6 h-6 text-white" strokeWidth={3} />
                      </motion.button>
                      <motion.button
                        className={`pointer-events-auto w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-opacity ${
                          currentImageIndex === currentProfile.images.length - 1 
                            ? 'opacity-0' 
                            : 'opacity-100 bg-black/30 hover:bg-black/50'
                        }`}
                        onClick={() => handleImageTap('right')}
                        disabled={currentImageIndex === currentProfile.images.length - 1}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <ChevronRight className="w-6 h-6 text-white" strokeWidth={3} />
                      </motion.button>
                    </div>

                    {/* Gradient Overlays */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent pointer-events-none" />
                    <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />
                    
                    {/* Image Indicators */}
                    <div className="absolute top-6 left-6 right-6 flex gap-2">
                      {currentProfile.images.map((_, index) => (
                        <motion.div
                          key={index}
                          className={`h-[3px] flex-1 rounded-full transition-all duration-500 ${
                            index === currentImageIndex
                              ? 'bg-white'
                              : 'bg-white/25'
                          }`}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ delay: index * 0.1 }}
                        />
                      ))}
                    </div>

                    {/* Top Right Actions */}
                    <div className="absolute top-6 right-6 flex gap-2">
                      {/* Photo Count */}
                      <motion.div 
                        className="backdrop-blur-xl bg-black/50 rounded-full px-3.5 py-2 flex items-center gap-2 border border-white/10"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 15 }}
                      >
                        <Camera className="w-4 h-4 text-white" />
                        <span className="text-xs font-semibold text-white tracking-wide">
                          {currentImageIndex + 1}/{currentProfile.images.length}
                        </span>
                      </motion.div>

                      {/* Match Percentage */}
                      <motion.div 
                        className={`backdrop-blur-xl rounded-full px-4 py-2 border ${
                          theme === 'dark'
                            ? 'bg-white text-black border-white/20'
                            : 'bg-black text-white border-black/20'
                        }`}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.4, type: "spring", stiffness: 200, damping: 15 }}
                      >
                        <span className="text-xs font-bold tracking-wider">
                          {matchPercentage}% MATCH
                        </span>
                      </motion.div>
                    </div>

                    {/* Profile Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-8">
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h2 className="text-4xl font-bold text-white tracking-tight">
                                {currentProfile.name}
                              </h2>
                              <span className="text-4xl font-light text-white/95">
                                {currentProfile.age}
                              </span>
                              {currentProfile.verified && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 12 }}
                                  className="backdrop-blur-xl bg-white/20 rounded-full p-1.5 border border-white/30"
                                >
                                  <Shield className="w-4 h-4 text-white" fill="currentColor" />
                                </motion.div>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mb-2">
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4 text-white/80" strokeWidth={2.5} />
                                <span className="text-sm font-medium text-white/90">{currentProfile.location}</span>
                              </div>
                              <span className="text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-xl bg-white/20 text-white border border-white/20">
                                {currentProfile.distance}
                              </span>
                            </div>
                            {currentProfile.lastActive && (
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-lg shadow-green-400/50" />
                                <span className="text-xs font-medium text-white/85 tracking-wide">
                                  Active {currentProfile.lastActive}
                                </span>
                              </div>
                            )}
                          </div>
                          <motion.button
                            className="backdrop-blur-xl bg-white/20 p-3.5 rounded-full border border-white/20"
                            whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.3)' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowInfo(!showInfo)}
                          >
                            <Info className="w-5 h-5 text-white" strokeWidth={2.5} />
                          </motion.button>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>

                {/* Profile Details Section - Scrollable */}
                <div className="p-6">
                  {/* Tabs Navigation */}
                  <div className={`flex gap-2 mb-6 pb-4 border-b overflow-x-auto scrollbar-hide ${
                    theme === 'dark' ? 'border-white/10' : 'border-gray-200'
                  }`}>
                    {[
                      { id: 'about' as const, label: 'About', count: null },
                      { id: 'details' as const, label: 'Attributes', count: currentProfile.user_attributes?.filter(ua => ua.attribute?.name).length || 0 },
                      { id: 'interests' as const, label: 'Interests', count: currentProfile.interests?.length || 0 },
                      { id: 'fantasies' as const, label: 'Fantasies', count: currentProfile.fantasies?.length || 0 }
                    ].map((tab) => (
                      <motion.button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                          activeTab === tab.id
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
                          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                            activeTab === tab.id
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
                          <div>
                            <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 ${
                              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                            }`}>Bio</h3>
                            <p className={`text-base leading-relaxed font-light ${
                              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            }`}>{currentProfile.bio}</p>
                          </div>

                          {/* Professional Info in About */}
                          <div>
                            <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 ${
                              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                            }`}>Professional</h3>
                            <div className="space-y-3">
                              {currentProfile.occupation && (
                                <div className={`flex items-center p-4 rounded-2xl border transition-all ${
                                  theme === 'dark' 
                                    ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                }`}>
                                  <div className={`p-2.5 rounded-xl mr-4 ${
                                    theme === 'dark' ? 'bg-white/10' : 'bg-white'
                                  }`}>
                                    <Briefcase className={`w-5 h-5 ${
                                      theme === 'dark' ? 'text-white' : 'text-black'
                                    }`} strokeWidth={2} />
                                  </div>
                                  <div>
                                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
                                      theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                    }`}>Occupation</p>
                                    <p className={`text-sm font-semibold ${
                                      theme === 'dark' ? 'text-white' : 'text-black'
                                    }`}>{currentProfile.occupation}</p>
                                  </div>
                                </div>
                              )}
                              {currentProfile.education && (
                                <div className={`flex items-center p-4 rounded-2xl border transition-all ${
                                  theme === 'dark' 
                                    ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                }`}>
                                  <div className={`p-2.5 rounded-xl mr-4 ${
                                    theme === 'dark' ? 'bg-white/10' : 'bg-white'
                                  }`}>
                                    <GraduationCap className={`w-5 h-5 ${
                                      theme === 'dark' ? 'text-white' : 'text-black'
                                    }`} strokeWidth={2} />
                                  </div>
                                  <div>
                                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
                                      theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                    }`}>Education</p>
                                    <p className={`text-sm font-semibold ${
                                      theme === 'dark' ? 'text-white' : 'text-black'
                                    }`}>{currentProfile.education}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Details Tab - Attributes */}
                      {activeTab === 'details' && (
                        <div className="space-y-6">
                          <div>
                            <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 ${
                              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                            }`}>Attributes</h3>
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
                                    className={`group flex items-center justify-between px-4 py-3 transition-all duration-200 ${
                                      !isLast ? `border-b ${theme === 'dark' ? 'border-white/[0.06]' : 'border-black/[0.04]'}` : ''
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
                    <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 ${
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                    }`}>Interests</h3>
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
                      <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 ${
                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                      }`}>Fantasies & Preferences</h3>
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
                    className="pt-6 pb-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                  >
                    <motion.button 
                      className={`w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-semibold text-base transition-all ${
                        theme === 'dark'
                          ? 'bg-white text-black hover:bg-gray-100'
                          : 'bg-black text-white hover:bg-gray-900'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <MessageCircle className="w-5 h-5" strokeWidth={2.5} />
                      <span>Send Message</span>
                    </motion.button>
                  </motion.div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Action Buttons */}
        <motion.div 
          className="flex justify-center items-center gap-5 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        >
          {/* Pass Button */}
          <motion.button
            className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all ${
              theme === 'dark'
                ? 'bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30'
                : 'bg-gray-50 border-gray-300 hover:bg-gray-100 hover:border-gray-400'
            }`}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => handleSwipe()}
          >
            <X className={`w-7 h-7 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} strokeWidth={2.5} />
          </motion.button>

          {/* Super Like Button */}
          <motion.button
            className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all ${
              theme === 'dark'
                ? 'bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30'
                : 'bg-gray-50 border-gray-300 hover:bg-gray-100 hover:border-gray-400'
            }`}
            whileHover={{ scale: 1.08, rotate: 180 }}
            whileTap={{ scale: 0.92 }}
          >
            <Star className={`w-6 h-6 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`} fill="currentColor" strokeWidth={2} />
          </motion.button>

          {/* Like Button */}
          <motion.button
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
              theme === 'dark'
                ? 'bg-white text-black hover:bg-gray-100'
                : 'bg-black text-white hover:bg-gray-900'
            }`}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => handleSwipe()}
          >
            <Heart className="w-7 h-7" fill="currentColor" strokeWidth={2} />
          </motion.button>
        </motion.div>
      </motion.div>
    </Container>
  );
};

export default MatchScreen;
