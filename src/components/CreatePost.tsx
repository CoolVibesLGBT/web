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


interface CreatePostProps {
  title?: string;
  canClose?: boolean;
  onClose?: () => void;
  placeholder?: string;
  buttonText?: string;
  parentPostId?: string;
  fullScreen?:boolean;
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
  fullScreen = false,
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
  const [isFullScreen, setIsFullScreen] = useState(fullScreen);
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

    const contentJSON = editorInstance.getEditorState().toJSON()
    const postData = {
      content: JSON.stringify(contentJSON),
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
    namespace: "CoolVibesEditor",
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
    });
  };
  

  
  


  return (
    <div style={{
      zIndex:100,
    }} className={`${isFullScreen ? "fixed left-[0] right-[0] bottom-[0] top-[65] scrollbar-hide md:top-0 w-full z-[999] min-h-[100dvh] h-[100dvh] max-h-[100dvh] overflow-y-scroll scrollbar-hide" : "scrollbar-hide"} ${theme === 'dark' ? "bg-black" : "bg-white"}`}>



      {/* Ultra-Professional Create Post Component */}
      <motion.div
        className={`w-full ${isFullScreen ? 'h-full flex  max-h-[calc(100dvh - 200px)] scrollbar-hide overflow-y-scroll  flex-col' : 'flex flex-col'} transition-all duration-500 `}>
        {/* Compact Professional Header */}
        <div className={`${isFullScreen ? 'px-3 sm:px-6 py-2 mb-[400px] lg:mb-0' : 'px-3 sm:px-4 py-2 sm:py-3'} border-b flex-shrink-0 ${
          theme === 'dark' ? 'border-gray-800/30' : 'border-gray-200/30'
        }`}>
      
          <div className="flex items-center justify-between">
            {/* Left: Title Only */}
            <div className="flex items-center flex-1 min-w-0">
              <h2 className={`text-sm sm:text-base font-semibold tracking-tight truncate ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {title}
              </h2>
            </div>
            
            {/* Right: Action Buttons */}
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              {/* Audience Selector - Compact */}
              <motion.button
                className={`flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border transition-all duration-200 ${
                  theme === 'dark' 
                    ? 'bg-gray-800/40 border-gray-700/50 text-gray-300 hover:bg-gray-700/50 hover:text-white active:bg-gray-700/50' 
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
                onClick={toggleFullScreen}
                className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg transition-all duration-200 ${
                  isFullScreen
                    ? theme === 'dark'
                      ? 'bg-white/15 text-white border border-white/20 active:bg-white/20'
                      : 'bg-black/8 text-black border border-black/15 active:bg-black/15'
                    : theme === 'dark'
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800/40 active:bg-gray-800/40'
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
                  className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg transition-all duration-200 ${
                    theme === 'dark'
                      ? 'text-gray-400 hover:text-white hover:bg-gray-800/40 active:bg-gray-800/40'
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
        <div className={`${isFullScreen ? 'px-3 sm:px-6 py-1' : 'px-3 sm:px-4 py-2'} w-full max-w-full flex-shrink-0`}>
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

        {/* Professional Attachments Section - Scrollable */}
        <div className={`w-full ${isFullScreen ? 'flex-1' : ''} ${isFullScreen ? 'px-3 sm:px-6 py-2' : 'px-3 sm:p-4'} ${isFullScreen ? 'overflow-y-auto' : ''} scrollbar-hide`}>
        <AnimatePresence>
          {(selectedImages.length > 0 || selectedVideos.length > 0 || location || polls.length > 0 || isEventActive || isEmojiPickerOpen || isLocationPickerOpen) && (
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
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-xl flex-shrink-0 ${
                        theme === 'dark' 
                          ? 'bg-white/5 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]' 
                          : 'bg-black/5 border border-black/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.08)]'
                      }`}>
                        <Image className={`w-4 h-4 sm:w-5 sm:h-5 ${
                          theme === 'dark' ? 'text-white/90' : 'text-gray-900/90'
                        }`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className={`text-sm sm:text-base font-semibold tracking-tight truncate ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {selectedImages.length + selectedVideos.length} {selectedImages.length + selectedVideos.length === 1 ? 'Media' : 'Media'}
                        </h3>
                        <p className={`text-[10px] sm:text-xs font-medium tracking-wide truncate ${
                          theme === 'dark' ? 'text-white/50' : 'text-gray-500'
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
                      className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold transition-all duration-300 backdrop-blur-xl flex-shrink-0 ${
                        theme === 'dark'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40'
                          : 'bg-red-50 text-red-600 border border-red-200/50 hover:bg-red-100 hover:border-red-300'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Clear All
                    </motion.button>
                  </div>

                  {/* Apple-Level Smart Media Grid */}
                  {(() => {
                    const totalMedia = selectedImages.length + selectedVideos.length;
                    const allMedia = [
                      ...selectedImages.map((file, idx) => ({ type: 'image', file, index: idx })),
                      ...selectedVideos.map((file, idx) => ({ type: 'video', file, index: idx }))
                    ];

                    // Single media - Premium Full Width
                    if (totalMedia === 1) {
                      const media = allMedia[0];
                      return (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                          className={`relative group rounded-2xl sm:rounded-3xl overflow-hidden ${
                            theme === 'dark' 
                              ? 'bg-white/5 border border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]' 
                              : 'bg-white border border-gray-200/50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]'
                          }`}
                        >
                          {media.type === 'image' ? (
                            <>
                              <img
                                src={URL.createObjectURL(media.file)}
                                alt="Preview"
                                className="w-full h-auto max-h-[400px] sm:max-h-[600px] object-cover"
                              />
                              <motion.button
                                onClick={() => removeImage(media.index)}
                                className="absolute top-3 right-3 sm:top-5 sm:right-5 w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl backdrop-blur-2xl bg-black/60 border border-white/20 hover:bg-black/80 active:bg-black/80 flex items-center justify-center shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] transition-all duration-300"
                                whileHover={{ scale: 1.08, rotate: 90 }}
                                whileTap={{ scale: 0.92 }}
                              >
                                <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                              </motion.button>
                            </>
                          ) : (
                            <>
                              <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 aspect-video flex items-center justify-center">
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.2, duration: 0.5 }}
                                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl backdrop-blur-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]"
                                  >
                                    <Video className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                                  </motion.div>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/80 to-transparent">
                                  <p className="text-sm sm:text-base font-semibold text-white truncate">{media.file.name}</p>
                                  <p className="text-xs sm:text-sm text-white/60 mt-1 sm:mt-1.5 font-medium">{(media.file.size / (1024 * 1024)).toFixed(1)} MB</p>
                                </div>
                                <motion.button
                                  onClick={() => removeVideo(media.index)}
                                  className="absolute top-3 right-3 sm:top-5 sm:right-5 w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl backdrop-blur-2xl bg-black/60 border border-white/20 hover:bg-black/80 active:bg-black/80 flex items-center justify-center shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] transition-all duration-300"
                                  whileHover={{ scale: 1.08, rotate: 90 }}
                                  whileTap={{ scale: 0.92 }}
                                >
                                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                </motion.button>
                              </div>
                            </>
                          )}
                        </motion.div>
                      );
                    }

                    // Two media - Premium Side by Side
                    if (totalMedia === 2) {
                      return (
                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                          {allMedia.map((media, idx) => (
                            <motion.div
                              key={`${media.type}-${idx}`}
                              initial={{ opacity: 0, scale: 0.96 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: idx * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                              className={`relative group rounded-2xl sm:rounded-3xl overflow-hidden backdrop-blur-xl ${
                                theme === 'dark' 
                                  ? 'bg-white/5 border border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]' 
                                  : 'bg-white border border-gray-200/50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]'
                              }`}
                            >
                              {media.type === 'image' ? (
                                <>
                                  <img
                                    src={URL.createObjectURL(media.file)}
                                    alt={`Preview ${idx + 1}`}
                                    className="w-full h-full min-h-[160px] sm:min-h-[280px] object-cover"
                                  />
                                  <motion.button
                                    onClick={() => removeImage(media.index)}
                                    className="absolute top-2 right-2 sm:top-4 sm:right-4 w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl backdrop-blur-2xl bg-black/60 border border-white/20 hover:bg-black/80 active:bg-black/80 flex items-center justify-center shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] opacity-0 group-hover:opacity-100 sm:group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-300"
                                    whileHover={{ scale: 1.08, rotate: 90 }}
                                    whileTap={{ scale: 0.92 }}
                                  >
                                    <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                  </motion.button>
                                </>
                              ) : (
                                <>
                                  <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 aspect-square min-h-[160px] sm:min-h-[280px] flex items-center justify-center">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <motion.div
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: idx * 0.2 + 0.2, duration: 0.5 }}
                                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl backdrop-blur-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]"
                                      >
                                        <Video className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                                      </motion.div>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/95 via-black/80 to-transparent">
                                      <p className="text-xs sm:text-sm font-semibold text-white truncate">{media.file.name}</p>
                                      <p className="text-[10px] sm:text-xs text-white/60 mt-0.5 sm:mt-1 font-medium">{(media.file.size / (1024 * 1024)).toFixed(1)} MB</p>
                                    </div>
                                    <motion.button
                                      onClick={() => removeVideo(media.index)}
                                      className="absolute top-2 right-2 sm:top-4 sm:right-4 w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl backdrop-blur-2xl bg-black/60 border border-white/20 hover:bg-black/80 active:bg-black/80 flex items-center justify-center shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] opacity-0 group-hover:opacity-100 sm:group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-300"
                                      whileHover={{ scale: 1.08, rotate: 90 }}
                                      whileTap={{ scale: 0.92 }}
                                    >
                                      <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                    </motion.button>
                                  </div>
                                </>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      );
                    }

                    // Three media - Apple-Style Layout
                    if (totalMedia === 3) {
                      return (
                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                          {/* Large left */}
                          <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            className={`row-span-2 relative group rounded-2xl sm:rounded-3xl overflow-hidden backdrop-blur-xl ${
                              theme === 'dark' 
                                ? 'bg-white/5 border border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]' 
                                : 'bg-white border border-gray-200/50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]'
                            }`}
                          >
                            {allMedia[0].type === 'image' ? (
                              <>
                                <img
                                  src={URL.createObjectURL(allMedia[0].file)}
                                  alt="Preview 1"
                                  className="w-full h-full min-h-[300px] sm:min-h-[500px] object-cover"
                                />
                                <motion.button
                                  onClick={() => removeImage(allMedia[0].index)}
                                  className="absolute top-2 right-2 sm:top-4 sm:right-4 w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl backdrop-blur-2xl bg-black/60 border border-white/20 hover:bg-black/80 active:bg-black/80 flex items-center justify-center shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] opacity-0 group-hover:opacity-100 sm:group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-300"
                                  whileHover={{ scale: 1.08, rotate: 90 }}
                                  whileTap={{ scale: 0.92 }}
                                >
                                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                </motion.button>
                              </>
                            ) : (
                              <>
                                <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 aspect-[4/5] min-h-[300px] sm:min-h-[500px] flex items-center justify-center">
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <motion.div
                                      initial={{ scale: 0.8, opacity: 0 }}
                                      animate={{ scale: 1, opacity: 1 }}
                                      transition={{ delay: 0.2, duration: 0.5 }}
                                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl backdrop-blur-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]"
                                    >
                                      <Video className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                                    </motion.div>
                                  </div>
                                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 bg-gradient-to-t from-black/95 via-black/80 to-transparent">
                                    <p className="text-sm sm:text-base font-semibold text-white truncate">{allMedia[0].file.name}</p>
                                    <p className="text-xs sm:text-sm text-white/60 mt-1 sm:mt-1.5 font-medium">{(allMedia[0].file.size / (1024 * 1024)).toFixed(1)} MB</p>
                                  </div>
                                  <motion.button
                                    onClick={() => removeVideo(allMedia[0].index)}
                                    className="absolute top-2 right-2 sm:top-4 sm:right-4 w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl backdrop-blur-2xl bg-black/60 border border-white/20 hover:bg-black/80 active:bg-black/80 flex items-center justify-center shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] opacity-0 group-hover:opacity-100 sm:group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-300"
                                    whileHover={{ scale: 1.08, rotate: 90 }}
                                    whileTap={{ scale: 0.92 }}
                                  >
                                    <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                  </motion.button>
                                </div>
                              </>
                            )}
                          </motion.div>
                          {/* Two small right */}
                          {allMedia.slice(1).map((media, idx) => (
                            <motion.div
                              key={`${media.type}-${idx + 1}`}
                              initial={{ opacity: 0, scale: 0.96 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: (idx + 1) * 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                              className={`relative group rounded-2xl sm:rounded-3xl overflow-hidden backdrop-blur-xl ${
                                theme === 'dark' 
                                  ? 'bg-white/5 border border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]' 
                                  : 'bg-white border border-gray-200/50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]'
                              }`}
                            >
                              {media.type === 'image' ? (
                                <>
                                  <img
                                    src={URL.createObjectURL(media.file)}
                                    alt={`Preview ${idx + 2}`}
                                    className="w-full h-full min-h-[145px] sm:min-h-[245px] object-cover"
                                  />
                                  <motion.button
                                    onClick={() => removeImage(media.index)}
                                    className="absolute top-2 right-2 sm:top-3 sm:right-3 w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl backdrop-blur-2xl bg-black/60 border border-white/20 hover:bg-black/80 active:bg-black/80 flex items-center justify-center shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] opacity-0 group-hover:opacity-100 sm:group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-300"
                                    whileHover={{ scale: 1.08, rotate: 90 }}
                                    whileTap={{ scale: 0.92 }}
                                  >
                                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                                  </motion.button>
                                </>
                              ) : (
                                <>
                                  <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 aspect-square min-h-[145px] sm:min-h-[245px] flex items-center justify-center">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <motion.div
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: (idx + 1) * 0.2 + 0.3, duration: 0.5 }}
                                        className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl sm:rounded-3xl backdrop-blur-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]"
                                      >
                                        <Video className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                                      </motion.div>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 bg-gradient-to-t from-black/95 via-black/80 to-transparent">
                                      <p className="text-xs sm:text-sm font-semibold text-white truncate">{media.file.name}</p>
                                      <p className="text-[10px] sm:text-xs text-white/60 mt-0.5 sm:mt-1 font-medium">{(media.file.size / (1024 * 1024)).toFixed(1)} MB</p>
                                    </div>
                                    <motion.button
                                      onClick={() => removeVideo(media.index)}
                                      className="absolute top-2 right-2 sm:top-3 sm:right-3 w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl backdrop-blur-2xl bg-black/60 border border-white/20 hover:bg-black/80 active:bg-black/80 flex items-center justify-center shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] opacity-0 group-hover:opacity-100 sm:group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-300"
                                      whileHover={{ scale: 1.08, rotate: 90 }}
                                      whileTap={{ scale: 0.92 }}
                                    >
                                      <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                                    </motion.button>
                                  </div>
                                </>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      );
                    }

                    // Four or more - Apple-Level Grid Layout
                    return (
                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        {allMedia.map((media, idx) => {
                          // Show first 4, if more show overlay on 4th
                          const showOverlay = idx === 3 && totalMedia > 4;
                          return (
                            <motion.div
                              key={`${media.type}-${idx}`}
                              initial={{ opacity: 0, scale: 0.96 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: idx * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                              className={`relative group rounded-2xl sm:rounded-3xl overflow-hidden backdrop-blur-xl ${
                                theme === 'dark' 
                                  ? 'bg-white/5 border border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]' 
                                  : 'bg-white border border-gray-200/50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]'
                              }`}
                            >
                              {media.type === 'image' ? (
                                <>
                                  <img
                                    src={URL.createObjectURL(media.file)}
                                    alt={`Preview ${idx + 1}`}
                                    className="w-full h-full min-h-[140px] sm:min-h-[220px] object-cover"
                                  />
                                  {showOverlay && (
                                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center rounded-2xl sm:rounded-3xl">
                                      <div className="text-center">
                                        <p className="text-xl sm:text-3xl font-bold text-white tracking-tight">+{totalMedia - 4}</p>
                                        <p className="text-xs sm:text-sm text-white/80 mt-1 sm:mt-2 font-medium">more</p>
                                      </div>
                                    </div>
                                  )}
                                  {!showOverlay && (
                                    <motion.button
                                      onClick={() => removeImage(media.index)}
                                      className="absolute top-2 right-2 sm:top-3 sm:right-3 w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl backdrop-blur-2xl bg-black/60 border border-white/20 hover:bg-black/80 active:bg-black/80 flex items-center justify-center shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] opacity-0 group-hover:opacity-100 sm:group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-300"
                                      whileHover={{ scale: 1.08, rotate: 90 }}
                                      whileTap={{ scale: 0.92 }}
                                    >
                                      <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                                    </motion.button>
                                  )}
                                </>
                              ) : (
                                <>
                                  <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 aspect-square min-h-[140px] sm:min-h-[220px] flex items-center justify-center">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <motion.div
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: idx * 0.1 + 0.2, duration: 0.5 }}
                                        className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl sm:rounded-3xl backdrop-blur-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]"
                                      >
                                        <Video className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                                      </motion.div>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 bg-gradient-to-t from-black/95 via-black/80 to-transparent">
                                      <p className="text-xs sm:text-sm font-semibold text-white truncate">{media.file.name}</p>
                                      <p className="text-[10px] sm:text-xs text-white/60 mt-0.5 sm:mt-1 font-medium">{(media.file.size / (1024 * 1024)).toFixed(1)} MB</p>
                                    </div>
                                    {showOverlay && (
                                      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center rounded-2xl sm:rounded-3xl">
                                        <div className="text-center">
                                          <p className="text-xl sm:text-3xl font-bold text-white tracking-tight">+{totalMedia - 4}</p>
                                          <p className="text-xs sm:text-sm text-white/80 mt-1 sm:mt-2 font-medium">more</p>
                                        </div>
                                      </div>
                                    )}
                                    {!showOverlay && (
                                      <motion.button
                                        onClick={() => removeVideo(media.index)}
                                        className="absolute top-2 right-2 sm:top-3 sm:right-3 w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl backdrop-blur-2xl bg-black/60 border border-white/20 hover:bg-black/80 active:bg-black/80 flex items-center justify-center shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] opacity-0 group-hover:opacity-100 sm:group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-300"
                                        whileHover={{ scale: 1.08, rotate: 90 }}
                                        whileTap={{ scale: 0.92 }}
                                      >
                                        <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                                      </motion.button>
                                    )}
                                  </div>
                                </>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    );
                  })()}
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
                  {/* Apple-Style Header */}
                  <div className="flex items-center justify-between mb-3 sm:mb-5 gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-xl flex-shrink-0 ${
                        theme === 'dark' 
                          ? 'bg-white/5 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]' 
                          : 'bg-black/5 border border-black/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.08)]'
                      }`}>
                        <BarChart3 className={`w-4 h-4 sm:w-5 sm:h-5 ${
                          theme === 'dark' ? 'text-white/90' : 'text-gray-900/90'
                        }`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className={`text-sm sm:text-base font-semibold tracking-tight truncate ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          Poll{polls.length > 1 ? 's' : ''}
                        </h3>
                        <p className={`text-[10px] sm:text-xs font-medium tracking-wide truncate ${
                          theme === 'dark' ? 'text-white/50' : 'text-gray-500'
                        }`}>
                          {polls.length} question{polls.length > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <motion.button
                      onClick={() => setPolls([])}
                      className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold transition-all duration-300 backdrop-blur-xl flex-shrink-0 ${
                        theme === 'dark'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40'
                          : 'bg-red-50 text-red-600 border border-red-200/50 hover:bg-red-100 hover:border-red-300'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Clear All
                    </motion.button>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    {polls.map((poll, pollIndex) => (
                      <motion.div
                        key={poll.id}
                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: pollIndex * 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className={`rounded-2xl sm:rounded-3xl overflow-hidden backdrop-blur-xl ${
                          theme === 'dark'
                            ? 'bg-white/5 border border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]'
                            : 'bg-white border border-gray-200/50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]'
                        }`}
                      >
                        {/* Apple-Style Poll Header */}
                        <div className={`px-4 sm:px-6 py-3 sm:py-4 border-b ${
                          theme === 'dark' ? 'border-white/10' : 'border-gray-200/50'
                        }`}>
                          <div className="flex items-start justify-between gap-2 sm:gap-3">
                            <div className="flex-1 min-w-0">
                              <input
                                type="text"
                                placeholder="What would you like to ask?"
                                value={poll.question}
                                onChange={(e) => updatePollQuestion(poll.id, e.target.value)}
                                className={`w-full px-0 py-1.5 sm:py-2 text-sm sm:text-base font-semibold tracking-tight bg-transparent border-none focus:outline-none ${
                                  theme === 'dark' 
                                    ? 'text-white placeholder:text-white/40' 
                                    : 'text-gray-900 placeholder:text-gray-400'
                                }`}
                              />
                            </div>
                            <motion.button
                              onClick={() => removePoll(poll.id)}
                              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl backdrop-blur-xl transition-all duration-300 flex items-center justify-center flex-shrink-0 ${
                                theme === 'dark'
                                  ? 'bg-white/10 border border-white/20 hover:bg-white/20 active:bg-white/20'
                                  : 'bg-gray-100 border border-gray-200/50 hover:bg-gray-200 active:bg-gray-200'
                              }`}
                              whileHover={{ scale: 1.08, rotate: 90 }}
                              whileTap={{ scale: 0.92 }}
                            >
                              <X className={`w-4 h-4 sm:w-5 sm:h-5 ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`} />
                            </motion.button>
                          </div>
                        </div>

                        {/* Apple-Style Poll Options */}
                        <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-2 sm:space-y-3">
                          {poll.options.map((option, optionIndex) => (
                            <motion.div
                              key={optionIndex}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: optionIndex * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                              className="flex items-center gap-2 sm:gap-3"
                            >
                              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 backdrop-blur-xl ${
                                theme === 'dark' 
                                  ? 'bg-white/5 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]' 
                                  : 'bg-gray-100 border border-gray-200/50'
                              }`}>
                                <span className={`text-xs sm:text-sm font-bold tracking-tight ${
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
                                className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl sm:rounded-2xl border transition-all duration-300 focus:outline-none focus:ring-2 backdrop-blur-xl ${
                                  theme === 'dark'
                                    ? 'bg-white/5 border-white/10 text-white placeholder-white/40 focus:border-white/30 focus:ring-white/20'
                                    : 'bg-gray-50 border-gray-200/50 text-gray-900 placeholder-gray-400 focus:border-gray-300 focus:ring-gray-200'
                                }`}
                              />
                              {poll.options.length > 2 && (
                                <motion.button
                                  onClick={() => removePollOption(poll.id, optionIndex)}
                                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl backdrop-blur-xl transition-all duration-300 flex items-center justify-center flex-shrink-0 ${
                                    theme === 'dark'
                                      ? 'bg-white/10 border border-white/20 hover:bg-white/20 active:bg-white/20'
                                      : 'bg-gray-100 border border-gray-200/50 hover:bg-gray-200 active:bg-gray-200'
                                  }`}
                                  whileHover={{ scale: 1.08, rotate: 90 }}
                                  whileTap={{ scale: 0.92 }}
                                >
                                  <X className={`w-4 h-4 sm:w-5 sm:h-5 ${
                                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                                  }`} />
                                </motion.button>
                              )}
                            </motion.div>
                          ))}

                          {/* Apple-Style Add Option Button */}
                          <motion.button
                            onClick={() => addPollOption(poll.id)}
                            className={`w-full flex items-center justify-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl border transition-all duration-300 backdrop-blur-xl ${
                              theme === 'dark'
                                ? 'border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 active:bg-white/10'
                                : 'border-gray-200/50 text-gray-500 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 active:bg-gray-50'
                            }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="text-xs sm:text-sm font-semibold tracking-tight">Add option</span>
                          </motion.button>
                        </div>

                        {/* Apple-Style Poll Duration */}
                        <div className={`px-4 sm:px-6 py-3 sm:py-4 border-t backdrop-blur-xl ${
                          theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-gray-200/50 bg-gray-50/50'
                        }`}>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <Clock className={`w-4 h-4 sm:w-5 sm:h-5 ${
                                theme === 'dark' ? 'text-white/60' : 'text-gray-500'
                              }`} />
                              <span className={`text-xs sm:text-sm font-semibold tracking-tight ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>
                                Duration
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                              {[
                                { value: '0', label: '∞' },
                                { value: '1', label: '1d' },
                                { value: '3', label: '3d' },
                                { value: '7', label: '1w' },
                                { value: '30', label: '1m' }
                              ].map((duration) => (
                                <motion.button
                                  key={duration.value}
                                  onClick={() => updatePollDuration(poll.id, duration.value)}
                                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 backdrop-blur-xl ${
                                    poll.duration === duration.value
                                      ? theme === 'dark'
                                        ? 'bg-white text-black shadow-[0_8px_32px_0_rgba(255,255,255,0.2)]'
                                        : 'bg-black text-white shadow-[0_8px_32px_0_rgba(0,0,0,0.1)]'
                                      : theme === 'dark'
                                      ? 'bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 active:bg-white/10'
                                      : 'bg-gray-100 border border-gray-200/50 text-gray-500 hover:text-gray-900 hover:bg-gray-200 active:bg-gray-200'
                                  }`}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  {duration.label}
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

              {/* Apple-Level Premium Location Display */}
              {location && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="mb-4 sm:mb-8"
                >
                  <div className={`rounded-2xl sm:rounded-3xl overflow-hidden backdrop-blur-xl ${
                    theme === 'dark'
                      ? 'bg-white/5 border border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]'
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
                        <div className={`rounded-xl sm:rounded-2xl backdrop-blur-2xl border ${
                          theme === 'dark'
                            ? 'bg-black/60 border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]'
                            : 'bg-white/90 border-gray-200/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)]'
                        }`}>
                          <div className="p-3 sm:p-4">
                            <div className="flex items-center gap-3 sm:gap-4">
                              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-xl flex-shrink-0 ${
                                theme === 'dark' 
                                  ? 'bg-white/10 border border-white/20' 
                                  : 'bg-gray-100 border border-gray-200/50'
                              }`}>
                                <MapPin className={`w-5 h-5 sm:w-6 sm:h-6 ${
                                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`font-semibold text-sm sm:text-base tracking-tight truncate ${
                                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {(() => {
                                    const parts = location.address.split(',');
                                    const city = parts[parts.length - 3]?.trim() || parts[0]?.trim();
                                    const country = parts[parts.length - 1]?.trim();
                                    return city && country ? `${city}, ${country}` : location.address.split(',')[0];
                                  })()}
                                </p>
                                <p className={`text-xs sm:text-sm mt-0.5 sm:mt-1 font-medium tracking-wide truncate ${
                                  theme === 'dark' ? 'text-white/60' : 'text-gray-500'
                                }`}>
                                  {(() => {
                                    const parts = location.address.split(',');
                                    return parts.slice(0, -2).join(', ').trim() || 'Exact location';
                                  })()}
                                </p>
                              </div>
                              <motion.button
                                onClick={() => setLocation(null)}
                                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl backdrop-blur-xl transition-all duration-300 flex items-center justify-center flex-shrink-0 ${
                                  theme === 'dark'
                                    ? 'bg-white/10 border border-white/20 hover:bg-white/20 active:bg-white/20'
                                    : 'bg-gray-100 border border-gray-200/50 hover:bg-gray-200 active:bg-gray-200'
                                }`}
                                whileHover={{ scale: 1.08, rotate: 90 }}
                                whileTap={{ scale: 0.92 }}
                              >
                                <X className={`w-4 h-4 sm:w-5 sm:h-5 ${
                                  theme === 'dark' ? 'text-white' : 'text-gray-900'
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
                  <div className={`rounded-2xl sm:rounded-3xl overflow-hidden backdrop-blur-xl ${
                    theme === 'dark'
                      ? 'bg-white/5 border border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]'
                      : 'bg-white border border-gray-200/50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]'
                  }`}>
                    <div className={`px-4 sm:px-6 py-3 sm:py-4 border-b ${
                      theme === 'dark' ? 'border-white/10' : 'border-gray-200/50'
                    }`}>
                      <div className="flex items-center justify-between gap-2 sm:gap-3">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-xl flex-shrink-0 ${
                            theme === 'dark' 
                              ? 'bg-white/5 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]' 
                              : 'bg-black/5 border border-black/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.08)]'
                          }`}>
                            <Calendar className={`w-4 h-4 sm:w-5 sm:h-5 ${
                              theme === 'dark' ? 'text-white/90' : 'text-gray-900/90'
                            }`} />
                          </div>
                          <div className="min-w-0">
                            <h3 className={`font-semibold text-sm sm:text-base tracking-tight truncate ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>
                              Event
                            </h3>
                            <p className={`text-[10px] sm:text-xs font-medium tracking-wide truncate ${
                              theme === 'dark' ? 'text-white/50' : 'text-gray-500'
                            }`}>
                              Plan with community
                            </p>
                          </div>
                        </div>
                        <motion.button
                          onClick={() => setIsEventActive(false)}
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl backdrop-blur-xl transition-all duration-300 flex items-center justify-center flex-shrink-0 ${
                            theme === 'dark'
                              ? 'bg-white/10 border border-white/20 hover:bg-white/20 active:bg-white/20'
                              : 'bg-gray-100 border border-gray-200/50 hover:bg-gray-200 active:bg-gray-200'
                          }`}
                          whileHover={{ scale: 1.08, rotate: 90 }}
                          whileTap={{ scale: 0.92 }}
                        >
                          <X className={`w-4 h-4 sm:w-5 sm:h-5 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`} />
                        </motion.button>
                      </div>
                    </div>

                    <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-3 sm:space-y-4">
                      <input
                        type="text"
                        placeholder="Event title"
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                        className={`w-full px-3 sm:px-4 py-3 sm:py-3.5 text-sm sm:text-base rounded-xl sm:rounded-2xl border transition-all duration-300 focus:outline-none focus:ring-2 backdrop-blur-xl ${
                          theme === 'dark'
                            ? 'bg-white/5 border-white/10 text-white placeholder-white/40 focus:border-white/30 focus:ring-white/20'
                            : 'bg-gray-50 border-gray-200/50 text-gray-900 placeholder-gray-400 focus:border-gray-300 focus:ring-gray-200'
                        }`}
                      />

                      <textarea
                        placeholder="Description (optional)"
                        value={eventDescription}
                        onChange={(e) => setEventDescription(e.target.value)}
                        rows={4}
                        className={`w-full px-3 sm:px-4 py-3 sm:py-3.5 text-sm sm:text-base rounded-xl sm:rounded-2xl border transition-all duration-300 focus:outline-none focus:ring-2 resize-none backdrop-blur-xl ${
                          theme === 'dark'
                            ? 'bg-white/5 border-white/10 text-white placeholder-white/40 focus:border-white/30 focus:ring-white/20'
                            : 'bg-gray-50 border-gray-200/50 text-gray-900 placeholder-gray-400 focus:border-gray-300 focus:ring-gray-200'
                        }`}
                      />

                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <input
                          type="date"
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                          className={`px-3 sm:px-4 py-3 sm:py-3.5 text-sm sm:text-base rounded-xl sm:rounded-2xl border transition-all duration-300 focus:outline-none focus:ring-2 backdrop-blur-xl ${
                            theme === 'dark'
                              ? 'bg-white/5 border-white/10 text-white focus:border-white/30 focus:ring-white/20'
                              : 'bg-gray-50 border-gray-200/50 text-gray-900 focus:border-gray-300 focus:ring-gray-200'
                          }`}
                        />
                        <input
                          type="time"
                          value={eventTime}
                          onChange={(e) => setEventTime(e.target.value)}
                          className={`px-3 sm:px-4 py-3 sm:py-3.5 text-sm sm:text-base rounded-xl sm:rounded-2xl border transition-all duration-300 focus:outline-none focus:ring-2 backdrop-blur-xl ${
                            theme === 'dark'
                              ? 'bg-white/5 border-white/10 text-white focus:border-white/30 focus:ring-white/20'
                              : 'bg-gray-50 border-gray-200/50 text-gray-900 focus:border-gray-300 focus:ring-gray-200'
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
                    <div className="flex items-center space-x-1 sm:space-x-2 mb-4 overflow-x-auto scrollbar-hide pb-2">
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
                    <div className="max-h-40 sm:max-h-48 overflow-y-auto scrollbar-hide px-2">
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

              {/* Compact Location Picker */}
              {isLocationPickerOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mb-4"
                >
                  <div className={`rounded-xl border overflow-hidden ${
                    theme === 'dark'
                      ? 'bg-gray-900 border-gray-800'
                      : 'bg-white border-gray-200'
                  }`}>
                    {/* Compact Header */}
                    <div className={`flex items-center justify-between px-3 py-2 border-b ${
                      theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                        }`}>
                          <MapPin className={`w-3.5 h-3.5 ${
                            theme === 'dark' ? 'text-white' : 'text-black'
                          }`} />
                        </div>
                        <h4 className={`font-semibold text-sm ${
                          theme === 'dark' ? 'text-white' : 'text-black'
                        }`}>
                          Location
                        </h4>
                      </div>
                      <button
                        onClick={() => setIsLocationPickerOpen(false)}
                        className={`p-1 rounded-lg transition-colors ${
                          theme === 'dark'
                            ? 'text-gray-500 hover:text-white hover:bg-gray-800'
                            : 'text-gray-400 hover:text-black hover:bg-gray-100'
                        }`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Compact Content */}
                    <div className="p-3">
                      <motion.button
                        onClick={getCurrentLocation}
                        disabled={isGettingLocation}
                        className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isGettingLocation
                            ? theme === 'dark'
                              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : theme === 'dark'
                            ? 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700'
                            : 'bg-gray-100 text-black hover:bg-gray-200 border border-gray-300'
                        }`}
                        whileHover={!isGettingLocation ? { scale: 1.02 } : {}}
                        whileTap={!isGettingLocation ? { scale: 0.98 } : {}}
                      >
                        {isGettingLocation ? (
                          <>
                            <div className={`w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin ${
                              theme === 'dark' ? 'border-gray-500' : 'border-gray-400'
                            }`} />
                            <span>Getting location...</span>
                          </>
                        ) : (
                          <>
                            <Navigation className="w-3.5 h-3.5" />
                            <span>Use Current Location</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        </div>

        {/* Compact Action Bar */}
        <div className={`flex items-center justify-between ${isFullScreen ? 'px-3 sm:px-6 py-2' : 'px-3 sm:px-4 py-2 sm:py-2.5'} ${parentPostId ? 'pb-3 sm:pb-2.5' : ''} border-t w-full max-w-full mt-auto flex-shrink-0 ${
          theme === 'dark' ? 'bg-black border-gray-800/30' : 'bg-white border-gray-200/30'
        }`}>
          {/* Compact Action Buttons */}
          <div className="flex items-center space-x-0.5 sm:space-x-1 flex-shrink-0">
            {/* Photo Upload */}
            <motion.button
              onClick={() => fileInputRef.current?.click()}
              className={`flex items-center justify-center w-10 h-10 sm:w-8 sm:h-8 rounded-lg transition-all duration-200 flex-shrink-0 ${
                selectedImages.some(f => f.type.startsWith('image/'))
                  ? theme === 'dark'
                    ? 'bg-blue-500/15 text-blue-400'
                    : 'bg-blue-50 text-blue-600'
                  : theme === 'dark'
                  ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 active:bg-gray-800/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 active:bg-gray-100/50'
              }`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              title="Add photos"
            >
              <Image className="w-5 h-5 sm:w-4 sm:h-4" />
            </motion.button>

            {/* Video Upload */}
            <motion.button
              onClick={() => videoInputRef.current?.click()}
              className={`flex items-center justify-center w-10 h-10 sm:w-8 sm:h-8 rounded-lg transition-all duration-200 flex-shrink-0 ${
                selectedVideos.length > 0
                  ? theme === 'dark'
                    ? 'bg-purple-500/15 text-purple-400'
                    : 'bg-purple-50 text-purple-600'
                  : theme === 'dark'
                  ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 active:bg-gray-800/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 active:bg-gray-100/50'
              }`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              title="Add videos"
            >
              <Video className="w-5 h-5 sm:w-4 sm:h-4" />
            </motion.button>

            {/* Poll */}
            <motion.button
              onClick={addPoll}
              className={`flex items-center justify-center w-10 h-10 sm:w-8 sm:h-8 rounded-lg transition-all duration-200 flex-shrink-0 ${
                polls.length > 0
                  ? theme === 'dark'
                    ? 'bg-white/15 text-white'
                    : 'bg-black/10 text-black'
                  : theme === 'dark'
                  ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 active:bg-gray-800/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 active:bg-gray-100/50'
              }`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              title="Add a poll"
            >
              <BarChart3 className="w-5 h-5 sm:w-4 sm:h-4" />
            </motion.button>

            {/* Emoji */}
            <motion.button
              onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
              className={`flex items-center justify-center w-10 h-10 sm:w-8 sm:h-8 rounded-lg transition-all duration-200 flex-shrink-0 ${
                isEmojiPickerOpen
                  ? theme === 'dark'
                    ? 'bg-yellow-500/15 text-yellow-400'
                    : 'bg-yellow-50 text-yellow-600'
                  : theme === 'dark'
                  ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 active:bg-gray-800/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 active:bg-gray-100/50'
              }`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              title="Add emoji"
            >
              <Smile className="w-5 h-5 sm:w-4 sm:h-4" />
            </motion.button>

            {/* Event */}
            <motion.button
              onClick={() => setIsEventActive(!isEventActive)}
              className={`flex items-center justify-center w-10 h-10 sm:w-8 sm:h-8 rounded-lg transition-all duration-200 flex-shrink-0 ${
                isEventActive
                  ? theme === 'dark'
                    ? 'bg-purple-500/15 text-purple-400'
                    : 'bg-purple-50 text-purple-600'
                  : theme === 'dark'
                  ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 active:bg-gray-800/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 active:bg-gray-100/50'
              }`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              title="Create event"
            >
              <Calendar className="w-5 h-5 sm:w-4 sm:h-4" />
            </motion.button>

            {/* Location */}
            <motion.button
              onClick={() => setIsLocationPickerOpen(!isLocationPickerOpen)}
              className={`flex items-center justify-center w-10 h-10 sm:w-8 sm:h-8 rounded-lg transition-all duration-200 flex-shrink-0 ${
                location || isLocationPickerOpen
                  ? theme === 'dark'
                    ? 'bg-orange-500/15 text-orange-400'
                    : 'bg-orange-50 text-orange-600'
                  : theme === 'dark'
                  ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 active:bg-gray-800/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 active:bg-gray-100/50'
              }`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              title="Add location"
            >
              <MapPin className="w-5 h-5 sm:w-4 sm:h-4" />
            </motion.button>
          </div>

          {/* Compact Post Button */}
          <motion.button
            disabled={(!hasEditorContent && selectedImages.length === 0 && selectedVideos.length === 0) || isSubmitting || charCount > maxChars}
            className={`px-4 sm:px-5 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 flex-shrink-0 ${
              hasEditorContent || selectedImages.length > 0 || selectedVideos.length > 0
                ? theme === 'dark'
                  ? 'bg-white text-black hover:bg-gray-100 active:bg-gray-100'
                  : 'bg-black text-white hover:bg-gray-800 active:bg-gray-800'
                : theme === 'dark'
                  ? 'bg-gray-800/50 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-200/50 text-gray-400 cursor-not-allowed'
            } ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
            whileHover={(!hasEditorContent && selectedImages.length === 0 && selectedVideos.length === 0) || isSubmitting ? {} : { scale: 1.02 }}
            whileTap={(!hasEditorContent && selectedImages.length === 0 && selectedVideos.length === 0) || isSubmitting ? {} : { scale: 0.98 }}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-1 sm:space-x-1.5">
                <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 border-2 border-t-transparent rounded-full animate-spin ${
                  theme === 'dark' ? 'border-black' : 'border-white'
                }`} />
                <span className="text-xs sm:text-sm">Publishing...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 sm:space-x-1.5">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="text-xs sm:text-sm">{buttonText}</span>
              </div>
            )}
          </motion.button>
        </div>
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




    </div>
  );
};

export default CreatePost;
