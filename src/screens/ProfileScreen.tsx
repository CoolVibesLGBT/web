import AnimatedEmptyState from '@/components/ui/AnimatedEmptyState';
import ViewTabs from '@/components/ui/ViewTabs';
import { GroupedSection, ListRow, Sheet } from '@/components/ui/Interface';
import TelegramIcon from '@/features/chat/TelegramIcon';
import { Calendar as CalendarOutline, MapPin as MapPinOutline, Wallet as WalletOutline, MessageCircle as MessageCircleOutline } from 'lucide-react';
import PhotoAlbum from '@/features/profile/PhotoAlbum';
import FriendsPanel from '@/features/profile/FriendsPanel';
import PreferenceSection, { resolveCatalogSelection, type ProfilePreferenceSelection } from '@/features/profile/PreferenceSection';
import ProfileSocialTools from '@/features/profile/ProfileSocialTools';
import ProfileHeader from '@/features/profile/ProfileHeader';
import React, { useState, useEffect, useRef, type CSSProperties } from 'react';
import { useSEO } from '../hooks/useSEO';
import { useParams, useNavigate, useLocation } from '@/router';
import type { TravelData } from '../interfaces/user';
import { Heart, Baby, Cigarette, Wine, Ruler, PawPrint, Church, GraduationCap, Eye, EyeOff, Lock, Palette, Accessibility, Paintbrush, RulerDimensionLine, Vegan, PersonStanding, Sparkles, Drama, Banana, Save, Camera, Image as ImageIcon, ChevronRight, Check, HeartHandshake, Panda, Ghost, Rainbow, Transgender, Rabbit, ChevronLeft, ChevronDown, LocateFixed, UserCircle, Clock, Smile, HeartPulse, Bubbles, Leaf, Fingerprint, Users, UserPlus, ThumbsUp, ThumbsDown, Shield, type IllustratedIconComponent } from '@/components/ui/illustratedIcons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useApp, type InitialData } from '../contexts/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import Post from '../features/post/Post';
import Media from '../features/media/Media';
import { api } from '../services/api';
import { useTranslation } from 'react-i18next';
import AuthWizard from '../features/auth/AuthWizard';
import { getSafeImageURL, getSafeImageURLEx, htmlToPlainText, serializeJsonLd } from '../helpers/helpers';
import { SITE_URL } from '@/seo/seoConfig';
import IllustratedIcon from '@/components/ui/IllustratedIcon';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import { useDwellView } from '@/hooks/useDwellView';
import { ProfileBioEditor, ProfileBioPreview } from './ProfileBio';

// User interface
type UserLocation =
  | string
  | {
    id?: string;
    contentable_id?: string;
    contentable_type?: string;
    country_code?: string;
    address?: string;
    city?: string;
    country?: string;
    region?: string;
    timezone?: string;
    display?: string;
    latitude?: number | null;
    longitude?: number | null;
    location_point?: {
      lat?: number;
      lng?: number;
    };
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
  }
  | null
  | undefined;

interface UserEngagementCounts {
  follower_count?: number;
  following_count?: number;
  blocking_count?: number;
  blocked_by_count?: number;
  like_given_count?: number;
  like_received_count?: number;
  dislike_given_count?: number;
  dislike_received_count?: number;
  match_count?: number;
  view_received_count?: number;
}

interface UserEngagementDetail {
  id?: string;
  engagement_id?: string;
  engager_id?: string;
  engager?: {
    id?: string;
    public_id?: string | number;
  };
  recipient_id?: string;
  engagee_id?: string;
  kind?: string;
  details?: Record<string, unknown>;
  recipient?: {
    id?: string;
    public_id?: string | number;
  };
  engagee?: {
    id?: string;
    public_id?: string | number;
  };
  created_at?: string;
}

interface UserEngagements {
  counts?: UserEngagementCounts;
  engagement_details?: UserEngagementDetail[];
}

interface ProfileUser {
  id: string;
  public_id: number;
  username: string;
  displayname: string;
  email: string;
  date_of_birth: string;
  gender: string;
  gender_identity?: { id: string; key?: string; name?: Record<string, string> };
  gender_identities?: Array<{ id: string; key?: string; name?: Record<string, string> }>;
  sexual_orientation?: {
    id: string;
    key: string;
    order: number;
    name?: Record<string, string>;
  };
  sexual_orientations?: Array<{ id: string; key?: string; name?: Record<string, string> }>;
  sex_role?: string;
  sexual_role?: { id: string; key?: string; name?: Record<string, string> };
  sexual_identities?: {
    gender_identities?: Array<{ id: string; key?: string; name?: Record<string, string> }>;
    sexual_orientations?: Array<{ id: string; key?: string; name?: Record<string, string> }>;
    sex_role?: { id: string; key?: string; name?: Record<string, string> };
  };
  relationship_status: string;
  user_role: string;
  is_active: boolean;
  is_premium?: boolean;
  is_verified?: boolean;
  preferences_flags?: string;
  selected_preference_bits?: number[];
  created_at: string;
  updated_at: string;
  default_language: string;
  languages: string[] | null;
  languages_display?: string;
  fantasies?: Array<{
    id: string;
    user_id: string;
    fantasy_id: string;
    notes?: string;
    fantasy?: {
      id: string;
      slug: string;
      category: Record<string, string>;
      label: Record<string, string>;
      description: Record<string, string>;
    };
  }>;
  interests?: Array<{
    id: string;
    user_id: string;
    interest_item_id: string;
    interest_item?: {
      id: string;
      interest_id: string;
      name: Record<string, string>;
      bit_index?: number;
      emoji?: string;
      interest?: {
        id: string;
        name: Record<string, string>;
      };
    };
  }>;
  height_cm?: number;
  weight_kg?: number;
  hair_color?: string;
  eye_color?: string;
  body_type?: string;
  skin_color?: string;
  ethnicity?: string;
  zodiac_sign?: string;
  physical_disability?: string;
  circumcision?: string;
  kids?: string;
  smoking?: string;
  drinking?: string;
  star_sign?: string;
  pets?: string;
  religion?: string;
  personality?: string;
  education_level?: string;
  travel?: TravelData;
  social?: unknown;
  deleted_at: string | null;
  bio?: string;
  location?: UserLocation;
  website?: string;
  profile_image_url?: string;
  cover_image_url?: string;
  followers_count?: number;
  following_count?: number;
  blocking_count?: number;
  blocked_by_count?: number;
  like_given_count?: number;
  like_received_count?: number;
  dislike_given_count?: number;
  dislike_received_count?: number;
  match_count?: number;
  view_received_count?: number;
  posts_count?: number;
  medias_count?: number;
  likes_count?: number;
  profile_views_count?: number;
  is_following?: boolean;
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
  engagements?: UserEngagements;
  privacy_level?: PrivacyLevel;
  avatar?: { file?: { url?: string } } | null;
  cover_image?: { file?: { url?: string } } | null;
  cover?: { file?: { url?: string } } | null;
  [key: string]: unknown;
}

type ProfileEngagementItem = {
  id: string;
  label: string;
  value: number;
  icon: IllustratedIconComponent;
  onClick: () => void;
  visible: boolean;
  disabled?: boolean;
  requiresPremium?: boolean;
};

interface ApiResponse {
  user?: ProfileUser;
  target_user?: ProfileUser;
  followee?: ProfileUser;
  posts?: unknown[];
  medias?: unknown[];
  success?: boolean;
  message?: string;
  [key: string]: unknown;
}



const profileFeedItemRenderStyle: CSSProperties = {
  contentVisibility: 'auto',
  contain: 'layout paint style',
  containIntrinsicSize: '1px 640px',
};

type ProfileWizardStepId =
  | 'avatar'
  | 'cover'
  | 'bio'
  | 'location'
  | 'birthdate'
  | 'attributes'
  | 'interests'
  | 'fantasies';

const getHasFollowingRelationship = (sourceUserData: unknown, targetUser: ProfileUser | null): boolean => {
  if (!sourceUserData || !targetUser) {
    return false;
  }

  const engagementDetails = (sourceUserData as { engagements?: { engagement_details?: UserEngagementDetail[] } })?.engagements?.engagement_details;
  if (!Array.isArray(engagementDetails)) {
    return false;
  }

  const targetPublicId = targetUser.public_id != null ? String(targetUser.public_id) : null;
  const targetId = targetUser.id != null ? String(targetUser.id) : null;

  return engagementDetails.some((detail) => {
    if (!detail || detail.kind !== 'following') {
      return false;
    }

    const candidatePublicIds = [
      detail.recipient?.public_id,
      detail.recipient_id,
      detail.engagee?.public_id,
      detail.engagee_id,
    ].filter(Boolean) as Array<string | number>;

    if (targetPublicId && candidatePublicIds.some((id) => String(id) === targetPublicId)) {
      return true;
    }

    const candidateIds = [
      detail.recipient?.id,
      detail.recipient_id,
      detail.engagee?.id,
      detail.engagee_id,
    ].filter(Boolean) as Array<string | number>;

    return !!targetId && candidateIds.some((id) => String(id) === targetId);
  });
};

const isObjectRecord = (value: unknown): value is Record<string, any> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const resolveImageAttachmentUrl = (attachment: unknown, variants: string[]): string | null => {
  if (typeof attachment === 'string' && attachment.trim()) {
    return attachment.trim();
  }

  if (!isObjectRecord(attachment)) {
    return null;
  }

  for (const variant of variants) {
    const safeUrl = getSafeImageURL(attachment, variant);
    if (safeUrl) {
      return safeUrl;
    }
  }

  const directUrl = attachment.file?.url || attachment.url;
  return typeof directUrl === 'string' && directUrl.trim() ? directUrl.trim() : null;
};

const getProfileAvatarUrl = (profile: Partial<ProfileUser> | null | undefined): string | null => {
  if (!profile) {
    return null;
  }

  return (
    resolveImageAttachmentUrl(profile.avatar, ['icon', 'thumbnail', 'small', 'medium', 'large', 'original']) ||
    (typeof profile.profile_image_url === 'string' && profile.profile_image_url.trim() ? profile.profile_image_url.trim() : null) ||
    getSafeImageURLEx(profile.public_id, profile.avatar, 'icon')
  );
};

const getProfileCoverUrl = (profile: Partial<ProfileUser> | null | undefined): string | null => {
  if (!profile) {
    return null;
  }

  return (
    resolveImageAttachmentUrl(profile.cover, ['large', 'medium', 'original', 'small']) ||
    resolveImageAttachmentUrl(profile.cover_image, ['large', 'medium', 'original', 'small']) ||
    (typeof profile.cover_image_url === 'string' && profile.cover_image_url.trim() ? profile.cover_image_url.trim() : null)
  );
};

const isProfileUserPayload = (value: unknown): value is Partial<ProfileUser> => {
  if (!isObjectRecord(value)) {
    return false;
  }

  return Boolean(value.id || value.public_id || value.username || value.displayname);
};

const extractUserFromUploadResponse = (response: unknown): Partial<ProfileUser> | null => {
  if (!isObjectRecord(response)) {
    return null;
  }

  const candidates = [
    response.user,
    response.profile,
    response.current_user,
    response.auth_user,
    response.data?.user,
    response.data?.profile,
    response.data?.current_user,
  ];

  const userCandidate = candidates.find(isProfileUserPayload);
  if (userCandidate) {
    return userCandidate;
  }

  return isProfileUserPayload(response) ? response : null;
};

const extractUploadAttachment = (response: unknown, kind: 'avatar' | 'cover'): unknown => {
  if (!isObjectRecord(response)) {
    return null;
  }

  const keys = kind === 'avatar'
    ? ['avatar', 'profile_image', 'profileImage', 'media', 'file', 'image']
    : ['cover', 'cover_image', 'coverImage', 'media', 'file', 'image'];

  const roots = [response, response.data, response.user, response.profile].filter(isObjectRecord);
  for (const root of roots) {
    for (const key of keys) {
      if (root[key]) {
        return root[key];
      }
    }
  }

  return null;
};

const normalizeProfileUser = (rawUser: unknown): ProfileUser | null => {
  if (!rawUser) {
    return null;
  }

  const userObj = rawUser as Partial<ProfileUser> & {
    cover?: { file?: { url?: string } };
    avatar?: { file?: { url?: string } };
  };

  const followerCount =
    userObj.engagements?.counts?.follower_count ??
    userObj.followers_count ??
    0;

  const followingCount =
    userObj.engagements?.counts?.following_count ??
    userObj.following_count ??
    0;

  return {
    ...(userObj as ProfileUser),
    profile_image_url: getProfileAvatarUrl(userObj) ?? undefined,
    cover_image_url: getProfileCoverUrl(userObj) ?? undefined,
    followers_count: followerCount,
    following_count: followingCount,
    engagements: {
      ...(userObj.engagements || {}),
      counts: {
        ...(userObj.engagements?.counts || {}),
        follower_count: followerCount,
        following_count: followingCount,
      },
    },
  };
};

const withFollowerCount = (profile: ProfileUser, count: number): ProfileUser => {
  const nextFollowers = Math.max(0, count);

  return {
    ...profile,
    followers_count: nextFollowers,
    engagements: {
      ...(profile.engagements || {}),
      counts: {
        ...(profile.engagements?.counts || {}),
        follower_count: nextFollowers,
      },
    },
  };
};

// Post interface (simplified for profile)
interface ProfilePost {
  id: string;
  public_id: number;
  author_id: string;
  type: string;
  content: {
    en: string;
  };
  published: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  author: ProfileUser;
  attachments: Array<{
    id: string;
    file_id: string;
    owner_id: string;
    owner_type: string;
    role: string;
    is_public: boolean;
    file: {
      id: string;
      url: string;
      storage_path: string;
      mime_type: string;
      size: number;
      name: string;
      created_at: string;
    };
    created_at: string;
    updated_at: string;
  }>;
}

// Media interface
interface Media {
  id: string;
  public_id: number;
  file_id: string;
  owner_id: string;
  owner_type: string;
  user_id: string;
  role: string;
  is_public: boolean;
  file: {
    id: string;
    storage_path: string;
    mime_type: string;
    size: number;
    name: string;
    created_at: string;
    url: string;
    variants?: {
      image?: {
        icon?: { url: string; width: number; height: number; format: string; size: number };
        thumbnail?: { url: string; width: number; height: number; format: string; size: number };
        small?: { url: string; width: number; height: number; format: string; size: number };
        medium?: { url: string; width: number; height: number; format: string; size: number };
        large?: { url: string; width: number; height: number; format: string; size: number };
        original?: { url: string; width: number; height: number; format: string; size: number };
      };
      video?: {
        preview?: { url: string };
      };
    };
  };
  created_at: string;
  updated_at: string;
  user: ProfileUser;
}

enum PrivacyLevel {
  Public = "public",
  FriendsOnly = "friends_only",
  FollowersOnly = "followers_only",
  MutualsOnly = "mutuals_only",
  Private = "private",
}

interface BirthdatePickerProps {
  value?: string;
  onChange: (value?: string) => void;
  theme: string;
  t: (key: string, options?: Record<string, unknown>) => string;
}

interface LocationPickerProps {
  value?: UserLocation | string | null;
  onChange: (value?: UserLocation | string | null) => void;
  theme: string;
  t: (key: string, options?: Record<string, unknown>) => string;
}

const BirthdatePicker: React.FC<BirthdatePickerProps> = ({ value, onChange, theme, t }) => {
  const today = React.useMemo(() => new Date(), []);
  const minYear = today.getFullYear() - 80;
  const maxYear = today.getFullYear() - 18;

  const parseDate = React.useCallback(() => {
    if (!value) {
      return { day: 0, month: 0, year: 0 };
    }
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) {
      return { day: 0, month: 0, year: 0 };
    }
    return { day, month, year };
  }, [value]);

  const initialParsed = parseDate();
  const defaultYear = React.useMemo(() => {
    if (initialParsed.year) return initialParsed.year;
    return Math.min(Math.max(today.getFullYear() - 25, minYear), maxYear);
  }, [initialParsed.year, maxYear, minYear, today]);

  const months = React.useMemo(
    () => [
      t('months.january'),
      t('months.february'),
      t('months.march'),
      t('months.april'),
      t('months.may'),
      t('months.june'),
      t('months.july'),
      t('months.august'),
      t('months.september'),
      t('months.october'),
      t('months.november'),
      t('months.december'),
    ],
    [t]
  );

  const [selectedDate, setSelectedDate] = React.useState(initialParsed);
  const [viewMode, setViewMode] = React.useState<'day' | 'month' | 'year'>('day');
  const [currentYear, setCurrentYear] = React.useState(() =>
    Math.min(Math.max(initialParsed.year || defaultYear, minYear), maxYear)
  );
  const [currentMonth, setCurrentMonth] = React.useState(() =>
    initialParsed.month ? initialParsed.month - 1 : today.getMonth()
  );
  const [decadeStart, setDecadeStart] = React.useState(() =>
    Math.floor((initialParsed.year || defaultYear) / 20) * 20
  );

  React.useEffect(() => {
    const parsed = parseDate();
    setSelectedDate(parsed);
    if (parsed.year) {
      setCurrentYear(Math.min(Math.max(parsed.year, minYear), maxYear));
      setCurrentMonth(parsed.month ? parsed.month - 1 : 0);
      setDecadeStart(Math.floor(parsed.year / 20) * 20);
    }
  }, [parseDate, minYear, maxYear]);

  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const canGoPrevMonth =
    currentYear > minYear || (currentYear === minYear && currentMonth > 0);
  const canGoNextMonth =
    currentYear < maxYear || (currentYear === maxYear && currentMonth < 11);

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (!canGoPrevMonth) return;
      if (currentMonth === 0) {
        setCurrentYear((year) => Math.max(year - 1, minYear));
        setCurrentMonth(11);
      } else {
        setCurrentMonth((month) => month - 1);
      }
    } else {
      if (!canGoNextMonth) return;
      if (currentMonth === 11) {
        setCurrentYear((year) => Math.min(year + 1, maxYear));
        setCurrentMonth(0);
      } else {
        setCurrentMonth((month) => month + 1);
      }
    }
  };

  const formatDate = (day: number, month: number, year: number) => {
    const safeMonth = String(month).padStart(2, '0');
    const safeDay = String(day).padStart(2, '0');
    return `${year}-${safeMonth}-${safeDay}`;
  };

  const handleDateSelect = (day: number) => {
    const next = { day, month: currentMonth + 1, year: currentYear };
    setSelectedDate(next);
    onChange(formatDate(next.day, next.month, next.year));
  };

  const handleYearSelect = (year: number) => {
    setCurrentYear(year);
    setViewMode('month');
  };

  const handleMonthSelect = (monthIndex: number) => {
    setCurrentMonth(monthIndex);
    setViewMode('day');
  };

  const handleClear = () => {
    setSelectedDate({ day: 0, month: 0, year: 0 });
    onChange(undefined);
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days: React.ReactNode[] = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-10 h-10" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected =
        selectedDate.day === day &&
        selectedDate.month === currentMonth + 1 &&
        selectedDate.year === currentYear;

      const formatted = formatDate(day, currentMonth + 1, currentYear);
      const isDisabled =
        currentYear < minYear ||
        currentYear > maxYear ||
        formatted > formatDate(today.getDate(), today.getMonth() + 1, today.getFullYear());

      days.push(
        <motion.button
          key={day}
          type="button"
          disabled={isDisabled}
          onClick={() => handleDateSelect(day)}
          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${isSelected
            ? theme === 'dark'
              ? 'bg-white text-gray-900 ring-2 ring-black/50'
              : 'bg-gray-900 text-white ring-2 ring-black/50'
            : theme === 'dark'
              ? 'text-white hover:bg-gray-700'
              : 'text-gray-900 hover:bg-gray-200'
            } ${isDisabled ? 'opacity-40 cursor-not-allowed hover:bg-transparent' : ''}`}
          whileHover={!isDisabled ? { scale: 1.05 } : undefined}
          whileTap={!isDisabled ? { scale: 0.95 } : undefined}
        >
          {day}
        </motion.button>
      );
    }

    return days;
  };

  const decadeYears = React.useMemo(() => {
    const start = Math.max(Math.floor(decadeStart / 20) * 20, minYear);
    const years: (number | null)[] = [];
    for (let i = 0; i < 20; i += 1) {
      const year = start + i;
      if (year > maxYear) {
        years.push(null);
      } else {
        years.push(year);
      }
    }
    return years;
  }, [decadeStart, maxYear, minYear]);

  const dayNames = React.useMemo(
    () => ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
    []
  );

  return (
    <div className={`space-y-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">
          {selectedDate.day > 0 && selectedDate.month > 0 && selectedDate.year > 0
            ? `${selectedDate.day} ${months[selectedDate.month - 1]} ${selectedDate.year}`
            : t('profile.date_of_birth_placeholder', { defaultValue: 'Select your birthdate' })}
        </div>
        {selectedDate.day > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className={`text-xs font-semibold transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800'
              }`}
          >
            {t('profile.clear_date', { defaultValue: 'Clear' })}
          </button>
        )}
      </div>

      <div
        className={`rounded-2xl border p-4 ${theme === 'dark' ? 'cv-card-surface-solid border-white/10' : 'bg-white border-gray-200/50 shadow-sm'
          }`}
      >
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            className={`p-2 rounded-full transition-colors ${canGoPrevMonth
              ? theme === 'dark'
                ? 'hover:bg-gray-900/50 text-gray-300'
                : 'hover:bg-gray-100 text-gray-600'
              : 'opacity-30 cursor-not-allowed'
              }`}
            onClick={() => navigateMonth('prev')}
            disabled={!canGoPrevMonth}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="grid grid-cols-2 gap-2 flex-1 mx-2">
            <button
              type="button"
              className={`flex items-center justify-center gap-1 rounded-lg py-2 font-semibold transition-colors ${viewMode === 'month'
                ? theme === 'dark'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-indigo-100 text-indigo-900'
                : theme === 'dark'
                  ? 'bg-gray-900/50 text-white hover:bg-gray-900/70'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              onClick={() => setViewMode(viewMode === 'month' ? 'day' : 'month')}
            >
              {months[currentMonth]}
              <ChevronDown
                className={`w-4 h-4 transition-transform ${viewMode === 'month' ? 'rotate-180' : ''}`}
              />
            </button>
            <button
              type="button"
              className={`flex items-center justify-center gap-1 rounded-lg py-2 font-semibold transition-colors ${viewMode === 'year'
                ? theme === 'dark'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-indigo-100 text-indigo-900'
                : theme === 'dark'
                  ? 'bg-gray-900/50 text-white hover:bg-gray-900/70'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              onClick={() => setViewMode(viewMode === 'year' ? 'day' : 'year')}
            >
              {currentYear}
              <ChevronDown
                className={`w-4 h-4 transition-transform ${viewMode === 'year' ? 'rotate-180' : ''}`}
              />
            </button>
          </div>

          <button
            type="button"
            className={`p-2 rounded-full transition-colors ${canGoNextMonth
              ? theme === 'dark'
                ? 'hover:bg-gray-900/50 text-gray-300'
                : 'hover:bg-gray-100 text-gray-600'
              : 'opacity-30 cursor-not-allowed'
              }`}
            onClick={() => navigateMonth('next')}
            disabled={!canGoNextMonth}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {viewMode === 'year' && (
            <motion.div
              key="year-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="grid grid-cols-5 gap-2">
                {decadeYears.map((year, index) =>
                  year ? (
                    <button
                      key={year}
                      type="button"
                      onClick={() => handleYearSelect(year)}
                      className={`rounded-lg py-2 text-sm font-medium transition-colors ${currentYear === year
                        ? theme === 'dark'
                          ? 'bg-white text-gray-900'
                          : 'bg-gray-900 text-white'
                        : theme === 'dark'
                          ? 'text-white hover:bg-gray-900/50'
                          : 'text-gray-900 hover:bg-gray-200'
                        }`}
                    >
                      {year}
                    </button>
                  ) : (
                    <div key={`empty-${index}`} />
                  )
                )}
              </div>
              <div className="flex items-center justify-between mt-3">
                <button
                  type="button"
                  className={`text-xs font-semibold transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                    } ${decadeStart <= minYear ? 'opacity-30 cursor-not-allowed' : ''}`}
                  onClick={() => setDecadeStart((start) => Math.max(start - 20, minYear))}
                  disabled={decadeStart <= minYear}
                >
                  {t('profile.previous', { defaultValue: 'Previous' })}
                </button>
                <span className="text-xs text-gray-500">
                  {decadeStart} – {decadeStart + 19}
                </span>
                <button
                  type="button"
                  className={`text-xs font-semibold transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                    } ${decadeStart + 20 > maxYear ? 'opacity-30 cursor-not-allowed' : ''}`}
                  onClick={() => setDecadeStart((start) => Math.min(start + 20, maxYear - 19))}
                  disabled={decadeStart + 20 > maxYear}
                >
                  {t('profile.next', { defaultValue: 'Next' })}
                </button>
              </div>
            </motion.div>
          )}

          {viewMode === 'month' && (
            <motion.div
              key="month-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="grid grid-cols-3 gap-2">
                {months.map((month, index) => (
                  <button
                    key={month}
                    type="button"
                    onClick={() => handleMonthSelect(index)}
                    className={`rounded-lg py-2 text-sm font-medium transition-colors ${currentMonth === index
                      ? theme === 'dark'
                        ? 'bg-white text-gray-900'
                        : 'bg-gray-900 text-white'
                      : theme === 'dark'
                        ? 'text-white hover:bg-gray-900/50'
                        : 'text-gray-900 hover:bg-gray-200'
                      }`}
                  >
                    {month}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {viewMode === 'day' && (
            <motion.div
              key="day-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="grid grid-cols-7 gap-1 text-xs font-semibold mb-2 text-center text-gray-500">
                {dayNames.map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">{renderCalendarDays()}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

interface ProfileScreenProps {
  inline?: boolean;
  isEmbed?: boolean;
  username?: string;
}

const normalizeLocationTextValue = (value: string): string => {
  const normalized = value.trim();
  if (!normalized) {
    return '';
  }
  const lowered = normalized.toLowerCase();
  const invalidValues = new Set([
    '0',
    '00',
    '0,0',
    '0.0',
    '0.00',
    '0.000',
    '0.000,0.000',
    '0.000, 0.000',
    'unknown',
    'null',
    'undefined',
    'n/a',
    'na',
  ]);
  if (invalidValues.has(lowered)) {
    return '';
  }
  return normalized;
};

const getLocationDisplay = (location: UserLocation): string => {
  if (!location) {
    return '';
  }

  if (typeof location === 'string') {
    return normalizeLocationTextValue(location);
  }

  if (typeof location === 'object') {
    const locationObj = location as Record<string, unknown>;
    const locationPoint = (locationObj.location_point || null) as { lat?: unknown; lng?: unknown } | null;
    const coordinates = Array.isArray(locationObj.coordinates) ? locationObj.coordinates : [];
    const pickFiniteNumber = (...values: unknown[]): number | undefined => {
      for (const value of values) {
        if (typeof value === 'number' && Number.isFinite(value)) {
          return value;
        }
      }
      return undefined;
    };

    const directTextCandidates = [
      locationObj.display,
      locationObj.display_name,
      locationObj.formatted_address,
      locationObj.full_address,
      locationObj.address,
      locationObj.name,
      locationObj.label,
      locationObj.country_name,
    ];
    const firstDirectText = directTextCandidates.find(
      (candidate): candidate is string => typeof candidate === 'string' && candidate.trim().length > 0
    );
    if (firstDirectText) {
      return normalizeLocationTextValue(firstDirectText);
    }

    const countryValue =
      (typeof locationObj.country === 'string' && locationObj.country) ||
      (typeof locationObj.country_name === 'string' && locationObj.country_name) ||
      '';
    const parts = [location.city, countryValue].filter(
      (part): part is string => Boolean(part)
    );

    if (parts.length > 0) {
      return normalizeLocationTextValue(parts.join(', '));
    }

    if (location.region) {
      return normalizeLocationTextValue(location.region);
    }

    if (location.country_code) {
      return normalizeLocationTextValue(location.country_code);
    }

    const latitude = pickFiniteNumber(
      locationObj.latitude,
      locationObj.lat,
      locationPoint?.lat,
      coordinates[1]
    );
    const longitude = pickFiniteNumber(
      locationObj.longitude,
      locationObj.lng,
      locationPoint?.lng,
      coordinates[0]
    );

    if (typeof latitude === 'number' && typeof longitude === 'number') {
      if (Math.abs(latitude) < 0.000001 && Math.abs(longitude) < 0.000001) {
        return '';
      }
      return `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
    }
  }

  return '';
};

const LocationPicker: React.FC<LocationPickerProps> = ({ value, onChange, theme, t }) => {
  const [status, setStatus] = React.useState<string>('');
  const [isDetecting, setIsDetecting] = React.useState(false);
  const currentDisplay = React.useMemo(() => getLocationDisplay((value ?? null) as UserLocation), [value]);

  const getPositionWithTimeout = React.useCallback((options: PositionOptions, timeoutMs = 10000) => {
    return new Promise<GeolocationPosition>((resolve, reject) => {
      let settled = false;
      const timer = window.setTimeout(() => {
        if (!settled) {
          settled = true;
          reject(new Error('Location request timed out'));
        }
      }, timeoutMs);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!settled) {
            settled = true;
            window.clearTimeout(timer);
            resolve(pos);
          }
        },
        (error) => {
          if (!settled) {
            settled = true;
            window.clearTimeout(timer);
            reject(error);
          }
        },
        options
      );
    });
  }, []);

  const fetchIpFallback = React.useCallback(async () => {
    const providers = [
      'https://ipapi.co/json/',
      'https://ipinfo.io/json?token=17064ceadbe842',
    ];

    for (const url of providers) {
      try {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) {
          continue;
        }

        const data = await response.json();
        const locStr: string | undefined = data.loc || (data.latitude && data.longitude ? `${data.latitude},${data.longitude}` : undefined);
        const [latStr, lngStr] = (locStr || '').split(',');
        const latitude = parseFloat(data.latitude ?? latStr);
        const longitude = parseFloat(data.longitude ?? lngStr);

        if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
          return {
            country_code: (data.country_code || data.country || '').toString().toUpperCase(),
            country: (data.country_name || data.country || '').toString(),
            address: data.city || '',
            city: (data.city || '').toString(),
            region: (data.region || data.region_name || '').toString(),
            latitude,
            longitude,
            timezone: (data.timezone || '').toString(),
            display: data.city ? `${data.city}, ${data.country_name || data.country || ''}` : `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`,
          };
        }
      } catch (error) {
        console.warn('IP fallback failed:', error);
      }
    }

    throw new Error('IP geolocation failed');
  }, []);

  const saveLocation = React.useCallback((nextLocation?: UserLocation | string | null) => {
    onChange(nextLocation ?? null);
  }, [onChange]);

  const handleDetectLocation = React.useCallback(async () => {
    if (isDetecting) {
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    if (!navigator.geolocation) {
      setStatus(t('location.geo_api_unavailable', { defaultValue: 'Geolocation is not available in this browser.' }));
      return;
    }

    setIsDetecting(true);
    setStatus(t('location.requesting_permission', { defaultValue: 'Requesting location permission…' }));

    try {
      try {
        if ('permissions' in navigator && typeof (navigator as unknown as { permissions?: { query: (opts: { name: string }) => Promise<{ state: string }> } }).permissions?.query === 'function') {
          const permissionStatus = await (navigator as unknown as { permissions: { query: (opts: { name: string }) => Promise<{ state: string }> } }).permissions.query({ name: 'geolocation' });
          if (permissionStatus.state === 'denied') {
            setStatus(t('location.permission_denied', { defaultValue: 'Location permission denied. Update browser settings to enable.' }));
            setIsDetecting(false);
            return;
          }
        }
      } catch (error) {
        console.warn('Unable to query geolocation permission:', error);
      }

      setStatus(t('location.fetching_accurate', { defaultValue: 'Fetching accurate location…' }));
      const position = await getPositionWithTimeout({ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }, 12000);
      const { latitude, longitude } = position.coords;

      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
        const data = await response.json();
        const address = data.address || {};
        const detectedLocation: UserLocation = {
          country_code: address.country_code?.toUpperCase() || '',
          country: address.country || '',
          address: address.city || address.town || address.village || '',
          city: address.city || address.town || address.village || '',
          region: address.state || '',
          latitude,
          longitude,
          timezone: '',
          display: `${address.city || address.town || address.village || latitude.toFixed(3)}, ${address.country || ''}`,
        };

        saveLocation(detectedLocation);
        setStatus(t('location.detected', { defaultValue: 'Location detected successfully.' }));
      } catch (error) {
        console.warn('Reverse geocoding failed, falling back to coordinates.', error);
        const fallbackLocation: UserLocation = {
          latitude,
          longitude,
          display: `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`,
        };
        saveLocation(fallbackLocation);
        setStatus(t('location.detected_no_address', { defaultValue: 'Coordinates detected, but address lookup failed.' }));
      }
    } catch (geoError) {
      console.warn('Geolocation failed, attempting IP fallback.', geoError);
      setStatus(t('location.trying_ip', { defaultValue: 'Trying approximate location via IP…' }));
      try {
        const ipLocation = await fetchIpFallback();
        saveLocation(ipLocation as UserLocation);
        setStatus(t('location.approximate_detected', { defaultValue: 'Approximate location detected.' }));
      } catch (ipError) {
        console.error('IP location failed:', ipError);
        setStatus(t('location.failed', { defaultValue: 'Unable to detect location. Please try again later.' }));
      }
    } finally {
      setIsDetecting(false);
    }
  }, [fetchIpFallback, getPositionWithTimeout, isDetecting, saveLocation, t]);

  const handleClear = () => {
    saveLocation(null);
    setStatus('');
  };

  const hintMessage = status || t('profile.location_hint', { defaultValue: 'Grant permission to detect your location automatically.' });

  return (
    <div className={`space-y-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
      <div
        className={`rounded-2xl border p-4 ${theme === 'dark' ? 'cv-card-surface-solid border-white/10' : 'bg-white border-gray-200/50 shadow-sm'}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium">
            {currentDisplay || t('profile.location_placeholder', { defaultValue: 'City, Country' })}
          </div>
          {currentDisplay && (
            <button
              type="button"
              onClick={handleClear}
              className={`text-xs font-semibold transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800'
                }`}
            >
              {t('profile.clear_location', { defaultValue: 'Clear location' })}
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={isDetecting}
            className={`inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${isDetecting
              ? 'opacity-70 cursor-wait'
              : ''
              } ${theme === 'dark'
                ? 'bg-white text-black hover:bg-gray-200 disabled:hover:bg-white/90'
                : 'bg-gray-900 text-white hover:bg-gray-800 disabled:hover:bg-gray-900/90'
              }`}
          >
            {isDetecting ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>{t('location.detecting', { defaultValue: 'Detecting…' })}</span>
              </>
            ) : (
              <>
                <LocateFixed className="w-4 h-4" />
                <span>
                  {t('profile.detect_location', {
                    defaultValue: t('auth.allow_location', { defaultValue: 'Detect my location' }),
                  })}
                </span>
              </>
            )}
          </button>
          <div className={`flex-1 text-xs leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {hintMessage}
          </div>
        </div>
      </div>
    </div>
  );
};

// Bitshifting helper functions for preferences_flags
const parsePreferencesFlags = (flags: string | null | undefined): bigint => {
  if (!flags || flags === '') return BigInt(0);
  try {
    // Try parsing as hex string first
    if (flags.startsWith('0x') || /^[0-9a-fA-F]+$/.test(flags)) {
      return BigInt(flags.startsWith('0x') ? flags : `0x${flags}`);
    }
    // Try parsing as decimal
    return BigInt(flags);
  } catch {
    return BigInt(0);
  }
};

const serializePreferencesFlags = (flags: bigint): string => {
  if (flags === BigInt(0)) return '0';
  return flags.toString(16); // Return as hex string without 0x prefix
};

// Auth responses return selected catalog indexes; older servers used raw hex.
const selectedPreferenceBits = (flags: bigint): number[] => {
  const bits: number[] = [];
  for (let index = 0, remaining = flags; remaining > 0n; index++, remaining >>= 1n) {
    if (remaining & 1n) bits.push(index);
  }
  return bits;
};
const hasPreferenceState = (value: { selected_preference_bits?: number[]; preferences_flags?: string }) =>
  Array.isArray(value.selected_preference_bits) || typeof value.preferences_flags === 'string';

const isBitSet = (flags: bigint, bitIndex: number): boolean => {
  return (flags & (BigInt(1) << BigInt(bitIndex))) !== BigInt(0);
};

const setBit = (flags: bigint, bitIndex: number): bigint => {
  return flags | (BigInt(1) << BigInt(bitIndex));
};

const unsetBit = (flags: bigint, bitIndex: number): bigint => {
  return flags & ~(BigInt(1) << BigInt(bitIndex));
};

const toggleBit = (flags: bigint, bitIndex: number): bigint => {
  return isBitSet(flags, bitIndex) ? unsetBit(flags, bitIndex) : setBit(flags, bitIndex);
};

const normalizeAllowMultiple = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on') return true;
    if (normalized === '0' || normalized === 'false' || normalized === 'no' || normalized === 'off') return false;
  }
  return undefined;
};

const ProfileScreen: React.FC<ProfileScreenProps> = ({ inline = false, isEmbed = false, username: propUsername }) => {
  const { username: urlUsername } = useParams<{ username: string }>();
  const username = propUsername || urlUsername;
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const { user: rawAuthUser, isAuthenticated, updateUser } = useAuth();
  const authUser = rawAuthUser as ProfileUser | null;
  const { data: appData, defaultLanguage, loading: initialSyncLoading, error: initialSyncError, refresh: refreshInitialSync } = useApp();
  const { t } = useTranslation('common');
  const { premiumFeatureEnabled, isPremiumUser } = usePremiumAccess();
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [medias, setMedias] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [mediasLoading, setMediasLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'photos' | 'friends' | 'posts' | 'replies' | 'media' | 'likes'>('profile');
  const profileTabsRef = useRef<HTMLDivElement>(null);
  const preferenceMutationRef = useRef(false);
  const isFollowing = !!authUser && (user?.is_following ?? getHasFollowingRelationship(authUser, user));
  const [followError, setFollowError] = useState(false);
  const followRequestRef = useRef(false);
  const currentFollowContext = useRef({ username, viewerId: authUser?.id });
  currentFollowContext.current = { username, viewerId: authUser?.id };
  useEffect(() => { setFollowError(false); }, [username]);
  const [isFollowPending, setIsFollowPending] = useState(false);
  const [followReadAttempt, setFollowReadAttempt] = useState(0);
  const needsFollowDetails = !!authUser && !!user && authUser.id !== user.id &&
    typeof user.is_following !== 'boolean' && !Array.isArray(authUser.engagements?.engagement_details);
  useEffect(() => {
    if (!needsFollowDetails || !authUser || !user) return;
    let active = true;
    const target = user;
    const readFollowing = async () => {
      setFollowError(false);
      try {
        let cursor: string | undefined;
        const cursors = new Set<string>();
        let follows = false;
        do {
          const response = await api.fetchEngagements({ user_id: authUser.public_id ?? authUser.id, engagement_type: 'following', limit: 100, ...(cursor ? { cursor } : {}) });
          if (!active) return;
          if (!Array.isArray(response.engagements)) throw new Error('Missing engagement list');
          follows = getHasFollowingRelationship({ engagements: { engagement_details: response.engagements } }, target);
          cursor = response.cursor?.next || undefined;
          if (cursor && cursors.has(cursor)) throw new Error('Repeated engagement cursor');
          if (cursor) cursors.add(cursor);
        } while (!follows && cursor);
        if (active) setUser(previous => previous?.id === target.id ? { ...previous, is_following: follows } : previous);
      } catch {
        if (active) setFollowError(true);
      }
    };
    void readFollowing();
    return () => { active = false; };
  }, [authUser, user, needsFollowDetails, followReadAttempt]);
  const [showAuthWizard, setShowAuthWizard] = useState(false);
  const [showProfileStats, setShowProfileStats] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const isEditRoute = React.useMemo(() => {
    if (inline || isEmbed) {
      return false;
    }
    return new URLSearchParams(location.search || '').get('edit') === '1';
  }, [inline, isEmbed, location.search]);
  const openProfileEditMode = React.useCallback(() => {
    const params = new URLSearchParams(location.search || '');
    params.set('edit', '1');
    navigate(`${location.pathname}?${params.toString()}`);
  }, [location.pathname, location.search, navigate]);
  const closeProfileEditMode = React.useCallback((options?: { replace?: boolean }) => {
    if (inline || isEmbed) {
      setIsEditMode(false);
      return;
    }
    const params = new URLSearchParams(location.search || '');
    params.delete('edit');
    const nextSearch = params.toString();
    navigate(`${location.pathname}${nextSearch ? `?${nextSearch}` : ''}`, { replace: options?.replace ?? true });
  }, [inline, isEmbed, location.pathname, location.search, navigate]);
  const isViewingOwnProfileRoute = React.useMemo(() => {
    if (!isAuthenticated || !authUser) {
      return false;
    }
    if (!username || username === 'profile') {
      return true;
    }
    return authUser.username === username || String(authUser.id) === String(username);
  }, [isAuthenticated, authUser, username]);

  // Dynamic SEO based on profile data
  const profileDisplayName = user?.displayname || user?.username || username;
  const profileUsername = user?.username || username;
  const profileBioText = React.useMemo(() => {
    if (!user?.bio) {
      return '';
    }
    if (typeof user.bio === 'string') {
      return user.bio;
    }
    if (typeof user.bio === 'object') {
      const bioMap = user.bio as Record<string, string>;
      const preferredLanguage = user.default_language || defaultLanguage || 'en';
      const firstNonEmpty = Object.values(bioMap).find((value) => typeof value === 'string' && value.trim().length > 0);
      return bioMap[preferredLanguage] || bioMap[defaultLanguage] || bioMap.en || firstNonEmpty || '';
    }
    return '';
  }, [user?.bio, user?.default_language, defaultLanguage]);
  const profileBioExcerpt = htmlToPlainText(profileBioText).slice(0, 150);
  useSEO({
    title: profileDisplayName ? `${profileDisplayName} (@${profileUsername})` : profileUsername ? `@${profileUsername}` : 'Profile',
    description: profileBioExcerpt
      ? `${profileDisplayName} on CoolVibes – ${profileBioExcerpt}`.trim()
      : `${profileDisplayName || profileUsername}'s profile on CoolVibes, the LGBTIQA+ social platform.`,
    canonical: profileUsername ? `/${profileUsername}` : '/profile',
    type: 'profile',
  });
  const profileJsonLd = React.useMemo(() => {
    if (!profileUsername) return null;
    const profileUrl = `${SITE_URL}/${profileUsername}`;
    const avatarUrl = getSafeImageURLEx(user?.public_id, user?.avatar, 'large');
    const description = profileBioExcerpt
      ? `${profileDisplayName} on CoolVibes – ${profileBioExcerpt}`.trim()
      : `${profileDisplayName || profileUsername}'s profile on CoolVibes.`;
    return {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: profileDisplayName || profileUsername,
      alternateName: `@${profileUsername}`,
      url: profileUrl,
      description,
      image: avatarUrl || undefined,
    };
  }, [profileUsername, profileDisplayName, profileBioExcerpt, user?.public_id, user?.avatar]);
  const [isSaving, setIsSaving] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<ProfileUser>>({});
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);
  const [uploadingCoverImage, setUploadingCoverImage] = useState(false);
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [updatingAttributes, setUpdatingAttributes] = useState<Record<string, boolean>>({});
  const [editTab, setEditTab] = useState<'profile' | 'attributes' | 'interests' | 'fantasies'>('profile');
  const isEditModeRef = useRef(false);

  // Interests state
  const [selectedInterestCategory, setSelectedInterestCategory] = useState<string | null>(null);
  const [updatingInterests, setUpdatingInterests] = useState(false);

  // Fantasies state
  const [selectedFantasyCategory, setSelectedFantasyCategory] = useState<string | null>(null);
  const [updatingFantasies, setUpdatingFantasies] = useState(false);

  // Password update state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [passwordVisibility, setPasswordVisibility] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isPasswordSectionOpen, setIsPasswordSectionOpen] = useState(false);
  const [isBirthdateSectionOpen, setIsBirthdateSectionOpen] = useState(false);
  const normalizeDateOfBirthValue = React.useCallback((raw: unknown): string => {
    if (typeof raw !== 'string') {
      return '';
    }
    const trimmed = raw.trim();
    if (!trimmed) {
      return '';
    }

    const isoMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
    if (isoMatch?.[1]) {
      return isoMatch[1];
    }

    const candidate = trimmed.split('T')[0]?.split(' ')[0] || '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(candidate)) {
      return candidate;
    }

    return '';
  }, []);
  const getLocalizedBioText = React.useCallback((sourceUser: ProfileUser | null | undefined): string => {
    if (!sourceUser?.bio) {
      return '';
    }
    if (typeof sourceUser.bio === 'string') {
      return sourceUser.bio;
    }
    if (typeof sourceUser.bio === 'object') {
      const bioMap = sourceUser.bio as Record<string, string>;
      const preferredLanguage = sourceUser.default_language || defaultLanguage || 'en';
      const firstNonEmpty = Object.values(bioMap).find((value) => typeof value === 'string' && value.trim().length > 0);
      return bioMap[preferredLanguage] || bioMap[defaultLanguage] || bioMap.en || firstNonEmpty || '';
    }
    return '';
  }, [defaultLanguage]);
  const getPreferredBioForEdit = React.useCallback((): string => {
    const bioFromCurrentProfile = getLocalizedBioText(user);
    if (bioFromCurrentProfile.trim().length > 0) {
      return bioFromCurrentProfile;
    }
    if (isViewingOwnProfileRoute && authUser) {
      return getLocalizedBioText(authUser as unknown as ProfileUser);
    }
    return '';
  }, [getLocalizedBioText, user, isViewingOwnProfileRoute, authUser]);
  const getPreferredDateOfBirthForEdit = React.useCallback((): string => {
    const birthdateFromCurrentProfile = normalizeDateOfBirthValue(user?.date_of_birth);
    if (birthdateFromCurrentProfile) {
      return birthdateFromCurrentProfile;
    }
    if (isViewingOwnProfileRoute && authUser) {
      return normalizeDateOfBirthValue((authUser as unknown as ProfileUser)?.date_of_birth);
    }
    return '';
  }, [normalizeDateOfBirthValue, user?.date_of_birth, isViewingOwnProfileRoute, authUser]);
  const getPreferredLocationForEdit = React.useCallback((): UserLocation | undefined => {
    const currentLocation = user?.location as UserLocation | undefined;
    const currentLocationDisplay = getLocationDisplay((currentLocation ?? null) as UserLocation).trim();
    if (currentLocationDisplay) {
      return currentLocation;
    }
    if (isViewingOwnProfileRoute && authUser) {
      const authLocation = (authUser as unknown as ProfileUser)?.location as UserLocation | undefined;
      const authLocationDisplay = getLocationDisplay((authLocation ?? null) as UserLocation).trim();
      if (authLocationDisplay) {
        return authLocation;
      }
      return authLocation ?? currentLocation;
    }
    return currentLocation;
  }, [user?.location, isViewingOwnProfileRoute, authUser]);
  const birthdateDisplay = React.useMemo(() => {
    const raw = editFormData.date_of_birth;
    if (!raw) {
      return t('profile.date_of_birth_placeholder', { defaultValue: 'Select your birthdate' });
    }
    const parsed = new Date(raw as string);
    if (Number.isNaN(parsed.getTime())) {
      return raw as string;
    }
    const locale = defaultLanguage === 'tr' ? 'tr-TR' : 'en-US';
    return parsed.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
  }, [editFormData.date_of_birth, defaultLanguage, t]);

  const resetPasswordForm = React.useCallback(() => {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    });
    setPasswordVisibility({
      current: false,
      new: false,
      confirm: false,
    });
    setPasswordMessage(null);
    setIsUpdatingPassword(false);
  }, []);

  const handlePasswordInputChange = (field: 'currentPassword' | 'newPassword' | 'confirmNewPassword', value: string) => {
    setPasswordForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setPasswordVisibility((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handlePasswordSubmit = async () => {
    setPasswordMessage(null);
    const current = passwordForm.currentPassword.trim();
    const next = passwordForm.newPassword.trim();
    const confirm = passwordForm.confirmNewPassword.trim();

    if (!current || !next || !confirm) {
      setPasswordMessage({
        type: 'error',
        text: t('profile.password_error_required', { defaultValue: 'Please complete all password fields.' }),
      });
      return;
    }

    if (next.length < 8) {
      setPasswordMessage({
        type: 'error',
        text: t('profile.password_error_length', { defaultValue: 'Your new password must be at least 8 characters long.' }),
      });
      return;
    }

    if (next !== confirm) {
      setPasswordMessage({
        type: 'error',
        text: t('profile.password_error_mismatch', { defaultValue: 'New password and confirmation do not match.' }),
      });
      return;
    }

    if (current === next) {
      setPasswordMessage({
        type: 'error',
        text: t('profile.password_error_same', { defaultValue: 'New password must be different from your current password.' }),
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await api.updatePassword({
        current_password: current,
        new_password: next,
        new_password_confirmation: confirm,
      });

      setPasswordMessage({
        type: 'success',
        text: t('profile.password_success', { defaultValue: 'Password updated successfully.' }),
      });
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
      setPasswordVisibility({
        current: false,
        new: false,
        confirm: false,
      });
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        t('profile.password_error_generic', { defaultValue: 'We could not update your password. Please try again.' });

      setPasswordMessage({
        type: 'error',
        text: message,
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const privacyLevels = React.useMemo(() => Object.values(PrivacyLevel), []);
  const privacyLevelLabels = React.useMemo(
    () => ({
      [PrivacyLevel.Public]: t('profile.privacy_public', { defaultValue: 'Public' }),
      [PrivacyLevel.FriendsOnly]: t('profile.privacy_friends_only', { defaultValue: 'Friends Only' }),
      [PrivacyLevel.FollowersOnly]: t('profile.privacy_followers_only', { defaultValue: 'Followers Only' }),
      [PrivacyLevel.MutualsOnly]: t('profile.privacy_mutuals_only', { defaultValue: 'Mutuals Only' }),
      [PrivacyLevel.Private]: t('profile.privacy_private', { defaultValue: 'Private' }),
    }),
    [t]
  );

  // Check if viewing own profile
  const isOwnProfile = isAuthenticated && authUser && user && (authUser.username === user.username || authUser.id === user.id);
  const profileViewRef = useDwellView<HTMLDivElement>({
    key: authUser && user?.public_id ? `profile:${authUser.id}:${user.public_id}` : null,
    enabled: Boolean(isAuthenticated && authUser && user?.public_id && !isOwnProfile),
    onDwell: () => user ? api.viewProfile(user.public_id) : undefined,
  });
  useEffect(() => {
    if (inline || isEmbed) {
      return;
    }

    if (isEditRoute && isOwnProfile) {
      setIsEditMode(true);
      return;
    }

    if (isEditRoute && user && !isOwnProfile) {
      closeProfileEditMode({ replace: true });
      return;
    }

    if (!isEditRoute && isEditMode) {
      setIsEditMode(false);
    }
  }, [closeProfileEditMode, inline, isEmbed, isEditMode, isEditRoute, isOwnProfile, user]);
  type PrivacyGateReason = 'login' | 'followers' | 'mutuals' | 'friends' | 'private' | null;
  const viewedProfilePrivacyLevel = (user?.privacy_level as PrivacyLevel | undefined) ?? PrivacyLevel.Public;
  const activePrivacyLevel =
    (editFormData.privacy_level as PrivacyLevel | undefined) ??
    viewedProfilePrivacyLevel;

  const viewerFollowsProfile = React.useMemo(() => {
    if (isOwnProfile) {
      return true;
    }
    if (!isAuthenticated || !user) {
      return false;
    }
    if (typeof user.is_following === 'boolean') {
      return user.is_following;
    }
    return isFollowing;
  }, [isOwnProfile, isAuthenticated, user, isFollowing]);

  const profileFollowsViewer = React.useMemo(() => {
    if (isOwnProfile) {
      return true;
    }
    if (!isAuthenticated || !user || !authUser) {
      return false;
    }

    const relationHints = user as Record<string, unknown>;
    const reverseFollowKeys = [
      'is_followed_by',
      'followed_by_current_user',
      'is_follower',
      'follows_viewer',
      'viewer_is_followed_by_user',
    ];
    for (const key of reverseFollowKeys) {
      if (typeof relationHints[key] === 'boolean') {
        return Boolean(relationHints[key]);
      }
    }

    return getHasFollowingRelationship(user, authUser);
  }, [isOwnProfile, isAuthenticated, user, authUser]);

  const isMutualConnection = viewerFollowsProfile && profileFollowsViewer;
  const [friendshipAccepted, setFriendshipAccepted] = useState(false);
  useEffect(() => { setFriendshipAccepted(false); }, [user?.id]);
  const isFriendConnection = friendshipAccepted;
  const privacyAccess = React.useMemo(
    () => {
      if (isOwnProfile) {
        return {
          canViewSensitiveProfileSections: true,
          gateReason: null as PrivacyGateReason,
        };
      }
      if (!isAuthenticated) {
        return {
          canViewSensitiveProfileSections: false,
          gateReason: 'login' as PrivacyGateReason,
        };
      }

      switch (viewedProfilePrivacyLevel) {
        case PrivacyLevel.Private:
          return {
            canViewSensitiveProfileSections: false,
            gateReason: 'private' as PrivacyGateReason,
          };
        case PrivacyLevel.FollowersOnly:
          return {
            canViewSensitiveProfileSections: viewerFollowsProfile,
            gateReason: viewerFollowsProfile ? null : ('followers' as PrivacyGateReason),
          };
        case PrivacyLevel.MutualsOnly:
          return {
            canViewSensitiveProfileSections: isMutualConnection,
            gateReason: isMutualConnection ? null : ('mutuals' as PrivacyGateReason),
          };
        case PrivacyLevel.FriendsOnly:
          return {
            canViewSensitiveProfileSections: isFriendConnection,
            gateReason: isFriendConnection ? null : ('friends' as PrivacyGateReason),
          };
        case PrivacyLevel.Public:
        default:
          return {
            canViewSensitiveProfileSections: true,
            gateReason: null as PrivacyGateReason,
          };
      }
    },
    [isOwnProfile, isAuthenticated, viewedProfilePrivacyLevel, viewerFollowsProfile, isMutualConnection, isFriendConnection]
  );
  const canViewSensitiveProfileSections = privacyAccess.canViewSensitiveProfileSections;
  const privacyGateReason = privacyAccess.gateReason;
  const canViewActivityTabs = isAuthenticated && canViewSensitiveProfileSections;
  const shouldShowPrivacyGate = isAuthenticated && !isOwnProfile && !canViewSensitiveProfileSections;
  const privacyGateDescription = React.useMemo(() => {
    switch (privacyGateReason) {
      case 'followers':
        return t('profile.privacy_locked_followers', {
          defaultValue: "Only followers approved by this user can view full profile details.",
        });
      case 'mutuals':
        return t('profile.privacy_locked_mutuals', {
          defaultValue: 'Only mutual connections can view this profile’s sensitive sections.',
        });
      case 'friends':
        return t('profile.privacy_locked_friends', {
          defaultValue: 'Only trusted friends can view this profile’s sensitive sections.',
        });
      case 'private':
        return t('profile.privacy_locked_private', {
          defaultValue: 'This profile is currently private and visible only to the owner.',
        });
      case 'login':
      default:
        return t('profile.login_to_view_details', {
          defaultValue: 'Log in to view full profile details, photos, and more.',
        });
    }
  }, [privacyGateReason, t]);
  const canRequestPrivacyAccess = isAuthenticated && !isOwnProfile && !canViewSensitiveProfileSections && !viewerFollowsProfile && (privacyGateReason === 'followers' || privacyGateReason === 'mutuals' || privacyGateReason === 'friends');

  const getProfileImageUrl = () => {
    const source = isOwnProfile && authUser ? authUser : user;
    return getProfileAvatarUrl(source as Partial<ProfileUser> | null | undefined);
  };

  const getCoverImageUrl = () => {
    const source = isOwnProfile && authUser ? authUser : user;
    return getProfileCoverUrl(source as Partial<ProfileUser> | null | undefined);
  };

  // Get preferences_flags from user
  const userToCheck = (isAuthenticated && isOwnProfile && authUser) ? authUser : user;
  const preferencesFlags = React.useMemo(() => {
    if (Array.isArray(userToCheck?.selected_preference_bits)) {
      return userToCheck.selected_preference_bits.reduce((flags, bit) => Number.isSafeInteger(bit) && bit >= 0 && bit <= 1_000_000 ? setBit(flags, bit) : flags, 0n);
    }
    return parsePreferencesFlags(userToCheck?.preferences_flags);
  }, [userToCheck]);

  const hasPreferencesFlags = Array.isArray(userToCheck?.selected_preference_bits) || (typeof userToCheck?.preferences_flags === 'string' && userToCheck.preferences_flags.trim() !== '');

  // Build fieldOptions from preferences.attributes
  const fieldOptions: Record<string, Array<{ id: string; name: string; display_order: number; bit_index?: number; allow_multiple?: boolean }>> = {};
  const fieldAllowMultiple: Record<string, boolean> = {};

  // Read from preferences.attributes if available, otherwise fallback to old structure
  const preferencesAttributes = (appData as InitialData | null)?.preferences?.attributes;
  if (Array.isArray(preferencesAttributes) && preferencesAttributes.length > 0) {
    preferencesAttributes.forEach((attr: { tag?: string; slug?: string; allow_multiple?: boolean | number | string | null; items?: Array<{ id: string; display_order?: number; title?: Record<string, string>; bit_index?: number }> }) => {
      const tag = attr.tag || attr.slug;
      if (!tag) return;

      const allowMultiple = normalizeAllowMultiple(attr.allow_multiple);
      if (allowMultiple !== undefined) {
        fieldAllowMultiple[tag] = allowMultiple;
      }

      if (attr.items && Array.isArray(attr.items)) {
        const sortedItems = [...attr.items].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        fieldOptions[tag] = sortedItems.map((item) => ({
          id: item.id,
          name: item.title?.[defaultLanguage] || item.title?.en || (item.title ? Object.values(item.title)[0] : '') || '',
          display_order: item.display_order || 0,
          bit_index: item.bit_index,
        }));
      }
    });
  } else {
    // Fallback to old structure
    if ((appData as InitialData | null)?.attributes) {
      (appData as InitialData).attributes?.forEach((group: { category: string; attributes: Array<{ id: string; name: Record<string, string>; display_order: number }> }) => {
        const sortedAttributes = [...group.attributes].sort((a, b) => a.display_order - b.display_order);
        fieldOptions[group.category] = sortedAttributes.map((attr) => ({
          id: attr.id,
          name: attr.name[defaultLanguage] || attr.name.en || Object.values(attr.name as Record<string, string>)[0] || '',
          display_order: attr.display_order,
        }));
      });
    }

    // Add gender_identities to fieldOptions
    if ((appData as InitialData | null)?.gender_identities) {
      const sortedGenderIdentities = [...((appData as InitialData).gender_identities || [])].sort((a: { display_order?: number }, b: { display_order?: number }) => (a.display_order || 0) - (b.display_order || 0));
      fieldOptions['gender_identity'] = sortedGenderIdentities.map((item: { id: string; display_order?: number; name?: Record<string, string> }) => ({
        id: item.id,
        name: item.name?.[defaultLanguage] || item.name?.en || (item.name ? Object.values(item.name as Record<string, string>)[0] : '') || '',
        display_order: item.display_order || 0,
      }));
    }

    // Add sexual_orientations to fieldOptions
    if ((appData as InitialData | null)?.sexual_orientations) {
      const sortedSexualOrientations = [...((appData as InitialData).sexual_orientations || [])].sort((a: { display_order?: number }, b: { display_order?: number }) => (a.display_order || 0) - (b.display_order || 0));
      fieldOptions['sexual_orientation'] = sortedSexualOrientations.map((item: { id: string; display_order?: number; name?: Record<string, string> }) => ({
        id: item.id,
        name: (item.name?.[defaultLanguage] || item.name?.en || (item.name ? Object.values(item.name as Record<string, string>)[0] : '') || ''),
        display_order: item.display_order || 0,
      }));
    }

    // Add sexual_roles to fieldOptions
    if ((appData as InitialData | null)?.sexual_roles) {
      const sortedSexualRoles = [...((appData as InitialData).sexual_roles || [])].sort((a: { display_order?: number }, b: { display_order?: number }) => (a.display_order || 0) - (b.display_order || 0));
      fieldOptions['sex_role'] = sortedSexualRoles.map((item: { id: string; display_order?: number; name?: Record<string, string> }) => ({
        id: item.id,
        name: item.name?.[defaultLanguage] || item.name?.en || (item.name ? Object.values(item.name as Record<string, string>)[0] : '') || '',
        display_order: item.display_order || 0,
      }));
    }
  }

  // Build interestOptions from preferences.interests
  const { interestOptions, interestCategories, interestAllowMultiple } = React.useMemo(() => {
    const options: Record<string, Array<{ id: string; name: string; emoji?: string; interest_id: string; bit_index?: number }>> = {};
    const categories: Array<{ id: string; name: string; allow_multiple?: boolean }> = [];
    const allowMultipleMap: Record<string, boolean> = {};

    // Read from preferences.interests if available, otherwise fallback to old structure
    const preferencesInterests = (appData as InitialData | null)?.preferences?.interests;
    if (Array.isArray(preferencesInterests) && preferencesInterests.length > 0) {
      preferencesInterests.forEach((interest: { id: string; title?: Record<string, string>; allow_multiple?: boolean | number | string | null; items?: Array<{ id: string; title?: Record<string, string>; icon?: string; bit_index?: number }> }) => {
        const categoryName = interest.title?.[defaultLanguage] || interest.title?.en || (interest.title ? Object.values(interest.title)[0] : '') || '';
        const allowMultiple = normalizeAllowMultiple(interest.allow_multiple);
        if (allowMultiple !== undefined) {
          allowMultipleMap[interest.id] = allowMultiple;
        }

        categories.push({
          id: interest.id,
          name: categoryName,
          ...(allowMultiple !== undefined ? { allow_multiple: allowMultiple } : {}),
        });

        if (interest.items && Array.isArray(interest.items)) {
          options[interest.id] = interest.items.map((item: { id: string; title?: Record<string, string>; icon?: string; bit_index?: number }) => ({
            id: item.id,
            name: item.title?.[defaultLanguage] || item.title?.en || (item.title ? Object.values(item.title)[0] : '') || '',
            emoji: item.icon,
            interest_id: interest.id,
            bit_index: item.bit_index,
          }));
        }
      });
    } else if (appData?.interests) {
      // Fallback to old structure
      appData.interests.forEach((interest) => {
        const categoryName = interest.name[defaultLanguage] || interest.name.en || Object.values(interest.name)[0] || '';
        categories.push({
          id: interest.id,
          name: categoryName,
        });

        const items = (interest.items as Array<{ id: string; name: Record<string, string>; emoji?: string; interest_id: string }>) || [];
        options[interest.id] = items.map(item => ({
          id: item.id,
          name: item.name[defaultLanguage] || item.name.en || Object.values(item.name)[0] || '',
          emoji: item.emoji,
          interest_id: item.interest_id,
        }));
      });
    }
    return { interestOptions: options, interestCategories: categories, interestAllowMultiple: allowMultipleMap };
  }, [appData, defaultLanguage]);

  // Get user's selected interests (as array of item IDs) from preferences_flags
  const userSelectedInterestIds = React.useMemo(() => {
    const selectedIds: string[] = [];

    // Read from preferences_flags using bit_index
    Object.keys(interestOptions).forEach((categoryId) => {
      const items = interestOptions[categoryId] || [];
      items.forEach((item) => {
        if (item.bit_index !== undefined && isBitSet(preferencesFlags, item.bit_index)) {
          selectedIds.push(item.id);
        }
      });
    });

    // Fallback to old structure if preferences_flags is empty and we have interests array
    if (selectedIds.length === 0 && !hasPreferencesFlags) {
      const interestsSource = (isEditMode && isAuthenticated && isOwnProfile && authUser) ? (authUser as any).interests : (user as any)?.interests;
      if (interestsSource) {
        return interestsSource.map((i: any) => {
          if (typeof i === 'object' && i !== null) {
            return String((i as any).interest_item_id || (i as any).interest_item?.id || (i as any).id);
          }
          return String(i);
        });
      }
    }

    return selectedIds;
  }, [preferencesFlags, hasPreferencesFlags, interestOptions, user, authUser, isEditMode, isAuthenticated, isOwnProfile]);

  // Get selected interest items grouped by category for display in category list from preferences_flags
  const userSelectedInterestsByCategory = React.useMemo(() => {
    const grouped: Record<string, Array<{ id: string; name: string; emoji?: string }>> = {};

    // Read from preferences_flags using bit_index
    Object.keys(interestOptions).forEach((categoryId) => {
      const items = interestOptions[categoryId] || [];
      items.forEach((item) => {
        if (item.bit_index !== undefined && isBitSet(preferencesFlags, item.bit_index)) {
          if (!grouped[categoryId]) {
            grouped[categoryId] = [];
          }
          grouped[categoryId].push({
            id: item.id,
            name: item.name,
            emoji: item.emoji,
          });
        }
      });
    });

    // Fallback to old structure if preferences_flags is empty
    if (Object.keys(grouped).length === 0 && !hasPreferencesFlags) {
      const interestsSource = (isEditMode && isAuthenticated && isOwnProfile && authUser) ? (authUser as any).interests : (user as any)?.interests;
      if (interestsSource) {
        interestsSource.forEach((userInterest: any) => {
          if (typeof userInterest === 'object' && userInterest !== null) {
            const interestItem = (userInterest as any).interest_item;
            if (interestItem) {
              const categoryId = interestItem.interest_id || interestItem.interest?.id;
              if (categoryId) {
                if (!grouped[categoryId]) {
                  grouped[categoryId] = [];
                }
                const itemName = interestItem.name[defaultLanguage] ||
                  interestItem.name.en ||
                  Object.values(interestItem.name)[0] || '';
                grouped[categoryId].push({
                  id: interestItem.id || String((userInterest as any).interest_item_id),
                  name: itemName,
                  emoji: interestItem.emoji,
                });
              }
            }
          }
        });
      }
    }

    return grouped;
  }, [preferencesFlags, hasPreferencesFlags, interestOptions, user, authUser, isEditMode, isAuthenticated, isOwnProfile, defaultLanguage]);

  // Build fantasyOptions and fantasyCategories from preferences.fantasies
  // Build fantasyOptions and fantasyCategories from preferences.fantasies
  const { fantasyOptions, fantasyCategories, fantasyAllowMultiple } = React.useMemo(() => {
    const options: Record<string, Array<{ id: string; name: string; description: string; bit_index?: number }>> = {};
    const categories: Array<{ id: string; name: string; allow_multiple?: boolean }> = [];
    const allowMultipleMap: Record<string, boolean> = {};

    // Read from preferences.fantasies if available, otherwise fallback to old structure
    const preferencesFantasies = (appData as any)?.preferences?.fantasies;
    if (Array.isArray(preferencesFantasies) && preferencesFantasies.length > 0) {
      preferencesFantasies.forEach((fantasy: any) => {
        const categorySlug = fantasy.slug;
        const allowMultiple = normalizeAllowMultiple(fantasy.allow_multiple);
        if (allowMultiple !== undefined) {
          allowMultipleMap[categorySlug] = allowMultiple;
        }

        const categoryName = fantasy.title?.[defaultLanguage] ||
          fantasy.title?.en ||
          (fantasy.title ? Object.values(fantasy.title)[0] : null) ||
          categorySlug;

        categories.push({
          id: categorySlug,
          name: categoryName,
          ...(allowMultiple !== undefined ? { allow_multiple: allowMultiple } : {}),
        });

        if (fantasy.items && Array.isArray(fantasy.items)) {
          options[categorySlug] = fantasy.items.map((item: { id: string; title?: Record<string, string>; description?: Record<string, string>; bit_index?: number }) => ({
            id: item.id,
            name: item.title?.[defaultLanguage] || item.title?.en || (item.title ? Object.values(item.title)[0] : null) || `Fantasy ${item.id}`,
            description: item.description?.[defaultLanguage] || item.description?.en || (item.description ? Object.values(item.description)[0] : '') || '',
            bit_index: item.bit_index,
          }));
        }
      });
    } else if (appData?.fantasies) {
      // Fallback to old structure
      const fantasiesByCategory: Record<string, typeof appData.fantasies> = {};
      appData.fantasies.forEach((fantasy) => {
        const categorySlug = (fantasy as Record<string, unknown>).slug as string;
        if (!fantasiesByCategory[categorySlug]) {
          fantasiesByCategory[categorySlug] = [];
        }
        fantasiesByCategory[categorySlug].push(fantasy);
      });

      Object.keys(fantasiesByCategory).forEach((categorySlug) => {
        const firstFantasy = fantasiesByCategory[categorySlug][0];
        const fCategory = firstFantasy.category as Record<string, string> | undefined;
        const categoryName = fCategory?.[defaultLanguage] || fCategory?.en || (fCategory ? Object.values(fCategory)[0] : '') || categorySlug;

        categories.push({
          id: categorySlug,
          name: categoryName,
        });

        options[categorySlug] = fantasiesByCategory[categorySlug].map((fantasy) => {
          const fLabel = fantasy.label as Record<string, string> | undefined;
          const fDesc = fantasy.description as Record<string, string> | undefined;
          return {
            id: fantasy.id,
            name: fLabel?.[defaultLanguage] || fLabel?.en || (fLabel ? Object.values(fLabel)[0] : '') || `Fantasy ${fantasy.id}`,
            description: fDesc?.[defaultLanguage] || fDesc?.en || (fDesc ? Object.values(fDesc)[0] : '') || '',
          };
        });
      });
    }

    return { fantasyOptions: options, fantasyCategories: categories, fantasyAllowMultiple: allowMultipleMap };
  }, [appData, defaultLanguage]);

  // Get user's selected fantasies (as array of fantasy IDs) from preferences_flags
  const userSelectedFantasyIds = React.useMemo(() => {
    const selectedIds: string[] = [];

    // Read from preferences_flags using bit_index
    Object.keys(fantasyOptions).forEach((categorySlug) => {
      const items = fantasyOptions[categorySlug] || [];
      items.forEach((item) => {
        if (item.bit_index !== undefined && isBitSet(preferencesFlags, item.bit_index)) {
          selectedIds.push(item.id);
        }
      });
    });

    // Fallback to old structure if preferences_flags is empty
    if (selectedIds.length === 0 && !hasPreferencesFlags) {
      const fantasiesSource = (isEditMode && isAuthenticated && isOwnProfile && authUser) ? (authUser as any).fantasies : user?.fantasies;
      if (fantasiesSource) {
        return fantasiesSource.map((f: any) => String(typeof f === 'object' && f !== null ? f.fantasy_id || f.fantasy?.id || f.id : f));
      }
    }

    return selectedIds;
  }, [preferencesFlags, hasPreferencesFlags, fantasyOptions, user, authUser, isEditMode, isAuthenticated, isOwnProfile]);

  // Get selected fantasy items grouped by category for display in category list from preferences_flags
  const userSelectedFantasiesByCategory = React.useMemo(() => {
    const grouped: Record<string, Array<{ id: string; name: string }>> = {};

    // Read from preferences_flags using bit_index
    Object.keys(fantasyOptions).forEach((categorySlug) => {
      const items = fantasyOptions[categorySlug] || [];
      items.forEach((item) => {
        if (item.bit_index !== undefined && isBitSet(preferencesFlags, item.bit_index)) {
          if (!grouped[categorySlug]) {
            grouped[categorySlug] = [];
          }
          grouped[categorySlug].push({
            id: item.id,
            name: item.name,
          });
        }
      });
    });

    // Fallback to old structure if preferences_flags is empty
    if (Object.keys(grouped).length === 0 && !hasPreferencesFlags) {
      const fantasiesSource = (isEditMode && isAuthenticated && isOwnProfile && authUser) ? (authUser as any).fantasies : (user as any)?.fantasies;
      if (fantasiesSource && (appData as any)?.fantasies) {
        fantasiesSource.forEach((userFantasy: any) => {
          if (typeof userFantasy === 'object' && userFantasy !== null) {
            const fantasyId = (userFantasy as any).fantasy_id || (userFantasy as any).id;
            if (fantasyId) {
              const fantasy = (appData as any).fantasies.find((f: any) => f.id === fantasyId);
              if (fantasy) {
                const categorySlug = (fantasy as Record<string, unknown>).slug as string;
                if (!grouped[categorySlug]) {
                  grouped[categorySlug] = [];
                }
                const fLabel = fantasy.label as Record<string, string> | undefined;
                const fantasyName = fLabel?.[defaultLanguage] ||
                  fLabel?.en ||
                  (fLabel ? Object.values(fLabel)[0] : '') ||
                  '';
                grouped[categorySlug].push({
                  id: fantasyId,
                  name: fantasyName,
                });
              }
            }
          }
        });
      }
    }

    return grouped;
  }, [preferencesFlags, hasPreferencesFlags, fantasyOptions, user, authUser, isEditMode, isAuthenticated, isOwnProfile, appData, defaultLanguage]);


  const USER_ATTRIBUTES = [
    { field: 'gender_identity', label: t('profile.gender_identity'), icon: Transgender },
    { field: 'sexual_orientation', label: t('profile.sexual_orientation'), icon: Rainbow },
    { field: 'sex_role', label: t('profile.sex_role'), icon: Rabbit },
    { field: 'preferred_partner_gender', label: t('profile.preferred_partner_gender') || 'Preferred Partner Gender', icon: UserCircle },
    { field: 'relationship_status', label: t('profile.relationship_status'), icon: HeartHandshake },
    { field: 'relationship_preferences', label: t('profile.relationship_preferences') || 'Relationship Preferences', icon: HeartPulse },
    { field: 'height', label: t('profile.height'), icon: Ruler },
    { field: 'weight', label: t('profile.weight'), icon: RulerDimensionLine },
    { field: 'hair_color', label: t('profile.hair_color'), icon: Paintbrush },
    { field: 'eye_color', label: t('profile.eye_color'), icon: Eye },
    { field: 'skin_color', label: t('profile.skin_color'), icon: Palette },
    { field: 'body_type', label: t('profile.body_type'), icon: PersonStanding },
    { field: 'tattoos', label: t('profile.tattoos') || 'Tattoos', icon: Leaf },
    { field: 'ethnicity', label: t('profile.ethnicity'), icon: Fingerprint },
    { field: 'zodiac_sign', label: t('profile.zodiac_sign'), icon: Sparkles },
    { field: 'circumcision', label: t('profile.circumcision'), icon: Banana },
    { field: 'physical_disability', label: t('profile.physical_disability'), icon: Accessibility },
    { field: 'smoking', label: t('profile.smoking'), icon: Cigarette },
    { field: 'drinking', label: t('profile.drinking'), icon: Wine },
    { field: 'religion', label: t('profile.religion'), icon: Church },
    { field: 'education', label: t('profile.education_level'), icon: GraduationCap },
    { field: 'personality', label: t('profile.personality'), icon: Drama },
    { field: 'mbti_type', label: t('profile.mbti_type') || 'Personality Type', icon: UserCircle },
    { field: 'cronotype', label: t('profile.cronotype') || 'Chronotype', icon: Clock },
    { field: 'sense_of_humor', label: t('profile.sense_of_humor') || 'Sense of Humor', icon: Smile },
    { field: 'kids_preference', label: t('profile.kids'), icon: Baby },
    { field: 'pets', label: t('profile.pets'), icon: PawPrint },
    { field: 'dietary', label: t('profile.dietary'), icon: Vegan },
    { field: 'hiv_aids_status', label: t('profile.hiv_aids_status'), icon: HeartHandshake },
    { field: 'bdsm_interest', label: t('profile.bdsm_interest'), icon: Panda },
    { field: 'bdsm_plays', label: t('profile.bdsm_plays'), icon: Ghost },
    { field: 'bdsm_roles', label: t('profile.bdsm_roles'), icon: Bubbles },
  ];

  const handleFieldOptionSelect = async (field: string, value: string) => {
    if (!isOwnProfile || !isAuthenticated || preferenceMutationRef.current) return;
    // Find the selected option to get both id and name
    const options = fieldOptions[field] || [];
    const selectedOption = options.find(opt => opt.id === value);
    const attributeId = selectedOption ? selectedOption.id : value;

    if (!attributeId) {
      console.error(`No attribute ID found for field ${field}`);
      return;
    }

    preferenceMutationRef.current = true;
    // Set loading state for this field
    setUpdatingAttributes({ ...updatingAttributes, [field]: true });

    // Check if using new preferences structure with bit_index
    const usePreferencesFlags = selectedOption?.bit_index !== undefined;
    const allowMultiple = normalizeAllowMultiple(fieldAllowMultiple[field]) ?? false;

    // If using preferences_flags, update it
    let newPreferencesFlags = preferencesFlags;
    if (usePreferencesFlags && selectedOption.bit_index !== undefined) {
      if (allowMultiple) {
        // Toggle bit for multiple selection
        newPreferencesFlags = toggleBit(newPreferencesFlags, selectedOption.bit_index);
      } else {
        // Single selection: clear all bits for this field first, then set the new one
        // Find all options for this field and clear their bits
        options.forEach((opt) => {
          if (opt.bit_index !== undefined) {
            newPreferencesFlags = unsetBit(newPreferencesFlags, opt.bit_index);
          }
        });
        // Set the selected bit
        if (!isBitSet(preferencesFlags, selectedOption.bit_index)) newPreferencesFlags = setBit(newPreferencesFlags, selectedOption.bit_index);
      }
    }

    // Check if this is a sexual identity field (gender_identity, sexual_orientation, sex_role)
    const isSexualIdentityField = ['gender_identity', 'sexual_orientation', 'sex_role'].includes(field);

    // Immediately save to backend
    try {
      let response: { user?: ProfileUser; target_user?: ProfileUser; followee?: ProfileUser; posts?: unknown[]; medias?: unknown[];[key: string]: unknown } | undefined;

      if (usePreferencesFlags && selectedOption.bit_index !== undefined) {
        // Update preferences using updatePreferences API
        const isEnabled = isBitSet(newPreferencesFlags, selectedOption.bit_index);
        const userId = (isEditMode && isAuthenticated && authUser) ? authUser.id : user?.id;
        if (userId) {
          response = await api.updatePreferences(selectedOption.id, selectedOption.bit_index, isEnabled) as any;
        }
      } else if (isSexualIdentityField) {
        // Use CMD_USER_UPDATE_IDENTIFY for sexual identity fields
        const bodyKey = field === 'gender_identity' ? 'gender_identity_id'
          : field === 'sexual_orientation' ? 'sexual_orientation_id'
            : 'sexual_role_id';

        response = await api.updateIdentify({ [bodyKey]: attributeId }) as any;
      } else {
        // Use CMD_USER_UPDATE_ATTRIBUTE for regular attributes
        response = await api.updateAttribute({ attribute_id: attributeId }) as any;
      }

      if (usePreferencesFlags && response?.user && !hasPreferenceState(response.user)) {
        response = { ...response, user: { ...response.user, preferences_flags: serializePreferencesFlags(newPreferencesFlags), selected_preference_bits: selectedPreferenceBits(newPreferencesFlags) } };
      }

      // Update auth context - always update if authenticated
      if (isAuthenticated && authUser) {
        // If response contains updated user, use that
        if (response?.user) {
          updateUser(response.user as any);
          // Also update local user state if viewing own profile
          if (user && (authUser.id === user.id || authUser.username === user.username)) {
            setUser(response.user as ProfileUser);
          }
        } else if (usePreferencesFlags && selectedOption.bit_index !== undefined) {
          // Update preferences_flags in user data from response
          if (response?.user) {
            updateUser(response.user as any);
            if (user && (authUser.id === user.id || authUser.username === user.username)) {
              setUser(response.user as ProfileUser);
            }
          } else {
            // Fallback: update from newPreferencesFlags
            const flagsString = serializePreferencesFlags(newPreferencesFlags);
            const updatedUserData = {
              ...authUser,
              preferences_flags: flagsString,
              selected_preference_bits: selectedPreferenceBits(newPreferencesFlags),
            } as Parameters<typeof updateUser>[0];
            updateUser(updatedUserData as Parameters<typeof updateUser>[0]);
            if (user && (authUser.id === user.id || authUser.username === user.username)) {
              setUser(updatedUserData as ProfileUser);
            }
          }
        } else {
          // Otherwise, update manually
          if (isSexualIdentityField) {
            // Update sexual identity fields as arrays (matching API structure)
            const attributeData = options.find(opt => opt.id === attributeId);
            if (attributeData) {
              const updatedUserData: Parameters<typeof updateUser>[0] = { ...authUser } as Parameters<typeof updateUser>[0];

              if (field === 'gender_identity') {
                // Store as array to match API structure
                (updatedUserData as any).gender_identities = [{
                  id: attributeId,
                  name: { [defaultLanguage]: attributeData.name } as Record<string, string>,
                  display_order: attributeData.display_order,
                }];
              } else if (field === 'sexual_orientation') {
                // Store as array to match API structure
                (updatedUserData as any).sexual_orientations = [{
                  id: attributeId,
                  name: { [defaultLanguage]: attributeData.name } as Record<string, string>,
                  display_order: attributeData.display_order,
                }];
              } else if (field === 'sex_role') {
                // Store as object (not array) - use sexual_role to match API
                (updatedUserData as any).sexual_role = {
                  id: attributeId,
                  name: { [defaultLanguage]: attributeData.name } as Record<string, string>,
                  display_order: attributeData.display_order,
                };
                // Also set sexual_role_id for API compatibility
                (updatedUserData as any).sexual_role_id = attributeId;
              }

              updateUser(updatedUserData as any);
              // Also update local user state if viewing own profile
              if (user && (authUser.id === user.id || authUser.username === user.username)) {
                setUser(updatedUserData as any);
              }
            }
          } else {
            // Update user_attributes for regular attributes
            const existingAttributes = authUser.user_attributes || [];
            const otherAttributes = existingAttributes.filter(ua => ua.category_type !== field);
            const attributeData = options.find(opt => opt.id === attributeId);

            if (attributeData) {
              const newAttribute = {
                id: `${attributeId}`,
                user_id: authUser.id,
                category_type: field,
                attribute_id: attributeId,
                attribute: {
                  id: attributeId,
                  category: field,
                  display_order: attributeData.display_order,
                  name: { [defaultLanguage]: attributeData.name } as Record<string, string>,
                },
              };

              const updatedUserData = {
                ...authUser,
                user_attributes: [...otherAttributes, newAttribute],
              };

              updateUser(updatedUserData as any);
              // Also update local user state if viewing own profile
              if (user && (authUser.id === user.id || authUser.username === user.username)) {
                setUser(updatedUserData as any);
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.error(`Error updating ${field}:`, err);
      setError(err.response?.data?.message || `Failed to update ${field}`);
    } finally {
      preferenceMutationRef.current = false;
      // Clear loading state
      setUpdatingAttributes({ ...updatingAttributes, [field]: false });
    }

    // Close accordion only if single selection (not multiple)
    // For multiple selection, keep accordion open so user can select more options
    if (!allowMultiple) {
      setSelectedField(null);
    }
  };





  const handleInterestItemToggle = async (itemId: string) => {
    if (!isOwnProfile || !isAuthenticated || preferenceMutationRef.current) return;
    preferenceMutationRef.current = true;
    const currentSelected = userSelectedInterestIds || [];
    const isSelected = currentSelected.includes(itemId);

    setUpdatingInterests(true);
    setError(null); // Clear previous errors

    // Find the interest item to get bit_index
    const interestItem = Object.values(interestOptions).flat().find(item => item.id === itemId);
    const usePreferencesFlags = interestItem?.bit_index !== undefined;

    // Find category to check allow_multiple
    const categoryId = Object.keys(interestOptions).find((id) =>
      interestOptions[id]?.some((item) => item.id === itemId)
    );
    const category = categoryId ? interestCategories.find((cat) => cat.id === categoryId) : undefined;
    const allowMultiple = normalizeAllowMultiple(category?.allow_multiple)
      ?? normalizeAllowMultiple(categoryId ? interestAllowMultiple[categoryId] : undefined)
      ?? true;

    // Update preferences_flags if using new structure
    let newPreferencesFlags = preferencesFlags;
    if (usePreferencesFlags && interestItem?.bit_index !== undefined) {
      if (allowMultiple) {
        // Toggle bit for multiple selection
        newPreferencesFlags = toggleBit(newPreferencesFlags, interestItem.bit_index);
      } else {
        // Single selection: clear all bits for this category first, then set the new one
        if (categoryId && interestOptions[categoryId]) {
          interestOptions[categoryId].forEach((opt) => {
            if (opt.bit_index !== undefined) {
              newPreferencesFlags = unsetBit(newPreferencesFlags, opt.bit_index);
            }
          });
        }
        // Set the selected bit
        if (!isSelected) newPreferencesFlags = setBit(newPreferencesFlags, interestItem.bit_index);
      }
    }

    // Optimistically update UI
    const newSelected = isSelected
      ? currentSelected.filter((id: string) => id !== itemId)
      : [...currentSelected, itemId];

    // Update local state immediately for better UX (fallback for old structure)
    if (user && !usePreferencesFlags) {
      // Update interests - maintain object structure if it exists, otherwise create new format
      const currentInterests = user.interests || [];
      let updatedInterests: typeof currentInterests;

      if (isSelected) {
        // Remove interest
        updatedInterests = currentInterests.filter((interest: any) => {
          if (typeof interest === 'object' && interest !== null) {
            return String(interest.interest_item_id || (interest as any).interest_item?.id || (interest as any).id) !== itemId;
          }
          return String(interest) !== itemId;
        });
      } else {
        // Add interest - find the item from appData to create proper structure
        if (interestItem) {
          if (category) {
            const newInterest = {
              id: `${itemId}`,
              user_id: user.id,
              interest_item_id: itemId,
              interest_item: {
                id: itemId,
                interest_id: category.id,
                name: { [defaultLanguage]: interestItem.name } as Record<string, string>,
                emoji: interestItem.emoji,
                interest: {
                  id: category.id,
                  name: { [defaultLanguage]: category.name } as Record<string, string>,
                },
              },
            };
            updatedInterests = [...currentInterests, newInterest as NonNullable<ProfileUser['interests']>[number]];
          } else {
            updatedInterests = currentInterests;
          }
        } else {
          updatedInterests = currentInterests;
        }
      }

      setUser({
        ...user,
        interests: updatedInterests,
      });
    }

    try {
      let response: ApiResponse | undefined;
      if (usePreferencesFlags && interestItem.bit_index !== undefined) {
        // Update preferences using updatePreferences API
        const isEnabled = isBitSet(newPreferencesFlags, interestItem.bit_index);
        const userId = (isEditMode && isAuthenticated && authUser) ? authUser.id : user?.id;
        if (userId) {
          response = (await api.updatePreferences(interestItem.id, interestItem.bit_index, isEnabled)) as ApiResponse;
        }
      } else {
        // Update via API using CMD_USER_UPDATE_INTEREST
        response = (await api.updateInterest({ interest_id: itemId })) as ApiResponse;
      }

      if (usePreferencesFlags && response?.user && !hasPreferenceState(response.user)) {
        response = { ...response, user: { ...response.user, preferences_flags: serializePreferencesFlags(newPreferencesFlags), selected_preference_bits: selectedPreferenceBits(newPreferencesFlags) } };
      }

      // Update auth context - use response if available, otherwise use local state
      if (isAuthenticated && authUser) {
        if (response?.user) {
          updateUser(response.user);
          // Update local user state from response
          if (user && (authUser.id === user.id || authUser.username === user.username)) {
            setUser(response.user);
          }
        } else if (usePreferencesFlags && interestItem.bit_index !== undefined) {
          // Update preferences_flags in user data from response
          if (response?.user) {
            updateUser(response.user);
            if (user && (authUser.id === user.id || authUser.username === user.username)) {
              setUser(response.user);
            }
          } else {
            // Fallback: update from newPreferencesFlags
            const flagsString = serializePreferencesFlags(newPreferencesFlags);
            const updatedUserData: ProfileUser = {
              ...authUser,
              preferences_flags: flagsString,
              selected_preference_bits: selectedPreferenceBits(newPreferencesFlags),
            };
            updateUser(updatedUserData);
            if (user && (authUser.id === user.id || authUser.username === user.username)) {
              setUser(updatedUserData);
            }
          }
        } else if (user && (authUser.id === user.id || authUser.username === user.username)) {
          // Fallback to local state update
          updateUser({
            ...authUser,
            interests: newSelected,
          });
        }
      }
    } catch (err: unknown) {
      console.error('Error updating interests:', err);

      // Revert optimistic update on error
      if (user) {
        // Revert to previous interests state (before the change)
        // We need to restore the original interests array
        // For now, just refresh from authUser if available
        if (isAuthenticated && authUser && (authUser as ProfileUser).interests) {
          setUser({
            ...user,
            interests: (authUser as ProfileUser).interests,
          });
        } else {
          // Fallback: remove the last added item if we added, or re-add if we removed
          const currentInterests = user.interests || [];
          if (isSelected) {
            // We removed it, so re-add it
            const interestItem = Object.values(interestOptions).flat().find(item => item.id === itemId);
            if (interestItem) {
              const category = interestCategories.find(cat =>
                interestOptions[cat.id]?.some(item => item.id === itemId)
              );
              if (category) {
                const restoredInterest = {
                  id: `${itemId}`,
                  user_id: user.id,
                  interest_item_id: itemId,
                  interest_item: {
                    id: itemId,
                    interest_id: category.id,
                    name: { [defaultLanguage]: interestItem.name } as Record<string, string>,
                    emoji: interestItem.emoji,
                    interest: {
                      id: category.id,
                      name: { [defaultLanguage]: category.name } as Record<string, string>,
                    },
                  },
                };
                setUser({
                  ...user,
                  interests: [...currentInterests, restoredInterest as any],
                });
              }
            }
          } else {
            // We added it, so remove it
            setUser({
              ...user,
              interests: currentInterests.filter((interest: any) => {
                if (typeof interest === 'object' && interest !== null) {
                  return String(interest.interest_item_id || interest.interest_item?.id || interest.id) !== itemId;
                }
                return String(interest) !== itemId;
              }),
            });
          }
        }
      }

      // Set error message - will be displayed in the error section (doesn't cause screen to disappear)
      const errorMessage = (err as any)?.response?.data?.message || (err as any)?.message || 'Failed to update interests';
      setError(errorMessage);
    } finally {
      preferenceMutationRef.current = false;
      setUpdatingInterests(false);
    }
  };



  const handleFantasyItemToggle = async (fantasyId: string) => {
    if (!isOwnProfile || !isAuthenticated || preferenceMutationRef.current) return;
    preferenceMutationRef.current = true;
    const currentSelected = userSelectedFantasyIds || [];
    const isSelected = currentSelected.includes(fantasyId);

    setUpdatingFantasies(true);
    setError(null); // Clear previous errors

    // Find the fantasy item to get bit_index
    const fantasyItem = Object.values(fantasyOptions).flat().find(item => item.id === fantasyId);
    const usePreferencesFlags = fantasyItem?.bit_index !== undefined;

    // Find category to check allow_multiple
    const categoryId = Object.keys(fantasyOptions).find((id) =>
      fantasyOptions[id]?.some((item) => item.id === fantasyId)
    );
    const category = categoryId ? fantasyCategories.find((cat) => cat.id === categoryId) : undefined;
    const allowMultiple = normalizeAllowMultiple(category?.allow_multiple)
      ?? normalizeAllowMultiple(categoryId ? fantasyAllowMultiple[categoryId] : undefined)
      ?? true;

    // Update preferences_flags if using new structure
    let newPreferencesFlags = preferencesFlags;
    if (usePreferencesFlags && fantasyItem?.bit_index !== undefined) {
      if (allowMultiple) {
        // Toggle bit for multiple selection
        newPreferencesFlags = toggleBit(newPreferencesFlags, fantasyItem.bit_index);
      } else {
        // Single selection: clear all bits for this category first, then set the new one
        if (categoryId && fantasyOptions[categoryId]) {
          fantasyOptions[categoryId].forEach((opt) => {
            if (opt.bit_index !== undefined) {
              newPreferencesFlags = unsetBit(newPreferencesFlags, opt.bit_index);
            }
          });
        }
        // Set the selected bit
        if (!isSelected) newPreferencesFlags = setBit(newPreferencesFlags, fantasyItem.bit_index);
      }
    }

    // Optimistically update preferences_flags in user state for immediate UI feedback
    if (usePreferencesFlags && fantasyItem?.bit_index !== undefined) {
      const flagsString = serializePreferencesFlags(newPreferencesFlags);
      const userToUpdate = userToCheck;
      if (userToUpdate) {
        const updatedUserData = {
          ...userToUpdate,
          preferences_flags: flagsString,
          selected_preference_bits: selectedPreferenceBits(newPreferencesFlags),
        };

        // Update auth context if it's the auth user
        if (isAuthenticated && authUser && (authUser.id === (userToUpdate as any).id || authUser.username === (userToUpdate as any).username)) {
          updateUser(updatedUserData as any);
        }

        // Update local user state
        if (user && (user.id === (userToUpdate as any).id || user.username === (userToUpdate as any).username)) {
          setUser(updatedUserData as any);
        }
      }
    }

    // Update local state immediately for better UX (fallback for old structure)
    if (user && !usePreferencesFlags) {
      const currentFantasies = user.fantasies || [];
      if (isSelected) {
        // Remove fantasy
        setUser({
          ...user,
          fantasies: currentFantasies.filter(f => ((f as any).fantasy_id || (f as any).id) !== fantasyId),
        });
      } else {
        // Add fantasy - create UserFantasy object
        const fantasy = (appData as any)?.fantasies?.find((f: any) => f.id === fantasyId);
        if (fantasy) {
          const newFantasy = {
            id: `${fantasyId}`,
            user_id: user.id,
            fantasy_id: fantasyId,
            fantasy: {
              id: fantasy.id,
              slug: fantasy.slug,
              category: fantasy.category,
              label: fantasy.label,
              description: fantasy.description,
            },
          };
          setUser({
            ...user,
            fantasies: [...currentFantasies, newFantasy as any],
          });
        }
      }
    }

    try {
      let response: { user?: ProfileUser; target_user?: ProfileUser; followee?: ProfileUser; posts?: unknown[]; medias?: unknown[];[key: string]: unknown } | undefined;
      if (usePreferencesFlags && fantasyItem.bit_index !== undefined) {
        // Update preferences using updatePreferences API
        const isEnabled = isBitSet(newPreferencesFlags, fantasyItem.bit_index);
        const userId = (isEditMode && isAuthenticated && authUser) ? authUser.id : user?.id;
        if (userId) {
          response = (await api.updatePreferences(fantasyItem.id, fantasyItem.bit_index, isEnabled)) as any;
        }
      } else {
        // Update via API using CMD_USER_UPDATE_FANTASY
        response = (await api.updateFantasy({ fantasy_id: fantasyId })) as any;
      }

      if (usePreferencesFlags && response?.user && !hasPreferenceState(response.user)) {
        response = { ...response, user: { ...response.user, preferences_flags: serializePreferencesFlags(newPreferencesFlags), selected_preference_bits: selectedPreferenceBits(newPreferencesFlags) } };
      }

      // Update auth context - use response if available, otherwise use local state
      if (isAuthenticated && authUser) {
        if (response?.user) {
          updateUser(response.user as any);
          // Update local user state from response
          if (user && (authUser.id === user.id || authUser.username === user.username)) {
            setUser(response.user as any);
          }
        } else if (usePreferencesFlags && (fantasyItem as any).bit_index !== undefined) {
          // Response might not have user, but we already updated optimistically
          // Just ensure preferences_flags is in sync
          if (response?.user) {
            updateUser(response.user as any);
            if (user && (authUser.id === user.id || authUser.username === user.username)) {
              setUser(response.user as any);
            }
          }
          // If no response.user, optimistic update already handled it above
        } else if (user && (authUser.id === user.id || authUser.username === user.username)) {
          // Fallback to local state update
          updateUser({
            ...authUser,
            fantasies: (user as any).fantasies,
          } as any);
        }
      }
    } catch (err: unknown) {
      console.error('Error updating fantasies:', err);

      // Revert optimistic update on error
      if (usePreferencesFlags && fantasyItem?.bit_index !== undefined) {
        // Revert preferences_flags
        const userToRevert = userToCheck;
        if (userToRevert) {
          const originalFlagsString = (userToRevert as any)?.preferences_flags || '';
          const revertedUserData = {
            ...userToRevert,
            preferences_flags: originalFlagsString,
          };

          if (isAuthenticated && authUser && (authUser.id === (userToRevert as any).id || authUser.username === (userToRevert as any).username)) {
            updateUser(revertedUserData as any);
          }

          if (user && (user.id === (userToRevert as any).id || user.username === (userToRevert as any).username)) {
            setUser(revertedUserData as any);
          }
        }
      } else if (user) {
        const currentFantasies = user.fantasies || [];
        if (isSelected) {
          // Re-add fantasy if we removed it
          const fantasy = appData?.fantasies?.find(f => f.id === fantasyId);
          if (fantasy) {
            const restoredFantasy = {
              id: `${fantasyId}`,
              user_id: user.id,
              fantasy_id: fantasyId,
              fantasy: {
                id: fantasy.id,
                slug: fantasy.slug as string,
                category: fantasy.category as any,
                label: fantasy.label as any,
                description: fantasy.description as any,
              },
            };
            setUser({
              ...user,
              fantasies: [...currentFantasies, restoredFantasy as any],
            });
          }
        } else {
          // Remove fantasy if we added it
          setUser({
            ...user,
            fantasies: currentFantasies.filter(f => ((f as any).fantasy_id || (f as any).id) !== fantasyId),
          });
        }
      }

      // Set error message - will be displayed in the error section (doesn't cause screen to disappear)
      const errorMessage = (err as any)?.response?.data?.message || (err as any)?.message || 'Failed to update fantasies';
      setError(errorMessage);
    } finally {
      preferenceMutationRef.current = false;
      setUpdatingFantasies(false);
    }
  };

  // Initialize edit form when edit mode opens (only for non-attribute fields)
  useEffect(() => {
    if (!isEditMode) {
      resetPasswordForm();
      // Reset ref when exiting edit mode
      isEditModeRef.current = false;
      return;
    }

    // Already initialized for this edit session; avoid collapsing expanded sections
    // on every user state update after each selection/save.
    if (isEditModeRef.current) {
      return;
    }

    resetPasswordForm();
    setEditTab('profile');
    isEditModeRef.current = true;

    // Reset image previews
    setProfileImagePreview(null);
    setCoverImagePreview(null);
    // Reset attribute view
    setSelectedField(null);
    // Reset interest view
    setSelectedInterestCategory(null);
    // Reset fantasy view
    setSelectedFantasyCategory(null);

    // Initialize form data if user is available
    if (user) {
      const normalizedDateOfBirth = getPreferredDateOfBirthForEdit();
      setEditFormData({
        username: user.username,
        displayname: user.displayname,
        email: user.email || '',
        bio: getPreferredBioForEdit(),
        website: user.website || '',
        languages: user.languages || [],
        date_of_birth: normalizedDateOfBirth || undefined,
        privacy_level: (user as any).privacy_level || PrivacyLevel.Public,
        location: getPreferredLocationForEdit() || undefined,
      } as any);
      setIsBirthdateSectionOpen(Boolean(normalizedDateOfBirth));
    }
  }, [isEditMode, resetPasswordForm, user, getPreferredDateOfBirthForEdit, getPreferredBioForEdit, getPreferredLocationForEdit]); // user is needed for first-time initialization

  // Update form data when user changes (but don't reset tab or other states)
  useEffect(() => {
    if (isEditMode && user && isEditModeRef.current) {
      // Only update if we're already in edit mode (ref is true)
      const normalizedDateOfBirth = getPreferredDateOfBirthForEdit();
      setEditFormData({
        username: user.username,
        displayname: user.displayname,
        email: user.email || '',
        bio: getPreferredBioForEdit(),
        website: user.website || '',
        languages: user.languages || [],
        date_of_birth: normalizedDateOfBirth || undefined,
        privacy_level: user.privacy_level || PrivacyLevel.Public,
        location: getPreferredLocationForEdit() || undefined,
      } as any);
      setIsBirthdateSectionOpen(Boolean(normalizedDateOfBirth));
    }
  }, [isEditMode, user, user?.displayname, user?.bio, user?.website, user?.languages, user?.date_of_birth, user?.privacy_level, user?.username, getPreferredDateOfBirthForEdit, getPreferredBioForEdit, getPreferredLocationForEdit]);

  const applyUploadedProfileMedia = (
    response: unknown,
    kind: 'avatar' | 'cover'
  ): { applied: boolean; imageUrl: string | null } => {
    const responseUser = extractUserFromUploadResponse(response);
    const attachment = extractUploadAttachment(response, kind);
    const variants = kind === 'avatar'
      ? ['icon', 'thumbnail', 'small', 'medium', 'large', 'original']
      : ['large', 'medium', 'original', 'small', 'thumbnail'];
    const responseUserImageUrl = responseUser
      ? kind === 'avatar'
        ? resolveImageAttachmentUrl(responseUser.avatar, variants) ||
          (typeof responseUser.profile_image_url === 'string' && responseUser.profile_image_url.trim()
            ? responseUser.profile_image_url.trim()
            : null)
        : resolveImageAttachmentUrl(responseUser.cover, variants) ||
          resolveImageAttachmentUrl(responseUser.cover_image, variants) ||
          (typeof responseUser.cover_image_url === 'string' && responseUser.cover_image_url.trim()
            ? responseUser.cover_image_url.trim()
            : null)
      : null;
    const attachmentImageUrl = resolveImageAttachmentUrl(attachment, variants);
    const imageUrl = attachmentImageUrl || responseUserImageUrl;
    const hasMediaUpdate = Boolean(responseUser || attachment || imageUrl);

    if (!hasMediaUpdate) {
      return { applied: false, imageUrl: null };
    }

    const nextUserPayload: Partial<ProfileUser> = {
      ...((user || authUser || {}) as Partial<ProfileUser>),
      ...(responseUser || {}),
    };

    if (kind === 'avatar') {
      if (attachment) {
        nextUserPayload.avatar = attachment as ProfileUser['avatar'];
      }
      if (imageUrl) {
        nextUserPayload.profile_image_url = imageUrl;
      }
    } else {
      if (attachment) {
        nextUserPayload.cover = attachment as ProfileUser['cover'];
      }
      if (imageUrl) {
        nextUserPayload.cover_image_url = imageUrl;
      }
    }

    const normalizedUser = normalizeProfileUser(nextUserPayload);
    if (!normalizedUser) {
      return { applied: false, imageUrl };
    }

    setUser(normalizedUser);
    if (isOwnProfile && authUser) {
      updateUser(normalizedUser as any);
    }

    return { applied: true, imageUrl };
  };

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadingProfileImage(true);
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Immediately upload the image using CMD_USER_UPLOAD_AVATAR
      try {
        const response = await api.uploadAvatar({ avatar: file }) as any;
        let uploadResult = applyUploadedProfileMedia(response, 'avatar');

        if (!uploadResult.applied) {
          const refreshedUser = await api.getUserInfo();
          uploadResult = applyUploadedProfileMedia(refreshedUser, 'avatar');
        }

        if (!uploadResult.applied) {
          throw new Error('Profile image uploaded, but updated profile data was not returned');
        }

        if (uploadResult.imageUrl) {
          setProfileImagePreview(uploadResult.imageUrl);
        }
      } catch (err: any) {
        console.error('Error uploading profile image:', err);
        setError(err.response?.data?.message || err.message || 'Failed to upload profile image');
      } finally {
        setUploadingProfileImage(false);
        if (profileImageInputRef.current) {
          profileImageInputRef.current.value = '';
        }
      }
    }
  };

  const handleCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadingCoverImage(true);
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Immediately upload the image using CMD_USER_UPLOAD_COVER
      try {
        const response = await api.uploadCover({ cover: file }) as any;
        let uploadResult = applyUploadedProfileMedia(response, 'cover');

        if (!uploadResult.applied) {
          const refreshedUser = await api.getUserInfo();
          uploadResult = applyUploadedProfileMedia(refreshedUser, 'cover');
        }

        if (!uploadResult.applied) {
          throw new Error('Cover image uploaded, but updated profile data was not returned');
        }

        if (uploadResult.imageUrl) {
          setCoverImagePreview(uploadResult.imageUrl);
        }
      } catch (err: any) {
        console.error('Error uploading cover image:', err);
        setError(err.response?.data?.message || err.message || 'Failed to upload cover image');
      } finally {
        setUploadingCoverImage(false);
        if (coverImageInputRef.current) {
          coverImageInputRef.current.value = '';
        }
      }
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    if (uploadingProfileImage || uploadingCoverImage) {
      setError(t('profile.image_upload_in_progress', { defaultValue: 'Image upload is still in progress. Please wait.' }));
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      // Backend expects multipart form fields (including location[...]),
      // so always use FormData for profile update payload.
      const formData = new FormData();
      const appendScalarField = (key: string, value: unknown) => {
        if (value === undefined || value === null) return;
        if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
          return;
        }
        formData.append(key, String(value));
      };
      const appendLocationField = (key: string, value: unknown) => {
        if (value === undefined || value === null) return;
        const normalized = String(value).trim();
        if (!normalized) return;
        formData.append(`location[${key}]`, normalized);
      };
      const getFiniteNumber = (...values: unknown[]): number | undefined => {
        for (const value of values) {
          if (typeof value === 'number' && Number.isFinite(value)) {
            return value;
          }
          if (typeof value === 'string' && value.trim() !== '') {
            const parsed = Number(value);
            if (Number.isFinite(parsed)) {
              return parsed;
            }
          }
        }
        return undefined;
      };

      // Add regular profile fields (exclude nested location object)
      Object.entries(editFormData).forEach(([key, value]) => {
        if (key === 'location') return;
        if (value === undefined || value === null) return;
        appendScalarField(key, value);
      });

      // Add location fields as backend expects: location[...]
      const locationValue = editFormData.location as unknown;
      if (locationValue !== undefined && locationValue !== null) {
        if (typeof locationValue === 'string') {
          appendLocationField('display', locationValue);
          appendLocationField('address', locationValue);
        } else if (typeof locationValue === 'object') {
          const locationObj = locationValue as Record<string, unknown>;
          const locationPoint = (locationObj.location_point || null) as { lat?: unknown; lng?: unknown } | null;
          const coordinates = Array.isArray(locationObj.coordinates) ? locationObj.coordinates : [];
          const latitude = getFiniteNumber(
            locationObj.latitude,
            locationObj.lat,
            locationPoint?.lat,
            coordinates[1]
          );
          const longitude = getFiniteNumber(
            locationObj.longitude,
            locationObj.lng,
            locationPoint?.lng,
            coordinates[0]
          );

          appendLocationField('contentable_type', locationObj.contentable_type || 'users');
          appendLocationField('country_code', locationObj.country_code || locationObj.countryCode);
          appendLocationField('address', locationObj.address || locationObj.formatted_address || locationObj.display_name);
          appendLocationField('city', locationObj.city);
          appendLocationField('country', locationObj.country || locationObj.country_name);
          appendLocationField('region', locationObj.region);
          appendLocationField('timezone', locationObj.timezone);
          appendLocationField('display', locationObj.display || locationObj.display_name || locationObj.formatted_address || locationObj.address);
          appendLocationField('latitude', latitude);
          appendLocationField('longitude', longitude);
        }
      }

      const response: { user?: ProfileUser; target_user?: ProfileUser; followee?: ProfileUser; posts?: unknown[]; medias?: unknown[];[key: string]: unknown } | undefined = (await api.updateProfile(formData as any)) as any;

      // Update local user state from API response if available
      if (response?.user) {
        const normalizedUser = normalizeProfileUser(response.user);
        if (normalizedUser) {
          setUser(normalizedUser);

          // Update auth context user if it's the same user
          if (isOwnProfile && authUser) {
            updateUser(response.user as any);
          }
        }
      } else {
        // Fallback: Update local user state from editFormData
        const updatedUser = {
          ...user,
          ...editFormData,
          profile_image_url: profileImagePreview || user.profile_image_url,
          cover_image_url: coverImagePreview || user.cover_image_url,
        };
        setUser(updatedUser);

        // Update auth context user if it's the same user
        if (isOwnProfile && authUser) {
          // Filter out location string, only keep valid User fields
          const { location: updatedLocation, ...restEditData } = editFormData;
          updateUser({
            ...restEditData as any,
            ...(updatedLocation !== undefined ? { location: updatedLocation } : {}),
            profile_image_url: profileImagePreview || authUser.profile_image_url,
            ...(coverImagePreview && { cover_image_url: coverImagePreview }),
          } as any);
        }
      }

      closeProfileEditMode({ replace: true });
    } catch (err: unknown) {
      console.error('Error updating profile:', err);
      setError((err as any).response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  // Track last fetched username to prevent unnecessary refetches
  const lastFetchedUsernameRef = useRef<string | null>(null);

  // Hard-lock edit mode to own profile route. If user navigates to another profile while editing,
  // immediately redirect back to own profile and keep editing state on the owner.
  useEffect(() => {
    if (!isEditMode || !isAuthenticated || !authUser) {
      return;
    }
    if (isViewingOwnProfileRoute) {
      return;
    }
    navigate(`/${authUser.username}`, { replace: true });
  }, [isEditMode, isAuthenticated, authUser, isViewingOwnProfileRoute, navigate]);

  // Reset last fetched username when username prop changes
  useEffect(() => {
    if (lastFetchedUsernameRef.current !== username) {
      lastFetchedUsernameRef.current = null;
    }
  }, [username]);

  // Update user from authUser when viewing own profile and authUser updates
  useEffect(() => {
    if (!username || !isAuthenticated || !authUser) {
      return;
    }

    if (!isViewingOwnProfileRoute) {
      return;
    }

    // Only update if we're viewing own profile
    const followerCount =
      authUser?.engagements?.counts?.follower_count ??
      authUser?.followers_count ??
      0;
    const followingCount =
      authUser?.engagements?.counts?.following_count ??
      authUser?.following_count ??
      0;

    setUser({
      ...authUser,
      followers_count: followerCount,
      following_count: followingCount,
    });
    setLoading(false);
    lastFetchedUsernameRef.current = username;
  }, [username, isAuthenticated, authUser, isViewingOwnProfileRoute]);

  // Fetch user data from API (only for other users' profiles)
  useEffect(() => {
    const fetchUserData = async () => {
      if (!username) {
        return;
      }

      // Never fetch another user's profile while editing; edit screen must stay on owner profile.
      if (isEditMode) {
        return;
      }

      // Skip if viewing own profile (handled by separate useEffect above)
      if (isViewingOwnProfileRoute) {
        return;
      }

      // Skip if we already fetched this username
      if (lastFetchedUsernameRef.current === username) {
        return;
      }

      console.log('ProfileScreen - fetchUserData called, username:', username);

      try {
        setLoading(true);
        setError(null);

        console.log('ProfileScreen - Fetching profile for username:', username);
        const requestBody = { nickname: username };
        console.log('ProfileScreen - Request body:', requestBody);

        const response = await api.fetchProfileByNickname(username);

        console.log('ProfileScreen - API response:', response);

        // Handle different response structures
        const userData = (response as any)?.user || response;

        if (!userData) {
          throw new Error('User not found');
        }

        const followerCountFromEngagements =
          userData.engagements?.counts?.follower_count ??
          userData.followers_count ??
          0;
        const followingCountFromEngagements =
          userData.engagements?.counts?.following_count ??
          userData.following_count ??
          0;

        const normalizedUserData = {
          ...userData,
          profile_image_url: (userData as any).avatar?.file?.url || (userData as any).profile_image_url || undefined,
          cover_image_url: getSafeImageURL((userData as any).cover, 'large') || getSafeImageURL((userData as any).cover_image, 'large') || (userData as any).cover_image_url || undefined,
          followers_count: followerCountFromEngagements,
          following_count: followingCountFromEngagements,
        };

        console.log('ProfileScreen - Normalized user data:', normalizedUserData);

        setUser(normalizedUserData as ProfileUser);
        lastFetchedUsernameRef.current = username;
      } catch (err: any) {
        console.error('Error fetching user:', err);
        const errorMessage = (err as any)?.response?.data?.message || (err as any)?.message || 'Failed to load profile';
        setError(errorMessage);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchUserData();
    }
  }, [username, authUser, isAuthenticated, isEditMode, isViewingOwnProfileRoute, setUser, setError, setLoading]); // Removed api, added authUser and isAuthenticated

  useEffect(() => {
    if (canViewActivityTabs || activeTab === 'profile' || (isAuthenticated && activeTab === 'photos')) {
      return;
    }
    setActiveTab('profile');
  }, [canViewActivityTabs, activeTab, isAuthenticated]);

  // Fetch posts based on active tab
  useEffect(() => {
    const fetchUserPosts = async () => {
      // Don't fetch if on profile tab or privacy does not allow activity visibility
      if (!['posts', 'replies', 'likes'].includes(activeTab) || !canViewActivityTabs) {
        setPosts([]);
        setPostsLoading(false);
        return;
      }

      try {
        setPostsLoading(true);
        setError(null);

        let response: { user?: ProfileUser; target_user?: ProfileUser; followee?: ProfileUser; posts?: unknown[]; medias?: unknown[];[key: string]: unknown } | undefined;

        if (activeTab === 'posts') {
          // Fetch user posts
          response = (await api.fetchUserPosts({
            user_id: user?.public_id,
            limit: 20,
            cursor: ""
          })) as any;
        } else if (activeTab === 'replies') {
          // Fetch user replies
          response = (await api.fetchUserPostReplies({
            user_id: user?.public_id,
            limit: 20,
            cursor: ""
          })) as any;
        } else if (activeTab === 'likes') {
          // Fetch user liked posts
          response = (await api.fetchUserPostLikes({
            user_id: user?.public_id,
            limit: 20,
            cursor: ""
          })) as any;
        }

        // Set posts from API response
        if (response && (response as any).posts) {
          setPosts((response as any).posts);
        } else if (response && Array.isArray(response)) {
          setPosts(response);
        } else {
          setPosts([]);
        }
      } catch (err: any) {
        console.error('Error fetching posts:', err);
        setError((err as any).response?.data?.message || 'Failed to load posts');
        setPosts([]);
      } finally {
        setPostsLoading(false);
      }
    };

    if (['posts', 'replies', 'likes'].includes(activeTab) && canViewActivityTabs) {
      fetchUserPosts();
    } else if (!canViewActivityTabs) {
      setPosts([]);
    }
  }, [activeTab, user, canViewActivityTabs, setError, setPostsLoading, setPosts]);

  // Fetch medias when media tab is active
  useEffect(() => {
    const fetchUserMedias = async () => {
      if (activeTab !== 'media' || !canViewActivityTabs) {
        setMedias([]);
        setMediasLoading(false);
        return;
      }

      try {
        setMediasLoading(true);
        setError(null);

        const response = await api.fetchUserPostMedia({
          user_id: user?.public_id,
          limit: 50,
          cursor: ""
        });

        // Set medias from API response
        let allMedias: unknown[] = [];

        if (response && (response as any).medias) {
          allMedias = (response as any).medias;
        } else if (response && Array.isArray(response)) {
          allMedias = response;
        } else {
          allMedias = [];
        }

        // Filter only post medias (exclude stories, avatars, covers, etc.)
        const postMedias = allMedias.filter((media: any) => (media as any).role === 'post');

        setMedias(postMedias as any);
      } catch (err: any) {
        console.error('Error fetching medias:', err);
        setError((err as any).response?.data?.message || 'Failed to load medias');
        setMedias([]);
      } finally {
        setMediasLoading(false);
      }
    };

    if (activeTab === 'media' && canViewActivityTabs) {
      fetchUserMedias();
    } else if (!canViewActivityTabs) {
      setMedias([]);
    }
  }, [activeTab, user, canViewActivityTabs, setError, setMediasLoading, setMedias]);

  const handleFollowClick = async () => {
    if (!authUser) {
      setShowAuthWizard(true);
      return;
    }
    if (!user?.public_id || followRequestRef.current || needsFollowDetails) return;

    const targetUser = user;
    const viewerId = authUser.id;
    const wasFollowing = isFollowing;
    const currentFollowers = targetUser.followers_count ?? targetUser.engagements?.counts?.follower_count ?? 0;
    const countFor = (following: boolean) => currentFollowers + Number(following) - Number(wasFollowing);
    const isCurrentProfile = () => currentFollowContext.current.username === username && currentFollowContext.current.viewerId === viewerId;
    const applyFollowing = (following: boolean) => {
      if (!isCurrentProfile()) return;
      setUser(previous => previous?.id === targetUser.id
        ? withFollowerCount({ ...previous, is_following: following }, countFor(following))
        : previous);
    };

    followRequestRef.current = true;
    setIsFollowPending(true);
    setFollowError(false);
    applyFollowing(!wasFollowing);
    try {
      const response = await api.toggleFollow({ followee_id: targetUser.public_id }) as { status: boolean; user?: ProfileUser };
      if (typeof response.status !== 'boolean') throw new Error('Missing follow status');
      applyFollowing(response.status);
      if (currentFollowContext.current.viewerId === viewerId && response.user?.id === viewerId) {
        updateUser(response.user as unknown as Parameters<typeof updateUser>[0]);
      }
    } catch {
      applyFollowing(wasFollowing);
      if (isCurrentProfile()) setFollowError(true);
    } finally {
      followRequestRef.current = false;
      setIsFollowPending(false);
    }
  };

  const handleSendMessage = async (profile: any) => {
    if (!canViewSensitiveProfileSections && !isOwnProfile) {
      return;
    }
    if (!authUser?.id || !profile?.id) {
      console.error('User or profile ID is missing');
      return;
    }

    try {
      const chatResponse = await api.createChat([profile.id], 'private') as any;

      const chatId = chatResponse?.chat?.id;

      if (chatId) {
        navigate('/messages', {
          state: {
            openChat: chatId,
            userId: profile.id,
            publicId: profile.public_id,
            username: profile.username,
          },
        });
      } else {
        console.error('Chat creation failed - no chat ID returned');
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      navigate('/messages', {
        state: {
          openChat: profile.username || profile.id,
          userId: profile.id,
          publicId: profile.public_id,
        },
      });
    }
  };

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = defaultLanguage === 'tr' ? 'tr-TR' : 'en-US';
    return `${t('profile.joined')} ${date.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}`;
  };

  if (loading) {
    return (
      <div className="h-full min-h-0 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center gap-4"
        >
          <div className={`w-16 h-16 border-4 ${theme === 'dark' ? 'border-white/10 border-t-brand' : 'border-brand border-t-brand-hovered'} rounded-full animate-spin`} />
          <p className={`text-base font-medium ${theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'}`}>
            {t('profile.loading_profile')}
          </p>
        </motion.div>
      </div>
    );
  }

  // If trying to view own profile without login, show auth wizard
  if ((!username || username === 'profile') && !isAuthenticated) {
    return (
      <div className="skyline-page-scroll w-full">
        <div className="flex min-h-full items-center justify-center px-4 py-24 md:py-28">
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

  if (!user) {
    return (
      <div className="h-full min-h-0 flex items-center justify-center">
        <div className={`text-center ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>
          {t('profile.user_not_found')}
        </div>
      </div>
    );
  }

  const followerCountDisplay =
    user.followers_count ??
    user.engagements?.counts?.follower_count ??
    0;
  const followingCountDisplay =
    user.following_count ??
    user.engagements?.counts?.following_count ??
    0;
  const blockingCountDisplay =
    user.blocking_count ??
    user.engagements?.counts?.blocking_count ??
    0;
  const blockedByCountDisplay =
    user.blocked_by_count ??
    user.engagements?.counts?.blocked_by_count ??
    0;
  const likeGivenCountDisplay =
    user.like_given_count ??
    user.engagements?.counts?.like_given_count ??
    0;
  const likeReceivedCountDisplay =
    user.like_received_count ??
    user.engagements?.counts?.like_received_count ??
    0;
  const dislikeGivenCountDisplay =
    user.dislike_given_count ??
    user.engagements?.counts?.dislike_given_count ??
    0;
  const dislikeReceivedCountDisplay =
    user.dislike_received_count ??
    user.engagements?.counts?.dislike_received_count ??
    0;
  const matchCountDisplay =
    user.match_count ??
    user.engagements?.counts?.match_count ??
    0;
  const viewReceivedCountDisplay =
    user.view_received_count ??
    user.profile_views_count ??
    user.engagements?.counts?.view_received_count ??
    0;

  const followersLabel = t('profile.followers', { defaultValue: 'Followers' });
  const followingLabel = t('profile.following', { defaultValue: 'Following' });
  const blockingLabel = t('profile.blocking', { defaultValue: 'Blocking' });
  const blockedByLabel = t('profile.blocked_by', { defaultValue: 'Blocked by' });
  const likeGivenLabel = t('profile.like_given', { defaultValue: 'Likes given' });
  const likeReceivedLabel = t('profile.like_received', { defaultValue: 'Likes received' });
  const dislikeGivenLabel = t('profile.dislike_given', { defaultValue: 'Dislikes given' });
  const dislikeReceivedLabel = t('profile.dislike_received', { defaultValue: 'Dislikes received' });
  const matchLabel = t('profile.matches', { defaultValue: 'Matches' });
  const viewReceivedLabel = t('profile.views_received', { defaultValue: 'Profile views' });
  const shouldLockPremiumEngagements = premiumFeatureEnabled && !isPremiumUser;
  const isPremiumOnlyEngagement = (
    type: 'followers' | 'followings' | 'blocking' | 'blocked_by' | 'like_given' | 'like_received' | 'dislike_given' | 'dislike_received' | 'matched' | 'view_received'
  ) => type !== 'followers' && type !== 'followings';

  const handleEngagementNavigate = (type: 'followers' | 'followings' | 'blocking' | 'blocked_by' | 'like_given' | 'like_received' | 'dislike_given' | 'dislike_received' | 'matched' | 'view_received') => {
    if (!user) {
      return;
    }
    if (!canViewSensitiveProfileSections && !isOwnProfile) {
      return;
    }
    if (shouldLockPremiumEngagements && isPremiumOnlyEngagement(type)) {
      navigate('/premium');
      return;
    }

    navigate(`/${user.username}/${type}`, {
      state: {
        returnTo: `${location.pathname}${location.search || ''}`,
        profileSummary: {
          id: user.id,
          public_id: user.public_id,
          username: user.username,
          displayname: user.displayname,
          avatar: user.avatar ?? null,
        },
      },
    });
  };

  const handleMatchNavigate = () => {
    if (!isOwnProfile) return;
    handleEngagementNavigate('matched');
  };

  const engagementItems: ProfileEngagementItem[] = [
    {
      id: 'followings',
      label: followingLabel,
      value: followingCountDisplay,
      icon: UserPlus,
      onClick: () => handleEngagementNavigate('followings'),
      visible: true,
      disabled: !canViewSensitiveProfileSections && !isOwnProfile,
    },
    {
      id: 'followers',
      label: followersLabel,
      value: followerCountDisplay,
      icon: Users,
      onClick: () => handleEngagementNavigate('followers'),
      visible: true,
      disabled: !canViewSensitiveProfileSections && !isOwnProfile,
    },
    {
      id: 'blocking',
      label: blockingLabel,
      value: blockingCountDisplay,
      icon: Shield,
      onClick: () => handleEngagementNavigate('blocking'),
      visible: canViewSensitiveProfileSections && (isOwnProfile || blockingCountDisplay > 0),
      requiresPremium: true,
    },
    {
      id: 'blocked_by',
      label: blockedByLabel,
      value: blockedByCountDisplay,
      icon: Lock,
      onClick: () => handleEngagementNavigate('blocked_by'),
      visible: canViewSensitiveProfileSections && (isOwnProfile || blockedByCountDisplay > 0),
      requiresPremium: true,
    },
    {
      id: 'like_given',
      label: likeGivenLabel,
      value: likeGivenCountDisplay,
      icon: ThumbsUp,
      onClick: () => handleEngagementNavigate('like_given'),
      visible: canViewSensitiveProfileSections && (isOwnProfile || likeGivenCountDisplay > 0),
      requiresPremium: true,
    },
    {
      id: 'like_received',
      label: likeReceivedLabel,
      value: likeReceivedCountDisplay,
      icon: Heart,
      onClick: () => handleEngagementNavigate('like_received'),
      visible: canViewSensitiveProfileSections && (isOwnProfile || likeReceivedCountDisplay > 0),
      requiresPremium: true,
    },
    {
      id: 'dislike_given',
      label: dislikeGivenLabel,
      value: dislikeGivenCountDisplay,
      icon: ThumbsDown,
      onClick: () => handleEngagementNavigate('dislike_given'),
      visible: canViewSensitiveProfileSections && (isOwnProfile || dislikeGivenCountDisplay > 0),
      requiresPremium: true,
    },
    {
      id: 'dislike_received',
      label: dislikeReceivedLabel,
      value: dislikeReceivedCountDisplay,
      icon: EyeOff,
      onClick: () => handleEngagementNavigate('dislike_received'),
      visible: canViewSensitiveProfileSections && (isOwnProfile || dislikeReceivedCountDisplay > 0),
      requiresPremium: true,
    },
    {
      id: 'matched',
      label: matchLabel,
      value: matchCountDisplay,
      icon: HeartHandshake,
      onClick: handleMatchNavigate,
      visible: canViewSensitiveProfileSections && (isOwnProfile || matchCountDisplay > 0),
      disabled: !isOwnProfile,
      requiresPremium: true,
    },
    {
      id: 'view_received',
      label: viewReceivedLabel,
      value: viewReceivedCountDisplay,
      icon: Eye,
      onClick: () => handleEngagementNavigate('view_received'),
      visible: canViewSensitiveProfileSections && (isOwnProfile || viewReceivedCountDisplay > 0),
      requiresPremium: true,
    },
  ];

  const visibleEngagementItems = engagementItems.filter((item) => item.visible);
  const userForAttributeProgress = isEditMode && isAuthenticated ? authUser : user;
  const isAttributeFieldFilled = (field: string): boolean => {
    const options = fieldOptions[field] || [];
    const usesPreferencesFlags = options.some((opt) => opt.bit_index !== undefined);

    if (usesPreferencesFlags) {
      return options.some((opt) => opt.bit_index !== undefined && isBitSet(preferencesFlags, opt.bit_index));
    }

    if (field === 'gender_identity') {
      const genderIdentities = (userForAttributeProgress as any)?.gender_identities || (userForAttributeProgress as any)?.sexual_identities?.gender_identities;
      const genderIdentity = genderIdentities?.[0] || (userForAttributeProgress as any)?.gender_identity;
      return Boolean(genderIdentity?.id || genderIdentity?.name);
    }

    if (field === 'sexual_orientation') {
      const sexualOrientations = (userForAttributeProgress as any)?.sexual_orientations || (userForAttributeProgress as any)?.sexual_identities?.sexual_orientations;
      const sexualOrientation = sexualOrientations?.[0] || (userForAttributeProgress as any)?.sexual_orientation;
      return Boolean(sexualOrientation?.id || sexualOrientation?.name);
    }

    if (field === 'sex_role') {
      const sexRole = (userForAttributeProgress as any)?.sexual_role || (userForAttributeProgress as any)?.sex_role || (userForAttributeProgress as any)?.sexual_identities?.sex_role;
      return Boolean(sexRole?.id || sexRole?.name);
    }

    const userAttribute = (userForAttributeProgress as any)?.user_attributes?.find((u: any) => u.category_type === field);
    if (userAttribute?.attribute?.name || userAttribute?.attribute_id) {
      return true;
    }

    if (field === 'relationship_status' && (userForAttributeProgress as any)?.relationship_status) {
      return true;
    }

    return false;
  };

  const profileTraitSelections: ProfilePreferenceSelection = Object.fromEntries(USER_ATTRIBUTES.map(item => {
                            // Get display value - use authUser if viewing own profile in edit context, otherwise use user
                            const userToCheck = (isOwnProfile && isAuthenticated && authUser) ? authUser : user;
                            let displayValue = '';
                            let hasValue = false;

                            // Get options for this field
                            const options = fieldOptions[item.field] || [];
                            const usePreferencesFlags = options.some(opt => opt.bit_index !== undefined);
                            const allowMultiple = normalizeAllowMultiple(fieldAllowMultiple[item.field]) ?? false;
                            let selectedOptions: Array<{ id: string; name: string; display_order: number; bit_index?: number; allow_multiple?: boolean }> = [];

                            // First check if using preferences_flags with bit_index
                            if (usePreferencesFlags && hasPreferencesFlags) {
                              // Find selected options from preferences_flags
                              selectedOptions = options.filter(opt =>
                                opt.bit_index !== undefined && isBitSet(preferencesFlags, opt.bit_index)
                              );

                              if (selectedOptions.length > 0) {
                                if (allowMultiple) {
                                  // Multiple selection: show all selected options
                                  displayValue = selectedOptions.map(opt => opt.name).join(', ');
                                } else {
                                  // Single selection
                                  displayValue = selectedOptions[0].name;
                                }
                                hasValue = true;
                              }
                            } else if (item.field === 'gender_identity') {
                              // Fallback to old structure
                              // Check both structures: direct array or nested in sexual_identities
                              const genderIdentities = (userToCheck as any)?.gender_identities || (userToCheck as any)?.sexual_identities?.gender_identities;
                              const genderIdentity = genderIdentities?.[0] || (userToCheck as any)?.gender_identity;
                              if (genderIdentity?.name) {
                                displayValue = genderIdentity.name[defaultLanguage] ||
                                  genderIdentity.name.en ||
                                  Object.values(genderIdentity.name as any)[0] || '';
                                hasValue = !!displayValue;
                              }
                            } else if (item.field === 'sexual_orientation') {
                              // Fallback to old structure
                              // Check both structures: direct array or nested in sexual_identities
                              const sexualOrientations = (userToCheck as any)?.sexual_orientations || (userToCheck as any)?.sexual_identities?.sexual_orientations;
                              const sexualOrientation = sexualOrientations?.[0] || (userToCheck as any)?.sexual_orientation;
                              if (sexualOrientation?.name) {
                                displayValue = sexualOrientation.name[defaultLanguage] ||
                                  sexualOrientation.name.en ||
                                  Object.values(sexualOrientation.name as any)[0] || '';
                                hasValue = !!displayValue;
                              }
                            } else if (item.field === 'sex_role') {
                              // Fallback to old structure
                              // Check multiple structures: sexual_role, sex_role, or nested in sexual_identities
                              const sexRole = (userToCheck as any)?.sexual_role || (userToCheck as any)?.sex_role || (userToCheck as any)?.sexual_identities?.sex_role;
                              if (sexRole?.name) {
                                displayValue = sexRole.name[defaultLanguage] ||
                                  sexRole.name.en ||
                                  Object.values(sexRole.name as any)[0] || '';
                                hasValue = !!displayValue;
                              }
                            } else {
                              // Regular attribute from user_attributes (fallback to old structure)
                              const currentUserAttribute = (userToCheck as any)?.user_attributes?.find(
                                (ua: any) => ua.category_type === item.field
                              );

                              if (currentUserAttribute?.attribute?.name) {
                                displayValue = currentUserAttribute.attribute.name[defaultLanguage] ||
                                  currentUserAttribute.attribute.name.en ||
                                  Object.values(currentUserAttribute.attribute.name as any)[0] || '';
                                hasValue = !!displayValue;
                              }

                              if (item.field === 'relationship_status' && !hasValue) {
                                displayValue = (userToCheck as any)?.relationship_status || '';
                                hasValue = !!displayValue;
                              }
                            }

                            return [item.field, selectedOptions.length ? selectedOptions : hasValue ? [{ id: options.find(option => option.name === displayValue)?.id || `legacy:${item.field}`, name: displayValue }] : []];
  }));
  const profileInterestSelections = resolveCatalogSelection(interestOptions, userSelectedInterestIds, userSelectedInterestsByCategory);
  const profileFantasySelections = resolveCatalogSelection(fantasyOptions, userSelectedFantasyIds, userSelectedFantasiesByCategory);
  const profilePreferencesBusy = updatingInterests || updatingFantasies || Object.values(updatingAttributes).some(Boolean);

  const attributeCompletionMap = USER_ATTRIBUTES.reduce((acc, attr) => {
    acc[attr.field] = isAttributeFieldFilled(attr.field);
    return acc;
  }, {} as Record<string, boolean>);
  const filledAttributeCount = Object.values(attributeCompletionMap).filter(Boolean).length;

  const selectedInterestsCountFromFlags = Object.values(userSelectedInterestsByCategory).reduce((sum, items) => sum + items.length, 0);
  const selectedInterestsFallbackCount = (() => {
    const interestsSource = (isOwnProfile && isAuthenticated && authUser) ? (authUser as any).interests : user?.interests;
    return interestsSource?.length || 0;
  })();
  const selectedInterestsCount = selectedInterestsCountFromFlags > 0 ? selectedInterestsCountFromFlags : selectedInterestsFallbackCount;

  const selectedFantasiesCountFromFlags = Object.values(userSelectedFantasiesByCategory).reduce((sum, items) => sum + items.length, 0);
  const selectedFantasiesFallbackCount = (() => {
    const fantasiesSource = (isOwnProfile && isAuthenticated && authUser) ? (authUser as any).fantasies : user?.fantasies;
    return fantasiesSource?.length || 0;
  })();
  const selectedFantasiesCount = selectedFantasiesCountFromFlags > 0 ? selectedFantasiesCountFromFlags : selectedFantasiesFallbackCount;

  const rawBioForWizard = (() => {
    if (typeof editFormData.bio === 'string' && editFormData.bio.trim()) {
      return editFormData.bio;
    }
    return getPreferredBioForEdit();
  })();

  const cleanBioForWizard = rawBioForWizard
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const locationForWizard = editFormData.location ?? getPreferredLocationForEdit() ?? user.location;
  const hasLocationForWizard = getLocationDisplay((locationForWizard ?? null) as UserLocation).trim().length > 0;

  const hasBirthdateForWizard = Boolean((editFormData.date_of_birth || user.date_of_birth || '').toString().trim());
  const hasAvatarForWizard = Boolean(profileImagePreview || getProfileImageUrl());
  const hasCoverForWizard = Boolean(coverImagePreview || getCoverImageUrl());

  const profileWizardSteps: Array<{
    id: ProfileWizardStepId;
    title: string;
    description: string;
    done: boolean;
    tab: 'profile' | 'attributes' | 'interests' | 'fantasies';
  }> = [
      {
        id: 'avatar',
        title: t('profile.wizard_step_avatar_title', { defaultValue: 'Add a profile photo' }),
        description: t('profile.wizard_step_avatar_desc', { defaultValue: 'Profiles with a clear photo get more profile views.' }),
        done: hasAvatarForWizard,
        tab: 'profile',
      },
      {
        id: 'cover',
        title: t('profile.wizard_step_cover_title', { defaultValue: 'Add a cover image' }),
        description: t('profile.wizard_step_cover_desc', { defaultValue: 'A complete profile header builds trust quickly.' }),
        done: hasCoverForWizard,
        tab: 'profile',
      },
      {
        id: 'bio',
        title: t('profile.wizard_step_bio_title', { defaultValue: 'Write a short bio' }),
        description: t('profile.wizard_step_bio_desc', { defaultValue: 'Tell people who you are in a few sentences.' }),
        done: cleanBioForWizard.length > 0,
        tab: 'profile',
      },
      {
        id: 'location',
        title: t('profile.wizard_step_location_title', { defaultValue: 'Set your location' }),
        description: t('profile.wizard_step_location_desc', { defaultValue: 'Location helps show better nearby matches.' }),
        done: hasLocationForWizard,
        tab: 'profile',
      },
      {
        id: 'birthdate',
        title: t('profile.wizard_step_birthdate_title', { defaultValue: 'Add your birthdate' }),
        description: t('profile.wizard_step_birthdate_desc', { defaultValue: 'Birthdate improves age-based matching quality.' }),
        done: hasBirthdateForWizard,
        tab: 'profile',
      },
      {
        id: 'attributes',
        title: t('profile.wizard_step_attributes_title', { defaultValue: 'Complete personal attributes' }),
        description: t('profile.wizard_step_attributes_desc', { defaultValue: 'Fill at least 6 attributes to improve discovery.' }),
        done: filledAttributeCount >= 6,
        tab: 'attributes',
      },
      {
        id: 'interests',
        title: t('profile.wizard_step_interests_title', { defaultValue: 'Pick your interests' }),
        description: t('profile.wizard_step_interests_desc', { defaultValue: 'Choose at least 3 interests to personalize suggestions.' }),
        done: selectedInterestsCount >= 3,
        tab: 'interests',
      },
      {
        id: 'fantasies',
        title: t('profile.wizard_step_fantasies_title', { defaultValue: 'Choose fantasies' }),
        description: t('profile.wizard_step_fantasies_desc', { defaultValue: 'Select at least 2 fantasies for better compatibility.' }),
        done: selectedFantasiesCount >= 2,
        tab: 'fantasies',
      },
    ];

  const completedWizardStepCount = profileWizardSteps.filter((step) => step.done).length;
  const profileWizardProgress = Math.round((completedWizardStepCount / profileWizardSteps.length) * 100);
  const nextIncompleteWizardStep = profileWizardSteps.find((step) => !step.done) || null;
  const visibleWizardSteps = [
    ...profileWizardSteps.filter((step) => !step.done),
    ...profileWizardSteps.filter((step) => step.done),
  ].slice(0, 4);

  const handleOpenWizardStep = (stepId: ProfileWizardStepId) => {
    const step = profileWizardSteps.find((item) => item.id === stepId);
    if (!step) return;

    setEditTab(step.tab);

    if (stepId === 'birthdate') {
      setIsBirthdateSectionOpen(true);
      return;
    }

    if (stepId === 'attributes') {
      const firstIncompleteAttribute = USER_ATTRIBUTES.find((attr) => !attributeCompletionMap[attr.field]);
      setSelectedField(firstIncompleteAttribute?.field || USER_ATTRIBUTES[0]?.field || null);
      return;
    }

    if (stepId === 'interests') {
      const firstIncompleteCategory = interestCategories.find((category) => {
        const selected = userSelectedInterestsByCategory[category.id] || [];
        return selected.length === 0;
      });
      setSelectedInterestCategory(firstIncompleteCategory?.id || interestCategories[0]?.id || null);
      return;
    }

    if (stepId === 'fantasies') {
      const firstIncompleteCategory = fantasyCategories.find((category) => {
        const selected = userSelectedFantasiesByCategory[category.id] || [];
        return selected.length === 0;
      });
      setSelectedFantasyCategory(firstIncompleteCategory?.id || fantasyCategories[0]?.id || null);
    }
  };

  const content = (
    <>
      {profileJsonLd && (
        <script
          type="application/ld+json"
        >{serializeJsonLd(profileJsonLd)}</script>
      )}
      <div ref={profileViewRef} className="cv-profile-shell">
        {isEditMode ? (
          // Edit Profile View
          <main className={`flex-1 w-full min-w-0 overflow-hidden rounded-[20px] ${theme === 'dark' ? 'cv-card-surface-soft' : 'bg-white/70'}`}>
            <div className="min-h-[520px]">
              <div className="max-w-4xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  {/* Cover Image */}
                  <div className="px-4 sm:px-6 pt-8">
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('profile.cover_image')}
                    </label>
                    <div className="relative">
                      <div className={`w-full h-48 rounded-[20px] overflow-hidden border ${theme === 'dark' ? 'bg-white/[0.06] border-white/10' : 'bg-white/70 border-[var(--cv-inner-border)]'}`}>
                        {(coverImagePreview || getCoverImageUrl()) ? (
                          <img
                            src={coverImagePreview || getCoverImageUrl() || ''}
                            alt="Cover"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className={`w-12 h-12 ${theme === 'dark' ? 'text-zinc-600' : 'text-brand'}`} />
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => coverImageInputRef.current?.click()}
                        disabled={uploadingCoverImage}
                        className={`absolute top-4 right-4 p-2 rounded-full transition-all ${uploadingCoverImage
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                          } ${theme === 'dark'
                            ? 'cv-card-surface-soft hover:bg-white/10 text-white'
                            : 'bg-white/90 hover:bg-white text-slate-900'
                          }`}
                      >
                        {uploadingCoverImage ? (
                          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Camera className="w-5 h-5" />
                        )}
                      </button>
                      <input
                        ref={coverImageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleCoverImageChange}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Profile Image */}
                  <div className="px-4 sm:px-6">
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('profile.profile_image')}
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className={`w-32 h-32 rounded-full overflow-hidden border ${theme === 'dark' ? 'bg-white/[0.06] border-white/10' : 'bg-white/70 border-[var(--cv-inner-border)]'}`}>
                          {(profileImagePreview || getProfileImageUrl()) ? (
                            <img
                              src={profileImagePreview || getProfileImageUrl() || ''}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className={`w-8 h-8 ${theme === 'dark' ? 'text-zinc-600' : 'text-brand'}`} />
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => profileImageInputRef.current?.click()}
                          disabled={uploadingProfileImage}
                          className={`absolute bottom-0 right-0 p-2 rounded-full transition-all border-2 ${uploadingProfileImage
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                            } ${theme === 'dark'
                              ? 'cv-card-surface-solid text-white border-white/10 hover:bg-white/10'
                              : 'bg-white text-slate-900 border-[var(--cv-inner-border)] hover:bg-brand'
                            }`}
                        >
                          {uploadingProfileImage ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Camera className="w-4 h-4" />
                          )}
                        </button>
                        <input
                          ref={profileImageInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleProfileImageChange}
                          className="hidden"
                        />
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {t('profile.image_hint')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Edit Tabs */}
                  <div className="cv-tab-bar -mx-1">
                    <ViewTabs items={[
                        { id: 'profile', label: t('profile.profile_info') || 'Profile Info' },
                        { id: 'attributes', label: t('profile.attributes') },
                        { id: 'interests', label: t('profile.interests') },
                        { id: 'fantasies', label: t('profile.fantasies') },
                      ]} activeId={editTab} onSelect={id => setEditTab(id as 'profile' | 'attributes' | 'interests' | 'fantasies')} label={t('profile.edit_profile')} />
                  </div>

                  {/* Tab Content */}
                  <div className="relative min-h-[400px] px-4 sm:px-6 w-full overflow-x-hidden overflow-y-auto">
                    <AnimatePresence mode="wait" initial={false}>
                      {editTab === 'profile' && (
                        <motion.div
                          key="profile"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-6 w-full"
                        >
                          {isOwnProfile && (
                            <div
                              className={`mt-2 rounded-2xl border p-4 sm:p-5 ${theme === 'dark'
                                ? 'bg-gradient-to-br from-gray-900/95 to-gray-900/70 border-gray-800/80'
                                : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'
                                }`}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <p className={`text-[0.765rem] font-bold normal-case tracking-normal ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {t('profile.wizard_badge', { defaultValue: 'Profile Wizard' })}
                                  </p>
                                  <h3 className={`mt-1 text-lg font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    {profileWizardProgress === 100
                                      ? t('profile.wizard_done_title', { defaultValue: 'Your profile is ready' })
                                      : t('profile.wizard_title', { defaultValue: 'Complete your profile faster' })}
                                  </h3>
                                  <p className={`mt-1 text-sm leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {profileWizardProgress === 100
                                      ? t('profile.wizard_done_desc', { defaultValue: 'Great job. You can still update details anytime.' })
                                      : t('profile.wizard_desc', { defaultValue: 'Complete key fields to improve visibility, trust, and match quality.' })}
                                  </p>
                                </div>
                                <div className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold ${theme === 'dark' ? 'bg-white/10 text-white' : 'bg-gray-900 text-white'}`}>
                                  {profileWizardProgress}%
                                </div>
                              </div>

                              <div className={`mt-4 h-2.5 w-full rounded-full overflow-hidden ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`}>
                                <motion.div
                                  initial={false}
                                  animate={{ width: `${profileWizardProgress}%` }}
                                  transition={{ duration: 0.3, ease: 'easeOut' }}
                                  className={`h-full rounded-full ${theme === 'dark' ? 'bg-white' : 'bg-gray-900'}`}
                                />
                              </div>

                              <div className="mt-2 flex items-center justify-between">
                                <p className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {completedWizardStepCount}/{profileWizardSteps.length} {t('profile.wizard_steps_done', { defaultValue: 'steps completed' })}
                                </p>
                                {nextIncompleteWizardStep ? (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenWizardStep(nextIncompleteWizardStep.id)}
                                    className={`inline-flex items-center gap-1.5 text-xs font-semibold ${theme === 'dark' ? 'text-white hover:text-gray-300' : 'text-gray-900 hover:text-gray-700'}`}
                                  >
                                    {t('profile.wizard_continue_cta', { defaultValue: 'Continue wizard' })}
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <span className={`inline-flex items-center gap-1 text-xs font-semibold ${theme === 'dark' ? 'text-emerald-300' : 'text-emerald-700'}`}>
                                    <Check className="w-3.5 h-3.5" />
                                    {t('profile.wizard_all_done', { defaultValue: 'All done' })}
                                  </span>
                                )}
                              </div>

                              <div className="mt-4 space-y-2">
                                {visibleWizardSteps.map((step) => (
                                  <button
                                    key={step.id}
                                    type="button"
                                    onClick={() => handleOpenWizardStep(step.id)}
                                    className={`w-full rounded-xl border px-3 py-2.5 text-start flex items-start justify-between gap-3 transition-all ${theme === 'dark'
                                      ? 'cv-card-surface-muted border-white/10 hover:bg-white/[0.06]'
                                      : 'border-gray-200 bg-white hover:bg-gray-50'
                                      }`}
                                  >
                                    <div className="flex items-start gap-2.5 min-w-0">
                                      <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center ${step.done
                                        ? theme === 'dark'
                                          ? 'bg-emerald-400/20 text-emerald-300'
                                          : 'bg-emerald-100 text-emerald-700'
                                        : theme === 'dark'
                                          ? 'bg-white/10 text-white'
                                          : 'bg-gray-900 text-white'
                                        }`}>
                                        {step.done ? <Check className="w-3 h-3" /> : <span className="text-[0.765rem] font-bold">{profileWizardSteps.findIndex((item) => item.id === step.id) + 1}</span>}
                                      </div>
                                      <div className="min-w-0">
                                        <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                          {step.title}
                                        </p>
                                        <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                          {step.description}
                                        </p>
                                      </div>
                                    </div>
                                    <ChevronRight className={`w-4 h-4 shrink-0 mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Username */}
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                              {t('profile.username') || 'Username'}
                            </label>
                            <input
                              type="text"
                              value={editFormData.username || ''}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  username: e.target.value,
                                })
                              }
                              placeholder={t('auth.placeholder_nickname')}
                              className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-opacity-100 transition-all ${theme === 'dark'
                                ? 'bg-gray-900/30 border-gray-900 text-white placeholder-gray-400 focus:border-gray-700'
                                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-gray-900'
                                }`}
                            />
                          </div>

                          {/* Display Name */}
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                              {t('profile.display_name')}
                            </label>
                            <input
                              type="text"
                              value={editFormData.displayname || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, displayname: e.target.value })}
                              className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-opacity-100 transition-all ${theme === 'dark'
                                ? 'bg-gray-900/30 border-gray-900 text-white placeholder-gray-400 focus:border-gray-700'
                                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-gray-900'
                                }`}
                            />
                          </div>

                          {/* Email */}
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                              {t('profile.email')}
                            </label>
                            <input
                              type="email"
                              value={editFormData.email || ''}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  email: e.target.value,
                                })
                              }
                              placeholder={t('profile.email_placeholder')}
                              className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-opacity-100 transition-all ${theme === 'dark'
                                ? 'bg-gray-900/30 border-gray-900 text-white placeholder-gray-400 focus:border-white'
                                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-gray-900'
                                }`}
                              autoComplete="email"
                            />
                          </div>

                          {/* Bio */}
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                              {t('profile.bio')}
                            </label>
                            <ProfileBioEditor
                              theme={theme}
                              content={typeof editFormData.bio === 'string' ? editFormData.bio : ''}
                              placeholder={t('profile.bio_placeholder')}
                              onChange={(nextHtml) => {
                                setEditFormData((prev) => ({
                                  ...prev,
                                  bio: nextHtml,
                                }));
                              }}
                            />
                          </div>

                          {/* Location */}
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                              {t('profile.location')}
                            </label>
                            <LocationPicker
                              value={editFormData.location ?? user?.location ?? null}
                              onChange={(nextLocation) =>
                                setEditFormData((prev) => ({
                                  ...prev,
                                  location: nextLocation ?? undefined,
                                }))
                              }
                              theme={theme}
                              t={t}
                            />
                          </div>

                          {/* Date of Birth */}
                            <div
                              className={`rounded-2xl border p-5 ${theme === 'dark'
                              ? 'cv-card-surface-solid border-white/10'
                              : 'bg-white border-gray-200 shadow-sm'
                              }`}
                          >
                            <button
                              type="button"
                              onClick={() => setIsBirthdateSectionOpen((prev) => !prev)}
                              className="w-full flex items-start justify-between gap-4 text-start"
                            >
                              <div>
                                <h3 className={`text-base font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                  {t('profile.date_of_birth') || 'Date of Birth'}
                                </h3>
                                <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {birthdateDisplay}
                                </p>
                              </div>
                              <motion.div
                                animate={{ rotate: isBirthdateSectionOpen ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                                className={`mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                              >
                                <ChevronDown className="w-5 h-5" />
                              </motion.div>
                            </button>
                            <AnimatePresence initial={false}>
                              {isBirthdateSectionOpen && (
                                <motion.div
                                  key="birthdate-accordion"
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                                  className="overflow-hidden"
                                >
                                  <div className="pt-5">
                                    <BirthdatePicker
                                      value={editFormData.date_of_birth as string}
                                      onChange={(newValue) =>
                                        setEditFormData({
                                          ...editFormData,
                                          date_of_birth: newValue,
                                        })
                                      }
                                      theme={theme}
                                      t={t}
                                    />
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* Website */}
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                              {t('profile.website')}
                            </label>
                            <input
                              type="url"
                              value={editFormData.website || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, website: e.target.value })}
                              className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-opacity-100 transition-all ${theme === 'dark'
                                ? 'bg-gray-900/30 border-gray-900 text-white placeholder-gray-400 focus:border-gray-700'
                                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-gray-900'
                                }`}
                              placeholder="https://example.com"
                            />
                          </div>

                          {/* Privacy Level */}
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                              {t('profile.privacy_level') || 'Privacy Level'}
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {privacyLevels.map((level) => {
                                const isActive = activePrivacyLevel === level;
                                return (
                                  <motion.button
                                    key={level}
                                    type="button"
                                    onClick={() =>
                                      setEditFormData({
                                        ...editFormData,
                                        privacy_level: level,
                                      })
                                    }
                                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border ${isActive
                                      ? theme === 'dark'
                                        ? 'bg-white text-black border-white shadow-lg shadow-white/10'
                                        : 'bg-gray-900 text-white border-gray-900 shadow-lg shadow-gray-900/10'
                                      : theme === 'dark'
                                        ? 'cv-card-surface-solid border-white/10 text-gray-300 hover:bg-white/[0.04]'
                                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                                      }`}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    {privacyLevelLabels[level as PrivacyLevel]}
                                  </motion.button>
                                );
                              })}
                            </div>
                          </div>

                          {isOwnProfile && (
                            <div
                              className={`rounded-2xl border p-5 shadow-[var(--cv-shadow-short)] ${theme === 'dark'
                                ? 'cv-card-surface-solid border-white/10'
                                : 'bg-white border-gray-200'
                                }`}
                            >
                              <button
                                type="button"
                                onClick={() => setIsPasswordSectionOpen((prev) => !prev)}
                                className="w-full flex items-start justify-between gap-4 text-start"
                              >
                                <div className="flex items-start gap-3">
                                  <div
                                    className={`p-2.5 rounded-xl ${theme === 'dark' ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-700'
                                      }`}
                                  >
                                    <Lock className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <h3 className={`text-base font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                      {t('profile.change_password')}
                                    </h3>
                                    <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                      {t('profile.password_hint')}
                                    </p>
                                  </div>
                                </div>
                                <motion.div
                                  animate={{ rotate: isPasswordSectionOpen ? 180 : 0 }}
                                  transition={{ duration: 0.2 }}
                                  className={`mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                    }`}
                                >
                                  <ChevronDown className="w-5 h-5" />
                                </motion.div>
                              </button>

                              <AnimatePresence initial={false}>
                                {isPasswordSectionOpen && (
                                  <motion.div
                                    key="password-accordion"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                                    className="overflow-hidden"
                                  >
                                    <div className="pt-5 space-y-4">
                                      {passwordMessage && (
                                        <motion.div
                                          initial={{ opacity: 0, y: -6 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          className={`text-sm font-medium rounded-xl px-3 py-2 border ${passwordMessage.type === 'success'
                                            ? theme === 'dark'
                                              ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-200'
                                              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                            : theme === 'dark'
                                              ? 'bg-red-500/10 border-red-400/40 text-red-200'
                                              : 'bg-red-50 border-red-200 text-red-600'
                                            }`}
                                        >
                                          {passwordMessage.text}
                                        </motion.div>
                                      )}

                                      <div className="space-y-4">
                                        <div>
                                          <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {t('profile.current_password')}
                                          </label>
                                          <div className="relative">
                                            <input
                                              type={passwordVisibility.current ? 'text' : 'password'}
                                              value={passwordForm.currentPassword}
                                              onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
                                              placeholder={t('profile.password_current_placeholder')}
                                              autoComplete="current-password"
                                              className={`w-full px-4 py-3 pr-11 rounded-xl border-2 focus:outline-none focus:border-opacity-100 transition-all ${theme === 'dark'
                                                ? 'bg-gray-900/30 border-gray-900 text-white placeholder-gray-500 focus:border-gray-700'
                                                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-gray-900'
                                                }`}
                                            />
                                            <button
                                              type="button"
                                              onClick={() => togglePasswordVisibility('current')}
                                              className={`absolute inset-y-0 right-3 flex items-center justify-center text-gray-500 ${theme === 'dark' ? 'hover:text-gray-300' : 'hover:text-gray-700'}`}
                                              aria-label={passwordVisibility.current ? t('profile.hide_password') : t('profile.show_password')}
                                            >
                                              {passwordVisibility.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                          </div>
                                        </div>

                                        <div>
                                          <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {t('profile.new_password')}
                                          </label>
                                          <div className="relative">
                                            <input
                                              type={passwordVisibility.new ? 'text' : 'password'}
                                              value={passwordForm.newPassword}
                                              onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                                              placeholder={t('profile.password_new_placeholder')}
                                              autoComplete="new-password"
                                              className={`w-full px-4 py-3 pr-11 rounded-xl border-2 focus:outline-none focus:border-opacity-100 transition-all ${theme === 'dark'
                                                ? 'bg-gray-900/30 border-gray-900 text-white placeholder-gray-500 focus:border-gray-700'
                                                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-gray-900'
                                                }`}
                                            />
                                            <button
                                              type="button"
                                              onClick={() => togglePasswordVisibility('new')}
                                              className={`absolute inset-y-0 right-3 flex items-center justify-center text-gray-500 ${theme === 'dark' ? 'hover:text-gray-300' : 'hover:text-gray-700'}`}
                                              aria-label={passwordVisibility.new ? t('profile.hide_password') : t('profile.show_password')}
                                            >
                                              {passwordVisibility.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                          </div>
                                        </div>

                                        <div>
                                          <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {t('profile.confirm_new_password')}
                                          </label>
                                          <div className="relative">
                                            <input
                                              type={passwordVisibility.confirm ? 'text' : 'password'}
                                              value={passwordForm.confirmNewPassword}
                                              onChange={(e) => handlePasswordInputChange('confirmNewPassword', e.target.value)}
                                              placeholder={t('profile.password_confirm_placeholder')}
                                              autoComplete="new-password"
                                              className={`w-full px-4 py-3 pr-11 rounded-xl border-2 focus:outline-none focus:border-opacity-100 transition-all ${theme === 'dark'
                                                ? 'bg-gray-900/30 border-gray-900 text-white placeholder-gray-500 focus:border-gray-700'
                                                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-gray-900'
                                                }`}
                                            />
                                            <button
                                              type="button"
                                              onClick={() => togglePasswordVisibility('confirm')}
                                              className={`absolute inset-y-0 right-3 flex items-center justify-center text-gray-500 ${theme === 'dark' ? 'hover:text-gray-300' : 'hover:text-gray-700'}`}
                                              aria-label={passwordVisibility.confirm ? t('profile.hide_password') : t('profile.show_password')}
                                            >
                                              {passwordVisibility.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center justify-end">
                                        <button
                                          type="button"
                                          onClick={handlePasswordSubmit}
                                          disabled={isUpdatingPassword}
                                          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${isUpdatingPassword
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : theme === 'dark'
                                              ? 'bg-white text-black hover:bg-gray-200'
                                              : 'bg-gray-900 text-white hover:bg-gray-800'
                                            }`}
                                        >
                                          {isUpdatingPassword ? (
                                            <>
                                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                              <span>{t('profile.password_updating')}</span>
                                            </>
                                          ) : (
                                            <>
                                              <Save className="w-4 h-4" />
                                              <span>{t('profile.password_update')}</span>
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}
                        </motion.div>
                      )}
                      {editTab === 'attributes' && (
                        <motion.div
                          key="attributes"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                          className="w-full"
                        >
                          {/* Header */}
                          <div className={`pt-6 pb-4 ${theme === 'dark' ? 'bg-transparent' : 'bg-transparent'}`}>
                            <div className="flex items-center justify-between mb-2">
                              <h3 className={`text-xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                <span className="inline-flex items-center gap-2"><IllustratedIcon name="system-user" className="h-10 w-10" />{t('profile.attributes')}</span>
                              </h3>
                              {USER_ATTRIBUTES.length > 0 && (
                                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${theme === 'dark'
                                  ? 'bg-white/10 text-gray-300 border border-white/10'
                                  : 'bg-gray-100 text-gray-600 border border-gray-200'
                                  }`}>
                                  {USER_ATTRIBUTES.length} {USER_ATTRIBUTES.length === 1 ? 'attribute' : 'attributes'}
                                </span>
                              )}
                            </div>
                            {USER_ATTRIBUTES.length > 0 && (
                              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                {filledAttributeCount} / {USER_ATTRIBUTES.length} filled
                              </p>
                            )}
                          </div>

                          {/* Attributes with Accordion - No Scroll */}
                          <div className="pb-6 space-y-3">
                            {USER_ATTRIBUTES.length > 0 ? (
                              USER_ATTRIBUTES.map((item) => {
                                const isLoading = updatingAttributes[item.field] || false;
                                const options = fieldOptions[item.field] || [];
                                const isExpanded = selectedField === item.field;

                                // Get current value
                                const userToCheck = isEditMode && isAuthenticated ? authUser : user;
                                let currentAttributeId = '';
                                let selectedOption = null;
                                let hasValue = false;
                                let displayValue = t('profile.select_option');
                                let selectedOptions: Array<{ id: string; name: string; display_order: number; bit_index?: number }> = [];

                                // First check if using preferences_flags with bit_index
                                const usePreferencesFlags = options.some(opt => opt.bit_index !== undefined);
                                if (usePreferencesFlags) {
                                  // Find selected options from preferences_flags
                                  selectedOptions = options.filter(opt =>
                                    opt.bit_index !== undefined && isBitSet(preferencesFlags, opt.bit_index)
                                  );

                                  if (selectedOptions.length > 0) {
                                    const allowMultiple = normalizeAllowMultiple(fieldAllowMultiple[item.field]) ?? false;
                                    if (allowMultiple) {
                                      // Multiple selection: show all selected options
                                      displayValue = selectedOptions.map(opt => opt.name).join(', ');
                                    } else {
                                      // Single selection
                                      displayValue = selectedOptions[0].name;
                                    }
                                    hasValue = true;
                                    currentAttributeId = selectedOptions[0].id;
                                    selectedOption = selectedOptions[0];
                                  }
                                } else if (item.field === 'gender_identity') {
                                  const genderIdentities = (userToCheck as any)?.gender_identities || (userToCheck as any)?.sexual_identities?.gender_identities;
                                  const genderIdentity = genderIdentities?.[0] || (userToCheck as any)?.gender_identity;
                                  if (genderIdentity?.id) {
                                    currentAttributeId = (genderIdentity as any).id;
                                    selectedOption = options.find((opt: any) => opt.id === currentAttributeId);
                                    if (selectedOption) {
                                      displayValue = (selectedOption as any).name;
                                      hasValue = true;
                                    } else if ((genderIdentity as any).name) {
                                      displayValue = (genderIdentity as any).name[defaultLanguage] || (genderIdentity as any).name.en || Object.values((genderIdentity as any).name)[0] || t('profile.select_option');
                                      hasValue = !!displayValue && displayValue !== t('profile.select_option');
                                    }
                                  }
                                } else if (item.field === 'sexual_orientation') {
                                  const sexualOrientations = (userToCheck as any)?.sexual_orientations || (userToCheck as any)?.sexual_identities?.sexual_orientations;
                                  const sexualOrientation = sexualOrientations?.[0] || (userToCheck as any)?.sexual_orientation;
                                  if (sexualOrientation?.id) {
                                    currentAttributeId = (sexualOrientation as any).id;
                                    selectedOption = options.find((opt: any) => opt.id === currentAttributeId);
                                    if (selectedOption) {
                                      displayValue = (selectedOption as any).name;
                                      hasValue = true;
                                    } else if ((sexualOrientation as any).name) {
                                      displayValue = (sexualOrientation as any).name[defaultLanguage] || (sexualOrientation as any).name.en || Object.values((sexualOrientation as any).name)[0] || t('profile.select_option');
                                      hasValue = !!displayValue && displayValue !== t('profile.select_option');
                                    }
                                  }
                                } else if (item.field === 'sex_role') {
                                  const sexRole = (userToCheck as any)?.sexual_role || (userToCheck as any)?.sex_role || (userToCheck as any)?.sexual_identities?.sex_role;
                                  if (sexRole?.id) {
                                    currentAttributeId = (sexRole as any).id;
                                    selectedOption = options.find((opt: any) => opt.id === currentAttributeId);
                                    if (selectedOption) {
                                      displayValue = (selectedOption as any).name;
                                      hasValue = true;
                                    } else if ((sexRole as any).name) {
                                      displayValue = (sexRole as any).name[defaultLanguage] || (sexRole as any).name.en || Object.values((sexRole as any).name)[0] || t('profile.select_option');
                                      hasValue = !!displayValue && displayValue !== t('profile.select_option');
                                    }
                                  }
                                } else {
                                  // Regular attribute from user_attributes (fallback to old structure)
                                  const currentUserAttribute = (userToCheck as any)?.user_attributes?.find(
                                    (ua: any) => ua.category_type === item.field
                                  );

                                  currentAttributeId = currentUserAttribute?.attribute_id || '';
                                  selectedOption = currentAttributeId
                                    ? options.find((opt: any) => opt.id === currentAttributeId)
                                    : null;

                                  hasValue = !!(selectedOption || (currentUserAttribute?.attribute?.name));
                                  displayValue = selectedOption
                                    ? (selectedOption as any).name
                                    : currentUserAttribute?.attribute?.name
                                      ? ((currentUserAttribute.attribute.name as any)[defaultLanguage] || (currentUserAttribute.attribute.name as any).en || Object.values(currentUserAttribute.attribute.name as any)[0] || t('profile.select_option'))
                                      : t('profile.select_option');
                                }

                                return (
                                  <motion.div
                                    key={item.field}
                                    initial={false}
                                    className={`rounded-2xl overflow-hidden transition-all duration-200 ${theme === 'dark'
                                      ? 'bg-gradient-to-br from-gray-900/90 to-gray-800/50 border border-gray-800/60'
                                      : 'bg-white border border-gray-200/90'
                                      }`}
                                  >
                                    {/* Attribute Header */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (isExpanded) {
                                          setSelectedField(null);
                                        } else {
                                          setSelectedField(item.field);
                                        }
                                      }}
                                      disabled={isLoading}
                                      className={`w-full p-4 flex items-center justify-between transition-all ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${theme === 'dark'
                                        ? 'hover:bg-gray-900/50'
                                        : 'hover:bg-gray-50/50'
                                        }`}
                                    >
                                      <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className={`p-2.5 rounded-xl flex-shrink-0 ${theme === 'dark'
                                          ? 'bg-white/10 text-white'
                                          : 'bg-gray-100 text-gray-700'
                                          }`}
                                        >
                                          <IllustratedIcon name={`attribute-${item.field}`} className="h-10 w-10" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2.5 mb-1.5">
                                            <h4 className={`text-base font-semibold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                              {item.label}
                                            </h4>
                                            {!hasValue && (
                                              <motion.span
                                                initial={{ scale: 0.8 }}
                                                animate={{ scale: 1 }}
                                                className={`inline-flex items-center justify-center w-1.5 h-1.5 rounded-full ${theme === 'dark'
                                                  ? 'bg-yellow-400/80'
                                                  : 'bg-yellow-500/80'
                                                  }`}
                                              />
                                            )}
                                          </div>
                                          {hasValue && !isExpanded && (
                                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                              {usePreferencesFlags && selectedOptions.length > 1 ? (
                                                selectedOptions.slice(0, 3).map((opt) => (
                                                  <span
                                                    key={opt.id}
                                                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${theme === 'dark'
                                                      ? 'bg-white/10 text-gray-200'
                                                      : 'bg-gray-100 text-gray-700'
                                                      }`}
                                                  >
                                                    {opt.name}
                                                  </span>
                                                ))
                                              ) : (
                                                <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                                  {displayValue}
                                                </span>
                                              )}
                                              {usePreferencesFlags && selectedOptions.length > 3 && (
                                                <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                                  +{selectedOptions.length - 3}
                                                </span>
                                              )}
                                            </div>
                                          )}
                                          {!hasValue && !isExpanded && (
                                            <p className={`text-xs mt-1.5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                                              Tap to select option
                                            </p>
                                          )}
                                        </div>
                                        <motion.div
                                          animate={{ rotate: isExpanded ? 180 : 0 }}
                                          transition={{ duration: 0.2 }}
                                          className={`flex-shrink-0 ml-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}
                                        >
                                          <ChevronDown className="w-5 h-5" />
                                        </motion.div>
                                      </div>
                                    </button>

                                    {/* Expanded Options - No Scroll */}
                                    <AnimatePresence initial={false}>
                                      {isExpanded && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: 'auto', opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                                          className="overflow-hidden"
                                        >
                                          <div className={`pb-4 px-3 pt-2 border-t ${theme === 'dark' ? 'border-gray-800/60' : 'border-gray-200/60'}`}>
                                            {options.length > 0 ? (
                                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                                                {options.map((option) => {
                                                  // Get current value
                                                  const userToCheck = isEditMode && isAuthenticated ? authUser : user;
                                                  let isSelected = false;

                                                  // First check if using preferences_flags with bit_index
                                                  if (option.bit_index !== undefined) {
                                                    isSelected = isBitSet(preferencesFlags, option.bit_index);
                                                  } else if (item.field === 'gender_identity') {
                                                    const genderIdentities = (userToCheck as any)?.gender_identities || (userToCheck as any)?.sexual_identities?.gender_identities;
                                                    const genderIdentity = genderIdentities?.[0] || (userToCheck as any)?.gender_identity;
                                                    isSelected = genderIdentity?.id === option.id;
                                                  } else if (item.field === 'sexual_orientation') {
                                                    const sexualOrientations = (userToCheck as any)?.sexual_orientations || (userToCheck as any)?.sexual_identities?.sexual_orientations;
                                                    const sexualOrientation = sexualOrientations?.[0] || (userToCheck as any)?.sexual_orientation;
                                                    isSelected = sexualOrientation?.id === option.id;
                                                  } else if (item.field === 'sex_role') {
                                                    const sexRole = (userToCheck as any)?.sexual_role || (userToCheck as any)?.sex_role || (userToCheck as any)?.sexual_identities?.sex_role;
                                                    isSelected = sexRole?.id === option.id;
                                                  } else {
                                                    const currentUserAttribute = (userToCheck as any)?.user_attributes?.find(
                                                      (ua: any) => ua.category_type === item.field
                                                    );
                                                    isSelected = currentUserAttribute?.attribute_id === option.id;
                                                  }

                                                  return (
                                                    <motion.button
                                                      key={option.id}
                                                      onClick={() => handleFieldOptionSelect(item.field, option.id)}
                                                      disabled={isLoading}
                                                      whileHover={{ scale: 1.02 }}
                                                      whileTap={{ scale: 0.98 }}
                                                      className={`text-start rounded-xl p-3.5 transition-all duration-200 relative ${isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'} ${isSelected
                                                        ? theme === 'dark'
                                                          ? 'bg-gradient-to-r from-white/[0.12] to-white/[0.06] border-2 border-white/25'
                                                          : 'bg-gradient-to-r from-gray-50 to-white border-2 border-gray-400'
                                                        : theme === 'dark'
                                                          ? 'bg-gray-900/40 border border-gray-800/60 hover:border-gray-700/70 hover:bg-gray-900/60'
                                                          : 'bg-white border border-gray-200/90 hover:border-gray-300 hover:bg-gray-50/80'
                                                        }`}
                                                    >
                                                      <div className="flex items-start justify-start h-full w-full gap-2">
                                                        <div className="flex-1 min-w-0 pr-8">
                                                          <div className="mb-1">
                                                            <h5 className={`text-sm font-semibold tracking-tight ${isSelected
                                                              ? theme === 'dark' ? 'text-white' : 'text-gray-900'
                                                              : theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                                                              }`}>
                                                              {option.name}
                                                            </h5>
                                                          </div>
                                                        </div>
                                                        {isSelected && (
                                                          <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                                                            className={`absolute top-3.5 right-3.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${theme === 'dark'
                                                              ? 'bg-white text-gray-900'
                                                              : 'bg-gray-900 text-white'
                                                              }`}
                                                          >
                                                            <Check className="w-3 h-3" />
                                                          </motion.div>
                                                        )}
                                                      </div>
                                                    </motion.button>
                                                  );
                                                })}
                                              </div>
                                            ) : (
                                              <div className={`py-8 text-center rounded-xl ${theme === 'dark' ? 'bg-gray-900/30' : 'bg-gray-50'}`}>
                                                <p className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                                  {t('profile.no_options_available') || 'No options available'}
                                                </p>
                                              </div>
                                            )}
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </motion.div>
                                );
                              })
                            ) : (
                              <div className={`py-12 text-center rounded-2xl ${theme === 'dark' ? 'bg-gray-900/30 border border-gray-800' : 'bg-gray-50 border border-gray-200'}`}>
                                <Accessibility className={`w-10 h-10 mx-auto mb-3 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
                                <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                  No attributes available
                                </p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                      {editTab === 'interests' && (
                        <motion.div
                          key="interests"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                          className="w-full"
                        >
                          {/* Header */}
                          <div className={`pt-6 pb-4 ${theme === 'dark' ? 'bg-transparent' : 'bg-transparent'}`}>
                            <div className="flex items-center justify-between mb-2">
                              <h3 className={`text-xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                <span className="inline-flex items-center gap-2"><IllustratedIcon name="interest-category-lifestyle" className="h-10 w-10" />{t('profile.interests')}</span>
                              </h3>
                              {interestCategories.length > 0 && (
                                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${theme === 'dark'
                                  ? 'bg-white/10 text-gray-300 border border-white/10'
                                  : 'bg-gray-100 text-gray-600 border border-gray-200'
                                  }`}>
                                  {interestCategories.length} {interestCategories.length === 1 ? 'category' : 'categories'}
                                </span>
                              )}
                            </div>
                            {interestCategories.length > 0 && (
                              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                {Object.values(userSelectedInterestsByCategory).reduce((sum, items) => sum + items.length, 0)} selected
                              </p>
                            )}
                          </div>

                          {/* Categories with Accordion - No Scroll */}
                          <div className="pb-6 space-y-3">
                            {interestCategories.length > 0 ? (
                              interestCategories.map((category) => {
                                const categoryItems = interestOptions[category.id] || [];
                                const selectedCount = categoryItems.filter(item => userSelectedInterestIds.includes(item.id)).length;
                                const selectedItems = userSelectedInterestsByCategory[category.id] || [];
                                const hasSelections = selectedCount > 0;
                                const isExpanded = selectedInterestCategory === category.id;

                                return (
                                  <motion.div
                                    key={category.id}
                                    initial={false}
                                    className={`rounded-2xl overflow-hidden transition-all duration-200 ${theme === 'dark'
                                      ? 'bg-gradient-to-br from-gray-900/90 to-gray-800/50 border border-gray-800/60'
                                      : 'bg-white border border-gray-200/90'
                                      }`}
                                  >
                                    {/* Category Header */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (isExpanded) {
                                          setSelectedInterestCategory(null);
                                        } else {
                                          setSelectedInterestCategory(category.id);
                                        }
                                      }}
                                      disabled={updatingInterests}
                                      className={`w-full p-4 flex items-center justify-between transition-all ${updatingInterests ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${theme === 'dark'
                                        ? 'hover:bg-gray-900/50'
                                        : 'hover:bg-gray-50/50'
                                        }`}
                                    >
                                      <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2.5 mb-1.5">
                                            <h4 className={`text-base font-semibold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                              <span className="inline-flex items-center gap-2"><IllustratedIcon name={category.id} className="h-9 w-9" />{category.name}</span>
                                            </h4>
                                            {hasSelections && (
                                              <motion.span
                                                initial={{ scale: 0.8 }}
                                                animate={{ scale: 1 }}
                                                className={`inline-flex items-center justify-center min-w-[24px] h-5 px-2 rounded-full text-xs font-bold ${theme === 'dark'
                                                  ? 'bg-white/15 text-white'
                                                  : 'bg-gray-900/10 text-gray-700'
                                                  }`}
                                              >
                                                {selectedCount}
                                              </motion.span>
                                            )}
                                          </div>
                                          {selectedItems.length > 0 && !isExpanded && (
                                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                              {selectedItems.slice(0, 3).map((item) => (
                                                <span
                                                  key={item.id}
                                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${theme === 'dark'
                                                    ? 'bg-white/10 text-gray-200'
                                                    : 'bg-gray-100 text-gray-700'
                                                    }`}
                                                >
                                                  <IllustratedIcon name={item.id} fallback="system-heart" className="inline-block h-7 w-7 align-middle" />
                                                  <span className="inline-flex items-center gap-1"><IllustratedIcon name={item.id} className="h-6 w-6" />{item.name}</span>
                                                </span>
                                              ))}
                                              {selectedItems.length > 3 && (
                                                <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                                  +{selectedItems.length - 3}
                                                </span>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                        <motion.div
                                          animate={{ rotate: isExpanded ? 180 : 0 }}
                                          transition={{ duration: 0.2 }}
                                          className={`flex-shrink-0 ml-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}
                                        >
                                          <ChevronDown className="w-5 h-5" />
                                        </motion.div>
                                      </div>
                                    </button>

                                    {/* Expanded Options - No Scroll */}
                                    <AnimatePresence initial={false}>
                                      {isExpanded && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: 'auto', opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                                          className="overflow-hidden"
                                        >
                                          <div className={`pb-4 px-3 pt-2 border-t ${theme === 'dark' ? 'border-gray-800/60' : 'border-gray-200/60'}`}>
                                            {categoryItems.length > 0 ? (
                                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                                                {categoryItems.map((item) => {
                                                  const isSelected = userSelectedInterestIds.includes(item.id);
                                                  return (
                                                    <motion.button
                                                      key={item.id}
                                                      onClick={() => handleInterestItemToggle(item.id)}
                                                      disabled={updatingInterests}
                                                      whileHover={{ scale: 1.02 }}
                                                      whileTap={{ scale: 0.98 }}
                                                      className={`text-start rounded-xl p-3.5 transition-all duration-200 relative ${updatingInterests ? 'opacity-50 cursor-wait' : 'cursor-pointer'} ${isSelected
                                                        ? theme === 'dark'
                                                          ? 'bg-gradient-to-r from-white/[0.12] to-white/[0.06] border-2 border-white/25'
                                                          : 'bg-gradient-to-r from-gray-50 to-white border-2 border-gray-400'
                                                        : theme === 'dark'
                                                          ? 'bg-gray-900/40 border border-gray-800/60 hover:border-gray-700/70 hover:bg-gray-900/60'
                                                          : 'bg-white border border-gray-200/90 hover:border-gray-300 hover:bg-gray-50/80'
                                                        }`}
                                                    >
                                                      <div className="flex items-start justify-start h-full w-full gap-2">
                                                        <div className="flex-1 min-w-0 pr-8">
                                                          <div className="mb-1">
                                                            <h5 className={`text-sm font-semibold tracking-tight ${isSelected
                                                              ? theme === 'dark' ? 'text-white' : 'text-gray-900'
                                                              : theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                                                              }`}>
                                                              <span className="inline-flex items-center gap-2"><IllustratedIcon name={item.id} className="h-8 w-8" />{item.name}</span>
                                                            </h5>
                                                          </div>
                                                        </div>
                                                        {isSelected && (
                                                          <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                                                            className={`absolute top-3.5 right-3.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${theme === 'dark'
                                                              ? 'bg-white text-gray-900'
                                                              : 'bg-gray-900 text-white'
                                                              }`}
                                                          >
                                                            <Check className="w-3 h-3" />
                                                          </motion.div>
                                                        )}
                                                      </div>
                                                    </motion.button>
                                                  );
                                                })}
                                              </div>
                                            ) : (
                                              <div className={`py-8 text-center rounded-xl ${theme === 'dark' ? 'bg-gray-900/30' : 'bg-gray-50'}`}>
                                                <p className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                                  {t('profile.no_options_available') || 'No options available'}
                                                </p>
                                              </div>
                                            )}
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </motion.div>
                                );
                              })
                            ) : (
                              <div className={`py-12 text-center rounded-2xl ${theme === 'dark' ? 'bg-gray-900/30 border border-gray-800' : 'bg-gray-50 border border-gray-200'}`}>
                                <Heart className={`w-10 h-10 mx-auto mb-3 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
                                <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                  No interest categories available
                                </p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                      {editTab === 'fantasies' && (
                        <motion.div
                          key="fantasies"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                          className="w-full"
                        >
                          {/* Header */}
                          <div className={`pt-6 pb-4 ${theme === 'dark' ? 'bg-transparent' : 'bg-transparent'}`}>
                            <div className="flex items-center justify-between mb-2">
                              <h3 className={`text-xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                <span className="inline-flex items-center gap-2"><IllustratedIcon name="fantasy-category-amusement" className="h-10 w-10" />{t('profile.fantasies')}</span>
                              </h3>
                              {fantasyCategories.length > 0 && (
                                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${theme === 'dark'
                                  ? 'bg-white/10 text-gray-300 border border-white/10'
                                  : 'bg-gray-100 text-gray-600 border border-gray-200'
                                  }`}>
                                  {fantasyCategories.length} {fantasyCategories.length === 1 ? 'category' : 'categories'}
                                </span>
                              )}
                            </div>
                            {fantasyCategories.length > 0 && (
                              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                {Object.values(userSelectedFantasiesByCategory).reduce((sum, items) => sum + items.length, 0)} selected
                              </p>
                            )}
                          </div>

                          {/* Categories with Accordion - No Scroll */}
                          <div className="pb-6 space-y-3">
                            {fantasyCategories.length > 0 ? (
                              fantasyCategories.map((category) => {
                                const categoryItems = fantasyOptions[category.id] || [];
                                const selectedCount = categoryItems.filter(item => userSelectedFantasyIds.includes(item.id)).length;
                                const selectedItems = userSelectedFantasiesByCategory[category.id] || [];
                                const hasSelections = selectedCount > 0;
                                const isExpanded = selectedFantasyCategory === category.id;

                                return (
                                  <motion.div
                                    key={category.id}
                                    initial={false}
                                    className={`rounded-2xl overflow-hidden transition-all duration-200 ${theme === 'dark'
                                      ? 'bg-gradient-to-br from-gray-900/90 to-gray-800/50 border border-gray-800/60'
                                      : 'bg-white border border-gray-200/90'
                                      }`}
                                  >
                                    {/* Category Header */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (isExpanded) {
                                          setSelectedFantasyCategory(null);
                                        } else {
                                          setSelectedFantasyCategory(category.id);
                                        }
                                      }}
                                      disabled={updatingFantasies}
                                      className={`w-full p-4 flex items-center justify-between transition-all ${updatingFantasies ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${theme === 'dark'
                                        ? 'hover:bg-gray-900/50'
                                        : 'hover:bg-gray-50/50'
                                        }`}
                                    >
                                      <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2.5 mb-1.5">
                                            <h4 className={`text-base font-semibold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                              <span className="inline-flex items-center gap-2"><IllustratedIcon name={category.id} className="h-9 w-9" />{category.name}</span>
                                            </h4>
                                            {hasSelections && (
                                              <motion.span
                                                initial={{ scale: 0.8 }}
                                                animate={{ scale: 1 }}
                                                className={`inline-flex items-center justify-center min-w-[24px] h-5 px-2 rounded-full text-xs font-bold ${theme === 'dark'
                                                  ? 'bg-white/15 text-white'
                                                  : 'bg-gray-900/10 text-gray-700'
                                                  }`}
                                              >
                                                {selectedCount}
                                              </motion.span>
                                            )}
                                          </div>
                                          {selectedItems.length > 0 && !isExpanded && (
                                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                              {selectedItems.slice(0, 3).map((item) => (
                                                <span
                                                  key={item.id}
                                                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${theme === 'dark'
                                                    ? 'bg-white/10 text-gray-200'
                                                    : 'bg-gray-100 text-gray-700'
                                                    }`}
                                                >
                                                  <span className="inline-flex items-center gap-1"><IllustratedIcon name={item.id} className="h-6 w-6" />{item.name}</span>
                                                </span>
                                              ))}
                                              {selectedItems.length > 3 && (
                                                <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                                  +{selectedItems.length - 3}
                                                </span>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                        <motion.div
                                          animate={{ rotate: isExpanded ? 180 : 0 }}
                                          transition={{ duration: 0.2 }}
                                          className={`flex-shrink-0 ml-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}
                                        >
                                          <ChevronDown className="w-5 h-5" />
                                        </motion.div>
                                      </div>
                                    </button>

                                    {/* Expanded Options - No Scroll */}
                                    <AnimatePresence initial={false}>
                                      {isExpanded && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: 'auto', opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                                          className="overflow-hidden"
                                        >
                                          <div className={`pb-4  px-3 pt-2 border-t ${theme === 'dark' ? 'border-gray-800/60' : 'border-gray-200/60'}`}>
                                            {categoryItems.length > 0 ? (
                                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                                                {categoryItems.map((item) => {
                                                  const isSelected = userSelectedFantasyIds.includes(item.id);
                                                  return (
                                                    <motion.button
                                                      key={item.id}
                                                      onClick={() => handleFantasyItemToggle(item.id)}
                                                      disabled={updatingFantasies}
                                                      whileHover={{ scale: 1.02 }}
                                                      whileTap={{ scale: 0.98 }}
                                                      className={`text-start rounded-xl p-3.5 transition-all duration-200 relative ${updatingFantasies ? 'opacity-50 cursor-wait' : 'cursor-pointer'} ${isSelected
                                                        ? theme === 'dark'
                                                          ? 'bg-gradient-to-r from-white/[0.12] to-white/[0.06] border-2 border-white/25'
                                                          : 'bg-gradient-to-r from-gray-50 to-white border-2 border-gray-400'
                                                        : theme === 'dark'
                                                          ? 'bg-gray-900/40 border border-gray-800/60 hover:border-gray-700/70 hover:bg-gray-900/60'
                                                          : 'bg-white border border-gray-200/90 hover:border-gray-300 hover:bg-gray-50/80'
                                                        }`}
                                                    >
                                                      <div className="flex items-start justify-start h-full w-full gap-2">
                                                        <div className="flex-1 min-w-0 pr-8">
                                                          <div className="mb-1">
                                                            <h5 className={`text-sm font-semibold tracking-tight ${isSelected
                                                              ? theme === 'dark' ? 'text-white' : 'text-gray-900'
                                                              : theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                                                              }`}>
                                                              <span className="inline-flex items-center gap-2"><IllustratedIcon name={item.id} className="h-8 w-8" />{item.name}</span>
                                                            </h5>
                                                          </div>
                                                          {item.description && (
                                                            <p className={`text-xs leading-relaxed ${isSelected
                                                              ? theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                                                              : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                                              }`}>
                                                              {item.description}
                                                            </p>
                                                          )}
                                                        </div>
                                                        {isSelected && (
                                                          <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                                                            className={`absolute top-3.5 right-3.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${theme === 'dark'
                                                              ? 'bg-white text-gray-900'
                                                              : 'bg-gray-900 text-white'
                                                              }`}
                                                          >
                                                            <Check className="w-3 h-3" />
                                                          </motion.div>
                                                        )}
                                                      </div>
                                                    </motion.button>
                                                  );
                                                })}
                                              </div>
                                            ) : (
                                              <div className={`py-8 text-center rounded-xl ${theme === 'dark' ? 'bg-gray-900/30' : 'bg-gray-50'}`}>
                                                <p className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                                  {t('profile.no_options_available') || 'No options available'}
                                                </p>
                                              </div>
                                            )}
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </motion.div>
                                );
                              })
                            ) : (
                              <div className={`py-12 text-center rounded-2xl ${theme === 'dark' ? 'bg-gray-900/30 border border-gray-800' : 'bg-gray-50 border border-gray-200'}`}>
                                <Sparkles className={`w-10 h-10 mx-auto mb-3 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
                                <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                  No fantasy categories available
                                </p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mx-4 sm:mx-6 p-4 rounded-xl border ${theme === 'dark'
                        ? 'bg-red-900/20 border-red-700 text-red-300'
                        : 'bg-red-50 border-red-200 text-red-700'
                        }`}
                    >
                      <p className="text-sm font-medium">{error}</p>
                    </motion.div>
                  )}

                  {/* Action Buttons - Only show on profile tab */}
                  {editTab === 'profile' && (
                    <div className={`flex items-center justify-end gap-3 pt-6 pb-8 px-4 sm:px-6 border-t ${theme === 'dark' ? 'cv-card-surface-soft border-white/10' : 'bg-white/60 border-[var(--cv-inner-border)]'}`}>
                      <button
                        onClick={() => closeProfileEditMode({ replace: true })}
                        className={`px-6 py-3 rounded-full font-semibold transition-all duration-200 border ${theme === 'dark'
                          ? 'bg-white/[0.08] border-white/10 text-zinc-300 hover:bg-white/[0.12]'
                          : 'bg-white/80 border-[var(--cv-inner-border)] text-slate-700 hover:bg-white'
                          }`}
                      >
                        {t('profile.cancel')}
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={isSaving || uploadingProfileImage || uploadingCoverImage}
                        className={`px-6 py-3 rounded-full font-semibold transition-all duration-200 flex items-center gap-2 ${isSaving || uploadingProfileImage || uploadingCoverImage
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-brand text-white hover:bg-brand-hovered'
                          }`}
                      >
                        {isSaving || uploadingProfileImage || uploadingCoverImage ? (
                          <>
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            <span>
                              {isSaving
                                ? t('profile.saving')
                                : t('profile.uploading_image', { defaultValue: 'Uploading image...' })}
                            </span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>{t('profile.save')}</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          </main>
        ) : (
          // Profile View
          <main className="cv-profile-view">
            <ProfileHeader
              displayName={user.displayname || user.username}
              username={user.username}
              avatarUrl={getProfileImageUrl()}
              coverUrl={getCoverImageUrl()}
              blurMedia={!isAuthenticated}
              actions={isOwnProfile ? (
                <>
                  <button type="button" onClick={openProfileEditMode} className="cv-profile-action cv-profile-action-primary">
                    {t('profile.edit_profile_button')}
                  </button>
                  <button type="button" onClick={() => navigate('/wallet')} className="cv-profile-action">
                    <WalletOutline aria-hidden="true" />
                    <span>{t('wallet.title')}</span>
                  </button>
                  <button type="button" onClick={() => navigate('/messages')} className="cv-profile-action">
                    <MessageCircleOutline aria-hidden="true" />
                    <span>{t('app.nav.messages')}</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleFollowClick}
                    disabled={isFollowPending || needsFollowDetails}
                    aria-busy={isFollowPending || (needsFollowDetails && !followError)}
                    className={`cv-profile-action${isFollowing ? '' : ' cv-profile-action-primary'}`}
                  >
                    {needsFollowDetails ? t('match.loading') : isFollowing ? t('profile.following') : t('profile.follow')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendMessage(user)}
                    disabled={!canViewSensitiveProfileSections}
                    className={`cv-profile-action${isFollowing ? ' cv-profile-action-primary' : ''}`}
                  >
                    <MessageCircleOutline aria-hidden="true" />
                    <span>{t('profile.send_message', { defaultValue: 'Send Message' })}</span>
                  </button>
                </>
              )}
            >
              {followError && <div className="cv-profile-preferences-feedback" role="alert">
                <span>{t('chat_actions.action_failed')}</span>
                {needsFollowDetails && <button type="button" onClick={() => setFollowReadAttempt(attempt => attempt + 1)}>{t('nearby.try_again')}</button>}
              </div>}
              {canViewSensitiveProfileSections && profileBioText && (
                <div className="cv-profile-bio">
                  <ProfileBioPreview theme={theme} content={profileBioText} />
                </div>
              )}
              <div className="cv-profile-metadata">
                {canViewSensitiveProfileSections && getLocationDisplay(user.location) && (
                  <div><MapPinOutline aria-hidden="true" /><span>{getLocationDisplay(user.location)}</span></div>
                )}
                {canViewSensitiveProfileSections && user.website && (
                  <a href={user.website} target="_blank" rel="noopener noreferrer">
                    <TelegramIcon name="link" /><span>{user.website.replace(/^https?:\/\//, '')}</span>
                  </a>
                )}
                {!canViewSensitiveProfileSections && (
                  <div><TelegramIcon name="lock" /><span>{t('profile.privacy_limited_badge', { defaultValue: 'Limited by privacy settings' })}</span></div>
                )}
                <div><CalendarOutline aria-hidden="true" /><span>{formatJoinDate(user.created_at)}</span></div>
              </div>
              <div className="cv-profile-connections">
                {visibleEngagementItems.filter(item => item.id === 'followers' || item.id === 'followings').map(item => (
                  <button type="button" key={item.id} disabled={item.disabled} onClick={item.onClick} className="cv-profile-connection">
                    <strong>{item.value.toLocaleString()}</strong><span>{item.label}</span>
                  </button>
                ))}
                {visibleEngagementItems.some(item => item.id !== 'followers' && item.id !== 'followings') && <button type="button" className="cv-icon-button cv-profile-statistics-action" aria-label={t('match.stats')} title={t('match.stats')} onClick={() => setShowProfileStats(true)}><TelegramIcon name="info" /></button>}
              </div>
            </ProfileHeader>
            <ProfileSocialTools key={String(user.public_id || user.id)} ownerId={String(user.public_id || user.id)} viewerId={String(authUser?.public_id || authUser?.id || '')} own={!!isOwnProfile} authenticated={isAuthenticated} onLogin={() => setShowAuthWizard(true)} onFriendshipChange={setFriendshipAccepted} />

            {/* Tabs - Sticky */}
            {isAuthenticated && (
              <div ref={profileTabsRef} className="cv-profile-tabs">
                <ViewTabs items={[
                    { id: 'profile', label: t('profile.profile_tab') },
                    { id: 'photos', label: t('social.photos') },
                    ...(isOwnProfile ? [{ id: 'friends', label: t('social.friends') }] : []),
                    ...(canViewActivityTabs ? [
                     { id: 'posts', label: t('profile.posts_tab') },
                     { id: 'replies', label: t('profile.replies_tab') },
                     { id: 'media', label: t('profile.media_tab') },
                     { id: 'likes', label: t('profile.likes_tab') },
                    ] : []),
                  ]} activeId={activeTab} onSelect={id => { setActiveTab(id as typeof activeTab); requestAnimationFrame(() => profileTabsRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' })); }} label={t('app.nav.profile')} />
              </div>
            )}

            <div className="w-full min-w-0">
              {!isAuthenticated ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-6">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center border ${theme === 'dark' ? 'bg-white/[0.06] border-white/10' : 'bg-white/70 border-[var(--cv-inner-border)]'}`}>
                    <Lock className={`w-10 h-10 ${theme === 'dark' ? 'text-zinc-500' : 'text-brand'}`} />
                  </div>
                  <div className="max-w-xs mx-auto">
                    <h3 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>
                      {t('profile.private_profile', { defaultValue: 'Private Profile' })}
                    </h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'}`}>
                      {t('profile.login_to_view_details', { defaultValue: 'Log in to view full profile details, photos, and more.' })}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAuthWizard(true)}
                    className={`px-8 py-3 rounded-xl font-bold text-sm transition-all transform active:scale-95 ${theme === 'dark'
                      ? 'bg-brand text-zinc-950 hover:bg-brand'
                      : 'bg-brand-hovered text-white hover:bg-brand-hovered'
                      }`}
                  >
                    {t('auth.sign_in')}
                  </button>
                </div>
              ) : activeTab === 'photos' ? (
                <PhotoAlbum key={String(user.public_id || user.id)} ownerId={String(user.public_id || user.id)} own={!!isOwnProfile} embedded onClose={() => setActiveTab('profile')} />
              ) : activeTab === 'friends' && isOwnProfile ? (
                <FriendsPanel embedded onClose={() => setActiveTab('profile')} />
              ) : shouldShowPrivacyGate ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-6">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center border ${theme === 'dark' ? 'bg-white/[0.06] border-white/10' : 'bg-white/70 border-[var(--cv-inner-border)]'}`}>
                    <Lock className={`w-10 h-10 ${theme === 'dark' ? 'text-zinc-500' : 'text-brand'}`} />
                  </div>
                  <div className="max-w-md mx-auto space-y-2">
                    <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>
                      {t('profile.privacy_locked_title', { defaultValue: 'This profile is protected' })}
                    </h3>
                    <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'}`}>
                      {privacyGateDescription}
                    </p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'}`}>
                      {t('profile.privacy_locked_note', { defaultValue: 'Sensitive fields are hidden to protect member safety.' })}
                    </p>
                  </div>
                  {canRequestPrivacyAccess && (
                    <button
                      onClick={handleFollowClick}
                      disabled={isFollowPending}
                      className={`px-8 py-3 rounded-xl font-bold text-sm transition-all transform active:scale-95 ${theme === 'dark'
                        ? 'bg-brand text-zinc-950 hover:bg-brand'
                        : 'bg-brand-hovered text-white hover:bg-brand-hovered'
                        } ${isFollowPending ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      {isFollowPending
                        ? t('profile.saving', { defaultValue: 'Saving...' })
                        : t('profile.privacy_locked_cta_follow', { defaultValue: 'Follow to request access' })}
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Profile */}
                  {activeTab === 'profile' && (
                    <div className="cv-profile-details">
                      {error && isOwnProfile && <div className="cv-profile-preferences-feedback" role="alert"><span>{t('chat_actions.action_failed')}</span><button type="button" className="cv-icon-button" aria-label={t('app.close')} onClick={() => setError(null)}><TelegramIcon name="close" /></button></div>}
                      <PreferenceSection title={t('profile.attributes')} kind="attributes" categories={USER_ATTRIBUTES.map(item => ({ id: item.field, name: item.label, icon: `attribute-${item.field}` }))} options={fieldOptions} selected={profileTraitSelections} canEdit={!!isOwnProfile} busy={profilePreferencesBusy} loading={initialSyncLoading} failed={initialSyncError} onRetry={() => void refreshInitialSync()} onToggle={(field, id) => void handleFieldOptionSelect(field, id)} emptyLabel={t('profile.not_specified')} limit={6} />
                      <PreferenceSection title={t('profile.fantasies')} kind="fantasies" categories={fantasyCategories} options={fantasyOptions} selected={profileFantasySelections} canEdit={!!isOwnProfile} busy={profilePreferencesBusy} loading={initialSyncLoading} failed={initialSyncError} onRetry={() => void refreshInitialSync()} onToggle={(_, id) => void handleFantasyItemToggle(id)} emptyLabel={t('profile.no_fantasies_added')} />
                      <PreferenceSection title={t('profile.interests')} kind="interests" categories={interestCategories} options={interestOptions} selected={profileInterestSelections} canEdit={!!isOwnProfile} busy={profilePreferencesBusy} loading={initialSyncLoading} failed={initialSyncError} onRetry={() => void refreshInitialSync()} onToggle={(_, id) => void handleInterestItemToggle(id)} emptyLabel={t('profile.no_interests_added')} />
                    </div>
                  )}

                  {/* Posts / Media Masonry / Likes */}
                  {['posts', 'replies', 'media', 'likes'].includes(activeTab) && (
                  <div>
                    {activeTab === 'media' ? (
                      // Media Masonry Grid
                      <>
                        {mediasLoading ? (
                          <div className="flex items-center justify-center py-16">
                            <div className="flex flex-col items-center gap-4">
                              <div className={`w-12 h-12 border-4 ${theme === 'dark' ? 'border-gray-900 border-t-white' : 'border-gray-200 border-t-black'} rounded-full animate-spin`} />
                              <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                {t('profile.loading_media')}
                              </p>
                            </div>
                          </div>
                        ) : medias.length === 0 ? (
                          <AnimatedEmptyState title={t('profile.no_media_yet')} description={isOwnProfile ? t('profile.media_appear_here') : `@${user.username} ${t('profile.no_media_from_user')}`} />
                        ) : (
                          <div className="p-4">
                            <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-2 sm:gap-3">
                              {medias.map((media) => (
                                <Media key={media.id} media={media} />
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      // Regular Posts / Replies / Likes
                      <>
                        {postsLoading ? (
                          <div className="flex items-center justify-center py-16">
                            <div className="flex flex-col items-center gap-4">
                              <div className={`w-12 h-12 border-4 ${theme === 'dark' ? 'border-gray-900 border-t-white' : 'border-gray-200 border-t-black'} rounded-full animate-spin`} />
                              <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                {activeTab === 'posts' && t('profile.loading_posts')}
                                {activeTab === 'replies' && t('profile.loading_replies')}
                                {activeTab === 'likes' && t('profile.loading_likes')}
                              </p>
                            </div>
                          </div>
                        ) : posts.length === 0 ? (
                          <AnimatedEmptyState title={t(activeTab === 'posts' ? 'profile.no_posts_yet' : activeTab === 'replies' ? 'profile.no_replies_yet' : 'profile.no_likes_yet')} description={isOwnProfile ? t(activeTab === 'posts' ? 'profile.share_thoughts' : activeTab === 'replies' ? 'profile.replies_appear_here' : 'profile.likes_appear_here') : `@${user.username} ${t(activeTab === 'posts' ? 'profile.no_posts_from_user' : activeTab === 'replies' ? 'profile.no_replies_from_user' : 'profile.no_likes_from_user')}`} />
                        ) : (
                          posts.map((post) => (
                            <div
                              key={post.id}
                              style={profileFeedItemRenderStyle}
                              className={`${theme === 'dark' ? 'cv-card-surface-solid' : 'bg-white'}`}
                            >
                              <Post
                                post={post as any}
                                onPostClick={(postId, username) => navigate(`/${username}/status/${postId}`)}
                                onProfileClick={(username) => navigate(`/${username}`)}
                              />
                            </div>
                          ))
                        )}
                      </>
                    )}
                  </div>
                  )}
                </>
              )}
            </div>
          </main>
        )}
      </div>
      <Sheet isOpen={showProfileStats} onClose={() => setShowProfileStats(false)} title={t('match.stats')} className="cv-panel-sheet cv-profile-statistics" closeIcon={<TelegramIcon name="close" />}>
        <GroupedSection>
          {visibleEngagementItems.map(item => {
            const ItemIcon = item.icon;
            const isLocked = Boolean(item.requiresPremium && shouldLockPremiumEngagements);
            return (
              <ListRow
                key={item.id}
                icon={<ItemIcon aria-hidden="true" />}
                title={item.label}
                value={item.value.toLocaleString()}
                accessory={isLocked ? <Lock className="cv-list-disclosure" aria-label={t('premium.title')} /> : undefined}
                onClick={item.disabled ? undefined : () => {
                  setShowProfileStats(false);
                  if (isLocked) navigate('/premium');
                  else item.onClick();
                }}
              />
            );
          })}
        </GroupedSection>
      </Sheet>
      <AuthWizard
        isOpen={showAuthWizard}
        onClose={() => setShowAuthWizard(false)}
      />

    </>
  );

  if (inline) {
    return <div className="h-full w-full">{content}</div>;
  }

  return (
    <div className="skyline-page-scroll w-full">
      {content}
    </div>
  );
};

export default ProfileScreen;
