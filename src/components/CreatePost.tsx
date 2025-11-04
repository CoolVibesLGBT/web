import React, { useState, useRef, useEffect } from 'react';
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
  Clock,
  Navigation,
  Calendar,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { ToolbarContext } from '../contexts/ToolbarContext';
import { api } from '../services/api';
import L from 'leaflet';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import {AutoFocusPlugin} from '@lexical/react/LexicalAutoFocusPlugin';
import {HistoryPlugin} from '@lexical/react/LexicalHistoryPlugin';

import {HashtagPlugin} from '@lexical/react/LexicalHashtagPlugin';
import {ListPlugin} from '@lexical/react/LexicalListPlugin';
import {LinkPlugin} from '@lexical/react/LexicalLinkPlugin';

import {HashtagNode} from '@lexical/hashtag';
import {HeadingNode, QuoteNode} from '@lexical/rich-text';
import {ListNode, ListItemNode} from '@lexical/list';
import {LinkNode, AutoLinkNode} from '@lexical/link';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import ToolbarPlugin from './Lexical/plugins/ToolbarPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { $getRoot } from 'lexical';
import { MentionNode } from './Lexical/nodes/MentionNode';
import NewMentionsPlugin from './Lexical/plugins/MentionsPlugin';

// ToolbarPlugin wrapper component
const ToolbarPluginWrapper = ({ setEditorInstance }: { setEditorInstance: (editor: any) => void }) => {
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

// Popular LGBTQ+ friendly locations
const popularLocations = [
  {
    name: "New York City",
    country: "🇺🇸 USA",
    description: "Birthplace of Stonewall, massive Pride parades, queer history",
    lat: 40.7128,
    lng: -74.0060
  },
  {
    name: "São Paulo",
    country: "🇧🇷 Brazil",
    description: "World's largest Pride parade, huge queer scene",
    lat: -23.5505,
    lng: -46.6333
  },
  {
    name: "Berlin",
    country: "🇩🇪 Germany",
    description: "Liberal culture, historic queer bars, intense nightlife",
    lat: 52.5200,
    lng: 13.4050
  },
  {
    name: "San Francisco",
    country: "🇺🇸 USA",
    description: "Castro district, LGBT history museums, heart of activism",
    lat: 37.7749,
    lng: -122.4194
  },
  {
    name: "Madrid",
    country: "🇪🇸 Spain",
    description: "One of Europe's biggest Pride events, Chueca neighborhood",
    lat: 40.4168,
    lng: -3.7038
  },
  {
    name: "Tel Aviv",
    country: "🇮🇱 Israel",
    description: "One of Middle East's most liberal cities, vibrant beach and nightlife",
    lat: 32.0853,
    lng: 34.7818
  },
  {
    name: "Bangkok",
    country: "🇹🇭 Thailand",
    description: "Asia's queer capital, open drag culture and free atmosphere",
    lat: 13.7563,
    lng: 100.5018
  },
  {
    name: "Toronto",
    country: "🇨🇦 Canada",
    description: "Canada's largest Pride event, Church-Wellesley district",
    lat: 43.6532,
    lng: -79.3832
  },
  {
    name: "Amsterdam",
    country: "🇳🇱 Netherlands",
    description: "Marriage equality pioneer, canal Pride events",
    lat: 52.3676,
    lng: 4.9041
  },
  {
    name: "Mexico City",
    country: "🇲🇽 Mexico",
    description: "Rising queer culture in Latin America, huge festivals",
    lat: 19.4326,
    lng: -99.1332
  },
  {
    name: "Taipei",
    country: "🇹🇼 Taiwan",
    description: "First in Asia to legalize same-sex marriage, free and modern capital",
    lat: 25.0330,
    lng: 121.5654
  },
  {
    name: "Istanbul",
    country: "🇹🇷 Turkey",
    description: "Strong queer resistance despite challenges, intense cultural production and alternative scenes",
    lat: 41.0082,
    lng: 28.9784
  }
];

interface CreatePostProps {
  title?: string;
  canClose?: boolean;
  onClose?: () => void;
  placeholder?: string;
  buttonText?: string;
  parentPostId?: string;
  onReply?: (content: string, parentPostId?: string) => void;
  onPostCreated?: () => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ 
  title = "Create Post", 
  canClose = false, 
  onClose,
  placeholder = "What's on your mind? Share your thoughts, experiences, or ask a question...",
  buttonText = "Post",
  parentPostId,
  onReply,
  onPostCreated
}) => {
  const [postText, setPostText] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [hasEditorContent, setHasEditorContent] = useState(false);
  const [editorInstance, setEditorInstance] = useState<any>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<File[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [audience] = useState<'public' | 'community' | 'private'>('public');
  const [polls, setPolls] = useState<Array<{id: string, question: string, options: string[], duration: string}>>([]);
  const [isPollActive, setIsPollActive] = useState(false);
  const [isEventActive, setIsEventActive] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [location, setLocation] = useState<{ address: string; lat: number; lng: number } | null>(null);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [emojiSearchQuery, setEmojiSearchQuery] = useState('');
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState('smileys');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const { theme } = useTheme();
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

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const handleSubmit = async () => {
    // Check if there's any content to post
    if (!hasEditorContent && selectedImages.length === 0 && selectedVideos.length === 0) return;
    
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
        const extractHashtags = (node: any): string[] => {
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
        
        const extractMentions = (node: any): string[] => {
          const mentions: string[] = [];
          
          if (node.getType && node.getType() === 'mention') {
            const mentionName = (node as any).__mention || node.getTextContent();
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
    
    // Prepare post data with dot notation for polls
    const postData = {
      content: htmlContent || editorContent,
      hashtags: hashtags,
      mentions: mentions,
      images: selectedImages,
      videos: selectedVideos,
      audience: audience,
      ...(parentPostId && { parentPostId }),
      ...(polls.length > 0 && polls.reduce((acc, poll, pollIndex) => {
        acc[`polls[${pollIndex}].question`] = poll.question;
        acc[`polls[${pollIndex}].duration`] = poll.duration;
        poll.options.forEach((option, optionIndex) => {
          acc[`polls[${pollIndex}].options[${optionIndex}]`] = option;
        });
        return acc;
      }, {} as Record<string, any>)),
      event: isEventActive ? {
        title: eventTitle,
        description: eventDescription,
        date: eventDate,
        time: eventTime
      } : null,
      location: location
    };
    
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
      setEventDate('');
      setEventTime('');
      setPolls([]);
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
      duration: '0'
    };
    setPolls([...polls, newPoll]);
  };

  const removePoll = (pollId: string) => {
    setPolls(polls.filter(poll => poll.id !== pollId));
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
    if ((container as any)._leaflet_id) {
      delete (container as any)._leaflet_id;
    }

    try {
      // Create map with proper delay to ensure DOM is ready
      const initMap = () => {
        if (!mapRef.current || !location) return;

        // Ensure container has proper dimensions
        const container = mapRef.current;
        container.style.width = '100%';
        container.style.height = '288px';
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





  // Enhanced emoji categories with more emojis
  const emojiCategories = {
    smileys: [
      '�', '�', '😄', '�', '�', '😅', '🤣', '�', '�', '🙃', '😉', '😊', '😇', '🥰', '�😍', '�',
      '�', '😗', '☺️', '😚', '😙', '�', '�', '�', '�', '🤪', '�', '🤑', '🤗', '🤭', '🤫', '🤔',
      '🤐', '🤨', '�', '�', '�', '�', '�', '�', '😬', '�', '�', '�', '🤤', '�', '�', '🤒',
      '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '�', '🤯', '🤠', '🥳', '🥸', '�', '🤓', '�', '�'
    ],
    nature: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸',
      '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺',
      '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍',
      '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊'
    ],
    food: [
      '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝',
      '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐',
      '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭',
      '🍔', '🍟', '🍕', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🍝', '🍜', '🍲', '🍛'
    ],
    activities: [
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍',
      '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿',
      '⛷️', '🏂', '🪂', '🏋️‍♀️', '🏋️', '🏋️‍♂️', '🤼‍♀️', '🤼', '🤼‍♂️', '🤸‍♀️', '🤸', '🤸‍♂️', '⛹️‍♀️', '⛹️', '⛹️‍♂️', '🤺',
      '🤾‍♀️', '🤾', '🤾‍♂️', '🏌️‍♀️', '🏌️', '🏌️‍♂️', '🏇', '🧘‍♀️', '🧘', '🧘‍♂️', '🏄‍♀️', '🏄', '🏄‍♂️', '🏊‍♀️', '🏊', '🏊‍♂️'
    ],
    travel: [
      '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '�', '�🚚', '🚛', '🚜', '🏍️', '�',
      '🚲', '�🛴', '🛹', '🛼', '🚁', '🛸', '✈️', '🛩️', '🛫', '🛬', '🪂', '💺', '🚀', '🛰️', '🚢', '⛵',
      '🚤', '🛥️', '🛳️', '⛴️', '🚂', '�', '🚄', '🚅', '🚆', '🚇', '🚈', '🚉', '🚊', '🚝', '🚞', '🚋',
      '🚌', '🚍', '🎡', '🎢', '🎠', '🏗️', '🌁', '�', '🏭', '⛲', '🎡', '🎢', '🎪', '🚩', '🏁', '🏴'
    ],
    objects: [
      '⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🎮', '🎰', '🎲', '🧩', '🎭', '🎨',
      '🎬', '🎤', '🎧', '🎼', '🎵', '🎶', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🎪', '🎫', '🎟️',
      '📷', '📸', '📹', '📼', '💿', '💾', '💽', '💻', '📱', '☎️', '📞', '📟', '📠', '📺', '📻', '🎙️',
      '⏰', '🕰️', '⏲️', '⏱️', '🧭', '🎚️', '🎛️', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️'
    ],
    symbols: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖',
      '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈',
      '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳',
      '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️'
    ]
  };

  const audienceOptions = [
    { value: 'public', icon: Globe, label: 'Everyone', description: 'Anyone can see this post' },
    { value: 'community', icon: Users, label: 'Community', description: 'Only community members can see this post' },
    { value: 'private', icon: Lock, label: 'Private', description: 'Only you can see this post' },
  ];


  
  
  const editorConfig = {
    namespace: "TailwindRichText",
    editable: true,
    nodes:[HashtagNode, HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, AutoLinkNode,MentionNode],
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
       hashtag: "hashtag inline-block bg-[linear-gradient(to_right,_#d04b36,_#e36511,_#ffba00,_#00b180,_#147aab,_#675997)]  bg-clip-text text-transparent  font-semibold hover:underline cursor-pointer",
       mention:"mention font-semibold  font-md inline-block bg-[linear-gradient(to_right,_#d04b36,_#e36511,_#ffba00,_#00b180,_#147aab,_#675997)]  bg-clip-text text-transparent  font-semibold hover:underline cursor-pointer"
    },
    onError(error: Error) {
      console.error("Lexical Error:", error);
    },
  };
  


  const onChange = (editorState: any) => {
    editorState.read(() => {
      const root = $getRoot();
      const plainText = root.getTextContent();
      
      setEditorContent(plainText);
      setHasEditorContent(plainText.trim().length > 0);
      
      console.log('Editor content:', plainText);
    });
  };
  

  
  


  return (
    <>
      {/* Full Screen Overlay */}
      <AnimatePresence>
        {isFullScreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed nset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={toggleFullScreen}
          />
        )}
      </AnimatePresence>

      {/* Ultra-Professional Create Post Component */}
      <motion.div
        className={`w-full   transition-all duration-500 ${
          isFullScreen 
            ? 'fixed inset-0 z-50 max-w-none max-h-none rounded-none mb-0'
            : 'w-full max-w-full mb-6'
        } ${
          theme === 'dark'
            ? 'bg-black/60 backdrop-blur-xl shadow-black/20'
            : 'bg-white/90 backdrop-blur-xl shadow-gray-900/10'
        } ${isExpanded ? 'shadow-xl' : ''}`}
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ 
          opacity: 1, 
          y: 0, 
          scale: 1,
          width: isFullScreen ? '100%' : 'auto',
          height: isFullScreen ? '100%' : 'auto'
        }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        whileHover={!isFullScreen ? {
          y: -2,
          transition: { duration: 0.3 }
        } : {}}
      >
        {/* Compact Professional Header */}
        <div className={`${isFullScreen ? 'px-6 py-2' : 'px-4 py-3'} border-b ${
          theme === 'dark' ? 'border-gray-800/30' : 'border-gray-200/30'
        }`}>
          <div className="flex items-center justify-between">
            {/* Left: Title Only */}
            <div className="flex items-center">
              <h2 className={`text-base font-semibold tracking-tight ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {title}
              </h2>
            </div>
            
            {/* Right: Action Buttons */}
            <div className="flex items-center space-x-2">
              {/* Audience Selector - Compact */}
              <motion.button
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border transition-all duration-200 ${
                  theme === 'dark' 
                    ? 'bg-gray-800/40 border-gray-700/50 text-gray-300 hover:bg-gray-700/50 hover:text-white' 
                    : 'bg-gray-50/60 border-gray-200/60 text-gray-600 hover:bg-gray-100/80 hover:text-gray-800'
                }`}
                onClick={() => setIsExpanded(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {audienceOptions.find(opt => opt.value === audience)?.icon && 
                  React.createElement(audienceOptions.find(opt => opt.value === audience)!.icon, { className: "w-3.5 h-3.5" })
                }
                <span className="text-xs font-medium">{audienceOptions.find(opt => opt.value === audience)?.label}</span>
              </motion.button>

              {/* Full Screen Toggle Button - Compact */}
              <motion.button
                onClick={toggleFullScreen}
                className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${
                  isFullScreen
                    ? theme === 'dark'
                      ? 'bg-white/15 text-white border border-white/20'
                      : 'bg-black/8 text-black border border-black/15'
                    : theme === 'dark'
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800/40'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/60'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={isFullScreen ? "Exit full screen" : "Enter full screen"}
              >
                {isFullScreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </motion.button>

              {/* Close Button - Compact */}
              {canClose && onClose && (
                <motion.button
                  onClick={onClose}
                  className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${
                    theme === 'dark'
                      ? 'text-gray-400 hover:text-white hover:bg-gray-800/40'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/60'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className={`${isFullScreen ? 'px-6 py-1' : 'px-4 py-2'} w-full max-w-full`}>
          <div className="w-full max-w-full">
            {/* Content Input Area */}
            <div className="w-full max-w-full">
              {/* Professional Text Area */}
              <div className="relative w-full max-w-full">
       
              <div className="w-full max-w-full">
                <LexicalComposer  initialConfig={editorConfig}>
                  <div className="relative">
                    <HashtagPlugin/>
                    <ListPlugin/>
                    <LinkPlugin/>
                    <NewMentionsPlugin/>
                  
                    <div className="-mx-2 mt-1">
                      <ToolbarPluginWrapper setEditorInstance={setEditorInstance} />
                    </div>

                    <RichTextPlugin
                    
                      contentEditable={
                        <ContentEditable 
                          className="editor-input lexical-editor py-4 px-0 bg-red-500"
                          style={{
                            minHeight: isFullScreen ? '70dvh' : isExpanded ? '140px' : '80px',
                            maxHeight: isFullScreen ? '100%' : '100%',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word'
                          }}
                        />
                      }
                      placeholder={
                        <div className="pt-[24px] rounded-sm p-0 editor-placeholder w-full h-full text-start flex justify-start items-start">
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


                
                {/* Floating Character Counter */}
                <AnimatePresence>
                  {postText.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className={`absolute bottom-2 right-2 flex items-center space-x-2 px-3 py-1.5 rounded-full backdrop-blur-md ${
                        charCount > maxChars * 0.9 
                          ? 'bg-red-500/20 border border-red-500/30' 
                          : charCount > maxChars * 0.7 
                          ? 'bg-orange-500/20 border border-orange-500/30'
                          : theme === 'dark'
                          ? 'bg-gray-800/80 border border-gray-700/50'
                          : 'bg-white/80 border border-gray-200/50'
                      }`}
                    >
                      <span className={`text-xs font-medium ${
                        charCount > maxChars * 0.9 
                          ? 'text-red-500' 
                          : charCount > maxChars * 0.7 
                          ? 'text-orange-500'
                          : theme === 'dark' 
                          ? 'text-gray-300' 
                          : 'text-gray-600'
                      }`}>
                        {charCount}/{maxChars}
                      </span>
                      
                      {/* Circular Progress */}
                      <div className="relative w-5 h-5">
                        <svg className="w-5 h-5 transform -rotate-90" viewBox="0 0 20 20">
                          <circle
                            cx="10"
                            cy="10"
                            r="8"
                            stroke={theme === 'dark' ? '#374151' : '#E5E7EB'}
                            strokeWidth="2"
                            fill="none"
                          />
                          <circle
                            cx="10"
                            cy="10"
                            r="8"
                            stroke={
                              charCount > maxChars * 0.9 ? '#EF4444' :
                              charCount > maxChars * 0.7 ? '#F59E0B' : '#6B7280'
                            }
                            strokeWidth="2"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 8}`}
                            strokeDashoffset={`${2 * Math.PI * 8 * (1 - Math.min(charCount / maxChars, 1))}`}
                            className="transition-all duration-300"
                          />
                        </svg>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Attachments Section */}
        <div className={`w-full ${isFullScreen ? 'px-6 py-2' : 'p-4'}`}>
        <AnimatePresence>
          {(selectedImages.length > 0 || selectedVideos.length > 0 || location || polls.length > 0 || isEventActive || isEmojiPickerOpen || isLocationPickerOpen) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`w-full max-w-full`}
            >
              {/* Professional Image Preview */}
              {selectedImages.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                      }`}>
                        <Image className={`w-5 h-5 ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`} />
                      </div>
                      <div>
                        <h3 className={`font-bold text-base ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          Images
                        </h3>
                        <p className={`text-sm ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {selectedImages.length} image{selectedImages.length > 1 ? 's' : ''} selected
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedImages([])}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        theme === 'dark'
                          ? 'text-gray-400 hover:text-red-400 hover:bg-red-500/10 border border-gray-700 hover:border-red-500/30'
                          : 'text-gray-600 hover:text-red-500 hover:bg-red-50 border border-gray-200 hover:border-red-200'
                      }`}
                    >
                      Clear all
                    </button>
                  </div>

                  {/* Enhanced Media Grid */}
                  <div className={`grid gap-2 sm:gap-3 w-full max-w-full overflow-hidden ${
                    selectedImages.length === 1 ? 'grid-cols-1' :
                    selectedImages.length === 2 ? 'grid-cols-2' :
                    selectedImages.length === 3 ? 'grid-cols-2 sm:grid-cols-3' :
                    'grid-cols-2 sm:grid-cols-3'
                  }`}>
                    {selectedImages.map((file, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative group"
                      >
                        <div className={`relative rounded-2xl overflow-hidden ${
                          selectedImages.length === 1 ? 'h-48' : 'h-32'
                        } ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />

                          {/* File Type Badge */}
                          <div className="absolute top-2 left-2">
                            <div className={`px-2 py-1 rounded-lg text-xs font-bold bg-blue-500/80 text-white`}>
                              IMG
                            </div>
                          </div>

                          {/* Remove Button */}
                          <motion.button
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white hover:bg-red-600 flex items-center justify-center shadow-lg transition-all duration-200"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <X className="w-4 h-4" />
                          </motion.button>

                          {/* Overlay for extra files */}
                          {selectedImages.length > 6 && index === 5 && (
                            <div className="absolute inset-0 bg-black/70 rounded-2xl flex items-center justify-center">
                              <div className="text-center">
                                <Plus className="w-8 h-8 text-white mx-auto mb-1" />
                                <span className="text-white font-bold text-lg">
                                  +{selectedImages.length - 6}
                                </span>
                                <p className="text-white/80 text-xs">more files</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Professional Video Preview */}
              {selectedVideos.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                      }`}>
                        <Video className={`w-5 h-5 ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`} />
                      </div>
                      <div>
                        <h3 className={`font-bold text-base ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          Videos
                        </h3>
                        <p className={`text-sm ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {selectedVideos.length} video{selectedVideos.length > 1 ? 's' : ''} selected
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedVideos([])}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        theme === 'dark'
                          ? 'text-gray-400 hover:text-red-400 hover:bg-red-500/10 border border-gray-700 hover:border-red-500/30'
                          : 'text-gray-600 hover:text-red-500 hover:bg-red-50 border border-gray-200 hover:border-red-200'
                      }`}
                    >
                      Clear all
                    </button>
                  </div>

                  {/* Video Grid */}
                  <div className={`grid gap-2 sm:gap-3 w-full max-w-full overflow-hidden ${
                    selectedVideos.length === 1 ? 'grid-cols-1' :
                    selectedVideos.length === 2 ? 'grid-cols-2' :
                    selectedVideos.length === 3 ? 'grid-cols-2 sm:grid-cols-3' :
                    'grid-cols-2 sm:grid-cols-3'
                  }`}>
                    {selectedVideos.map((file, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative group"
                      >
                        <div className={`relative rounded-2xl overflow-hidden ${
                          selectedVideos.length === 1 ? 'h-48' : 'h-32'
                        } ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                          <div className="w-full h-full flex flex-col items-center justify-center space-y-2">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                            }`}>
                              <Video className={`w-6 h-6 ${
                                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                              }`} />
                            </div>
                            <div className="text-center px-2">
                              <p className={`text-xs font-medium truncate ${
                                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                {file.name}
                              </p>
                              <p className={`text-xs ${
                                theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                              }`}>
                                {(file.size / (1024 * 1024)).toFixed(1)} MB
                              </p>
                            </div>
                          </div>

                          {/* File Type Badge */}
                          <div className="absolute top-2 left-2">
                            <div className={`px-2 py-1 rounded-lg text-xs font-bold bg-purple-500/80 text-white`}>
                              VID
                            </div>
                          </div>

                          {/* Remove Button */}
                          <motion.button
                            onClick={() => removeVideo(index)}
                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white hover:bg-red-600 flex items-center justify-center shadow-lg transition-all duration-200"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <X className="w-4 h-4" />
                          </motion.button>

                          {/* Overlay for extra files */}
                          {selectedVideos.length > 6 && index === 5 && (
                            <div className="absolute inset-0 bg-black/70 rounded-2xl flex items-center justify-center">
                              <div className="text-center">
                                <Plus className="w-8 h-8 text-white mx-auto mb-1" />
                                <span className="text-white font-bold text-lg">
                                  +{selectedVideos.length - 6}
                                </span>
                                <p className="text-white/80 text-xs">more files</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Ultra-Professional Polls Section */}
              {polls.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                      }`}>
                        <BarChart3 className={`w-4 h-4 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`} />
                      </div>
                      <div>
                        <h3 className={`font-bold text-base ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          Polls
                        </h3>
                        <p className={`text-xs ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {polls.length} poll{polls.length > 1 ? 's' : ''} • Community engagement
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setPolls([])}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                        theme === 'dark'
                          ? 'text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-700 hover:border-gray-600'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      Clear all
                    </button>
                  </div>

                  <div className="space-y-3">
                    {polls.map((poll, pollIndex) => (
                      <motion.div
                        key={poll.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: pollIndex * 0.05 }}
                        className={`rounded-xl border overflow-hidden ${
                          theme === 'dark'
                            ? 'bg-gray-800/50 border-gray-700'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        {/* Ultra-Professional Poll Header */}
                        <div className={`px-4 py-3 border-b ${
                          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                        }`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-2">
                                <div className={`w-5 h-5 rounded-md flex items-center justify-center ${
                                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                                }`}>
                                  <BarChart3 className={`w-3 h-3 ${
                                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                                  }`} />
                                </div>
                                <span className={`text-xs font-semibold ${
                                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                  Poll {pollIndex + 1}
                                </span>
                              </div>
                              <input
                                type="text"
                                placeholder="What would you like to ask your community?"
                                value={poll.question}
                                onChange={(e) => updatePollQuestion(poll.id, e.target.value)}
                                className={`w-full px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
                                  theme === 'dark'
                                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-white focus:ring-white/30'
                                    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-black focus:ring-black/30'
                                }`}
                              />
                            </div>
                            <button
                              onClick={() => removePoll(poll.id)}
                              className={`p-1.5 ml-2 rounded-lg transition-colors flex-shrink-0 ${
                                theme === 'dark'
                                  ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                              }`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Ultra-Professional Poll Options */}
                        <div className="px-4 py-3">
                          <div className="space-y-2">
                            {poll.options.map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center space-x-2">
                                <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${
                                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                                }`}>
                                  <span className={`text-xs font-bold ${
                                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                                  }`}>
                                    {optionIndex + 1}
                                  </span>
                                </div>
                                <input
                                  type="text"
                                  placeholder={`Option ${optionIndex + 1}`}
                                  value={option}
                                  onChange={(e) => updatePollOption(poll.id, optionIndex, e.target.value)}
                                  className={`flex-1 px-2.5 py-1.5 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
                                    theme === 'dark'
                                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-white focus:ring-white/30'
                                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-black focus:ring-black/30'
                                  }`}
                                />
                                {poll.options.length > 2 && (
                                  <button
                                    onClick={() => removePollOption(poll.id, optionIndex)}
                                    className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
                                      theme === 'dark'
                                        ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            ))}

                            {/* Ultra-Professional Add Option Button */}
                            <button
                              onClick={() => addPollOption(poll.id)}
                              className={`w-full flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg border transition-all duration-200 ${
                                theme === 'dark'
                                  ? 'border-gray-600 text-gray-400 hover:text-white hover:bg-gray-700 hover:border-gray-500'
                                  : 'border-gray-300 text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-400'
                              }`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span className="text-xs font-medium">Add option</span>
                            </button>
                          </div>
                        </div>

                        {/* Ultra-Professional Poll Duration */}
                        <div className={`px-4 py-2.5 border-t ${
                          theme === 'dark' ? 'border-gray-700 bg-gray-800/30' : 'border-gray-200 bg-gray-50/50'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1.5">
                              <Clock className={`w-3.5 h-3.5 ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`} />
                              <span className={`text-xs font-medium ${
                                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                Duration
                              </span>
                            </div>
                            <div className="flex items-center space-x-1.5">
                              {[
                                { value: '0', icon: '♾️', label: '∞' },
                                { value: '1', icon: '📅', label: '1d' },
                                { value: '3', icon: '📆', label: '3d' },
                                { value: '7', icon: '🗓️', label: '1w' },
                                { value: '30', icon: '📋', label: '1m' }
                              ].map((duration) => (
                                <motion.button
                                  key={duration.value}
                                  onClick={() => updatePollDuration(poll.id, duration.value)}
                                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 flex items-center space-x-1 ${
                                    poll.duration === duration.value
                                      ? theme === 'dark'
                                        ? 'bg-white text-black shadow-lg'
                                        : 'bg-black text-white shadow-lg'
                                      : theme === 'dark'
                                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                                  }`}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <span className="text-xs">{duration.icon}</span>
                                  <span className="text-xs font-bold">{duration.label}</span>
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Professional Location Display with Leaflet Map */}
              {location && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6"
                >
                  <div className={`rounded-2xl border overflow-hidden shadow-lg ${
                    theme === 'dark'
                      ? 'bg-gray-800/50 border-gray-700'
                      : 'bg-white border-gray-200'
                  }`}>
                    {/* Professional Map Preview */}
                    <div className="relative h-72 overflow-hidden">
                      <div
                        ref={mapRef}
                        className="w-full h-full relative"
                        style={{
                          zIndex: 1,
                          minHeight: '288px',
                          height: '288px',
                          width: '100%'
                        }}
                      />

                      {/* Professional Map Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

                      {/* Glass Effect Location Info Overlay */}
                      <div className="absolute bottom-4 left-4 right-4 z-10">
                        <div className={`backdrop-blur-xl rounded-2xl shadow-2xl border ${
                          theme === 'dark'
                            ? 'bg-black/60 border-white/20'
                            : 'bg-white/80 border-black/20'
                        }`}>
                          <div className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                theme === 'dark' ? 'bg-white/20' : 'bg-black/10'
                              }`}>
                                <MapPin className={`w-5 h-5 ${
                                  theme === 'dark' ? 'text-white' : 'text-gray-800'
                                }`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`font-bold text-sm ${
                                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {(() => {
                                    const parts = location.address.split(',');
                                    const city = parts[parts.length - 3]?.trim() || parts[0]?.trim();
                                    const country = parts[parts.length - 1]?.trim();
                                    return city && country ? `${city}, ${country}` : location.address.split(',')[0];
                                  })()}
                                </p>
                                <p className={`text-xs mt-0.5 ${
                                  theme === 'dark' ? 'text-white/70' : 'text-gray-600'
                                }`}>
                                  {(() => {
                                    const parts = location.address.split(',');
                                    return parts.slice(0, -2).join(', ').trim() || 'Exact location';
                                  })()}
                                </p>
                              </div>
                              <button
                                onClick={() => setLocation(null)}
                                className={`p-2 rounded-lg transition-colors ${
                                  theme === 'dark'
                                    ? 'text-white/70 hover:text-white hover:bg-white/20'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-black/10'
                                }`}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Map Attribution */}
                      
                    </div>


                  </div>
                </motion.div>
              )}

              {/* Event Creation Section */}
              {isEventActive && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mb-6"
                >
                  <div className={`px-6 py-5 rounded-2xl border ${
                    theme === 'dark'
                      ? 'bg-gray-800/50 border-gray-700'
                      : 'bg-white border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                        }`}>
                          <Calendar className={`w-5 h-5 ${
                            theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                          }`} />
                        </div>
                        <div>
                          <h3 className={`font-bold text-base ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            Create Event
                          </h3>
                          <p className={`text-sm ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            Plan something with your community
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsEventActive(false)}
                        className={`p-2 rounded-lg transition-colors ${
                          theme === 'dark'
                            ? 'text-gray-400 hover:text-red-400 hover:bg-red-500/10'
                            : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
                        }`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-4 w-full max-w-full">
                      <input
                        type="text"
                        placeholder="Event title"
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
                          theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-gray-500 focus:ring-gray-500'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-400 focus:ring-gray-400'
                        }`}
                      />

                      <textarea
                        placeholder="Event description (optional)"
                        value={eventDescription}
                        onChange={(e) => setEventDescription(e.target.value)}
                        rows={3}
                        className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 resize-none ${
                          theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-gray-500 focus:ring-gray-500'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-400 focus:ring-gray-400'
                        }`}
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="date"
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                          className={`px-4 py-3 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
                            theme === 'dark'
                              ? 'bg-gray-700 border-gray-600 text-white focus:border-gray-500 focus:ring-gray-500'
                              : 'bg-white border-gray-300 text-gray-900 focus:border-gray-400 focus:ring-gray-400'
                          }`}
                        />
                        <input
                          type="time"
                          value={eventTime}
                          onChange={(e) => setEventTime(e.target.value)}
                          className={`px-4 py-3 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
                            theme === 'dark'
                              ? 'bg-gray-700 border-gray-600 text-white focus:border-gray-500 focus:ring-gray-500'
                              : 'bg-white border-gray-300 text-gray-900 focus:border-gray-400 focus:ring-gray-400'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Emoji Picker Inside Attachments */}
              {isEmojiPickerOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mb-6"
                >
                  <div className={`p-6 rounded-2xl border ${
                    theme === 'dark'
                      ? 'bg-gray-800/50 border-gray-700'
                      : 'bg-white border-gray-200'
                  }`}>
                    {/* Emoji Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                        }`}>
                          <Smile className={`w-5 h-5 ${
                            theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
                          }`} />
                        </div>
                        <div>
                          <h3 className={`font-bold text-base ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            Add Emoji
                          </h3>
                          <p className={`text-sm ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            Express yourself with emojis
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsEmojiPickerOpen(false)}
                        className={`p-2 rounded-lg transition-colors ${
                          theme === 'dark'
                            ? 'text-gray-400 hover:text-red-400 hover:bg-red-500/10'
                            : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
                        }`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Emoji Search */}
                    <div className="mb-4">
                      <div className="relative">
                        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`} />
                        <input
                          type="text"
                          placeholder="Search emojis..."
                          value={emojiSearchQuery}
                          onChange={(e) => setEmojiSearchQuery(e.target.value)}
                          className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
                            theme === 'dark'
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-gray-500 focus:ring-gray-500'
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-400 focus:ring-gray-400'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Emoji Categories */}
                    <div className="flex items-center space-x-1 sm:space-x-2 mb-4 overflow-x-auto scroll-none pb-2">
                      {Object.keys(emojiCategories).map((category) => (
                        <button
                          key={category}
                          onClick={() => setSelectedEmojiCategory(category)}
                          className={`flex-shrink-0 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                            selectedEmojiCategory === category
                              ? theme === 'dark'
                                ? 'bg-white text-black'
                                : 'bg-black text-white'
                              : theme === 'dark'
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </button>
                      ))}
                    </div>

                    {/* Emoji Grid */}
                    <div className="max-h-40 sm:max-h-48 overflow-y-auto scroll-none px-2">
                      <div className="grid grid-cols-8 gap-2 w-full place-items-center">
                        {emojiCategories[selectedEmojiCategory as keyof typeof emojiCategories]
                          .filter(emoji =>
                            emojiSearchQuery === '' ||
                            emoji.includes(emojiSearchQuery)
                          )
                          .map((emoji, index) => (
                            <motion.button
                              key={index}
                              onClick={() => {
                                setPostText(prev => prev + emoji);
                                setCharCount(prev => prev + emoji.length);
                              }}
                              className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all duration-200 ${
                                theme === 'dark'
                                  ? 'hover:bg-gray-700'
                                  : 'hover:bg-gray-100'
                              }`}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              {emoji}
                            </motion.button>
                          ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Location Picker Inside Attachments */}
              {isLocationPickerOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mb-6"
                >
                  <div className={`rounded-2xl border overflow-hidden shadow-lg ${
                    theme === 'dark'
                      ? 'bg-gray-800/50 border-gray-700'
                      : 'bg-white border-gray-200'
                  }`}>
                    {/* Location Picker Header */}
                    <div className={`flex items-center justify-between p-4 border-b ${
                      theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          theme === 'dark' ? 'bg-orange-500/20' : 'bg-orange-50'
                        }`}>
                          <MapPin className={`w-5 h-5 ${
                            theme === 'dark' ? 'text-orange-400' : 'text-orange-600'
                          }`} />
                        </div>
                        <div>
                          <h4 className={`font-semibold ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            Add Location
                          </h4>
                          <p className={`text-sm ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Share where you are
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsLocationPickerOpen(false)}
                        className={`p-2 rounded-lg transition-colors ${
                          theme === 'dark'
                            ? 'text-gray-400 hover:text-red-400 hover:bg-red-500/10'
                            : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
                        }`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Location Picker Content */}
                    <div className="p-4 space-y-4">
                      <button
                        onClick={getCurrentLocation}
                        disabled={isGettingLocation}
                        className={`w-full flex items-center justify-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                          isGettingLocation
                            ? theme === 'dark'
                              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : theme === 'dark'
                            ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30'
                            : 'bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200'
                        }`}
                      >
                        {isGettingLocation ? (
                          <>
                            <div className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin ${
                              theme === 'dark' ? 'border-gray-500' : 'border-gray-400'
                            }`} />
                            <span>Getting location...</span>
                          </>
                        ) : (
                          <>
                            <Navigation className="w-4 h-4" />
                            <span>Use Current Location</span>
                          </>
                        )}
                      </button>

                      {/* Divider */}
                      <div className={`flex items-center ${
                        theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        <div className={`flex-1 h-px ${
                          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                        }`} />
                        <span className="px-3 text-xs font-medium">or choose popular</span>
                        <div className={`flex-1 h-px ${
                          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                        }`} />
                      </div>

                      {/* Popular Locations */}
                      <div className="max-h-64  p-4 scrollbar-hide overflow-y-auto space-y-2">
                        {popularLocations.map((loc, index) => (
                          <motion.button
                            key={index}
                            onClick={() => {
                              setLocation({
                                address: `${loc.name}, ${loc.country}`,
                                lat: loc.lat,
                                lng: loc.lng
                              });
                              setIsLocationPickerOpen(false);
                            }}
                            className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${
                              theme === 'dark'
                                ? 'hover:bg-gray-700 border border-gray-700 hover:border-gray-600'
                                : 'hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
                            }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${
                                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                              }`}>
                                🏳️‍🌈
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <h4 className={`font-semibold text-sm ${
                                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                                  }`}>
                                    {loc.name}
                                  </h4>
                                  <span className="text-xs">{loc.country.split(' ')[0]}</span>
                                </div>
                                <p className={`text-xs mt-1 ${
                                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  {loc.description}
                                </p>
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        </div>

        {/* Compact Action Bar */}
        <div className={`flex items-center justify-between ${isFullScreen ? 'px-6 py-2' : 'px-4 py-2.5'} border-t w-full max-w-full ${
          theme === 'dark' ? 'border-gray-800/30' : 'border-gray-200/30'
        }`}>
          {/* Compact Action Buttons */}
          <div className="flex items-center space-x-0.5 flex-shrink-0">
            {/* Photo Upload */}
            <motion.button
              onClick={() => fileInputRef.current?.click()}
              className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 flex-shrink-0 ${
                selectedImages.some(f => f.type.startsWith('image/'))
                  ? theme === 'dark'
                    ? 'bg-blue-500/15 text-blue-400'
                    : 'bg-blue-50 text-blue-600'
                  : theme === 'dark'
                  ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
              }`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              title="Add photos"
            >
              <Image className="w-4 h-4" />
            </motion.button>

            {/* Video Upload */}
            <motion.button
              onClick={() => videoInputRef.current?.click()}
              className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 flex-shrink-0 ${
                selectedVideos.length > 0
                  ? theme === 'dark'
                    ? 'bg-purple-500/15 text-purple-400'
                    : 'bg-purple-50 text-purple-600'
                  : theme === 'dark'
                  ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
              }`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              title="Add videos"
            >
              <Video className="w-4 h-4" />
            </motion.button>

            {/* Poll */}
            <motion.button
              onClick={addPoll}
              className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 flex-shrink-0 ${
                polls.length > 0
                  ? theme === 'dark'
                    ? 'bg-white/15 text-white'
                    : 'bg-black/10 text-black'
                  : theme === 'dark'
                  ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
              }`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              title="Add a poll"
            >
              <BarChart3 className="w-4 h-4" />
            </motion.button>

            {/* Emoji */}
            <motion.button
              onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
              className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 flex-shrink-0 ${
                isEmojiPickerOpen
                  ? theme === 'dark'
                    ? 'bg-yellow-500/15 text-yellow-400'
                    : 'bg-yellow-50 text-yellow-600'
                  : theme === 'dark'
                  ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
              }`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              title="Add emoji"
            >
              <Smile className="w-4 h-4" />
            </motion.button>

            {/* Event */}
            <motion.button
              onClick={() => setIsEventActive(!isEventActive)}
              className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 flex-shrink-0 ${
                isEventActive
                  ? theme === 'dark'
                    ? 'bg-purple-500/15 text-purple-400'
                    : 'bg-purple-50 text-purple-600'
                  : theme === 'dark'
                  ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
              }`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              title="Create event"
            >
              <Calendar className="w-4 h-4" />
            </motion.button>

            {/* Location */}
            <motion.button
              onClick={() => setIsLocationPickerOpen(!isLocationPickerOpen)}
              className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 flex-shrink-0 ${
                location || isLocationPickerOpen
                  ? theme === 'dark'
                    ? 'bg-orange-500/15 text-orange-400'
                    : 'bg-orange-50 text-orange-600'
                  : theme === 'dark'
                  ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
              }`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              title="Add location"
            >
              <MapPin className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Compact Post Button */}
          <motion.button
            disabled={(!hasEditorContent && selectedImages.length === 0 && selectedVideos.length === 0) || isSubmitting || charCount > maxChars}
            className={`px-5 py-2 rounded-lg font-semibold text-sm transition-all duration-200 flex-shrink-0 ${
              hasEditorContent || selectedImages.length > 0 || selectedVideos.length > 0
                ? theme === 'dark'
                  ? 'bg-white text-black hover:bg-gray-100'
                  : 'bg-black text-white hover:bg-gray-800'
                : theme === 'dark'
                  ? 'bg-gray-800/50 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-200/50 text-gray-400 cursor-not-allowed'
            } ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
            whileHover={(!hasEditorContent && selectedImages.length === 0 && selectedVideos.length === 0) || isSubmitting ? {} : { scale: 1.02 }}
            whileTap={(!hasEditorContent && selectedImages.length === 0 && selectedVideos.length === 0) || isSubmitting ? {} : { scale: 0.98 }}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-1.5">
                <div className={`w-3 h-3 border-2 border-t-transparent rounded-full animate-spin ${
                  theme === 'dark' ? 'border-black' : 'border-white'
                }`} />
                <span>Publishing...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{buttonText}</span>
              </div>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      <input
        ref={videoInputRef}
        type="file"
        multiple
        accept="video/*"
        onChange={handleVideoUpload}
        className="hidden"
      />




    </>
  );
};

export default CreatePost;
