import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Plus, X, ChevronLeft, ChevronRight, Heart, MessageCircle, UserRound, ImagePlus, Send, Loader2, Film, Camera, Type, Palette, AlignLeft, AlignCenter, AlignRight, SlidersHorizontal, Check } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { buildSafeURL, getSafeImageURL, getSafeImageURLEx } from '../../helpers/helpers';
import { defaultServiceServerId, serviceURL } from '../../appSettings';
import { useNavigate } from '@/router';
import { useAtom } from 'jotai';
import { storiesStateAtom, type StoryUser, type StoryItem, type StoryCard, type StoryMedia } from '@/state/stories';

const STORY_LIMIT = 10;
const STORY_CANVAS_WIDTH = 1080;
const STORY_CANVAS_HEIGHT = 1920;

type StoryRecord = StoryItem & Record<string, unknown>;
type StoryTextAlign = 'left' | 'center' | 'right';

type StoryBackground = {
  id: string;
  name: string;
  preview: string;
  colors: [string, string, string?];
};

type StoryFontOption = {
  id: string;
  name: string;
  css: string;
  weight: number;
};

const STORY_BACKGROUNDS: StoryBackground[] = [
  {
    id: 'aurora',
    name: 'Aurora',
    preview: 'linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 48%, #ec4899 100%)',
    colors: ['#0ea5e9', '#8b5cf6', '#ec4899'],
  },
  {
    id: 'sunset',
    name: 'Sunset',
    preview: 'linear-gradient(135deg, #fb7185 0%, #f97316 50%, #fde047 100%)',
    colors: ['#fb7185', '#f97316', '#fde047'],
  },
  {
    id: 'ocean',
    name: 'Ocean',
    preview: 'linear-gradient(135deg, #22d3ee 0%, #2563eb 54%, #111827 100%)',
    colors: ['#22d3ee', '#2563eb', '#111827'],
  },
  {
    id: 'pride',
    name: 'Pride',
    preview: 'linear-gradient(135deg, #ef4444 0%, #f97316 22%, #eab308 42%, #22c55e 62%, #3b82f6 82%, #a855f7 100%)',
    colors: ['#ef4444', '#22c55e', '#a855f7'],
  },
  {
    id: 'lime',
    name: 'Lime',
    preview: 'linear-gradient(135deg, #bef264 0%, #14b8a6 48%, #0f172a 100%)',
    colors: ['#bef264', '#14b8a6', '#0f172a'],
  },
  {
    id: 'mono',
    name: 'Mono',
    preview: 'linear-gradient(135deg, #020617 0%, #334155 55%, #f8fafc 100%)',
    colors: ['#020617', '#334155', '#f8fafc'],
  },
];

const STORY_TEXT_COLORS = ['#ffffff', '#0f172a', '#fef08a', '#bae6fd', '#fbcfe8', '#bbf7d0'];

const STORY_FONT_OPTIONS: StoryFontOption[] = [
  { id: 'sans', name: 'Clean', css: '"Google Sans", ui-sans-serif, system-ui, sans-serif', weight: 900 },
  { id: 'serif', name: 'Serif', css: 'Georgia, "Times New Roman", serif', weight: 700 },
  { id: 'condensed', name: 'Bold', css: 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif', weight: 900 },
  { id: 'mono', name: 'Mono', css: '"SFMono-Regular", Consolas, monospace', weight: 800 },
  { id: 'soft', name: 'Soft', css: '"Trebuchet MS", "Google Sans", sans-serif', weight: 800 },
];

const asRecord = (value: unknown): Record<string, unknown> | null => (
  value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
);

const readString = (value: unknown): string | null => (
  typeof value === 'string' && value.trim() ? value.trim() : null
);

const getStoryBackground = (id: string) => (
  STORY_BACKGROUNDS.find((background) => background.id === id) || STORY_BACKGROUNDS[0]
);

const getStoryFont = (id: string) => (
  STORY_FONT_OPTIONS.find((font) => font.id === id) || STORY_FONT_OPTIONS[0]
);

const loadCanvasImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = reject;
  image.src = src;
});

const drawCoverImage = (
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number
) => {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const scaledWidth = image.naturalWidth * scale;
  const scaledHeight = image.naturalHeight * scale;
  const x = (width - scaledWidth) / 2;
  const y = (height - scaledHeight) / 2;
  ctx.drawImage(image, x, y, scaledWidth, scaledHeight);
};

const drawCanvasBackground = (
  ctx: CanvasRenderingContext2D,
  background: StoryBackground,
  width: number,
  height: number
) => {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  const colors = background.colors;
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(0.55, colors[1]);
  gradient.addColorStop(1, colors[2] || colors[1]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
};

const wrapCanvasText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
) => {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';

  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
      return;
    }
    line = testLine;
  });

  if (line) lines.push(line);
  return lines;
};

const canvasToStoryFile = (canvas: HTMLCanvasElement) => new Promise<File>((resolve, reject) => {
  canvas.toBlob((blob) => {
    if (!blob) {
      reject(new Error('Could not prepare story image'));
      return;
    }
    resolve(new File([blob], `coolvibes-story-${Date.now()}.jpg`, { type: 'image/jpeg' }));
  }, 'image/jpeg', 0.85);
});

const resolveStoryUrl = (value: unknown): string | null => {
  const path = readString(value);
  if (!path) return null;
  if (path.startsWith('blob:') || path.startsWith('data:')) return path;
  return buildSafeURL(serviceURL[defaultServiceServerId], path);
};

const resolveMediaUrl = (source: unknown, variants: string[]): string | null => {
  if (!source) return null;
  if (typeof source === 'string') return resolveStoryUrl(source);

  for (const variant of variants) {
    const url = getSafeImageURL(source, variant);
    if (url) return url;
  }

  const record = asRecord(source);
  const file = asRecord(record?.file);
  const directCandidates: unknown[] = [
    file?.url,
    file?.storage_path,
    record?.url,
    record?.storage_path,
    record?.path,
    record?.src,
    record?.original,
    record?.large,
    record?.medium,
    record?.small,
    record?.thumbnail,
    record?.preview,
    record?.poster,
  ];

  for (const candidate of directCandidates) {
    const resolved = resolveStoryUrl(candidate);
    if (resolved) return resolved;
  }

  return null;
};

const getStoryMedia = (story: StoryRecord): StoryMedia | undefined => {
  const attachment = Array.isArray(story.attachments) ? story.attachments[0] : null;
  const rawMedia =
    story.media ||
    story.story_media ||
    story.storyMedia ||
    story.attachment ||
    attachment ||
    (story.file ? { file: story.file } : null) ||
    (story.image ? { url: story.image } : null) ||
    (story.media_url ? { url: story.media_url } : null) ||
    (story.url ? { url: story.url } : null);

  return asRecord(rawMedia) ? rawMedia as StoryMedia : undefined;
};

const getStoryMediaMime = (media: StoryMedia | undefined): string => {
  const file = asRecord(media?.file);
  return (
    readString(file?.mime_type) ||
    readString(file?.type) ||
    readString(media?.mime_type) ||
    ''
  );
};

const getStoryUser = (story: StoryRecord): StoryUser | undefined => {
  const media = asRecord(story.media);
  const candidates = [
    story.user,
    story.author,
    story.owner,
    story.creator,
    story.profile,
    story.userDetails,
    story.user_details,
    story.user_profile,
    media?.user,
    media?.owner,
  ];

  const rawUser = candidates.map(asRecord).find(Boolean);
  const fallbackId = story.user_id || story.userId || story.owner_id || story.author_id;
  const fallbackPublicId = story.user_public_id || story.userPublicId;

  if (!rawUser && !fallbackId && !fallbackPublicId) return undefined;

  const id = rawUser?.id || fallbackId || fallbackPublicId;
  return {
    ...(rawUser || {}),
    id: id as string | number,
    public_id: (rawUser?.public_id || fallbackPublicId) as string | undefined,
    username: (
      readString(rawUser?.username) ||
      readString(rawUser?.nickname) ||
      readString(rawUser?.slug) ||
      undefined
    ),
    displayname: (
      readString(rawUser?.displayname) ||
      readString(rawUser?.display_name) ||
      readString(rawUser?.name) ||
      readString(rawUser?.username) ||
      undefined
    ),
  } as StoryUser;
};

const getStoryUserName = (user: StoryUser | undefined): string => (
  readString(user?.displayname) ||
  readString(user?.display_name) ||
  readString(user?.name) ||
  readString(user?.username) ||
  readString(user?.nickname) ||
  'User'
);

const formatStoryAge = (value: unknown): string => {
  const dateValue = readString(value);
  if (!dateValue) return '';

  const timestamp = new Date(dateValue).getTime();
  if (!Number.isFinite(timestamp)) return '';

  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSeconds < 60) return 'now';

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
};

const Stories: React.FC = () => {
  const { theme } = useTheme();
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const portalRoot = typeof document !== 'undefined' ? document.body : null;
  const [storiesState, setStoriesState] = useAtom(storiesStateAtom);
  const stories = storiesState.items;
  const loadingStories = storiesState.isLoading;

  const [selectedStory, setSelectedStory] = useState<number | string | null>(null);
  const [showAddStoryModal, setShowAddStoryModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [likedStories, setLikedStories] = useState<Set<string>>(() => new Set());
  const [storyText, setStoryText] = useState('');
  const [storyFontId, setStoryFontId] = useState(STORY_FONT_OPTIONS[0].id);
  const [storyTextColor, setStoryTextColor] = useState(STORY_TEXT_COLORS[0]);
  const [storyBackgroundId, setStoryBackgroundId] = useState(STORY_BACKGROUNDS[0].id);
  const [storyTextSize, setStoryTextSize] = useState(42);
  const [storyTextPosition, setStoryTextPosition] = useState(50);
  const [storyTextAlign, setStoryTextAlign] = useState<StoryTextAlign>('center');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  const availableStories = useMemo(() => stories.filter((s) => s.hasStory), [stories]);
  const selectedStoryData = useMemo(
    () => (selectedStory ? stories.find((s) => s.id === selectedStory) : null),
    [selectedStory, stories]
  );
  const storyViewerIndex = useMemo(
    () => (selectedStory ? availableStories.findIndex((s) => s.id === selectedStory) : -1),
    [availableStories, selectedStory]
  );
  const selectedStoryLikeKey = selectedStoryData?.storyId || (selectedStoryData?.id != null ? String(selectedStoryData.id) : null);
  const isSelectedStoryLiked = selectedStoryLikeKey ? likedStories.has(selectedStoryLikeKey) : false;
  const canMessageSelectedStoryUser = Boolean(authUser?.id && selectedStoryData?.user?.id);
  const canViewSelectedStoryProfile = Boolean(selectedStoryData?.user?.username);
  const selectedStoryBackground = useMemo(() => getStoryBackground(storyBackgroundId), [storyBackgroundId]);
  const selectedStoryFont = useMemo(() => getStoryFont(storyFontId), [storyFontId]);
  const hasStoryText = storyText.trim().length > 0;

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  const buildStoryCover = useCallback((media: StoryMedia | undefined, user: StoryUser | undefined, isVideoMedia: boolean) => {
    if (isVideoMedia) {
      return (
        resolveMediaUrl(media, ['poster', 'preview', 'thumbnail', 'small', 'medium', 'large', 'original']) ||
        resolveMediaUrl(user?.cover, ['medium', 'large', 'original']) ||
        resolveMediaUrl(user?.avatar, ['medium', 'thumbnail', 'small', 'icon', 'original']) ||
        null
      );
    }

    return (
      resolveMediaUrl(media, ['thumbnail', 'small', 'icon', 'medium', 'large', 'original']) ||
      null
    );
  }, []);

  const transformStories = useCallback((storiesData: StoryItem[]) => {
    const activeStories = storiesData.filter((story) => story.is_expired !== true);
    const sortedStories = [...activeStories].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return sortedStories.map((story: StoryItem) => {
      const storyRecord = story as StoryRecord;
      const user = getStoryUser(storyRecord);
      const media = getStoryMedia(storyRecord);
      const isVideoMedia = getStoryMediaMime(media).startsWith('video/');
      const userPublicId = user?.public_id || storyRecord.user_public_id || storyRecord.userPublicId || user?.id;
      const avatarIcon =
        resolveMediaUrl(user?.avatar, ['icon', 'thumbnail', 'small', 'medium', 'original']) ||
        (user ? getSafeImageURLEx(userPublicId, user.avatar, 'icon') : null);
      const avatarMedium =
        resolveMediaUrl(user?.avatar, ['medium', 'thumbnail', 'small', 'icon', 'original']) ||
        (user ? getSafeImageURLEx(userPublicId, user.avatar, 'medium') : null);
      const storyId = storyRecord.id || storyRecord.public_id || storyRecord.story_id;
      const userId = user?.id || storyRecord.user_id || storyRecord.userId;

      return {
        id: storyId,
        name: getStoryUserName(user),
        avatar: avatarIcon,
        cover: buildStoryCover(media, user, isVideoMedia),
        userCover: avatarMedium,
        isOwn: userId === authUser?.id,
        hasStory: true,
        storyId: String(storyId),
        storyMedia: media,
        userId,
        user,
        created_at: readString(storyRecord.created_at) || undefined,
      } as StoryCard;
    });
  }, [authUser?.id, buildStoryCover]);

  const fetchStories = useCallback(async () => {
    try {
      setStoriesState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = (await api.fetchStories({ limit: STORY_LIMIT })) as {
        stories?: StoryItem[];
        data?: { stories?: StoryItem[] };
      };
      const storiesData = response?.stories || response?.data?.stories || [];
      setStoriesState(prev => ({
        ...prev,
        items: transformStories(storiesData),
        isLoading: false
      }));
    } catch (err) {
      console.error('Error fetching stories:', err);
      setStoriesState(prev => ({
        ...prev,
        items: [],
        isLoading: false,
        error: (err as any)?.message || 'Failed to load stories'
      }));
    } finally {
      setStoriesState(prev => ({ ...prev, isLoading: false }));
    }
  }, [transformStories, setStoriesState]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const nextStory = useCallback(() => {
    if (!selectedStory) return;
    if (storyViewerIndex < availableStories.length - 1) {
      setSelectedStory(availableStories[storyViewerIndex + 1].id);
    } else {
      setSelectedStory(null);
    }
  }, [availableStories, selectedStory, storyViewerIndex]);

  const prevStory = useCallback(() => {
    if (!selectedStory) return;
    if (storyViewerIndex > 0) {
      setSelectedStory(availableStories[storyViewerIndex - 1].id);
    }
  }, [availableStories, selectedStory, storyViewerIndex]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setSelectedFile(file);
    const isVideoFile = file.type.startsWith('video/');
    setIsVideo(isVideoFile);
    if (isVideoFile) {
      setStoryText('');
    }

    if (isVideoFile) {
      const objectUrl = URL.createObjectURL(file);
      previewUrlRef.current = objectUrl;
      setSelectedImage(objectUrl);
      setShowAddStoryModal(true);
      setUploadError(null);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
      setShowAddStoryModal(true);
      setUploadError(null);
    };
    reader.readAsDataURL(file);
  };

  const resetUploadState = () => {
    setShowAddStoryModal(false);
    setSelectedImage(null);
    setSelectedFile(null);
    setIsVideo(false);
    setUploadError(null);
    setStoryText('');
    setStoryFontId(STORY_FONT_OPTIONS[0].id);
    setStoryTextColor(STORY_TEXT_COLORS[0]);
    setStoryBackgroundId(STORY_BACKGROUNDS[0].id);
    setStoryTextSize(42);
    setStoryTextPosition(50);
    setStoryTextAlign('center');
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openStoryComposer = useCallback(() => {
    setUploadError(null);
    setShowAddStoryModal(true);
  }, []);

  const openStoryFilePicker = useCallback(() => {
    if (isUploading) return;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  }, [isUploading]);

  const clearStoryMedia = useCallback(() => {
    if (isUploading) return;

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setSelectedImage(null);
    setSelectedFile(null);
    setIsVideo(false);
    setUploadError(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [isUploading]);

  const buildStoryImageFile = useCallback(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = STORY_CANVAS_WIDTH;
    canvas.height = STORY_CANVAS_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not prepare story image');
    }

    const width = STORY_CANVAS_WIDTH;
    const height = STORY_CANVAS_HEIGHT;

    if (selectedImage && !isVideo) {
      try {
        const image = await loadCanvasImage(selectedImage);
        drawCoverImage(ctx, image, width, height);
      } catch (error) {
        console.error('Error drawing story media:', error);
        drawCanvasBackground(ctx, selectedStoryBackground, width, height);
      }
    } else {
      drawCanvasBackground(ctx, selectedStoryBackground, width, height);
    }

    const shade = ctx.createLinearGradient(0, 0, 0, height);
    shade.addColorStop(0, 'rgba(0,0,0,0.26)');
    shade.addColorStop(0.42, 'rgba(0,0,0,0.04)');
    shade.addColorStop(1, 'rgba(0,0,0,0.42)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, width, height);

    const text = storyText.trim();
    if (text) {
      const scaledFontSize = Math.round(storyTextSize * 3);
      const maxTextWidth = width - 180;
      ctx.font = `${selectedStoryFont.weight} ${scaledFontSize}px ${selectedStoryFont.css}`;
      ctx.textAlign = storyTextAlign;
      ctx.textBaseline = 'middle';
      ctx.fillStyle = storyTextColor;
      ctx.shadowColor = 'rgba(0,0,0,0.46)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 10;
      ctx.lineJoin = 'round';

      const lines = wrapCanvasText(ctx, text, maxTextWidth).slice(0, 8);
      const lineHeight = scaledFontSize * 1.12;
      const blockHeight = (lines.length - 1) * lineHeight;
      const centerY = height * (storyTextPosition / 100);
      const startY = centerY - blockHeight / 2;
      const x = storyTextAlign === 'left' ? 90 : storyTextAlign === 'right' ? width - 90 : width / 2;

      lines.forEach((line, index) => {
        const y = startY + index * lineHeight;
        ctx.lineWidth = 8;
        ctx.strokeStyle = 'rgba(0,0,0,0.18)';
        ctx.strokeText(line, x, y);
        ctx.fillText(line, x, y);
      });
    }

    return canvasToStoryFile(canvas);
  }, [
    isVideo,
    selectedImage,
    selectedStoryBackground,
    selectedStoryFont,
    storyText,
    storyTextAlign,
    storyTextColor,
    storyTextPosition,
    storyTextSize,
  ]);

  const handleShareStory = async () => {
    setIsUploading(true);
    setUploadError(null);

    try {
      if (isVideo && hasStoryText) {
        setUploadError('Text styling is available for photo and text stories. Remove text or choose a photo.');
        return;
      }

      const storyFile = isVideo && selectedFile ? selectedFile : await buildStoryImageFile();
      await api.uploadStory({ story: storyFile });
      resetUploadState();
      await fetchStories();
    } catch (err: unknown) {
      console.error('Error uploading story:', err);
      const errorMessage = (err as any).response?.data?.message || 'Failed to upload story. Please try again.';
      setUploadError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const toggleStoryLike = useCallback((storyKey: string | null) => {
    if (!storyKey) return;

    setLikedStories((previous) => {
      const next = new Set(previous);
      if (next.has(storyKey)) {
        next.delete(storyKey);
      } else {
        next.add(storyKey);
      }
      return next;
    });
  }, []);

  const handleSendMessage = async (profile: StoryUser) => {
    if (!authUser?.id || !profile?.id) {
      console.error('User or profile ID is missing');
      return;
    }

    setSelectedStory(null);

    try {
      const chatResponse = (await api.createChat([profile.id.toString()], 'private')) as {
        chat: {
          id: string;
        };
        success: boolean;
      };

      const chatId = chatResponse?.chat?.id;
      if (chatId) {
        navigate('/messages', {
          state: {
            openChat: chatId,
            userId: profile.id,
            publicId: profile.public_id,
            username: profile.username || '',
          },
        });
      } else {
        navigate('/messages', {
          state: {
            openChat: profile.username || profile.id.toString(),
            userId: profile.id,
            publicId: profile.public_id,
          },
        });
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      navigate('/messages', {
        state: {
          openChat: profile.username || profile.id.toString(),
          userId: profile.id,
          publicId: profile.public_id,
        },
      });
    }
  };

  const handleViewProfile = useCallback((profile?: StoryUser) => {
    const username = profile?.username?.trim();
    if (!username) {
      console.error('Story profile username is missing');
      return;
    }

    setSelectedStory(null);
    navigate(`/${encodeURIComponent(username)}`);
  }, [navigate]);

  const renderStoryMedia = () => {
    if (!selectedStoryData) return null;

    const isVideoMedia = getStoryMediaMime(selectedStoryData.storyMedia).startsWith('video/');
    let mediaUrl = '';
    let posterUrl = '';

    if (isVideoMedia) {
      mediaUrl =
        resolveMediaUrl(selectedStoryData.storyMedia, ['high', 'large', 'medium', 'low', 'preview', 'original']) ||
        '';
      posterUrl = resolveMediaUrl(selectedStoryData.storyMedia, ['poster', 'preview', 'thumbnail']) || '';
    } else {
      mediaUrl =
        resolveMediaUrl(selectedStoryData.storyMedia, ['large', 'original', 'medium', 'small', 'preview', 'thumbnail']) ||
        selectedStoryData.cover ||
        '';
    }

    if (!mediaUrl) return null;

    return isVideoMedia ? (
      <video
        key={mediaUrl}
        src={mediaUrl}
        poster={posterUrl}
        className="w-full h-full object-cover"
        controls
        autoPlay
        loop
        playsInline
      />
    ) : (
      <img
        key={mediaUrl}
        src={mediaUrl}
        alt={selectedStoryData.name}
        className="w-full h-full object-cover"
      />
    );
  };

  const selectedFileName = selectedFile?.name || (hasStoryText ? 'Text story' : 'Gradient story');
  const selectedFileTypeLabel = selectedFile ? (isVideo ? 'Video' : 'Photo') : 'Canvas';
  const SelectedFileIcon = selectedFile ? (isVideo ? Film : Camera) : Type;
  const storyTextControlsDisabled = isUploading || isVideo;
  const renderComposerPreview = () => (
    <>
      <div className='absolute inset-0 flex items-center justify-center bg-black' style={!selectedImage ? { background: selectedStoryBackground.preview } : undefined}>
        {isVideo && selectedImage ? <video src={selectedImage} className='h-full w-full object-cover' controls={!isUploading} autoPlay loop muted playsInline /> : selectedImage ? <img src={selectedImage} alt='Story preview' className='h-full w-full object-cover' /> : null}
      </div>
      <div className='pointer-events-none absolute inset-0 bg-gradient-to-b from-black/38 via-transparent to-black/48' />
      {!selectedImage && !hasStoryText && (
        <button type='button' onClick={openStoryFilePicker} disabled={isUploading} className='absolute left-5 right-5 top-1/2 z-20 -translate-y-1/2 rounded-[22px] border border-white/20 bg-black/25 px-4 py-5 text-center text-white shadow-[0_20px_70px_rgba(0,0,0,0.32)] backdrop-blur-md transition-all duration-150 hover:bg-black/35 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50'>
          <span className='mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-white text-black shadow-lg'>
            <ImagePlus className='h-5 w-5' />
          </span>
          <span className='block text-sm font-black'>Add photo or video</span>
          <span className='mt-1 block text-[11px] font-medium text-white/65'>or start with a text story below</span>
        </button>
      )}
      {hasStoryText && (
        <div
          className='pointer-events-none absolute left-0 right-0 z-10 px-7 drop-shadow-[0_12px_28px_rgba(0,0,0,0.48)]'
          style={{
            top: `${storyTextPosition}%`,
            transform: 'translateY(-50%)',
            color: storyTextColor,
            fontFamily: selectedStoryFont.css,
            fontWeight: selectedStoryFont.weight,
            fontSize: `${storyTextSize}px`,
            lineHeight: 1.04,
            textAlign: storyTextAlign,
          }}
        >
          <p className='whitespace-pre-wrap break-words'>{storyText}</p>
        </div>
      )}
    </>
  );

  return (
    <div className="w-full h-full">
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*,video/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="relative flex overflow-visible px-1 py-2 -my-2">
        {loadingStories && stories.length === 0 && (
          <div className="flex gap-6 px-1">
            <div className="flex shrink-0 flex-col items-center gap-2">
              <div className={`h-16 w-16 rounded-full ${theme === 'dark' ? 'bg-zinc-800' : 'bg-slate-200'} animate-pulse`} />
              <div className={`h-2 w-12 rounded-full ${theme === 'dark' ? 'bg-zinc-800' : 'bg-slate-200'} animate-pulse`} />
            </div>
            <div className="flex shrink-0 flex-col items-center gap-2">
              <div className={`h-16 w-16 rounded-full ${theme === 'dark' ? 'bg-zinc-800' : 'bg-slate-200'} animate-pulse`} />
              <div className={`h-2 w-12 rounded-full ${theme === 'dark' ? 'bg-zinc-800' : 'bg-slate-200'} animate-pulse`} />
            </div>
            <div className="flex shrink-0 flex-col items-center gap-2">
              <div className={`h-16 w-16 rounded-full ${theme === 'dark' ? 'bg-zinc-800' : 'bg-slate-200'} animate-pulse`} />
              <div className={`h-2 w-12 rounded-full ${theme === 'dark' ? 'bg-zinc-800' : 'bg-slate-200'} animate-pulse`} />
            </div>
          </div>
        )}

        {!loadingStories && authUser && (
          <div className="z-2 relative shrink-0">
            <button
              type="button"
              onClick={openStoryComposer}
              aria-label="Create story"
              className="group flex shrink-0 cursor-pointer flex-col items-center gap-2 py-1"
            >
              <div className="rounded-full bg-gradient-to-tr from-sky-400 to-sky-700 p-1 transition-all duration-500 group-hover:scale-105 group-hover:-translate-y-0.5">
                <div className={`flex h-14 w-14 items-center justify-center rounded-full border-[3px] ${theme === 'dark' ? 'cv-card-surface-solid border-[#121418]' : 'border-white bg-white'}`}>
                  <Plus className="h-6 w-6 text-sky-600" />
                </div>
              </div>
              <span className={`max-w-16 truncate text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'}`}>
                Your Story
              </span>
            </button>
          </div>
        )}

        {!loadingStories && (
          <div className={`flex-1 overflow-x-auto overflow-y-hidden py-2 -my-2 scrollbar-hide ${authUser ? 'ml-6' : ''}`}>
            <div className="flex gap-6 md:gap-8">
              {stories.map((story, index) => (
                <div key={story.id} className="shrink-0">
                  <button
                    onClick={() => {
                      if (story.hasStory) {
                        setSelectedStory(story.id);
                      }
                    }}
                    className="group flex shrink-0 cursor-pointer flex-col items-center gap-2 py-1"
                  >
                    <div className={`rounded-full p-1 transition-all duration-500 group-hover:scale-105 group-hover:-translate-y-0.5 ${story.hasStory ? 'bg-gradient-to-tr from-sky-400 to-sky-700' : theme === 'dark' ? 'border border-zinc-800' : 'border border-slate-200'}`}>
                      <div className={`h-14 w-14 overflow-hidden rounded-full border-[3px] ${theme === 'dark' ? 'cv-card-surface-solid border-[#121418]' : 'border-white bg-slate-100'}`}>
                        {story.cover ? (
                          <img
                            src={story.cover}
                            alt={story.name}
                            className="h-full w-full object-cover grayscale-[0.2] transition-all duration-500 group-hover:scale-105 group-hover:grayscale-0"
                            loading={index === 0 ? 'eager' : 'lazy'}
                            decoding="async"
                            fetchPriority={index === 0 ? 'high' : 'low'}
                            width={64}
                            height={64}
                            sizes="64px"
                          />
                        ) : story.avatar ? (
                          <img
                            src={story.avatar}
                            alt={story.name}
                            className="h-full w-full object-cover grayscale-[0.2] transition-all duration-500 group-hover:scale-105 group-hover:grayscale-0"
                            width={64}
                            height={64}
                            sizes="64px"
                          />
                        ) : (
                          <div className={`flex h-full w-full items-center justify-center ${theme === 'dark' ? 'bg-zinc-900 text-zinc-500' : 'bg-slate-100 text-slate-400'}`}>
                            <Plus className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    </div>
                    <span className={`max-w-16 truncate text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'}`}>
                      {story.name}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {portalRoot && createPortal(
        selectedStory && selectedStoryData ? (
          <div className="fixed inset-0 z-[1400] isolate overflow-hidden bg-black text-white">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  theme === 'dark'
                    ? 'radial-gradient(transparent 1px, #000000 1px)'
                    : 'radial-gradient(transparent 1px, #000000 1px)',
                backdropFilter: 'blur(3px)',
                backgroundColor: 'transparent',
                backgroundSize: '2px 3px',
                maskImage: 'linear-gradient(#ffffff calc(100% - 20px), transparent)',
                WebkitMaskImage: 'linear-gradient(#ffffff calc(100% - 20px), transparent)',
              }}
              onClick={() => setSelectedStory(null)}
            />

            <div className="absolute inset-0 z-[1] flex items-center justify-center">
              <button
                onClick={() => setSelectedStory(null)}
                className="absolute right-5 top-6 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-2xl backdrop-blur-2xl transition-colors duration-150 hover:bg-white/20 active:scale-95 sm:right-8 sm:top-8"
              >
                <X className="w-6 h-6" />
              </button>

              {storyViewerIndex > 0 && (
                <button
                  onClick={prevStory}
                  className="absolute left-4 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white shadow-2xl backdrop-blur-2xl transition-colors duration-150 hover:bg-white/20 active:scale-95 sm:flex"
                >
                  <ChevronLeft className="w-7 h-7" />
                </button>
              )}

              {storyViewerIndex < availableStories.length - 1 && (
                <button
                  onClick={nextStory}
                  className="absolute right-4 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white shadow-2xl backdrop-blur-2xl transition-colors duration-150 hover:bg-white/20 active:scale-95 sm:flex"
                >
                  <ChevronRight className="w-7 h-7" />
                </button>
              )}

              <div className="relative mx-auto flex h-screen w-screen items-center justify-center p-0 sm:p-3">
                <div className="relative mx-auto h-full w-full max-w-[430px] overflow-hidden bg-black shadow-[0_40px_140px_rgba(0,0,0,0.65)] sm:h-[96dvh] sm:rounded-[30px]">
                  {renderStoryMedia()}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

                  <div className="absolute top-0 left-0 right-0 p-3 z-2 flex gap-1">
                    {availableStories.map((story, index) => (
                      <div key={story.id} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden backdrop-blur-sm">
                        <div
                          className={`h-full bg-white rounded-full shadow-lg ${story.id === selectedStory ? 'w-full' : storyViewerIndex > index ? 'w-full' : 'w-0'}`}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="absolute top-12 left-0 right-0 px-4 z-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {selectedStoryData.avatar && (
                          <div className="w-11 h-11 rounded-full">
                            <img
                              src={selectedStoryData.avatar}
                              alt={selectedStoryData.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <p className="text-white font-bold text-[15px] tracking-[-0.011em] drop-shadow-lg">
                            {selectedStoryData.name}
                          </p>
                          {selectedStoryData.created_at && (
                            <p className="text-white/80 text-[13px] font-medium drop-shadow-lg">
                              {formatStoryAge(selectedStoryData.created_at)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-5 left-0 right-0 z-2 px-4 pb-[env(safe-area-inset-bottom)] sm:bottom-6">
                    <div className="mx-auto grid w-full max-w-[330px] grid-cols-3 gap-2 rounded-[28px] border border-white/15 bg-white/10 p-2 shadow-[0_24px_90px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStoryLike(selectedStoryLikeKey);
                        }}
                        aria-label="Like story"
                        aria-pressed={isSelectedStoryLiked}
                        className="group flex min-w-0 flex-col items-center gap-1.5 rounded-2xl px-1.5 py-1 text-white transition-all duration-150 hover:bg-white/10 active:scale-[0.96] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                      >
                        <div className={`flex h-11 w-11 items-center justify-center rounded-full border shadow-lg transition-all duration-150 ${isSelectedStoryLiked
                          ? 'border-rose-300/60 bg-rose-500 text-white shadow-rose-500/25'
                          : 'border-white/15 bg-white/15 text-white shadow-black/20 group-hover:bg-white/20'
                          }`}>
                          <Heart className={`h-5 w-5 ${isSelectedStoryLiked ? 'fill-current' : ''}`} />
                        </div>
                        <span className="max-w-full truncate text-center text-[11px] font-semibold leading-tight text-white drop-shadow-lg">
                          Like
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (canMessageSelectedStoryUser && selectedStoryData?.user) {
                            void handleSendMessage(selectedStoryData.user);
                          }
                        }}
                        disabled={!canMessageSelectedStoryUser}
                        aria-label="Message story owner"
                        className="group flex min-w-0 flex-col items-center gap-1.5 rounded-2xl px-1.5 py-1 text-white transition-all duration-150 hover:bg-white/10 active:scale-[0.96] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent"
                      >
                        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/15 text-white shadow-lg shadow-black/20 transition-colors duration-150 group-hover:bg-white/20">
                          <MessageCircle className="h-5 w-5" />
                        </div>
                        <span className="max-w-full truncate text-center text-[11px] font-semibold leading-tight text-white drop-shadow-lg">
                          Message
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewProfile(selectedStoryData?.user);
                        }}
                        disabled={!canViewSelectedStoryProfile}
                        aria-label="View profile"
                        className="group flex min-w-0 flex-col items-center gap-1.5 rounded-2xl px-1.5 py-1 text-white transition-all duration-150 hover:bg-white/10 active:scale-[0.96] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent"
                      >
                        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/15 text-white shadow-lg shadow-black/20 transition-colors duration-150 group-hover:bg-white/20">
                          <UserRound className="h-5 w-5" />
                        </div>
                        <span className="max-w-full text-center text-[11px] font-semibold leading-tight text-white drop-shadow-lg">
                          View Profile
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null,
        portalRoot
      )}

      {portalRoot &&
        createPortal(
          showAddStoryModal ? (
            <div
              className='cv-modal-glass-backdrop fixed inset-0 z-[999999] flex items-center justify-center overflow-y-auto bg-black/75 p-2 text-white sm:p-4'
              onClick={() => {
                if (!isUploading) resetUploadState();
              }}
            >
              <div className='relative z-10 flex h-[calc(100dvh-1rem)] max-h-[760px] w-[calc(100vw-1rem)] max-w-[920px] flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#050505] shadow-[0_40px_140px_rgba(0,0,0,0.65)] sm:h-[min(760px,calc(100dvh-2rem))] sm:w-full sm:rounded-[30px]' onClick={(event) => event.stopPropagation()}>
                <div className='relative z-20 px-3 pt-[calc(env(safe-area-inset-top)+0.55rem)] sm:px-4 sm:pt-3'>
                  <div className='mb-2 flex gap-1'>
                    <div className='h-0.5 flex-1 rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.55)]' />
                    <div className='h-0.5 flex-1 rounded-full bg-white/25' />
                    <div className='h-0.5 flex-1 rounded-full bg-white/25' />
                  </div>

                  <div className='flex items-center justify-between gap-3'>
                    <button
                      type='button'
                      onClick={() => {
                        if (!isUploading) resetUploadState();
                      }}
                      disabled={isUploading}
                      aria-label='Close story composer'
                      className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white shadow-lg backdrop-blur-2xl transition-all duration-150 hover:bg-white/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-45'
                    >
                      <X className='h-4 w-4' />
                    </button>

                    <div className='min-w-0 flex-1 text-center'>
                      <h3 className='truncate text-sm font-bold tracking-[-0.011em] text-white drop-shadow-lg'>New story</h3>
                    </div>

                    <button type='button' onClick={openStoryFilePicker} disabled={isUploading} aria-label='Replace story media' title='Replace media' className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white shadow-lg backdrop-blur-2xl transition-all duration-150 hover:bg-white/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-45'>
                      <ImagePlus className='h-4 w-4' />
                    </button>
                  </div>
                </div>

                <div className='relative z-10 flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-3 pb-[calc(env(safe-area-inset-bottom)+0.65rem)] pt-3 sm:px-4 sm:pb-4 md:flex-row'>
                  <div className='relative flex min-h-0 shrink-0 items-center justify-center md:min-w-0 md:flex-1'>
                    <div className='relative h-[min(43dvh,420px)] max-h-full w-auto max-w-full aspect-[9/16] overflow-hidden rounded-[24px] border border-white/12 bg-black shadow-[0_30px_90px_rgba(0,0,0,0.5)] md:h-full md:max-h-full md:rounded-[28px]'>{renderComposerPreview()}</div>
                  </div>

                  <div className='relative z-20 min-h-0 flex-1 overflow-y-auto px-0.5 pb-1 no-scrollbar md:w-[min(100%,430px)] md:flex-[0_0_48%] md:px-0'>
                    {uploadError && <div className='mb-3 rounded-2xl border border-red-300/30 bg-red-500/20 px-4 py-3 text-sm font-semibold text-red-50 shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-2xl'>{uploadError}</div>}

                    <div className='mb-2 flex items-center justify-between gap-2 rounded-2xl border border-white/12 bg-white/[0.08] p-1.5 text-white shadow-[0_18px_60px_rgba(0,0,0,0.34)] backdrop-blur-2xl'>
                      <div className='flex min-w-0 items-center gap-2 pl-1.5'>
                        <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/12 text-white'>
                          <SelectedFileIcon className='h-4 w-4' />
                        </span>
                        <div className='min-w-0'>
                          <p className='text-[10px] font-black uppercase tracking-[0.16em] text-white/55'>{selectedFileTypeLabel}</p>
                          <p className='truncate text-[12px] font-semibold text-white'>{selectedFileName}</p>
                        </div>
                      </div>

                      <button type='button' onClick={selectedImage ? clearStoryMedia : openStoryFilePicker} disabled={isUploading} aria-label={selectedImage ? 'Remove story media' : 'Add story media'} className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.12] text-white shadow-lg backdrop-blur-2xl transition-all duration-150 hover:bg-white/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-45'>
                        {selectedImage ? <X className='h-4 w-4' /> : <ImagePlus className='h-4 w-4' />}
                      </button>
                    </div>

                    <div className='mb-2 rounded-[24px] border border-white/12 bg-white/[0.08] p-2.5 shadow-[0_18px_60px_rgba(0,0,0,0.34)] backdrop-blur-2xl'>
                      <div className='mb-2 flex items-center gap-2'>
                        <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/12 text-white'>
                          <Type className='h-4 w-4' />
                        </div>
                        <textarea value={storyText} onChange={(event) => setStoryText(event.target.value.slice(0, 180))} disabled={storyTextControlsDisabled} placeholder='Write a vibe' rows={1} className='min-h-[38px] flex-1 resize-none rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-[14px] font-semibold text-white outline-none placeholder:text-white/45 focus:border-white/30 disabled:cursor-not-allowed disabled:opacity-50' />
                      </div>

                      {!isVideo && hasStoryText && (
                        <>
                          <div className='mb-2 flex gap-1 overflow-x-auto no-scrollbar rounded-full bg-white/[0.08] p-1'>
                            {STORY_FONT_OPTIONS.map((font) => (
                              <button key={font.id} type='button' onClick={() => setStoryFontId(font.id)} disabled={storyTextControlsDisabled} className={`h-8 shrink-0 rounded-full px-3 text-[12px] font-black transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${storyFontId === font.id ? 'bg-white text-black' : 'text-white/75 hover:bg-white/10 hover:text-white'}`} style={{ fontFamily: font.css }}>
                                {font.name}
                              </button>
                            ))}
                          </div>

                          <div className='mb-2 flex items-center gap-2 overflow-x-auto no-scrollbar'>
                            <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/80'>
                              <Palette className='h-4 w-4' />
                            </div>
                            <label className={`relative flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-white/25 bg-white/10 transition-colors duration-150 ${storyTextControlsDisabled ? 'cursor-not-allowed opacity-50' : 'hover:border-white/60'}`} aria-label='Pick custom text color'>
                              <input type='color' value={storyTextColor} onChange={(event) => setStoryTextColor(event.target.value)} disabled={storyTextControlsDisabled} className='absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed' />
                              <span className='h-5 w-5 rounded-full border border-white/30' style={{ backgroundColor: storyTextColor }} />
                            </label>
                            {STORY_TEXT_COLORS.map((color) => (
                              <button key={color} type='button' onClick={() => setStoryTextColor(color)} disabled={storyTextControlsDisabled} aria-label={`Set text color ${color}`} aria-pressed={storyTextColor.toLowerCase() === color.toLowerCase()} className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${storyTextColor.toLowerCase() === color.toLowerCase() ? 'border-white shadow-[inset_0_0_0_2px_rgba(0,0,0,0.22)]' : 'border-white/25 hover:border-white/60'}`} style={{ backgroundColor: color }}>
                                {storyTextColor.toLowerCase() === color.toLowerCase() && (
                                  <span className='flex h-5 w-5 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm'>
                                    <Check className='h-3.5 w-3.5' />
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        </>
                      )}

                      {!selectedImage && (
                        <div className='mb-2 flex gap-2 overflow-x-auto px-1 py-0.5 no-scrollbar'>
                          {STORY_BACKGROUNDS.map((background) => (
                            <button key={background.id} type='button' onClick={() => setStoryBackgroundId(background.id)} disabled={isUploading} aria-label={`Set background ${background.name}`} aria-pressed={storyBackgroundId === background.id} className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-35 ${storyBackgroundId === background.id ? 'border-white shadow-[inset_0_0_0_2px_rgba(0,0,0,0.24),0_0_0_1px_rgba(255,255,255,0.22)]' : 'border-white/25 hover:border-white/60'}`} style={{ background: background.preview }}>
                              {storyBackgroundId === background.id && (
                                <span className='flex h-5 w-5 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm'>
                                  <Check className='h-3.5 w-3.5' />
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}

                      {!isVideo && hasStoryText && (
                        <div className='space-y-2 rounded-[20px] border border-white/10 bg-white/[0.07] p-2'>
                          <div className='grid grid-cols-[2.25rem_minmax(0,1fr)_3rem] items-center gap-3'>
                            <div className='flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80'>
                              <SlidersHorizontal className='h-4 w-4' />
                            </div>
                            <div className='min-w-0'>
                              <div className='mb-1.5 flex items-center justify-between gap-2'>
                                <span className='text-[11px] font-black uppercase tracking-[0.14em] text-white/60'>Size</span>
                                <span className='rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-bold tabular-nums text-white/80'>{storyTextSize}px</span>
                              </div>
                              <input
                                type='range'
                                min='28'
                                max='68'
                                value={storyTextSize}
                                onChange={(event) => setStoryTextSize(Number(event.target.value))}
                                disabled={storyTextControlsDisabled}
                                aria-label='Story text size'
                                className='story-builder-range w-full'
                                style={
                                  {
                                    '--story-range-progress': `${((storyTextSize - 28) / 40) * 100}%`,
                                  } as React.CSSProperties
                                }
                              />
                            </div>
                            <div className='text-right text-[11px] font-bold text-white/50'>range</div>
                          </div>

                          <div className='grid grid-cols-[2.25rem_minmax(0,1fr)_3rem] items-center gap-3'>
                            <div className='flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80'>
                              <Type className='h-4 w-4' />
                            </div>
                            <div className='min-w-0'>
                              <div className='mb-1.5 flex items-center justify-between gap-2'>
                                <span className='text-[11px] font-black uppercase tracking-[0.14em] text-white/60'>Vertical</span>
                                <span className='rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-bold tabular-nums text-white/80'>{storyTextPosition}%</span>
                              </div>
                              <input
                                type='range'
                                min='24'
                                max='74'
                                value={storyTextPosition}
                                onChange={(event) => setStoryTextPosition(Number(event.target.value))}
                                disabled={storyTextControlsDisabled}
                                aria-label='Story text vertical position'
                                className='story-builder-range w-full'
                                style={
                                  {
                                    '--story-range-progress': `${((storyTextPosition - 24) / 50) * 100}%`,
                                  } as React.CSSProperties
                                }
                              />
                            </div>
                            <div className='text-right text-[11px] font-bold text-white/50'>top</div>
                          </div>
                        </div>
                      )}

                      {!isVideo && hasStoryText && (
                        <div className='mt-2 grid grid-cols-3 gap-2'>
                          {[
                            {
                              value: 'left' as const,
                              icon: AlignLeft,
                              label: 'Left',
                            },
                            {
                              value: 'center' as const,
                              icon: AlignCenter,
                              label: 'Center',
                            },
                            {
                              value: 'right' as const,
                              icon: AlignRight,
                              label: 'Right',
                            },
                          ].map((option) => {
                            const AlignIcon = option.icon;
                            return (
                              <button key={option.value} type='button' onClick={() => setStoryTextAlign(option.value)} disabled={storyTextControlsDisabled} aria-label={`${option.label} align`} className={`flex h-9 items-center justify-center rounded-full border transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${storyTextAlign === option.value ? 'border-white bg-white text-black' : 'border-white/15 bg-white/10 text-white hover:bg-white/15'}`}>
                                <AlignIcon className='h-4 w-4' />
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className='grid grid-cols-[3rem_minmax(0,1fr)] gap-2'>
                      <button
                        type='button'
                        onClick={() => {
                          if (!isUploading) resetUploadState();
                        }}
                        disabled={isUploading}
                        aria-label='Cancel story'
                        className='flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white shadow-lg backdrop-blur-2xl transition-all duration-150 hover:bg-white/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-45'
                      >
                        <X className='h-5 w-5' />
                      </button>

                      <button type='button' onClick={handleShareStory} disabled={isUploading} className='flex h-12 min-w-0 items-center justify-center gap-2 rounded-full bg-white px-5 text-[14px] font-black tracking-[-0.011em] text-black shadow-[0_18px_60px_rgba(255,255,255,0.25)] transition-all duration-150 hover:bg-gray-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-white/45 disabled:text-black/50'>
                        {isUploading ? (
                          <>
                            <Loader2 className='h-5 w-5 animate-spin' />
                            <span className='truncate'>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Send className='h-5 w-5' />
                            <span className='truncate'>Share Story</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {isUploading && (
                  <div className='absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm'>
                    <div className='flex flex-col items-center gap-3 rounded-3xl border border-white/15 bg-white/10 px-6 py-5 text-white shadow-[0_24px_90px_rgba(0,0,0,0.45)] backdrop-blur-2xl'>
                      <Loader2 className='h-8 w-8 animate-spin' />
                      <p className='text-sm font-semibold'>Uploading story...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null,
          portalRoot
        )}
    </div>
  );
};

export default Stories;
