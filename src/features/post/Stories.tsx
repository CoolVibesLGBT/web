import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Plus, X, ChevronLeft, ChevronRight, Heart, MessageCircle, Share } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { getSafeImageURL, getSafeImageURLEx } from '../../helpers/helpers';
import { useNavigate } from 'react-router-dom';

const STORY_LIMIT = 10;

interface User {
  id: string | number;
  public_id?: string;
  username?: string;
  displayname?: string;
  avatar?: string | null;
  cover?: string | null;
}

interface Media {
  id?: string | number;
  file?: {
    url?: string;
    mime_type?: string;
  };
  thumbnail?: string;
  small?: string;
  icon?: string;
  medium?: string;
  large?: string;
  high?: string;
  low?: string;
  preview?: string;
  poster?: string;
  original?: string;
}

interface Story {
  id: string | number;
  user_id: string | number;
  user?: User;
  media?: Media;
  is_expired?: boolean;
  created_at: string;
}

type StoryCard = {
  id: number | string;
  name: string;
  avatar: string | null;
  cover: string | null;
  userCover?: string | null;
  isOwn?: boolean;
  hasStory?: boolean;
  storyId?: string;
  storyMedia?: Media;
  userId?: string | number;
  user?: User;
  created_at?: string;
};

const Stories: React.FC = () => {
  const { theme } = useTheme();
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const portalRoot = typeof document !== 'undefined' ? document.body : null;

  const [selectedStory, setSelectedStory] = useState<number | string | null>(null);
  const [showAddStoryModal, setShowAddStoryModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [stories, setStories] = useState<StoryCard[]>([]);
  const [loadingStories, setLoadingStories] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableStories = useMemo(() => stories.filter((s) => s.hasStory), [stories]);
  const selectedStoryData = useMemo(
    () => (selectedStory ? stories.find((s) => s.id === selectedStory) : null),
    [selectedStory, stories]
  );
  const storyViewerIndex = useMemo(
    () => (selectedStory ? availableStories.findIndex((s) => s.id === selectedStory) : -1),
    [availableStories, selectedStory]
  );

  const buildStoryCover = useCallback((story: Story, user: User | undefined, isVideoMedia: boolean) => {
    if (isVideoMedia) {
      return (
        getSafeImageURL(story.media, 'poster') ||
        getSafeImageURL(story.media, 'preview') ||
        getSafeImageURL(story.media, 'low') ||
        getSafeImageURL(story.media, 'medium') ||
        getSafeImageURL(story.media, 'large') ||
        getSafeImageURL(user?.cover, 'medium') ||
        getSafeImageURL(user?.avatar, 'medium') ||
        null
      );
    }

    return (
      getSafeImageURL(story.media, 'thumbnail') ||
      getSafeImageURL(story.media, 'small') ||
      getSafeImageURL(story.media, 'icon') ||
      getSafeImageURL(story.media, 'medium') ||
      getSafeImageURL(story.media, 'large') ||
      null
    );
  }, []);

  const transformStories = useCallback((storiesData: Story[]) => {
    const activeStories = storiesData.filter((story) => story.is_expired !== true);
    const sortedStories = [...activeStories].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return sortedStories.map((story: Story) => {
      const user = story.user;
      const isVideoMedia = story?.media?.file?.mime_type?.startsWith('video/');
      const avatarIcon = getSafeImageURLEx(user?.public_id, user?.avatar, 'icon');
      const avatarMedium = getSafeImageURLEx(user?.public_id, user?.avatar, 'medium');

      return {
        id: story.id,
        name: user?.displayname || user?.username || 'User',
        avatar: avatarIcon,
        cover: buildStoryCover(story, user, !!isVideoMedia),
        userCover: avatarMedium,
        isOwn: story.user_id === authUser?.id,
        hasStory: true,
        storyId: story.id.toString(),
        storyMedia: story.media,
        userId: story.user_id,
        user,
        created_at: story.created_at,
      } as StoryCard;
    });
  }, [authUser?.id, buildStoryCover]);

  const loadMockStories = useCallback(async () => {
    try {
      const response = await fetch('/data/stories.json');
      if (!response.ok) return [];
      const payload = await response.json();
      return payload?.data?.stories || payload?.stories || [];
    } catch (error) {
      console.error('Error loading mock stories:', error);
      return [];
    }
  }, []);

  const fetchStories = useCallback(async () => {
    try {
      setLoadingStories(true);
      const response = (await api.fetchStories({ limit: STORY_LIMIT })) as {
        stories?: Story[];
        data?: { stories?: Story[] };
      };
      const storiesData = response?.stories || response?.data?.stories || [];
      if (storiesData.length === 0) {
        const mockData = await loadMockStories();
        setStories(transformStories(mockData));
        return;
      }
      setStories(transformStories(storiesData));
    } catch (err) {
      console.error('Error fetching stories:', err);
      const mockData = await loadMockStories();
      setStories(transformStories(mockData));
    } finally {
      setLoadingStories(false);
    }
  }, [transformStories, loadMockStories]);

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

    setSelectedFile(file);
    const isVideoFile = file.type.startsWith('video/');
    setIsVideo(isVideoFile);

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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleShareStory = async () => {
    if (!selectedFile) {
      setUploadError('No file selected');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      await api.uploadStory({ story: selectedFile });
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

  const handleSendMessage = async (profile: User) => {
    if (!authUser?.id || !profile?.id) {
      console.error('User or profile ID is missing');
      return;
    }

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

  const renderStoryMedia = () => {
    if (!selectedStoryData) return null;

    const isVideoMedia = selectedStoryData.storyMedia?.file?.mime_type?.startsWith('video/');
    let mediaUrl = '';
    let posterUrl = '';

    if (isVideoMedia) {
      mediaUrl =
        getSafeImageURL(selectedStoryData.storyMedia, 'high') ||
        getSafeImageURL(selectedStoryData.storyMedia, 'medium') ||
        getSafeImageURL(selectedStoryData.storyMedia, 'low') ||
        getSafeImageURL(selectedStoryData.storyMedia, 'preview') ||
        getSafeImageURL(selectedStoryData.storyMedia, 'original') ||
        selectedStoryData.storyMedia?.file?.url ||
        '';
      posterUrl = getSafeImageURL(selectedStoryData.storyMedia, 'poster') || '';
    } else {
      mediaUrl = selectedStoryData.cover || '';
    }

    if (!mediaUrl) return null;

    return isVideoMedia ? (
      <video
        key={mediaUrl}
        src={mediaUrl}
        poster={posterUrl}
        className="w-full h-full rounded-3xl object-cover"
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
        className="w-full h-full rounded-3xl object-cover"
      />
    );
  };

  return (
    <div className="w-full h-full">
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*,video/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="relative flex px-1">
        {loadingStories && stories.length === 0 && (
          <div className="flex gap-3 px-1">
            <div className={`flex-shrink-0 w-[120px] h-[180px] rounded-[14px] ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'} animate-pulse`} />
            <div className={`flex-shrink-0 w-[120px] h-[180px] rounded-[14px] ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'} animate-pulse`} />
            <div className={`flex-shrink-0 w-[120px] h-[180px] rounded-[14px] ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'} animate-pulse`} />
          </div>
        )}

        {!loadingStories && authUser && (
          <div className="flex-shrink-0 z-2 relative">
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`relative w-[120px] h-[180px] rounded-[14px] overflow-hidden ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'} transition-colors duration-200 cursor-pointer`}
            >
              <div className={`absolute inset-0 w-full h-full flex items-center justify-center ${theme === 'dark' ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>
                <div className={`w-16 h-16 rounded-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} flex items-center justify-center`}>
                  <Plus className={`w-8 h-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3 z-2">
                <div className={`backdrop-blur-xl ${theme === 'dark' ? 'bg-black/60' : 'bg-white/80'} rounded-lg px-2.5 py-1.5`}>
                  <p className={`text-[13px] font-semibold tracking-[-0.006em] truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Your Story
                  </p>
                </div>
              </div>
              <div className="absolute top-3 left-3 z-2">
                <div className={`w-11 h-11 rounded-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'} flex items-center justify-center`}>
                  <Plus className={`w-6 h-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                </div>
              </div>
            </button>
          </div>
        )}

        {!loadingStories && (
          <div className={`flex-1 overflow-x-auto overflow-y-hidden scrollbar-hide ${authUser ? 'ml-3' : ''}`}>
            <div className="flex space-x-3">
              {stories.map((story, index) => (
                <div key={story.id} className="flex-shrink-0">
                  <div className="relative">
                    <button
                      onClick={() => {
                        if (story.hasStory) {
                          setSelectedStory(story.id);
                        }
                      }}
                      className={`relative w-[120px] h-[180px] rounded-[14px] overflow-hidden ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'} transition-colors duration-200 cursor-pointer`}
                    >
                      {story.cover && (
                        <>
                          <img
                            src={story.cover}
                            alt={story.name}
                            className="w-full h-full object-cover absolute inset-0 transition-transform duration-300 group-hover:scale-105"
                            loading={index === 0 ? 'eager' : 'lazy'}
                            decoding="async"
                            fetchPriority={index === 0 ? 'high' : 'low'}
                            width={120}
                            height={180}
                            sizes="120px"
                          />
                          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
                        </>
                      )}

                      {story.avatar && (
                        <div className="absolute top-3 left-3 z-2">
                          <div className="w-11 h-11 rounded-full ring-2 ring-white/20">
                            <img
                              src={story.avatar}
                              alt={story.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          </div>
                        </div>
                      )}

                      <div className="absolute bottom-0 left-0 right-0 p-3 z-2">
                        <div className={`backdrop-blur-xl ${theme === 'dark' ? 'bg-black/60' : 'bg-white/80'} rounded-lg px-2.5 py-1.5`}>
                          <p className={`text-[13px] font-semibold tracking-[-0.006em] truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {story.name}
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {portalRoot && createPortal(
        selectedStory && selectedStoryData ? (
          <div className="fixed inset-0 z-[200]">
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

            <div className="fixed inset-0 z-[201] flex items-center justify-center">
              <button
                onClick={() => setSelectedStory(null)}
                className="absolute top-12 right-8 z-20 w-12 h-12 rounded-full bg-white/50 border border-2 border-black backdrop-blur-sm flex items-center justify-center transition-all duration-200 hover:bg-white/20"
              >
                <X className="w-6 h-6" />
              </button>

              {storyViewerIndex > 0 && (
                <button
                  onClick={prevStory}
                  className="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 border border-2 border-black rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center transition-all duration-200 hover:bg-white/20 z-20"
                >
                  <ChevronLeft className="w-7 h-7" />
                </button>
              )}

              {storyViewerIndex < availableStories.length - 1 && (
                <button
                  onClick={nextStory}
                  className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center border border-2 border-black transition-all duration-200 hover:bg-white/20 z-20"
                >
                  <ChevronRight className="w-7 h-7" />
                </button>
              )}

              <div className="p-3 relative rounded-3xl w-screen h-screen mx-auto flex items-center justify-center">
                <div className="relative mx-auto w-full h-full max-h-[95dvh] max-w-sm rounded-3xl overflow-hidden">
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
                          <p className="text-white/80 text-[13px] font-medium drop-shadow-lg">2h ago</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-6 left-0 right-0 px-6 z-2">
                    <div className="flex items-center justify-center gap-6">
                      <button className="flex flex-col items-center gap-2">
                        <div className="w-14 h-14 rounded-full bg-white/15 backdrop-blur-xl flex items-center justify-center text-white transition-all duration-200 hover:bg-white/25">
                          <Heart className="w-6 h-6" />
                        </div>
                        <span className="text-white text-[13px] font-semibold drop-shadow-lg">Like</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selectedStoryData?.user) {
                            handleSendMessage(selectedStoryData.user);
                          }
                        }}
                        className="flex flex-col items-center gap-2"
                      >
                        <div className="w-14 h-14 rounded-full bg-white/15 backdrop-blur-xl flex items-center justify-center text-white transition-all duration-200 hover:bg-white/25">
                          <MessageCircle className="w-6 h-6" />
                        </div>
                        <span className="text-white text-[13px] font-semibold drop-shadow-lg">Reply</span>
                      </button>

                      <button className="flex flex-col items-center gap-2">
                        <div className="w-14 h-14 rounded-full bg-white/15 backdrop-blur-xl flex items-center justify-center text-white transition-all duration-200 hover:bg-white/25">
                          <Share className="w-6 h-6" />
                        </div>
                        <span className="text-white text-[13px] font-semibold drop-shadow-lg">Share</span>
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

      {portalRoot && createPortal(
        showAddStoryModal && selectedImage ? (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div
              className={`relative w-full max-w-[420px] rounded-3xl overflow-hidden ${theme === 'dark'
                ? 'bg-gradient-to-br from-gray-900/95 to-gray-900/60 backdrop-blur-xl'
                : 'bg-gradient-to-br from-white/95 to-gray-50/60 backdrop-blur-xl'
                }`}
            >
              <button
                onClick={() => {
                  if (!isUploading) resetUploadState();
                }}
                disabled={isUploading}
                className={`absolute top-5 right-5 z-20 w-11 h-11 rounded-full backdrop-blur-xl flex items-center justify-center transition-all duration-200 ${isUploading
                  ? 'bg-gray-400/20 text-gray-500 cursor-not-allowed'
                  : theme === 'dark'
                    ? 'bg-white/10 hover:bg-white/20 text-white'
                    : 'bg-black/10 hover:bg-black/20 text-gray-900'
                  }`}
              >
                <X className="w-6 h-6" />
              </button>

              <div className={`px-6 py-5 ${theme === 'dark' ? 'border-b border-white/5' : 'border-b border-black/5'}`}>
                <h3 className={`text-xl font-bold tracking-[-0.022em] ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Create Story
                </h3>
                <p className={`text-[13px] mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Share a moment with your friends
                </p>
              </div>

              <div className={`relative w-full max-h-[450px] h-[450px] ${theme === 'dark' ? 'bg-black/40' : 'bg-gray-900'}`}>
                {isVideo && selectedImage ? (
                  <video
                    src={selectedImage}
                    className="w-full h-full object-cover"
                    controls
                    autoPlay
                    loop
                    muted
                  />
                ) : selectedImage ? (
                  <img
                    src={selectedImage}
                    alt="Story preview"
                    className="w-full h-full object-cover"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                {isUploading && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20">
                    <div className="flex flex-col items-center gap-3">
                      <div className={`w-8 h-8 border-2 border-t-transparent rounded-full animate-spin ${theme === 'dark' ? 'border-white' : 'border-white'}`} />
                      <p className="text-white text-sm font-medium">Uploading story...</p>
                    </div>
                  </div>
                )}
              </div>

              {uploadError && (
                <div
                  className={`mx-5 mb-3 p-3 rounded-xl border ${theme === 'dark'
                    ? 'bg-red-900/20 border-red-700 text-red-300'
                    : 'bg-red-50 border-red-200 text-red-700'
                    }`}
                >
                  <p className="text-sm font-medium">{uploadError}</p>
                </div>
              )}

              <div className={`p-5 flex gap-3 backdrop-blur-xl ${theme === 'dark' ? 'bg-gray-900/40 border-t border-white/5' : 'bg-white/40 border-t border-black/5'}`}>
                <button
                  onClick={handleShareStory}
                  disabled={isUploading}
                  className={`flex-1 px-5 py-3.5 rounded-2xl font-bold text-[15px] tracking-[-0.011em] shadow-lg transition-all duration-200 flex items-center justify-center gap-2 ${isUploading
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : theme === 'dark'
                      ? 'bg-white text-black hover:bg-gray-100'
                      : 'bg-black text-white hover:bg-gray-900'
                    }`}
                >
                  {isUploading ? (
                    <>
                      <div className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin ${theme === 'dark' ? 'border-black' : 'border-white'}`} />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    'Share Story'
                  )}
                </button>
                <button
                  onClick={() => {
                    if (!isUploading) resetUploadState();
                  }}
                  disabled={isUploading}
                  className={`px-5 py-3.5 rounded-2xl font-bold text-[15px] tracking-[-0.011em] transition-all duration-200 ${isUploading
                    ? 'bg-gray-400/20 text-gray-500 cursor-not-allowed'
                    : theme === 'dark'
                      ? 'bg-white/10 hover:bg-white/20 text-white'
                      : 'bg-black/10 hover:bg-black/20 text-gray-900'
                    }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : null,
        portalRoot
      )}
    </div>
  );
};

export default Stories;
