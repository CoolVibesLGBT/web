import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Heart, X, Star, MapPin, Briefcase, GraduationCap, MessageCircle, Camera, Shield, Sparkles, ChevronRight, Wine, Cigarette, Baby, PawPrint, Church, Eye, Paintbrush, Ruler, RulerDimensionLine, Palette, Users, Accessibility, PersonStanding, Drama, Vegan, HeartHandshake, Panda, Ghost, Frown, UserCircle, Rainbow, Smile, Banana, Link, Calendar } from 'lucide-react';
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

const MatchScreen: React.FC = () => {
  const { theme } = useTheme();
  const { defaultLanguage } = useApp();
  const { t } = useTranslation('common');
  const [profiles] = useState<Profile[]>([
    {
      id: 1,
      name: 'Alex Rivera',
      displayname: 'Alex Rivera',
      username: 'alexrivera',
      age: 26,
      location: 'Downtown, New Jersey',
      bio: 'Artist & activist. Love hiking, coffee, and meaningful conversations. Looking for genuine connections. 🏳️‍🌈✨',
      website: 'https://alexrivera.art',
      created_at: '2023-03-15T00:00:00Z',
      followers_count: 1250,
      following_count: 890,
      posts_count: 156,
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
      displayname: 'Jordan Kim',
      username: 'jordankim',
      age: 24,
      location: 'Brooklyn, New York',
      bio: 'Software engineer by day, musician by night. Love indie music, good books, and exploring the city. 🎵📚',
      website: 'https://jordankim.dev',
      created_at: '2023-06-20T00:00:00Z',
      followers_count: 890,
      following_count: 650,
      posts_count: 98,
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
      displayname: 'Sam Chen',
      username: 'samchen',
      age: 28,
      location: 'Manhattan, New York',
      bio: 'Yoga instructor and wellness coach. Passionate about mental health, sustainability, and creating safe spaces. 🧘‍♀️🌱',
      website: 'https://samchenwellness.com',
      created_at: '2023-01-10T00:00:00Z',
      followers_count: 2100,
      following_count: 1200,
      posts_count: 234,
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
    },
    {
      id: 4,
      name: 'Taylor Morgan',
      displayname: 'Taylor Morgan',
      username: 'taylormorgan',
      age: 25,
      location: 'San Francisco, California',
      bio: 'Photographer & travel enthusiast. Capturing moments around the world. Always seeking new adventures and connections. 📷🌍',
      website: 'https://taylormorgan.photo',
      created_at: '2023-08-12T00:00:00Z',
      followers_count: 3420,
      following_count: 2100,
      posts_count: 567,
      images: [
        'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=800&h=1200&dpr=2',
        'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=800&h=1200&dpr=2',
        'https://images.pexels.com/photos/1559486/pexels-photo-1559486.jpeg?auto=compress&cs=tinysrgb&w=800&h=1200&dpr=2'
      ],
      interests: [
        {
          id: '15',
          user_id: '4',
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
        },
        {
          id: '16',
          user_id: '4',
          interest_item_id: '221',
          interest_item: {
            id: '221',
            interest_id: 'outdoor',
            name: { en: 'Travel', tr: 'Seyahat' },
            emoji: '✈️',
            interest: {
              id: 'outdoor',
              name: { en: 'Outdoor', tr: 'Açık Hava' }
            }
          }
        }
      ],
      occupation: 'Photographer',
      education: 'Art School',
      distance: '8 km away',
      verified: true,
      lastActive: '30 min ago'
    },
    {
      id: 5,
      name: 'Riley Parker',
      displayname: 'Riley Parker',
      username: 'rileyparker',
      age: 27,
      location: 'Seattle, Washington',
      bio: 'Musician & coffee aficionado. Love indie rock, jazz, and late-night conversations. Looking for someone who shares my passion for music. 🎸☕',
      website: 'https://rileyparker.music',
      created_at: '2023-05-03T00:00:00Z',
      followers_count: 1890,
      following_count: 1200,
      posts_count: 312,
      images: [
        'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=800&h=1200&dpr=2',
        'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=800&h=1200&dpr=2',
        'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=800&h=1200&dpr=2'
      ],
      interests: [
        {
          id: '17',
          user_id: '5',
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
        }
      ],
      occupation: 'Musician',
      education: 'Music Conservatory',
      distance: '12 km away',
      verified: true,
      lastActive: '15 min ago'
    },
    {
      id: 6,
      name: 'Casey Blake',
      displayname: 'Casey Blake',
      username: 'caseyblake',
      age: 29,
      location: 'Austin, Texas',
      bio: 'Chef & food blogger. Passionate about cooking, sustainability, and bringing people together through food. 🍳🌱',
      website: 'https://caseyblake.food',
      created_at: '2023-02-18T00:00:00Z',
      followers_count: 4560,
      following_count: 2800,
      posts_count: 789,
      images: [
        'https://images.pexels.com/photos/1674752/pexels-photo-1674752.jpeg?auto=compress&cs=tinysrgb&w=800&h=1200&dpr=2',
        'https://images.pexels.com/photos/1102341/pexels-photo-1102341.jpeg?auto=compress&cs=tinysrgb&w=800&h=1200&dpr=2',
        'https://images.pexels.com/photos/3764119/pexels-photo-3764119.jpeg?auto=compress&cs=tinysrgb&w=800&h=1200&dpr=2'
      ],
      interests: [
        {
          id: '18',
          user_id: '6',
          interest_item_id: '88',
          interest_item: {
            id: '88',
            interest_id: 'lifestyle',
            name: { en: 'Cooking', tr: 'Yemek' },
            emoji: '🍳',
            interest: {
              id: 'lifestyle',
              name: { en: 'Lifestyle', tr: 'Yaşam Tarzı' }
            }
          }
        }
      ],
      occupation: 'Chef',
      education: 'Culinary Institute',
      distance: '15 km away',
      verified: true,
      lastActive: '5 min ago'
    }
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [matchPercentage] = useState(96);
  const [activeTab, setActiveTab] = useState<'about' | 'details' | 'interests' | 'fantasies'>('about');
  const [exitX, setExitX] = useState(0);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showMatchAnimation, setShowMatchAnimation] = useState(false);
  const [historyTab, setHistoryTab] = useState<'liked' | 'passed' | 'matches'>('matches');
  const [likedProfiles, setLikedProfiles] = useState<Profile[]>([]);
  const [passedProfiles, setPassedProfiles] = useState<Profile[]>([]);
  const [matchedProfiles, setMatchedProfiles] = useState<Profile[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);

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
  const rotate = useTransform(x, [-300, 0, 300], [-20, 0, 20]);

  // Smooth spring animation for x - Tinder-quality smooth animations
  const springConfig = { damping: 30, stiffness: 350 };
  const springX = useSpring(x, springConfig);
  const springRotate = useSpring(rotate, springConfig);

  const handleSwipe = (direction: 'left' | 'right' = 'right') => {
    const targetX = direction === 'right' ? 600 : -600;
    const currentProfile = profiles[currentIndex];

    // Profili history'ye ekle
    if (direction === 'right') {
      // Like edildi
      if (!likedProfiles.find(p => p.id === currentProfile.id)) {
        setLikedProfiles([...likedProfiles, currentProfile]);
        // Rastgele match kontrolü (örnek: %30 şans)
        if (Math.random() < 0.3 && !matchedProfiles.find(p => p.id === currentProfile.id)) {
          setMatchedProfiles([...matchedProfiles, currentProfile]);
          setShowMatchAnimation(true);
          setTimeout(() => {
            setShowMatchAnimation(false);
          }, 2000);
        }
      }
    } else {
      // Pass edildi
      if (!passedProfiles.find(p => p.id === currentProfile.id)) {
        setPassedProfiles([...passedProfiles, currentProfile]);
      }
    }

    // Set exitX for exit animation (sola: -600, sağa: 600) - daha zarif mesafe
    setExitX(targetX);

    // Wait for exit animation to trigger before changing key
    // AnimatePresence will handle the smooth exit, then show the new card
    setTimeout(() => {
      if (currentIndex < profiles.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setCurrentIndex(0);
      }
      setCurrentImageIndex(0);
    }, 50); // Hızlı geçiş için delay azaltıldı
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

  // Reset position when profile changes
  useEffect(() => {
    x.set(0);
    y.set(0);
    setCurrentImageIndex(0);
    setShowBottomSheet(false);
    setExitX(0);
    setActiveTab('about');
  }, [currentIndex]);

  // Format join date
  const formatJoinDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const locale = defaultLanguage === 'tr' ? 'tr-TR' : 'en-US';
    return `${t('profile.joined') || 'Joined'} ${date.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}`;
  };

  return (
    <Container>
      <div className='grid sm:grid-cols-2 grid-cols-1 gap-2'>
        <div className='w-full'>
      <AnimatePresence>
        {showMatchAnimation && (
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
                  IT'S A MATCH!
                </motion.h1>
                <motion.p
                  className="text-xl sm:text-2xl text-white/90 text-center mt-4"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  You and {currentProfile.name} liked each other
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
                          {matchPercentage}% MATCH
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
                                Active {currentProfile.lastActive}
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
                        <span className="text-[11px] sm:text-xs font-semibold text-white tracking-tight">Profile</span>
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
                                { id: 'about' as const, label: 'About', count: null },
                                { id: 'details' as const, label: 'Attributes', count: currentProfile.user_attributes?.filter(ua => ua.attribute?.name).length || 0 },
                                { id: 'interests' as const, label: 'Interests', count: currentProfile.interests?.length || 0 },
                                { id: 'fantasies' as const, label: 'Fantasies', count: currentProfile.fantasies?.length || 0 }
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
                                        }`}>Profile</h3>
                                      <div className="space-y-3">
                                        {currentProfile.displayname && (
                                          <div className={`flex items-center p-4 rounded-2xl border transition-all ${theme === 'dark'
                                              ? 'bg-white/5 border-white/10 hover:bg-white/10'
                                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                            }`}>
                                            <div className="flex-1">
                                              <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                                }`}>Display Name</p>
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
                                                }`}>Username</p>
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
                                        }`}>Bio</h3>
                                      <p className={`text-base leading-relaxed font-light ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                        }`}>{currentProfile.bio}</p>
                                    </div>

                                    {/* Meta Info */}
                                    {(currentProfile.website || currentProfile.created_at) && (
                                      <div>
                                        <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                          }`}>Information</h3>
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
                                                  }`}>Website</p>
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
                                                  }`}>Joined</p>
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
                                          }`}>Stats</h3>
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
                                          }`}>Professional</h3>
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
                                                  }`}>Occupation</p>
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
                                                  }`}>Education</p>
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
                                    <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
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
                                    <span>Send Message</span>
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
            { id: 'matches' as const, label: 'My Matches', icon: Sparkles, count: matchedProfiles.length },
            { id: 'liked' as const, label: 'Liked', icon: Heart, count: likedProfiles.length },
            { id: 'passed' as const, label: 'Passed', icon: Ghost, count: passedProfiles.length }
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
                  {matchedProfiles.length === 0 ? (
                    <div className={`text-center py-12 rounded-2xl ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'
                      }`}>
                      <Sparkles className={`w-12 h-12 mx-auto mb-3 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                        }`} />
                      <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                        No matches yet
                      </p>
                    </div>
                  ) : (
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
                  )}
                </div>
              )}

              {/* Liked Profiles */}
              {historyTab === 'liked' && (
                <div className="space-y-4">
                  {likedProfiles.length === 0 ? (
                    <div className={`text-center py-12 rounded-2xl ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'
                      }`}>
                      <Heart className={`w-12 h-12 mx-auto mb-3 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                        }`} />
                      <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                        No profiles liked yet
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {likedProfiles.map((profile) => (
                        <motion.div
                          key={profile.id}
                          className="relative rounded-2xl overflow-hidden aspect-[3/4] cursor-pointer group"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
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
                  )}
                </div>
              )}

              {/* Passed Profiles */}
              {historyTab === 'passed' && (
                <div className="space-y-4">
                  {passedProfiles.length === 0 ? (
                    <div className={`text-center py-12 rounded-2xl ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'
                      }`}>
                      <Ghost className={`w-12 h-12 mx-auto mb-3 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                        }`} />
                      <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                        No profiles passed yet
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {passedProfiles.map((profile) => (
                        <motion.div
                          key={profile.id}
                          className="relative rounded-2xl overflow-hidden aspect-[3/4] cursor-pointer group opacity-60"
                          whileHover={{ scale: 1.02, opacity: 0.8 }}
                          whileTap={{ scale: 0.98 }}
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
