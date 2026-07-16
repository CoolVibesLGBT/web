import React, { useState, useEffect, useRef, type CSSProperties } from 'react';
import { useSEO } from '../hooks/useSEO';
import { useParams, useNavigate, useLocation } from '@/router';
import type { TravelData } from '../interfaces/user';
import { Calendar, MapPin, Link, Heart, Baby, Cigarette, Wine, Ruler, PawPrint, Church, GraduationCap, Eye, EyeOff, Lock, Palette, Accessibility, Paintbrush, RulerDimensionLine, Vegan, PersonStanding, Sparkles, Drama, Banana, Save, Camera, Image as ImageIcon, ChevronRight, Check, HeartHandshake, FileText, MessageCircle, Panda, Ghost, Rainbow, Transgender, Rabbit, ChevronLeft, ChevronDown, LocateFixed, UserCircle, Clock, Smile, HeartPulse, Bubbles, Leaf, Fingerprint, Wallet, Users, UserPlus, ThumbsUp, ThumbsDown, Shield, type LucideIcon } from 'lucide-react';
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
  icon: LucideIcon;
  onClick: () => void;
  visible: boolean;
  disabled?: boolean;
  requiresPremium?: boolean;
  iconClassName: string;
  accentClassName: string;
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

const profileSectionRenderStyle: CSSProperties = {
  contentVisibility: 'auto',
  contain: 'layout paint style',
  containIntrinsicSize: '1px 420px',
};

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

const getIsFollowingFromEngagements = (authUserData: unknown, targetUser: ProfileUser | null): boolean => {
  if (!authUserData || !targetUser) {
    return false;
  }

  const engagementDetails = (authUserData as { engagements?: { engagement_details?: UserEngagementDetail[] } })?.engagements?.engagement_details;
  if (!Array.isArray(engagementDetails)) {
    return false;
  }

  const targetPublicId = targetUser.public_id != null ? String(targetUser.public_id) : null;
  const targetId = targetUser.id;

  const matchesTarget = (detail: UserEngagementDetail) => {
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
    ].filter(Boolean) as string[];

    return !!targetId && candidateIds.some((id) => id === targetId);
  };

  return engagementDetails.some(matchesTarget);
};

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
    profile_image_url: getProfileAvatarUrl(userObj),
    cover_image_url: getProfileCoverUrl(userObj),
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

const withAdjustedFollowerCount = (profile: ProfileUser, delta: number): ProfileUser => {
  const currentFollowers =
    profile.followers_count ??
    profile.engagements?.counts?.follower_count ??
    0;
  const nextFollowers = Math.max(0, currentFollowers + delta);

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
  if (flags === BigInt(0)) return '';
  return flags.toString(16); // Return as hex string without 0x prefix
};

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
  const { data: appData, defaultLanguage } = useApp();
  const { t } = useTranslation('common');
  const { premiumFeatureEnabled, isPremiumUser } = usePremiumAccess();
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [medias, setMedias] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [mediasLoading, setMediasLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'posts' | 'replies' | 'media' | 'likes'>('profile');
  const [isFollowing, setIsFollowing] = useState(false);
  const skipFollowSyncRef = useRef(false);
  const [isFollowPending, setIsFollowPending] = useState(false);
  const [showAuthWizard, setShowAuthWizard] = useState(false);
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
  useEffect(() => {
    if (!user || !authUser) {
      setIsFollowing(false);
      return;
    }
    if (skipFollowSyncRef.current) {
      skipFollowSyncRef.current = false;
      return;
    }
    const nextFollowingState = getIsFollowingFromEngagements(authUser, user);
    setIsFollowing(nextFollowingState);
  }, [authUser, user]);
  const [isSaving, setIsSaving] = useState(false);
  const syncAuthFollowingState = React.useCallback((targetUser: ProfileUser, shouldFollow: boolean) => {
    if (!authUser) {
      return;
    }

    const currentEngagements = (authUser.engagements || {}) as UserEngagements;
    const currentDetails: UserEngagementDetail[] = (currentEngagements.engagement_details || []) as UserEngagementDetail[];
    const targetPublicId = targetUser.public_id != null ? String(targetUser.public_id) : null;
    const targetId = targetUser.id ? String(targetUser.id) : null;

    const matchesTarget = (detail: UserEngagementDetail) => {
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
      ].filter(Boolean) as string[];

      if (targetId && candidateIds.some((id) => id === targetId)) {
        return true;
      }

      return false;
    };

    const alreadyFollowing = currentDetails.some(matchesTarget);
    let updatedDetails = currentDetails;
    let followingDelta = 0;

    if (shouldFollow && !alreadyFollowing) {
      const targetRecipient = {
        id: targetUser.id,
        public_id: targetUser.public_id,
      };

      const newDetail: UserEngagementDetail = {
        kind: 'following',
        recipient_id: targetUser.id,
        recipient: targetRecipient,
        engagee_id: targetUser.id,
        engagee: targetRecipient,
      };
      updatedDetails = [...currentDetails, newDetail];
      followingDelta = 1;
    } else if (!shouldFollow && alreadyFollowing) {
      updatedDetails = currentDetails.filter((detail: UserEngagementDetail) => !matchesTarget(detail));
      followingDelta = -1;
    }

    if (followingDelta === 0 && updatedDetails === currentDetails) {
      return;
    }

    const currentFollowingCount =
      currentEngagements.counts?.following_count ??
      authUser?.following_count ??
      0;
    const nextFollowingCount = Math.max(0, currentFollowingCount + followingDelta);

    updateUser({
      following_count: nextFollowingCount,
      engagements: {
        ...currentEngagements,
        counts: {
          ...(currentEngagements.counts || {}),
          following_count: nextFollowingCount,
        },
        engagement_details: updatedDetails as any,
      },
    } as any);
    skipNextFetchRef.current = true;
  }, [authUser, updateUser]);
  const [editFormData, setEditFormData] = useState<Partial<ProfileUser>>({});
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);
  const [uploadingCoverImage, setUploadingCoverImage] = useState(false);
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  const skipNextFetchRef = useRef(false);
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
  const isFriendConnection = isMutualConnection;
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
  const userToCheck = (isEditMode && isAuthenticated && isOwnProfile && authUser) ? authUser : user;
  const preferencesFlags = React.useMemo(() => {
    const flagsString = (userToCheck as ProfileUser & { preferences_flags?: string })?.preferences_flags || '';
    return parsePreferencesFlags(flagsString);
  }, [userToCheck]);

  // Build fieldOptions from preferences.attributes
  const fieldOptions: Record<string, Array<{ id: string; name: string; display_order: number; bit_index?: number; allow_multiple?: boolean }>> = {};
  const fieldAllowMultiple: Record<string, boolean> = {};

  // Read from preferences.attributes if available, otherwise fallback to old structure
  const preferencesAttributes = (appData as InitialData | null)?.preferences?.attributes;
  if (preferencesAttributes && Array.isArray(preferencesAttributes)) {
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
    if (preferencesInterests && Array.isArray(preferencesInterests)) {
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
    if (selectedIds.length === 0) {
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
  }, [preferencesFlags, interestOptions, user, authUser, isEditMode, isAuthenticated, isOwnProfile]);

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
    if (Object.keys(grouped).length === 0) {
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
  }, [preferencesFlags, interestOptions, user, authUser, isEditMode, isAuthenticated, isOwnProfile, defaultLanguage]);

  // Build fantasyOptions and fantasyCategories from preferences.fantasies
  // Build fantasyOptions and fantasyCategories from preferences.fantasies
  const { fantasyOptions, fantasyCategories, fantasyAllowMultiple } = React.useMemo(() => {
    const options: Record<string, Array<{ id: string; name: string; description: string; bit_index?: number }>> = {};
    const categories: Array<{ id: string; name: string; allow_multiple?: boolean }> = [];
    const allowMultipleMap: Record<string, boolean> = {};

    // Read from preferences.fantasies if available, otherwise fallback to old structure
    const preferencesFantasies = (appData as any)?.preferences?.fantasies;
    if (preferencesFantasies && Array.isArray(preferencesFantasies)) {
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
    if (selectedIds.length === 0) {
      const fantasiesSource = (isEditMode && isAuthenticated && isOwnProfile && authUser) ? (authUser as any).fantasies : user?.fantasies;
      if (fantasiesSource) {
        return fantasiesSource.map((f: any) => (f as any).fantasy_id || (f as any).id);
      }
    }

    return selectedIds;
  }, [preferencesFlags, fantasyOptions, user, authUser, isEditMode, isAuthenticated, isOwnProfile]);

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
    if (Object.keys(grouped).length === 0) {
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
  }, [preferencesFlags, fantasyOptions, user, authUser, isEditMode, isAuthenticated, isOwnProfile, appData, defaultLanguage]);


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
    // Find the selected option to get both id and name
    const options = fieldOptions[field] || [];
    const selectedOption = options.find(opt => opt.id === value);
    const attributeId = selectedOption ? selectedOption.id : value;

    if (!attributeId) {
      console.error(`No attribute ID found for field ${field}`);
      return;
    }

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
        newPreferencesFlags = setBit(newPreferencesFlags, selectedOption.bit_index);
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
        newPreferencesFlags = setBit(newPreferencesFlags, interestItem.bit_index);
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
      setUpdatingInterests(false);
    }
  };



  const handleFantasyItemToggle = async (fantasyId: string) => {
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
        newPreferencesFlags = setBit(newPreferencesFlags, fantasyItem.bit_index);
      }
    }

    // Optimistically update preferences_flags in user state for immediate UI feedback
    if (usePreferencesFlags && fantasyItem?.bit_index !== undefined) {
      const flagsString = serializePreferencesFlags(newPreferencesFlags);
      const userToUpdate = (isEditMode && isAuthenticated && isOwnProfile && authUser) ? authUser : user;
      if (userToUpdate) {
        const updatedUserData = {
          ...userToUpdate,
          preferences_flags: flagsString,
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
        const userToRevert = (isEditMode && isAuthenticated && isOwnProfile && authUser) ? authUser : user;
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

      if (skipNextFetchRef.current) {
        skipNextFetchRef.current = false;
        return;
      }

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
    if (canViewActivityTabs || activeTab === 'profile') {
      return;
    }
    setActiveTab('profile');
  }, [canViewActivityTabs, activeTab]);

  // Fetch posts based on active tab
  useEffect(() => {
    const fetchUserPosts = async () => {
      // Don't fetch if on profile tab or privacy does not allow activity visibility
      if (activeTab === 'profile' || !canViewActivityTabs) {
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

    if (activeTab !== 'profile' && canViewActivityTabs) {
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
    if (!user?.public_id || isFollowPending) return;

    const targetUser = user;
    const wasFollowing = isFollowing;
    const nextIsFollowing = !wasFollowing;
    const followerDelta = nextIsFollowing ? 1 : -1;
    const currentFollowers =
      targetUser.followers_count ??
      targetUser.engagements?.counts?.follower_count ??
      0;
    const expectedFollowers = Math.max(0, currentFollowers + followerDelta);

    skipFollowSyncRef.current = true;
    setIsFollowPending(true);
    setIsFollowing(nextIsFollowing);
    setUser((prevUser) => (prevUser ? withAdjustedFollowerCount(prevUser, followerDelta) : prevUser));

    try {
      const followResponse = await api.toggleFollow({
        followee_id: user.public_id,
      });

      const responseUser =
        (followResponse as any)?.target_user ||
        (followResponse as any)?.followee ||
        (followResponse as any)?.user;

      const normalized = normalizeProfileUser(responseUser);
      if (normalized && (normalized as any).id === (targetUser as any).id) {
        const normalizedFollowers =
          normalized.followers_count ??
          normalized.engagements?.counts?.follower_count ??
          expectedFollowers;
        const shouldKeepOptimistic = normalizedFollowers === currentFollowers;
        const finalFollowers = shouldKeepOptimistic ? expectedFollowers : normalizedFollowers;

        setUser({
          ...normalized,
          followers_count: finalFollowers,
          engagements: {
            ...(normalized.engagements || {}),
            counts: {
              ...(normalized.engagements?.counts || {}),
              follower_count: finalFollowers,
            },
          },
        });
      }

      syncAuthFollowingState(targetUser, nextIsFollowing);
    } catch (error) {
      console.error('Error toggling follow:', error);
      setIsFollowing(wasFollowing);
      setUser((prevUser) => (prevUser ? withAdjustedFollowerCount(prevUser, -followerDelta) : prevUser));
      // Optionally show error message to user
    } finally {
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
          <div className={`w-16 h-16 border-4 ${theme === 'dark' ? 'border-white/10 border-t-sky-400' : 'border-sky-100 border-t-sky-600'} rounded-full animate-spin`} />
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
      iconClassName: theme === 'dark' ? 'bg-sky-400/10 text-sky-300' : 'bg-sky-50 text-sky-700',
      accentClassName: 'bg-sky-500',
    },
    {
      id: 'followers',
      label: followersLabel,
      value: followerCountDisplay,
      icon: Users,
      onClick: () => handleEngagementNavigate('followers'),
      visible: true,
      disabled: !canViewSensitiveProfileSections && !isOwnProfile,
      iconClassName: theme === 'dark' ? 'bg-cyan-400/10 text-cyan-300' : 'bg-cyan-50 text-cyan-700',
      accentClassName: 'bg-cyan-500',
    },
    {
      id: 'blocking',
      label: blockingLabel,
      value: blockingCountDisplay,
      icon: Shield,
      onClick: () => handleEngagementNavigate('blocking'),
      visible: canViewSensitiveProfileSections && (isOwnProfile || blockingCountDisplay > 0),
      requiresPremium: true,
      iconClassName: theme === 'dark' ? 'bg-amber-400/10 text-amber-300' : 'bg-amber-50 text-amber-700',
      accentClassName: 'bg-amber-500',
    },
    {
      id: 'blocked_by',
      label: blockedByLabel,
      value: blockedByCountDisplay,
      icon: Lock,
      onClick: () => handleEngagementNavigate('blocked_by'),
      visible: canViewSensitiveProfileSections && (isOwnProfile || blockedByCountDisplay > 0),
      requiresPremium: true,
      iconClassName: theme === 'dark' ? 'bg-orange-400/10 text-orange-300' : 'bg-orange-50 text-orange-700',
      accentClassName: 'bg-orange-500',
    },
    {
      id: 'like_given',
      label: likeGivenLabel,
      value: likeGivenCountDisplay,
      icon: ThumbsUp,
      onClick: () => handleEngagementNavigate('like_given'),
      visible: canViewSensitiveProfileSections && (isOwnProfile || likeGivenCountDisplay > 0),
      requiresPremium: true,
      iconClassName: theme === 'dark' ? 'bg-emerald-400/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700',
      accentClassName: 'bg-emerald-500',
    },
    {
      id: 'like_received',
      label: likeReceivedLabel,
      value: likeReceivedCountDisplay,
      icon: Heart,
      onClick: () => handleEngagementNavigate('like_received'),
      visible: canViewSensitiveProfileSections && (isOwnProfile || likeReceivedCountDisplay > 0),
      requiresPremium: true,
      iconClassName: theme === 'dark' ? 'bg-rose-400/10 text-rose-300' : 'bg-rose-50 text-rose-700',
      accentClassName: 'bg-rose-500',
    },
    {
      id: 'dislike_given',
      label: dislikeGivenLabel,
      value: dislikeGivenCountDisplay,
      icon: ThumbsDown,
      onClick: () => handleEngagementNavigate('dislike_given'),
      visible: canViewSensitiveProfileSections && (isOwnProfile || dislikeGivenCountDisplay > 0),
      requiresPremium: true,
      iconClassName: theme === 'dark' ? 'bg-violet-400/10 text-violet-300' : 'bg-violet-50 text-violet-700',
      accentClassName: 'bg-violet-500',
    },
    {
      id: 'dislike_received',
      label: dislikeReceivedLabel,
      value: dislikeReceivedCountDisplay,
      icon: EyeOff,
      onClick: () => handleEngagementNavigate('dislike_received'),
      visible: canViewSensitiveProfileSections && (isOwnProfile || dislikeReceivedCountDisplay > 0),
      requiresPremium: true,
      iconClassName: theme === 'dark' ? 'bg-fuchsia-400/10 text-fuchsia-300' : 'bg-fuchsia-50 text-fuchsia-700',
      accentClassName: 'bg-fuchsia-500',
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
      iconClassName: theme === 'dark' ? 'bg-pink-400/10 text-pink-300' : 'bg-pink-50 text-pink-700',
      accentClassName: 'bg-pink-500',
    },
    {
      id: 'view_received',
      label: viewReceivedLabel,
      value: viewReceivedCountDisplay,
      icon: Eye,
      onClick: () => handleEngagementNavigate('view_received'),
      visible: canViewSensitiveProfileSections && (isOwnProfile || viewReceivedCountDisplay > 0),
      requiresPremium: true,
      iconClassName: theme === 'dark' ? 'bg-indigo-400/10 text-indigo-300' : 'bg-indigo-50 text-indigo-700',
      accentClassName: 'bg-indigo-500',
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
      <div ref={profileViewRef} className={inline || isEmbed ? 'w-full' : 'mx-auto w-full max-w-[1380px] px-1 pb-8 pt-24 md:px-2 md:pt-28'}>
        {isEditMode ? (
          // Edit Profile View
          <main className={`flex-1 w-full min-w-0 overflow-hidden rounded-[36px] ${theme === 'dark' ? 'cv-card-surface-soft' : 'bg-white/70'}`}>
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
                      <div className={`w-full h-48 rounded-[28px] overflow-hidden border ${theme === 'dark' ? 'bg-white/[0.06] border-white/10' : 'bg-white/70 border-white/80'}`}>
                        {(coverImagePreview || getCoverImageUrl()) ? (
                          <img
                            src={coverImagePreview || getCoverImageUrl() || ''}
                            alt="Cover"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className={`w-12 h-12 ${theme === 'dark' ? 'text-zinc-600' : 'text-sky-300'}`} />
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
                        <div className={`w-32 h-32 rounded-full overflow-hidden border ${theme === 'dark' ? 'bg-white/[0.06] border-white/10' : 'bg-white/70 border-white/80'}`}>
                          {(profileImagePreview || getProfileImageUrl()) ? (
                            <img
                              src={profileImagePreview || getProfileImageUrl() || ''}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className={`w-8 h-8 ${theme === 'dark' ? 'text-zinc-600' : 'text-sky-300'}`} />
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
                              : 'bg-white text-slate-900 border-white/80 hover:bg-sky-50'
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
                  <div className={`sticky z-20 border-b ${theme === 'dark' ? 'cv-card-surface-soft border-white/10' : 'border-white/70 bg-white/70'} backdrop-blur-2xl`} style={{ top: '0' }}>
                    <div className="flex px-4 sm:px-6 relative">
                      {[
                        { id: 'profile', label: t('profile.profile_info') || 'Profile Info' },
                        { id: 'attributes', label: t('profile.attributes') },
                        { id: 'interests', label: t('profile.interests') },
                        { id: 'fantasies', label: t('profile.fantasies') },
                      ].map((tab) => (
                        <motion.button
                          key={tab.id}
                          onClick={() => setEditTab(tab.id as 'profile' | 'attributes' | 'interests' | 'fantasies')}
                          className={`flex-1 py-3 font-semibold text-sm relative transition-colors ${editTab === tab.id
                            ? theme === 'dark' ? 'text-white' : 'text-slate-950'
                            : theme === 'dark' ? 'text-zinc-500 hover:text-zinc-300' : 'text-slate-500 hover:text-slate-700'
                            }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <span className="relative z-10">{tab.label}</span>
                          {editTab === tab.id && (
                            <motion.div
                              className="absolute bottom-0 left-0 right-0 h-1 rounded-t-full bg-sky-600"
                              layoutId="editModeTabIndicator"
                              transition={{
                                type: "spring",
                                stiffness: 380,
                                damping: 30,
                                mass: 0.8
                              }}
                            />
                          )}
                        </motion.button>
                      ))}
                    </div>
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
                                  <p className={`text-[11px] font-bold uppercase tracking-[0.14em] ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
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
                                    className={`w-full rounded-xl border px-3 py-2.5 text-left flex items-start justify-between gap-3 transition-all ${theme === 'dark'
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
                                        {step.done ? <Check className="w-3 h-3" /> : <span className="text-[10px] font-bold">{profileWizardSteps.findIndex((item) => item.id === step.id) + 1}</span>}
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
                              className="w-full flex items-start justify-between gap-4 text-left"
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
                              className={`rounded-2xl border p-5 ${theme === 'dark'
                                ? 'bg-gray-900/30 border-gray-900'
                                : 'bg-white border-gray-200 shadow-sm'
                                }`}
                            >
                              <button
                                type="button"
                                onClick={() => setIsPasswordSectionOpen((prev) => !prev)}
                                className="w-full flex items-start justify-between gap-4 text-left"
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
                                {t('profile.attributes')}
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
                                          <item.icon className="w-5 h-5" />
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
                                                      className={`text-left rounded-xl p-3.5 transition-all duration-200 relative ${isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'} ${isSelected
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
                                {t('profile.interests')}
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
                                              {category.name}
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
                                                  {item.emoji && <span>{item.emoji}</span>}
                                                  {item.name}
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
                                                      className={`text-left rounded-xl p-3.5 transition-all duration-200 relative ${updatingInterests ? 'opacity-50 cursor-wait' : 'cursor-pointer'} ${isSelected
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
                                                              {item.emoji && <span className="mr-1.5">{item.emoji}</span>}
                                                              {item.name}
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
                                {t('profile.fantasies')}
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
                                              {category.name}
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
                                                  {item.name}
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
                                                      className={`text-left rounded-xl p-3.5 transition-all duration-200 relative ${updatingFantasies ? 'opacity-50 cursor-wait' : 'cursor-pointer'} ${isSelected
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
                                                              {item.name}
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
                    <div className={`flex items-center justify-end gap-3 pt-6 pb-8 px-4 sm:px-6 border-t ${theme === 'dark' ? 'cv-card-surface-soft border-white/10' : 'bg-white/60 border-white/70'}`}>
                      <button
                        onClick={() => closeProfileEditMode({ replace: true })}
                        className={`px-6 py-3 rounded-full font-semibold transition-all duration-200 border ${theme === 'dark'
                          ? 'bg-white/[0.08] border-white/10 text-zinc-300 hover:bg-white/[0.12]'
                          : 'bg-white/80 border-white/80 text-slate-700 hover:bg-white'
                          }`}
                      >
                        {t('profile.cancel')}
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={isSaving || uploadingProfileImage || uploadingCoverImage}
                        className={`px-6 py-3 rounded-full font-semibold transition-all duration-200 flex items-center gap-2 ${isSaving || uploadingProfileImage || uploadingCoverImage
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : theme === 'dark'
                            ? 'bg-sky-400 text-zinc-950 hover:bg-sky-300'
                            : 'bg-sky-600 text-white hover:bg-sky-700'
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
          <main className={`relative flex-1 w-full min-w-0 overflow-hidden rounded-[24px] border ${theme === 'dark' ? 'border-white/10 bg-[#090909]' : 'border-slate-200/80 bg-white'}`}>

            <section className="relative overflow-hidden">
              <div className={`relative h-[220px] overflow-hidden sm:h-[260px] ${theme === 'dark' ? 'bg-zinc-950' : 'bg-slate-100'}`}>
                {getCoverImageUrl() ? (
                  <img
                    src={getCoverImageUrl() || ''}
                    alt="Cover"
                    className={`h-full w-full object-cover ${!isAuthenticated ? 'blur-xl' : ''}`}
                  />
                ) : (
                  <div className={`h-full w-full ${theme === 'dark' ? 'bg-gradient-to-br from-zinc-900 via-zinc-950 to-black' : 'bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300'}`} />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/[0.08] via-transparent to-black/[0.28]" />
              </div>

              <div className="relative px-4 pb-5 sm:px-6 lg:px-8">
                <div className={`border-b py-5 ${theme === 'dark' ? 'border-white/10' : 'border-slate-200/80'}`}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end">
                      <div className={`relative z-10 -mt-16 h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 sm:-mt-20 sm:h-32 sm:w-32 ${theme === 'dark' ? 'border-[#090909] bg-zinc-900' : 'border-white bg-slate-100'}`}>
                        {getProfileImageUrl() ? (
                          <img
                            src={getProfileImageUrl() || ''}
                            alt={user.displayname || user.username}
                            className={`h-full w-full object-cover ${!isAuthenticated ? 'blur-xl' : ''}`}
                          />
                        ) : (
                          <div className={`flex h-full w-full items-center justify-center ${theme === 'dark' ? 'bg-white/[0.06] text-zinc-500' : 'bg-slate-100 text-slate-400'}`}>
                            <UserCircle className="h-14 w-14" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 pb-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className={`min-w-0 text-2xl font-black leading-tight tracking-normal sm:text-3xl ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>
                            {user.displayname || user.username}
                          </h2>
                        </div>
                        <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'}`}>
                          @{user.username}
                        </p>
                      </div>
                    </div>

                    {isOwnProfile ? (
                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <button
                          onClick={() => navigate('/wallet')}
                          className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-bold transition-colors ${theme === 'dark' ? 'border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]' : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'}`}
                        >
                          <Wallet className="h-4 w-4" />
                          <span>{t('wallet.title') || 'Wallet'}</span>
                        </button>
                        <button
                          onClick={() => navigate('/messages')}
                          className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-bold transition-colors ${theme === 'dark' ? 'border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]' : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'}`}
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span>{t('app.nav.messages', { defaultValue: 'Chat' })}</span>
                        </button>
                        <button
                          onClick={openProfileEditMode}
                          className={`inline-flex h-10 items-center rounded-full px-5 text-sm font-black transition-colors ${theme === 'dark' ? 'bg-white text-black hover:bg-white/90' : 'bg-slate-950 text-white hover:bg-slate-800'}`}
                        >
                          {t('profile.edit_profile_button')}
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <button
                          onClick={handleFollowClick}
                          disabled={isFollowPending}
                          className={`inline-flex h-10 items-center rounded-full px-5 text-sm font-black transition-colors ${isFollowing
                            ? theme === 'dark'
                              ? 'border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]'
                              : 'border border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                            : theme === 'dark'
                              ? 'bg-white text-black hover:bg-white/90'
                              : 'bg-slate-950 text-white hover:bg-slate-800'
                            } ${isFollowPending ? 'cursor-not-allowed opacity-60' : ''}`}
                        >
                          {isFollowing ? t('profile.following') : t('profile.follow')}
                        </button>
                        <button
                          onClick={() => handleSendMessage(user)}
                          disabled={!canViewSensitiveProfileSections}
                          className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-bold transition-colors ${theme === 'dark' ? 'border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]' : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'} ${!canViewSensitiveProfileSections ? 'cursor-not-allowed opacity-50' : ''}`}
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span>{t('profile.send_message', { defaultValue: 'Send Message' })}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {canViewSensitiveProfileSections && profileBioText && (
                    <div className="mt-4 max-w-3xl">
                      <ProfileBioPreview theme={theme} content={profileBioText} />
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                    {canViewSensitiveProfileSections && getLocationDisplay(user.location) && (
                      <div className={`inline-flex items-center gap-1.5 font-semibold ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'}`}>
                        <MapPin className="h-4 w-4" />
                        <span>{getLocationDisplay(user.location)}</span>
                      </div>
                    )}
                    {canViewSensitiveProfileSections && user.website && (
                      <div className={`inline-flex items-center gap-1.5 font-semibold ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'}`}>
                        <Link className="h-4 w-4" />
                        <a href={user.website} className="hover:underline" target="_blank" rel="noopener noreferrer">
                          {user.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                    {!canViewSensitiveProfileSections && (
                      <div className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold ${theme === 'dark' ? 'bg-white/[0.06] text-zinc-300' : 'bg-slate-100 text-slate-700'}`}>
                        {t('profile.privacy_limited_badge', { defaultValue: 'Limited by privacy settings' })}
                      </div>
                    )}
                    <div className={`inline-flex items-center gap-1.5 font-semibold ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'}`}>
                      <Calendar className="h-4 w-4" />
                      <span>{formatJoinDate(user.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="px-4 sm:px-6 lg:px-8">

              {/* Stats */}
              <div className={`mb-5 grid gap-2.5 ${canViewSensitiveProfileSections ? 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-5' : 'grid-cols-2'}`}>
                {visibleEngagementItems
                  .map((item) => {
                    const isLocked = Boolean(item.requiresPremium && shouldLockPremiumEngagements);
                    const ItemIcon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          if (item.disabled) {
                            return;
                          }
                          if (isLocked) {
                            navigate('/premium');
                            return;
                          }
                          item.onClick();
                        }}
                        disabled={item.disabled}
                        className={`group relative min-h-[88px] overflow-hidden rounded-2xl border px-3.5 py-3 text-left transition-colors active:scale-[0.99] ${theme === 'dark'
                          ? 'border-white/10 bg-white/[0.035] text-zinc-300 hover:bg-white/[0.07] hover:text-white'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                          } ${item.disabled ? 'cursor-default opacity-70 active:scale-100' : ''}`}
                      >
                        <span className="flex items-start justify-between gap-2">
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.iconClassName}`}>
                            <ItemIcon className="h-4 w-4" strokeWidth={1.9} />
                          </span>
                          {isLocked && (
                            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${theme === 'dark' ? 'bg-white/[0.07] text-zinc-400' : 'bg-slate-100 text-slate-500'}`}>
                              <Lock className="h-3.5 w-3.5" />
                            </span>
                          )}
                        </span>

                        <span className="mt-2.5 flex min-w-0 items-end justify-between gap-2">
                          <span className="min-w-0">
                            <span className={`block text-[22px] font-black leading-none tabular-nums tracking-normal ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>
                              {item.value.toLocaleString()}
                            </span>
                            <span className={`mt-1 block min-h-[2rem] text-[11px] font-semibold leading-4 ${theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'}`}>
                              {item.label}
                            </span>
                          </span>
                          {!item.disabled && (
                            <ChevronRight className={`mb-0.5 h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${theme === 'dark' ? 'text-white/20' : 'text-slate-300'}`} />
                          )}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Tabs - Sticky */}
            {canViewActivityTabs && (
              <div className={`sticky z-20 border-b ${theme === 'dark' ? 'border-white/10 bg-[#090909]/95' : 'border-slate-200 bg-white/95'} backdrop-blur-xl`} style={{ top: '0' }}>
                <div className="relative flex overflow-x-auto no-scrollbar">
                  {[
                    { id: 'profile', label: t('profile.profile_tab') },
                    { id: 'posts', label: t('profile.posts_tab') },
                    { id: 'replies', label: t('profile.replies_tab') },
                    { id: 'media', label: t('profile.media_tab') },
                    { id: 'likes', label: t('profile.likes_tab') },
                  ].map((tab) => (
                    <motion.button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as 'profile' | 'posts' | 'replies' | 'media' | 'likes')}
                      className={`relative h-12 min-w-[88px] flex-1 px-3 text-sm font-bold transition-colors ${activeTab === tab.id
                        ? theme === 'dark' ? 'text-white' : 'text-slate-950'
                        : theme === 'dark' ? 'text-zinc-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                        }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="relative z-10">{tab.label}</span>
                      {activeTab === tab.id && (
                        <motion.div
                          className={`absolute bottom-0 left-3 right-3 h-0.5 rounded-full ${theme === 'dark' ? 'bg-white' : 'bg-slate-950'}`}
                          layoutId="profileViewTabIndicator"
                          transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 30,
                            mass: 0.8
                          }}
                        />
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            <div className="w-full min-h-[520px]">
              {!isAuthenticated ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-6">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center border ${theme === 'dark' ? 'bg-white/[0.06] border-white/10' : 'bg-white/70 border-white/80'}`}>
                    <Lock className={`w-10 h-10 ${theme === 'dark' ? 'text-zinc-500' : 'text-sky-400'}`} />
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
                      ? 'bg-sky-400 text-zinc-950 hover:bg-sky-300'
                      : 'bg-sky-600 text-white hover:bg-sky-700'
                      }`}
                  >
                    {t('auth.sign_in')}
                  </button>
                </div>
              ) : shouldShowPrivacyGate ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-6">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center border ${theme === 'dark' ? 'bg-white/[0.06] border-white/10' : 'bg-white/70 border-white/80'}`}>
                    <Lock className={`w-10 h-10 ${theme === 'dark' ? 'text-zinc-500' : 'text-sky-400'}`} />
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
                        ? 'bg-sky-400 text-zinc-950 hover:bg-sky-300'
                        : 'bg-sky-600 text-white hover:bg-sky-700'
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
                    <div className="px-4 py-6 sm:px-6 space-y-10">
                      {/* Attributes Section */}
                      <div className="w-full" style={profileSectionRenderStyle}>
                        <div className="flex items-center justify-between mb-4">
                          <h2 className={`text-[22px] font-bold tracking-[-0.022em] leading-none ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>
                            {t('profile.attributes')}
                          </h2>
                          <span className={`text-[13px] font-semibold ${theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'}`}>
                            {filledAttributeCount} / {USER_ATTRIBUTES.length}
                          </span>
                        </div>
                        <div className={`rounded-[28px] overflow-hidden border ${theme === 'dark'
                          ? 'bg-zinc-900/[0.55] border-white/10'
                          : 'bg-white/[0.62] border-white/80'
                          }`}>
                          {USER_ATTRIBUTES.map((item, index) => {
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
                            if (usePreferencesFlags) {
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

                            if (!hasValue) {
                              displayValue = t('profile.select_option');
                            }

                            const isLast = index === USER_ATTRIBUTES.length - 1;

                            const isMultipleSelection = allowMultiple && usePreferencesFlags && selectedOptions.length > 1;

                            return (
                              <div
                                key={item.field}
                                className={`group ${isMultipleSelection ? 'flex-col items-start' : 'flex items-center justify-between'} px-4 py-3 transition-all duration-200 ${!isLast ? `border-b ${theme === 'dark' ? 'border-white/[0.06]' : 'border-black/[0.04]'}` : ''
                                  } ${theme === 'dark' ? 'hover:bg-white/[0.03] active:bg-white/[0.05]' : 'hover:bg-black/[0.02] active:bg-black/[0.03]'}`}
                              >
                                <div className="flex items-center gap-3 min-w-0 flex-1 w-full">
                                  <div className={`p-2.5 rounded-[10px] transition-all duration-200 flex-shrink-0 ${theme === 'dark'
                                    ? 'bg-white/[0.08] group-hover:bg-white/[0.12]'
                                    : 'bg-black/[0.04] group-hover:bg-black/[0.06]'
                                    }`}>
                                    <item.icon className={`w-7 h-7 ${theme === 'dark' ? 'text-white/90' : 'text-black/90'}`} />
                                  </div>
                                  <span className={`text-[15px] font-medium tracking-[-0.011em] ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                                    {item.label}
                                  </span>
                                </div>
                                <div className={`flex items-center gap-2 ${isMultipleSelection ? 'w-full mt-2 ml-11' : 'flex-shrink-0'}`}>
                                  {!hasValue && (
                                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${theme === 'dark' ? 'bg-yellow-400/80' : 'bg-yellow-500/80'}`} />
                                  )}
                                  {isMultipleSelection ? (
                                    <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                                      {selectedOptions.map((opt) => (
                                        <span
                                          key={opt.id}
                                          className={`inline-flex items-center px-2.5 py-1 text-[12px] font-medium tracking-[-0.006em] rounded-full ${theme === 'dark'
                                            ? 'bg-white/[0.08] text-gray-300'
                                            : 'bg-black/[0.04] text-gray-700'
                                            }`}
                                        >
                                          {opt.name}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className={`text-[13px] font-medium tracking-[-0.006em] ${isMultipleSelection ? 'break-words' : 'whitespace-nowrap'} ${hasValue
                                      ? (theme === 'dark' ? 'text-gray-400' : 'text-gray-500')
                                      : (theme === 'dark' ? 'text-yellow-400/90' : 'text-yellow-600/90')
                                      }`}>
                                      {displayValue}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Fantasies Section */}
                      <div style={profileSectionRenderStyle}>
                        <div className="flex items-center justify-between mb-4">
                          <h2 className={`text-[22px] font-bold tracking-[-0.022em] leading-none ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>
                            {t('profile.fantasies')}
                          </h2>
                          {(() => {
                            // Count fantasies from preferences_flags or fallback to old structure
                            const totalCount = Object.values(userSelectedFantasiesByCategory).reduce((sum, items) => sum + items.length, 0);
                            const fallbackCount = (() => {
                              const fantasiesSource = (isOwnProfile && isAuthenticated && authUser) ? (authUser as any).fantasies : user?.fantasies;
                              return fantasiesSource?.length || 0;
                            })();
                            const displayCount = totalCount > 0 ? totalCount : fallbackCount;
                            if (displayCount > 0) {
                              return (
                                <span className={`text-[13px] font-semibold ${theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'}`}>
                                  {displayCount}
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>
                        {(() => {
                          // Use preferences_flags data first, fallback to old structure
                          const hasPreferencesData = Object.keys(userSelectedFantasiesByCategory).length > 0;

                          if (hasPreferencesData) {
                            // Use new preferences_flags structure
                            return (
                              <div className="space-y-3">
                                {Object.entries(userSelectedFantasiesByCategory).map(([categorySlug, categoryFantasies]) => {
                                  // Get category name from fantasyCategories
                                  const category = fantasyCategories.find(c => c.id === categorySlug);
                                  const categoryName = category?.name || categorySlug;

                                  return (
                                    <div
                                      key={categorySlug}
                                      className={`rounded-[24px] overflow-hidden border ${theme === 'dark'
                                        ? 'bg-zinc-900/[0.55] border-white/10'
                                        : 'bg-white/[0.62] border-white/80'
                                        }`}
                                    >
                                      <div className={`px-4 py-2.5 border-b ${theme === 'dark' ? 'border-white/[0.06]' : 'border-black/[0.04]'}`}>
                                        <h3 className={`text-[11px] font-bold uppercase tracking-[0.08em] ${theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'}`}>
                                          {categoryName}
                                        </h3>
                                      </div>
                                      <div className="p-3.5 flex flex-wrap gap-2">
                                        {categoryFantasies.map((fantasy) => (
                                          <span
                                            key={fantasy.id}
                                            className={`px-4 py-2 text-[14px] font-medium tracking-[-0.006em] rounded-full transition-all duration-200 cursor-default ${theme === 'dark'
                                              ? 'bg-white/[0.08] text-gray-200 hover:bg-white/[0.12] active:scale-[0.98]'
                                              : 'bg-black/[0.04] text-gray-800 hover:bg-black/[0.06] active:scale-[0.98]'
                                              }`}
                                          >
                                            {fantasy.name}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          }

                          // Fallback to old structure
                          const fantasiesSource = (isOwnProfile && isAuthenticated && authUser) ? (authUser as any).fantasies : user?.fantasies;
                          if (fantasiesSource && fantasiesSource.length > 0) {
                            // Group fantasies by category slug
                            const fantasiesByCategory: Record<string, typeof fantasiesSource> = {};
                            fantasiesSource.forEach((f: any) => {
                              const categorySlug = f.fantasy?.slug || 'other';
                              if (!fantasiesByCategory[categorySlug]) {
                                fantasiesByCategory[categorySlug] = [];
                              }
                              fantasiesByCategory[categorySlug].push(f);
                            });

                            return (
                              <div className="space-y-3">
                                {Object.entries(fantasiesByCategory).map(([categorySlug, categoryFantasies]) => {
                                  // Get category name from the first fantasy in this group
                                  const firstFantasy = categoryFantasies[0]?.fantasy;
                                  const categoryName = firstFantasy?.category?.[defaultLanguage] ||
                                    firstFantasy?.category?.en ||
                                    (firstFantasy?.category ? Object.values(firstFantasy.category)[0] : null) ||
                                    categorySlug;
                                  return (
                                    <div
                                      key={categorySlug}
                                      className={`rounded-[24px] overflow-hidden border ${theme === 'dark'
                                        ? 'bg-zinc-900/[0.55] border-white/10'
                                        : 'bg-white/[0.62] border-white/80'
                                        }`}
                                    >
                                      <div className={`px-4 py-2.5 border-b ${theme === 'dark' ? 'border-white/[0.06]' : 'border-black/[0.04]'}`}>
                                        <h3 className={`text-[11px] font-bold uppercase tracking-[0.08em] ${theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'}`}>
                                          {categoryName}
                                        </h3>
                                      </div>
                                      <div className="p-3.5 flex flex-wrap gap-2">
                                        {categoryFantasies.map((f: any) => {
                                          const label = f.fantasy?.label?.[defaultLanguage] ||
                                            f.fantasy?.label?.en ||
                                            Object.values(f.fantasy?.label || {})[0] ||
                                            `Fantasy ${f.fantasy_id || f.id}`;
                                          return (
                                            <span
                                              key={f.id || f.fantasy_id}
                                              className={`px-4 py-2 text-[14px] font-medium tracking-[-0.006em] rounded-full transition-all duration-200 cursor-default ${theme === 'dark'
                                                ? 'bg-white/[0.08] text-gray-200 hover:bg-white/[0.12] active:scale-[0.98]'
                                                : 'bg-black/[0.04] text-gray-800 hover:bg-black/[0.06] active:scale-[0.98]'
                                                }`}
                                            >
                                              {label}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          }

                          // No fantasies
                          return (
                            <div className={`text-center py-16 rounded-[18px] ${theme === 'dark'
                              ? 'border border-white/[0.06]'
                              : 'border border-black/[0.06]'
                              }`}>
                              <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${theme === 'dark' ? 'bg-white/[0.08]' : 'bg-black/[0.04]'}`}>
                                <Sparkles className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                              </div>
                              <p className={`text-[15px] font-medium ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>{t('profile.no_fantasies_added')}</p>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Interests Section */}
                      <div style={profileSectionRenderStyle}>
                        <div className="flex items-center justify-between mb-4">
                          <h2 className={`text-[22px] font-bold tracking-[-0.022em] leading-none ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>
                            {t('profile.interests')}
                          </h2>
                          {(() => {
                            // Count interests from preferences_flags or fallback to old structure
                            const totalCount = Object.values(userSelectedInterestsByCategory).reduce((sum, items) => sum + items.length, 0);
                            const fallbackCount = (() => {
                              const interestsSource = (isOwnProfile && isAuthenticated && authUser && (authUser as any).interests)
                                ? (authUser as any).interests
                                : user?.interests;
                              return interestsSource?.length || 0;
                            })();
                            const displayCount = totalCount > 0 ? totalCount : fallbackCount;
                            if (displayCount > 0) {
                              return (
                                <span className={`text-[13px] font-semibold ${theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'}`}>
                                  {displayCount}
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>
                        {(() => {
                          // Use preferences_flags data first, fallback to old structure
                          const hasPreferencesData = Object.keys(userSelectedInterestsByCategory).length > 0;

                          if (hasPreferencesData) {
                            // Use new preferences_flags structure
                            return (
                              <div className="space-y-3">
                                {Object.entries(userSelectedInterestsByCategory).map(([categoryId, categoryInterests]) => {
                                  // Get category name from interestCategories
                                  const category = interestCategories.find(c => c.id === categoryId);
                                  const categoryName = category?.name || categoryId;

                                  return (
                                    <div
                                      key={categoryId}
                                      className={`rounded-[24px] overflow-hidden border ${theme === 'dark'
                                        ? 'bg-zinc-900/[0.55] border-white/10'
                                        : 'bg-white/[0.62] border-white/80'
                                        }`}
                                    >
                                      <div className={`px-4 py-2.5 border-b ${theme === 'dark' ? 'border-white/[0.06]' : 'border-black/[0.04]'}`}>
                                        <h3 className={`text-[11px] font-bold uppercase tracking-[0.08em] ${theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'}`}>
                                          {categoryName}
                                        </h3>
                                      </div>
                                      <div className="p-3.5 flex flex-wrap gap-2">
                                        {categoryInterests.map((item) => (
                                          <span
                                            key={item.id}
                                            className={`inline-flex items-center gap-1.5 px-4 py-2 text-[14px] font-medium tracking-[-0.006em] rounded-full transition-all duration-200 cursor-default ${theme === 'dark'
                                              ? 'bg-white/[0.08] text-gray-200 hover:bg-white/[0.12] active:scale-[0.98]'
                                              : 'bg-black/[0.04] text-gray-800 hover:bg-black/[0.06] active:scale-[0.98]'
                                              }`}
                                          >
                                            {item.emoji && <span className="text-[15px] leading-none">{item.emoji}</span>}
                                            <span>{item.name}</span>
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          }

                          // Fallback to old structure
                          const interestsSource = (isOwnProfile && isAuthenticated && authUser && (authUser as any).interests)
                            ? (authUser as any).interests
                            : user?.interests;

                          if (interestsSource && interestsSource.length > 0) {
                            // Group interests by category
                            const interestsByCategory: Record<string, Array<{ id: string; name: string; emoji?: string; categoryId: string; categoryName: string }>> = {};

                            interestsSource.forEach((interest: any) => {
                              if (typeof interest === 'object' && interest !== null && interest.interest_item) {
                                const itemName = interest.interest_item.name[defaultLanguage] ||
                                  interest.interest_item.name.en ||
                                  Object.values(interest.interest_item.name as any)[0] ||
                                  `Interest ${interest.interest_item.id}`;

                                const categoryId = interest.interest_item.interest_id || interest.interest_item.interest?.id || 'other';
                                const categoryName = interest.interest_item.interest?.name?.[defaultLanguage] ||
                                  interest.interest_item.interest?.name?.en ||
                                  (interest.interest_item.interest?.name ? Object.values(interest.interest_item.interest.name as any)[0] : null) ||
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
                              } else {
                                const interestNameById: Record<number, string> = {
                                  247: '3D printing',
                                  175: 'Acting',
                                  21: 'Action films',
                                  253: 'Adventure',
                                  125: 'Afrobeats',
                                  88: 'Animal lover',
                                  228: 'Badminton',
                                  229: 'Graduate degree or higher',
                                  221: 'Exercising',
                                  136: 'Sci-fi books',
                                  25: 'Sci-fi films',
                                };

                                const categoryId = 'uncategorized';
                                if (!interestsByCategory[categoryId]) {
                                  interestsByCategory[categoryId] = [];
                                }

                                interestsByCategory[categoryId].push({
                                  id: String(interest),
                                  name: typeof interest === 'number' ? (interestNameById[interest] || `Interest #${interest}`) : String(interest),
                                  emoji: undefined,
                                  categoryId,
                                  categoryName: 'Other',
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
                                      className={`rounded-[24px] overflow-hidden border ${theme === 'dark'
                                        ? 'bg-zinc-900/[0.55] border-white/10'
                                        : 'bg-white/[0.62] border-white/80'
                                        }`}
                                    >
                                      <div className={`px-4 py-2.5 border-b ${theme === 'dark' ? 'border-white/[0.06]' : 'border-black/[0.04]'}`}>
                                        <h3 className={`text-[11px] font-bold uppercase tracking-[0.08em] ${theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'}`}>
                                          {categoryName}
                                        </h3>
                                      </div>
                                      <div className="p-3.5 flex flex-wrap gap-2">
                                        {categoryInterests.map((item) => (
                                          <span
                                            key={item.id}
                                            className={`inline-flex items-center gap-1.5 px-4 py-2 text-[14px] font-medium tracking-[-0.006em] rounded-full transition-all duration-200 cursor-default ${theme === 'dark'
                                              ? 'bg-white/[0.08] text-gray-200 hover:bg-white/[0.12] active:scale-[0.98]'
                                              : 'bg-black/[0.04] text-gray-800 hover:bg-black/[0.06] active:scale-[0.98]'
                                              }`}
                                          >
                                            {item.emoji && <span className="text-[15px] leading-none">{item.emoji}</span>}
                                            <span>{item.name}</span>
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          }

                          // No interests
                          return (
                            <div className={`text-center py-16 rounded-[18px] ${theme === 'dark'
                              ? 'border border-white/[0.06]'
                              : 'border border-black/[0.06]'
                              }`}>
                              <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${theme === 'dark' ? 'bg-white/[0.08]' : 'bg-black/[0.04]'}`}>
                                <Heart className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                              </div>
                              <p className={`text-[15px] font-medium ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>{t('profile.no_interests_added')}</p>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Posts / Media Masonry / Likes */}
                  {activeTab !== 'profile' && (
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
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            className="flex items-center justify-center py-20"
                          >
                            <div className="flex flex-col items-center gap-4 max-w-sm mx-auto px-4">
                              <div className={`w-20 h-20 rounded-full flex items-center justify-center ${theme === 'dark'
                                ? 'bg-gray-900/30 border border-gray-900'
                                : 'bg-white border border-gray-200/50'
                                }`}>
                                <ImageIcon className={`w-10 h-10 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
                              </div>
                              <div className="text-center">
                                <h3 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                                  {t('profile.no_media_yet')}
                                </h3>
                                <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                                  {isOwnProfile && t('profile.media_appear_here')}
                                  {!isOwnProfile && `@${user.username} ${t('profile.no_media_from_user')}`}
                                </p>
                              </div>
                            </div>
                          </motion.div>
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
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            className="flex items-center justify-center py-20"
                          >
                            <div className="flex flex-col items-center gap-4 max-w-sm mx-auto px-4">
                              <div className={`w-20 h-20 rounded-full flex items-center justify-center ${theme === 'dark'
                                ? 'bg-gradient-to-br from-gray-900/95 to-gray-900/60 border border-white/[0.06]'
                                : 'bg-gradient-to-br from-gray-50 to-white border border-black/[0.06]'
                                }`}>
                                {activeTab === 'posts' && (
                                  <FileText className={`w-10 h-10 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
                                )}
                                {activeTab === 'replies' && (
                                  <MessageCircle className={`w-10 h-10 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
                                )}
                                {activeTab === 'likes' && (
                                  <Heart className={`w-10 h-10 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
                                )}
                              </div>
                              <div className="text-center">
                                <h3 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                                  {activeTab === 'posts' && t('profile.no_posts_yet')}
                                  {activeTab === 'replies' && t('profile.no_replies_yet')}
                                  {activeTab === 'likes' && t('profile.no_likes_yet')}
                                </h3>
                                <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                                  {activeTab === 'posts' && isOwnProfile && t('profile.share_thoughts')}
                                  {activeTab === 'posts' && !isOwnProfile && `@${user.username} ${t('profile.no_posts_from_user')}`}
                                  {activeTab === 'replies' && isOwnProfile && t('profile.replies_appear_here')}
                                  {activeTab === 'replies' && !isOwnProfile && `@${user.username} ${t('profile.no_replies_from_user')}`}
                                  {activeTab === 'likes' && isOwnProfile && t('profile.likes_appear_here')}
                                  {activeTab === 'likes' && !isOwnProfile && `@${user.username} ${t('profile.no_likes_from_user')}`}
                                </p>
                              </div>
                            </div>
                          </motion.div>
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
