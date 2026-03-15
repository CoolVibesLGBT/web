import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MessageCircle, Share, Bookmark, MapPin, Calendar, X, ChevronLeft, ChevronRight, CircleCheck, CheckSquare, ListOrdered, Scale, BarChart3, Loader2, ExternalLink, Sparkles, Globe, Users, HandCoins, Heart, HeartOff, Banana, MoreVertical, Trash2, Flag, Home, Car, Building2, Wallet, Zap, MessageSquare, Banknote, Droplet, Feather, Dumbbell, FlaskRound, Clock, Moon, Coffee, Smile, ShieldCheck, Hand } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { useSettings } from '../../contexts/SettingsContext';
import PostReply from './PostReply';
import VideoPlayer from '../media/VideoPlayer';
import ReportButton from '../../components/ui/ReportButton';
import ShareButton from '../../components/ui/ShareButton';
import TipButton from '../../components/ui/TipButton';
import { api } from '../../services/api';
import { CLEAR_HISTORY_COMMAND } from 'lexical';
import L from 'leaflet';

import { HashtagNode } from '@lexical/hashtag';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { MentionNode } from '../editor/Lexical/nodes/MentionNode';
import { getLocalizedContent, getSafeImageURL, getSafeImageURLEx } from '../../helpers/helpers';
import { tagNameToColor } from '../../helpers/colors';
import { ImageNode } from '../editor/Lexical/nodes/ImageNode';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { HashtagPlugin } from '@lexical/react/LexicalHashtagPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import NewMentionsPlugin from '../editor/Lexical/plugins/MentionsPlugin';
import ImagesPlugin from '../editor/Lexical/plugins/ImagesPlugin';
import LinkPlugin from '../editor/Lexical/plugins/LinkPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import YouTubePlugin from '../editor/Lexical/plugins/YouTubePlugin';
import { YouTubeNode } from '../editor/Lexical/nodes/YouTubeNode';
import { TweetNode } from '../editor/Lexical/nodes/TweetNode';
import { MetadataNode } from '../editor/Lexical/nodes/MetadataNode';

const LUCIDE_ICON_MAP: Record<string, LucideIcon> = {
  home: Home,
  car: Car,
  building: Building2,
  wallet: Wallet,
  heart: Heart,
  zap: Zap,
  'message-circle': MessageSquare,
  banknote: Banknote,
  sparkles: Sparkles,
  droplet: Droplet,
  feather: Feather,
  dumbbell: Dumbbell,
  'flask-round': FlaskRound,
  clock: Clock,
  moon: Moon,
  coffee: Coffee,
  smile: Smile,
  'shield-check': ShieldCheck,
  hand: Hand,
  globe: Globe,
};

const resolveTagIcon = (icon?: string | LucideIcon): LucideIcon => {
  if (!icon) return MapPin;
  if (typeof icon === 'function') return icon as LucideIcon;
  const key = icon.toLowerCase();
  return LUCIDE_ICON_MAP[key] ?? MapPin;
};

// API data structure interfaces
interface ApiPost {
  id: string;
  public_id: string;
  author_id: string;
  type?: string;
  post_kind?: string;
  extras?: unknown;
  content?: {
    en?: string;
  };
  published: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  parent_id?: string;
  children?: ApiPost[];
  author: {
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
    languages: unknown;
    fantasies: unknown[];
    travel: unknown;
    social: unknown;
    deleted_at: string | null;
    avatar?: {
      url?: string;
      file?: {
        variants?: {
          image?: {
            icon?: { url: string };
            thumbnail?: { url: string };
            small?: { url: string };
            medium?: { url: string };
            large?: { url: string };
          };
        };
      };
      variants?: {
        image?: {
          icon?: { url: string };
          thumbnail?: { url: string };
          small?: { url: string };
          medium?: { url: string };
          large?: { url: string };
        };
      };
    };
  };
  attachments?: Array<{
    id: string;
    file_id: string;
    owner_id: string;
    owner_type: string;
  extras?: unknown;
    role: string;
    is_public: boolean;
    file: {
      id: string;
      url: string;
      storage_path: string;
      mime_type: string;
  extras?: unknown;
      size: number;
      name: string;
      created_at: string;
    };
    created_at: string;
    updated_at: string;
  }>;
  poll?: Array<{
    id: string;
    post_id: string;
    contentable_id: string;
    contentable_type: string;
  extras?: unknown;
    question: {
      en: string;
    };
    duration: string;
    kind: 'single' | 'multiple' | 'ranked' | 'weighted';
    max_selectable: number;
    created_at: string;
    updated_at: string;
    choices?: Array<{
      id: string;
      poll_id: string;
      display_order?: number;
      label: {
        en: string;
      };
      vote_count: number;
      voters?: Array<{
        id: string;
        username: string;
        displayname: string;
      }>;
      votes?: Array<{
        id: string;
        choice_id: string;
        user_id: string;
        user?: {
          id: string;
          username: string;
          displayname: string;
          avatar?: {
            file?: {
              variants?: {
                image?: {
                  icon?: { url: string };
                  thumbnail?: { url: string };
                  small?: { url: string };
                };
              };
            };
            variants?: {
              image?: {
                icon?: { url: string };
                thumbnail?: { url: string };
                small?: { url: string };
              };
            };
          };
        };
        weight?: number;
        rank?: number;
        created_at: string;
      }>;
    }>;
  }>;
  event?: {
    id: string;
    post_id: string;
    title: {
      en: string;
    };
    description: {
      en: string;
    };
    start_time: string;
    location: {
      id: string;
      contentable_id: string;
      contentable_type: string;
  extras?: unknown;
      country_code: string | null;
      address: string;
      display: string | null;
      latitude: number;
      longitude: number;
      location_point: {
        lng: number;
        lat: number;
      };
      created_at: string;
      updated_at: string;
      deleted_at: string | null;
    };
    type: string;
  extras?: unknown;
    kind?: string;
    capacity?: number;
    is_paid?: boolean;
    price?: number;
    currency?: string;
    is_online?: boolean;
    online_url?: string;
    created_at: string;
    updated_at: string;
    attendees?: Array<{
      id: string;
      username: string;
      displayname: string;
      status: 'going' | 'not_going' | 'maybe';
    }>;
  };
  location?: {
    id: string;
    contentable_id: string;
    contentable_type: string;
  extras?: unknown;
    country_code: string | null;
    address: string;
    display: string | null;
    latitude: number;
    longitude: number;
    location_point: {
      lng: number;
      lat: number;
    };
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  };
  engagements?: {
    id: string;
    contentable_id: string;
    contentable_type: string;
  extras?: unknown;
    counts: {
      comment_count?: number;
      bookmark_count?: number;
      like_given_count?: number;
      like_received_count?: number;
      dislike_received_count?: number;
      banana_count?: number;
      banana_received_count?: number;
      banana_given_count?: number;
      tip_count?: number;
      tip_amount?: number | string;
    };
    engagement_details?: Array<{
      id: string;
      engagement_id: string;
      engager_id: string;
      engagee_id?: string;
      kind: string;
      details?: unknown;
      created_at?: string;
      updated_at?: string;
    }>;
    created_at: string;
    updated_at: string;
  };
}

interface PostProps {
  post: ApiPost;
  onPostClick?: (postId: string, username: string) => void;
  onProfileClick?: (username: string) => void;
  showChildren?: boolean;
  onRefreshParent?: () => void;
  defaultShowReply?: boolean;
  loadChildren?: boolean;
  onUpdatePost?: (updatedPost: ApiPost) => void;
}

// Internal component to manage editor state within LexicalComposer context
// Moved outside Post component to prevent recreation on every render
const PostContentEditor = React.memo(({ content }: { content: string }) => {
  const [editor] = useLexicalComposerContext();
  const contentRef = useRef<string>(content);
  const isInitializedRef = useRef<boolean>(false);
  // const { data: appData, defaultLanguage } = useApp();

  useEffect(() => {
    // Only update if content actually changed
    if (contentRef.current === content && isInitializedRef.current) {
      return;
    }

    if (!content) {
      return;
    }

    contentRef.current = content;

    // Defer editor state update to avoid flushSync during React rendering
    // Use queueMicrotask to schedule after current render cycle
    queueMicrotask(() => {
      try {
        editor.setEditable(false);
        editor.setEditorState(editor.parseEditorState(content));
        editor.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined);
        isInitializedRef.current = true;
      } catch {
        // JSON değil, direkt HTML
      }
    });
  }, [content, editor]);

  return null;
});

PostContentEditor.displayName = 'PostContentEditor';

const Post: React.FC<PostProps> = ({
  post: postProp,
  onPostClick,
  onProfileClick,
  showChildren = false,
  onRefreshParent,
  defaultShowReply = false,
  loadChildren = false,
  onUpdatePost,
}) => {
  const [post, setPost] = useState<ApiPost>(postProp);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isBanana, setIsBanana] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [selectedPollChoices, setSelectedPollChoices] = useState<Record<string, string[]>>({});
  const [isPollRefreshing, setIsPollRefreshing] = useState(false);
  const [eventStatus, setEventStatus] = useState<'going' | 'not_going' | 'maybe' | null>(null);
  const [showReply, setShowReply] = useState(defaultShowReply);
  const [children, setChildren] = useState<ApiPost[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [pressingChoiceId, setPressingChoiceId] = useState<string | null>(null);
  const [authorAvatarFailed, setAuthorAvatarFailed] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isDisliking, setIsDisliking] = useState(false);
  const [isBananaing, setIsBananaing] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [hasTipped, setHasTipped] = useState(false);
  const [tipCountDisplay, setTipCountDisplay] = useState(0);
  const [tipAmountDisplay, setTipAmountDisplay] = useState(0);
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [isEventMapVisible, setIsEventMapVisible] = useState(false);
  const { theme } = useTheme();
  const { user } = useAuth();
  const { data: appData, defaultLanguage } = useApp();
  const { settings } = useSettings();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const eventMapRef = useRef<HTMLDivElement>(null);
  const eventMapInstanceRef = useRef<L.Map | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Memoize post ID and key engagement data to prevent unnecessary updates
  const postIdRef = useRef<string>(postProp.public_id);
  const userIdRef = useRef<string | undefined>(user?.id);
  const engagementsRef = useRef<unknown>(postProp.engagements);
  const postEngagementsRef = useRef<unknown>(postProp.engagements);
  const childrenRef = useRef<ApiPost[] | undefined>(postProp.children);
  const postPropRef = useRef<ApiPost>(postProp);


  // Helper function to update engagement states from post data
  // Keep it stable and only update when values actually change.
  const updateEngagementStates = (postData: ApiPost) => {
    if (!postData.engagements || !user?.id) {
      // No user logged in or no engagements, reset all states
      setIsLiked((prev) => (prev ? false : prev));
      setIsDisliked((prev) => (prev ? false : prev));
      setIsBanana((prev) => (prev ? false : prev));
      setIsBookmarked((prev) => (prev ? false : prev));
      setHasTipped((prev) => (prev ? false : prev));
      return;
    }

    const userId = user.id;

    if (postData.engagements.engagement_details && Array.isArray(postData.engagements.engagement_details)) {
      // Check engagement_details for user's interactions
      // engager_id is the user who performed the engagement
      const userEngagements = postData.engagements.engagement_details.filter(
        detail => detail && detail.engager_id === userId
      );

      // Check for each interaction type
      // Backend returns like_received/dislike_received when user gives like/dislike
      // Also check for like_given/dislike_given for compatibility
      const isLikedValue = userEngagements.some(e =>
        e.kind === 'like_given' || e.kind === 'like_received'
      );
      const isDislikedValue = userEngagements.some(e =>
        e.kind === 'dislike_given' || e.kind === 'dislike_received'
      );
      const isBananaValue = userEngagements.some(e => e.kind === 'banana');
      const isBookmarkedValue = userEngagements.some(e => e.kind === 'bookmark');
      const hasTippedValue = userEngagements.some(e => e.kind === 'tip');

      setIsLiked((prev) => (prev === isLikedValue ? prev : isLikedValue));
      setIsDisliked((prev) => (prev === isDislikedValue ? prev : isDislikedValue));
      setIsBanana((prev) => (prev === isBananaValue ? prev : isBananaValue));
      setIsBookmarked((prev) => (prev === isBookmarkedValue ? prev : isBookmarkedValue));
      setHasTipped((prev) => (prev === hasTippedValue ? prev : hasTippedValue));
    } else {
      // Fallback: reset all states if engagement_details is not available
      // This ensures we don't show stale states
      setIsLiked((prev) => (prev ? false : prev));
      setIsDisliked((prev) => (prev ? false : prev));
      setIsBanana((prev) => (prev ? false : prev));
      setIsBookmarked((prev) => (prev ? false : prev));
      setHasTipped((prev) => (prev ? false : prev));
    }
  };

  // Update post when prop changes - only if identity/engagements changed
  useEffect(() => {
    const postIdChanged = postProp.public_id !== postIdRef.current;
    const userIdChanged = user?.id !== userIdRef.current;
    const engagementsChanged = postProp.engagements !== engagementsRef.current;
    const childrenChanged = postProp.children !== childrenRef.current;

    if (postIdChanged) {
      postIdRef.current = postProp.public_id;
    }

    // Sync post state with postProp only when needed
    if (postIdChanged || engagementsChanged || postProp !== postPropRef.current) {
      setPost(postProp);
    }

    if (childrenChanged) {
      childrenRef.current = postProp.children;
      // Always update children state, even if empty array
      setChildren(postProp.children || []);
    }

    // Update engagement states when user or engagements change
    if (userIdChanged) {
      userIdRef.current = user?.id;
    }

    if (engagementsChanged) {
      engagementsRef.current = postProp.engagements;
    }

    if (engagementsChanged || userIdChanged || postIdChanged) {
      updateEngagementStates(postProp);
    }

    // Always update ref to latest postProp at the end
    postPropRef.current = postProp;
  }, [postProp, user?.id]);

  // Also update engagement states when post state changes (after API calls)
  useEffect(() => {
    const engagementsChanged = post.engagements !== postEngagementsRef.current;

    if (engagementsChanged || user?.id !== userIdRef.current) {
      updateEngagementStates(post);
      postEngagementsRef.current = post.engagements;
      userIdRef.current = user?.id;
    }
  }, [post.engagements, user?.id, post.public_id]);

  // Initialize selected poll choices from votes when post loads
  useEffect(() => {
    if (!post.poll || !user?.id) return;

    const initialChoices: Record<string, string[]> = {};

    post.poll.forEach((poll) => {
      if (!poll.choices) return;

      const userVotes: string[] = [];
      poll.choices.forEach((choice) => {
        if (choice.votes && Array.isArray(choice.votes)) {
          const userVote = choice.votes.find(vote => vote.user_id === user.id);
          if (userVote) {
            userVotes.push(choice.id);
          }
        }
      });

      if (userVotes.length > 0) {
        initialChoices[poll.id] = userVotes;
      }
    });

    if (Object.keys(initialChoices).length > 0) {
      setSelectedPollChoices(initialChoices);
    }
  }, [post.poll, user?.id]);

  useEffect(() => {
    setShowReply(defaultShowReply);
  }, [defaultShowReply]);

  useEffect(() => {
    setAuthorAvatarFailed(false);
  }, [post.author?.id, post.author?.avatar]);

  const editorConfig = useMemo(() => ({
    namespace: "CoolVibesEditorEx",
    editable: true,
    nodes: [HashtagNode, HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, AutoLinkNode, MentionNode, ImageNode, YouTubeNode, TweetNode, MetadataNode],
    theme: {
      paragraph: `relative m-0 w-full mb-2 text-base ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`,
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
      image: 'editor-image',
      hashtag: "hashtag inline-block bg-[linear-gradient(to_right,_#d04b36,_#e36511,_#ffba00,_#00b180,_#147aab,_#675997)]  bg-clip-text text-transparent  font-semibold hover:underline cursor-pointer",
      mention: "mention font-semibold  font-md inline-block bg-[linear-gradient(to_right,_#d04b36,_#e36511,_#ffba00,_#00b180,_#147aab,_#675997)]  bg-clip-text text-transparent  font-semibold hover:underline cursor-pointer"
    },
    onError(error: Error) {
      console.error("Lexical Error:", error);
    },
  }), [theme]);

  // Intersection Observer for map lazy loading
  useEffect(() => {
    if (!post.location || !mapRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setIsMapVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.1 });
    observer.observe(mapRef.current);
    return () => observer.disconnect();
  }, [post.location]);

  useEffect(() => {
    if (!post.event?.location || !eventMapRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setIsEventMapVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.1 });
    observer.observe(eventMapRef.current);
    return () => observer.disconnect();
  }, [post.event?.location]);

  // Initialize Leaflet map when location is set
  useEffect(() => {
    if (!post.location || !mapRef.current || !isMapVisible) {
      return;
    }

    const location = post.location;
    const lat = location.latitude || location.location_point?.lat;
    const lng = location.longitude || location.location_point?.lng;

    if (!lat || !lng) {
      return;
    }

    // Cleanup existing map
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      } catch (error) {
        console.error('Error removing existing map:', error);
      }
    }

    // Clear container
    const container = mapRef.current;
    container.innerHTML = '';

    // Remove Leaflet-specific properties
    if ((container as unknown)._leaflet_id) {
      delete (container as unknown)._leaflet_id;
    }

    try {
      // Create map with proper delay to ensure DOM is ready
      const initMap = () => {
        if (!mapRef.current || !location) return;

        // Ensure container has proper dimensions
        const container = mapRef.current;
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.position = 'relative';
        container.style.zIndex = '1';

        const map = L.map(container, {
          center: [lat, lng],
          zoom: 17,
          zoomControl: false,
          dragging: false,
          touchZoom: false,
          doubleClickZoom: false,
          scrollWheelZoom: false,
          boxZoom: false,
          keyboard: false,
          attributionControl: false,
          preferCanvas: true
        });

        mapInstanceRef.current = map;

        // Add tile layer with better error handling
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
          errorTileUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iI2Y5ZmFmYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOWNhM2FmIiBmb250LXNpemU9IjE0cHgiPk1hcCBUaWxlPC90ZXh0Pjwvc3ZnPg=='
        }).addTo(map);

        // Add custom marker
        const customIcon = L.divIcon({
          html: `
            <div style="
              width: 30px;
              height: 30px;
              background: #ef4444;
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              position: relative;
            ">
              <div style="
                width: 10px;
                height: 10px;
                background: white;
                border-radius: 50%;
              "></div>
            </div>
          `,
          className: 'custom-location-marker',
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        L.marker([lat, lng], { icon: customIcon }).addTo(map);

        // Force map to invalidate size after a short delay
        setTimeout(() => {
          if (map && mapInstanceRef.current) {
            map.invalidateSize();
          }
        }, 200);
      };

      // Use requestAnimationFrame for better timing
      requestAnimationFrame(() => {
        setTimeout(initMap, 50);
      });

    } catch (error) {
      console.error('Error creating map:', error);
    }

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        } catch (error) {
          console.error('Error cleaning up map:', error);
        }
      }
    };
  }, [post.location]);

  // Initialize Leaflet map for event location
  useEffect(() => {
    if (!post.event?.location || !eventMapRef.current || !isEventMapVisible) {
      return;
    }

    const location = post.event.location;
    const lat = location.latitude || location.location_point?.lat;
    const lng = location.longitude || location.location_point?.lng;

    if (!lat || !lng) {
      return;
    }

    // Cleanup existing map
    if (eventMapInstanceRef.current) {
      try {
        eventMapInstanceRef.current.remove();
        eventMapInstanceRef.current = null;
      } catch (error) {
        console.error('Error removing existing event map:', error);
      }
    }

    // Clear container
    const container = eventMapRef.current;
    container.innerHTML = '';

    // Remove Leaflet-specific properties
    if ((container as unknown)._leaflet_id) {
      delete (container as unknown)._leaflet_id;
    }

    try {
      // Create map with proper delay to ensure DOM is ready
      const initMap = () => {
        if (!eventMapRef.current || !location) return;

        // Ensure container has proper dimensions
        const container = eventMapRef.current;
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.position = 'relative';
        container.style.zIndex = '1';

        const map = L.map(container, {
          center: [lat, lng],
          zoom: 17,
          zoomControl: false,
          dragging: false,
          touchZoom: false,
          doubleClickZoom: false,
          scrollWheelZoom: false,
          boxZoom: false,
          keyboard: false,
          attributionControl: false,
          preferCanvas: true
        });

        eventMapInstanceRef.current = map;

        // Add tile layer with better error handling
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
          errorTileUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iI2Y5ZmFmYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOWNhM2FmIiBmb250LXNpemU9IjE0cHgiPk1hcCBUaWxlPC90ZXh0Pjwvc3ZnPg=='
        }).addTo(map);

        // Add custom marker
        const customIcon = L.divIcon({
          html: `
            <div style="
              width: 30px;
              height: 30px;
              background: #ef4444;
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              position: relative;
            ">
              <div style="
                width: 10px;
                height: 10px;
                background: white;
                border-radius: 50%;
              "></div>
            </div>
          `,
          className: 'custom-location-marker',
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        L.marker([lat, lng], { icon: customIcon }).addTo(map);

        // Force map to invalidate size after a short delay
        setTimeout(() => {
          if (map && eventMapInstanceRef.current) {
            map.invalidateSize();
          }
        }, 200);
      };

      // Use requestAnimationFrame for better timing
      requestAnimationFrame(() => {
        setTimeout(initMap, 50);
      });

    } catch (error) {
      console.error('Error creating event map:', error);
    }

    // Cleanup function
    return () => {
      if (eventMapInstanceRef.current) {
        try {
          eventMapInstanceRef.current.remove();
          eventMapInstanceRef.current = null;
        } catch (error) {
          console.error('Error cleaning up event map:', error);
        }
      }
    };
  }, [post.event?.location]);

  // Fetch children (replies) when in detail view
  // Only fetch if children are not already included in the post data
  useEffect(() => {
    // If post already has children, always use them (regardless of loadChildren prop)
    if (post.children && post.children.length > 0) {
      setChildren(post.children);
      setLoadingChildren(false);
      return;
    }

    // Only fetch if loadChildren is true and post doesn't have children
    if (loadChildren && post.public_id) {
      setLoadingChildren(true);
      api.fetchPost(post.public_id)
        .then((response) => {
          if (response.children) {
            setChildren(response.children);
          }
        })
        .catch((error) => {
          console.error('Error fetching post children:', error);
        })
        .finally(() => {
          setLoadingChildren(false);
        });
    } else if (!loadChildren) {
      // If loadChildren is false and post doesn't have children, clear children state
      // But don't clear if post.children exists (handled above)
      setChildren([]);
      setLoadingChildren(false);
    }
  }, [loadChildren, post.public_id]);

  // Handle image load
  const handleImageLoad = useCallback((imageUrl: string) => {
    setLoadedImages(prev => new Set(prev).add(imageUrl));
  }, []);

  // Handle profile click
  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent post click
    onProfileClick?.(post.author.username);
  };

  const authorAvatarUrl = useMemo(() => {
    const avatar = (post.author as unknown)?.avatar;
    return getSafeImageURLEx(post?.author?.public_id, avatar, 'thumbnail')
  }, [post.author]);

  // Helper function to format timestamp
  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const postDate = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'now';
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    return postDate.toLocaleDateString();
  };

  // Helper function to format event time
  const formatEventTime = (timestamp: string) => {
    const eventDate = new Date(timestamp);
    return eventDate.toLocaleString();
  };

  // Calculate total votes for a specific poll
  const getTotalVotes = (poll: NonNullable<typeof post.poll>[0]) => {
    if (!poll || !poll.choices || !Array.isArray(poll.choices)) return 0;
    return poll.choices.reduce((total: number, choice: unknown) => total + (choice.vote_count || 0), 0);
  };

  // Calculate percentage for poll choice
  const getChoicePercentage = (voteCount: number, poll: NonNullable<typeof post.poll>[0]) => {
    const total = getTotalVotes(poll);
    if (total === 0 || !voteCount) return 0;
    return Math.round((voteCount / total) * 100);
  };

  // Rainbow rank styles for progress bars (from TrendsPanel)
  const rainbowRankStyles: Array<{ background: string; color: string }> = [
    {
      background: 'linear-gradient(135deg, #FF3B30 0%, #FF6B3B 100%)',
      color: '#ffffff',
    },
    {
      background: 'linear-gradient(135deg, #FF9500 0%, #FFD60A 100%)',
      color: '#1f2937',
    },
    {
      background: 'linear-gradient(135deg, #FFD60A 0%, #34C759 100%)',
      color: '#1f2937',
    },
    {
      background: 'linear-gradient(135deg, #34C759 0%, #32D74B 100%)',
      color: '#ffffff',
    },
    {
      background: 'linear-gradient(135deg, #007AFF 0%, #5AC8FA 100%)',
      color: '#ffffff',
    },
    {
      background: 'linear-gradient(135deg, #5856D6 0%, #5E5CE6 100%)',
      color: '#ffffff',
    },
    {
      background: 'linear-gradient(135deg, #AF52DE 0%, #FF2D55 100%)',
      color: '#ffffff',
    },
  ];

  const getRankStyle = (rank: number) => {
    if (rank <= rainbowRankStyles.length) {
      return rainbowRankStyles[rank - 1];
    }

    const hue = (rank * 47) % 360;
    const nextHue = (hue + 30) % 360;

    return {
      background: `linear-gradient(135deg, hsl(${hue}, 85%, 55%) 0%, hsl(${nextHue}, 80%, 60%) 100%)`,
      color: '#ffffff',
    };
  };

  const handlePollVote = async (pollId: string, choiceId: string, pollKind: 'single' | 'multiple' | 'ranked' | 'weighted', maxSelectable: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent post click

    // Get current state before updating
    const currentChoices = selectedPollChoices[pollId] || [];
    const choiceIndex = currentChoices.indexOf(choiceId);
    const isSelecting = choiceIndex === -1;

    // Update state
    setSelectedPollChoices(prev => {
      const currentChoices = prev[pollId] || [];
      const choiceIndex = currentChoices.indexOf(choiceId);

      if (pollKind === 'single') {
        // Single choice: Toggle - if already selected, deselect; otherwise replace
        if (choiceIndex !== -1) {
          // Deselect
          const updated = { ...prev };
          delete updated[pollId];
          return updated;
        } else {
          // Select (replace existing)
          return {
            ...prev,
            [pollId]: [choiceId]
          };
        }
      } else {
        // Multiple, ranked, or weighted: Allow multiple selections
        if (choiceIndex !== -1) {
          // Deselect
          const filtered = currentChoices.filter(id => id !== choiceId);
          if (filtered.length === 0) {
            const updated = { ...prev };
            delete updated[pollId];
            return updated;
          }
          return {
            ...prev,
            [pollId]: filtered
          };
        } else {
          // Select (add to list, but check max)
          if (currentChoices.length >= maxSelectable) {
            // Already at max, can't add more
            return prev;
          }
          return {
            ...prev,
            [pollId]: [...currentChoices, choiceId]
          };
        }
      }
    });

    // Send vote to API (both selecting and deselecting)
    setIsPollRefreshing(true);
    try {
      // Calculate rank for ranked polls (0-based index in selection order)
      // For deselecting, we don't send rank/weight
      const rank = isSelecting && pollKind === 'ranked' ? currentChoices.length : undefined;
      const weight = isSelecting && pollKind === 'weighted' ? 1 : undefined;

      await api.handleVote({
        choice_id: choiceId,
        rank: rank,
        weight: weight,
      });

      // Reload post to get updated vote counts
      if (post.public_id) {
        try {
          const updatedPost = await api.fetchPost(post.public_id);
          setPost(updatedPost);
          if (onUpdatePost) {
            onUpdatePost(updatedPost);
          } else if (onRefreshParent) {
            onRefreshParent();
          }
        } catch (reloadError) {
          console.error('Error reloading post after vote:', reloadError);
        }
      }
    } catch (error) {
      console.error('Error voting on poll:', error);
      // Revert the selection on error
      setSelectedPollChoices(prev => {
        const currentChoices = prev[pollId] || [];
        if (isSelecting) {
          // Revert selection (remove the choice we just added)
          const filtered = currentChoices.filter(id => id !== choiceId);
          if (filtered.length === 0) {
            const updated = { ...prev };
            delete updated[pollId];
            return updated;
          }
          return {
            ...prev,
            [pollId]: filtered
          };
        } else {
          // Revert deselection (add back the choice we just removed)
          return {
            ...prev,
            [pollId]: [...currentChoices, choiceId]
          };
        }
      });
    } finally {
      setIsPollRefreshing(false);
    }
  };

  // Gallery handlers
  const openGallery = useCallback((index: number) => {
    setSelectedImageIndex(index);
    setIsGalleryOpen(true);
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }, []);

  const closeGallery = useCallback(() => {
    setIsGalleryOpen(false);
    document.body.style.overflow = ''; // Restore scrolling
  }, []);

  const imageAttachments = useMemo(() => {
    if (!post.attachments || !Array.isArray(post.attachments)) return [];
    return post.attachments.filter(att => att?.file?.mime_type?.startsWith('image/'));
  }, [post.attachments]);

  const nextImage = useCallback(() => {
    if (imageAttachments.length === 0) return;
    setSelectedImageIndex((prev) => (prev + 1) % imageAttachments.length);
  }, [imageAttachments.length]);

  const prevImage = useCallback(() => {
    if (imageAttachments.length === 0) return;
    setSelectedImageIndex((prev) => (prev - 1 + imageAttachments.length) % imageAttachments.length);
  }, [imageAttachments.length]);

  // Keyboard navigation for gallery
  useEffect(() => {
    if (!isGalleryOpen || imageAttachments.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeGallery();
      } else if (e.key === 'ArrowLeft') {
        prevImage();
      } else if (e.key === 'ArrowRight') {
        nextImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGalleryOpen, imageAttachments.length, prevImage, nextImage, closeGallery]);


  // Handle like
  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLiking) return;

    setIsLiking(true);
    const wasLiked = isLiked;
    const wasDisliked = isDisliked;

    // If currently disliked, remove dislike first
    if (wasDisliked) {
      setIsDisliked(false);
    }

    setIsLiked(!isLiked);

    try {
      await api.handlePostLike(post.public_id);
      console.log("Like API call successful, fetching updated post");
      // Refresh post to get updated engagement counts
      if (post.public_id) {
        try {
          const updatedPost = await api.fetchPost(post.public_id);
          console.log("Updated post fetched, calling updateEngagementStates from handleLike");
          setPost(updatedPost);
          // Update engagement states immediately after API call
          updateEngagementStates(updatedPost);
          if (onUpdatePost) {
            onUpdatePost(updatedPost);
          } else if (onRefreshParent) {
            onRefreshParent();
          }
        } catch (reloadError) {
          console.error('Error reloading post after like:', reloadError);
        }
      }
    } catch (error) {
      console.error('Error liking post:', error);
      setIsLiked(wasLiked); // Revert on error
      setIsDisliked(wasDisliked); // Revert dislike state
    } finally {
      setIsLiking(false);
    }
  };

  // Handle dislike
  const handleDislike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDisliking) return;

    setIsDisliking(true);
    const wasDisliked = isDisliked;
    const wasLiked = isLiked;

    // If currently liked, remove like first
    if (wasLiked) {
      setIsLiked(false);
    }

    setIsDisliked(!isDisliked);

    try {
      await api.handlePostDislike(post.public_id);
      // Refresh post to get updated engagement counts
      if (post.public_id) {
        try {
          const updatedPost = await api.fetchPost(post.public_id);
          setPost(updatedPost);
          // Update engagement states immediately after API call
          updateEngagementStates(updatedPost);
          if (onUpdatePost) {
            onUpdatePost(updatedPost);
          } else if (onRefreshParent) {
            onRefreshParent();
          }
        } catch (reloadError) {
          console.error('Error reloading post after dislike:', reloadError);
        }
      }
    } catch (error) {
      console.error('Error disliking post:', error);
      setIsDisliked(wasDisliked); // Revert on error
      setIsLiked(wasLiked); // Revert like state
    } finally {
      setIsDisliking(false);
    }
  };

  // Handle banana
  const handleBanana = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isBananaing) return;

    setIsBananaing(true);
    const wasBanana = isBanana;

    setIsBanana(!isBanana);

    try {
      await api.handlePostBanana(post.public_id);
      // Refresh post to get updated engagement counts
      if (post.public_id) {
        try {
          const updatedPost = await api.fetchPost(post.public_id);
          setPost(updatedPost);
          // Update engagement states immediately after API call
          updateEngagementStates(updatedPost);
          if (onUpdatePost) {
            onUpdatePost(updatedPost);
          } else if (onRefreshParent) {
            onRefreshParent();
          }
        } catch (reloadError) {
          console.error('Error reloading post after banana:', reloadError);
        }
      }
    } catch (error) {
      console.error('Error banana post:', error);
      setIsBanana(wasBanana); // Revert on error
    } finally {
      setIsBananaing(false);
    }
  };

  // Handle bookmark
  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isBookmarking) return;

    setIsBookmarking(true);
    const wasBookmarked = isBookmarked;
    setIsBookmarked(!isBookmarked);

    try {
      await api.handlePostAddToBookmarks(post.public_id);
      // Refresh post to get updated engagement counts
      if (post.public_id) {
        try {
          const updatedPost = await api.fetchPost(post.public_id);
          setPost(updatedPost);
          // Update engagement states immediately after API call
          updateEngagementStates(updatedPost);
          if (onUpdatePost) {
            onUpdatePost(updatedPost);
          } else if (onRefreshParent) {
            onRefreshParent();
          }
        } catch (reloadError) {
          console.error('Error reloading post after bookmark:', reloadError);
        }
      }
    } catch (error) {
      console.error('Error bookmarking post:', error);
      setIsBookmarked(wasBookmarked); // Revert on error
    } finally {
      setIsBookmarking(false);
    }
  };

  // Handle delete post confirmation
  const handleDeleteClick = () => {
    setIsMenuOpen(false);
    setShowDeleteModal(true);
    setDeleteError(null); // Reset error when opening modal
  };

  // Handle delete post
  const handleDeletePost = async () => {
    if (isDeleting) return;
    if (!user || user.id !== post.author_id) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await api.handlePostDelete(post.public_id);
      // Success - close modal and refresh
      setShowDeleteModal(false);
      // Refresh parent to remove deleted post
      if (onRefreshParent) {
        onRefreshParent();
      }
      // If this is a child post, notify parent
      if (onUpdatePost) {
        // Post deleted, parent should handle removal
        onUpdatePost({ ...post, deleted_at: new Date().toISOString() } as ApiPost);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      setDeleteError('Failed to delete post. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Close menu when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isMenuOpen) {
          setIsMenuOpen(false);
        }
        if (showDeleteModal) {
          setShowDeleteModal(false);
          setDeleteError(null);
        }
      }
    };

    if (isMenuOpen || showDeleteModal) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen, showDeleteModal]);


  // Touch swipe support
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      nextImage();
    } else if (distance < -minSwipeDistance) {
      prevImage();
    }
  };

  const refreshPostData = useCallback(async () => {
    if (!post.public_id) return;
    try {
      const updatedPost = await api.fetchPost(post.public_id);
      setPost(updatedPost);
      // Update engagement states immediately after API call
      updateEngagementStates(updatedPost);
      if (onUpdatePost) {
        onUpdatePost(updatedPost);
      } else if (onRefreshParent) {
        onRefreshParent();
      }
    } catch (error) {
      console.error('Error refreshing post after tip:', error);
    }
  }, [post.public_id, onUpdatePost, onRefreshParent]);

  const handleTipSuccess = (amount: number) => {
    setHasTipped(true);
    setTipCountDisplay((prev) => prev + 1);
    setTipAmountDisplay((prev) => Number((prev + amount).toFixed(2)));
    refreshPostData();
  };

  // Shimmer Component
  const ImageShimmer = ({ className }: { className?: string }) => (
    <>
      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .shimmer-animation {
          animation: shimmer 1.5s infinite linear;
        }
      `}</style>
      <div className={`relative overflow-hidden rounded-2xl ${className || ''}`}>
        <div className={`absolute inset-0 rounded-2xl ${theme === 'dark' ? 'bg-gray-900/30' : 'bg-gray-200'
          }`}>
          <div className={`absolute inset-0 rounded-2xl shimmer-animation ${theme === 'dark'
            ? 'bg-gradient-to-r from-gray-900/30 via-gray-800/50 to-gray-900/30'
            : 'bg-gradient-to-r from-gray-200 via-gray-300/50 to-gray-200'
            }`}
            style={{
              backgroundSize: '200% 100%'
            }} />
        </div>
      </div>
    </>
  );


  const tipCountValue = Number(post.engagements?.counts?.tip_count ?? 0);
  const tipCount = Number.isFinite(tipCountValue) ? tipCountValue : 0;
  const tipAmountRaw = post.engagements?.counts?.tip_amount;
  const tipAmountValue = tipAmountRaw !== undefined && tipAmountRaw !== null ? Number(tipAmountRaw) : 0;
  const tipAmount = Number.isFinite(tipAmountValue) ? tipAmountValue : 0;

  useEffect(() => {
    setTipCountDisplay(tipCount);
    setTipAmountDisplay(tipAmount);
  }, [tipCount, tipAmount]);




  return (
    <>
      <motion.div
        className={`
  overflow-hidden border-b transition-colors duration-300 ease-out
  ${theme === "dark"
            ? "border-gray-900 hover:bg-gray-900/50"
            : "border-gray-200/50 hover:bg-gray-50"}
  ${onPostClick ? 'cursor-pointer' : ''}
`}
        onClick={(e) => {
          // Only trigger if clicking on non-interactive elements
          // Interactive elements (buttons, links, etc.) should use stopPropagation
          if (onPostClick) {
            const target = e.target as HTMLElement;
            // Check if click is on an interactive element or its children
            const isInteractive = target.closest('button, a, input, select, textarea, [role="button"], [data-interactive="true"], [data-no-post-click="true"]');
            // Also check if the click originated from an interactive element
            const clickedElement = e.target as HTMLElement;
            const isClickOnInteractive = clickedElement.tagName === 'BUTTON' ||
              clickedElement.tagName === 'A' ||
              clickedElement.closest('button') !== null ||
              clickedElement.closest('a') !== null ||
              clickedElement.closest('[role="button"]') !== null ||
              clickedElement.closest('[data-no-post-click="true"]') !== null;

            // Additional check: if the event was already stopped, don't trigger
            if (e.isPropagationStopped()) {
              return;
            }

            if (!isInteractive && !isClickOnInteractive) {
              onPostClick(post.public_id, post.author.username);
            }
          }
        }}
        onTapStart={(e) => {
          // Prevent whileTap animation if clicking on interactive elements
          const target = e.target as HTMLElement;
          const isInteractive = target.closest('button, a, input, select, textarea, [role="button"], [data-no-post-click="true"]');
          if (isInteractive) {
            e.stopPropagation();
          }
        }}
        onTapCancel={(e) => {
          // Prevent whileTap animation if clicking on interactive elements
          const target = e.target as HTMLElement;
          const isInteractive = target.closest('button, a, input, select, textarea, [role="button"], [data-no-post-click="true"]');
          if (isInteractive) {
            e.stopPropagation();
          }
        }}
        whileTap={onPostClick ? { scale: 0.98, opacity: 0.95 } : undefined}
        transition={{ duration: 0.15 }}
      >
        {/* Post Header */}
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              data-no-post-click="true"
              onClick={(e) => {
                e.stopPropagation();
                handleProfileClick(e);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200 overflow-hidden border ${theme === 'dark'
                ? 'bg-gray-900/30 hover:bg-gray-900/50 border-gray-900'
                : 'bg-white hover:bg-gray-100 border-gray-200/50'
                }`}
              aria-label={`${post?.author?.displayname}'s profile`}
            >
              {authorAvatarUrl && !authorAvatarFailed ? (
                <img
                  src={authorAvatarUrl}
                  alt={post?.author?.displayname}
                  className="w-full h-full object-cover"
                  onError={() => setAuthorAvatarFailed(true)}
                />
              ) : (
                <span className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                  {post.author.displayname.charAt(0).toUpperCase()}
                </span>
              )}
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <button
                  data-no-post-click="true"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProfileClick(e);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  className={`font-semibold hover:underline transition-colors duration-200 ${theme === 'dark' ? 'text-white hover:text-gray-300' : 'text-gray-900 hover:text-gray-600'
                    }`}
                >
                  {post.author.displayname}
                </button>
                <button
                  data-no-post-click="true"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProfileClick(e);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  className={`text-sm hover:underline transition-colors duration-200 ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-600'
                    }`}
                >
                  @{post.author.username}
                </button>
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                  }`}>·</span>
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>{formatTimestamp(post.created_at)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2" data-no-post-click="true" onClick={(e) => e.stopPropagation()}>
            <ShareButton
              url={typeof window !== 'undefined' ? `${window.location.origin}/status/${post.public_id}` : ''}
              title={post.author.displayname ? `${post.author.displayname}'s post` : 'Post'}
              description={post.content ? (getLocalizedContent(post.content, defaultLanguage || 'en')?.replace(/<[^>]*>/g, '') || '').substring(0, 100) : ''}
              trigger={
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  onTapStart={(e) => e.stopPropagation()}
                  whileTap={{ scale: 0.9 }}
                  className={`p-2 rounded-full transition-colors duration-200 ${theme === 'dark'
                    ? 'hover:bg-gray-900/50 text-gray-400 hover:text-white'
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
                    }`}
                  aria-label="Share post"
                >
                  <Share className="w-5 h-5" />
                </motion.button>
              }
            />
            <div className="relative" ref={menuRef}>
              <motion.button
                data-no-post-click="true"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(!isMenuOpen);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onTapStart={(e) => e.stopPropagation()}
                whileTap={{ scale: 0.9 }}
                className={`p-2 rounded-full transition-colors duration-200 ${theme === 'dark'
                  ? 'hover:bg-gray-900/50 text-gray-400 hover:text-white'
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
                  }`}
                aria-label="More options"
              >
                <MoreVertical className="w-5 h-5" />
              </motion.button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className={`absolute right-0 top-full mt-2 w-48 rounded-xl shadow-lg border z-50 ${theme === 'dark'
                    ? 'bg-gray-900 border-gray-800'
                    : 'bg-white border-gray-200'
                    }`}
                  onClick={(e) => e.stopPropagation()}
                  data-no-post-click="true"
                >
                  {user && user.id === post.author_id && (
                    <button
                      data-no-post-click="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick();
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                      disabled={isDeleting}
                      className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors duration-200 first:rounded-t-xl ${theme === 'dark'
                        ? 'hover:bg-gray-800 text-red-400 hover:text-red-300'
                        : 'hover:bg-gray-50 text-red-600 hover:text-red-700'
                        } ${isDeleting ? 'opacity-50 cursor-wait' : ''}`}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Delete Post
                      </span>
                    </button>
                  )}
                  <ReportButton
                    type="post"
                    id={post.public_id}
                    onModalClose={() => setIsMenuOpen(false)}
                    onReportSuccess={() => {
                      setIsMenuOpen(false);
                    }}
                    trigger={
                      <div
                        data-no-post-click="true"
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors duration-200 cursor-pointer ${user && user.id === post.author_id ? 'rounded-b-xl' : 'rounded-xl'
                          } ${theme === 'dark'
                            ? 'hover:bg-gray-800 text-gray-300 hover:text-white'
                            : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                          }`}>
                        <Flag className="w-4 h-4" />
                        <span className="text-sm font-medium">Report</span>
                      </div>
                    }
                  />
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Post Content */}
        <div className="px-4 py-3">


          <LexicalComposer initialConfig={editorConfig}>
            <PostContentEditor content={getLocalizedContent(post.content, defaultLanguage)} />
            <div className="relative">
              <HashtagPlugin />
              <ListPlugin />
              <LinkPlugin />
              <YouTubePlugin />
              <ImagesPlugin captionsEnabled={false} />
              <NewMentionsPlugin />


              <RichTextPlugin



                contentEditable={
                  <ContentEditable
                    className="editor-input lexical-editor py-0 px-0"

                  />
                }
                placeholder={
                  <div className="pt-[24px] rounded-sm z-0 p-0 editor-placeholder w-full h-full text-start flex justify-start items-start">
                    {"Loading..."}
                  </div>
                }
                ErrorBoundary={LexicalErrorBoundary}
              />

            </div>
          </LexicalComposer>


        </div>

        {/* Post Attachments */}
        {post.attachments && post.attachments.length > 0 && (
          <div className="px-4 pb-3">
            {(() => {
              if (!post.attachments || !Array.isArray(post.attachments)) return null;
              const imageAttachments = post.attachments.filter(att => att?.file?.mime_type?.startsWith('image/'));
              const videoAttachments = post.attachments.filter(att => att?.file?.mime_type?.startsWith('video/'));
              const nonImageVideoAttachments = post.attachments.filter(att =>
                !att?.file?.mime_type?.startsWith('image/') && !att?.file?.mime_type?.startsWith('video/')
              );
              const imageCount = imageAttachments.length;
              const videoCount = videoAttachments.length;

              // Render video attachments first (YouTube quality)
              const videoRender = videoCount > 0 && (
                <div className="w-full space-y-4 mb-4">
                  {videoAttachments.map((attachment, index) => {
                    // Video URL'ini variants'tan al - Öncelik: high > medium > low > preview > original
                    const videoUrl = getSafeImageURL(attachment, 'high') ||
                      getSafeImageURL(attachment, 'medium') ||
                      getSafeImageURL(attachment, 'low') ||
                      getSafeImageURL(attachment, 'preview') ||
                      getSafeImageURL(attachment, 'original') ||
                      attachment.file.url;

                    // Poster URL'ini al
                    const posterUrl = getSafeImageURL(attachment, 'poster') || '';

                    return (
                      <VideoPlayer
                        key={attachment.id || index}
                        src={videoUrl}
                        poster={posterUrl}
                        className="w-full"
                      />
                    );
                  })}
                </div>
              );

              if (imageCount === 0 && videoCount === 0 && nonImageVideoAttachments.length > 0) {
                // Only non-image/video attachments
                return (
                  <>
                    {videoRender}
                    {nonImageVideoAttachments.map((attachment, index) => (
                      <div key={index} className="w-full overflow-hidden mb-2 last:mb-0">
                        <div className={`w-full h-48 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900/30' : 'bg-gray-100'
                          }`}>
                          <span className={`text-sm ${theme === 'dark' ? 'text-white/70' : 'text-gray-500'}`}>
                            {attachment.file.name}
                          </span>
                        </div>
                      </div>
                    ))}
                  </>
                );
              }

              // Pinterest-style image grid layouts - All images visible
              if (imageCount === 1) {
                const imageUrl = getSafeImageURL(imageAttachments[0], "medium");
                if (!imageUrl) return null;
                const isLoaded = loadedImages.has(imageUrl);

                return (
                  <>
                    {videoRender}
                    <div className="grid grid-cols-1 gap-2">
                      <div className="w-full  relative ">
                        {!isLoaded && <ImageShimmer className="absolute inset-0 w-full h-full" />}
                        <img
                          src={imageUrl}
                          alt="Post attachment"
                          className={`mx-auto  rounded-2xl  max-h-[80dvh] aspect-[9/16]  cursor-pointer hover:opacity-90 transition-all duration-300 ${!isLoaded ? 'opacity-0' : 'opacity-100'} ${settings.blurPhotos ? 'blur-xl scale-110' : ''}`}
                          onLoad={() => handleImageLoad(imageUrl)}
                          onClick={(e) => {
                            e.stopPropagation();
                            openGallery(0);
                          }}
                        />
                      </div>
                    </div>
                  </>
                );
              }

              if (imageCount === 2) {
                return (
                  <>
                    {videoRender}
                    <div className="grid grid-cols-2 gap-2">
                      {imageAttachments.map((attachment, index) => {
                        const imageUrl = getSafeImageURL(attachment, "medium");
                        if (!imageUrl) return null;
                        const isLoaded = loadedImages.has(imageUrl);

                        return (
                          <div key={index} className="w-full overflow-hidden rounded-2xl relative h-[300px]">
                            {!isLoaded && <ImageShimmer className="absolute inset-0 w-full h-full" />}
                            <img
                              src={imageUrl}
                              alt={`Post attachment ${index + 1}`}
                              className={`w-full h-full object-cover cursor-pointer hover:opacity-90 transition-all duration-300 ${!isLoaded ? 'opacity-0' : 'opacity-100'} ${settings.blurPhotos ? 'blur-xl scale-110' : ''}`}
                              onLoad={() => handleImageLoad(imageUrl)}
                              onClick={(e) => {
                                e.stopPropagation();
                                openGallery(index);
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              }

              if (imageCount === 3) {
                const firstImageUrl = getSafeImageURL(imageAttachments[0], "medium");
                const secondImageUrl = getSafeImageURL(imageAttachments[1], "medium");
                const thirdImageUrl = getSafeImageURL(imageAttachments[2], "medium");
                if (!firstImageUrl || !secondImageUrl || !thirdImageUrl) return null;
                const firstLoaded = loadedImages.has(firstImageUrl);
                const secondLoaded = loadedImages.has(secondImageUrl);
                const thirdLoaded = loadedImages.has(thirdImageUrl);

                return (
                  <>
                    {videoRender}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="row-span-2 overflow-hidden rounded-2xl relative h-[300px]">
                        {!firstLoaded && <ImageShimmer className="absolute inset-0 w-full h-full" />}
                        <img
                          src={firstImageUrl}
                          alt="Post attachment 1"
                          className={`w-full h-full object-cover cursor-pointer hover:opacity-90 transition-all duration-300 ${!firstLoaded ? 'opacity-0' : 'opacity-100'} ${settings.blurPhotos ? 'blur-xl scale-110' : ''}`}
                          onLoad={() => handleImageLoad(firstImageUrl)}
                          onClick={(e) => {
                            e.stopPropagation();
                            openGallery(0);
                          }}
                        />
                      </div>
                      <div className="overflow-hidden rounded-2xl relative h-[146px]">
                        {!secondLoaded && <ImageShimmer className="absolute inset-0 w-full h-full" />}
                        <img
                          src={secondImageUrl}
                          alt="Post attachment 2"
                          className={`w-full h-full object-cover cursor-pointer hover:opacity-90 transition-all duration-300 ${!secondLoaded ? 'opacity-0' : 'opacity-100'} ${settings.blurPhotos ? 'blur-xl scale-110' : ''}`}
                          onLoad={() => handleImageLoad(secondImageUrl)}
                          onClick={(e) => {
                            e.stopPropagation();
                            openGallery(1);
                          }}
                        />
                      </div>
                      <div className="overflow-hidden rounded-2xl relative h-[146px]">
                        {!thirdLoaded && <ImageShimmer className="absolute inset-0 w-full h-full" />}
                        <img
                          src={thirdImageUrl}
                          alt="Post attachment 3"
                          className={`w-full h-full object-cover cursor-pointer hover:opacity-90 transition-all duration-300 ${!thirdLoaded ? 'opacity-0' : 'opacity-100'} ${settings.blurPhotos ? 'blur-xl scale-110' : ''}`}
                          onLoad={() => handleImageLoad(thirdImageUrl)}
                          onClick={(e) => {
                            e.stopPropagation();
                            openGallery(2);
                          }}
                        />
                      </div>
                    </div>
                  </>
                );
              }

              if (imageCount === 4) {
                return (
                  <>
                    {videoRender}
                    <div className="grid grid-cols-2 gap-2">
                      {imageAttachments.map((attachment, index) => {
                        const imageUrl = getSafeImageURL(attachment, "medium");
                        if (!imageUrl) return null;
                        const isLoaded = loadedImages.has(imageUrl);

                        return (
                          <div key={index} className="w-full overflow-hidden rounded-2xl relative h-[200px]">
                            {!isLoaded && <ImageShimmer className="absolute inset-0 w-full h-full" />}
                            <img
                              src={imageUrl}
                              alt={`Post attachment ${index + 1}`}
                              className={`w-full h-full object-cover cursor-pointer hover:opacity-90 transition-all duration-300 ${!isLoaded ? 'opacity-0' : 'opacity-100'} ${settings.blurPhotos ? 'blur-xl scale-110' : ''}`}
                              onLoad={() => handleImageLoad(imageUrl)}
                              onClick={(e) => {
                                e.stopPropagation();
                                openGallery(index);
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              }

              // 5 images: Pinterest-style masonry grid
              if (imageCount === 5) {
                const firstImageUrl = getSafeImageURL(imageAttachments[0], "medium");
                if (!firstImageUrl) return null;
                const firstLoaded = loadedImages.has(firstImageUrl);

                return (
                  <>
                    {videoRender}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2 row-span-2 overflow-hidden rounded-2xl relative h-[300px]">
                        {!firstLoaded && <ImageShimmer className="absolute inset-0 w-full h-full" />}
                        <img
                          src={firstImageUrl}
                          alt="Post attachment 1"
                          className={`w-full h-full object-cover cursor-pointer hover:opacity-90 transition-all duration-300 ${!firstLoaded ? 'opacity-0' : 'opacity-100'} ${settings.blurPhotos ? 'blur-xl scale-110' : ''}`}
                          onLoad={() => handleImageLoad(firstImageUrl)}
                          onClick={(e) => {
                            e.stopPropagation();
                            openGallery(0);
                          }}
                        />
                      </div>
                      {imageAttachments.slice(1, 5).map((attachment, idx) => {
                        const imageUrl = getSafeImageURL(attachment, "medium");
                        if (!imageUrl) return null;
                        const isLoaded = loadedImages.has(imageUrl);

                        return (
                          <div key={idx + 1} className="overflow-hidden rounded-2xl relative h-[146px]">
                            {!isLoaded && <ImageShimmer className="absolute inset-0 w-full h-full" />}
                            <img
                              src={imageUrl}
                              alt={`Post attachment ${idx + 2}`}
                              className={`w-full h-full object-cover cursor-pointer hover:opacity-90 transition-all duration-300 ${!isLoaded ? 'opacity-0' : 'opacity-100'} ${settings.blurPhotos ? 'blur-xl scale-110' : ''}`}
                              onLoad={() => handleImageLoad(imageUrl)}
                              onClick={(e) => {
                                e.stopPropagation();
                                openGallery(idx + 1);
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              }

              // 6+ images: Pinterest-style masonry grid - All images visible
              return (
                <>
                  {videoRender}
                  <div className="grid grid-cols-3 gap-2 auto-rows-[146px]">
                    {imageAttachments.map((attachment, index) => {
                      // Pinterest-style alternating pattern
                      let gridClass = '';
                      let heightClass = '';

                      if (index === 0) {
                        // First image: large - spans 2 rows
                        gridClass = 'col-span-2 row-span-2';
                        heightClass = 'h-full'; // Use full height of 2 rows
                      } else if (index === 1) {
                        gridClass = '';
                        heightClass = 'h-full';
                      } else if (index === 2) {
                        gridClass = '';
                        heightClass = 'h-full';
                      } else if (index === 3) {
                        gridClass = '';
                        heightClass = 'h-full';
                      } else if (index === 4) {
                        gridClass = 'col-span-2';
                        heightClass = 'h-full';
                      } else {
                        // For remaining images, alternate between single and double span
                        gridClass = index % 5 === 0 ? 'col-span-2' : '';
                        heightClass = 'h-full';
                      }

                      const imageUrl = getSafeImageURL(attachment, "small");
                      if (!imageUrl) return null;
                      const isLoaded = loadedImages.has(imageUrl);

                      return (
                        <div key={index} className={`overflow-hidden rounded-2xl relative ${gridClass}`}>

                          {!isLoaded && <ImageShimmer className="absolute inset-0 w-full h-full" />}
                          <img
                            src={imageUrl}
                            alt={`Post attachment ${index + 1}`}
                            className={`w-full ${heightClass} object-cover cursor-pointer hover:opacity-90 transition-all duration-300 ${!isLoaded ? 'opacity-0' : 'opacity-100'}`}
                            onLoad={() => handleImageLoad(imageUrl)}
                            onClick={(e) => {
                              e.stopPropagation();
                              openGallery(index);
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  {nonImageVideoAttachments.map((attachment, index) => (
                    <div key={`non-image-${index}`} className="w-full overflow-hidden mb-2 mt-2 last:mb-0">
                      <div className={`w-full h-48 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900/30' : 'bg-gray-100'
                        }`}>
                        <span className={`text-sm ${theme === 'dark' ? 'text-white/70' : 'text-gray-500'}`}>
                          {attachment.file.name}
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              );
            })()}
          </div>
        )}

        {/* Polls Section - Compact & Elegant Design */}
        {post.poll && post.poll.length > 0 && (
          <div className="px-0 py-3" style={{ minHeight: '200px' }}>
            <div className="relative">
              {isPollRefreshing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    background: theme === 'dark'
                      ? 'rgba(0, 0, 0, 0.3)'
                      : 'rgba(255, 255, 255, 0.5)'
                  }}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`px-4 py-2 rounded-full flex items-center gap-2 text-xs font-semibold shadow-lg ${theme === 'dark'
                      ? 'bg-gray-950/80 text-white border border-gray-900'
                      : 'bg-white/90 text-gray-700 border border-gray-300'
                      }`}
                  >
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Refreshing poll results...
                  </motion.div>
                </motion.div>
              )}
              <div className={`space-y-3 transition-all duration-300 ${isPollRefreshing ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                {post.poll.map((poll) => {
                  const pollKind = poll.kind || 'single';
                  const maxSelectable = poll.max_selectable || 1;
                  const selectedChoices = selectedPollChoices[poll.id] || [];
                  const hasSelectedChoices = selectedChoices.length > 0;
                  const isAtMax = selectedChoices.length >= maxSelectable;
                  const isSingleChoice = pollKind === 'single';
                  const isMultipleChoice = pollKind === 'multiple' || pollKind === 'ranked' || pollKind === 'weighted';

                  // Poll kind labels
                  const pollKindLabels = {
                    single: { label: 'Single Choice', icon: CircleCheck, color: 'blue' },
                    multiple: { label: 'Multiple Choice', icon: CheckSquare, color: 'purple' },
                    ranked: { label: 'Ranked', icon: ListOrdered, color: 'orange' },
                    weighted: { label: 'Weighted', icon: Scale, color: 'green' }
                  };

                  const kindInfo = pollKindLabels[pollKind] || pollKindLabels.single;
                  const KindIcon = kindInfo.icon;

                  return (
                    <motion.div
                      key={poll.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, layout: { duration: 0.3 } }}
                      className={`overflow-hidden ${theme === 'dark'
                        ? 'bg-gray-900/30 border-t border-b border-gray-900'
                        : 'bg-white border-t border-b border-gray-200/50'
                        }`}
                      style={{ willChange: 'auto' }}
                    >
                      {/* Compact Poll Header */}
                      <div className={`px-3 py-2.5 border-b ${theme === 'dark' ? 'border-gray-900' : 'border-gray-200/50'
                        }`}>
                        <div className="flex items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${theme === 'dark'
                              ? 'bg-gray-900/50 border border-gray-900'
                              : 'bg-gray-100 border border-gray-200/50'
                              }`}>
                              <BarChart3 className={`w-4 h-4 ${theme === 'dark' ? 'text-white/90' : 'text-gray-700'
                                }`} />
                            </div>
                            <h4 className={`font-semibold text-sm tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>
                              {getLocalizedContent(poll.question, defaultLanguage)}                    </h4>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${kindInfo.color === 'blue'
                              ? theme === 'dark'
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : 'bg-blue-50 text-blue-600 border border-blue-200/50'
                              : kindInfo.color === 'purple'
                                ? theme === 'dark'
                                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                  : 'bg-purple-50 text-purple-600 border border-purple-200/50'
                                : kindInfo.color === 'orange'
                                  ? theme === 'dark'
                                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                    : 'bg-orange-50 text-orange-600 border border-orange-200/50'
                                  : theme === 'dark'
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    : 'bg-green-50 text-green-600 border border-green-200/50'
                              }`}>
                              <KindIcon className="w-2.5 h-2.5" />
                              {kindInfo.label}
                            </span>
                            {isMultipleChoice && (
                              <span className={`text-[10px] font-medium ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'
                                }`}>
                                Up to {maxSelectable}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Compact Poll Choices */}
                      <div className="w-full">
                        {poll.choices && Array.isArray(poll.choices) && poll.choices.length > 0 ? (() => {
                          const sortedChoices = [...poll.choices].sort((a, b) => {
                            // Sort by display_order if available, otherwise maintain original order
                            const orderA = a.display_order ?? 999;
                            const orderB = b.display_order ?? 999;
                            return orderA - orderB;
                          });

                          return sortedChoices.map((choice, choiceIndex) => {
                            const percentage = getChoicePercentage(choice.vote_count, poll);
                            const isSelected = selectedChoices.includes(choice.id);
                            const canSelect = !isAtMax || isSelected;
                            const isDisabled = !canSelect && hasSelectedChoices && !isSelected;
                            const rankPosition = isSingleChoice ? null : selectedChoices.indexOf(choice.id) + 1;
                            const isLastChoice = choiceIndex === sortedChoices.length - 1;

                            const choiceStateClasses = (() => {
                              const isPressing = pressingChoiceId === choice.id;

                              if (theme === 'dark') {
                                if (isSelected) {
                                  const base = 'bg-gray-900/50 shadow-[0_8px_26px_rgba(0,0,0,0.3)] cursor-pointer hover:bg-gray-900/70 hover:shadow-[0_10px_28px_rgba(0,0,0,0.4)]';
                                  return isPressing ? `${base} bg-gray-900/70 shadow-[0_12px_32px_rgba(0,0,0,0.5)]` : base;
                                }
                                if (isDisabled) {
                                  return 'bg-gray-900/20 opacity-45 cursor-not-allowed';
                                }
                                const base = 'bg-gray-900/30 hover:bg-gray-900/50 hover:shadow-[0_6px_18px_rgba(0,0,0,0.2)] cursor-pointer transition-all duration-200';
                                return isPressing ? `${base} bg-gray-900/50 shadow-[0_10px_26px_rgba(0,0,0,0.3)]` : base;
                              }

                              if (isSelected) {
                                const base = 'bg-gray-100 shadow-sm cursor-pointer hover:bg-gray-50 hover:shadow-md';
                                return isPressing ? `${base} bg-gray-200 shadow-lg` : base;
                              }
                              if (isDisabled) {
                                return 'bg-gray-50 opacity-45 cursor-not-allowed';
                              }
                              const base = 'bg-white hover:bg-gray-50 hover:shadow-[0_8px_22px_rgba(15,23,42,0.08)] cursor-pointer transition-all duration-200';
                              return isPressing ? `${base} bg-gray-100 shadow-md` : base;
                            })();

                            // Dotted border-bottom classes - zarif ve profesyonel
                            const borderBottomClass = isLastChoice
                              ? ''
                              : theme === 'dark'
                                ? 'border-b border-dotted border-gray-900'
                                : 'border-b border-dotted border-gray-200/60';

                            return (
                              <motion.div
                                key={choice.id}
                                data-no-post-click="true"
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: choiceIndex * 0.03, duration: 0.2 }}
                                className={`relative px-4 py-3.5 transition-all duration-200 ${choiceStateClasses} ${borderBottomClass}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isDisabled) {
                                    handlePollVote(poll.id, choice.id, pollKind, maxSelectable, e);
                                  }
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                                onPointerDown={(e) => e.stopPropagation()}
                                whileTap={
                                  !isDisabled
                                    ? {
                                      scale: 0.98,
                                      opacity: 0.92,
                                      filter: theme === 'dark' ? 'brightness(1.02)' : 'brightness(0.98)',
                                    }
                                    : undefined
                                }
                                onTapStart={(e) => {
                                  e.stopPropagation();
                                  if (!isDisabled) {
                                    setPressingChoiceId(choice.id);
                                  }
                                }}
                                onTapCancel={() => setPressingChoiceId(prev => (prev === choice.id ? null : prev))}
                                onTap={() => setPressingChoiceId(null)}
                                onPointerUp={() => setPressingChoiceId(prev => (prev === choice.id ? null : prev))}
                                onPointerLeave={() => setPressingChoiceId(prev => (prev === choice.id ? null : prev))}
                              >
                                {/* Compact Selection Indicator */}
                                {isSelected && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                    className={`absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${theme === 'dark'
                                      ? 'bg-white text-black shadow-lg'
                                      : 'bg-black text-white shadow-lg'
                                      }`}
                                  >
                                    {pollKind === 'ranked' && rankPosition ? (
                                      <span className="text-xs font-bold">#{rankPosition}</span>
                                    ) : pollKind === 'weighted' ? (
                                      <Scale className="w-3 h-3" />
                                    ) : (
                                      <CircleCheck className="w-3 h-3" />
                                    )}
                                  </motion.div>
                                )}

                                {/* Choice Label with Rank */}
                                <div className="flex justify-between items-center mb-2.5">
                                  <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-10">
                                    {pollKind === 'ranked' && rankPosition && (
                                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${theme === 'dark'
                                        ? 'bg-white/20 text-white border border-white/30'
                                        : 'bg-gray-900/10 text-gray-900 border border-gray-200/50'
                                        }`}>
                                        #{rankPosition}
                                      </div>
                                    )}
                                    <span className={`font-medium text-sm tracking-tight leading-relaxed ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                                      }`}>
                                      {getLocalizedContent(choice.label, defaultLanguage) || ""}
                                    </span>
                                  </div>
                                </div>

                                {/* Compact Progress Bar */}
                                <div className="relative mb-2.5" style={{ minHeight: '8px' }}>
                                  <div className={`w-full h-2 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-200/60'
                                    }`}>
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${percentage}%` }}
                                      transition={{
                                        duration: 0.8,
                                        ease: [0.4, 0, 0.2, 1],
                                        layout: { duration: 0.3 }
                                      }}
                                      className="h-full rounded-full"
                                      style={{
                                        background: getRankStyle(choiceIndex + 1).background,
                                        willChange: 'width',
                                        boxShadow: theme === 'dark'
                                          ? '0 0 8px rgba(255, 255, 255, 0.1)'
                                          : '0 0 8px rgba(0, 0, 0, 0.08)'
                                      }}
                                    />
                                  </div>
                                </div>

                                {/* Compact Vote Stats */}
                                <div className="flex items-center justify-between pt-0.5">
                                  <div className="flex items-center gap-2.5">
                                    {/* Voters Avatars */}
                                    {(() => {
                                      // Get voters from votes array if available, otherwise use voters array
                                      const voters = choice.votes && choice.votes.length > 0
                                        ? choice.votes.map(vote => ({
                                          id: vote.user_id,
                                          username: vote.user?.username || '',
                                          displayname: vote.user?.displayname || '',
                                          avatar: vote.user?.avatar
                                        }))
                                        : choice.voters?.map(voter => ({
                                          id: voter.id,
                                          username: voter.username,
                                          displayname: voter.displayname,
                                          avatar: undefined
                                        })) || [];

                                      return voters.length > 0 ? (
                                        <div className="flex items-center">
                                          {voters.slice(0, 5).map((voter, idx) => {
                                            // Get avatar URL using getSafeImageURL
                                            const avatarUrl = voter.avatar
                                              ? getSafeImageURL(voter.avatar, 'icon') || getSafeImageURL(voter.avatar, 'thumbnail') || getSafeImageURL(voter.avatar, 'small')
                                              : null;

                                            return (
                                              <div
                                                key={voter.id}
                                                className={`w-5 h-5 rounded-full border overflow-hidden flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${theme === 'dark'
                                                  ? 'border-gray-900 bg-gray-900/50 text-white ring-1 ring-gray-900'
                                                  : 'border-gray-200/50 bg-white text-gray-900 ring-1 ring-gray-200/50'
                                                  }`}
                                                style={{ marginLeft: idx === 0 ? 0 : -6 }}
                                                title={voter.displayname}
                                              >
                                                {avatarUrl ? (
                                                  <img
                                                    src={avatarUrl}
                                                    alt={voter.displayname}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                      // Fallback to initial if image fails to load
                                                      const target = e.target as HTMLImageElement;
                                                      target.style.display = 'none';
                                                      const parent = target.parentElement;
                                                      if (parent) {
                                                        parent.innerHTML = voter.displayname.charAt(0).toUpperCase();
                                                      }
                                                    }}
                                                  />
                                                ) : (
                                                  voter.displayname.charAt(0).toUpperCase()
                                                )}
                                              </div>
                                            );
                                          })}
                                          {voters.length > 5 && (
                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold ml-1 ${theme === 'dark'
                                              ? 'border-gray-900 bg-gray-900/50 text-white/80 ring-1 ring-gray-900'
                                              : 'border-gray-200/50 bg-white text-gray-600 ring-1 ring-gray-200/50'
                                              }`}>
                                              +{voters.length - 5}
                                            </div>
                                          )}
                                        </div>
                                      ) : null;
                                    })()}
                                    <span className={`text-xs font-medium ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'
                                      }`}>
                                      {choice.vote_count} vote{choice.vote_count !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                  <span className={`text-sm font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                                    }`}>
                                    {percentage}%
                                  </span>
                                </div>
                              </motion.div>
                            );
                          });
                        })() : (
                          <div className={`text-center py-4 ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>
                            <span className="text-xs font-medium">No choices available for this poll.</span>
                          </div>
                        )}
                      </div>

                      {/* Compact Selection Info */}
                      {hasSelectedChoices && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={`px-3 py-2 border-t ${theme === 'dark'
                            ? 'border-gray-900 bg-gray-900/30'
                            : 'border-gray-200/50 bg-gray-50/50'
                            }`}
                        >
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className={`text-xs font-medium ${theme === 'dark' ? 'text-white/70' : 'text-gray-600'
                              }`}>
                              {isSingleChoice ? (
                                <>Selected: <span className="font-semibold">{poll.choices?.find(c => selectedChoices.includes(c.id))?.label?.en || ''}</span></>
                              ) : (
                                <>
                                  Selected <span className="font-bold">{selectedChoices.length}</span> of <span className="font-bold">{maxSelectable}</span>
                                  {pollKind === 'ranked' && <span className="ml-1">(in order)</span>}
                                </>
                              )}
                            </span>
                            {isMultipleChoice && (
                              <motion.button
                                data-no-post-click="true"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPollChoices(prev => {
                                    const updated = { ...prev };
                                    delete updated[poll.id];
                                    return updated;
                                  });
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                                onPointerDown={(e) => e.stopPropagation()}
                                onTapStart={(e) => e.stopPropagation()}
                                className={`text-xs font-medium px-2.5 py-1 rounded-md transition-all duration-200 ${theme === 'dark'
                                  ? 'text-white/60 hover:text-white hover:bg-gray-900/50 border border-gray-900 hover:border-gray-700'
                                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 border border-gray-200/50 hover:border-gray-300'
                                  }`}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                              >
                                Clear
                              </motion.button>
                            )}
                          </div>
                        </motion.div>
                      )}

                      {/* Compact Total Votes */}
                      {getTotalVotes(poll) > 0 && (
                        <div className={`px-3 py-2 border-t text-center ${theme === 'dark'
                          ? 'border-gray-900 bg-gray-900/30 text-white/80'
                          : 'border-gray-200/50 bg-gray-50/50 text-gray-500'
                          }`}>
                          <span className={`text-xs font-medium ${theme === 'dark' ? 'text-white/50' : 'text-gray-400'
                            }`}>
                            {getTotalVotes(poll)} total vote{getTotalVotes(poll) !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Event Section */}
        {post.event && (
          <div className="px-0 py-3">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className={`w-full overflow-hidden  ${theme === 'dark'
                ? 'bg-gray-900/30 border-t border-b border-gray-900 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]'
                : 'bg-white border-t border-b border-gray-200/50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]'
                }`}
            >
              {/* Event Header */}
              <div className={`px-4 sm:px-6 py-3 sm:py-4 border-b ${theme === 'dark' ? 'border-gray-900' : 'border-gray-200/50'
                }`}>
                <div className="flex items-center justify-between gap-2 sm:gap-3">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-xl flex-shrink-0 ${theme === 'dark'
                      ? 'bg-gray-900/30 border border-gray-900 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]'
                      : 'bg-gray-100 border border-gray-200/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.08)]'
                      }`}>
                      <Calendar className={`w-4 h-4 sm:w-5 sm:h-5 ${theme === 'dark' ? 'text-white/90' : 'text-gray-900'
                        }`} />
                    </div>
                    <div className="min-w-0">
                      <h3 className={`font-semibold text-sm sm:text-base tracking-tight truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                        Event
                      </h3>
                      <p className={`text-[10px] sm:text-xs font-medium tracking-wide truncate ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'
                        }`}>
                        Plan with community
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Content */}
              <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">
                {/* Event Title */}
                <div>
                  <h4 className={`font-bold text-xl sm:text-2xl mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                    {post.event.title?.en || ''}
                  </h4>
                </div>

                {/* Event Description */}
                <div>
                  <p className={`text-base sm:text-lg leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                    {post.event.description?.en || ''}
                  </p>
                </div>

                {/* Event Type/Kind */}
                {(() => {
                  const eventKind = post.event.kind || post.event.type;
                  if (!eventKind || !appData?.event_kinds) return null;

                  const eventKindData = appData.event_kinds.find((ek: unknown) => ek.kind === eventKind);
                  const kindLabel = eventKindData
                    ? (eventKindData.name?.[defaultLanguage] || eventKindData.name?.en || eventKindData.kind)
                    : eventKind;

                  return (
                    <div className="flex items-center gap-2">
                      <Sparkles className={`w-4 h-4 ${theme === 'dark' ? 'text-white/70' : 'text-gray-600'}`} />
                      <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {kindLabel}
                      </span>
                    </div>
                  );
                })()}

                {/* Event Date & Time */}
                <div className="flex items-center gap-2">
                  <Calendar className={`w-5 h-5 ${theme === 'dark' ? 'text-white/70' : 'text-gray-600'}`} />
                  <div>
                    <div className={`text-base font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                      }`}>
                      {formatEventTime(post.event.start_time)}
                    </div>
                  </div>
                </div>

                {/* Event Location with Map Preview */}
                {post.event.location && (
                  <div className="space-y-3">
                    {/* Map Preview */}
                    <div className="relative z-0 h-64 sm:h-80 overflow-hidden rounded-xl sm:rounded-2xl">
                      <div
                        ref={eventMapRef}
                        className="w-full h-full relative"
                        style={{
                          minHeight: '256px',
                          height: '256px',
                          width: '100%'
                        }}
                      />

                      {/* Apple-Style Location Info Card */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 z-1"
                      >
                        <div className={`rounded-xl sm:rounded-2xl backdrop-blur-2xl border ${theme === 'dark'
                          ? 'bg-gray-950/90 border-gray-900 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]'
                          : 'bg-white/90 border-gray-200/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)]'
                          }`}>
                          <div className="p-3 sm:p-4">
                            <div className="flex items-center gap-3 sm:gap-4">
                              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-xl flex-shrink-0 ${theme === 'dark'
                                ? 'bg-gray-900/50 border border-gray-900'
                                : 'bg-gray-100 border border-gray-200/50'
                                }`}>
                                <MapPin className={`w-5 h-5 sm:w-6 sm:h-6 ${theme === 'dark' ? 'text-white/90' : 'text-gray-900'
                                  }`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`font-semibold text-sm sm:text-base tracking-tight truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                                  }`}>
                                  {(() => {
                                    const parts = post.event.location.address.split(',');
                                    const city = parts[parts.length - 3]?.trim() || parts[0]?.trim();
                                    const country = parts[parts.length - 1]?.trim();
                                    return city && country ? `${city}, ${country}` : post.event.location.address.split(',')[0];
                                  })()}
                                </p>
                                <p className={`text-xs sm:text-sm mt-0.5 sm:mt-1 font-medium tracking-wide truncate ${theme === 'dark' ? 'text-white/70' : 'text-gray-500'
                                  }`}>
                                  {(() => {
                                    const parts = post.event.location.address.split(',');
                                    return parts.slice(0, -2).join(', ').trim() || 'Exact location';
                                  })()}
                                </p>
                              </div>
                            </div>
                            {/* Open with Google Maps Button */}
                            <motion.button
                              data-no-post-click="true"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!post.event?.location) return;
                                const lat = post.event.location.latitude || post.event.location.location_point?.lat;
                                const lng = post.event.location.longitude || post.event.location.location_point?.lng;
                                if (lat && lng) {
                                  const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
                                  window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
                                }
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                              onPointerDown={(e) => e.stopPropagation()}
                              onTapStart={(e) => e.stopPropagation()}
                              className={`w-full mt-3 flex items-center justify-center gap-2 px-3 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${theme === 'dark'
                                ? 'bg-gray-900/50 border border-gray-700 text-white hover:bg-gray-900/70 active:bg-gray-900/70'
                                : 'bg-gray-100 border border-gray-200/50 text-gray-900 hover:bg-gray-200 active:bg-gray-200'
                                }`}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              <span>Open with Google Maps</span>
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                )}

                {/* Event Capacity */}
                {post.event.capacity && (
                  <div className="flex items-center gap-2">
                    <Users className={`w-5 h-5 ${theme === 'dark' ? 'text-white/70' : 'text-gray-600'}`} />
                    <span className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Capacity: <span className="font-semibold">{post.event.capacity}</span> attendees
                    </span>
                  </div>
                )}

                {/* Online Event */}
                {post.event.is_online && (
                  <div className="flex items-center gap-2">
                    <Globe className={`w-5 h-5 ${theme === 'dark' ? 'text-white/70' : 'text-gray-600'}`} />
                    <div className="flex-1">
                      <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Online Event
                      </span>
                      {post.event.online_url && (
                        <a
                          href={post.event.online_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`block text-sm mt-1 text-blue-500 hover:underline ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {post.event.online_url}
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Paid Event */}
                {post.event.is_paid && (
                  <div className="flex items-center gap-2">
                    <HandCoins className={`w-5 h-5 ${theme === 'dark' ? 'text-white/70' : 'text-gray-600'}`} />
                    <span className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Paid Event: <span className="font-semibold">
                        {post.event.price !== undefined && post.event.price !== null
                          ? `${post.event.price} ${post.event.currency || 'USD'}`
                          : 'Price TBD'}
                      </span>
                    </span>
                  </div>
                )}

                {/* Event Attendance Buttons */}
                <div className="flex items-center gap-2 mt-4" data-no-post-click="true" onClick={(e) => e.stopPropagation()}>
                  <button
                    data-no-post-click="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEventStatus(eventStatus === 'going' ? null : 'going');
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    className={`px-4 py-2 rounded-full transition-colors duration-200 ${eventStatus === 'going'
                      ? theme === 'dark'
                        ? 'bg-white text-black'
                        : 'bg-black text-white'
                      : theme === 'dark'
                        ? 'border border-gray-700 text-white/90 hover:bg-gray-900/50'
                        : 'border border-gray-300/60 hover:bg-gray-50'
                      }`}
                  >
                    Going
                  </button>
                  <button
                    data-no-post-click="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEventStatus(eventStatus === 'not_going' ? null : 'not_going');
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    className={`px-4 py-2 rounded-full transition-colors duration-200 ${eventStatus === 'not_going'
                      ? theme === 'dark'
                        ? 'bg-white text-black'
                        : 'bg-black text-white'
                      : theme === 'dark'
                        ? 'border border-gray-700 text-white/90 hover:bg-gray-900/50'
                        : 'border border-gray-300/60 hover:bg-gray-50'
                      }`}
                  >
                    Not Going
                  </button>
                  <button
                    data-no-post-click="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEventStatus(eventStatus === 'maybe' ? null : 'maybe');
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    className={`px-4 py-2 rounded-full transition-colors duration-200 ${eventStatus === 'maybe'
                      ? theme === 'dark'
                        ? 'bg-white text-black'
                        : 'bg-black text-white'
                      : theme === 'dark'
                        ? 'border border-gray-700 text-white/90 hover:bg-gray-900/50'
                        : 'border border-gray-300/60 hover:bg-gray-50'
                      }`}
                  >
                    Maybe
                  </button>
                </div>

                {/* Attendees */}
                {post.event.attendees && post.event.attendees.length > 0 && (
                  <div className="mt-4">
                    <div className={`text-sm mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                      Attendees ({post.event.attendees.length})
                    </div>
                    <div className="flex items-center -space-x-2">
                      {post.event.attendees.slice(0, 10).map((attendee, idx) => (
                        <div
                          key={attendee.id}
                          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${attendee.status === 'going'
                            ? theme === 'dark' ? 'border-gray-900 bg-gray-900/50 text-white' : 'border-gray-900 bg-gray-100 text-gray-900'
                            : attendee.status === 'not_going'
                              ? theme === 'dark' ? 'border-gray-700 bg-gray-900/30 text-white/60' : 'border-gray-400 bg-gray-200 text-gray-600'
                              : theme === 'dark' ? 'border-gray-700 bg-gray-900/30 text-white/80' : 'border-gray-500 bg-gray-300 text-gray-700'
                            }`}
                          style={{ zIndex: 10 - idx }}
                          title={`${attendee.displayname} (${attendee.status === 'going' ? 'Going' : attendee.status === 'not_going' ? 'Not Going' : 'Maybe'})`}
                        >
                          {attendee.displayname.charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {post.event.attendees.length > 10 && (
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${theme === 'dark' ? 'border-gray-900 bg-gray-900/50 text-white/80' : 'border-gray-300 bg-gray-100 text-gray-600'
                          }`}>
                          +{post.event.attendees.length - 10}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Check-In Section */}
        {(post.type === 'checkin' || post.post_kind === 'checkin') && post.extras?.tags && post.extras.tags.length > 0 && (
          <div className="px-4 py-3">
            <div className={`px-4 py-3 rounded-2xl flex flex-wrap gap-2 ${theme === 'dark' ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-gray-50 border border-black/[0.06]'}`}>
              {post.extras.tags.map((t: string) => {
                const tagType = appData?.checkin_tag_types?.find((ct: unknown) => ct.tag === t);
                if (!tagType) {
                  return (
                    <div
                      key={t}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${theme === 'dark' ? 'bg-white/10 text-white' : 'bg-black/10 text-gray-800'}`}
                    >
                      <span className="text-xs font-bold">{t}</span>
                    </div>
                  );
                }
                const Icon = resolveTagIcon(tagType.icon);
                return (
                  <div
                    key={t}
                    style={tagNameToColor(tagType.tag)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white`}
                  >
                    <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                    <span className="text-xs font-bold">{getLocalizedContent(tagType.name, defaultLanguage)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Location Section */}
        {post.location && !post.event && (
          <div className="px-4 py-3">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="mb-4 sm:mb-8"
            >
              <div className={`rounded-2xl sm:rounded-3xl overflow-hidden backdrop-blur-xl ${theme === 'dark'
                ? 'bg-gray-900/30 border border-gray-900 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]'
                : 'bg-white border border-gray-200/50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]'
                }`}>
                {/* Map Preview */}
                <div className="relative h-96 overflow-hidden">
                  <div
                    ref={mapRef}
                    className="w-full h-full relative"
                    style={{
                      zIndex: 1,
                      minHeight: '192px',
                      height: '192px',
                      width: '100%'
                    }}
                  />

                  {/* Apple-Style Location Info Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 z-1"
                  >
                    <div className={`rounded-xl sm:rounded-2xl backdrop-blur-2xl border ${theme === 'dark'
                      ? 'bg-gray-950/90 border-gray-900 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]'
                      : 'bg-white/90 border-gray-200/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)]'
                      }`}>
                      <div className="p-3 sm:p-4">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-xl flex-shrink-0 ${theme === 'dark'
                            ? 'bg-gray-900/50 border border-gray-900'
                            : 'bg-gray-100 border border-gray-200/50'
                            }`}>
                            <MapPin className={`w-5 h-5 sm:w-6 sm:h-6 ${theme === 'dark' ? 'text-white/90' : 'text-gray-900'
                              }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold text-sm sm:text-base tracking-tight truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>
                              {(() => {
                                const parts = post.location.address.split(',');
                                const city = parts[parts.length - 3]?.trim() || parts[0]?.trim();
                                const country = parts[parts.length - 1]?.trim();
                                return city && country ? `${city}, ${country}` : post.location.address.split(',')[0];
                              })()}
                            </p>
                            <p className={`text-xs sm:text-sm mt-0.5 sm:mt-1 font-medium tracking-wide truncate ${theme === 'dark' ? 'text-white/70' : 'text-gray-500'
                              }`}>
                              {(() => {
                                const parts = post.location.address.split(',');
                                return parts.slice(0, -2).join(', ').trim() || 'Exact location';
                              })()}
                            </p>
                          </div>
                        </div>
                        {/* Open with Google Maps Button */}
                        <motion.button
                          data-no-post-click="true"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!post.location) return;
                            const lat = post.location.latitude || post.location.location_point?.lat;
                            const lng = post.location.longitude || post.location.location_point?.lng;
                            if (lat && lng) {
                              const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
                              window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
                            }
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                          onTapStart={(e) => e.stopPropagation()}
                          className={`w-full mt-3 flex items-center justify-center gap-2 px-3 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${theme === 'dark'
                            ? 'bg-gray-900/50 border border-gray-700 text-white hover:bg-gray-900/70 active:bg-gray-900/70'
                            : 'bg-gray-100 border border-gray-200/50 text-gray-900 hover:bg-gray-200 active:bg-gray-200'
                            }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span>Open with Google Maps</span>
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Engagement Bar */}
        <div
          className="px-4 py-2 flex items-center justify-between"
          data-no-post-click="true"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center space-x-2 -ml-2">
            <motion.button
              data-no-post-click="true"
              onClick={(e) => {
                e.stopPropagation();
                handleLike(e);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onTapStart={(e) => e.stopPropagation()}
              disabled={isLiking}
              whileTap={{ scale: 0.9 }}
              className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-colors duration-200 ${isLiked
                ? theme === 'dark' ? 'text-pink-500 hover:bg-pink-500/10' : 'text-pink-500 hover:bg-pink-500/10'
                : theme === 'dark' ? 'text-gray-400 hover:text-pink-500 hover:bg-pink-500/10' : 'text-gray-500 hover:text-pink-500 hover:bg-pink-500/10'
                } ${isLiking ? 'opacity-50 cursor-wait' : ''}`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              <span className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                {post.engagements?.counts?.like_received_count || 0}
              </span>
            </motion.button>
            <motion.button
              data-no-post-click="true"
              onClick={(e) => {
                e.stopPropagation();
                handleDislike(e);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onTapStart={(e) => e.stopPropagation()}
              disabled={isDisliking}
              whileTap={{ scale: 0.9 }}
              className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-colors duration-200 ${isDisliked
                ? theme === 'dark' ? 'text-purple-500 hover:bg-purple-500/10' : 'text-purple-500 hover:bg-purple-500/10'
                : theme === 'dark' ? 'text-gray-400 hover:text-purple-500 hover:bg-purple-500/10' : 'text-gray-500 hover:text-purple-500 hover:bg-purple-500/10'
                } ${isDisliking ? 'opacity-50 cursor-wait' : ''}`}
            >
              <HeartOff className={`w-5 h-5 ${isDisliked ? 'fill-current' : ''}`} />
              <span className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                {post.engagements?.counts?.dislike_received_count || 0}
              </span>
            </motion.button>
            <motion.button
              data-no-post-click="true"
              onClick={(e) => {
                e.stopPropagation();
                handleBanana(e);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onTapStart={(e) => e.stopPropagation()}
              disabled={isBananaing}
              whileTap={{ scale: 0.9 }}
              className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-colors duration-200 ${isBanana
                ? theme === 'dark' ? 'text-yellow-500 hover:bg-yellow-500/10' : 'text-yellow-600 hover:bg-yellow-500/10'
                : theme === 'dark' ? 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-500/10' : 'text-gray-500 hover:text-yellow-500 hover:bg-yellow-500/10'
                } ${isBananaing ? 'opacity-50 cursor-wait' : ''}`}
            >
              <Banana className={`w-5 h-5 ${isBanana ? 'fill-current' : ''}`} />
              <span className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                {post.engagements?.counts?.banana_count || post.engagements?.counts?.banana_received_count || 0}
              </span>
            </motion.button>
            <motion.button
              data-no-post-click="true"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setShowReply(!showReply);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onTapStart={(e) => e.stopPropagation()}
              whileTap={{ scale: 0.9 }}
              className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-colors duration-200 ${theme === 'dark' ? 'text-gray-400 hover:text-blue-500 hover:bg-blue-500/10' : 'text-gray-500 hover:text-blue-500 hover:bg-blue-500/10'
                }`}
            >
              <MessageCircle className="w-5 h-5" />
              <span className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                {post.engagements?.counts?.comment_count || 0}
              </span>
            </motion.button>
            <div
              data-no-post-click="true"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <TipButton
                recipientId={post.public_id}
                recipientName={post.author.displayname}
                recipientAvatar={authorAvatarUrl || undefined}
                recipientUsername={post.author.username}
                onTipSuccess={handleTipSuccess}
                trigger={
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                    }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                    }}
                    onTapStart={(e) => e.stopPropagation()}
                    whileTap={{ scale: 0.9 }}
                    className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-colors duration-200 ${hasTipped
                      ? theme === 'dark'
                        ? 'text-red-400 hover:bg-red-500/10'
                        : 'text-red-500 hover:bg-red-500/10'
                      : theme === 'dark'
                        ? 'text-gray-400 hover:text-red-500 hover:bg-red-500/10'
                        : 'text-gray-500 hover:text-red-500 hover:bg-red-500/10'
                      }`}
                  >
                    <HandCoins className={`w-5 h-5 ${hasTipped ? 'fill-current' : ''}`} />
                    <span
                      className={`text-[11px] mt-0.5 font-medium ${hasTipped
                        ? theme === 'dark'
                          ? 'text-red-200'
                          : 'text-red-700'
                        : theme === 'dark'
                          ? 'text-gray-300'
                          : 'text-gray-700'
                        }`}
                    >
                      {tipCountDisplay > 0 || tipAmountDisplay > 0
                        ? `$${tipAmountDisplay.toFixed(2)}`
                        : 'Tip'}
                    </span>
                  </motion.button>
                }
              />
            </div>
          </div>
          <motion.button
            data-no-post-click="true"
            onClick={(e) => {
              e.stopPropagation();
              handleBookmark(e);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onTapStart={(e) => e.stopPropagation()}
            disabled={isBookmarking}
            whileTap={{ scale: 0.9 }}
            className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-colors duration-200 ${isBookmarked
              ? theme === 'dark' ? 'text-yellow-500 hover:bg-yellow-500/10' : 'text-yellow-600 hover:bg-yellow-500/10'
              : theme === 'dark' ? 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-500/10' : 'text-gray-500 hover:text-yellow-500 hover:bg-yellow-500/10'
              } ${isBookmarking ? 'opacity-50 cursor-wait' : ''}`}
          >
            <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
            <span className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              {post.engagements?.counts?.bookmark_count || 0}
            </span>
          </motion.button>
        </div>

      </motion.div>

      {/* PostReply Component - Outside main post div */}
      {showReply && (
        <PostReply
          isOpen={true}
          onClose={() => setShowReply(false)}
          parentPostId={`${post.public_id}`}
          onReply={async (content, parentPostId) => {
            console.log('Reply posted:', content, 'Parent ID:', parentPostId);
            setShowReply(false);

            // Always fetch the updated post to get the new comment
            if (post.public_id) {
              try {
                const updatedPost = await api.fetchPost(post.public_id);

                // Update local state with new post data (includes new comment)
                setPost(updatedPost);

                // Update children state if new children are present
                if (updatedPost.children && updatedPost.children.length > 0) {
                  setChildren(updatedPost.children);
                } else if (updatedPost.children) {
                  // Even if empty, update to reflect current state
                  setChildren([]);
                }

                // Update parent component with new post data
                if (onUpdatePost) {
                  onUpdatePost(updatedPost);
                }

                // Also refresh parent if callback exists (for list views)
                if (onRefreshParent) {
                  onRefreshParent();
                }
              } catch (error) {
                console.error('Error refreshing post after reply:', error);
                // Even on error, try to refresh parent if callback exists
                if (onRefreshParent) {
                  onRefreshParent();
                }
              }
            } else if (onRefreshParent) {
              // Fallback: if no post ID, just refresh parent
              onRefreshParent();
            }
          }}
        />
      )}

      {/* Children (Replies) Section - Outside main post div */}
      {(loadChildren || showChildren) && (
        <div className={`overflow-hidden  ${theme === 'dark'
          ? 'bg-gray-950  border-gray-900'
          : 'bg-white border-gray-200/50'
          }`}>
          <div className="px-4 py-0">
            {loadingChildren ? (
              <div className={`text-center py-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Loading replies...
              </div>
            ) : (children.length > 0 || (post.children && post.children.length > 0)) ? (
              <div className="space-y-4">
                <div className={`pt-4 text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Replies ({children.length || post.children?.length || 0})
                </div>
                <div className="-mx-4">
                  {(children.length > 0 ? children : post.children || []).map((child) => (
                    <Post
                      key={child.id}
                      post={child}
                      onPostClick={onPostClick}
                      onProfileClick={onProfileClick}
                      showChildren={true}
                      loadChildren={false}
                      onRefreshParent={() => {
                        // Refresh parent post to update children list
                        if (onRefreshParent) {
                          onRefreshParent();
                        } else if (post.public_id) {
                          // Fallback: refresh this post if no parent callback
                          api.fetchPost(post.public_id)
                            .then((response) => {
                              if (response.children) {
                                setChildren(response.children);
                              }
                              setPost(response);
                              if (onUpdatePost) {
                                onUpdatePost(response);
                              }
                            })
                            .catch((error) => {
                              console.error('Error refreshing parent post:', error);
                            });
                        }
                      }}
                      onUpdatePost={(updatedChild) => {
                        // Update child post in children list
                        setChildren(prev => prev.map(c => c.id === updatedChild.id ? updatedChild : c));
                        // Also update parent post
                        if (onUpdatePost) {
                          onUpdatePost(post);
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Image Gallery Modal */}
      {isGalleryOpen && imageAttachments.length > 0 && (() => {

        const currentImage = getSafeImageURL(imageAttachments[selectedImageIndex], "large");
        if (!currentImage) return null;

        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              backgroundImage: theme === "dark" ? 'radial-gradient(transparent 1px, #000000 1px)' : 'radial-gradient(transparent 1px, #000000 1px)',

              backdropFilter: `blur(3px)`,
              backgroundColor: 'transparent',

              backgroundSize: '2px 3px',
              transform: "none",
              maskImage: 'linear-gradient(#ffffff calc(100% - 20px), transparent)',
              WebkitMaskImage: 'linear-gradient(#ffffff calc(100% - 20px), transparent)', // Safari için
            }}


            className={`fixed inset-0 z-50 flex items-center justify-center `}
            onClick={closeGallery}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Top Bar - Close Button and Image Counter - Absolute positioned */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-3 sm:p-4 md:p-6 z-[60]">
              <div className="flex-1" />
              {/* Image Counter - Prominent Display - Optimized for mobile */}
              {imageAttachments.length > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`px-3 py-1.5 sm:px-5 sm:py-2 md:px-6 md:py-3 rounded-full backdrop-blur-xl border ${theme === 'dark'
                    ? 'bg-gray-950/80 border-gray-900 text-white'
                    : 'bg-white/40 border-gray-300/50 text-gray-900'
                    }`}
                >
                  <span className="text-sm sm:text-base font-semibold tracking-wide">
                    {selectedImageIndex + 1} / {imageAttachments.length}
                  </span>
                </motion.div>
              )}
              <div className="flex-1 flex justify-end">
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeGallery();
                  }}
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  className={`p-2 sm:p-2.5 md:p-3 rounded-full backdrop-blur-xl border transition-all ${theme === 'dark'
                    ? 'bg-gray-950/80 hover:bg-gray-900/90 border-gray-900 text-white'
                    : 'bg-white/40 hover:bg-white/50 border-gray-300/50 text-gray-900'
                    }`}
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </motion.button>
              </div>
            </div>

            {/* Main Image Container - Centered with equal padding on all sides - Optimized for mobile */}
            <div


              className="relative bg-transparent w-full h-full flex items-center justify-center p-3 sm:p-6 md:p-8 lg:p-12 xl:p-16"
              onClick={(e) => e.stopPropagation()}
            >



              {/* Image wrapper - Professional constraints with equal spacing - Mobile optimized */}
              <motion.div
                key={selectedImageIndex}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="relative  z-10 w-full h-full flex items-center justify-center"
              >
                {/* Responsive max constraints - Mobile first approach */}
                <div className="relative w-full h-full flex items-center justify-center" style={{
                  maxWidth: 'min(calc(100vw - 1.5rem), 1400px)',
                  maxHeight: 'min(calc(100vh - 1.5rem), 900px)'
                }}>


                  {/* Shimmer loading effect for gallery image - Facebook style */}
                  {!loadedImages.has(currentImage) && (
                    <div className="absolute inset-0 rounded-xl sm:rounded-2xl overflow-hidden z-20">
                      <ImageShimmer className="absolute inset-0 w-full h-full" />
                    </div>
                  )}

                  {/* Foreground image - Mobile optimized */}
                  <img
                    src={currentImage}
                    alt={`Gallery image ${selectedImageIndex + 1} of ${imageAttachments.length}`}
                    className={`relative max-w-full max-h-full object-cover rounded-xl sm:rounded-2xl shadow-2xl select-none transition-all duration-300 ${loadedImages.has(currentImage) ? 'opacity-100' : 'opacity-0'
                      }`}
                    style={{
                      filter: loadedImages.has(currentImage) ? 'drop-shadow(0 0 40px rgba(0,0,0,0.15))' : 'none'
                    }}
                    draggable={false}
                    onLoad={() => handleImageLoad(currentImage)}
                    onError={(e) => {
                      console.error('Image load error:', e);
                      // Mark as loaded even on error to hide shimmer
                      handleImageLoad(currentImage);
                    }}
                  />
                </div>
              </motion.div>

              {/* Navigation Buttons - Positioned on sides, outside image - Mobile optimized */}
              {imageAttachments.length > 1 && (
                <>
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      prevImage();
                    }}
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.05 }}
                    className={`absolute left-2 sm:left-4 md:left-6 lg:left-8 z-[60] p-2.5 sm:p-3 md:p-4 rounded-full backdrop-blur-xl border transition-all ${theme === 'dark'
                      ? 'bg-gray-950/80 hover:bg-gray-900/90 border-gray-900 text-white'
                      : 'bg-white/40 hover:bg-white/50 border-gray-300/50 text-gray-900'
                      }`}
                  >
                    <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                  </motion.button>
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      nextImage();
                    }}
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.05 }}
                    className={`absolute right-2 sm:right-4 md:right-6 lg:right-8 z-[60] p-2.5 sm:p-3 md:p-4 rounded-full backdrop-blur-xl border transition-all ${theme === 'dark'
                      ? 'bg-gray-950/80 hover:bg-gray-900/90 border-gray-900 text-white'
                      : 'bg-white/40 hover:bg-white/50 border-gray-300/50 text-gray-900'
                      }`}
                  >
                    <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                  </motion.button>
                </>
              )}
            </div>
          </motion.div>
        );
      })()}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={() => {
              setShowDeleteModal(false);
              setDeleteError(null);
            }}
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-md rounded-2xl shadow-2xl ${theme === 'dark'
                ? 'bg-gray-900 border border-gray-800'
                : 'bg-white border border-gray-200'
                }`}
            >
              {/* Modal Header */}
              <div className={`px-6 py-5 border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
                }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${theme === 'dark'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-red-50 text-red-600'
                    }`}>
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                      Delete Post
                    </h3>
                    <p className={`text-sm mt-0.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                      This action cannot be undone
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="px-6 py-5">
                <p className={`text-base leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                  Are you sure you want to delete this post? This action cannot be undone and the post will be permanently removed.
                </p>

                {/* Error Message */}
                {deleteError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`mt-4 px-4 py-3 rounded-xl flex items-center gap-2 ${theme === 'dark'
                      ? 'bg-red-500/20 border border-red-500/30 text-red-400'
                      : 'bg-red-50 border border-red-200 text-red-600'
                      }`}
                  >
                    <X className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-medium">{deleteError}</span>
                  </motion.div>
                )}
              </div>

              {/* Modal Footer */}
              <div className={`px-6 py-4 flex items-center gap-3 border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
                }`}>
                <motion.button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteError(null);
                  }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-semibold transition-all ${theme === 'dark'
                    ? 'bg-gray-800 text-white hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleDeletePost}
                  disabled={isDeleting}
                  whileTap={{ scale: 0.98 }}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${theme === 'dark'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                    } ${isDeleting ? 'opacity-50 cursor-wait' : ''}`}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  );
};

// Memoize Post component to prevent unnecessary re-renders
// Only re-render if post ID, user ID, or engagement counts actually change
const MemoizedPost = React.memo(Post, (prevProps, nextProps) => {
  // If post ID changed, always re-render
  if (prevProps.post.public_id !== nextProps.post.public_id) {
    return false;
  }

  // If other props changed, re-render
  if (
    prevProps.showChildren !== nextProps.showChildren ||
    prevProps.defaultShowReply !== nextProps.defaultShowReply ||
    prevProps.loadChildren !== nextProps.loadChildren
  ) {
    return false;
  }

  // Check if engagement counts changed (important for UI updates)
  const prevCounts = prevProps.post.engagements?.counts;
  const nextCounts = nextProps.post.engagements?.counts;

  if (prevCounts && nextCounts) {
    if (
      prevCounts.like_received_count !== nextCounts.like_received_count ||
      prevCounts.dislike_received_count !== nextCounts.dislike_received_count ||
      prevCounts.banana_count !== nextCounts.banana_count ||
      prevCounts.banana_received_count !== nextCounts.banana_received_count ||
      prevCounts.comment_count !== nextCounts.comment_count ||
      prevCounts.bookmark_count !== nextCounts.bookmark_count ||
      prevCounts.tip_count !== nextCounts.tip_count ||
      prevCounts.tip_amount !== nextCounts.tip_amount
    ) {
      return false;
    }
  } else if (prevCounts !== nextCounts) {
    return false;
  }

  // Check if poll vote counts changed
  if (prevProps.post.poll && nextProps.post.poll) {
    if (prevProps.post.poll.length !== nextProps.post.poll.length) {
      return false;
    }

    for (let i = 0; i < prevProps.post.poll.length; i++) {
      const prevPoll = prevProps.post.poll[i];
      const nextPoll = nextProps.post.poll[i];

      if (prevPoll.id !== nextPoll.id) {
        return false;
      }

      if (prevPoll.choices && nextPoll.choices) {
        if (prevPoll.choices.length !== nextPoll.choices.length) {
          return false;
        }

        for (let j = 0; j < prevPoll.choices.length; j++) {
          if (prevPoll.choices[j].vote_count !== nextPoll.choices[j].vote_count) {
            return false;
          }
        }
      }
    }
  } else if (prevProps.post.poll !== nextProps.post.poll) {
    return false;
  }

  // Check if children changed
  if (prevProps.post.children?.length !== nextProps.post.children?.length) {
    return false;
  }

  // If nothing important changed, skip re-render
  return true;
});

MemoizedPost.displayName = 'Post';

export default MemoizedPost;
export type { PostProps, ApiPost };
