import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Image,
  Smile,
  MapPin,
  Users,
  Globe,
  Lock,
  X,
  Video,
  BarChart3,
  Sparkles,
  Search,
  Plus,
  Minus,
  Clock,
  Navigation,
  Calendar,
  Maximize2,
  Minimize2,
  CircleCheck,
  CheckSquare,
  ListOrdered,
  Scale,
  HandCoins,
  Film,
  Youtube,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { ToolbarContext } from '../../contexts/ToolbarContext';
import { api } from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import { useTranslation } from 'react-i18next';
import type * as Leaflet from 'leaflet';
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
import ToolbarPlugin from '../editor/Lexical/plugins/ToolbarPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $generateHtmlFromNodes } from '@lexical/html';
import { $getRoot, $getSelection, $isRangeSelection, INSERT_PARAGRAPH_COMMAND } from 'lexical';
import { MentionNode } from '../editor/Lexical/nodes/MentionNode';
import NewMentionsPlugin from '../editor/Lexical/plugins/MentionsPlugin';
import ImagesPlugin, { INSERT_IMAGE_COMMAND } from '../editor/Lexical/plugins/ImagesPlugin';
import StickerPicker, { type StickerItem } from './StickerPicker';
import GifPicker, { type GifItem } from './GifPicker';
import YouTubePicker, { type YouTubeVideo } from './YouTubePicker';
import { ImageNode } from '../editor/Lexical/nodes/ImageNode';
import { YouTubeNode } from '../editor/Lexical/nodes/YouTubeNode';
import YouTubePlugin, { INSERT_YOUTUBE_COMMAND } from '../editor/Lexical/plugins/YouTubePlugin';
import EmojiPicker from './EmojiPicker';
import AutoLinkPlugin from '../editor/Lexical/plugins/AutoLinkPlugin';
import { TweetNode } from '../editor/Lexical/nodes/TweetNode';
import { MetadataNode } from '../editor/Lexical/nodes/MetadataNode';
import type { ApiPost } from './Post';

type NominatimPlace = {
  place_id: number | string;
  display_name: string;
  lat: string;
  lon: string;
};

type LocationListItem = {
  key: string;
  title: string;
  subtitle?: string;
  address: string;
  lat: number;
  lng: number;
};

type PollKind = 'single' | 'multiple' | 'ranked' | 'weighted';

type PollOptionImage = {
  file: File;
  previewUrl: string;
};

type PollDraft = {
  id: string;
  question: string;
  options: string[];
  optionImages: Array<PollOptionImage | null>;
  duration: string;
  kind: PollKind;
  maxSelectable: number;
};

type CreatePostResponse = ApiPost | {
  post?: ApiPost;
  item?: ApiPost;
  data?: ApiPost | {
    post?: ApiPost;
    item?: ApiPost;
  };
};

const resolveCreatedPost = (response: unknown): ApiPost | undefined => {
  if (!response || typeof response !== 'object') return undefined;

  const direct = response as CreatePostResponse;
  if ('public_id' in direct && 'author' in direct) return direct as ApiPost;

  if (direct.post) return direct.post;
  if (direct.item) return direct.item;

  const data = direct.data;
  if (!data || typeof data !== 'object') return undefined;
  if ('public_id' in data && 'author' in data) return data as ApiPost;

  return data.post ?? data.item;
};

// ToolbarPlugin wrapper component
const ToolbarPluginWrapper = ({ setEditorInstance }: { setEditorInstance: (editor: unknown) => void }) => {
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


interface CreatePostProps {
  title?: string;
  postTitle?: string;
  canClose?: boolean;
  onClose?: () => void;
  placeholder?: string;
  buttonText?: string;
  parentPostId?: string;
  fullScreen?: boolean;
  allowFullScreenToggle?: boolean;
  onReply?: (content: string, parentPostId?: string) => void;
  onPostCreated?: (createdPost?: ApiPost) => void;
  postKind?: string;
  extras?: Record<string, unknown>;
}

const CreatePost: React.FC<CreatePostProps> = ({
  title,
  postTitle,
  canClose = false,
  onClose,
  placeholder,
  buttonText,
  parentPostId,
  onReply,
  fullScreen = false,
  allowFullScreenToggle = true,
  onPostCreated,
  postKind,
  extras,
}) => {
  const [_postText, _setPostText] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [hasEditorContent, setHasEditorContent] = useState(false);
  const [editorInstance, setEditorInstance] = useState<unknown>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [_isExpanded, _setIsExpanded] = useState(false);
  const [audience] = useState<'public' | 'community' | 'private'>('public');
  const [polls, setPolls] = useState<PollDraft[]>([]);
  const [isPollActive, setIsPollActive] = useState(false);
  const [isEventActive, setIsEventActive] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventKind, setEventKind] = useState<string>('');
  const [eventCapacity, setEventCapacity] = useState<string>('');
  const [eventIsPaid, setEventIsPaid] = useState(false);
  const [eventPrice, setEventPrice] = useState<string>('');
  const [eventCurrency, setEventCurrency] = useState<string>('');
  const [eventIsOnline, setEventIsOnline] = useState(false);
  const [eventOnlineURL, setEventOnlineURL] = useState('');
  const [isEventKindPickerOpen, setIsEventKindPickerOpen] = useState(false);
  const [eventKindSearchQuery, setEventKindSearchQuery] = useState('');
  const eventKindPickerRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setCharCount] = useState(0);
  const [location, setLocation] = useState<{ address: string; lat: number; lng: number } | null>(null);
  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState<NominatimPlace[]>([]);
  const [isLocationSearching, setIsLocationSearching] = useState(false);
  const [locationSearchError, setLocationSearchError] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState<NominatimPlace[]>([]);
  const [isNearbyLoading, setIsNearbyLoading] = useState(false);
  const [nearbyError, setNearbyError] = useState(false);
  const [pickerPreviewCoords, setPickerPreviewCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [pickerPreviewLabel, setPickerPreviewLabel] = useState<string | null>(null);
  const [isPreviewLocating, setIsPreviewLocating] = useState(false);
  const [didRequestPreview, setDidRequestPreview] = useState(false);
  const [pollErrors, setPollErrors] = useState<Record<string, string>>({});
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isStickerPickerOpen, setIsStickerPickerOpen] = useState(false);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [isGifPickerOpen, setIsGifPickerOpen] = useState(false);
  const [isYouTubePickerOpen, setIsYouTubePickerOpen] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(fullScreen);
  const { theme } = useTheme();
  const { data: appData, defaultLanguage } = useApp();
  const _maxChars = 500;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const pollsRef = useRef<PollDraft[]>([]);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Leaflet.Map | null>(null);
  const pickerMapRef = useRef<HTMLDivElement>(null);
  const pickerMapInstanceRef = useRef<Leaflet.Map | null>(null);
  const [leaflet, setLeaflet] = useState<typeof import('leaflet') | null>(null);
  const { t } = useTranslation('common');
  const tp = (key: string, defaultValue: string, options?: Record<string, unknown>) =>
    t(`create_post.${key}`, { defaultValue, ...options });
  const resolvedTitle = title ?? tp('title', 'Create Post');
  const resolvedPlaceholder = placeholder ?? tp(
    'placeholder',
    "What's on your mind? Share your thoughts, experiences, or ask a question..."
  );
  const resolvedButtonText = buttonText ?? tp('submit', 'Post');
  const hasLocationQuery = locationQuery.trim().length >= 3;

  const locationPreview = useMemo(() => {
    if (location) {
      return { address: location.address, lat: location.lat, lng: location.lng };
    }
    if (!hasLocationQuery || locationResults.length === 0) {
      if (!pickerPreviewCoords) return null;
      return {
        address: pickerPreviewLabel ?? 'Your location',
        lat: pickerPreviewCoords.lat,
        lng: pickerPreviewCoords.lng,
      };
    }
    const [first] = locationResults;
    const lat = Number(first?.lat);
    const lng = Number(first?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !first?.display_name) {
      return null;
    }
    return {
      address: first.display_name,
      lat,
      lng,
    };
  }, [location, locationResults, hasLocationQuery, pickerPreviewCoords, pickerPreviewLabel]);

  const locationPreviewDisplay = useMemo(() => {
    if (!locationPreview) return null;
    const parts = locationPreview.address.split(',');
    const title = parts[0]?.trim() || locationPreview.address;
    const subtitle = parts.slice(1).join(',').trim();
    return { title, subtitle };
  }, [locationPreview]);

  const searchItems = useMemo<LocationListItem[]>(() => {
    return locationResults
      .map((place) => {
        const lat = Number(place.lat);
        const lng = Number(place.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        const parts = place.display_name.split(',');
        const title = parts[0]?.trim() || place.display_name;
        const subtitle = parts.slice(1).join(',').trim();
        return {
          key: `search-${place.place_id}`,
          title,
          subtitle,
          address: place.display_name,
          lat,
          lng
        } satisfies LocationListItem;
      })
      .filter(Boolean) as LocationListItem[];
  }, [locationResults]);

  const nearbyItems = useMemo<LocationListItem[]>(() => {
    return nearbyPlaces
      .map((place: any) => {
        const lat =
          place?.extras?.place?.latitude ??
          place?.location_point?.lat ??
          place?.lat ??
          place?.latitude;
        const lng =
          place?.extras?.place?.longitude ??
          place?.location_point?.lng ??
          place?.lng ??
          place?.longitude;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

        const titleFromTranslations =
          (place?.title && typeof place.title === 'object'
            ? place.title?.[defaultLanguage] || place.title?.en || place.title?.tr
            : null);
        const title =
          titleFromTranslations ||
          place?.extras?.place?.name ||
          place?.name ||
          tp('location_nearby_fallback', 'Nearby place');
        const subtitle =
          place?.extras?.place?.description ||
          [place?.location?.city, place?.location?.country].filter(Boolean).join(', ');
        const address = subtitle ? `${title}, ${subtitle}` : title;

        return {
          key: place?.public_id ? `nearby-${place.public_id}` : `nearby-${title}-${lat}-${lng}`,
          title,
          subtitle,
          address,
          lat,
          lng
        } satisfies LocationListItem;
      })
      .filter(Boolean) as LocationListItem[];
  }, [nearbyPlaces, defaultLanguage, tp]);

  const displayedPlaces = hasLocationQuery ? searchItems : nearbyItems;

  const imagePreviews = useMemo(
    () => selectedImages.map((file) => ({
      file,
      url: typeof URL !== 'undefined' ? URL.createObjectURL(file) : '',
    })),
    [selectedImages],
  );

  useEffect(() => () => {
    imagePreviews.forEach((preview) => {
      if (preview.url) URL.revokeObjectURL(preview.url);
    });
  }, [imagePreviews]);

  const videoPreviews = useMemo(
    () => selectedVideos.map((file) => ({
      file,
      url: typeof URL !== 'undefined' ? URL.createObjectURL(file) : '',
    })),
    [selectedVideos],
  );

  useEffect(() => () => {
    videoPreviews.forEach((preview) => {
      if (preview.url) URL.revokeObjectURL(preview.url);
    });
  }, [videoPreviews]);

  useEffect(() => {
    pollsRef.current = polls;
  }, [polls]);

  useEffect(() => () => {
    pollsRef.current.forEach((poll) => {
      poll.optionImages.forEach((image) => {
        if (image?.previewUrl) URL.revokeObjectURL(image.previewUrl);
      });
    });
  }, []);

  useEffect(() => {
    if (!isLocationPickerOpen) {
      setLocationQuery('');
      setLocationResults([]);
      setLocationSearchError(false);
      setIsLocationSearching(false);
      setNearbyPlaces([]);
      setNearbyError(false);
      setIsNearbyLoading(false);
      setPickerPreviewCoords(null);
      setPickerPreviewLabel(null);
      setIsPreviewLocating(false);
      setDidRequestPreview(false);
    }
  }, [isLocationPickerOpen]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    setSelectedImages(prev => [...prev, ...imageFiles]);
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const videoFiles = files.filter(file => file.type.startsWith('video/'));
    setSelectedVideos(prev => [...prev, ...videoFiles]);
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    setSelectedVideos(prev => prev.filter((_, i) => i !== index));
  };

  const handleStickerSelect = (sticker: StickerItem) => {
    if (!editorInstance) return;
    editorInstance.dispatchCommand(INSERT_IMAGE_COMMAND, {
      src: sticker.src,
      altText: sticker.label,
      width: '100%',
      showCaption: false,
      captionsEnabled: false,
      height: '100%',
    });
    editorInstance.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined);

    setIsStickerPickerOpen(false);
  };

  const handleGifSelect = (gif: GifItem) => {
    if (!editorInstance) return;
    editorInstance.dispatchCommand(INSERT_IMAGE_COMMAND, {
      src: gif.url,
      altText: gif.description || tp('gif_alt', 'GIF'),
      width: '100%',
      height: '100%',
      showCaption: false,
      captionsEnabled: false,
    });
    editorInstance.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined);
    setIsGifPickerOpen(false);
  };

  const handleYouTubeSelect = (video: YouTubeVideo) => {
    if (!editorInstance) return;
    editorInstance.dispatchCommand(INSERT_YOUTUBE_COMMAND, video.id);
    setIsYouTubePickerOpen(false);
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const handleSubmit = async () => {
    // Check if there's any content to post
    if (
      !hasEditorContent &&
      selectedImages.length === 0 &&
      selectedVideos.length === 0 &&
      polls.length === 0 &&
      !isEventActive
    ) return;

    // Validate polls
    const errors: Record<string, string> = {};
    polls.forEach((poll) => {
      // Check if question is empty
      if (!poll.question || poll.question.trim() === '') {
        errors[`poll-${poll.id}-question`] = tp('error_poll_question_required', 'Poll question is required');
      }

      // Check if at least 2 options are filled
      const filledOptions = poll.options.filter((opt, optionIndex) =>
        (opt && opt.trim() !== '') || Boolean(poll.optionImages[optionIndex])
      );
      if (filledOptions.length < 2) {
        errors[`poll-${poll.id}-options`] = tp('error_poll_options_required', 'At least 2 options are required');
      }
    });

    // Validate event if active
    if (isEventActive) {
      // Check if title is empty
      if (!eventTitle || eventTitle.trim() === '') {
        errors['event-title'] = tp('error_event_title_required', 'Event title is required');
      }

      // Check if description is empty
      if (!eventDescription || eventDescription.trim() === '') {
        errors['event-description'] = tp('error_event_description_required', 'Event description is required');
      }

      // Check if event kind is selected
      if (!eventKind || eventKind.trim() === '') {
        errors['event-kind'] = tp('error_event_kind_required', 'Event type is required');
      }

      // Check if date is provided
      if (!eventDate || eventDate.trim() === '') {
        errors['event-date'] = tp('error_event_date_required', 'Event date is required');
      }

      // Check if time is provided
      if (!eventTime || eventTime.trim() === '') {
        errors['event-time'] = tp('error_event_time_required', 'Event time is required');
      }

      // Validate date range (not in the past, not more than 2 years in the future)
      if (eventDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const maxDate = new Date(today);
        maxDate.setFullYear(maxDate.getFullYear() + 2);

        const [year, month, day] = eventDate.split('-').map(Number);
        const eventDateOnly = new Date(year, month - 1, day);
        eventDateOnly.setHours(0, 0, 0, 0);

        // Check if date is in the past
        if (eventDateOnly < today) {
          errors['event-date'] = tp('error_event_date_past', 'Event date cannot be in the past');
        }

        // Check if date is more than 2 years in the future
        if (eventDateOnly > maxDate) {
          errors['event-date'] = tp('error_event_date_future', 'Event date cannot be more than 2 years in the future');
        }
      }

      // Check if date and time are not in the past
      if (eventDate && eventTime) {
        const now = new Date();
        // Reset seconds and milliseconds for accurate comparison
        now.setSeconds(0, 0);

        const [year, month, day] = eventDate.split('-').map(Number);
        const [hours, minutes] = eventTime.split(':').map(Number);
        const eventDateTime = new Date(year, month - 1, day, hours, minutes);
        eventDateTime.setSeconds(0, 0);

        if (eventDateTime < now) {
          errors['event-datetime'] = tp('error_event_datetime_past', 'Event date and time cannot be in the past');
        }
      } else if (!eventDate && eventTime) {
        // If time is provided but date is not, it's invalid
        errors['event-date'] = tp('error_event_date_required_for_time', 'Event date is required when time is provided');
      }
    }

    // If there are validation errors, show them and stop submission
    if (Object.keys(errors).length > 0) {
      setPollErrors(errors);
      // Scroll to first error
      const firstErrorKey = Object.keys(errors)[0];
      const errorElement = document.querySelector(`[data-poll-error="${firstErrorKey}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Clear any previous errors
    setPollErrors({});
    const hasUploadMedia = selectedImages.length > 0 || selectedVideos.length > 0;
    if (hasUploadMedia) {
      setUploadProgress(0);
    } else {
      setUploadProgress(null);
    }
    setIsSubmitting(true);

    // Get HTML content, hashtags, and mentions from editor if available
    let htmlContent = '';
    let hashtags: string[] = [];
    let mentions: string[] = [];

    if (editorInstance) {
      editorInstance.getEditorState().read(() => {
        const root = $getRoot();
        htmlContent = $generateHtmlFromNodes(editorInstance, null);

        // Extract hashtags and mentions from the editor
        const extractHashtags = (node: unknown): string[] => {
          const tags: string[] = [];

          if (node.getType && node.getType() === 'hashtag') {
            const textContent = node.getTextContent();
            if (textContent && textContent.startsWith('#')) {
              tags.push(textContent);
            }
          }

          // Recursively search for hashtags in children
          if (node.getChildren) {
            for (const child of node.getChildren()) {
              tags.push(...extractHashtags(child));
            }
          }

          return tags;
        };

        const extractMentions = (node: unknown): string[] => {
          const mentions: string[] = [];

          if (node.getType && node.getType() === 'mention') {
            const mentionName = (node as unknown).__mention || node.getTextContent();
            if (mentionName) {
              mentions.push(mentionName);
            }
          }

          // Recursively search for mentions in children
          if (node.getChildren) {
            for (const child of node.getChildren()) {
              mentions.push(...extractMentions(child));
            }
          }

          return mentions;
        };

        hashtags = extractHashtags(root);
        mentions = extractMentions(root);
      });
    }

    const contentJSON = editorInstance
      ? editorInstance.getEditorState().toJSON()
      : {
        root: {
          children: [
            {
              children: [],
              direction: null,
              format: '',
              indent: 0,
              type: 'paragraph',
              version: 1,
              textFormat: 0,
              textStyle: ''
            }
          ],
          direction: null,
          format: '',
          indent: 0,
          type: 'root',
          version: 1
        }
      }
  const postData: Record<string, unknown> = {
    content: JSON.stringify(contentJSON),
    images: selectedImages,
    videos: selectedVideos,
    audience: audience,
    ...(postTitle && postTitle.trim().length > 0 ? { title: postTitle.trim() } : {}),
    ...(isEventActive ? { kind: 'event' } : postKind ? { kind: postKind } : {}),
    ...(parentPostId && { parentPostId }),
      ...(polls.length > 0 && polls.reduce((acc, poll, pollIndex) => {
        acc[`polls[${pollIndex}].question`] = poll.question;
        acc[`polls[${pollIndex}].duration`] = poll.duration;
        acc[`polls[${pollIndex}].kind`] = poll.kind;
        acc[`polls[${pollIndex}].max_selectable`] = poll.maxSelectable;
        poll.options.forEach((option, optionIndex) => {
          acc[`polls[${pollIndex}].options[${optionIndex}]`] = option;
          const image = poll.optionImages[optionIndex]?.file;
          if (image) {
            acc[`polls[${pollIndex}].option_images[${optionIndex}]`] = image;
          }
        });
        return acc;
      }, {} as Record<string, unknown>)),
    };

    if (hashtags.length > 0) {
      postData['hashtags[]'] = hashtags;
    }

    if (mentions.length > 0) {
      postData['mentions[]'] = mentions;
    }

    if (isEventActive) {
      postData['event[title]'] = eventTitle;
      postData['event[description]'] = eventDescription;
      postData['event[kind]'] = eventKind;
      postData['event[date]'] = eventDate;
      postData['event[time]'] = eventTime;
      if (eventCapacity) postData['event[capacity]'] = parseInt(eventCapacity);
      postData['event[is_paid]'] = eventIsPaid;
      if (eventPrice) postData['event[price]'] = parseFloat(eventPrice);
      if (eventCurrency) postData['event[currency]'] = eventCurrency;
      postData['event[is_online]'] = eventIsOnline;
      if (eventOnlineURL) postData['event[online_url]'] = eventOnlineURL;
    }

    if (location) {
      postData['location[address]'] = location.address;
      postData['location[lat]'] = location.lat;
      postData['location[lng]'] = location.lng;
    }

    if (extras) {
      postData.extras = extras;
    }

    let didSucceed = false;
    try {
      // Call API to create post
      console.log('Posting data:', postData);

      // Call actual API
      const createdPostResponse = await api.handleCreatePost(postData, (progressEvent) => {
        if (!hasUploadMedia) return;
        if (!progressEvent || !progressEvent.total || progressEvent.total <= 0) return;
        const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
        setUploadProgress(Math.min(100, Math.max(1, percent)));
      });
      const createdPost = resolveCreatedPost(createdPostResponse);

      didSucceed = true;

      // Call onReply callback if it's a reply
      if (onReply && parentPostId) {
        onReply(htmlContent || editorContent, parentPostId);
      }

      // Call onPostCreated callback if it's a new post (not a reply)
      if (onPostCreated && !parentPostId) {
        onPostCreated(createdPost);
      }

      // Reset form
      _setPostText('');
      setEditorContent('');
      setHasEditorContent(false);
      setSelectedImages([]);
      setSelectedVideos([]);
      setUploadProgress(null);
      _setIsExpanded(false);
      setIsPollActive(false);
      setIsEventActive(false);
      setEventTitle('');
      setEventDescription('');
      setEventKind('');
      setEventDate('');
      setEventTime('');
      setEventCapacity('');
      setEventIsPaid(false);
      setEventPrice('');
      setEventCurrency('');
      setEventIsOnline(false);
      setEventOnlineURL('');
      polls.forEach((poll) => {
        poll.optionImages.forEach((image) => {
          if (image?.previewUrl) URL.revokeObjectURL(image.previewUrl);
        });
      });
      setPolls([]);
      setPollErrors({});
      setCharCount(0);
      setLocation(null);

      // Clear editor content
      if (editorInstance) {
        editorInstance.update(() => {
          const root = $getRoot();
          root.clear();
        });
      }
    } catch (error) {
      console.error('Error creating post:', error);
      setUploadProgress(null);
    } finally {
      if (hasUploadMedia) {
        if (didSucceed) {
          setUploadProgress(100);
          setTimeout(() => setUploadProgress(null), 500);
        } else {
          setUploadProgress(null);
        }
      }
      setIsSubmitting(false);
    }
  };

  // Location functionality
  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      if (!navigator.geolocation) {
        alert(tp('error_geo_not_supported', 'Geolocation is not supported by this browser.'));
        return;
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 300000 // 5 minutes
          }
        );
      });

      const { latitude, longitude } = position.coords;

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'CreatePost-App/1.0'
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch address');
        }

        const data = await response.json();

        if (data && data.display_name) {
          setLocation({
            address: data.display_name,
            lat: latitude,
            lng: longitude
          });
          setIsLocationPickerOpen(false);
        } else {
          // Fallback with coordinates
          setLocation({
            address: tp('location_fallback', 'Location: {{lat}}, {{lng}}', { lat: latitude.toFixed(4), lng: longitude.toFixed(4) }),
            lat: latitude,
            lng: longitude
          });
          setIsLocationPickerOpen(false);
        }
      } catch (addressError) {
        console.error('Error fetching address:', addressError);
        // Fallback with coordinates
        setLocation({
          address: tp('location_fallback', 'Location: {{lat}}, {{lng}}', { lat: latitude.toFixed(4), lng: longitude.toFixed(4) }),
          lat: latitude,
          lng: longitude
        });
        setIsLocationPickerOpen(false);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      let errorMessage = tp('error_location_prefix', 'Unable to get your location. ');

      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += tp('error_location_permission', 'Please allow location access in your browser settings.');
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += tp('error_location_unavailable', 'Location information is unavailable.');
            break;
          case error.TIMEOUT:
            errorMessage += tp('error_location_timeout', 'Location request timed out.');
            break;
          default:
            errorMessage += tp('error_location_unknown', 'An unknown error occurred.');
            break;
        }
      }

      alert(errorMessage);
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleLocationPick = (address: string, lat: number, lng: number) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    setLocation({
      address,
      lat,
      lng,
    });
    setIsLocationPickerOpen(false);
    setLocationQuery('');
    setLocationResults([]);
    setNearbyPlaces([]);
    setLocationSearchError(false);
    setNearbyError(false);
  };

  useEffect(() => {
    if (!isLocationPickerOpen) return;
    const query = locationQuery.trim();

    if (query.length < 3) {
      setLocationResults([]);
      setLocationSearchError(false);
      setIsLocationSearching(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsLocationSearching(true);
      setLocationSearchError(false);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=8&q=${encodeURIComponent(query)}`,
          {
            signal: controller.signal,
            headers: {
              'Accept-Language': typeof navigator !== 'undefined' ? navigator.language : 'en'
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to search locations');
        }

        const data = await response.json();
        setLocationResults(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Error searching locations:', error);
          setLocationSearchError(true);
          setLocationResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLocationSearching(false);
        }
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [locationQuery, isLocationPickerOpen]);

  useEffect(() => {
    if (!isLocationPickerOpen || hasLocationQuery) return;
    if (!pickerPreviewCoords || isNearbyLoading) return;

    let active = true;
    const { lat, lng } = pickerPreviewCoords;

    const fetchNearby = async () => {
      setIsNearbyLoading(true);
      setNearbyError(false);
      setNearbyPlaces([]);
      try {
        const response = (await api.fetchNearbyPlaces(
          lat,
          lng,
          null,
          null,
          12
        )) as any;

        if (!active) return;

        const places = Array.isArray(response?.places) ? response.places : [];
        setNearbyPlaces(places);
      } catch (error) {
        if (active) {
          console.error('Error fetching nearby places:', error);
          setNearbyError(true);
          setNearbyPlaces([]);
        }
      } finally {
        if (active) {
          setIsNearbyLoading(false);
        }
      }
    };

    fetchNearby();

    return () => {
      active = false;
    };
  }, [isLocationPickerOpen, hasLocationQuery, pickerPreviewCoords, isNearbyLoading]);

  useEffect(() => {
    if (!location) return;
    setPickerPreviewCoords({ lat: location.lat, lng: location.lng });
    setPickerPreviewLabel(location.address);
  }, [location]);

  useEffect(() => {
    if (!isLocationPickerOpen) return;
    if (location || hasLocationQuery || locationResults.length > 0 || pickerPreviewCoords) return;
    if (isPreviewLocating || didRequestPreview) return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    setDidRequestPreview(true);
    setIsPreviewLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPickerPreviewCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setPickerPreviewLabel(tp('location_preview_current', 'Your location'));
        setIsPreviewLocating(false);
      },
      () => {
        setIsPreviewLocating(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 300000,
      }
    );
  }, [
    isLocationPickerOpen,
    location,
    hasLocationQuery,
    locationResults.length,
    pickerPreviewCoords,
    isPreviewLocating,
    didRequestPreview,
    tp
  ]);

  // Poll helper functions
  const addPoll = () => {
    const newPoll = {
      id: Date.now().toString(),
      question: '',
      options: ['', ''],
      optionImages: [null, null],
      duration: '0',
      kind: 'single' as PollKind,
      maxSelectable: 1
    };
    setPolls([...polls, newPoll]);
  };

  const removePoll = (pollId: string) => {
    const removedPoll = polls.find(poll => poll.id === pollId);
    removedPoll?.optionImages.forEach((image) => {
      if (image?.previewUrl) URL.revokeObjectURL(image.previewUrl);
    });
    setPolls(polls.filter(poll => poll.id !== pollId));
    // Clear errors for removed poll
    setPollErrors(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        if (key.includes(`poll-${pollId}-`)) {
          delete updated[key];
        }
      });
      return updated;
    });
  };

  const addPollOption = (pollId: string) => {
    setPolls(polls.map(poll =>
      poll.id === pollId
        ? { ...poll, options: [...poll.options, ''], optionImages: [...poll.optionImages, null] }
        : poll
    ));
  };

  const removePollOption = (pollId: string, optionIndex: number) => {
    const removedImage = polls.find(poll => poll.id === pollId)?.optionImages[optionIndex];
    if (removedImage?.previewUrl) URL.revokeObjectURL(removedImage.previewUrl);
    setPolls(polls.map(poll =>
      poll.id === pollId
        ? {
          ...poll,
          options: poll.options.length > 2
            ? poll.options.filter((_, i) => i !== optionIndex)
            : poll.options,
          optionImages: poll.optionImages.length > 2
            ? poll.optionImages.filter((_, i) => i !== optionIndex)
            : poll.optionImages
        }
        : poll
    ));
  };

  const updatePollOption = (pollId: string, optionIndex: number, value: string) => {
    setPolls(polls.map(poll =>
      poll.id === pollId
        ? {
          ...poll,
          options: poll.options.map((option, i) =>
            i === optionIndex ? value : option
          )
        }
        : poll
    ));
  };

  const updatePollDuration = (pollId: string, duration: string) => {
    setPolls(polls.map(poll =>
      poll.id === pollId
        ? { ...poll, duration }
        : poll
    ));
  };

  const updatePollQuestion = (pollId: string, question: string) => {
    setPolls(polls.map(poll =>
      poll.id === pollId
        ? { ...poll, question }
        : poll
    ));
  };

  const updatePollOptionImage = (pollId: string, optionIndex: number, file: File) => {
    if (!file.type.startsWith('image/')) return;

    setPolls(polls.map(poll => {
      if (poll.id !== pollId) return poll;

      const previousImage = poll.optionImages[optionIndex];
      if (previousImage?.previewUrl) URL.revokeObjectURL(previousImage.previewUrl);

      const nextImages = [...poll.optionImages];
      nextImages[optionIndex] = {
        file,
        previewUrl: URL.createObjectURL(file),
      };

      return {
        ...poll,
        optionImages: nextImages,
      };
    }));
  };

  const removePollOptionImage = (pollId: string, optionIndex: number) => {
    const removedImage = polls.find(poll => poll.id === pollId)?.optionImages[optionIndex];
    if (removedImage?.previewUrl) URL.revokeObjectURL(removedImage.previewUrl);

    setPolls(polls.map(poll => {
      if (poll.id !== pollId) return poll;
      const nextImages = [...poll.optionImages];
      nextImages[optionIndex] = null;
      return {
        ...poll,
        optionImages: nextImages,
      };
    }));
  };

  const updatePollKind = (pollId: string, kind: PollKind) => {
    setPolls(polls.map(poll =>
      poll.id === pollId
        ? { ...poll, kind, maxSelectable: kind === 'single' ? 1 : poll.maxSelectable }
        : poll
    ));
  };

  const updatePollMaxSelectable = (pollId: string, maxSelectable: number) => {
    setPolls(polls.map(poll =>
      poll.id === pollId
        ? { ...poll, maxSelectable: Math.max(1, Math.min(maxSelectable, poll.options.length || 1)) }
        : poll
    ));
  };

  // Initialize Leaflet map when location is set
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let active = true;
    import('leaflet')
      .then((mod) => {
        if (active) setLeaflet(mod);
      })
      .catch((error) => {
        console.error('Failed to load Leaflet', error);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!leaflet || !location || !mapRef.current) {
      return;
    }
    let cancelled = false;
    let rafId: number | null = null;
    let timeoutId: number | null = null;

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
        if (cancelled || !mapRef.current || !location) return;

        // Ensure container has proper dimensions
        const container = mapRef.current;
        if ((container as unknown)._leaflet_id) {
          try {
            mapInstanceRef.current?.remove();
          } catch (error) {
            console.error('Error removing existing map:', error);
          }
          delete (container as unknown)._leaflet_id;
        }
        const isMobile = window.innerWidth < 640;
        container.style.width = '100%';
        container.style.height = isMobile ? '192px' : '256px';
        container.style.position = 'relative';
        container.style.zIndex = '1';

        const map = leaflet.map(container, {
          center: [location.lat, location.lng],
          zoom: 15,
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
        leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
          errorTileUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iI2Y5ZmFmYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOWNhM2FmIiBmb250LXNpemU9IjE0cHgiPk1hcCBUaWxlPC90ZXh0Pjwvc3ZnPg=='
        }).addTo(map);

        // Add custom marker
        const customIcon = leaflet.divIcon({
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

        leaflet.marker([location.lat, location.lng], { icon: customIcon }).addTo(map);

        // Force map to invalidate size after a short delay
        setTimeout(() => {
          if (map && mapInstanceRef.current) {
            map.invalidateSize();
          }
        }, 200);
      };

      // Use requestAnimationFrame for better timing
      rafId = requestAnimationFrame(() => {
        timeoutId = window.setTimeout(initMap, 50);
      });

    } catch (error) {
      console.error('Error creating map:', error);
    }

    // Cleanup function
    return () => {
      cancelled = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (timeoutId !== null) clearTimeout(timeoutId);
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        } catch (error) {
          console.error('Error cleaning up map:', error);
        }
      }
    };
  }, [leaflet, location]);

  useEffect(() => {
    if (!leaflet || !isLocationPickerOpen || !pickerMapRef.current || !locationPreview) {
      if (pickerMapInstanceRef.current) {
        try {
          pickerMapInstanceRef.current.remove();
          pickerMapInstanceRef.current = null;
        } catch (error) {
          console.error('Error cleaning up picker map:', error);
        }
      }
      return;
    }
    let cancelled = false;
    let rafId: number | null = null;
    let timeoutId: number | null = null;

    if (pickerMapInstanceRef.current) {
      try {
        pickerMapInstanceRef.current.remove();
        pickerMapInstanceRef.current = null;
      } catch (error) {
        console.error('Error removing existing picker map:', error);
      }
    }

    const container = pickerMapRef.current;
    container.innerHTML = '';

    if ((container as unknown)._leaflet_id) {
      delete (container as unknown)._leaflet_id;
    }

    try {
      const initMap = () => {
        if (cancelled || !pickerMapRef.current || !locationPreview) return;

        const container = pickerMapRef.current;
        if ((container as unknown)._leaflet_id) {
          try {
            pickerMapInstanceRef.current?.remove();
          } catch (error) {
            console.error('Error removing existing picker map:', error);
          }
          delete (container as unknown)._leaflet_id;
        }
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.position = 'relative';
        container.style.zIndex = '1';

        const map = leaflet.map(container, {
          center: [locationPreview.lat, locationPreview.lng],
          zoom: 14,
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

        pickerMapInstanceRef.current = map;

        leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
          errorTileUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iI2Y5ZmFmYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOWNhM2FmIiBmb250LXNpemU9IjE0cHgiPk1hcCBUaWxlPC90ZXh0Pjwvc3ZnPg=='
        }).addTo(map);

        const customIcon = leaflet.divIcon({
          html: `
            <div style="
              width: 24px;
              height: 24px;
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
                width: 8px;
                height: 8px;
                background: white;
                border-radius: 50%;
              "></div>
            </div>
          `,
          className: 'custom-location-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        leaflet.marker([locationPreview.lat, locationPreview.lng], { icon: customIcon }).addTo(map);

        setTimeout(() => {
          if (map && pickerMapInstanceRef.current) {
            map.invalidateSize();
          }
        }, 200);
      };

      rafId = requestAnimationFrame(() => {
        timeoutId = window.setTimeout(initMap, 50);
      });
    } catch (error) {
      console.error('Error creating picker map:', error);
    }

    return () => {
      cancelled = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (timeoutId !== null) clearTimeout(timeoutId);
      if (pickerMapInstanceRef.current) {
        try {
          pickerMapInstanceRef.current.remove();
          pickerMapInstanceRef.current = null;
        } catch (error) {
          console.error('Error cleaning up picker map:', error);
        }
      }
    };
  }, [leaflet, isLocationPickerOpen, locationPreview?.lat, locationPreview?.lng]);

  // Close event kind picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (eventKindPickerRef.current && !eventKindPickerRef.current.contains(event.target as Node)) {
        setIsEventKindPickerOpen(false);
      }
    };

    if (isEventKindPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEventKindPickerOpen]);




  const audienceOptions = [
    { value: 'public', icon: Globe, label: tp('audience_public_label', 'Everyone'), description: tp('audience_public_desc', 'Anyone can see this post') },
    { value: 'community', icon: Users, label: tp('audience_community_label', 'Community'), description: tp('audience_community_desc', 'Only community members can see this post') },
    { value: 'private', icon: Lock, label: tp('audience_private_label', 'Private'), description: tp('audience_private_desc', 'Only you can see this post') },
  ];

  // Event Kinds from context - show all without hardcoded categories
  const eventKinds = useMemo(() => {
    if (!appData?.event_kinds || !Array.isArray(appData.event_kinds)) {
      return [];
    }

    // Process all event kinds from context, sorted by display_order
    return appData.event_kinds
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      .map((eventKind: unknown) => {
        const label = eventKind.name?.[defaultLanguage] || eventKind.name?.en || eventKind.kind;
        const desc = eventKind.description?.[defaultLanguage] || eventKind.description?.en || '';

        return {
          value: eventKind.kind,
          label: label,
          desc: desc
        };
      });
  }, [appData?.event_kinds, defaultLanguage]);




  const editorConfig = useMemo(() => ({
    namespace: "CoolVibesEditor",
    editable: true,
    isRichText: true,
    selectionAlwaysOnDisplay: true,
    listStrictIndent: false,
    measureTypingPerf: false,
    nodes: [HashtagNode, HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, AutoLinkNode, MentionNode, ImageNode, YouTubeNode, TweetNode, MetadataNode],
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
      indent: 'PlaygroundEditorTheme__indent',
      layoutContainer: 'PlaygroundEditorTheme__layoutContainer',
      layoutItem: 'PlaygroundEditorTheme__layoutItem',
      image: 'editor-image',
      hashtag: "hashtag inline-block bg-[linear-gradient(to_right,_#d04b36,_#e36511,_#ffba00,_#00b180,_#147aab,_#675997)]  bg-clip-text text-transparent  font-semibold hover:underline cursor-pointer",
      mention: "mention font-semibold  font-md inline-block bg-[linear-gradient(to_right,_#d04b36,_#e36511,_#ffba00,_#00b180,_#147aab,_#675997)]  bg-clip-text text-transparent  font-semibold hover:underline cursor-pointer"
    },
    onError(error: Error) {
      console.error("Lexical Error:", error);
    },
  }), [theme]);



  const onChange = (editorState: unknown) => {
    editorState.read(() => {
      const root = $getRoot();
      const plainText = root.getTextContent();
      const topLevelChildren = root.getChildren();

      const hasMeaningfulNode = topLevelChildren.some((child: unknown) => {
        const type = typeof child.getType === 'function' ? child.getType() : null;

        if (type && type !== 'paragraph') {
          return true;
        }

        if (typeof child.isEmpty === 'function' && !child.isEmpty()) {
          return true;
        }

        if (typeof child.getChildrenSize === 'function' && child.getChildrenSize() > 0) {
          return true;
        }

        return false;
      });

      setEditorContent(plainText);
      setHasEditorContent(hasMeaningfulNode || plainText.trim().length > 0);
      setCharCount(plainText.length);
    });
  };






  return (
    <div style={{
      zIndex: 100,
    }} className={`${isFullScreen ? "fixed left-0 right-0 bottom-0 top-[65px] md:top-0 w-full z-[999] flex flex-col overflow-hidden" : ""} ${theme === 'dark' ? "cv-card-surface-solid" : "bg-white"}`}>



      {/* Ultra-Professional Create Post Component */}
      <motion.div
        className={`w-full ${isFullScreen ? 'flex-1 flex flex-col min-h-0' : 'flex flex-col'} transition-all duration-500 `}>
        <div className={`w-full ${isFullScreen ? 'flex flex-col flex-1 min-h-0 overflow-y-auto scrollbar-hide' : ''}`}>
          {/* Compact Professional Header */}
          <div className={`${isFullScreen ? 'px-3 sm:px-6 py-2' : 'px-3 sm:px-4 py-2 sm:py-3'} border-b flex-shrink-0 ${theme === 'dark' ? 'border-white/10' : 'border-gray-200/30'
            }`}>

            <div className="flex items-center justify-between">
              {/* Left: Title Only */}
              <div className="flex items-center flex-1 min-w-0">
                <h2 className={`text-sm sm:text-base font-semibold tracking-tight truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                  {resolvedTitle}
                </h2>
              </div>

              {/* Right: Action Buttons */}
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                {/* Audience Selector - Compact */}
                <motion.button
                  className={`flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border transition-all duration-200 ${theme === 'dark'
                    ? 'bg-gray-900/50 border-gray-900 text-gray-300 hover:bg-gray-900/70 hover:text-white active:bg-gray-900/70'
                    : 'bg-gray-50/60 border-gray-200/60 text-gray-600 hover:bg-gray-100/80 hover:text-gray-800 active:bg-gray-100/80'
                    }`}
                  onClick={() => setIsExpanded(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {audienceOptions.find(opt => opt.value === audience)?.icon &&
                    React.createElement(audienceOptions.find(opt => opt.value === audience)!.icon, { className: "w-3 h-3 sm:w-3.5 sm:h-3.5" })
                  }
                  <span className="text-[10px] sm:text-xs font-medium">{audienceOptions.find(opt => opt.value === audience)?.label}</span>
                </motion.button>

                {/* Full Screen Toggle Button - Compact */}
                {allowFullScreenToggle && (
                  <motion.button
                    onClick={toggleFullScreen}
                    className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg transition-all duration-200 ${isFullScreen
                      ? theme === 'dark'
                        ? 'bg-gray-900/60 text-white border border-gray-900 active:bg-gray-900/70'
                        : 'bg-black/8 text-black border border-black/15 active:bg-black/15'
                      : theme === 'dark'
                        ? 'text-gray-400 hover:text-white hover:bg-gray-900/50 active:bg-gray-900/50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/60 active:bg-gray-100/60'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title={isFullScreen ? tp('fullscreen_exit', 'Exit full screen') : tp('fullscreen_enter', 'Enter full screen')}
                  >
                    {isFullScreen ? (
                      <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    ) : (
                      <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    )}
                  </motion.button>
                )}

                {/* Close Button - Compact */}
                {canClose && onClose && (
                  <motion.button
                    onClick={onClose}
                    className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg transition-all duration-200 ${theme === 'dark'
                      ? 'text-gray-400 hover:text-white hover:bg-gray-900/50 active:bg-gray-900/50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/60 active:bg-gray-100/60'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title={tp('close', 'Close')}
                  >
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </motion.button>
                )}
              </div>
            </div>

            {/* Main Content Area */}
            <div className={`py-2 w-full max-w-full flex-shrink-0 !z-0`}>
           
   
                    <div className="w-full max-w-full">
                      <LexicalComposer initialConfig={editorConfig}>
                        <div className="relative">
                          <HashtagPlugin />
                          <ListPlugin />
                          <LinkPlugin />
                          <AutoLinkPlugin />
                          <ImagesPlugin captionsEnabled={false} />
                          <YouTubePlugin />
                          <NewMentionsPlugin />

                          <div className="-mx-2 mt-1">
                            <ToolbarPluginWrapper setEditorInstance={setEditorInstance} />
                          </div>

                          <RichTextPlugin

                            contentEditable={
                              <ContentEditable
                                className="editor-input lexical-editor py-4 px-0"
                                style={{
                                  minHeight: isFullScreen ? '50dvh' : '140px',
                                  maxHeight: isFullScreen ? '100%' : '100%',
                                  wordWrap: 'break-word',
                                  overflowWrap: 'break-word'
                                }}
                              />
                            }
                            placeholder={
                              <div className="pt-[24px] rounded-sm z-0 p-0 editor-placeholder w-full h-full text-start flex justify-start items-start">
                                {resolvedPlaceholder}
                              </div>
                            }
                            ErrorBoundary={LexicalErrorBoundary}
                          />

                          <OnChangePlugin onChange={onChange} />
                          <AutoFocusPlugin />
                          <HistoryPlugin />
                        </div>
                      </LexicalComposer>
                    </div>
           
           
           
            </div>

            <div className={`w-full scrollbar-hide`}>
              <AnimatePresence>
                {(selectedImages.length > 0 || selectedVideos.length > 0 || location || polls.length > 0 || isEventActive || isEmojiPickerOpen || isStickerPickerOpen || isLocationPickerOpen || isGifPickerOpen || isYouTubePickerOpen) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`w-full max-w-full`}
                  >
                    {/* Apple-Level Premium Media Gallery */}
                    {(selectedImages.length > 0 || selectedVideos.length > 0) && (
                      <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="mb-4 sm:mb-8"
                      >
                        {/* Apple-Style Elegant Header with Glassmorphism */}
                        <div className="flex items-center justify-between mb-3 sm:mb-5 gap-2">
                          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-xl flex-shrink-0 ${theme === 'dark'
                              ? 'bg-gray-900/30 border border-gray-900 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]'
                              : 'bg-black/5 border border-black/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.08)]'
                              }`}>
                              <Image className={`w-4 h-4 sm:w-5 sm:h-5 ${theme === 'dark' ? 'text-white/90' : 'text-gray-900/90'
                                }`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className={`text-sm sm:text-base font-semibold tracking-tight truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>
                                {selectedImages.length + selectedVideos.length} {tp('media', 'Media')}
                              </h3>
                              <p className={`text-[10px] sm:text-xs font-medium tracking-wide truncate ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'
                                }`}>
                                {selectedImages.length > 0 && `${selectedImages.length} ${selectedImages.length > 1 ? tp('images', 'images') : tp('image', 'image')}`}
                                {selectedImages.length > 0 && selectedVideos.length > 0 && ' · '}
                                {selectedVideos.length > 0 && `${selectedVideos.length} ${selectedVideos.length > 1 ? tp('videos', 'videos') : tp('video', 'video')}`}
                              </p>
                            </div>
                          </div>
                          <motion.button
                            onClick={() => {
                              setSelectedImages([]);
                              setSelectedVideos([]);
                            }}
                            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold transition-all duration-300 backdrop-blur-xl flex-shrink-0 ${theme === 'dark'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40'
                              : 'bg-red-50 text-red-600 border border-red-200/50 hover:bg-red-100 hover:border-red-300'
                              }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {tp('clear_all', 'Clear All')}
                          </motion.button>
                        </div>

                        {/* Native Premium Collage Grid */}
                        <div className="w-full overflow-x-auto scrollbar-hide pb-2 -mb-2">
                          <div className="flex gap-3">
                            <AnimatePresence>
                              {[
                                ...selectedImages.map((file, idx) => ({ type: 'image', file, index: idx, key: `image-${file.name}-${idx}`, previewUrl: imagePreviews[idx]?.url })),
                                ...selectedVideos.map((file, idx) => ({ type: 'video', file, index: idx, key: `video-${file.name}-${idx}`, previewUrl: videoPreviews[idx]?.url }))
                              ].map((media) => (
                                <motion.div
                                  key={media.key}
                                  layout
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                  className={`relative group w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden flex-shrink-0 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}
                                >
                                  {media.type === 'image' ? (
                                    <img src={media.previewUrl} alt="Media" className="w-full h-full object-cover select-none" />
                                  ) : (
                                    <div className="relative flex items-center justify-center w-full h-full select-none">
                                      <video
                                        src={media.previewUrl}
                                        className="absolute inset-0 w-full h-full object-cover"
                                        muted
                                        playsInline
                                        preload="metadata"
                                      />
                                      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
                                      <div className="w-8 h-8 rounded-full backdrop-blur-xl bg-white/10 flex items-center justify-center z-10 border border-white/20 shadow-lg">
                                        <Video className="w-4 h-4 text-white" />
                                      </div>
                                      <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/70 to-transparent z-10 flex flex-col justify-end">
                                        <p className="text-[10px] font-semibold text-white/90 line-clamp-1">{media.file.name}</p>
                                      </div>
                                    </div>
                                  )}
                                  <motion.button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      if (media.type === 'image') removeImage(media.index);
                                      else removeVideo(media.index);
                                    }}
                                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full backdrop-blur-xl bg-black/40 hover:bg-black/60 border border-white/20 flex items-center justify-center shadow-sm transition-all duration-200 z-20"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <X className="w-3 h-3 text-white" />
                                  </motion.button>
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Apple-Level Premium Polls Section */}
                    {polls.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="mb-4 sm:mb-8"
                      >
                        <div className={`w-full overflow-visible  ${theme === 'dark'
                          ? 'cv-card-surface-solid border border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]'
                          : 'bg-white border border-gray-200/50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]'
                          }`}>
                          {/* Apple-Style Header */}
                          <div className={`px-4  sm:px-6 py-3 sm:py-4 border-b ${theme === 'dark' ? 'border-white/10' : 'border-gray-200/50'
                            }`}>
                            <div className="flex items-center justify-between gap-2 sm:gap-3">
                              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-xl flex-shrink-0 ${theme === 'dark'
                                  ? 'bg-gray-900/30 border border-gray-900 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]'
                                  : 'bg-black/5 border border-black/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.08)]'
                                  }`}>
                                  <BarChart3 className={`w-4 h-4 sm:w-5 sm:h-5 ${theme === 'dark' ? 'text-white/90' : 'text-gray-900/90'
                                    }`} />
                                </div>
                                <div className="min-w-0">
                                  <h3 className={`font-semibold text-sm sm:text-base tracking-tight truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                                    }`}>
                                    {polls.length > 1 ? tp('polls', 'Polls') : tp('poll', 'Poll')}
                                  </h3>
                                  <p className={`text-[10px] sm:text-xs font-medium tracking-wide truncate ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'
                                    }`}>
                                    {polls.length} {polls.length > 1 ? tp('questions', 'questions') : tp('question', 'question')}
                                  </p>
                                </div>
                              </div>
                              <motion.button
                                onClick={() => {
                                  setPolls([]);
                                  setPollErrors({});
                                }}
                                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl backdrop-blur-xl transition-all duration-300 flex items-center justify-center flex-shrink-0 ${theme === 'dark'
                                  ? 'bg-gray-900/50 border border-gray-900 hover:bg-gray-900/70 active:bg-gray-900/70'
                                  : 'bg-gray-100 border border-gray-200/50 hover:bg-gray-200 active:bg-gray-200'
                                  }`}
                                whileHover={{ scale: 1.08, rotate: 90 }}
                                whileTap={{ scale: 0.92 }}
                              >
                                <X className={`w-4 h-4 sm:w-5 sm:h-5 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                                  }`} />
                              </motion.button>
                            </div>
                          </div>

                          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                            {polls.map((poll, pollIndex) => (
                              <motion.div
                                key={poll.id}
                                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ delay: pollIndex * 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                className={`w-full overflow-hidden rounded-2xl sm:rounded-3xl ${theme === 'dark'
                                  ? 'cv-card-surface-solid border border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]'
                                  : 'bg-white border border-gray-200/50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]'
                                  }`}
                              >
                                {/* Apple-Style Poll Header */}
                                <div className={`px-4 sm:px-6 py-4 sm:py-5 border-b ${theme === 'dark' ? 'border-white/10' : 'border-gray-200/50'
                                  }`} data-poll-error={`poll-${poll.id}-question`}>
                                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                                    <div className="flex-1 min-w-0">
                                      <label className={`block text-xs sm:text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white/70' : 'text-gray-600'
                                        }`}>
                                        {tp('poll_question_label', 'Question')}
                                      </label>
                                      <input
                                        type="text"
                                        placeholder={tp('poll_question_placeholder', 'What would you like to ask?')}
                                        value={poll.question}
                                        onChange={(e) => {
                                          updatePollQuestion(poll.id, e.target.value);
                                          // Clear error when user starts typing
                                          if (pollErrors[`poll-${poll.id}-question`]) {
                                            setPollErrors(prev => {
                                              const updated = { ...prev };
                                              delete updated[`poll-${poll.id}-question`];
                                              return updated;
                                            });
                                          }
                                        }}
                                        className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base font-semibold tracking-tight rounded-xl sm:rounded-2xl border transition-all duration-300 focus:outline-none focus:ring-2 backdrop-blur-xl ${pollErrors[`poll-${poll.id}-question`]
                                          ? theme === 'dark'
                                            ? 'bg-red-500/10 border-red-500/50 text-white placeholder:text-white/40 focus:border-red-500 focus:ring-red-500/20'
                                            : 'bg-red-50 border-red-500/50 text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500/20'
                                          : theme === 'dark'
                                            ? 'bg-gray-900/30 border-gray-900 text-white placeholder:text-white/40 focus:border-gray-900 focus:ring-gray-900/30'
                                            : 'bg-gray-50 border-gray-200/50 text-gray-900 placeholder:text-gray-400 focus:border-gray-300 focus:ring-gray-200'
                                          }`}
                                      />
                                      {pollErrors[`poll-${poll.id}-question`] && (
                                        <p className={`text-xs mt-1.5 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                                          {pollErrors[`poll-${poll.id}-question`]}
                                        </p>
                                      )}
                                    </div>
                                    <motion.button
                                      onClick={() => removePoll(poll.id)}
                                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl backdrop-blur-xl transition-all duration-300 flex items-center justify-center flex-shrink-0 mt-7 ${theme === 'dark'
                                        ? 'bg-gray-900/50 border border-gray-900 hover:bg-gray-900/70 active:bg-gray-900/70'
                                        : 'bg-gray-100 border border-gray-200/50 hover:bg-gray-200 active:bg-gray-200'
                                        }`}
                                      whileHover={{ scale: 1.08, rotate: 90 }}
                                      whileTap={{ scale: 0.92 }}
                                    >
                                      <X className={`w-4 h-4 sm:w-5 sm:h-5 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                                        }`} />
                                    </motion.button>
                                  </div>
                                </div>

                                {/* Apple-Style Poll Options */}
                                <div className="px-4 sm:px-6 py-4 sm:py-5" data-poll-error={`poll-${poll.id}-options`}>
                                  <label className={`block text-xs sm:text-sm font-medium mb-3 ${theme === 'dark' ? 'text-white/70' : 'text-gray-600'
                                    }`}>
                                    {tp('poll_options_label', 'Options')}
                                  </label>
                                  {pollErrors[`poll-${poll.id}-options`] && (
                                    <p className={`text-xs mb-2 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                                      {pollErrors[`poll-${poll.id}-options`]}
                                    </p>
                                  )}
                                  <div className="space-y-2.5 sm:space-y-3">
                                    {poll.options.map((option, optionIndex) => (
                                      <motion.div
                                        key={optionIndex}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: optionIndex * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                        className={`rounded-2xl border p-2.5 ${theme === 'dark' ? 'border-white/10 bg-white/[0.04]' : 'border-gray-200/60 bg-white/70'}`}
                                      >
                                        <div className="flex items-center gap-2 sm:gap-3">
                                          <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-xl ${theme === 'dark'
                                            ? 'bg-gray-900/30 border border-gray-900 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]'
                                            : 'bg-gray-100 border border-gray-200/50'
                                            }`}>
                                            <span className={`text-xs sm:text-sm font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                                              }`}>
                                              {optionIndex + 1}
                                            </span>
                                          </div>
                                          <input
                                            type="text"
                                            placeholder={tp('poll_option_placeholder', 'Option {{index}}', { index: optionIndex + 1 })}
                                            value={option}
                                            onChange={(e) => {
                                              updatePollOption(poll.id, optionIndex, e.target.value);
                                              // Clear error when user starts typing
                                              if (pollErrors[`poll-${poll.id}-options`]) {
                                                const filledOptions = poll.options.map((opt, idx) =>
                                                  idx === optionIndex ? e.target.value : opt
                                                ).filter((opt, idx) => (opt && opt.trim() !== '') || Boolean(poll.optionImages[idx]));
                                                if (filledOptions.length >= 2) {
                                                  setPollErrors(prev => {
                                                    const updated = { ...prev };
                                                    delete updated[`poll-${poll.id}-options`];
                                                    return updated;
                                                  });
                                                }
                                              }
                                            }}
                                            className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl sm:rounded-2xl border transition-all duration-300 focus:outline-none focus:ring-2 backdrop-blur-xl ${pollErrors[`poll-${poll.id}-options`] && (!option || option.trim() === '') && !poll.optionImages[optionIndex]
                                              ? theme === 'dark'
                                                ? 'bg-red-500/10 border-red-500/50 text-white placeholder:text-white/40 focus:border-red-500 focus:ring-red-500/20'
                                                : 'bg-red-50 border-red-500/50 text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500/20'
                                              : theme === 'dark'
                                                ? 'bg-gray-900/30 border-gray-900 text-white placeholder-white/40 focus:border-gray-900 focus:ring-gray-900/30'
                                                : 'bg-gray-50 border-gray-200/50 text-gray-900 placeholder-gray-400 focus:border-gray-300 focus:ring-gray-200'
                                              }`}
                                          />
                                          <label
                                            className={`relative flex w-8 h-8 sm:w-9 sm:h-9 cursor-pointer items-center justify-center rounded-lg sm:rounded-xl border transition-all duration-300 flex-shrink-0 ${theme === 'dark'
                                              ? 'border-gray-900 bg-gray-900/50 text-white hover:bg-gray-900/70'
                                              : 'border-gray-200/50 bg-gray-100 text-gray-900 hover:bg-gray-200'
                                              }`}
                                            title={tp('poll_option_add_photo', 'Add photo')}
                                          >
                                            <input
                                              type="file"
                                              accept="image/*"
                                              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                              onChange={(event) => {
                                                const file = event.target.files?.[0];
                                                if (file) {
                                                  updatePollOptionImage(poll.id, optionIndex, file);
                                                  if (pollErrors[`poll-${poll.id}-options`]) {
                                                    setPollErrors(prev => {
                                                      const updated = { ...prev };
                                                      delete updated[`poll-${poll.id}-options`];
                                                      return updated;
                                                    });
                                                  }
                                                }
                                                event.currentTarget.value = '';
                                              }}
                                            />
                                            <Image className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                          </label>
                                          {poll.options.length > 2 && (
                                            <motion.button
                                              type="button"
                                              onClick={() => removePollOption(poll.id, optionIndex)}
                                              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl backdrop-blur-xl transition-all duration-300 flex items-center justify-center flex-shrink-0 ${theme === 'dark'
                                                ? 'bg-gray-900/50 border border-gray-900 hover:bg-gray-900/70 active:bg-gray-900/70'
                                                : 'bg-gray-100 border border-gray-200/50 hover:bg-gray-200 active:bg-gray-200'
                                                }`}
                                              whileHover={{ scale: 1.08, rotate: 90 }}
                                              whileTap={{ scale: 0.92 }}
                                            >
                                              <X className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                                                }`} />
                                            </motion.button>
                                          )}
                                        </div>

                                        {poll.optionImages[optionIndex] && (
                                          <div className="mt-2 flex items-center gap-2">
                                            <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-white/10">
                                              <img
                                                src={poll.optionImages[optionIndex]?.previewUrl}
                                                alt={tp('poll_option_photo_alt', 'Poll option photo')}
                                                className="h-full w-full object-cover"
                                              />
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() => removePollOptionImage(poll.id, optionIndex)}
                                              className={`rounded-full px-3 py-2 text-xs font-semibold transition-colors ${theme === 'dark'
                                                ? 'bg-white/10 text-white/70 hover:bg-white/15 hover:text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                                                }`}
                                            >
                                              {tp('poll_option_remove_photo', 'Remove photo')}
                                            </button>
                                          </div>
                                        )}
                                      </motion.div>
                                    ))}

                                    {/* Apple-Style Add Option Button */}
                                    <motion.button
                                      onClick={() => addPollOption(poll.id)}
                                      className={`w-full flex items-center justify-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border transition-all duration-300 backdrop-blur-xl mt-3 ${theme === 'dark'
                                        ? 'border-gray-900 text-white/60 hover:text-white hover:bg-gray-900/50 hover:border-gray-900 active:bg-gray-900/50'
                                        : 'border-gray-200/50 text-gray-500 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 active:bg-gray-50'
                                        }`}
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                    >
                                      <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                                      <span className="text-xs sm:text-sm font-semibold tracking-tight">{tp('poll_add_option', 'Add option')}</span>
                                    </motion.button>
                                  </div>
                                </div>

                                {/* Poll Settings - Combined Section */}
                                <div className={`px-4 sm:px-6 py-4 sm:py-5 border-t backdrop-blur-xl ${theme === 'dark' ? 'cv-card-surface-muted border-white/10' : 'border-gray-200/50 bg-gray-50/50'
                                  }`}>
                                  <div className="space-y-4 sm:space-y-5">
                                    {/* Poll Type Selection */}
                                    <div className="flex flex-col gap-2.5 sm:gap-3">
                                      <div className="flex items-center gap-2 sm:gap-3">
                                        <BarChart3 className={`w-4 h-4 sm:w-5 sm:h-5 ${theme === 'dark' ? 'text-white/70' : 'text-gray-600'
                                          }`} />
                                        <span className={`text-xs sm:text-sm font-semibold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                                          }`}>
                                          {tp('poll_type_label', 'Poll Type')}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                        {[
                                          { value: 'single', label: tp('poll_type_single', 'Single'), icon: CircleCheck, desc: tp('poll_type_single_desc', 'One choice') },
                                          { value: 'multiple', label: tp('poll_type_multiple', 'Multiple'), icon: CheckSquare, desc: tp('poll_type_multiple_desc', 'Many choices') },
                                          { value: 'ranked', label: tp('poll_type_ranked', 'Ranked'), icon: ListOrdered, desc: tp('poll_type_ranked_desc', 'Ordered') },
                                          { value: 'weighted', label: tp('poll_type_weighted', 'Weighted'), icon: Scale, desc: tp('poll_type_weighted_desc', 'Prioritized') }
                                        ].map((kind) => {
                                          const IconComponent = kind.icon;
                                          return (
                                            <motion.button
                                              key={kind.value}
                                              onClick={() => updatePollKind(poll.id, kind.value as 'single' | 'multiple' | 'ranked' | 'weighted')}
                                              className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-300 backdrop-blur-xl flex items-center gap-1.5 sm:gap-2 ${poll.kind === kind.value
                                                ? theme === 'dark'
                                                  ? 'bg-white text-black shadow-[0_8px_32px_0_rgba(255,255,255,0.2)]'
                                                  : 'bg-black text-white shadow-[0_8px_32px_0_rgba(0,0,0,0.1)]'
                                                : theme === 'dark'
                                                  ? 'bg-gray-900/30 border border-gray-900 text-white/60 hover:text-white hover:bg-gray-900/50 active:bg-gray-900/50'
                                                  : 'bg-gray-100 border border-gray-200/50 text-gray-500 hover:text-gray-900 hover:bg-gray-200 active:bg-gray-200'
                                                }`}
                                              whileHover={{ scale: 1.05 }}
                                              whileTap={{ scale: 0.95 }}
                                              title={kind.desc}
                                            >
                                              <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                                              <span>{kind.label}</span>
                                            </motion.button>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    {/* Duration Selection */}
                                    <div className="flex flex-col gap-2.5 sm:gap-3">
                                      <div className="flex items-center gap-2 sm:gap-3">
                                        <Clock className={`w-4 h-4 sm:w-5 sm:h-5 ${theme === 'dark' ? 'text-white/70' : 'text-gray-600'
                                          }`} />
                                        <span className={`text-xs sm:text-sm font-semibold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                                          }`}>
                                          {tp('poll_duration_label', 'Duration')}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                        {[
                                          { value: '0', label: '∞', desc: tp('poll_duration_infinite_desc', 'Never ends') },
                                          { value: '1', label: '1d', desc: tp('poll_duration_1d_desc', '1 day') },
                                          { value: '3', label: '3d', desc: tp('poll_duration_3d_desc', '3 days') },
                                          { value: '7', label: '1w', desc: tp('poll_duration_1w_desc', '1 week') },
                                          { value: '30', label: '1m', desc: tp('poll_duration_1m_desc', '1 month') }
                                        ].map((duration) => (
                                          <motion.button
                                            key={duration.value}
                                            onClick={() => updatePollDuration(poll.id, duration.value)}
                                            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-300 backdrop-blur-xl ${poll.duration === duration.value
                                              ? theme === 'dark'
                                                ? 'bg-white text-black shadow-[0_8px_32px_0_rgba(255,255,255,0.2)]'
                                                : 'bg-black text-white shadow-[0_8px_32px_0_rgba(0,0,0,0.1)]'
                                              : theme === 'dark'
                                                ? 'bg-gray-900/30 border border-gray-900 text-white/60 hover:text-white hover:bg-gray-900/50 active:bg-gray-900/50'
                                                : 'bg-gray-100 border border-gray-200/50 text-gray-500 hover:text-gray-900 hover:bg-gray-200 active:bg-gray-200'
                                              }`}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            title={duration.desc}
                                          >
                                            {duration.label}
                                          </motion.button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Max Selectable - Only show for multiple, ranked, or weighted */}
                                {(poll.kind === 'multiple' || poll.kind === 'ranked' || poll.kind === 'weighted') && (
                                  <div className={`px-4 sm:px-6 py-4 sm:py-5 border-t backdrop-blur-xl ${theme === 'dark' ? 'cv-card-surface-muted border-white/10' : 'border-gray-200/50 bg-gray-50/50'
                                    }`}>
                                    <div className="flex flex-col gap-3">
                                      <div className="flex items-center gap-2 sm:gap-3">
                                        <Users className={`w-4 h-4 sm:w-5 sm:h-5 ${theme === 'dark' ? 'text-white/70' : 'text-gray-600'
                                          }`} />
                                        <span className={`text-xs sm:text-sm font-semibold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                                          }`}>
                                          {tp('poll_max_selections_label', 'Max Selections')}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 sm:gap-3">
                                        {/* Decrease Button */}
                                        <motion.button
                                          onClick={() => {
                                            const current = poll.maxSelectable;
                                            if (current > 1) {
                                              updatePollMaxSelectable(poll.id, current - 1);
                                            }
                                          }}
                                          disabled={poll.maxSelectable <= 1}
                                          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl backdrop-blur-xl transition-all duration-300 flex items-center justify-center flex-shrink-0 ${poll.maxSelectable <= 1
                                            ? theme === 'dark'
                                              ? 'bg-gray-900/20 border border-gray-900 text-white/30 cursor-not-allowed'
                                              : 'bg-gray-100 border border-gray-200/50 text-gray-300 cursor-not-allowed'
                                            : theme === 'dark'
                                              ? 'bg-gray-900/50 border border-gray-900 text-white hover:bg-gray-900/70 active:bg-gray-900/70'
                                              : 'bg-gray-100 border border-gray-200/50 text-gray-900 hover:bg-gray-200 active:bg-gray-200'
                                            }`}
                                          whileHover={poll.maxSelectable > 1 ? { scale: 1.05 } : {}}
                                          whileTap={poll.maxSelectable > 1 ? { scale: 0.95 } : {}}
                                        >
                                          <Minus className={`w-4 h-4 sm:w-5 sm:h-5`} />
                                        </motion.button>

                                        {/* Value Display - Clickable Stepper */}
                                        <motion.button
                                          onClick={() => {
                                            const maxOptions = poll.options.filter(opt => opt.trim() !== '').length || 1;
                                            const nextValue = poll.maxSelectable >= maxOptions ? 1 : poll.maxSelectable + 1;
                                            updatePollMaxSelectable(poll.id, nextValue);
                                          }}
                                          className={`flex-1 min-w-[100px] sm:min-w-[120px] px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border transition-all duration-300 backdrop-blur-xl flex items-center justify-center gap-2 ${theme === 'dark'
                                            ? 'bg-gray-900/30 border-gray-900 text-white hover:bg-gray-900/50 hover:border-gray-900 active:bg-gray-900/50'
                                            : 'bg-gray-50 border-gray-200/50 text-gray-900 hover:bg-gray-100 hover:border-gray-300 active:bg-gray-100'
                                            }`}
                                          whileHover={{ scale: 1.02 }}
                                          whileTap={{ scale: 0.98 }}
                                        >
                                          <span className={`text-lg sm:text-xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                                            }`}>
                                            {poll.maxSelectable}
                                          </span>
                                          <span className={`text-xs sm:text-sm font-medium ${theme === 'dark' ? 'text-white/50' : 'text-gray-400'
                                            }`}>
                                            {tp('poll_of', 'of')} {poll.options.filter(opt => opt.trim() !== '').length || 1}
                                          </span>
                                        </motion.button>

                                        {/* Increase Button */}
                                        <motion.button
                                          onClick={() => {
                                            const maxOptions = poll.options.filter(opt => opt.trim() !== '').length || 1;
                                            const current = poll.maxSelectable;
                                            if (current < maxOptions) {
                                              updatePollMaxSelectable(poll.id, current + 1);
                                            }
                                          }}
                                          disabled={poll.maxSelectable >= (poll.options.filter(opt => opt.trim() !== '').length || 1)}
                                          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl backdrop-blur-xl transition-all duration-300 flex items-center justify-center flex-shrink-0 ${poll.maxSelectable >= (poll.options.filter(opt => opt.trim() !== '').length || 1)
                                            ? theme === 'dark'
                                              ? 'bg-gray-900/20 border border-gray-900 text-white/30 cursor-not-allowed'
                                              : 'bg-gray-100 border border-gray-200/50 text-gray-300 cursor-not-allowed'
                                            : theme === 'dark'
                                              ? 'bg-gray-900/50 border border-gray-900 text-white hover:bg-gray-900/70 active:bg-gray-900/70'
                                              : 'bg-gray-100 border border-gray-200/50 text-gray-900 hover:bg-gray-200 active:bg-gray-200'
                                            }`}
                                          whileHover={poll.maxSelectable < (poll.options.filter(opt => opt.trim() !== '').length || 1) ? { scale: 1.05 } : {}}
                                          whileTap={poll.maxSelectable < (poll.options.filter(opt => opt.trim() !== '').length || 1) ? { scale: 0.95 } : {}}
                                        >
                                          <Plus className={`w-4 h-4 sm:w-5 sm:h-5`} />
                                        </motion.button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Apple-Level Premium Location Display */}
                    {location && (
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
                          <div className="relative h-48 sm:h-64 overflow-hidden">
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
                              className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 z-10"
                            >
                              <div className={`rounded-xl sm:rounded-2xl backdrop-blur-2xl border ${theme === 'dark'
                                ? 'cv-card-surface-soft border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]'
                                : 'bg-white/90 border-gray-200/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)]'
                                }`}>
                                <div className="p-3 sm:p-4">
                                  <div className="flex items-center gap-3 sm:gap-4">
                                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-xl flex-shrink-0 ${theme === 'dark'
                                      ? 'bg-gray-900/50 border border-gray-900'
                                      : 'bg-gray-100 border border-gray-200/50'
                                      }`}>
                                      <MapPin className={`w-5 h-5 sm:w-6 sm:h-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                                        }`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className={`font-semibold text-sm sm:text-base tracking-tight truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                                        }`}>
                                        {(() => {
                                          const parts = location.address.split(',');
                                          const city = parts[parts.length - 3]?.trim() || parts[0]?.trim();
                                          const country = parts[parts.length - 1]?.trim();
                                          return city && country ? `${city}, ${country}` : location.address.split(',')[0];
                                        })()}
                                      </p>
                                      <p className={`text-xs sm:text-sm mt-0.5 sm:mt-1 font-medium tracking-wide truncate ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'
                                        }`}>
                                        {(() => {
                                          const parts = location.address.split(',');
                                          return parts.slice(0, -2).join(', ').trim() || tp('location_exact', 'Exact location');
                                        })()}
                                      </p>
                                    </div>
                                    <motion.button
                                      onClick={() => setLocation(null)}
                                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl backdrop-blur-xl transition-all duration-300 flex items-center justify-center flex-shrink-0 ${theme === 'dark'
                                        ? 'bg-gray-900/50 border border-gray-900 hover:bg-gray-900/70 active:bg-gray-900/70'
                                        : 'bg-gray-100 border border-gray-200/50 hover:bg-gray-200 active:bg-gray-200'
                                        }`}
                                      whileHover={{ scale: 1.08, rotate: 90 }}
                                      whileTap={{ scale: 0.92 }}
                                    >
                                      <X className={`w-4 h-4 sm:w-5 sm:h-5 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                                        }`} />
                                    </motion.button>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Apple-Level Premium Event Creation Section */}
                    {isEventActive && (
                      <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.98 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="mb-4 sm:mb-8"
                      >
                        <div className={`w-full overflow-visible ${theme === 'dark'
                          ? 'cv-card-surface-solid border border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]'
                          : 'bg-white border border-gray-200/50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]'
                          }`}>
                          <div className={`px-4 sm:px-6 py-3 sm:py-4 border-b ${theme === 'dark' ? 'border-white/10' : 'border-gray-200/50'
                            }`}>
                            <div className="flex items-center justify-between gap-2 sm:gap-3">
                              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-xl flex-shrink-0 ${theme === 'dark'
                                  ? 'bg-gray-900/30 border border-gray-900 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]'
                                  : 'bg-black/5 border border-black/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.08)]'
                                  }`}>
                                  <Calendar className={`w-4 h-4 sm:w-5 sm:h-5 ${theme === 'dark' ? 'text-white/90' : 'text-gray-900/90'
                                    }`} />
                                </div>
                                <div className="min-w-0">
                                  <h3 className={`font-semibold text-sm sm:text-base tracking-tight truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                                    }`}>
                                    {tp('event_title', 'Event')}
                                  </h3>
                                  <p className={`text-[10px] sm:text-xs font-medium tracking-wide truncate ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'
                                    }`}>
                                    {tp('event_subtitle', 'Plan with community')}
                                  </p>
                                </div>
                              </div>
                              <motion.button
                                onClick={() => setIsEventActive(false)}
                                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl backdrop-blur-xl transition-all duration-300 flex items-center justify-center flex-shrink-0 ${theme === 'dark'
                                  ? 'bg-gray-900/50 border border-gray-900 hover:bg-gray-900/70 active:bg-gray-900/70'
                                  : 'bg-gray-100 border border-gray-200/50 hover:bg-gray-200 active:bg-gray-200'
                                  }`}
                                whileHover={{ scale: 1.08, rotate: 90 }}
                                whileTap={{ scale: 0.92 }}
                              >
                                <X className={`w-4 h-4 sm:w-5 sm:h-5 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                                  }`} />
                              </motion.button>
                            </div>
                          </div>

                          <div className="px-4 w-full py-4 sm:py-6 space-y-3 sm:space-y-4">
                            <div>
                              <input
                                type="text"
                                placeholder={tp('event_title_placeholder', 'Event title *')}
                                value={eventTitle}
                                onChange={(e) => {
                                  setEventTitle(e.target.value);
                                  // Clear error when user starts typing
                                  if (pollErrors['event-title']) {
                                    setPollErrors(prev => {
                                      const updated = { ...prev };
                                      delete updated['event-title'];
                                      return updated;
                                    });
                                  }
                                }}
                                data-poll-error="event-title"
                                className={`w-full px-3 sm:px-4 py-3 sm:py-3.5 text-sm sm:text-base rounded-xl sm:rounded-2xl border transition-all duration-300 focus:outline-none focus:ring-2 backdrop-blur-xl ${pollErrors['event-title']
                                  ? theme === 'dark'
                                    ? 'bg-gray-900/30 border-red-500/50 text-white placeholder-white/40 focus:border-red-500 focus:ring-red-500/20'
                                    : 'bg-gray-50 border-red-500/50 text-gray-900 placeholder-gray-400 focus:border-red-500 focus:ring-red-500/20'
                                  : theme === 'dark'
                                    ? 'bg-gray-900/30 border-gray-900 text-white placeholder-white/40 focus:border-gray-900 focus:ring-gray-900/30'
                                    : 'bg-gray-50 border-gray-200/50 text-gray-900 placeholder-gray-400 focus:border-gray-300 focus:ring-gray-200'
                                  }`}
                              />
                              {pollErrors['event-title'] && (
                                <p className="mt-1.5 text-xs text-red-500">{pollErrors['event-title']}</p>
                              )}
                            </div>

                            <div>
                              <textarea
                                placeholder={tp('event_description_placeholder', 'Event description *')}
                                value={eventDescription}
                                onChange={(e) => {
                                  setEventDescription(e.target.value);
                                  // Clear error when user starts typing
                                  if (pollErrors['event-description']) {
                                    setPollErrors(prev => {
                                      const updated = { ...prev };
                                      delete updated['event-description'];
                                      return updated;
                                    });
                                  }
                                }}
                                data-poll-error="event-description"
                                rows={4}
                                className={`w-full px-3 sm:px-4 py-3 sm:py-3.5 text-sm sm:text-base rounded-xl sm:rounded-2xl border transition-all duration-300 focus:outline-none focus:ring-2 resize-none backdrop-blur-xl ${pollErrors['event-description']
                                  ? theme === 'dark'
                                    ? 'bg-gray-900/30 border-red-500/50 text-white placeholder-white/40 focus:border-red-500 focus:ring-red-500/20'
                                    : 'bg-gray-50 border-red-500/50 text-gray-900 placeholder-gray-400 focus:border-red-500 focus:ring-red-500/20'
                                  : theme === 'dark'
                                    ? 'bg-gray-900/30 border-gray-900 text-white placeholder-white/40 focus:border-gray-900 focus:ring-gray-900/30'
                                    : 'bg-gray-50 border-gray-200/50 text-gray-900 placeholder-gray-400 focus:border-gray-300 focus:ring-gray-200'
                                  }`}
                              />
                              {pollErrors['event-description'] && (
                                <p className="mt-1.5 text-xs text-red-500">{pollErrors['event-description']}</p>
                              )}
                            </div>

                            {/* Event Type Selection */}
                            <div className="w-full h-full">
                              <label className={`flex items-center gap-2 sm:gap-2.5 mb-2.5 sm:mb-3 ${theme === 'dark' ? 'text-white/80' : 'text-gray-700'
                                }`}>
                                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span className="text-xs sm:text-sm font-semibold tracking-tight">{tp('event_type_label', 'Event Type *')}</span>
                              </label>
                              <motion.button
                                type="button"
                                onClick={() => {
                                  setIsEventKindPickerOpen(!isEventKindPickerOpen);
                                  if (!isEventKindPickerOpen) {
                                    setEventKindSearchQuery('');
                                  }
                                }}
                                data-poll-error="event-kind"
                                className={`w-full px-4 sm:px-5 py-4 sm:py-4.5 text-base sm:text-lg rounded-xl sm:rounded-2xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 backdrop-blur-xl font-medium text-left flex items-center justify-between ${pollErrors['event-kind']
                                  ? theme === 'dark'
                                    ? 'bg-gray-900/30 border-red-500/60 text-white focus:border-red-500 focus:ring-red-500/30'
                                    : 'bg-gray-50 border-red-500/60 text-gray-900 focus:border-red-500 focus:ring-red-500/30'
                                  : theme === 'dark'
                                    ? 'bg-gray-900/30 border-gray-900 text-white focus:border-gray-900 focus:ring-gray-900/30 hover:border-gray-900'
                                    : 'bg-gray-50 border-gray-300/60 text-gray-900 focus:border-gray-400 focus:ring-gray-300/40 hover:border-gray-400'
                                  }`}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                              >
                                <span className={eventKind ? '' : 'opacity-60'}>
                                  {eventKind
                                    ? (() => {
                                      const found = eventKinds.find(k => k.value === eventKind);
                                      return found ? found.label : eventKind;
                                    })()
                                    : tp('event_type_select_placeholder', 'Select event type')
                                  }
                                </span>
                                <motion.div
                                  animate={{ rotate: isEventKindPickerOpen ? 180 : 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <X className={`w-5 h-5 transform ${isEventKindPickerOpen ? 'rotate-45' : ''}`} />
                                </motion.div>
                              </motion.button>
                              {pollErrors['event-kind'] && (
                                <p className="mt-2 text-xs text-red-500 font-medium">{pollErrors['event-kind']}</p>
                              )}

                              {/* Event Kind Picker - Dropdown below button */}
                              <AnimatePresence>
                                {isEventKindPickerOpen && (
                                  <motion.div
                                    ref={eventKindPickerRef}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className={`w-full h-full max-h-[50dvh] overflow-y-scroll scrollbar-hide top-full  mt-2 rounded-xl border border-2  ${theme === 'dark'
                                      ? 'cv-card-surface-solid border-white/10'
                                      : 'bg-white border-gray-200/60'
                                      }`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {/* Search Bar */}
                                    <div className={`p-3 sm:p-4 border-b ${theme === 'dark' ? 'cv-card-surface-muted border-white/10' : 'border-gray-200/50 bg-white'
                                      }`}>
                                      <div className="relative">
                                        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${theme === 'dark' ? 'text-white/50' : 'text-gray-400'
                                          }`} />
                                        <input
                                          type="text"
                                          placeholder={tp('event_type_search_placeholder', 'Search event types...')}
                                          value={eventKindSearchQuery}
                                          onChange={(e) => setEventKindSearchQuery(e.target.value)}
                                          className={`w-full pl-10 pr-4 py-2.5 rounded-lg text-sm border transition-all duration-200 focus:outline-none focus:ring-2 ${theme === 'dark'
                                            ? 'bg-gray-900 border-gray-900 text-white placeholder-white/40 focus:border-gray-900 focus:ring-gray-900/30'
                                            : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-gray-300 focus:ring-gray-200'
                                            }`}
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      </div>
                                    </div>

                                    {/* All Event Kinds - Single column, no grid */}
                                    <div className="p-2 sm:p-3">
                                      {eventKinds
                                        .filter(kind =>
                                          kind.label.toLowerCase().includes(eventKindSearchQuery.toLowerCase()) ||
                                          kind.desc.toLowerCase().includes(eventKindSearchQuery.toLowerCase()) ||
                                          kind.value.toLowerCase().includes(eventKindSearchQuery.toLowerCase())
                                        )
                                        .map((kind) => (
                                          <motion.button
                                            key={kind.value}
                                            onClick={() => {
                                              setEventKind(kind.value);
                                              setIsEventKindPickerOpen(false);
                                              setEventKindSearchQuery('');
                                              // Clear error when user selects
                                              if (pollErrors['event-kind']) {
                                                setPollErrors(prev => {
                                                  const updated = { ...prev };
                                                  delete updated['event-kind'];
                                                  return updated;
                                                });
                                              }
                                            }}
                                            className={`w-full px-3 py-2.5 rounded-lg text-sm text-left transition-all duration-200 mb-1.5 ${eventKind === kind.value
                                              ? theme === 'dark'
                                                ? 'bg-white text-black shadow-lg'
                                                : 'bg-black text-white shadow-lg'
                                              : theme === 'dark'
                                                ? 'bg-gray-900/30 hover:bg-gray-900/50 text-white/80 hover:text-white'
                                                : 'bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-900'
                                              }`}
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                          >
                                            <div className="font-semibold">{kind.label}</div>
                                            <div className={`text-xs mt-1 ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'}`}>{kind.desc}</div>
                                          </motion.button>
                                        ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            {/* Event Date/Time */}
                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                              <div>
                                <input
                                  type="date"
                                  value={eventDate}
                                  onChange={(e) => {
                                    setEventDate(e.target.value);
                                    // Clear errors when user selects
                                    if (pollErrors['event-date'] || pollErrors['event-datetime']) {
                                      setPollErrors(prev => {
                                        const updated = { ...prev };
                                        delete updated['event-date'];
                                        delete updated['event-datetime'];
                                        return updated;
                                      });
                                    }
                                  }}
                                  data-poll-error="event-date"
                                  className={`w-full px-3 sm:px-4 py-3 sm:py-3.5 text-sm sm:text-base rounded-xl sm:rounded-2xl border transition-all duration-300 focus:outline-none focus:ring-2 backdrop-blur-xl ${pollErrors['event-date'] || pollErrors['event-datetime']
                                    ? theme === 'dark'
                                      ? 'bg-gray-900/30 border-red-500/50 text-white placeholder-white/40 focus:border-red-500 focus:ring-red-500/20'
                                      : 'bg-gray-50 border-red-500/50 text-gray-900 placeholder-gray-400 focus:border-red-500 focus:ring-red-500/20'
                                    : theme === 'dark'
                                      ? 'bg-gray-900/30 border-gray-900 text-white placeholder-white/40 focus:border-gray-900 focus:ring-gray-900/30'
                                      : 'bg-gray-50 border-gray-200/50 text-gray-900 placeholder-gray-400 focus:border-gray-300 focus:ring-gray-200'
                                    }`}
                                />
                                {pollErrors['event-date'] && (
                                  <p className="mt-1.5 text-xs text-red-500">{pollErrors['event-date']}</p>
                                )}
                              </div>
                              <div>
                                <input
                                  type="time"
                                  value={eventTime}
                                  onChange={(e) => {
                                    setEventTime(e.target.value);
                                    // Clear errors when user selects
                                    if (pollErrors['event-time'] || pollErrors['event-datetime']) {
                                      setPollErrors(prev => {
                                        const updated = { ...prev };
                                        delete updated['event-time'];
                                        delete updated['event-datetime'];
                                        return updated;
                                      });
                                    }
                                  }}
                                  data-poll-error="event-time"
                                  className={`w-full px-3 sm:px-4 py-3 sm:py-3.5 text-sm sm:text-base rounded-xl sm:rounded-2xl border transition-all duration-300 focus:outline-none focus:ring-2 backdrop-blur-xl ${pollErrors['event-time'] || pollErrors['event-datetime']
                                    ? theme === 'dark'
                                      ? 'bg-gray-900/30 border-red-500/50 text-white placeholder-white/40 focus:border-red-500 focus:ring-red-500/20'
                                      : 'bg-gray-50 border-red-500/50 text-gray-900 placeholder-gray-400 focus:border-red-500 focus:ring-red-500/20'
                                    : theme === 'dark'
                                      ? 'bg-gray-900/30 border-gray-900 text-white placeholder-white/40 focus:border-gray-900 focus:ring-gray-900/30'
                                      : 'bg-gray-50 border-gray-200/50 text-gray-900 placeholder-gray-400 focus:border-gray-300 focus:ring-gray-200'
                                    }`}
                                />
                                {pollErrors['event-time'] && (
                                  <p className="mt-1.5 text-xs text-red-500">{pollErrors['event-time']}</p>
                                )}
                              </div>
                            </div>
                            {pollErrors['event-datetime'] && (
                              <p className="mt-1.5 text-xs text-red-500">{pollErrors['event-datetime']}</p>
                            )}

                            {/* Event Capacity */}
                            <input
                              type="number"
                              placeholder={tp('event_capacity_placeholder', 'Capacity (optional)')}
                              value={eventCapacity}
                              onChange={(e) => setEventCapacity(e.target.value)}
                              className={`w-full px-3 sm:px-4 py-3 sm:py-3.5 text-sm sm:text-base rounded-xl sm:rounded-2xl border transition-all duration-300 focus:outline-none focus:ring-2 backdrop-blur-xl ${theme === 'dark'
                                ? 'bg-gray-900/30 border-gray-900 text-white placeholder-white/40 focus:border-gray-900 focus:ring-gray-900/30'
                                : 'bg-gray-50 border-gray-200/50 text-gray-900 placeholder-gray-400 focus:border-gray-300 focus:ring-gray-200'
                                }`}
                            />

                            {/* Event Price */}
                            <div className="flex items-center gap-2">
                              <motion.button
                                onClick={() => setEventIsPaid(!eventIsPaid)}
                                className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-300 backdrop-blur-xl flex items-center gap-1.5 sm:gap-2 ${eventIsPaid
                                  ? theme === 'dark'
                                    ? 'bg-white text-black shadow-[0_8px_32px_0_rgba(255,255,255,0.2)]'
                                    : 'bg-black text-white shadow-[0_8px_32px_0_rgba(0,0,0,0.1)]'
                                  : theme === 'dark'
                                    ? 'bg-gray-900/30 border border-gray-900 text-white/60 hover:text-white hover:bg-gray-900/50 active:bg-gray-900/50'
                                    : 'bg-gray-100 border border-gray-200/50 text-gray-500 hover:text-gray-900 hover:bg-gray-200 active:bg-gray-200'
                                  }`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <HandCoins className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span>{eventIsPaid ? tp('event_paid', 'Paid Event') : tp('event_free', 'Free Event')}</span>
                              </motion.button>
                              {eventIsPaid && (
                                <div className="flex-1 grid grid-cols-2 gap-2">
                                  <input
                                    type="number"
                                    placeholder={tp('event_price_placeholder', 'Price')}
                                    value={eventPrice}
                                    onChange={(e) => setEventPrice(e.target.value)}
                                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl sm:rounded-2xl border transition-all duration-300 focus:outline-none focus:ring-2 backdrop-blur-xl ${theme === 'dark'
                                      ? 'bg-gray-900/30 border-gray-900 text-white placeholder-white/40 focus:border-gray-900 focus:ring-gray-900/30'
                                      : 'bg-gray-50 border-gray-200/50 text-gray-900 placeholder-gray-400 focus:border-gray-300 focus:ring-gray-200'
                                      }`}
                                  />
                                  <input
                                    type="text"
                                    placeholder={tp('event_currency_placeholder', 'e.g. USD, EUR')}
                                    value={eventCurrency}
                                    onChange={(e) => setEventCurrency(e.target.value)}
                                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl sm:rounded-2xl border transition-all duration-300 focus:outline-none focus:ring-2 backdrop-blur-xl ${theme === 'dark'
                                      ? 'bg-gray-900/30 border-gray-900 text-white placeholder-white/40 focus:border-gray-900 focus:ring-gray-900/30'
                                      : 'bg-gray-50 border-gray-200/50 text-gray-900 placeholder-gray-400 focus:border-gray-300 focus:ring-gray-200'
                                      }`}
                                  />
                                </div>
                              )}
                            </div>

                            {/* Online Event */}
                            <div className="flex items-center gap-2">
                              <motion.button
                                onClick={() => setEventIsOnline(!eventIsOnline)}
                                className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-300 backdrop-blur-xl flex items-center gap-1.5 sm:gap-2 ${eventIsOnline
                                  ? theme === 'dark'
                                    ? 'bg-white text-black shadow-[0_8px_32px_0_rgba(255,255,255,0.2)]'
                                    : 'bg-black text-white shadow-[0_8px_32px_0_rgba(0,0,0,0.1)]'
                                  : theme === 'dark'
                                    ? 'bg-gray-900/30 border border-gray-900 text-white/60 hover:text-white hover:bg-gray-900/50 active:bg-gray-900/50'
                                    : 'bg-gray-100 border border-gray-200/50 text-gray-500 hover:text-gray-900 hover:bg-gray-200 active:bg-gray-200'
                                  }`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Film className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span>{eventIsOnline ? tp('event_online', 'Online Event') : tp('event_in_person', 'In-person Event')}</span>
                              </motion.button>
                              {eventIsOnline && (
                                <input
                                  type="text"
                                  placeholder={tp('event_online_url_placeholder', 'e.g. Zoom link')}
                                  value={eventOnlineURL}
                                  onChange={(e) => setEventOnlineURL(e.target.value)}
                                  className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl sm:rounded-2xl border transition-all duration-300 focus:outline-none focus:ring-2 backdrop-blur-xl ${theme === 'dark'
                                    ? 'bg-gray-900/30 border-gray-900 text-white placeholder-white/40 focus:border-gray-900 focus:ring-gray-900/30'
                                    : 'bg-gray-50 border-gray-200/50 text-gray-900 placeholder-gray-400 focus:border-gray-300 focus:ring-gray-200'
                                    }`}
                                />
                              )}
                            </div>

                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Attachment Pickers */}
                    <AnimatePresence>
                      {isEmojiPickerOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="w-full mt-4"
                        >
                          <EmojiPicker
                            onEmojiSelect={(emoji) => {
                              if (editorInstance) {
                                editorInstance.update(() => {
                                  const selection = $getSelection();
                                  if ($isRangeSelection(selection)) {
                                    selection.insertText(emoji.native);
                                  }
                                });
                              }
                              setIsEmojiPickerOpen(false);
                            }}
                            onClose={() => setIsEmojiPickerOpen(false)}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <AnimatePresence>
                      {isStickerPickerOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="w-full mt-4"
                        >
                          <StickerPicker onStickerSelect={handleStickerSelect} onClose={() => setIsStickerPickerOpen(false)} />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <AnimatePresence>
                      {isGifPickerOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="w-full mt-4"
                        >
                          <GifPicker onGifSelect={handleGifSelect} onClose={() => setIsGifPickerOpen(false)} />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <AnimatePresence>
                      {isYouTubePickerOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="w-full mt-4"
                        >
                          <YouTubePicker onVideoSelect={handleYouTubeSelect} onClose={() => setIsYouTubePickerOpen(false)} />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <AnimatePresence>
                      {isLocationPickerOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20 }}
                          className={`w-full mt-4 p-4 rounded-2xl border ${theme === 'dark'
                            ? 'bg-gray-900/80 border-gray-800 shadow-[0_20px_60px_-25px_rgba(0,0,0,0.6)]'
                            : 'bg-white border-gray-200/70 shadow-[0_20px_60px_-25px_rgba(0,0,0,0.15)]'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              {tp('location_title', 'Location')}
                            </div>
                            <button
                              onClick={() => setIsLocationPickerOpen(false)}
                              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${theme === 'dark'
                                ? 'bg-gray-800 text-white/70 hover:text-white'
                                : 'bg-gray-100 text-gray-600 hover:text-gray-900'
                                }`}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="mt-3">
                            <div className={`relative h-40 sm:h-44 rounded-2xl overflow-hidden border ${theme === 'dark'
                              ? 'cv-card-surface-muted border-white/10'
                              : 'bg-gray-100 border-gray-200/70'
                              }`}
                            >
                              {locationPreview ? (
                                <div ref={pickerMapRef} className="absolute inset-0" />
                              ) : (
                                <div className={`absolute inset-0 flex flex-col items-center justify-center gap-2 text-xs ${theme === 'dark'
                                  ? 'text-white/50'
                                  : 'text-gray-500'
                                  }`}
                                >
                                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${theme === 'dark'
                                    ? 'bg-gray-900 text-white/70'
                                    : 'bg-white text-gray-700'
                                    }`}
                                  >
                                    {isPreviewLocating
                                      ? <Loader2 className="w-5 h-5 animate-spin" />
                                      : <MapPin className="w-5 h-5" />
                                    }
                                  </div>
                                  <span>
                                    {isPreviewLocating
                                      ? tp('location_preview_loading', 'Finding your area...')
                                      : tp('location_preview_hint', 'Search to preview the map')}
                                  </span>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/0 to-transparent pointer-events-none" />
                              <div className="absolute bottom-3 left-3 right-3">
                                <div className={`flex items-center gap-3 rounded-xl px-3 py-2 backdrop-blur-xl border ${theme === 'dark'
                                  ? 'cv-card-surface-soft border-white/10 text-white'
                                  : 'bg-white/90 border-gray-200/60 text-gray-900'
                                  }`}
                                >
                                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${theme === 'dark'
                                    ? 'bg-gray-900 text-white/70'
                                    : 'bg-gray-100 text-gray-700'
                                    }`}
                                  >
                                    <MapPin className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className={`text-[10px] font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>
                                      {tp('location_preview_label', 'Map preview')}
                                    </p>
                                    <p className="text-sm font-semibold truncate">
                                      {locationPreviewDisplay?.title ?? tp('location_preview_title', 'Choose a place')}
                                    </p>
                                    {locationPreviewDisplay?.subtitle && (
                                      <p className={`text-xs mt-0.5 line-clamp-2 ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'}`}>
                                        {locationPreviewDisplay.subtitle}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-xl border focus-within:ring-2 focus-within:ring-blue-500/20 ${theme === 'dark'
                            ? 'cv-card-surface-soft border-white/10 text-white placeholder:text-white/40 focus-within:border-blue-500/40'
                            : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus-within:border-blue-500/40'
                            }`}
                          >
                            <Search className={`w-4 h-4 ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'}`} />
                            <input
                              value={locationQuery}
                              onChange={(e) => setLocationQuery(e.target.value)}
                              placeholder={tp('location_search_placeholder', 'Search for a place')}
                              className="w-full bg-transparent text-sm focus:outline-none"
                              autoComplete="off"
                            />
                            {locationQuery.length > 0 && (
                              <button
                                onClick={() => setLocationQuery('')}
                                className={`w-6 h-6 rounded-full flex items-center justify-center ${theme === 'dark'
                                  ? 'bg-gray-800 text-white/70 hover:text-white'
                                  : 'bg-gray-200 text-gray-600 hover:text-gray-900'
                                  }`}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          <div className="mt-3 grid gap-2">
                            <motion.button
                              onClick={getCurrentLocation}
                              disabled={isGettingLocation}
                              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${isGettingLocation
                                ? theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-500'
                                : theme === 'dark' ? 'bg-blue-500/20 text-blue-200 hover:bg-blue-500/30' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-600'}`}>
                                  <Navigation className="w-4 h-4" />
                                </div>
                                <div className="text-left">
                                  <div className="text-sm font-semibold">{tp('location_current', 'Current Location')}</div>
                                  <div className={`text-xs font-medium ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>
                                    {tp('location_current_hint', 'Use your device GPS')}
                                  </div>
                                </div>
                              </div>
                              {isGettingLocation && <Loader2 className="w-4 h-4 animate-spin" />}
                            </motion.button>
                          </div>

                          <div className="mt-4 flex items-center justify-between">
                            <p className={`text-[11px] font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>
                              {hasLocationQuery
                                ? tp('location_results', 'Search results')
                                : tp('location_nearby', 'Nearby places')}
                            </p>
                            {(hasLocationQuery ? isLocationSearching : isNearbyLoading) && (
                              <Loader2 className={`w-4 h-4 animate-spin ${theme === 'dark' ? 'text-white/50' : 'text-gray-400'}`} />
                            )}
                          </div>

                          <div className="mt-2 max-h-60 overflow-auto space-y-2 pr-1">
                            {hasLocationQuery && isLocationSearching && (
                              <div className={`flex items-center gap-2 text-xs rounded-xl px-3 py-2 ${theme === 'dark' ? 'cv-card-surface-muted text-white/60' : 'text-gray-500 bg-gray-50'}`}>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                {tp('location_searching', 'Searching...')}
                              </div>
                            )}

                            {!hasLocationQuery && isNearbyLoading && (
                              <div className={`flex items-center gap-2 text-xs rounded-xl px-3 py-2 ${theme === 'dark' ? 'cv-card-surface-muted text-white/60' : 'text-gray-500 bg-gray-50'}`}>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                {tp('location_nearby_loading', 'Loading nearby places...')}
                              </div>
                            )}

                            {hasLocationQuery && locationSearchError && (
                              <div className={`text-xs rounded-xl px-3 py-2 ${theme === 'dark' ? 'text-red-300 bg-red-500/10' : 'text-red-600 bg-red-50'}`}>
                                {tp('location_search_error', 'Unable to search locations. Try again.')}
                              </div>
                            )}

                            {!hasLocationQuery && nearbyError && (
                              <div className={`text-xs rounded-xl px-3 py-2 ${theme === 'dark' ? 'text-red-300 bg-red-500/10' : 'text-red-600 bg-red-50'}`}>
                                {tp('location_nearby_error', 'Unable to load nearby places.')}
                              </div>
                            )}

                            {!hasLocationQuery && !nearbyError && !isNearbyLoading && nearbyPlaces.length === 0 && (
                              <div className={`text-xs rounded-xl px-3 py-2 ${theme === 'dark' ? 'cv-card-surface-muted text-white/50' : 'text-gray-500 bg-gray-50'}`}>
                                {tp('location_nearby_empty', 'No nearby places found')}
                              </div>
                            )}

                            {hasLocationQuery && !locationSearchError && !isLocationSearching && locationResults.length === 0 && (
                              <div className={`text-xs rounded-xl px-3 py-2 ${theme === 'dark' ? 'cv-card-surface-muted text-white/50' : 'text-gray-500 bg-gray-50'}`}>
                                {tp('location_search_empty', 'No places found')}
                              </div>
                            )}

                            {displayedPlaces.map((place) => {
                              return (
                                <button
                                  key={place.key}
                                  onClick={() => handleLocationPick(place.address, place.lat, place.lng)}
                                  className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-all ${theme === 'dark'
                                    ? 'cv-card-surface-muted border-white/10 hover:bg-white/[0.06]'
                                    : 'border-gray-200 bg-white hover:bg-gray-50'
                                    }`}
                                >
                                  <div className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-gray-800 text-white/70' : 'bg-gray-100 text-gray-700'}`}>
                                    <MapPin className="w-4 h-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-semibold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                      {place.title}
                                    </p>
                                    {place.subtitle && (
                                      <p className={`text-xs mt-1 line-clamp-2 ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'}`}>
                                        {place.subtitle}
                                      </p>
                                    )}
                                  </div>
                                  <div className={`text-xs font-semibold ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'}`}>
                                    {tp('location_select', 'Select')}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className={`w-full flex items-center py-2 px-2`}>
            <div className="flex-1 overflow-y-hidden overflow-x-auto scrollbar-hide">
              <div className="flex items-center gap-1 sm:gap-1.5 px-1">
                {[
                  { icon: Image, action: () => fileInputRef.current?.click(), label: tp('toolbar_image', 'Image'), active: false },
                  { icon: Video, action: () => videoInputRef.current?.click(), label: tp('toolbar_video', 'Video'), active: false },
                  {
                    icon: BarChart3, action: () => {
                      addPoll();
                      setIsPollActive(true);
                    }, label: tp('toolbar_poll', 'Poll'), active: isPollActive
                  },
                  {
                    icon: Calendar, action: () => {
                      setIsEventActive(true);
                      setEventIsOnline(true);
                    }, label: tp('toolbar_event', 'Event'), active: isEventActive
                  },
                  { icon: MapPin, action: () => setIsLocationPickerOpen(!isLocationPickerOpen), label: tp('toolbar_location', 'Location'), active: isLocationPickerOpen },
                  {
                    icon: Smile, action: () => {
                      setIsStickerPickerOpen(false);
                      setIsGifPickerOpen(false);
                      setIsEmojiPickerOpen(!isEmojiPickerOpen);
                    }, label: tp('toolbar_emoji', 'Emoji'), active: isEmojiPickerOpen
                  },
                  {
                    icon: Sparkles, action: () => {
                      setIsEmojiPickerOpen(false);
                      setIsGifPickerOpen(false);
                      setIsStickerPickerOpen(!isStickerPickerOpen);
                    }, label: tp('toolbar_sticker', 'Sticker'), active: isStickerPickerOpen
                  },
                  {
                    icon: 'GIF', action: () => {
                      setIsEmojiPickerOpen(false);
                      setIsStickerPickerOpen(false);
                      setIsGifPickerOpen(!isGifPickerOpen);
                    }, label: tp('toolbar_gif', 'GIF'), active: isGifPickerOpen
                  },
                  {
                    icon: Youtube, action: () => {
                      setIsEmojiPickerOpen(false);
                      setIsStickerPickerOpen(false);
                      setIsGifPickerOpen(false);
                      setIsYouTubePickerOpen(!isYouTubePickerOpen);
                    }, label: tp('toolbar_youtube', 'YouTube'), active: isYouTubePickerOpen
                  },
                ].map(({ icon, action, label, active }) => (
                  <motion.button
                    key={label}
                    onClick={action}
                    title={label}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 ${active
                      ? theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'
                      : theme === 'dark' ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-gray-900 hover:bg-black/5'
                      }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {typeof icon === 'string' ? (
                      <span className={`text-sm font-bold ${active ? '' : 'opacity-80'}`}>{icon}</span>
                    ) : (
                      React.createElement(icon, { className: "w-5 h-5 sm:w-5 sm:h-5" })
                    )}
                  </motion.button>
                ))}
                <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                <input ref={videoInputRef} type="file" multiple accept="video/*" className="hidden" onChange={handleVideoUpload} />
              </div>
            </div>
 
            <div className="flex flex-col items-end gap-2 sm:gap-3 pl-2 sm:pl-3 flex-shrink-0">
              <motion.button
                onClick={handleSubmit}
                disabled={isSubmitting || (!hasEditorContent && selectedImages.length === 0 && selectedVideos.length === 0 && !isEventActive)} className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 disabled:cursor-not-allowed ${theme === 'dark'
                  ? 'bg-white text-black disabled:bg-gray-800 disabled:text-gray-500'
                  : 'bg-black text-white disabled:bg-gray-200 disabled:text-gray-500'
                  }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {tp('submitting', 'Please wait')}
                  </span>
                ) : resolvedButtonText}
              </motion.button>
              {uploadProgress !== null && (
                <div className="w-32 sm:w-44">
                  <div className={`h-2 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-black/10'}`}>
                    <div
                      className={`h-2 rounded-full transition-all duration-200 ${theme === 'dark' ? 'bg-white' : 'bg-black'}`}
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <div className={`mt-1 text-[10px] font-semibold ${theme === 'dark' ? 'text-white/60' : 'text-black/60'}`}>
                    {uploadProgress < 100
                      ? tp('uploading', 'Uploading {{progress}}%', { progress: uploadProgress })
                      : tp('uploaded', 'Uploaded')}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CreatePost;
