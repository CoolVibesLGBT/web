import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, ChevronLeft, ChevronRight, Heart, MessageCircle, Share } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { api } from '../services/api';
import { Actions } from '../services/actions';
import { useAuth } from '../contexts/AuthContext';
import { getSafeImageURL } from '../helpers/helpers';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';

const Stories: React.FC = () => {
  const { theme } = useTheme();
  const { user: authUser } = useAuth();
  const [selectedStory, setSelectedStory] = useState<number | string | null>(null);
  const [showAddStoryModal, setShowAddStoryModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [stories, setStories] = useState<Array<{
    id: number | string;
    name: string;
    avatar: string | null;
    cover: string | null;
    userCover?: string | null; // User's profile cover for video preview
    isOwn?: boolean;
    hasStory?: boolean;
    storyId?: string;
    storyMedia?: any;
    allStories?: Array<{
      id: string;
      media: any;
      created_at: string;
    }>;
  }>>([]);
  const [loadingStories, setLoadingStories] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const x = useMotionValue(0);
  const [itemWidth, setItemWidth] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const storyViewerX = useMotionValue(0);
  const [isStoryViewerDragging, setIsStoryViewerDragging] = useState(false);

  const selectedStoryData = selectedStory ? stories.find(s => s.id === selectedStory) : null;
  const availableStories = stories.filter(s => s.hasStory);

  const navigate = useNavigate()

  // Separate own story button from other stories
  const otherStories = stories;

  // Fetch stories from API
  useEffect(() => {
    const fetchStories = async () => {
      try {
        setLoadingStories(true);
        const response = await api.call(Actions.CMD_USER_FETCH_STORIES, {
          method: "POST",
          body: { limit: 100 }, // Increased limit to show all stories
        });

        // Transform API response to match component structure
        // API returns { stories: [...] }
        const storiesData = response?.stories || [];

        // Filter out expired stories
        const activeStories = storiesData.filter((story: any) => !story.is_expired);

        // Sort all stories by created_at (newest first) - no grouping
        const sortedStories = [...activeStories].sort((a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        // Transform each story to a card (no grouping by user)
        const transformedStories = sortedStories.map((story: any) => {
          const user = story.user;
          const isVideo = story?.media?.file?.mime_type?.startsWith('video/');

          let storyCover = null;
          if (isVideo) {
            // Video için poster kullan, yoksa user cover/avatar
            storyCover = getSafeImageURL(story.media, 'poster') ||
              getSafeImageURL(user?.cover, 'medium') ||
              getSafeImageURL(user?.avatar, 'medium') ||
              null;
          } else {
            // Image için medium variant kullan
            storyCover = getSafeImageURL(story.media, 'medium') || null;
          }

          return {
            id: story.id,
            name: user?.displayname || user?.username || 'User',
            avatar: getSafeImageURL(user.avatar, 'icon'),
            cover: storyCover,
            userCover: getSafeImageURL(user?.cover, 'medium') || null,
            isOwn: story.user_id === authUser?.id,
            hasStory: true,
            storyId: story.id,
            storyMedia: story.media,
            userId: story.user_id,
            created_at: story.created_at,
          };
        });

        setStories(transformedStories);
      } catch (err: any) {
        console.error('Error fetching stories:', err);
        // On error, show empty state
        setStories([]);
      } finally {
        setLoadingStories(false);
      }
    };

    fetchStories();
  }, [authUser?.id]);

  // Calculate drag constraints for scrollable stories
  useEffect(() => {
    const calculateConstraints = () => {
      if (scrollContainerRef.current) {
        const scrollContainer = scrollContainerRef.current;
        const containerWidth = scrollContainer.offsetWidth;
        const cardWidth = 120;
        const gap = 12;
        const contentWidth = (cardWidth + gap) * stories.length - gap; // subtract last gap
        const maxDrag = Math.max(0, contentWidth - containerWidth);

        setItemWidth(maxDrag);
      }
    };

    // Delay to ensure DOM is ready
    const timer = setTimeout(calculateConstraints, 100);
    window.addEventListener('resize', calculateConstraints);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculateConstraints);
    };
  }, [stories]);

  const nextStory = () => {
    if (!selectedStory) return;
    const currentIndex = availableStories.findIndex(s => s.id === selectedStory);
    if (currentIndex < availableStories.length - 1) {
      setSelectedStory(availableStories[currentIndex + 1].id);
    } else {
      setSelectedStory(null);
    }
  };

  const prevStory = () => {
    if (!selectedStory) return;
    const currentIndex = availableStories.findIndex(s => s.id === selectedStory);
    if (currentIndex > 0) {
      setSelectedStory(availableStories[currentIndex - 1].id);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const fileType = file.type;
      const isVideoFile = fileType.startsWith('video/');
      setIsVideo(isVideoFile);

      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setShowAddStoryModal(true);
        setUploadError(null);
      };
      reader.readAsDataURL(file);
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
      const response = await api.call(Actions.CMD_USER_UPLOAD_STORY, {
        method: "POST",
        body: { story: selectedFile },
      });

      // Handle successful upload
      console.log('Story uploaded successfully:', response);

      // Close modal and reset state
      setShowAddStoryModal(false);
      setSelectedImage(null);
      setSelectedFile(null);
      setIsVideo(false);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Refresh stories list to show the newly uploaded story
      try {
        const storiesResponse = await api.call(Actions.CMD_USER_FETCH_STORIES, {
          method: "POST",
          body: { limit: 100 }, // Increased limit to show all stories
        });
        const storiesData = storiesResponse?.stories || [];

        // Filter out expired stories
        const activeStories = storiesData.filter((story: any) => !story.is_expired);

        // Sort all stories by created_at (newest first) - no grouping
        const sortedStories = [...activeStories].sort((a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        // Transform each story to a card (no grouping by user)
        const transformedStories = sortedStories.map((story: any) => {
          const user = story.user;
          const isVideo = story?.media?.file?.mime_type?.startsWith('video/');

          let storyCover = null;
          if (isVideo) {
            // Video için poster kullan, yoksa user cover/avatar
            storyCover = getSafeImageURL(story.media, 'poster') ||
              getSafeImageURL(user?.cover, 'medium') ||
              getSafeImageURL(user?.avatar, 'medium') ||
              null;
          } else {
            // Image için medium variant kullan
            storyCover = getSafeImageURL(story.media, 'medium') || null;
          }

          return {
            id: story.id,
            name: user?.displayname || user?.username || 'User',
            avatar: getSafeImageURL(user.avatar, 'icon'),
            cover: storyCover,
            userCover: getSafeImageURL(user?.cover, 'medium') || null,
            isOwn: story.user_id === authUser?.id,
            hasStory: true,
            storyId: story.id,
            storyMedia: story.media,
            userId: story.user_id,
            created_at: story.created_at,
          };
        });

        setStories(transformedStories);
      } catch (err) {
        console.error('Error refreshing stories after upload:', err);
      }

    } catch (err: any) {
      console.error('Error uploading story:', err);
      setUploadError(err.response?.data?.message || 'Failed to upload story. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };


    const handleSendMessage = async (profile: any) => {
      console.log("ersan",profile)
      if (!story?.id || !profile?.id) {
        console.error('User or profile ID is missing');
        return;
      }
  
      try {
        // Create chat via API
        const chatResponse = await api.call<{
          chat: {
            id: string;
            type: string;
            participants?: Array<{
              user_id: string;
              user?: {
                id: string;
                username?: string;
                displayname?: string;
              };
            }>;
          };
          success: boolean;
        }>(Actions.CMD_CHAT_CREATE, {
          method: "POST",
          body: {
            type: 'private',
            participant_ids: [profile.id],
          },
        });
  
        const chatId = chatResponse?.chat?.id;
  
        if (chatId) {
          // Navigate to messages screen with chat ID
          navigate('/messages', {
            state: {
              openChat: chatId,
              userId: profile.id,
              publicId: profile.public_id,
              username: profile.username
            }
          });
        } else {
          console.error('Chat creation failed - no chat ID returned');
        }
      } catch (error) {
        console.error('Error creating chat:', error);
        // Navigate anyway, MessagesScreen will handle creating a temporary chat
        navigate('/messages', {
          state: {
            openChat: profile.username || profile.id,
            userId: profile.id,
            publicId: profile.public_id
          }
        });
      }
    };

  return (
    <>
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*,video/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Stories List - Fixed Own Story + Infinite Scrollable Others */}
      <div className="py-1 relative flex px-1" ref={containerRef}>
        {/* Loading State */}
        {loadingStories && stories.length === 0 && (
          <div className="flex gap-3 px-1">
            <div className={`flex-shrink-0 w-[120px] h-[180px] rounded-[14px] ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
              } animate-pulse`} />
            <div className={`flex-shrink-0 w-[120px] h-[180px] rounded-[14px] ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
              } animate-pulse`} />
            <div className={`flex-shrink-0 w-[120px] h-[180px] rounded-[14px] ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
              } animate-pulse`} />
          </div>
        )}

        {/* Fixed "Your Story" Button - Always visible */}
        {!loadingStories && authUser && (
          <div className="flex-shrink-0 z-2 relative">
            <div className="relative group">
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`relative w-[120px] h-[180px] rounded-[14px] overflow-hidden ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'
                  } transition-all duration-300 cursor-pointer`}
                style={{ transformOrigin: 'center' }}
              >
                <div className={`absolute inset-0 w-full h-full flex items-center justify-center ${theme === 'dark' ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'
                  }`}>
                  <div className={`w-16 h-16 rounded-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                    } flex items-center justify-center`}>
                    <Plus className={`w-8 h-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-3 z-2">
                  <div className={`backdrop-blur-xl ${theme === 'dark' ? 'bg-black/60' : 'bg-white/80'
                    } rounded-lg px-2.5 py-1.5`}>
                    <p className={`text-[13px] font-semibold tracking-[-0.006em] truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                      Your Story
                    </p>
                  </div>
                </div>

                <div className="absolute top-3 left-3 z-2">
                  <div className={`w-11 h-11 rounded-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
                    } flex items-center justify-center`}>
                    <Plus className={`w-6 h-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Stories Container */}
        {!loadingStories && (
          <div className={`flex-1 overflow-hidden relative ${authUser ? 'ml-3' : ''}`} ref={scrollContainerRef}>
            <motion.div
              className="flex space-x-3 cursor-grab active:cursor-grabbing"
              drag="x"
              dragConstraints={{ left: -itemWidth, right: 0 }}
              dragElastic={0.1}
              dragTransition={{ bounceStiffness: 600, bounceDamping: 40 }}
              style={{ x }}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={() => setTimeout(() => setIsDragging(false), 50)}
            >
              {otherStories.map((story) => (
                <div
                  key={story.id}
                  className="flex-shrink-0"
                >
                  <div className="relative group">
                    <button
                      onClick={(e) => {
                        if (isDragging) {
                          e.preventDefault();
                          return;
                        }
                        if (story.hasStory) {
                          setSelectedStory(story.id);
                        }
                      }}
                      className={`relative w-[120px] h-[180px] rounded-[14px] overflow-hidden ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'
                        } transition-all duration-300 cursor-pointer pointer-events-auto`}
                      style={{ transformOrigin: 'center' }}
                    >
                      {story.cover && (
                        <>
                          <img
                            src={story.cover}
                            alt={story.name}
                            className="w-full h-full object-cover absolute inset-0 transition-all duration-300 group-hover:scale-105"
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
                        <div className={`backdrop-blur-xl ${theme === 'dark' ? 'bg-black/60' : 'bg-white/80'
                          } rounded-lg px-2.5 py-1.5`}>
                          <p className={`text-[13px] font-semibold tracking-[-0.006em] truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>
                            {story.name}
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        )}
      </div>

    


{ReactDOM.createPortal(
  <AnimatePresence>
  
  
        <AnimatePresence>
        {selectedStory && selectedStoryData && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="
              opacity-100
              w-full
              p-4
              h-full
              transform-none
              fixed inset-0 z-[200]
            "
              style={{
                backgroundImage: theme === "dark" ? 'radial-gradient(transparent 1px, #000000 1px)' : 'radial-gradient(transparent 1px, #000000 1px)',

                backdropFilter: `blur(3px)`,
                backgroundColor: 'transparent',

                backgroundSize: '2px 3px',
                transform: "none",
                maskImage: 'linear-gradient(#ffffff calc(100% - 20px), transparent)',
                WebkitMaskImage: 'linear-gradient(#ffffff calc(100% - 20px), transparent)', // Safari için
              }}

            />

            {/* Story Viewer Container */}
            <div className="fixed inset-0 z-[201] flex items-center justify-center">
              {/* Close Button - Flat */}
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedStory(null)}
                className="absolute top-12  right-8 z-20 w-12 h-12 rounded-full bg-white/50 border border-2 border-black backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:bg-white/20"
              >
                <X className="w-6 h-6" />
              </motion.button>

              {/* Navigation Buttons - Flat */}
              {availableStories.findIndex(s => s.id === selectedStory) > 0 && (
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  whileHover={{ scale: 1.05, x: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={prevStory}
                  className="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 border border-2 border-black rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center transition-all duration-300 hover:bg-white/20 z-20"
                >
                  <ChevronLeft className="w-7 h-7" />
                </motion.button>
              )}

              {availableStories.findIndex(s => s.id === selectedStory) < availableStories.length - 1 && (
                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  whileHover={{ scale: 1.05, x: 5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={nextStory}
                  className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center border border-2 border-black transition-all duration-300 hover:bg-white/20 z-20"
                >
                  <ChevronRight className="w-7 h-7" />
                </motion.button>
              )}

              {/* Story Content - Premium Card */}
              <motion.div
                onClick={() => {
                  if (!isStoryViewerDragging) {
                    setSelectedStory(null)
                  }
                }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                dragTransition={{ bounceStiffness: 300, bounceDamping: 30 }}
                onDragStart={() => setIsStoryViewerDragging(true)}
                onDragEnd={(_, info) => {
                  setIsStoryViewerDragging(false);
                  const threshold = 50;
                  if (info.offset.x > threshold) {
                    // Swipe right - previous story
                    prevStory();
                  } else if (info.offset.x < -threshold) {
                    // Swipe left - next story
                    nextStory();
                  }
                  storyViewerX.set(0);
                }}
                style={{ x: storyViewerX }}
                key={selectedStory}
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="p-3 relative rounded-3xl w-screen h-screen mx-auto flex items-center justify-center"
              >
                <div className="relative mx-auto w-full h-full max-h-[95dvh] max-w-sm rounded-3xl overflow-hidden">
                  {/* Story Media (Image or Video) */}
                  {(() => {
                    const isVideoMedia = selectedStoryData.storyMedia?.file?.mime_type?.startsWith('video/');

                    let mediaUrl = '';
                    let posterUrl = '';

                    if (isVideoMedia) {
                      // Video için - variants'tan al
                      // Öncelik: high > medium > low > preview > original
                      mediaUrl = getSafeImageURL(selectedStoryData.storyMedia, 'high') ||
                        getSafeImageURL(selectedStoryData.storyMedia, 'medium') ||
                        getSafeImageURL(selectedStoryData.storyMedia, 'low') ||
                        getSafeImageURL(selectedStoryData.storyMedia, 'preview') ||
                        getSafeImageURL(selectedStoryData.storyMedia, 'original') ||
                        selectedStoryData.storyMedia?.file?.url || '';

                      // Poster'ı al
                      posterUrl = getSafeImageURL(selectedStoryData.storyMedia, 'poster') || '';
                    } else {
                      mediaUrl = selectedStoryData.cover || '';
                    }

                    if (!mediaUrl) return null;

                    return isVideoMedia ? (
                      <motion.video
                        key={mediaUrl}
                        initial={{ scale: 1.1 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.6 }}
                        src={mediaUrl}
                        poster={posterUrl}
                        className="w-full h-full rounded-3xl object-cover"
                        controls
                        autoPlay
                        loop
                        playsInline
                      />
                    ) : (
                      <motion.img
                        key={mediaUrl}
                        initial={{ scale: 1.1 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.6 }}
                        src={mediaUrl}
                        alt={selectedStoryData.name}
                        className="w-full h-full rounded-3xl object-cover"
                      />
                    );
                  })()}

                  {/* Premium Gradient Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

                  {/* Progress Bars */}
                  <div className="absolute top-0 left-0 right-0 p-3 z-2 flex gap-1">
                    {availableStories.map((story, index) => (
                      <div
                        key={story.id}
                        className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden backdrop-blur-sm"
                      >
                        <motion.div
                          initial={{ width: availableStories.findIndex(s => s.id === selectedStory) > index ? '100%' : '0%' }}
                          animate={{
                            width: story.id === selectedStory ? '100%' :
                              availableStories.findIndex(s => s.id === selectedStory) > index ? '100%' : '0%'
                          }}
                          transition={{ duration: story.id === selectedStory ? 5 : 0.3 }}
                          className="h-full bg-white rounded-full shadow-lg"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Story Header - Flat */}
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="absolute top-12 left-0 right-0 px-4 z-2"
                  >
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
                  </motion.div>

                  {/* Story Actions - Flat */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="absolute bottom-6 left-0 right-0 px-6 z-2"
                  >
                    <div className="flex items-center justify-center gap-6">
                      <motion.button
                        whileHover={{ scale: 1.1, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex flex-col items-center gap-2"
                      >
                        <div className="w-14 h-14 rounded-full bg-white/15 backdrop-blur-xl flex items-center justify-center text-white transition-all duration-300 hover:bg-white/25">
                          <Heart className="w-6 h-6" />
                        </div>
                        <span className="text-white text-[13px] font-semibold drop-shadow-lg">Like</span>
                      </motion.button>

                      <motion.button
                      onClick={()=>{
                       handleSendMessage(selectedStory)
                      }}
                        whileHover={{ scale: 1.1, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex flex-col items-center gap-2"
                      >
                        <div className="w-14 h-14 rounded-full bg-white/15 backdrop-blur-xl flex items-center justify-center text-white transition-all duration-300 hover:bg-white/25">
                          <MessageCircle className="w-6 h-6" />
                        </div>
                        <span className="text-white text-[13px] font-semibold drop-shadow-lg">Reply</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.1, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex flex-col items-center gap-2"
                      >
                        <div className="w-14 h-14 rounded-full bg-white/15 backdrop-blur-xl flex items-center justify-center text-white transition-all duration-300 hover:bg-white/25">
                          <Share className="w-6 h-6" />
                        </div>
                        <span className="text-white text-[13px] font-semibold drop-shadow-lg">Share</span>
                      </motion.button>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

  </AnimatePresence>,
  document.body
)}

      {ReactDOM.createPortal(
        <AnimatePresence>
          {showAddStoryModal && selectedImage && (
            <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={`relative w-full max-w-[420px] rounded-3xl overflow-hidden ${theme === 'dark'
                    ? 'bg-gradient-to-br from-gray-900/95 to-gray-900/60 backdrop-blur-xl'
                    : 'bg-gradient-to-br from-white/95 to-gray-50/60 backdrop-blur-xl'
                  }`}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className={`relative w-full max-w-[420px] rounded-3xl overflow-hidden ${theme === 'dark'
                      ? 'bg-gradient-to-br from-gray-900/95 to-gray-900/60 backdrop-blur-xl'
                      : 'bg-gradient-to-br from-white/95 to-gray-50/60 backdrop-blur-xl'
                    }`}
                >
                  {/* Close Button */}
                  <motion.button
                    onClick={() => {
                      if (!isUploading) {
                        setShowAddStoryModal(false);
                        setSelectedImage(null);
                        setSelectedFile(null);
                        setIsVideo(false);
                        setUploadError(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }
                    }}
                    disabled={isUploading}
                    whileHover={!isUploading ? { scale: 1.1, rotate: 90 } : {}}
                    whileTap={!isUploading ? { scale: 0.9 } : {}}
                    className={`absolute top-5 right-5 z-20 w-11 h-11 rounded-full backdrop-blur-xl flex items-center justify-center transition-all duration-300 ${isUploading
                        ? 'bg-gray-400/20 text-gray-500 cursor-not-allowed'
                        : theme === 'dark'
                          ? 'bg-white/10 hover:bg-white/20 text-white'
                          : 'bg-black/10 hover:bg-black/20 text-gray-900'
                      }`}
                  >
                    <X className="w-6 h-6" />
                  </motion.button>

                  {/* Header */}
                  <div className={`px-6 py-5 ${theme === 'dark' ? 'border-b border-white/5' : 'border-b border-black/5'
                    }`}>
                    <h3 className={`text-xl font-bold tracking-[-0.022em] ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                      Create Story
                    </h3>
                    <p className={`text-[13px] mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                      Share a moment with your friends
                    </p>
                  </div>

                  {/* Media Preview */}
                  <div className={`relative w-full  max-h[450px] h-[450px] ${theme === 'dark' ? 'bg-black/40' : 'bg-gray-900'
                    }`}>
                    {isVideo && selectedImage ? (
                      <motion.video
                        initial={{ scale: 1.1, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        src={selectedImage}
                        className="w-full h-full object-cover"
                        controls
                        autoPlay
                        loop
                        muted
                      />
                    ) : selectedImage ? (
                      <motion.img
                        initial={{ scale: 1.1, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        src={selectedImage}
                        alt="Story preview"
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                    {/* Media Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                    {/* Loading Overlay */}
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20">
                        <div className="flex flex-col items-center gap-3">
                          <div className={`w-8 h-8 border-2 border-t-transparent rounded-full animate-spin ${theme === 'dark' ? 'border-white' : 'border-white'
                            }`} />
                          <p className="text-white text-sm font-medium">Uploading story...</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Error Message */}
                  {uploadError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mx-5 mb-3 p-3 rounded-xl border ${theme === 'dark'
                          ? 'bg-red-900/20 border-red-700 text-red-300'
                          : 'bg-red-50 border-red-200 text-red-700'
                        }`}
                    >
                      <p className="text-sm font-medium">{uploadError}</p>
                    </motion.div>
                  )}

                  {/* Action Buttons */}
                  <div className={`p-5 flex gap-3 backdrop-blur-xl ${theme === 'dark'
                      ? 'bg-gray-900/40 border-t border-white/5'
                      : 'bg-white/40 border-t border-black/5'
                    }`}>
                    <motion.button
                      onClick={handleShareStory}
                      disabled={isUploading}
                      whileHover={!isUploading ? { scale: 1.02 } : {}}
                      whileTap={!isUploading ? { scale: 0.98 } : {}}
                      className={`flex-1 px-5 py-3.5 rounded-2xl font-bold text-[15px] tracking-[-0.011em] shadow-lg transition-all duration-300 flex items-center justify-center gap-2 ${isUploading
                          ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                          : theme === 'dark'
                            ? 'bg-white text-black hover:bg-gray-100'
                            : 'bg-black text-white hover:bg-gray-900'
                        }`}
                    >
                      {isUploading ? (
                        <>
                          <div className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin ${theme === 'dark' ? 'border-black' : 'border-white'
                            }`} />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        'Share Story'
                      )}
                    </motion.button>
                    <motion.button
                      onClick={() => {
                        if (!isUploading) {
                          setShowAddStoryModal(false);
                          setSelectedImage(null);
                          setSelectedFile(null);
                          setUploadError(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }
                      }}
                      disabled={isUploading}
                      whileHover={!isUploading ? { scale: 1.02 } : {}}
                      whileTap={!isUploading ? { scale: 0.98 } : {}}
                      className={`px-5 py-3.5 rounded-2xl font-bold text-[15px] tracking-[-0.011em] transition-all duration-300 ${isUploading
                          ? 'bg-gray-400/20 text-gray-500 cursor-not-allowed'
                          : theme === 'dark'
                            ? 'bg-white/10 hover:bg-white/20 text-white'
                            : 'bg-black/10 hover:bg-black/20 text-gray-900'
                        }`}
                    >
                      Cancel
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}


    </>
  );
};

export default Stories;