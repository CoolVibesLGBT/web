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
  Youtube
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { ToolbarContext } from '../../contexts/ToolbarContext';
import { api } from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import L from 'leaflet';
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
import { $getRoot, $getSelection, $isRangeSelection, $createParagraphNode, $createTextNode, INSERT_PARAGRAPH_COMMAND } from 'lexical';
import { MentionNode } from '../editor/Lexical/nodes/MentionNode';
import NewMentionsPlugin from '../editor/Lexical/plugins/MentionsPlugin';
import ImagesPlugin, { INSERT_IMAGE_COMMAND } from '../editor/Lexical/plugins/ImagesPlugin';
import StickerPicker, { StickerItem } from './StickerPicker';
import GifPicker, { GifItem } from './GifPicker';
import YouTubePicker, { YouTubeVideo } from './YouTubePicker';
import { ImageNode } from '../editor/Lexical/nodes/ImageNode';
import { YouTubeNode } from '../editor/Lexical/nodes/YouTubeNode';
import YouTubePlugin, { INSERT_YOUTUBE_COMMAND } from '../editor/Lexical/plugins/YouTubePlugin';
import { INSERT_PAGE_BREAK } from '../editor/Lexical/plugins/PageBreakPlugin';
import EmojiPicker from './EmojiPicker';
import AutoLinkPlugin from '../editor/Lexical/plugins/AutoLinkPlugin';
import AutoEmbedPlugin from '../editor/Lexical/plugins/AutoEmbedPlugin';
import { TweetNode } from '../editor/Lexical/nodes/TweetNode';
import { MetadataNode } from '../editor/Lexical/nodes/MetadataNode';

// ToolbarPlugin wrapper component
const ToolbarPluginWrapper = ({ setEditorInstance }: { setEditorInstance: (editor: unknown) => void }) => {
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);
  const [isLinkEditMode, setIsLinkEditMode] = useState(false);

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
  canClose?: boolean;
  onClose?: () => void;
  placeholder?: string;
  buttonText?: string;
  parentPostId?: string;
  fullScreen?: boolean;
  onReply?: (content: string, parentPostId?: string) => void;
  onPostCreated?: () => void;
  postKind?: string;
  extras?: Record<string, unknown>;
}

const CreatePost: React.FC<CreatePostProps> = ({
  title = "Create Post",
  canClose = false,
  onClose,
  placeholder = "What's on your mind? Share your thoughts, experiences, or ask a question...",
  buttonText = "Post",
  parentPostId,
  onReply,
  fullScreen = false,
  onPostCreated,
  postKind,
  extras,
}) => {
  const [postText, setPostText] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [hasEditorContent, setHasEditorContent] = useState(false);
  const [editorInstance, setEditorInstance] = useState<unknown>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<File[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [audience] = useState<'public' | 'community' | 'private'>('public');
  const [polls, setPolls] = useState<Array<{ id: string, question: string, options: string[], duration: string, kind: 'single' | 'multiple' | 'ranked' | 'weighted', maxSelectable: number }>>([]);
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
  const [charCount, setCharCount] = useState(0);
  const [location, setLocation] = useState<{ address: string; lat: number; lng: number } | null>(null);
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
  const maxChars = 500;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);




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
      altText: gif.description || 'GIF',
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
    if (!hasEditorContent && selectedImages.length === 0 && selectedVideos.length === 0) return;

    // Validate polls
    const errors: Record<string, string> = {};
    polls.forEach((poll) => {
      // Check if question is empty
      if (!poll.question || poll.question.trim() === '') {
        errors[`poll-${poll.id}-question`] = 'Poll question is required';
      }

      // Check if at least 2 options are filled
      const filledOptions = poll.options.filter(opt => opt && opt.trim() !== '');
      if (filledOptions.length < 2) {
        errors[`poll-${poll.id}-options`] = 'At least 2 options are required';
      }
    });

    // Validate event if active
    if (isEventActive) {
      // Check if title is empty
      if (!eventTitle || eventTitle.trim() === '') {
        errors['event-title'] = 'Event title is required';
      }

      // Check if description is empty
      if (!eventDescription || eventDescription.trim() === '') {
        errors['event-description'] = 'Event description is required';
      }

      // Check if event kind is selected
      if (!eventKind || eventKind.trim() === '') {
        errors['event-kind'] = 'Event type is required';
      }

      // Check if date is provided
      if (!eventDate || eventDate.trim() === '') {
        errors['event-date'] = 'Event date is required';
      }

      // Check if time is provided
      if (!eventTime || eventTime.trim() === '') {
        errors['event-time'] = 'Event time is required';
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
          errors['event-date'] = 'Event date cannot be in the past';
        }

        // Check if date is more than 2 years in the future
        if (eventDateOnly > maxDate) {
          errors['event-date'] = 'Event date cannot be more than 2 years in the future';
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
          errors['event-datetime'] = 'Event date and time cannot be in the past';
        }
      } else if (!eventDate && eventTime) {
        // If time is provided but date is not, it's invalid
        errors['event-date'] = 'Event date is required when time is provided';
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

    const contentJSON = editorInstance.getEditorState().toJSON()
    const postData: Record<string, unknown> = {
      content: JSON.stringify(contentJSON),
      hashtags: hashtags,
      mentions: mentions,
      images: selectedImages,
      videos: selectedVideos,
      audience: audience,
      ...(postKind && { kind: postKind }),
      ...(parentPostId && { parentPostId }),
      ...(polls.length > 0 && polls.reduce((acc, poll, pollIndex) => {
        acc[`polls[${pollIndex}].question`] = poll.question;
        acc[`polls[${pollIndex}].duration`] = poll.duration;
        acc[`polls[${pollIndex}].kind`] = poll.kind;
        acc[`polls[${pollIndex}].max_selectable`] = poll.maxSelectable;
        poll.options.forEach((option, optionIndex) => {
          acc[`polls[${pollIndex}].options[${optionIndex}]`] = option;
        });
        return acc;
      }, {} as Record<string, unknown>)),
      event: isEventActive ? {
        title: eventTitle,
        description: eventDescription,
        kind: eventKind,
        date: eventDate,
        time: eventTime,
        capacity: eventCapacity ? parseInt(eventCapacity) : undefined,
        is_paid: eventIsPaid,
        price: eventPrice ? parseFloat(eventPrice) : undefined,
        currency: eventCurrency || undefined,
        is_online: eventIsOnline,
        online_url: eventOnlineURL || undefined
      } : null,
      location: location
    };

    if (extras) {
      Object.keys(extras).forEach(key => {
        const value = extras[key];
        postData[`extras[${key}]`] = JSON.stringify(value);
      });
    }

    try {
      // Call API to create post
      console.log('Posting data:', postData);

      // Call actual API
      await api.handleCreatePost(postData);

      // Call onReply callback if it's a reply
      if (onReply && parentPostId) {
        onReply(htmlContent || editorContent, parentPostId);
      }

      // Call onPostCreated callback if it's a new post (not a reply)
      if (onPostCreated && !parentPostId) {
        onPostCreated();
      }

      // Reset form
      setPostText('');
      setEditorContent('');
      setHasEditorContent(false);
      setSelectedImages([]);
      setSelectedVideos([]);
      setIsExpanded(false);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  // Location functionality
  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by this browser.');
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
            address: `Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            lat: latitude,
            lng: longitude
          });
          setIsLocationPickerOpen(false);
        }
      } catch (addressError) {
        console.error('Error fetching address:', addressError);
        // Fallback with coordinates
        setLocation({
          address: `Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          lat: latitude,
          lng: longitude
        });
        setIsLocationPickerOpen(false);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      let errorMessage = 'Unable to get your location. ';

      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please allow location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'An unknown error occurred.';
            break;
        }
      }

      alert(errorMessage);
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Poll helper functions
  const addPoll = () => {
    const newPoll = {
      id: Date.now().toString(),
      question: '',
      options: ['', ''],
      duration: '0',
      kind: 'single' as 'single' | 'multiple' | 'ranked' | 'weighted',
      maxSelectable: 1
    };
    setPolls([...polls, newPoll]);
  };

  const removePoll = (pollId: string) => {
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
        ? { ...poll, options: [...poll.options, ''] }
        : poll
    ));
  };

  const removePollOption = (pollId: string, optionIndex: number) => {
    setPolls(polls.map(poll =>
      poll.id === pollId
        ? {
          ...poll,
          options: poll.options.length > 2
            ? poll.options.filter((_, i) => i !== optionIndex)
            : poll.options
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

  const updatePollKind = (pollId: string, kind: 'single' | 'multiple' | 'ranked' | 'weighted') => {
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
    if (!location || !mapRef.current) {
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
        const isMobile = window.innerWidth < 640;
        container.style.width = '100%';
        container.style.height = isMobile ? '192px' : '256px';
        container.style.position = 'relative';
        container.style.zIndex = '1';

        const map = L.map(container, {
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

        L.marker([location.lat, location.lng], { icon: customIcon }).addTo(map);

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
  }, [location]);

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
    { value: 'public', icon: Globe, label: 'Everyone', description: 'Anyone can see this post' },
    { value: 'community', icon: Users, label: 'Community', description: 'Only community members can see this post' },
    { value: 'private', icon: Lock, label: 'Private', description: 'Only you can see this post' },
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
    }} className={`${isFullScreen ? "fixed left-0 right-0 bottom-0 top-[65px] md:top-0 w-full z-[999] flex flex-col overflow-hidden" : ""} ${theme === 'dark' ? "bg-gray-950" : "bg-white"}`}>



      {/* Ultra-Professional Create Post Component */}
      <motion.div
        className={`w-full ${isFullScreen ? 'flex-1 flex flex-col' : 'flex flex-col'} transition-all duration-500 `}>
        <div className={`w-full ${isFullScreen ? 'flex-1 overflow-y-auto scrollbar-hide' : ''}`}>
          {/* Compact Professional Header */}
          <div className={`${isFullScreen ? 'px-3 sm:px-6 py-2' : 'px-3 sm:px-4 py-2 sm:py-3'} border-b flex-shrink-0 ${theme === 'dark' ? 'border-gray-900' : 'border-gray-200/30'
            }`}>

            <div className="flex items-center justify-between">
              {/* Left: Title Only */}
              <div className="flex items-center flex-1 min-w-0">
                <h2 className={`text-sm sm:text-base font-semibold tracking-tight truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                  {title}
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
                <motion.button
                  onClick={() => {
                    toggleFullScreen()
                    if (canClose && onClose) {

                      onClose()
                    }
                  }}
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
                  title={isFullScreen ? "Exit full screen" : "Enter full screen"}
                >
                  {isFullScreen ? (
                    <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                </motion.button>

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
                    title="Close"
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
                                {placeholder}
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

            <div className={`w-full ${isFullScreen ? 'flex-1' : ''}  ${isFullScreen ? 'overflow-y-auto' : ''} scrollbar-hide`}>
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
                                {selectedImages.length + selectedVideos.length} {selectedImages.length + selectedVideos.length === 1 ? 'Media' : 'Media'}
                              </h3>
                              <p className={`text-[10px] sm:text-xs font-medium tracking-wide truncate ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'
                                }`}>
                                {selectedImages.length > 0 && `${selectedImages.length} image${selectedImages.length > 1 ? 's' : ''}`}
                                {selectedImages.length > 0 && selectedVideos.length > 0 && ' · '}
                                {selectedVideos.length > 0 && `${selectedVideos.length} video${selectedVideos.length > 1 ? 's' : ''}`}
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
                            Clear All
                          </motion.button>
                        </div>

                        {/* Native Premium Collage Grid */}
                        <div className="w-full overflow-x-auto scrollbar-hide pb-2 -mb-2">
                          <div className="flex gap-3">
                            <AnimatePresence>
                              {[
                                ...selectedImages.map((file, idx) => ({ type: 'image', file, index: idx, key: `image-${file.name}-${idx}` })),
                                ...selectedVideos.map((file, idx) => ({ type: 'video', file, index: idx, key: `video-${file.name}-${idx}` }))
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
                                    <img src={URL.createObjectURL(media.file)} alt="Media" className="w-full h-full object-cover select-none" />
                                  ) : (
                                    <div className="relative flex items-center justify-center w-full h-full select-none">
                                      <div className="absolute inset-0 bg-gray-900" />
                                      <div className="w-8 h-8 rounded-full backdrop-blur-xl bg-white/10 flex items-center justify-center z-10 border border-white/20 shadow-lg">
                                        <Video className="w-4 h-4 text-white" />
                                      </div>
                                      <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/70 to-transparent z-10 flex flex-col justify-end">
                                        <p className="text-[10px] font-semibold text-white/90 line-clamp-1">{media.file.name}</p>
                                      </div>
                                    </div>
                                  )}
                                  <motion.button
                                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); media.type === 'image' ? removeImage(media.index) : removeVideo(media.index); }}
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
                          ? 'bg-gray-950 border border-gray-900 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]'
                          : 'bg-white border border-gray-200/50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]'
                          }`}>
                          {/* Apple-Style Header */}
                          <div className={`px-4  sm:px-6 py-3 sm:py-4 border-b ${theme === 'dark' ? 'border-gray-900' : 'border-gray-200/50'
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
                                    Poll{polls.length > 1 ? 's' : ''}
                                  </h3>
                                  <p className={`text-[10px] sm:text-xs font-medium tracking-wide truncate ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'
                                    }`}>
                                    {polls.length} question{polls.length > 1 ? 's' : ''}
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
                                  ? 'bg-gray-950 border border-gray-900 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]'
                                  : 'bg-white border border-gray-200/50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]'
                                  }`}
                              >
                                {/* Apple-Style Poll Header */}
                                <div className={`px-4 sm:px-6 py-4 sm:py-5 border-b ${theme === 'dark' ? 'border-gray-900' : 'border-gray-200/50'
                                  }`} data-poll-error={`poll-${poll.id}-question`}>
                                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                                    <div className="flex-1 min-w-0">
                                      <label className={`block text-xs sm:text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white/70' : 'text-gray-600'
                                        }`}>
                                        Question
                                      </label>
                                      <input
                                        type="text"
                                        placeholder="What would you like to ask?"
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
                                    Options
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
                                        className="flex items-center gap-2 sm:gap-3"
                                      >
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
                                          placeholder={`Option ${optionIndex + 1}`}
                                          value={option}
                                          onChange={(e) => {
                                            updatePollOption(poll.id, optionIndex, e.target.value);
                                            // Clear error when user starts typing
                                            if (pollErrors[`poll-${poll.id}-options`]) {
                                              const filledOptions = poll.options.map((opt, idx) =>
                                                idx === optionIndex ? e.target.value : opt
                                              ).filter(opt => opt && opt.trim() !== '');
                                              if (filledOptions.length >= 2) {
                                                setPollErrors(prev => {
                                                  const updated = { ...prev };
                                                  delete updated[`poll-${poll.id}-options`];
                                                  return updated;
                                                });
                                              }
                                            }
                                          }}
                                          className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl sm:rounded-2xl border transition-all duration-300 focus:outline-none focus:ring-2 backdrop-blur-xl ${pollErrors[`poll-${poll.id}-options`] && (!option || option.trim() === '')
                                            ? theme === 'dark'
                                              ? 'bg-red-500/10 border-red-500/50 text-white placeholder:text-white/40 focus:border-red-500 focus:ring-red-500/20'
                                              : 'bg-red-50 border-red-500/50 text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500/20'
                                            : theme === 'dark'
                                              ? 'bg-gray-900/30 border-gray-900 text-white placeholder-white/40 focus:border-gray-900 focus:ring-gray-900/30'
                                              : 'bg-gray-50 border-gray-200/50 text-gray-900 placeholder-gray-400 focus:border-gray-300 focus:ring-gray-200'
                                            }`}
                                        />
                                        {poll.options.length > 2 && (
                                          <motion.button
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
                                      <span className="text-xs sm:text-sm font-semibold tracking-tight">Add option</span>
                                    </motion.button>
                                  </div>
                                </div>

                                {/* Poll Settings - Combined Section */}
                                <div className={`px-4 sm:px-6 py-4 sm:py-5 border-t backdrop-blur-xl ${theme === 'dark' ? 'border-gray-900 bg-gray-950' : 'border-gray-200/50 bg-gray-50/50'
                                  }`}>
                                  <div className="space-y-4 sm:space-y-5">
                                    {/* Poll Type Selection */}
                                    <div className="flex flex-col gap-2.5 sm:gap-3">
                                      <div className="flex items-center gap-2 sm:gap-3">
                                        <BarChart3 className={`w-4 h-4 sm:w-5 sm:h-5 ${theme === 'dark' ? 'text-white/70' : 'text-gray-600'
                                          }`} />
                                        <span className={`text-xs sm:text-sm font-semibold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                                          }`}>
                                          Poll Type
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                        {[
                                          { value: 'single', label: 'Single', icon: CircleCheck, desc: 'One choice' },
                                          { value: 'multiple', label: 'Multiple', icon: CheckSquare, desc: 'Many choices' },
                                          { value: 'ranked', label: 'Ranked', icon: ListOrdered, desc: 'Ordered' },
                                          { value: 'weighted', label: 'Weighted', icon: Scale, desc: 'Prioritized' }
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
                                          Duration
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                        {[
                                          { value: '0', label: '∞', desc: 'Never ends' },
                                          { value: '1', label: '1d', desc: '1 day' },
                                          { value: '3', label: '3d', desc: '3 days' },
                                          { value: '7', label: '1w', desc: '1 week' },
                                          { value: '30', label: '1m', desc: '1 month' }
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
                                  <div className={`px-4 sm:px-6 py-4 sm:py-5 border-t backdrop-blur-xl ${theme === 'dark' ? 'border-gray-900 bg-gray-950' : 'border-gray-200/50 bg-gray-50/50'
                                    }`}>
                                    <div className="flex flex-col gap-3">
                                      <div className="flex items-center gap-2 sm:gap-3">
                                        <Users className={`w-4 h-4 sm:w-5 sm:h-5 ${theme === 'dark' ? 'text-white/70' : 'text-gray-600'
                                          }`} />
                                        <span className={`text-xs sm:text-sm font-semibold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                                          }`}>
                                          Max Selections
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
                                            of {poll.options.filter(opt => opt.trim() !== '').length || 1}
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
                                ? 'bg-gray-950/80 border-gray-900 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]'
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
                                          return parts.slice(0, -2).join(', ').trim() || 'Exact location';
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
                          ? 'bg-gray-950 border border-gray-900 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]'
                          : 'bg-white border border-gray-200/50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]'
                          }`}>
                          <div className={`px-4 sm:px-6 py-3 sm:py-4 border-b ${theme === 'dark' ? 'border-gray-900' : 'border-gray-200/50'
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
                                    Event
                                  </h3>
                                  <p className={`text-[10px] sm:text-xs font-medium tracking-wide truncate ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'
                                    }`}>
                                    Plan with community
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
                                placeholder="Event title *"
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
                                placeholder="Event description *"
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
                                <span className="text-xs sm:text-sm font-semibold tracking-tight">Event Type *</span>
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
                                    : 'Select event type'
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
                                      ? 'bg-gray-950 border-gray-900'
                                      : 'bg-white border-gray-200/60'
                                      }`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {/* Search Bar */}
                                    <div className={`p-3 sm:p-4 border-b ${theme === 'dark' ? 'border-gray-900 bg-gray-950' : 'border-gray-200/50 bg-white'
                                      }`}>
                                      <div className="relative">
                                        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${theme === 'dark' ? 'text-white/50' : 'text-gray-400'
                                          }`} />
                                        <input
                                          type="text"
                                          placeholder="Search event types..."
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
                              placeholder="Capacity (optional)"
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
                                <span>{eventIsPaid ? "Paid Event" : "Free Event"}</span>
                              </motion.button>
                              {eventIsPaid && (
                                <div className="flex-1 grid grid-cols-2 gap-2">
                                  <input
                                    type="number"
                                    placeholder="Price"
                                    value={eventPrice}
                                    onChange={(e) => setEventPrice(e.target.value)}
                                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl sm:rounded-2xl border transition-all duration-300 focus:outline-none focus:ring-2 backdrop-blur-xl ${theme === 'dark'
                                      ? 'bg-gray-900/30 border-gray-900 text-white placeholder-white/40 focus:border-gray-900 focus:ring-gray-900/30'
                                      : 'bg-gray-50 border-gray-200/50 text-gray-900 placeholder-gray-400 focus:border-gray-300 focus:ring-gray-200'
                                      }`}
                                  />
                                  <input
                                    type="text"
                                    placeholder="e.g. USD, EUR"
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
                                <span>{eventIsOnline ? "Online Event" : "In-person Event"}</span>
                              </motion.button>
                              {eventIsOnline && (
                                <input
                                  type="text"
                                  placeholder="e.g. Zoom link"
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
                          className={`w-full mt-4 p-4 rounded-2xl ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}
                        >
                          <motion.button
                            onClick={getCurrentLocation}
                            disabled={isGettingLocation}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${isGettingLocation
                              ? theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-500'
                              : theme === 'dark' ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                              }`}
                          >
                            {isGettingLocation ? 'Getting location...' : <><Navigation className="w-4 h-4" /> Current Location</>}
                          </motion.button>
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
                  { icon: Image, action: () => fileInputRef.current?.click(), label: "Image", active: false },
                  { icon: Video, action: () => videoInputRef.current?.click(), label: "Video", active: false },
                  {
                    icon: BarChart3, action: () => {
                      addPoll();
                      setIsPollActive(true);
                    }, label: "Poll", active: isPollActive
                  },
                  {
                    icon: Calendar, action: () => {
                      setIsEventActive(true);
                      setEventIsOnline(true);
                    }, label: "Event", active: isEventActive
                  },
                  { icon: MapPin, action: () => setIsLocationPickerOpen(!isLocationPickerOpen), label: "Location", active: isLocationPickerOpen },
                  {
                    icon: Smile, action: () => {
                      setIsStickerPickerOpen(false);
                      setIsGifPickerOpen(false);
                      setIsEmojiPickerOpen(!isEmojiPickerOpen);
                    }, label: "Emoji", active: isEmojiPickerOpen
                  },
                  {
                    icon: Sparkles, action: () => {
                      setIsEmojiPickerOpen(false);
                      setIsGifPickerOpen(false);
                      setIsStickerPickerOpen(!isStickerPickerOpen);
                    }, label: "Sticker", active: isStickerPickerOpen
                  },
                  {
                    icon: 'GIF', action: () => {
                      setIsEmojiPickerOpen(false);
                      setIsStickerPickerOpen(false);
                      setIsGifPickerOpen(!isGifPickerOpen);
                    }, label: "GIF", active: isGifPickerOpen
                  },
                  {
                    icon: Youtube, action: () => {
                      setIsEmojiPickerOpen(false);
                      setIsStickerPickerOpen(false);
                      setIsGifPickerOpen(false);
                      setIsYouTubePickerOpen(!isYouTubePickerOpen);
                    }, label: "YouTube", active: isYouTubePickerOpen
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
 
            <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 flex-shrink-0">
              <motion.button
                onClick={handleSubmit}
                disabled={isSubmitting || (!hasEditorContent && selectedImages.length === 0 && selectedVideos.length === 0 && !isEventActive)} className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 disabled:cursor-not-allowed ${theme === 'dark'
                  ? 'bg-white text-black disabled:bg-gray-800 disabled:text-gray-500'
                  : 'bg-black text-white disabled:bg-gray-200 disabled:text-gray-500'
                  }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isSubmitting ? "Posting..." : buttonText}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CreatePost;
