import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Link, MoreHorizontal, Heart, Baby, Cigarette, Wine, Ruler, PawPrint, Church, GraduationCap, Eye, EyeOff, Lock, Palette, Users, Accessibility, Paintbrush, RulerDimensionLine, Vegan, PersonStanding, Sparkles, Drama, Banana, Save, Camera, Image as ImageIcon, ChevronRight, Check, HeartHandshake, AlertTriangle, FileText, MessageCircle, Panda, Ghost, Frown, Rainbow, Transgender, Rabbit, ChevronLeft, ChevronDown, LocateFixed } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import Post from './Post';
import Media from './Media';
import { api } from '../services/api';
import { Actions } from '../services/actions';
import { useTranslation } from 'react-i18next';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { HashtagPlugin } from '@lexical/react/LexicalHashtagPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { HashtagNode } from '@lexical/hashtag';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import ToolbarPlugin from './Lexical/plugins/ToolbarPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { $getRoot, $createParagraphNode, $createTextNode } from 'lexical';
import { ToolbarContext } from '../contexts/ToolbarContext';
import Container from './Container';
import AuthWizard from './AuthWizard';
import { getSafeImageURL } from '../helpers/helpers';
import NewMentionsPlugin from './Lexical/plugins/MentionsPlugin';

// ToolbarPlugin wrapper component
const ToolbarPluginWrapper = ({ setEditorInstance }: { setEditorInstance: (editor: any) => void }) => {
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);
  const [, setIsLinkEditMode] = useState(false);

  // Set editor instance when available
  React.useEffect(() => {
    if (editor && setEditorInstance) {
      setEditorInstance(editor);
    }
  }, [editor, setEditorInstance]);

  return (
    <ToolbarContext>
      <ToolbarPlugin
        editor={editor}
        activeEditor={activeEditor}
        setActiveEditor={setActiveEditor}
        setIsLinkEditMode={setIsLinkEditMode}
      />
    </ToolbarContext>
  );
};

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
}

interface UserEngagements {
  counts?: UserEngagementCounts;
}

interface ProfileUser {
  id: string;
  public_id: number;
  username: string;
  displayname: string;
  email: string;
  date_of_birth: string;
  gender: string;
  sexual_orientation: {
    id: string;
    key: string;
    order: number;
  };
  sex_role: string;
  relationship_status: string;
  user_role: string;
  is_active: boolean;
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
  travel: unknown;
  social: unknown;
  deleted_at: string | null;
  bio?: string;
  location?: UserLocation;
  website?: string;
  profile_image_url?: string;
  cover_image_url?: string;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
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
}

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

export enum PrivacyLevel {
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
  t: (key: string, options?: Record<string, any>) => string;
}

interface LocationPickerProps {
  value?: UserLocation | string | null;
  onChange: (value?: UserLocation | string | null) => void;
  theme: string;
  t: (key: string, options?: Record<string, any>) => string;
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
        className={`rounded-2xl border p-4 ${theme === 'dark' ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
          }`}
      >
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            className={`p-2 rounded-full transition-colors ${canGoPrevMonth
                ? theme === 'dark'
                  ? 'hover:bg-gray-800 text-gray-300'
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
                    ? 'bg-gray-800 text-white hover:bg-gray-700'
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
                    ? 'bg-gray-800 text-white hover:bg-gray-700'
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
                  ? 'hover:bg-gray-800 text-gray-300'
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
                            ? 'text-white hover:bg-gray-800'
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
                          ? 'text-white hover:bg-gray-800'
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

const getLocationDisplay = (location: UserLocation): string => {
  if (!location) {
    return '';
  }

  if (typeof location === 'string') {
    return location;
  }

  if (typeof location === 'object') {
    if (location.display) {
      return location.display;
    }

    const parts = [location.city, location.country].filter(
      (part): part is string => Boolean(part)
    );

    if (parts.length > 0) {
      return parts.join(', ');
    }

    if (location.region) {
      return location.region;
    }

    if (location.country_code) {
      return location.country_code;
    }
  }

  return '';
};

const LocationPicker: React.FC<LocationPickerProps> = ({ value, onChange, theme, t }) => {
  const [status, setStatus] = React.useState<string>('');
  const [isDetecting, setIsDetecting] = React.useState(false);
  const currentDisplay = React.useMemo(() => getLocationDisplay((value ?? null) as UserLocation), [value]);
  const [manualValue, setManualValue] = React.useState(currentDisplay);

  React.useEffect(() => {
    setManualValue(currentDisplay);
  }, [currentDisplay]);

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
        if ('permissions' in navigator && typeof (navigator as any).permissions?.query === 'function') {
          const permissionStatus = await (navigator as any).permissions.query({ name: 'geolocation' });
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
        setStatus(t('location.failed', { defaultValue: 'Unable to detect location. Please enter it manually.' }));
      }
    } finally {
      setIsDetecting(false);
    }
  }, [fetchIpFallback, getPositionWithTimeout, isDetecting, saveLocation, t]);

  const handleManualChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setManualValue(nextValue);

    if (!nextValue.trim()) {
      saveLocation(null);
      setStatus('');
      return;
    }

    saveLocation(nextValue.trim());
    setStatus(t('profile.location_manual_saved', { defaultValue: 'Using manually entered location.' }));
  };

  const handleClear = () => {
    setManualValue('');
    saveLocation(null);
    setStatus('');
  };

  const hintMessage = status || t('profile.location_hint', { defaultValue: 'Grant permission to detect your city or enter it manually.' });

  return (
    <div className={`space-y-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
      <div
        className={`rounded-2xl border p-4 ${theme === 'dark' ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium">
            {currentDisplay || t('profile.location_placeholder', { defaultValue: 'City, Country' })}
          </div>
          {(currentDisplay || manualValue) && (
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
                : 'bg-black text-white hover:bg-gray-900 disabled:hover:bg-black/90'
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

        <div className="mt-4">
          <label className={`block text-xs font-semibold mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            {t('profile.location_manual_entry', { defaultValue: 'Or enter manually' })}
          </label>
          <input
            type="text"
            value={manualValue}
            onChange={handleManualChange}
            placeholder={t('profile.location_placeholder', { defaultValue: 'City, Country' })}
            className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-opacity-100 transition-all ${theme === 'dark'
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-white'
                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-gray-900'
              }`}
          />
        </div>
      </div>
    </div>
  );
};

const ProfileScreen: React.FC<ProfileScreenProps> = ({ inline = false, isEmbed = false, username: propUsername }) => {
  const { username: urlUsername } = useParams<{ username: string }>();
  const username = propUsername || urlUsername;
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user: authUser, isAuthenticated, updateUser } = useAuth();
  const { data: appData, defaultLanguage } = useApp();
  const { t } = useTranslation('common');
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [medias, setMedias] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [mediasLoading, setMediasLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'posts' | 'replies' | 'media' | 'likes'>('profile');
  const [isFollowing, setIsFollowing] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<ProfileUser>>({});
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);
  const [uploadingCoverImage, setUploadingCoverImage] = useState(false);
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(57);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [attributeView, setAttributeView] = useState<'list' | 'detail'>('list');
  const [updatingAttributes, setUpdatingAttributes] = useState<Record<string, boolean>>({});
  const [editTab, setEditTab] = useState<'profile' | 'attributes' | 'interests' | 'fantasies'>('profile');
  const isEditModeRef = useRef(false);

  // Interests state
  const [interestView, setInterestView] = useState<'list' | 'detail'>('list');
  const [selectedInterestCategory, setSelectedInterestCategory] = useState<string | null>(null);
  const [updatingInterests, setUpdatingInterests] = useState(false);

  // Fantasies state
  const [fantasyView, setFantasyView] = useState<'list' | 'detail'>('list');
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
      await api.call(Actions.CMD_USER_UPDATE_PASSWORD, {
        method: "POST",
        body: {
          current_password: current,
          new_password: next,
          new_password_confirmation: confirm,
        },
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

  // Bio editor state
  const [bioEditorInstance, setBioEditorInstance] = useState<any>(null);
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

  // Editor config for bio
  const bioEditorConfig = React.useMemo(() => ({
    namespace: "ProfileBioEditor",
    editable: true,
    nodes: [HashtagNode, HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, AutoLinkNode],
    theme: {
      paragraph: `mb-2 text-base ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`,
      heading: {
        h1: `text-3xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`,
        h2: `text-2xl font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`,
        h3: `text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`,
      },
      list: {
        nested: {
          listitem: `list-none`,
        },
        ol: `list-decimal list-inside mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`,
        ul: `list-disc list-inside mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`,
        listitem: `mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`,
      },
      quote: `border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-2 my-2 italic ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`,
      link: `${theme === 'dark' ? 'text-white underline' : 'text-gray-900 underline'}`,
      text: {
        bold: "font-semibold",
        italic: "italic",
        underline: "underline",
        strikethrough: "line-through",
      },
    },
    onError(error: Error) {
      console.error("Lexical Error:", error);
    },
  }), [theme]);

  // Bio editor onChange handler
  const handleBioChange = (editorState: any) => {
    if (!bioEditorInstance) return;

    editorState.read(() => {
      const htmlString = $generateHtmlFromNodes(bioEditorInstance, null);

      // Update editFormData with HTML content
      setEditFormData({
        ...editFormData,
        bio: htmlString,
      });
    });
  };

  // Initialize bio editor content when user data loads or edit mode opens
  const bioInitializedRef = useRef(false);
  useEffect(() => {
    if (isEditMode && bioEditorInstance && !bioInitializedRef.current) {
      const initialBio = user?.bio || '';
      if (initialBio) {
        try {
          // Try to parse as HTML
          const parser = new DOMParser();
          const doc = parser.parseFromString(initialBio, 'text/html');
          bioEditorInstance.update(() => {
            const root = $getRoot();
            root.clear();
            const nodes = $generateNodesFromDOM(bioEditorInstance, doc);
            root.append(...nodes);
          }, { discrete: true });
        } catch (error) {
          // If parsing fails, treat as plain text
          bioEditorInstance.update(() => {
            const root = $getRoot();
            root.clear();
            const paragraph = $createParagraphNode();
            paragraph.append($createTextNode(initialBio));
            root.append(paragraph);
          }, { discrete: true });
        }
      }
      bioInitializedRef.current = true;
    } else if (!isEditMode) {
      bioInitializedRef.current = false;
    }
  }, [isEditMode, user?.bio, bioEditorInstance]);

  // Check if viewing own profile
  const isOwnProfile = isAuthenticated && authUser && user && (authUser.username === user.username || authUser.id === user.id);

  // Helper functions to get image URLs - prefer authUser if viewing own profile
  const getProfileImageUrl = () => {
    // If viewing own profile and authUser has avatar, use it
    if (isOwnProfile && authUser) {
      return getSafeImageURL((authUser as any).avatar, "icon")
    }
    // Check user state for avatar URL (multiple formats)
    if (user) {

      // Then check avatar.file.url structure from API
      if ((user as any).avatar) {
        return getSafeImageURL((user as any).avatar, "icon")
      }
    }
    return undefined;
  };

  const getCoverImageUrl = () => {
    // If viewing own profile and authUser has cover, use it
    if (isOwnProfile && authUser) {
      return getSafeImageURL((authUser as any).cover, "large");
    } else if (user) {
      if ((user as any).cover) {
        return getSafeImageURL((user as any).cover, "large");
      }
    }

    return undefined;
  };

  // Build fieldOptions from API data
  const fieldOptions: Record<string, Array<{ id: string; name: string; display_order: number }>> = {};

  if (appData?.attributes) {
    appData.attributes.forEach((group) => {
      const sortedAttributes = [...group.attributes].sort((a, b) => a.display_order - b.display_order);
      fieldOptions[group.category] = sortedAttributes.map(attr => ({
        id: attr.id,
        name: attr.name[defaultLanguage] || attr.name.en || Object.values(attr.name)[0] || '',
        display_order: attr.display_order,
      }));
    });
  }

  // Add gender_identities to fieldOptions
  if (appData?.gender_identities) {
    const sortedGenderIdentities = [...appData.gender_identities].sort((a, b) => a.display_order - b.display_order);
    fieldOptions['gender_identity'] = sortedGenderIdentities.map(item => ({
      id: item.id,
      name: item.name?.[defaultLanguage] || item.name?.en || (item.name ? Object.values(item.name)[0] : '') || '',
      display_order: item.display_order,
    }));
  }

  // Add sexual_orientations to fieldOptions
  if (appData?.sexual_orientations) {
    const sortedSexualOrientations = [...appData.sexual_orientations].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    fieldOptions['sexual_orientation'] = sortedSexualOrientations.map(item => ({
      id: item.id,
      name: (item.name?.[defaultLanguage] || item.name?.en || (item.name ? Object.values(item.name)[0] : '') || ''),
      display_order: item.display_order || 0,
    }));
  }

  // Add sexual_roles to fieldOptions
  if (appData?.sexual_roles) {
    const sortedSexualRoles = [...appData.sexual_roles].sort((a, b) => a.display_order - b.display_order);
    fieldOptions['sex_role'] = sortedSexualRoles.map(item => ({
      id: item.id,
      name: item.name?.[defaultLanguage] || item.name?.en || (item.name ? Object.values(item.name)[0] : '') || '',
      display_order: item.display_order,
    }));
  }

  // Build interestOptions from API data
  const interestOptions: Record<string, Array<{ id: string; name: string; emoji?: string; interest_id: string }>> = {};
  const interestCategories: Array<{ id: string; name: string }> = [];

  if (appData?.interests) {
    appData.interests.forEach((interest) => {
      const categoryName = interest.name[defaultLanguage] || interest.name.en || Object.values(interest.name)[0] || '';
      interestCategories.push({
        id: interest.id,
        name: categoryName,
      });

      interestOptions[interest.id] = (interest.items || []).map(item => ({
        id: item.id,
        name: item.name[defaultLanguage] || item.name.en || Object.values(item.name)[0] || '',
        emoji: item.emoji,
        interest_id: item.interest_id,
      }));
    });
  }

  // Get user's selected interests (as array of item IDs)
  // Use authUser if viewing own profile, otherwise use user
  const userSelectedInterestIds = React.useMemo(() => {
    const interestsSource = (isEditMode && isAuthenticated && isOwnProfile && authUser) ? (authUser as any).interests : user?.interests;
    if (!interestsSource) return [];
    // Handle both formats: array of objects (from API) or array of strings/numbers (legacy)
    return interestsSource.map((i: any) => {
      if (typeof i === 'object' && i !== null) {
        // New format: object with interest_item_id or interest_item.id
        return String(i.interest_item_id || i.interest_item?.id || i.id);
      }
      // Legacy format: string or number
      return String(i);
    });
  }, [user?.interests, authUser, isEditMode, isAuthenticated, isOwnProfile]);

  // Get selected interest items grouped by category for display in category list
  // Use authUser if viewing own profile, otherwise use user
  const userSelectedInterestsByCategory = React.useMemo(() => {
    const interestsSource = (isEditMode && isAuthenticated && isOwnProfile && authUser) ? (authUser as any).interests : user?.interests;
    if (!interestsSource || !appData?.interests) return {};
    const grouped: Record<string, Array<{ id: string; name: string; emoji?: string }>> = {};

    interestsSource.forEach((userInterest: any) => {
      if (typeof userInterest === 'object' && userInterest !== null) {
        const interestItem = userInterest.interest_item;
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
              id: interestItem.id || String(userInterest.interest_item_id),
              name: itemName,
              emoji: interestItem.emoji,
            });
          }
        }
      }
    });

    return grouped;
  }, [user?.interests, authUser, isEditMode, isAuthenticated, isOwnProfile, appData?.interests, defaultLanguage]);

  // Build fantasyOptions and fantasyCategories from API data
  const fantasyOptions: Record<string, Array<{ id: string; name: string; description: string }>> = {};
  const fantasyCategories: Array<{ id: string; name: string }> = [];

  // Category name translations
  if (appData?.fantasies) {
    // Group fantasies by slug (category identifier)
    const fantasiesByCategory: Record<string, typeof appData.fantasies> = {};
    appData.fantasies.forEach((fantasy) => {
      const categorySlug = fantasy.slug;
      if (!fantasiesByCategory[categorySlug]) {
        fantasiesByCategory[categorySlug] = [];
      }
      fantasiesByCategory[categorySlug].push(fantasy);
    });

    // Build categories and options
    Object.keys(fantasiesByCategory).forEach((categorySlug) => {
      // Get category name from the first fantasy in this category
      const firstFantasy = fantasiesByCategory[categorySlug][0];
      const categoryName = firstFantasy.category[defaultLanguage] ||
        firstFantasy.category.en ||
        Object.values(firstFantasy.category)[0] ||
        categorySlug;

      fantasyCategories.push({
        id: categorySlug,
        name: categoryName,
      });

      fantasyOptions[categorySlug] = fantasiesByCategory[categorySlug].map((fantasy) => {
        const label = fantasy.label[defaultLanguage] ||
          fantasy.label.en ||
          Object.values(fantasy.label)[0] ||
          `Fantasy ${fantasy.id}`;
        const description = fantasy.description[defaultLanguage] ||
          fantasy.description.en ||
          Object.values(fantasy.description)[0] ||
          '';
        return {
          id: fantasy.id,
          name: label,
          description: description,
        };
      });
    });
  }

  // Get user's selected fantasies (as array of fantasy IDs)
  // Use authUser if viewing own profile in edit mode, otherwise use user
  const userSelectedFantasyIds = React.useMemo(() => {
    const fantasiesSource = (isEditMode && isAuthenticated && isOwnProfile && authUser) ? (authUser as any).fantasies : user?.fantasies;
    if (!fantasiesSource) return [];
    return fantasiesSource.map((f: any) => f.fantasy_id || f.id);
  }, [user?.fantasies, authUser, isEditMode, isAuthenticated, isOwnProfile]);

  // Get selected fantasy items grouped by category for display in category list
  // Use authUser if viewing own profile in edit mode, otherwise use user
  const userSelectedFantasiesByCategory = React.useMemo(() => {
    const fantasiesSource = (isEditMode && isAuthenticated && isOwnProfile && authUser) ? (authUser as any).fantasies : user?.fantasies;
    if (!fantasiesSource || !appData?.fantasies) return {};
    const grouped: Record<string, Array<{ id: string; name: string }>> = {};

    fantasiesSource.forEach((userFantasy: any) => {
      if (typeof userFantasy === 'object' && userFantasy !== null) {
        const fantasyId = userFantasy.fantasy_id || userFantasy.id;
        if (fantasyId) {
          // Find the fantasy in appData to get its category
          const fantasy = appData.fantasies.find(f => f.id === fantasyId);
          if (fantasy) {
            const categorySlug = fantasy.slug;
            if (!grouped[categorySlug]) {
              grouped[categorySlug] = [];
            }
            const fantasyName = fantasy.label[defaultLanguage] ||
              fantasy.label.en ||
              Object.values(fantasy.label)[0] ||
              '';
            grouped[categorySlug].push({
              id: fantasyId,
              name: fantasyName,
            });
          }
        }
      }
    });

    return grouped;
  }, [user?.fantasies, authUser, isEditMode, isAuthenticated, isOwnProfile, appData?.fantasies, defaultLanguage]);

  // Field labels for display
  const fieldLabels: Record<string, string> = {
    hair_color: t('profile.hair_color'),
    eye_color: t('profile.eye_color'),
    skin_color: t('profile.skin_color'),
    body_type: t('profile.body_type'),
    ethnicity: t('profile.ethnicity'),
    zodiac_sign: t('profile.zodiac_sign'),
    circumcision: t('profile.circumcision'),
    physical_disability: t('profile.physical_disability'),
    smoking: t('profile.smoking'),
    drinking: t('profile.drinking'),
    height: t('profile.height'),
    weight: t('profile.weight'),
    religion: t('profile.religion'),
    education: t('profile.education_level'),
    relationship_status: t('profile.relationship_status'),
    pets: t('profile.pets'),
    personality: t('profile.personality'),
    kids_preference: t('profile.kids'),
    dietary: t('profile.dietary'),
    hiv_aids_status: t('profile.hiv_aids_status'),
    bdsm_interest: t('profile.bdsm_interest'),
    bdsm_plays: t('profile.bdsm_plays'),
    bdsm_roles: t('profile.bdsm_roles'),
    gender_identity: t('profile.gender_identity'),
    sexual_orientation: t('profile.sexual_orientation'),
    sex_role: t('profile.sex_role'),
  };

  const USER_ATTRIBUTES = [
    { field: 'gender_identity', label: t('profile.gender_identity'), icon: Transgender },
    { field: 'sexual_orientation', label: t('profile.sexual_orientation'), icon: Rainbow },
    { field: 'sex_role', label: t('profile.sex_role'), icon: Rabbit },
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

    // Check if this is a sexual identity field (gender_identity, sexual_orientation, sex_role)
    const isSexualIdentityField = ['gender_identity', 'sexual_orientation', 'sex_role'].includes(field);

    // Immediately save to backend
    try {
      let response;

      if (isSexualIdentityField) {
        // Use CMD_USER_UPDATE_IDENTIFY for sexual identity fields
        const bodyKey = field === 'gender_identity' ? 'gender_identity_id'
          : field === 'sexual_orientation' ? 'sexual_orientation_id'
            : 'sexual_role_id';

        response = await api.call(Actions.CMD_USER_UPDATE_IDENTIFY, {
          method: "POST",
          body: { [bodyKey]: attributeId },
        });
      } else {
        // Use CMD_USER_UPDATE_ATTRIBUTE for regular attributes
        response = await api.call(Actions.CMD_USER_UPDATE_ATTRIBUTE, {
          method: "POST",
          body: { attribute_id: attributeId },
        });
      }

      // Update auth context - always update if authenticated
      if (isAuthenticated && authUser) {
        // If response contains updated user, use that
        if (response?.user) {
          updateUser(response.user);
          // Also update local user state if viewing own profile
          if (user && (authUser.id === user.id || authUser.username === user.username)) {
            setUser(response.user as unknown as ProfileUser);
          }
        } else {
          // Otherwise, update manually
          if (isSexualIdentityField) {
            // Update sexual identity fields as arrays (matching API structure)
            const attributeData = options.find(opt => opt.id === attributeId);
            if (attributeData) {
              const updatedUserData: any = { ...authUser };

              if (field === 'gender_identity') {
                // Store as array to match API structure
                updatedUserData.gender_identities = [{
                  id: attributeId,
                  name: { [defaultLanguage]: attributeData.name } as Record<string, string>,
                  display_order: attributeData.display_order,
                }];
              } else if (field === 'sexual_orientation') {
                // Store as array to match API structure
                updatedUserData.sexual_orientations = [{
                  id: attributeId,
                  name: { [defaultLanguage]: attributeData.name } as Record<string, string>,
                  display_order: attributeData.display_order,
                }];
              } else if (field === 'sex_role') {
                // Store as object (not array) - use sexual_role to match API
                updatedUserData.sexual_role = {
                  id: attributeId,
                  name: { [defaultLanguage]: attributeData.name } as Record<string, string>,
                  display_order: attributeData.display_order,
                };
                // Also set sexual_role_id for API compatibility
                updatedUserData.sexual_role_id = attributeId;
              }

              updateUser(updatedUserData);
              // Also update local user state if viewing own profile
              if (user && (authUser.id === user.id || authUser.username === user.username)) {
                setUser(updatedUserData as unknown as ProfileUser);
              }
            }
          } else {
            // Update user_attributes for regular attributes
            const existingAttributes = authUser.user_attributes || [];
            const otherAttributes = existingAttributes.filter(ua => ua.category_type !== field);
            const attributeData = options.find(opt => opt.id === attributeId);

            if (attributeData) {
              const newAttribute = {
                id: `temp-${Date.now()}`,
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
              } as any;

              updateUser(updatedUserData);
              // Also update local user state if viewing own profile
              if (user && (authUser.id === user.id || authUser.username === user.username)) {
                setUser(updatedUserData as unknown as ProfileUser);
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

    // Go back to list view
    setAttributeView('list');
    setSelectedField(null);
  };

  const handleFieldClick = (field: string) => {
    // Always allow clicking - even if no options available
    // API might not have options yet, but user should still be able to interact
    setSelectedField(field);
    setAttributeView('detail');
  };

  const handleInterestCategoryClick = (categoryId: string) => {
    setSelectedInterestCategory(categoryId);
    setInterestView('detail');
  };

  const handleInterestItemToggle = async (itemId: string) => {
    const currentSelected = userSelectedInterestIds || [];
    const isSelected = currentSelected.includes(itemId);

    setUpdatingInterests(true);
    setError(null); // Clear previous errors

    // Optimistically update UI
    const newSelected = isSelected
      ? currentSelected.filter((id: string) => id !== itemId)
      : [...currentSelected, itemId];

    // Update local state immediately for better UX
    if (user) {
      // Update interests - maintain object structure if it exists, otherwise create new format
      const currentInterests = user.interests || [];
      let updatedInterests: typeof currentInterests;

      if (isSelected) {
        // Remove interest
        updatedInterests = currentInterests.filter((interest: any) => {
          if (typeof interest === 'object' && interest !== null) {
            return String(interest.interest_item_id || interest.interest_item?.id || interest.id) !== itemId;
          }
          return String(interest) !== itemId;
        });
      } else {
        // Add interest - find the item from appData to create proper structure
        const interestItem = Object.values(interestOptions).flat().find(item => item.id === itemId);
        if (interestItem) {
          // Find the category this item belongs to
          const category = interestCategories.find(cat =>
            interestOptions[cat.id]?.some(item => item.id === itemId)
          );

          if (category) {
            const newInterest = {
              id: `temp-${Date.now()}`,
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
            updatedInterests = [...currentInterests, newInterest as any];
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
      // Update via API using CMD_USER_UPDATE_INTEREST
      const response = await api.call(Actions.CMD_USER_UPDATE_INTEREST, {
        method: "POST",
        body: { interest_id: itemId },
      });

      // Update auth context - use response if available, otherwise use local state
      if (isAuthenticated && authUser) {
        if (response?.user) {
          updateUser(response.user);
          // Update local user state from response
          if (user && (authUser.id === user.id || authUser.username === user.username)) {
            setUser(response.user as unknown as ProfileUser);
          }
        } else if (user && (authUser.id === user.id || authUser.username === user.username)) {
          // Fallback to local state update
          updateUser({
            ...authUser,
            interests: newSelected,
          } as any);
        }
      }
    } catch (err: any) {
      console.error('Error updating interests:', err);

      // Revert optimistic update on error
      if (user) {
        // Revert to previous interests state (before the change)
        // We need to restore the original interests array
        // For now, just refresh from authUser if available
        if (isAuthenticated && authUser && (authUser as any).interests) {
          setUser({
            ...user,
            interests: (authUser as any).interests,
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
                  id: `temp-${Date.now()}`,
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
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update interests';
      setError(errorMessage);
    } finally {
      setUpdatingInterests(false);
    }
  };

  const handleFantasyCategoryClick = (categoryId: string) => {
    setSelectedFantasyCategory(categoryId);
    setFantasyView('detail');
  };

  const handleFantasyItemToggle = async (fantasyId: string) => {
    const currentSelected = userSelectedFantasyIds || [];
    const isSelected = currentSelected.includes(fantasyId);

    setUpdatingFantasies(true);
    setError(null); // Clear previous errors

    // Update local state immediately for better UX
    if (user) {
      const currentFantasies = user.fantasies || [];
      if (isSelected) {
        // Remove fantasy
        setUser({
          ...user,
          fantasies: currentFantasies.filter(f => (f.fantasy_id || f.id) !== fantasyId),
        });
      } else {
        // Add fantasy - create UserFantasy object
        const fantasy = appData?.fantasies?.find(f => f.id === fantasyId);
        if (fantasy) {
          const newFantasy = {
            id: `temp-${Date.now()}`,
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
      // Update via API using CMD_USER_UPDATE_FANTASY
      const response = await api.call(Actions.CMD_USER_UPDATE_FANTASY, {
        method: "POST",
        body: { fantasy_id: fantasyId },
      });

      // Update auth context - use response if available, otherwise use local state
      if (isAuthenticated && authUser) {
        if (response?.user) {
          updateUser(response.user);
          // Update local user state from response
          if (user && (authUser.id === user.id || authUser.username === user.username)) {
            setUser(response.user as unknown as ProfileUser);
          }
        } else if (user && (authUser.id === user.id || authUser.username === user.username)) {
          // Fallback to local state update
          updateUser({
            ...authUser,
            fantasies: user.fantasies,
          } as any);
        }
      }
    } catch (err: any) {
      console.error('Error updating fantasies:', err);

      // Revert optimistic update on error
      if (user) {
        const currentFantasies = user.fantasies || [];
        if (isSelected) {
          // Re-add fantasy if we removed it
          const fantasy = appData?.fantasies?.find(f => f.id === fantasyId);
          if (fantasy) {
            const restoredFantasy = {
              id: `temp-${Date.now()}`,
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
              fantasies: [...currentFantasies, restoredFantasy as any],
            });
          }
        } else {
          // Remove fantasy if we added it
          setUser({
            ...user,
            fantasies: currentFantasies.filter(f => (f.fantasy_id || f.id) !== fantasyId),
          });
        }
      }

      // Set error message - will be displayed in the error section (doesn't cause screen to disappear)
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update fantasies';
      setError(errorMessage);
    } finally {
      setUpdatingFantasies(false);
    }
  };

  // Initialize edit form when edit mode opens (only for non-attribute fields)
  useEffect(() => {
    if (isEditMode) {
      resetPasswordForm();
      // Reset edit tab only when first entering edit mode
      // Use a ref to track if this is the first time entering edit mode
      if (!isEditModeRef.current) {
        setEditTab('profile');
        isEditModeRef.current = true;
      }

      // Reset image previews
      setProfileImagePreview(null);
      setCoverImagePreview(null);
      setProfileImageFile(null);
      setCoverImageFile(null);
      // Reset attribute view
      setAttributeView('list');
      setSelectedField(null);
      // Reset interest view
      setInterestView('list');
      setSelectedInterestCategory(null);
      // Reset fantasy view
      setFantasyView('list');
      setSelectedFantasyCategory(null);

      // Initialize form data if user is available
      if (user) {
        const normalizedDateOfBirth = user.date_of_birth ? user.date_of_birth.split('T')[0] : '';
        setEditFormData({
          username: user.username,
          displayname: user.displayname,
          email: user.email || '',
          bio: user.bio && user.default_language ? user.bio[user.default_language] || '' : '',
          website: user.website || '',
          languages: user.languages || [],
          date_of_birth: normalizedDateOfBirth || undefined,
          privacy_level: user.privacy_level || PrivacyLevel.Public,
          location: user.location || undefined,
        } as any);
        setIsBirthdateSectionOpen(Boolean(normalizedDateOfBirth));
      }
    } else {
      resetPasswordForm();
      // Reset ref when exiting edit mode
      isEditModeRef.current = false;
    }
  }, [isEditMode, resetPasswordForm]); // Only depend on isEditMode, not user

  // Update form data when user changes (but don't reset tab or other states)
  useEffect(() => {
    if (isEditMode && user && isEditModeRef.current) {
      // Only update if we're already in edit mode (ref is true)
      const normalizedDateOfBirth = user.date_of_birth ? user.date_of_birth.split('T')[0] : '';
      setEditFormData({
        username: user.username,
        displayname: user.displayname,
        email: user.email || '',
        bio: user.bio && user.default_language ? user.bio[user.default_language] || '' : '',
        website: user.website || '',
        languages: user.languages || [],
        date_of_birth: normalizedDateOfBirth || undefined,
        privacy_level: user.privacy_level || PrivacyLevel.Public,
        location: user.location || undefined,
      } as any);
      setIsBirthdateSectionOpen(Boolean(normalizedDateOfBirth));
    }
  }, [isEditMode, user?.displayname, user?.bio, user?.website, user?.languages, user?.date_of_birth, user?.privacy_level, user?.username]);

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImageFile(file);
      setUploadingProfileImage(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Immediately upload the image using CMD_USER_UPLOAD_AVATAR
      try {
        const response = await api.call(Actions.CMD_USER_UPLOAD_AVATAR, {
          method: "POST",
          body: { avatar: file },
        });

        // Update local state with new image URL from API response
        if (response?.user?.avatar?.file?.url) {
          const imageUrl = response.user.avatar.file.url;
          setUser({ ...user!, profile_image_url: imageUrl });
          if (isOwnProfile && authUser) {
            updateUser({ profile_image_url: imageUrl });
          }
        }
      } catch (err: any) {
        console.error('Error uploading profile image:', err);
        setError(err.response?.data?.message || 'Failed to upload profile image');
      } finally {
        setUploadingProfileImage(false);
      }
    }
  };

  const handleCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImageFile(file);
      setUploadingCoverImage(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Immediately upload the image using CMD_USER_UPLOAD_COVER
      try {
        const response = await api.call(Actions.CMD_USER_UPLOAD_COVER, {
          method: "POST",
          body: { cover: file },
        });

        // Update local state with new image URL from API response
        if (response?.user?.cover?.file?.url) {
          const imageUrl = response.user.cover.file.url;
          setUser({ ...user!, cover_image_url: imageUrl });
          if (isOwnProfile && authUser) {
            updateUser({ cover_image_url: imageUrl } as any);
          }
        }
      } catch (err: any) {
        console.error('Error uploading cover image:', err);
        setError(err.response?.data?.message || 'Failed to upload cover image');
      } finally {
        setUploadingCoverImage(false);
      }
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    setError(null);
    try {
      // Create FormData if there are images to upload
      const formData = new FormData();

      // Add profile image if selected
      if (profileImageFile) {
        formData.append('profile_image', profileImageFile);
      }

      // Add cover image if selected
      if (coverImageFile) {
        formData.append('cover_image', coverImageFile);
      }

      const payload: Record<string, any> = {};

      // Add other form data
      Object.keys(editFormData).forEach(key => {
        const value = editFormData[key as keyof typeof editFormData];
        if (value !== undefined && value !== null) {
          payload[key] = value;

          if (profileImageFile || coverImageFile) {
            let normalized: string;
            if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
              normalized = JSON.stringify(value);
            } else {
              normalized = String(value);
            }
            formData.append(key, normalized);
          }
        }
      });

      // If there are images, send FormData, otherwise send regular object
      if (profileImageFile || coverImageFile) {
        await api.updateProfile(formData as any);
      } else {
        await api.updateProfile(payload);
      }

      // Update local user state
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
        });
      }

      setIsEditMode(false);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  // Measure header height for sticky tabs
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.offsetHeight;
        setHeaderHeight(height);
      }
    };

    updateHeaderHeight();

    // Update on resize
    window.addEventListener('resize', updateHeaderHeight);
    return () => window.removeEventListener('resize', updateHeaderHeight);
  }, [user, isEditMode]);

  // Fetch user data from API
  useEffect(() => {
    const fetchUserData = async () => {
      console.log('ProfileScreen - fetchUserData called, username:', username);

      if (!username) {
        console.log('ProfileScreen - No username, returning early');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Check if viewing own profile and authUser exists
        const isOwn = isAuthenticated && authUser && (authUser.username === username || authUser.id === username);

        // If viewing own profile, use authUser data immediately for better UX
        if (isOwn && authUser) {
          console.log('ProfileScreen - Using own profile data from authUser');
          const followerCount =
            (authUser as any)?.engagements?.counts?.follower_count ??
            (authUser as any)?.followers_count ??
            0;
          const followingCount =
            (authUser as any)?.engagements?.counts?.following_count ??
            (authUser as any)?.following_count ??
            0;

          setUser({
            ...(authUser as unknown as ProfileUser),
            followers_count: followerCount,
            following_count: followingCount,
          });
          setLoading(false);
          return;
        }

        // Fetch user profile from API using POST with nickname
        console.log('ProfileScreen - Fetching profile for username:', username);
        const requestBody = { nickname: username };
        console.log('ProfileScreen - Request body:', requestBody);

        const response = await api.call(Actions.USER_FETCH_PROFILE, {
          method: "POST",
          body: requestBody,
        });

        console.log('ProfileScreen - API response:', response);

        // Handle different response structures
        let userData = response?.user || response;

        if (!userData) {
          throw new Error('User not found');
        }

        // Normalize avatar and cover URLs from API response structure
        // API returns avatar.file.url and cover.file.url, we need to extract them
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
          profile_image_url: userData.avatar?.file?.url || userData.profile_image_url || undefined,
          cover_image_url: userData.cover?.file?.url || userData.cover_image_url || undefined,
          followers_count: followerCountFromEngagements,
          following_count: followingCountFromEngagements,
        };

        console.log('ProfileScreen - Normalized user data:', normalizedUserData);

        // Set user data
        setUser(normalizedUserData as unknown as ProfileUser);
      } catch (err: any) {
        console.error('Error fetching user:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Failed to load profile';
        setError(errorMessage);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchUserData();
    }
  }, [username, authUser, isAuthenticated]);

  // Fetch posts based on active tab
  useEffect(() => {
    const fetchUserPosts = async () => {
      // Don't fetch if on profile tab
      if (activeTab === 'profile') {
        return;
      }

      try {
        setPostsLoading(true);
        setError(null);

        let response;

        if (activeTab === 'posts') {
          // Fetch user posts
          response = await api.call(Actions.CMD_USER_POSTS, {
            method: "POST",
            body: {
              user_id: user?.public_id,
              limit: 20,
              cursor: ""
            },
          });
        } else if (activeTab === 'replies') {
          // Fetch user replies
          response = await api.call(Actions.CMD_USER_POST_REPLIES, {
            method: "POST",
            body: {
              user_id: user?.public_id,
              limit: 20,
              cursor: ""
            },
          });
        } else if (activeTab === 'likes') {
          // Fetch user liked posts
          response = await api.call(Actions.CMD_USER_POST_LIKES, {
            method: "POST",
            body: {
              user_id: user?.public_id,
              limit: 20,
              cursor: ""
            },
          });
        }

        // Set posts from API response
        if (response && response.posts) {
          setPosts(response.posts);
        } else if (response && Array.isArray(response)) {
          setPosts(response);
        } else {
          setPosts([]);
        }
      } catch (err: any) {
        console.error('Error fetching posts:', err);
        setError(err.response?.data?.message || 'Failed to load posts');
        setPosts([]);
      } finally {
        setPostsLoading(false);
      }
    };

    if (user && username && activeTab !== 'media') {
      fetchUserPosts();
    }
  }, [user?.id, username, activeTab]);

  // Fetch medias when media tab is active
  useEffect(() => {
    const fetchUserMedias = async () => {
      if (activeTab !== 'media') {
        return;
      }

      try {
        setMediasLoading(true);
        setError(null);

        const response = await api.call(Actions.CMD_USER_POST_MEDIA, {
          method: "POST",
          body: {
            user_id: user?.public_id,
            limit: 50,
            cursor: ""
          },
        });

        // Set medias from API response
        let allMedias: any[] = [];

        if (response && response.medias) {
          allMedias = response.medias;
        } else if (response && Array.isArray(response)) {
          allMedias = response;
        } else {
          allMedias = [];
        }

        // Filter only post medias (exclude stories, avatars, covers, etc.)
        const postMedias = allMedias.filter((media: any) => media.role === 'post');

        setMedias(postMedias);
      } catch (err: any) {
        console.error('Error fetching medias:', err);
        setError(err.response?.data?.message || 'Failed to load medias');
        setMedias([]);
      } finally {
        setMediasLoading(false);
      }
    };

    if (user && username) {
      fetchUserMedias();
    }
  }, [user?.id, username, activeTab]);

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleFollowClick = async () => {
    if (!user?.public_id) return;

    try {
      await api.call(Actions.CMD_USER_TOGGLE_FOLLOW, {
        method: 'POST',
        body: {
          followee_id: user.public_id,
        },
      });

      setIsFollowing((prev) => !prev);
      setUser((prevUser) => {
        if (!prevUser) return prevUser;

        const currentFollowers =
          prevUser.followers_count ??
          prevUser.engagements?.counts?.follower_count ??
          0;
        const delta = isFollowing ? -1 : 1;
        const nextFollowers = Math.max(0, currentFollowers + delta);

        const updatedEngagements: UserEngagements = {
          counts: {
            follower_count: nextFollowers,
            following_count:
              prevUser.engagements?.counts?.following_count ??
              prevUser.following_count,
          },
        };

        return {
          ...prevUser,
          followers_count: nextFollowers,
          engagements: updatedEngagements,
        };
      });
    } catch (error) {
      console.error('Error toggling follow:', error);
      // Optionally show error message to user
    }
  };

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = defaultLanguage === 'tr' ? 'tr-TR' : 'en-US';
    return `${t('profile.joined')} ${date.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}`;
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center gap-4"
        >
          <div className={`w-16 h-16 border-4 ${theme === 'dark' ? 'border-gray-800 border-t-white' : 'border-gray-200 border-t-black'} rounded-full animate-spin`} />
          <p className={`text-base font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {t('profile.loading_profile')}
          </p>
        </motion.div>
      </div>
    );
  }

  // If trying to view own profile without login, show auth wizard
  if ((!username || username === 'profile') && !isAuthenticated) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[60vh] px-4">
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
      </Container>
    );
  }

  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
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

  const followersLabel = t('profile.followers', { defaultValue: 'Followers' });
  const followingLabel = t('profile.following', { defaultValue: 'Following' });
  const activePrivacyLevel =
    (editFormData.privacy_level as PrivacyLevel | undefined) ??
    (user?.privacy_level as PrivacyLevel | undefined) ??
    PrivacyLevel.Public;

  const handleEngagementNavigate = (type: 'followers' | 'followings') => {
    if (!user) {
      return;
    }

    navigate(`/${user.username}/${type}`, {
      state: {
        profileSummary: {
          id: user.id,
          public_id: user.public_id,
          username: user.username,
          displayname: user.displayname,
          avatar: (user as any)?.avatar ?? null,
        },
      },
    });
  };

  const content = (
    <>
      {/* Header */}
      {!inline && (
        <div ref={headerRef} className={`sticky top-0 z-30 ${theme === 'dark' ? 'bg-black' : 'bg-white'} border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-100'}`}>
          <div className="flex items-center px-4 py-3">
            {isEditMode ? (
              <>
                <button
                  onClick={() => setIsEditMode(false)}
                  className={`p-2 rounded-full transition-all duration-200 mr-3 ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                    }`}
                >
                  <ArrowLeft className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
                </button>
                <div className="flex-1">
                  <h1 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {t('profile.edit_profile')}
                  </h1>
                </div>
                <div className="w-12"></div>
              </>
            ) : (
              <>
                <button
                  onClick={handleBackClick}
                  className={`p-2 rounded-full transition-all duration-200 mr-3 ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                    }`}
                >
                  <ArrowLeft className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
                </button>
                <div className="flex-1">
                  <h1 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {user.displayname}
                  </h1>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {user.posts_count} {t('profile.posts')}
                  </p>
                </div>
                <button className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                  }`}>
                  <MoreHorizontal className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="max-w-[1380px] mx-auto">
        {isEditMode ? (
          // Edit Profile View
          <main className={`flex-1 w-full min-w-0 ${theme === 'dark' ? 'border-x border-black' : 'border-x border-gray-100'}`}>
            <div className={`min-h-screen ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
              <div className={`max-w-4xl mx-auto border-x ${theme === 'dark' ? 'border-black' : 'border-gray-100'}`}>
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
                      <div className={`w-full h-48 rounded-xl overflow-hidden ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
                        {(coverImagePreview || getCoverImageUrl()) ? (
                          <img
                            src={coverImagePreview || getCoverImageUrl() || ''}
                            alt="Cover"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className={`w-12 h-12 ${theme === 'dark' ? 'text-gray-700' : 'text-gray-400'}`} />
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
                            ? 'bg-black/50 hover:bg-black/70 text-white'
                            : 'bg-white/90 hover:bg-white text-gray-900'
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
                        <div className={`w-32 h-32 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
                          {(profileImagePreview || getProfileImageUrl()) ? (
                            <img
                              src={profileImagePreview || getProfileImageUrl() || ''}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className={`w-8 h-8 ${theme === 'dark' ? 'text-gray-700' : 'text-gray-400'}`} />
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
                              ? 'bg-black text-white border-gray-700 hover:bg-gray-800'
                              : 'bg-white text-gray-900 border-gray-200 hover:bg-gray-100'
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
                  <div className={`sticky z-20 border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'} backdrop-blur-sm ${theme === 'dark' ? 'bg-black/95' : 'bg-white/95'}`} style={{ top: inline || isEmbed ? '0' : `${headerHeight}px` }}>
                    <div className="flex px-4 sm:px-6 relative">
                      {[
                        { id: 'profile', label: t('profile.profile_info') || 'Profile Info' },
                        { id: 'attributes', label: t('profile.attributes') },
                        { id: 'interests', label: t('profile.interests') },
                        { id: 'fantasies', label: t('profile.fantasies') },
                      ].map((tab) => (
                        <motion.button
                          key={tab.id}
                          onClick={() => setEditTab(tab.id as any)}
                          className={`flex-1 py-3 font-semibold text-sm relative transition-colors ${editTab === tab.id
                            ? theme === 'dark' ? 'text-white' : 'text-black'
                            : theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                            }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <span className="relative z-10">{tab.label}</span>
                          {editTab === tab.id && (
                            <motion.div
                              className={`absolute bottom-0 left-0 right-0 h-1 rounded-t-full ${theme === 'dark' ? 'bg-white' : 'bg-black'}`}
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
                  <div className="relative min-h-[400px] px-4 sm:px-6 w-full">
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
                                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-white'
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
                                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-white'
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
                                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-white'
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
                            <div className={`w-full px-2 rounded-xl border-2 focus-within:border-opacity-100 transition-all ${theme === 'dark'
                              ? 'bg-gray-800 border-gray-700 focus-within:border-white'
                              : 'bg-gray-50 border-gray-200 focus-within:border-gray-900'
                              }`}>
                              <LexicalComposer initialConfig={bioEditorConfig}>
                                <div className="relative">
                                  <HashtagPlugin />
                                  <ListPlugin />
                                  <LinkPlugin />
                                  <NewMentionsPlugin />

                                  <div className="-mx-2 mt-1">
                                    <ToolbarPluginWrapper setEditorInstance={setBioEditorInstance} />
                                  </div>

                                  <RichTextPlugin
                                    contentEditable={
                                      <ContentEditable
                                        className="editor-input lexical-editor px-4 py-3"
                                        style={{
                                          minHeight: '120px',
                                          maxHeight: '100%',
                                          wordWrap: 'break-word',
                                          overflowWrap: 'break-word'
                                        }}
                                      />
                                    }
                                    placeholder={
                                      <div className="absolute top-[60px] left-[14px] text-sm pointer-events-none">
                                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                                          {t('profile.bio_placeholder')}
                                        </span>
                                      </div>
                                    }
                                    ErrorBoundary={LexicalErrorBoundary}
                                  />
                                  <OnChangePlugin onChange={handleBioChange} />
                                  <AutoFocusPlugin />
                                  <HistoryPlugin />
                                </div>
                              </LexicalComposer>
                            </div>
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
                                ? 'bg-gray-900/60 border-gray-800'
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
                                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-white'
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
                                          : 'bg-black text-white border-black shadow-lg shadow-black/10'
                                        : theme === 'dark'
                                          ? 'bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800'
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
                                  ? 'bg-gray-900/60 border-gray-800'
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
                                                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-white'
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
                                                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-white'
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
                                                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-white'
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
                                                : 'bg-black text-white hover:bg-gray-900'
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
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-6 w-full"
                        >
                          {/* Attributes List - iOS tableView style */}
                          <div className="relative">
                            {/* List View */}
                            <motion.div
                              animate={{
                                x: attributeView === 'list' ? 0 : '-100%',
                                opacity: attributeView === 'list' ? 1 : 0
                              }}
                              transition={{
                                type: 'spring',
                                damping: 35,
                                stiffness: 400,
                                mass: 0.8
                              }}
                              className={`relative ${theme === 'dark' ? 'bg-transparent' : 'bg-transparent'}`}
                              style={{
                                pointerEvents: attributeView === 'list' ? 'auto' : 'none',
                                willChange: 'transform, opacity'
                              }}
                            >
                              {/* List Header */}
                              <div className={`px-4 py-4 flex items-center ${theme === 'dark' ? 'bg-transparent' : 'bg-transparent'}`}>
                                <h3 className={`text-base font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                  {t('profile.attributes')}
                                </h3>
                              </div>

                              {/* List Content */}
                              <div className={`rounded-xl overflow-hidden ${theme === 'dark' ? 'bg-gray-900/50' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
                                {USER_ATTRIBUTES.map((item, index) => {
                                  const isLast = index === USER_ATTRIBUTES.length - 1;
                                  const isLoading = updatingAttributes[item.field] || false;
                                  const options = fieldOptions[item.field] || [];

                                  // Get current value
                                  const userToCheck = isEditMode && isAuthenticated ? authUser : user;
                                  let currentAttributeId = '';
                                  let selectedOption = null;
                                  let hasValue = false;
                                  let displayValue = t('profile.select_option');

                                  // Check if this is a sexual identity field
                                  if (item.field === 'gender_identity') {
                                    // Check both structures: direct array or nested in sexual_identities
                                    const genderIdentities = (userToCheck as any)?.gender_identities || (userToCheck as any)?.sexual_identities?.gender_identities;
                                    const genderIdentity = genderIdentities?.[0] || (userToCheck as any)?.gender_identity;
                                    if (genderIdentity?.id) {
                                      currentAttributeId = genderIdentity.id;
                                      selectedOption = options.find((opt: any) => opt.id === currentAttributeId);
                                      if (selectedOption) {
                                        displayValue = selectedOption.name;
                                        hasValue = true;
                                      } else if (genderIdentity.name) {
                                        displayValue = genderIdentity.name[defaultLanguage] || genderIdentity.name.en || Object.values(genderIdentity.name)[0] || t('profile.select_option');
                                        hasValue = !!displayValue && displayValue !== t('profile.select_option');
                                      }
                                    }
                                  } else if (item.field === 'sexual_orientation') {
                                    // Check both structures: direct array or nested in sexual_identities
                                    const sexualOrientations = (userToCheck as any)?.sexual_orientations || (userToCheck as any)?.sexual_identities?.sexual_orientations;
                                    const sexualOrientation = sexualOrientations?.[0] || (userToCheck as any)?.sexual_orientation;
                                    if (sexualOrientation?.id) {
                                      currentAttributeId = sexualOrientation.id;
                                      selectedOption = options.find((opt: any) => opt.id === currentAttributeId);
                                      if (selectedOption) {
                                        displayValue = selectedOption.name;
                                        hasValue = true;
                                      } else if (sexualOrientation.name) {
                                        displayValue = sexualOrientation.name[defaultLanguage] || sexualOrientation.name.en || Object.values(sexualOrientation.name)[0] || t('profile.select_option');
                                        hasValue = !!displayValue && displayValue !== t('profile.select_option');
                                      }
                                    }
                                  } else if (item.field === 'sex_role') {
                                    // Check multiple structures: sexual_role, sex_role, or nested in sexual_identities
                                    const sexRole = (userToCheck as any)?.sexual_role || (userToCheck as any)?.sex_role || (userToCheck as any)?.sexual_identities?.sex_role;
                                    if (sexRole?.id) {
                                      currentAttributeId = sexRole.id;
                                      selectedOption = options.find((opt: any) => opt.id === currentAttributeId);
                                      if (selectedOption) {
                                        displayValue = selectedOption.name;
                                        hasValue = true;
                                      } else if (sexRole.name) {
                                        displayValue = sexRole.name[defaultLanguage] || sexRole.name.en || Object.values(sexRole.name)[0] || t('profile.select_option');
                                        hasValue = !!displayValue && displayValue !== t('profile.select_option');
                                      }
                                    }
                                  } else {
                                    // Regular attribute from user_attributes
                                    const currentUserAttribute = userToCheck?.user_attributes?.find(
                                      (ua: any) => ua.category_type === item.field
                                    );

                                    currentAttributeId = currentUserAttribute?.attribute_id || '';
                                    selectedOption = currentAttributeId
                                      ? options.find((opt: any) => opt.id === currentAttributeId)
                                      : null;

                                    // If option found, use its name, otherwise try to use attribute.name from user_attributes
                                    hasValue = !!(selectedOption || (currentUserAttribute?.attribute?.name));
                                    displayValue = selectedOption
                                      ? selectedOption.name
                                      : currentUserAttribute?.attribute?.name
                                        ? (currentUserAttribute.attribute.name[defaultLanguage] || currentUserAttribute.attribute.name.en || Object.values(currentUserAttribute.attribute.name)[0] || t('profile.select_option'))
                                        : t('profile.select_option');
                                  }

                                  return (
                                    <button
                                      key={item.field}
                                      type="button"
                                      onClick={() => handleFieldClick(item.field)}
                                      disabled={isLoading}
                                      className={`w-full px-4 py-4 flex items-center justify-between transition-colors ${isLoading ? 'opacity-50 cursor-default' : ''} ${!isLast ? `border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-100'}` : ''} ${theme === 'dark'
                                        ? 'text-white hover:bg-gray-800/50 active:bg-gray-800'
                                        : 'text-gray-900 hover:bg-gray-50 active:bg-gray-100'
                                        }`}
                                    >
                                      <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <item.icon className={`w-7 h-7 flex-shrink-0 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                                        <span className="font-medium text-base flex-1 text-left">{item.label}</span>
                                      </div>
                                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                                        {!hasValue && (
                                          <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-500'}`} />
                                        )}
                                        <span className={`text-sm ${hasValue
                                          ? (theme === 'dark' ? 'text-gray-300' : 'text-gray-700')
                                          : (theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600')
                                          } truncate max-w-[120px]`}>
                                          {displayValue}
                                        </span>
                                        {isLoading ? (
                                          <div className={`w-4 h-4 border-2 ${theme === 'dark' ? 'border-gray-500 border-t-gray-300' : 'border-gray-400 border-t-gray-600'} rounded-full animate-spin flex-shrink-0`} />
                                        ) : (
                                          <ChevronRight className={`w-5 h-5 flex-shrink-0 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
                                        )}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </motion.div>

                            {/* Detail View */}
                            <motion.div
                              animate={{
                                x: attributeView === 'detail' ? 0 : '100%',
                                opacity: attributeView === 'detail' ? 1 : 0
                              }}
                              transition={{
                                type: 'spring',
                                damping: 35,
                                stiffness: 400,
                                mass: 0.8
                              }}
                              className={`absolute inset-0 ${theme === 'dark' ? 'bg-transparent' : 'bg-transparent'} z-10`}
                              style={{
                                pointerEvents: attributeView === 'detail' ? 'auto' : 'none',
                                willChange: 'transform, opacity'
                              }}
                            >
                              {/* Detail Header */}
                              <div className={`px-4 py-4 flex items-center ${theme === 'dark' ? 'bg-transparent' : 'bg-transparent'}`}>
                                <button
                                  onClick={() => {
                                    setAttributeView('list');
                                    setSelectedField(null);
                                  }}
                                  className={`p-2 rounded-full transition-colors ${theme === 'dark'
                                    ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-300'
                                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                  <ArrowLeft className="w-5 h-5" />
                                </button>
                                <h2 className={`text-lg font-bold flex-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                  {selectedField ? (fieldLabels[selectedField] || selectedField) : ''}
                                </h2>
                              </div>

                              {/* Options List */}
                              <div className={`rounded-xl overflow-hidden ${theme === 'dark' ? 'bg-gray-900/50' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
                                {selectedField && fieldOptions[selectedField] && fieldOptions[selectedField].length > 0 ? (
                                  fieldOptions[selectedField].map((option, index) => {
                                    // Get current value
                                    const userToCheck = isEditMode && isAuthenticated ? authUser : user;
                                    let currentAttributeId = '';
                                    let isSelected = false;

                                    // Check if this is a sexual identity field
                                    if (selectedField === 'gender_identity') {
                                      const genderIdentities = (userToCheck as any)?.gender_identities || (userToCheck as any)?.sexual_identities?.gender_identities;
                                      const genderIdentity = genderIdentities?.[0] || (userToCheck as any)?.gender_identity;
                                      currentAttributeId = genderIdentity?.id || '';
                                      isSelected = currentAttributeId === option.id;
                                    } else if (selectedField === 'sexual_orientation') {
                                      const sexualOrientations = (userToCheck as any)?.sexual_orientations || (userToCheck as any)?.sexual_identities?.sexual_orientations;
                                      const sexualOrientation = sexualOrientations?.[0] || (userToCheck as any)?.sexual_orientation;
                                      currentAttributeId = sexualOrientation?.id || '';
                                      isSelected = currentAttributeId === option.id;
                                    } else if (selectedField === 'sex_role') {
                                      const sexRole = (userToCheck as any)?.sexual_role || (userToCheck as any)?.sex_role || (userToCheck as any)?.sexual_identities?.sex_role;
                                      currentAttributeId = sexRole?.id || '';
                                      isSelected = currentAttributeId === option.id;
                                    } else {
                                      // Regular attribute from user_attributes
                                      const currentUserAttribute = userToCheck?.user_attributes?.find(
                                        (ua: any) => ua.category_type === selectedField
                                      );
                                      currentAttributeId = currentUserAttribute?.attribute_id || '';
                                      isSelected = currentAttributeId === option.id;
                                    }

                                    const isLast = index === fieldOptions[selectedField].length - 1;
                                    return (
                                      <button
                                        key={option.id}
                                        onClick={() => handleFieldOptionSelect(selectedField, option.id)}
                                        className={`w-full px-4 py-4 text-left flex items-center justify-between transition-colors ${!isLast ? `border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-100'}` : ''} ${isSelected
                                          ? theme === 'dark'
                                            ? 'bg-gray-800/50 text-white'
                                            : 'bg-gray-50 text-gray-900'
                                          : theme === 'dark'
                                            ? 'border-gray-800 text-gray-300 hover:bg-gray-800/30 active:bg-gray-800'
                                            : 'border-gray-100 text-gray-900 hover:bg-gray-50 active:bg-gray-100'
                                          }`}
                                      >
                                        <span className="text-base font-medium">{option.name}</span>
                                        {isSelected && (
                                          <Check className={`w-5 h-5 flex-shrink-0 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
                                        )}
                                      </button>
                                    );
                                  })
                                ) : (
                                  <div className={`px-4 py-8 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                    <p className="text-sm">{t('profile.no_options_available') || 'No options available for this attribute'}</p>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          </div>
                        </motion.div>
                      )}
                      {editTab === 'interests' && (
                        <motion.div
                          key="interests"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-6 w-full"
                        >
                          {/* Interests List - iOS tableView style */}
                          <div className="relative">
                            {/* List View */}
                            <motion.div
                              animate={{
                                x: interestView === 'list' ? 0 : '-100%',
                                opacity: interestView === 'list' ? 1 : 0
                              }}
                              transition={{
                                type: 'spring',
                                damping: 35,
                                stiffness: 400,
                                mass: 0.8
                              }}
                              className={`relative ${theme === 'dark' ? 'bg-transparent' : 'bg-transparent'}`}
                              style={{
                                pointerEvents: interestView === 'list' ? 'auto' : 'none',
                                willChange: 'transform, opacity'
                              }}
                            >
                              {/* List Header */}
                              <div className={`px-4 py-4 flex items-center ${theme === 'dark' ? 'bg-transparent' : 'bg-transparent'}`}>
                                <h3 className={`text-base font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                  {t('profile.interests')}
                                </h3>
                              </div>

                              {/* List Content */}
                              <div className={`rounded-xl overflow-hidden ${theme === 'dark' ? 'bg-gray-900/50' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
                                {interestCategories.map((category, index) => {
                                  const isLast = index === interestCategories.length - 1;
                                  const categoryItems = interestOptions[category.id] || [];
                                  const selectedCount = categoryItems.filter(item => userSelectedInterestIds.includes(item.id)).length;
                                  const hasSelections = selectedCount > 0;
                                  const selectedItems = userSelectedInterestsByCategory[category.id] || [];

                                  return (
                                    <button
                                      key={category.id}
                                      type="button"
                                      onClick={() => handleInterestCategoryClick(category.id)}
                                      disabled={updatingInterests}
                                      className={`w-full px-4 py-4 flex items-center justify-between transition-colors ${updatingInterests ? 'opacity-50 cursor-default' : ''} ${!isLast ? `border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-100'}` : ''} ${theme === 'dark'
                                        ? 'text-white hover:bg-gray-800/50 active:bg-gray-800'
                                        : 'text-gray-900 hover:bg-gray-50 active:bg-gray-100'
                                        }`}
                                    >
                                      <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <span className="font-medium text-base flex-1 text-left">{category.name}</span>
                                        {selectedItems.length > 0 && (
                                          <div className="flex items-center gap-1.5 flex-wrap flex-shrink-0 ml-2">
                                            {selectedItems.slice(0, 3).map((item) => (
                                              <span
                                                key={item.id}
                                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${theme === 'dark'
                                                  ? 'bg-gray-800 text-gray-200 border border-gray-700'
                                                  : 'bg-gray-100 text-gray-700 border border-gray-200'
                                                  }`}
                                              >
                                                {item.emoji && <span>{item.emoji}</span>}
                                                <span className="truncate max-w-[60px]">{item.name}</span>
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
                                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                                        {hasSelections && selectedItems.length === 0 && (
                                          <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {selectedCount}
                                          </span>
                                        )}
                                        <ChevronRight className={`w-5 h-5 flex-shrink-0 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </motion.div>

                            {/* Detail View */}
                            <motion.div
                              animate={{
                                x: interestView === 'detail' ? 0 : '100%',
                                opacity: interestView === 'detail' ? 1 : 0
                              }}
                              transition={{
                                type: 'spring',
                                damping: 35,
                                stiffness: 400,
                                mass: 0.8
                              }}
                              className={`absolute inset-0 ${theme === 'dark' ? 'bg-transparent' : 'bg-transparent'} z-10`}
                              style={{
                                pointerEvents: interestView === 'detail' ? 'auto' : 'none',
                                willChange: 'transform, opacity'
                              }}
                            >
                              {/* Detail Header */}
                              <div className={`sticky top-0 z-10 px-4 py-4 flex items-center ${theme === 'dark' ? 'bg-black/95 backdrop-blur-sm' : 'bg-white/95 backdrop-blur-sm'}`}>
                                <button
                                  onClick={() => {
                                    setInterestView('list');
                                    setSelectedInterestCategory(null);
                                  }}
                                  className={`p-2 rounded-full transition-colors ${theme === 'dark'
                                    ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-300'
                                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                  <ArrowLeft className="w-5 h-5" />
                                </button>
                                <h2 className={`text-lg font-bold flex-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                  {selectedInterestCategory ? (interestCategories.find(c => c.id === selectedInterestCategory)?.name || '') : ''}
                                </h2>
                              </div>

                              {/* Options List */}
                              <div className={`rounded-xl overflow-hidden ${theme === 'dark' ? 'bg-gray-900/50' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
                                {selectedInterestCategory && interestOptions[selectedInterestCategory] && interestOptions[selectedInterestCategory].length > 0 ? (
                                  interestOptions[selectedInterestCategory].map((item, index) => {
                                    const isSelected = userSelectedInterestIds.includes(item.id);
                                    const isLast = index === interestOptions[selectedInterestCategory].length - 1;
                                    return (
                                      <button
                                        key={item.id}
                                        onClick={() => handleInterestItemToggle(item.id)}
                                        disabled={updatingInterests}
                                        className={`w-full px-4 py-4 text-left flex items-center justify-between transition-colors ${!isLast ? `border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-100'}` : ''} ${isSelected
                                          ? theme === 'dark'
                                            ? 'bg-gray-800/50 text-white'
                                            : 'bg-gray-50 text-gray-900'
                                          : theme === 'dark'
                                            ? 'border-gray-800 text-gray-300 hover:bg-gray-800/30 active:bg-gray-800'
                                            : 'border-gray-100 text-gray-900 hover:bg-gray-50 active:bg-gray-100'
                                          } ${updatingInterests ? 'opacity-50 cursor-wait' : ''}`}
                                      >
                                        <div className="flex items-center gap-3 flex-1">
                                          {item.emoji && (
                                            <span className="text-lg">{item.emoji}</span>
                                          )}
                                          <span className="text-base font-medium">{item.name}</span>
                                        </div>
                                        {isSelected && (
                                          <Check className={`w-5 h-5 flex-shrink-0 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
                                        )}
                                      </button>
                                    );
                                  })
                                ) : (
                                  <div className={`px-4 py-8 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                    <p className="text-sm">{t('profile.no_options_available') || 'No options available for this category'}</p>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          </div>
                        </motion.div>
                      )}
                      {editTab === 'fantasies' && (
                        <motion.div
                          key="fantasies"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-6 w-full"
                        >
                          {/* Fantasies List - iOS tableView style */}
                          <div className="relative">
                            {/* List View */}
                            <motion.div
                              animate={{
                                x: fantasyView === 'list' ? 0 : '-100%',
                                opacity: fantasyView === 'list' ? 1 : 0
                              }}
                              transition={{
                                type: 'spring',
                                damping: 35,
                                stiffness: 400,
                                mass: 0.8
                              }}
                              className={`relative ${theme === 'dark' ? 'bg-transparent' : 'bg-transparent'}`}
                              style={{
                                pointerEvents: fantasyView === 'list' ? 'auto' : 'none',
                                willChange: 'transform, opacity'
                              }}
                            >
                              {/* List Header */}
                              <div className={`px-4 py-4 flex items-center ${theme === 'dark' ? 'bg-transparent' : 'bg-transparent'}`}>
                                <h3 className={`text-base font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                  {t('profile.fantasies')}
                                </h3>
                              </div>

                              {/* List Content */}
                              <div className={`rounded-xl overflow-hidden ${theme === 'dark' ? 'bg-gray-900/50' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
                                {fantasyCategories.map((category, index) => {
                                  const isLast = index === fantasyCategories.length - 1;
                                  const categoryItems = fantasyOptions[category.id] || [];
                                  const selectedCount = categoryItems.filter(item => userSelectedFantasyIds.includes(item.id)).length;
                                  const hasSelections = selectedCount > 0;
                                  const selectedItems = userSelectedFantasiesByCategory[category.id] || [];

                                  return (
                                    <button
                                      key={category.id}
                                      type="button"
                                      onClick={() => handleFantasyCategoryClick(category.id)}
                                      disabled={updatingFantasies}
                                      className={`w-full px-4 py-4 flex items-center justify-between transition-colors ${updatingFantasies ? 'opacity-50 cursor-default' : ''} ${!isLast ? `border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-100'}` : ''} ${theme === 'dark'
                                        ? 'text-white hover:bg-gray-800/50 active:bg-gray-800'
                                        : 'text-gray-900 hover:bg-gray-50 active:bg-gray-100'
                                        }`}
                                    >
                                      <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <span className="font-medium text-base flex-1 text-left">{category.name}</span>
                                        {selectedItems.length > 0 && (
                                          <div className="flex items-center gap-1.5 flex-wrap flex-shrink-0 ml-2">
                                            {selectedItems.slice(0, 3).map((item) => (
                                              <span
                                                key={item.id}
                                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${theme === 'dark'
                                                  ? 'bg-gray-800 text-gray-200 border border-gray-700'
                                                  : 'bg-gray-100 text-gray-700 border border-gray-200'
                                                  }`}
                                              >
                                                <span className="truncate max-w-[80px]">{item.name}</span>
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
                                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                                        {hasSelections && selectedItems.length === 0 && (
                                          <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {selectedCount}
                                          </span>
                                        )}
                                        <ChevronRight className={`w-5 h-5 flex-shrink-0 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </motion.div>

                            {/* Detail View */}
                            <motion.div
                              animate={{
                                x: fantasyView === 'detail' ? 0 : '100%',
                                opacity: fantasyView === 'detail' ? 1 : 0
                              }}
                              transition={{
                                type: 'spring',
                                damping: 35,
                                stiffness: 400,
                                mass: 0.8
                              }}
                              className={`absolute inset-0 ${theme === 'dark' ? 'bg-transparent' : 'bg-transparent'} z-10`}
                              style={{
                                pointerEvents: fantasyView === 'detail' ? 'auto' : 'none',
                                willChange: 'transform, opacity'
                              }}
                            >
                              {/* Detail Header */}
                              <div className={`sticky top-0 z-10 px-4 py-4 flex items-center ${theme === 'dark' ? 'bg-black/95 backdrop-blur-sm' : 'bg-white/95 backdrop-blur-sm'}`}>
                                <button
                                  onClick={() => {
                                    setFantasyView('list');
                                    setSelectedFantasyCategory(null);
                                  }}
                                  className={`p-2 rounded-full transition-colors ${theme === 'dark'
                                    ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-300'
                                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                  <ArrowLeft className="w-5 h-5" />
                                </button>
                                <h2 className={`text-lg font-bold flex-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                  {selectedFantasyCategory ? (fantasyCategories.find(c => c.id === selectedFantasyCategory)?.name || '') : ''}
                                </h2>
                              </div>

                              {/* Options List */}
                              <div className={`rounded-xl overflow-hidden ${theme === 'dark' ? 'bg-gray-900/50' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
                                {selectedFantasyCategory && fantasyOptions[selectedFantasyCategory] && fantasyOptions[selectedFantasyCategory].length > 0 ? (
                                  fantasyOptions[selectedFantasyCategory].map((item, index) => {
                                    const isSelected = userSelectedFantasyIds.includes(item.id);
                                    const isLast = index === fantasyOptions[selectedFantasyCategory].length - 1;
                                    return (
                                      <button
                                        key={item.id}
                                        onClick={() => handleFantasyItemToggle(item.id)}
                                        disabled={updatingFantasies}
                                        className={`w-full px-4 py-4 text-left flex items-center justify-between transition-colors ${!isLast ? `border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-100'}` : ''} ${isSelected
                                          ? theme === 'dark'
                                            ? 'bg-gray-800/50 text-white'
                                            : 'bg-gray-50 text-gray-900'
                                          : theme === 'dark'
                                            ? 'border-gray-800 text-gray-300 hover:bg-gray-800/30 active:bg-gray-800'
                                            : 'border-gray-100 text-gray-900 hover:bg-gray-50 active:bg-gray-100'
                                          } ${updatingFantasies ? 'opacity-50 cursor-wait' : ''}`}
                                      >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                          <div className="flex-1 min-w-0">
                                            <div className="text-base font-medium mb-1">{item.name}</div>
                                            {item.description && (
                                              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {item.description}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                        {isSelected && (
                                          <Check className={`w-5 h-5 flex-shrink-0 ml-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
                                        )}
                                      </button>
                                    );
                                  })
                                ) : (
                                  <div className={`px-4 py-8 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                    <p className="text-sm">{t('profile.no_options_available') || 'No options available for this category'}</p>
                                  </div>
                                )}
                              </div>
                            </motion.div>
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

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-6 pb-8 px-4 sm:px-6 border-t border-gray-200 dark:border-gray-800">
                    <button
                      onClick={() => setIsEditMode(false)}
                      className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${theme === 'dark'
                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      {t('profile.cancel')}
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${isSaving
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : theme === 'dark'
                          ? 'bg-white text-black hover:bg-gray-200'
                          : 'bg-black text-white hover:bg-gray-900'
                        }`}
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          <span>{t('profile.saving')}</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>{t('profile.save')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              </div>
            </div>
          </main>
        ) : (
          // Profile View
          <main className={`flex-1 w-full min-w-0 ${theme === 'dark' ? 'border-x border-black' : 'border-x border-gray-100'}`}>

            {/* Cover Photo */}
            <div className={`h-48  relative ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
              {getCoverImageUrl() ? (
                <img
                  src={getCoverImageUrl() || ''}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className={`w-full h-full ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`} />
              )}
            </div>

            {/* Profile Info */}
            <div className="px-4">
              {/* Profile Picture & Edit Button Row */}
              <div className="flex items-end justify-between -mt-16 mb-3 relative">
                {/* Profile Picture */}
                <div className={`relative w-32 h-32 rounded-full border-4 ${theme === 'dark' ? 'border-black' : 'border-white'} ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'} z-10`}>
                  <img
                    src={getProfileImageUrl() || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
                    alt={user.displayname}
                    className="w-full h-full gay rounded-full object-cover"
                  />
                </div>

                {/* Action Button */}
                {isOwnProfile ? (
                  <button
                    onClick={() => setIsEditMode(true)}
                    className={`px-4 py-1.5 rounded-full font-bold text-sm transition-colors border relative z-10 ${theme === 'dark'
                      ? 'border-gray-700 hover:bg-gray-900'
                      : 'border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    {t('profile.edit_profile_button')}
                  </button>
                ) : (
                  <div className="flex gap-2 relative z-10">
                    <button
                      onClick={handleFollowClick}
                      className={`px-4 py-1.5 rounded-full font-bold text-sm transition-colors ${isFollowing
                        ? `border ${theme === 'dark' ? 'border-gray-700 hover:bg-gray-900' : 'border-gray-300 hover:bg-gray-50'}`
                        : theme === 'dark'
                          ? 'bg-white text-black hover:bg-gray-200'
                          : 'bg-black text-white hover:bg-gray-900'
                        }`}
                    >
                      {isFollowing ? t('profile.following') : t('profile.follow')}
                    </button>
                    <button
                      className={`px-2 py-1.5 rounded-full transition-colors border ${theme === 'dark'
                        ? 'border-gray-700 hover:bg-gray-900'
                        : 'border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="mb-3">
                <h2 className={`text-xl font-bold leading-6 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                  {user.displayname}
                </h2>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                  @{user.username}
                </p>
              </div>

              {/* Bio */}
              {user.bio && user.default_language && user.bio[user.default_language] && (
                <p className={`text-sm mb-3 leading-relaxed ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                  <span
                    dangerouslySetInnerHTML={{ __html: user.bio[user.default_language] }}
                  />
                </p>
              )}

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3 text-sm">
                {getLocationDisplay(user.location) && (
                  <div className={`flex items-center ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{getLocationDisplay(user.location)}</span>
                  </div>
                )}
                {user.website && (
                  <div className={`flex items-center ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                    <Link className="w-4 h-4 mr-1" />
                    <a href={user.website} className="hover:underline" target="_blank" rel="noopener noreferrer">
                      {user.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
                <div className={`flex items-center ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>{formatJoinDate(user.created_at)}</span>
                </div>
              </div>



              {/* Stats */}
              <div className="flex gap-5 mb-4">
                <button
                  type="button"
                  onClick={() => handleEngagementNavigate('followings')}
                  className={`text-sm hover:underline ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}
                >
                  <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                    {followingCountDisplay.toLocaleString()}
                  </span>
                  <span className="ml-1">{followingLabel}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleEngagementNavigate('followers')}
                  className={`text-sm hover:underline ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}
                >
                  <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                    {followerCountDisplay.toLocaleString()}
                  </span>
                  <span className="ml-1">{followersLabel}</span>
                </button>
              </div>
            </div>

            {/* Tabs - Sticky */}
            <div className={`sticky z-20 border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'} backdrop-blur-sm ${theme === 'dark' ? 'bg-black/95' : 'bg-white/95'}`} style={{ top: inline || isEmbed ? '0' : `${headerHeight}px` }}>
              <div className="flex relative">
                {[
                  { id: 'profile', label: t('profile.profile_tab') },
                  { id: 'posts', label: t('profile.posts_tab') },
                  { id: 'replies', label: t('profile.replies_tab') },
                  { id: 'media', label: t('profile.media_tab') },
                  { id: 'likes', label: t('profile.likes_tab') },
                ].map((tab) => (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-4 font-bold text-sm relative transition-colors ${activeTab === tab.id
                      ? theme === 'dark' ? 'text-white' : 'text-black'
                      : theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'
                      }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="relative z-10">{tab.label}</span>
                    {activeTab === tab.id && (
                      <motion.div
                        className={`absolute bottom-0 left-0 right-0 h-1 rounded-t-full ${theme === 'dark' ? 'bg-white' : 'bg-black'}`}
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

            <div className='w-full min-h-[100dvh]'>
              {/* Profile */}
              {activeTab === 'profile' && (
                <div className="px-4 py-6 space-y-10">
                  {/* Attributes Section */}
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className={`text-[22px] font-bold tracking-[-0.022em] leading-none ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                        {t('profile.attributes')}
                      </h2>
                      <span className={`text-[13px] font-semibold ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                        {USER_ATTRIBUTES.filter(attr => {
                          const ua = user?.user_attributes?.find((u: any) => u.category_type === attr.field);
                          return !!(ua?.attribute?.name);
                        }).length} / {USER_ATTRIBUTES.length}
                      </span>
                    </div>
                    <div className={`rounded-[18px] overflow-hidden ${theme === 'dark'
                      ? 'bg-gradient-to-br from-gray-900/95 to-gray-900/60 backdrop-blur-xl border border-white/[0.06]'
                      : 'bg-white backdrop-blur-xl border border-black/[0.06]'
                      }`}>
                      {USER_ATTRIBUTES.map((item, index) => {
                        // Get display value - use authUser if viewing own profile in edit context, otherwise use user
                        const userToCheck = (isOwnProfile && isAuthenticated && authUser) ? authUser : user;
                        let displayValue = '';
                        let hasValue = false;

                        // Check if this is a sexual identity field
                        if (item.field === 'gender_identity') {
                          // Check both structures: direct array or nested in sexual_identities
                          const genderIdentities = (userToCheck as any)?.gender_identities || (userToCheck as any)?.sexual_identities?.gender_identities;
                          const genderIdentity = genderIdentities?.[0] || (userToCheck as any)?.gender_identity;
                          if (genderIdentity?.name) {
                            displayValue = genderIdentity.name[defaultLanguage] ||
                              genderIdentity.name.en ||
                              Object.values(genderIdentity.name)[0] || '';
                            hasValue = !!displayValue;
                          }
                        } else if (item.field === 'sexual_orientation') {
                          // Check both structures: direct array or nested in sexual_identities
                          const sexualOrientations = (userToCheck as any)?.sexual_orientations || (userToCheck as any)?.sexual_identities?.sexual_orientations;
                          const sexualOrientation = sexualOrientations?.[0] || (userToCheck as any)?.sexual_orientation;
                          if (sexualOrientation?.name) {
                            displayValue = sexualOrientation.name[defaultLanguage] ||
                              sexualOrientation.name.en ||
                              Object.values(sexualOrientation.name)[0] || '';
                            hasValue = !!displayValue;
                          }
                        } else if (item.field === 'sex_role') {
                          // Check multiple structures: sexual_role, sex_role, or nested in sexual_identities
                          const sexRole = (userToCheck as any)?.sexual_role || (userToCheck as any)?.sex_role || (userToCheck as any)?.sexual_identities?.sex_role;
                          if (sexRole?.name) {
                            displayValue = sexRole.name[defaultLanguage] ||
                              sexRole.name.en ||
                              Object.values(sexRole.name)[0] || '';
                            hasValue = !!displayValue;
                          }
                        } else {
                          // Regular attribute from user_attributes
                          const currentUserAttribute = userToCheck?.user_attributes?.find(
                            (ua: any) => ua.category_type === item.field
                          );

                          if (currentUserAttribute?.attribute?.name) {
                            displayValue = currentUserAttribute.attribute.name[defaultLanguage] ||
                              currentUserAttribute.attribute.name.en ||
                              Object.values(currentUserAttribute.attribute.name)[0] || '';
                            hasValue = !!displayValue;
                          }

                          if (item.field === 'relationship_status' && !hasValue) {
                            displayValue = userToCheck?.relationship_status || '';
                            hasValue = !!displayValue;
                          }
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

                  {/* Fantasies Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className={`text-[22px] font-bold tracking-[-0.022em] leading-none ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                        {t('profile.fantasies')}
                      </h2>
                      {user.fantasies && user.fantasies.length > 0 && (
                        <span className={`text-[13px] font-semibold ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                          {user.fantasies.length}
                        </span>
                      )}
                    </div>
                    {user.fantasies && user.fantasies.length > 0 ? (
                      (() => {
                        // Group fantasies by category slug
                        const fantasiesByCategory: Record<string, typeof user.fantasies> = {};
                        user.fantasies.forEach((f) => {
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
                                    {categoryFantasies.map((f) => {
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

                  {/* Interests Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className={`text-[22px] font-bold tracking-[-0.022em] leading-none ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                        {t('profile.interests')}
                      </h2>
                      {(() => {
                        const interestsSource = (isOwnProfile && isAuthenticated && authUser && (authUser as any).interests)
                          ? (authUser as any).interests
                          : user?.interests;
                        if (interestsSource && interestsSource.length > 0) {
                          return (
                            <span className={`text-[13px] font-semibold ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                              {interestsSource.length}
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    {(() => {
                      // Use authUser.interests if viewing own profile, otherwise use user.interests
                      const interestsSource = (isOwnProfile && isAuthenticated && authUser && (authUser as any).interests)
                        ? (authUser as any).interests
                        : user?.interests;

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
                    })()}
                  </div>
                </div>
              )}

              {/* Posts / Media Masonry / Likes */}
              <div className={activeTab === 'profile' ? 'hidden' : ''}>
                {activeTab === 'media' ? (
                  // Media Masonry Grid
                  <>
                    {mediasLoading ? (
                      <div className="flex items-center justify-center py-16">
                        <div className="flex flex-col items-center gap-4">
                          <div className={`w-12 h-12 border-4 ${theme === 'dark' ? 'border-gray-800 border-t-white' : 'border-gray-200 border-t-black'} rounded-full animate-spin`} />
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
                            ? 'bg-gradient-to-br from-gray-900/95 to-gray-900/60 border border-white/[0.06]'
                            : 'bg-gradient-to-br from-gray-50 to-white border border-black/[0.06]'
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
                          <div className={`w-12 h-12 border-4 ${theme === 'dark' ? 'border-gray-800 border-t-white' : 'border-gray-200 border-t-black'} rounded-full animate-spin`} />
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
                      posts.map((post, index) => (
                        <motion.div
                          key={post.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`${theme === 'dark' ? 'bg-black' : 'bg-white'}`}
                        >
                          <Post
                            post={post as any}
                            onPostClick={(postId, username) => navigate(`/${username}/status/${postId}`)}
                            onProfileClick={(username) => navigate(`/${username}`)}
                          />
                        </motion.div>
                      ))
                    )}
                  </>
                )}
              </div>
            </div>
          </main>
        )}
      </div>

    </>
  );

  if (inline) {
    return <div className="h-full w-full">{content}</div>;
  }

  return (
    <Container>
      {content}
    </Container>
  );
};

export default ProfileScreen;