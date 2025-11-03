import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Heart, MessageCircle, Share, Bookmark, MoreHorizontal, MapPin, Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import PostReply from './PostReply';
import VideoPlayer from './VideoPlayer';
import { api } from '../services/api';

// API data structure interfaces
interface ApiPost {
  id: string;
  public_id: string;
  author_id: string;
  type: string;
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
  };
  attachments?: Array<{
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
  poll?: Array<{
    id: string;
    post_id: string;
    contentable_id: string;
    contentable_type: string;
    question: {
      en: string;
    };
    duration: string;
    created_at: string;
    updated_at: string;
    choices: Array<{
      id: string;
      poll_id: string;
      label: {
        en: string;
      };
      vote_count: number;
      voters?: Array<{
        id: string;
        username: string;
        displayname: string;
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
}

interface PostProps {
  post: ApiPost;
  onPostClick?: (postId: string, username: string) => void;
  onProfileClick?: (username: string) => void;
  isDetailView?: boolean;
  showChildren?: boolean;
  onRefreshParent?: () => void;
}

const Post: React.FC<PostProps> = ({ post, onPostClick, onProfileClick, isDetailView, showChildren = false, onRefreshParent }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [selectedPollChoices, setSelectedPollChoices] = useState<Record<string, string>>({});
  const [eventStatus, setEventStatus] = useState<'going' | 'not_going' | 'maybe' | null>(null);
  const [showReply, setShowReply] = useState(isDetailView || false);
  const [children, setChildren] = useState<ApiPost[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const { theme } = useTheme();

  // Fetch children (replies) when in detail view
  useEffect(() => {
    if (isDetailView && post.public_id) {
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
    }
  }, [isDetailView, post.public_id]);

  // Handle image load
  const handleImageLoad = useCallback((imageUrl: string) => {
    setLoadedImages(prev => new Set(prev).add(imageUrl));
  }, []);

  // Handle profile click
  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent post click
    onProfileClick?.(post.author.username);
  };

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
    if (!poll) return 0;
    return poll.choices.reduce((total: number, choice: any) => total + choice.vote_count, 0);
  };

  // Calculate percentage for poll choice
  const getChoicePercentage = (voteCount: number, poll: NonNullable<typeof post.poll>[0]) => {
    const total = getTotalVotes(poll);
    if (total === 0) return 0;
    return Math.round((voteCount / total) * 100);
  };

  const handlePollVote = (pollId: string, choiceId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent post click
    if (selectedPollChoices[pollId]) return; // Already voted in this poll
    setSelectedPollChoices(prev => ({
      ...prev,
      [pollId]: choiceId
    }));
    // TODO: Send vote to API
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
        <div className={`absolute inset-0 rounded-2xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
          }`}>
          <div className={`absolute inset-0 rounded-2xl shimmer-animation ${theme === 'dark'
              ? 'bg-gradient-to-r from-gray-800 via-gray-700/50 to-gray-800'
              : 'bg-gradient-to-r from-gray-200 via-gray-300/50 to-gray-200'
            }`}
            style={{
              backgroundSize: '200% 100%'
            }} />
        </div>
      </div>
    </>
  );

  return (
    <>
      <div
        className={`overflow-hidden border-b ${theme === 'dark'
            ? 'bg-black border-gray-800/40'
            : 'bg-white border-gray-100'
          } ${onPostClick ? 'hover:bg-gray-50 dark:hover:bg-gray-900/30 hover:shadow-sm' : ''} transition-all duration-300 ease-out`}
      >
        {/* Post Header */}
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleProfileClick}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200 ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
                }`}
            >
              <span className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                {post.author.displayname.charAt(0).toUpperCase()}
              </span>
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleProfileClick}
                  className={`font-semibold hover:underline transition-colors duration-200 ${theme === 'dark' ? 'text-white hover:text-gray-300' : 'text-gray-900 hover:text-gray-600'
                    }`}
                >
                  {post.author.displayname}
                </button>
                <button
                  onClick={handleProfileClick}
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
          <button className={`p-2 rounded-full transition-colors ${theme === 'dark'
              ? 'hover:bg-gray-800'
              : 'hover:bg-gray-100'
            }`}>
            <MoreHorizontal className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`} />
          </button>
        </div>

        {/* Post Content */}
        <div
          className={`px-4 py-3 ${onPostClick ? 'cursor-pointer' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            if (onPostClick) {
              onPostClick(post.public_id, post.author.username);
            }
          }}
        >
          <div className={`leading-relaxed text-[15px] ${theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`} style={{
              color: theme === 'dark' ? '#ffffff' : '#111827'
            }}>
            <div
              dangerouslySetInnerHTML={{ __html: post.content?.en || '' }}
              style={{
                color: theme === 'dark' ? '#ffffff' : '#111827'
              }}
              className={`prose prose-sm max-w-none ${theme === 'dark'
                  ? 'prose-invert prose-headings:text-white prose-p:text-white prose-strong:text-white prose-em:text-white prose-a:text-blue-400 prose-code:text-white'
                  : 'prose-headings:text-gray-900 prose-p:text-gray-900 prose-strong:text-gray-900 prose-em:text-gray-900 prose-a:text-blue-600 prose-code:text-gray-900'
                }`}
            />
          </div>
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
                <div className="space-y-4 mb-4">
                  {videoAttachments.map((attachment, index) => (
                    <VideoPlayer
                      key={attachment.id || index}
                      src={attachment.file.url}
                      className="w-full"
                    />
                  ))}
                </div>
              );

              if (imageCount === 0 && videoCount === 0 && nonImageVideoAttachments.length > 0) {
                // Only non-image/video attachments
                return (
                  <>
                    {videoRender}
                    {nonImageVideoAttachments.map((attachment, index) => (
                      <div key={index} className="w-full overflow-hidden mb-2 last:mb-0">
                        <div className={`w-full h-48 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                          }`}>
                          <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
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
                const imageUrl = imageAttachments[0].file.url;
                const isLoaded = loadedImages.has(imageUrl);

                return (
                  <>
                    {videoRender}
                    <div className="grid grid-cols-1 gap-2">
                      <div className="w-full overflow-hidden rounded-2xl relative aspect-[16/9]">
                        {!isLoaded && <ImageShimmer className="absolute inset-0 w-full h-full" />}
                        <img
                          src={imageUrl}
                          alt="Post attachment"
                          className={`w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity duration-300 ${!isLoaded ? 'opacity-0' : 'opacity-100'}`}
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
                        const imageUrl = attachment.file.url;
                        const isLoaded = loadedImages.has(imageUrl);

                        return (
                          <div key={index} className="w-full overflow-hidden rounded-2xl relative h-[300px]">
                            {!isLoaded && <ImageShimmer className="absolute inset-0 w-full h-full" />}
                            <img
                              src={imageUrl}
                              alt={`Post attachment ${index + 1}`}
                              className={`w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity duration-300 ${!isLoaded ? 'opacity-0' : 'opacity-100'}`}
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
                const firstImageUrl = imageAttachments[0].file.url;
                const secondImageUrl = imageAttachments[1].file.url;
                const thirdImageUrl = imageAttachments[2].file.url;
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
                          className={`w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity duration-300 ${!firstLoaded ? 'opacity-0' : 'opacity-100'}`}
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
                          className={`w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity duration-300 ${!secondLoaded ? 'opacity-0' : 'opacity-100'}`}
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
                          className={`w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity duration-300 ${!thirdLoaded ? 'opacity-0' : 'opacity-100'}`}
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
                        const imageUrl = attachment.file.url;
                        const isLoaded = loadedImages.has(imageUrl);

                        return (
                          <div key={index} className="w-full overflow-hidden rounded-2xl relative h-[200px]">
                            {!isLoaded && <ImageShimmer className="absolute inset-0 w-full h-full" />}
                            <img
                              src={imageUrl}
                              alt={`Post attachment ${index + 1}`}
                              className={`w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity duration-300 ${!isLoaded ? 'opacity-0' : 'opacity-100'}`}
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
                const firstImageUrl = imageAttachments[0].file.url;
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
                          className={`w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity duration-300 ${!firstLoaded ? 'opacity-0' : 'opacity-100'}`}
                          onLoad={() => handleImageLoad(firstImageUrl)}
                          onClick={(e) => {
                            e.stopPropagation();
                            openGallery(0);
                          }}
                        />
                      </div>
                      {imageAttachments.slice(1, 5).map((attachment, idx) => {
                        const imageUrl = attachment.file.url;
                        const isLoaded = loadedImages.has(imageUrl);

                        return (
                          <div key={idx + 1} className="overflow-hidden rounded-2xl relative h-[146px]">
                            {!isLoaded && <ImageShimmer className="absolute inset-0 w-full h-full" />}
                            <img
                              src={imageUrl}
                              alt={`Post attachment ${idx + 2}`}
                              className={`w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity duration-300 ${!isLoaded ? 'opacity-0' : 'opacity-100'}`}
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

                      const imageUrl = attachment.file.url;
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
                      <div className={`w-full h-48 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                        }`}>
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
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

        {/* Polls Section */}
        {post.poll && post.poll.length > 0 && (
          <div className="px-4 py-3">
            <div className="py-4 space-y-6">
              {post.poll.map((poll) => (
                <div key={poll.id} className="border-b border-gray-200 dark:border-gray-800 pb-6 last:border-b-0 last:pb-0">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                      }`}>
                      <span className={`text-xs font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                        📊
                      </span>
                    </div>
                    <h4 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                      {poll.question?.en && poll.question.en !== 'Pool Question'
                        ? poll.question.en
                        : 'Poll'}
                    </h4>
                  </div>
                  <div className="space-y-3">
                    {poll.choices.map((choice) => {
                      const percentage = getChoicePercentage(choice.vote_count, poll);
                      const isSelected = selectedPollChoices[poll.id] === choice.id;

                      return (
                        <div
                          key={choice.id}
                          className={`relative p-3 rounded-xl border transition-all duration-200 ${isSelected
                              ? theme === 'dark'
                                ? 'border-white bg-white/10'
                                : 'border-gray-900 bg-gray-50'
                              : theme === 'dark'
                                ? 'border-gray-700 hover:border-gray-600 hover:bg-white/5'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            } ${selectedPollChoices[poll.id] ? 'cursor-default' : 'cursor-pointer'}`}
                          onClick={(e) => handlePollVote(poll.id, choice.id, e)}
                        >
                          {isSelected && (
                            <div className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'
                              }`}>
                              ✓
                            </div>
                          )}
                          <div className="flex justify-between items-center mb-2">
                            <span className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>
                              {choice.label?.en || ''}
                            </span>
                          </div>
                          <div className={`w-full h-2 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                            }`}>
                            <div
                              className={`h-2 rounded-full transition-all duration-700 ${isSelected
                                  ? theme === 'dark' ? 'bg-white' : 'bg-gray-900'
                                  : theme === 'dark' ? 'bg-gray-500' : 'bg-gray-400'
                                }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          {/* Voters Avatars */}
                          {choice.voters && choice.voters.length > 0 && (
                            <div className="flex items-center -space-x-2 mt-2">
                              {choice.voters.slice(0, 5).map((voter, idx) => (
                                <div
                                  key={voter.id}
                                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${theme === 'dark' ? 'border-black bg-gray-800 text-white' : 'border-white bg-gray-100 text-gray-900'
                                    }`}
                                  style={{ zIndex: 5 - idx }}
                                  title={voter.displayname}
                                >
                                  {voter.displayname.charAt(0).toUpperCase()}
                                </div>
                              ))}
                              {choice.voters.length > 5 && (
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${theme === 'dark' ? 'border-black bg-gray-700 text-gray-300' : 'border-white bg-gray-200 text-gray-600'
                                  }`}>
                                  +{choice.voters.length - 5}
                                </div>
                              )}
                            </div>
                          )}
                          {/* Vote count and percentage on same line */}
                          <div className={`flex justify-between items-center mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                            <span className="text-xs">
                              {choice.vote_count} vote{choice.vote_count !== 1 ? 's' : ''}
                            </span>
                            <span className={`text-xs font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                              {percentage}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {getTotalVotes(poll) > 0 && (
                    <div className={`text-sm mt-6 pt-4 border-t text-center ${theme === 'dark' ? 'text-gray-400 border-gray-800' : 'text-gray-500 border-gray-100'
                      }`}>
                      {getTotalVotes(poll)} total vote{getTotalVotes(poll) !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Event Section */}
        {post.event && (
          <div className="px-4 py-3">
            <div className="py-4">
              <div className="flex items-start space-x-4">
                <div className={`p-3 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                  }`}>
                  <Calendar className={`w-6 h-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`} />
                </div>
                <div className="flex-1">
                  <h4 className={`font-bold text-xl mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                    {post.event.title?.en || ''}
                  </h4>
                  <p className={`text-lg mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                    {post.event.description?.en || ''}
                  </p>
                  <div className={`text-base font-semibold mb-3 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                    📅 {formatEventTime(post.event.start_time)}
                  </div>
                  {post.event.location && (
                    <div className={`text-base flex items-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                      <MapPin className="w-5 h-5 mr-2" />
                      {post.event.location.address}
                    </div>
                  )}

                  {/* Event Attendance Buttons */}
                  <div className="flex items-center gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setEventStatus(eventStatus === 'going' ? null : 'going')}
                      className={`px-4 py-2 rounded-full transition-colors duration-200 ${eventStatus === 'going'
                          ? theme === 'dark'
                            ? 'bg-white text-black'
                            : 'bg-black text-white'
                          : theme === 'dark'
                            ? 'border border-gray-600 hover:bg-white/10'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      Going
                    </button>
                    <button
                      onClick={() => setEventStatus(eventStatus === 'not_going' ? null : 'not_going')}
                      className={`px-4 py-2 rounded-full transition-colors duration-200 ${eventStatus === 'not_going'
                          ? theme === 'dark'
                            ? 'bg-white text-black'
                            : 'bg-black text-white'
                          : theme === 'dark'
                            ? 'border border-gray-600 hover:bg-white/10'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      Not Going
                    </button>
                    <button
                      onClick={() => setEventStatus(eventStatus === 'maybe' ? null : 'maybe')}
                      className={`px-4 py-2 rounded-full transition-colors duration-200 ${eventStatus === 'maybe'
                          ? theme === 'dark'
                            ? 'bg-white text-black'
                            : 'bg-black text-white'
                          : theme === 'dark'
                            ? 'border border-gray-600 hover:bg-white/10'
                            : 'border border-gray-300 hover:bg-gray-50'
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
                                ? theme === 'dark' ? 'border-white bg-gray-800 text-white' : 'border-gray-900 bg-gray-100 text-gray-900'
                                : attendee.status === 'not_going'
                                  ? theme === 'dark' ? 'border-gray-500 bg-gray-700 text-gray-400' : 'border-gray-400 bg-gray-200 text-gray-600'
                                  : theme === 'dark' ? 'border-gray-300 bg-gray-600 text-gray-300' : 'border-gray-500 bg-gray-300 text-gray-700'
                              }`}
                            style={{ zIndex: 10 - idx }}
                            title={`${attendee.displayname} (${attendee.status === 'going' ? 'Going' : attendee.status === 'not_going' ? 'Not Going' : 'Maybe'})`}
                          >
                            {attendee.displayname.charAt(0).toUpperCase()}
                          </div>
                        ))}
                        {post.event.attendees.length > 10 && (
                          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${theme === 'dark' ? 'border-gray-700 bg-gray-800 text-gray-300' : 'border-gray-300 bg-gray-100 text-gray-600'
                            }`}>
                            +{post.event.attendees.length - 10}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Location Section */}
        {post.location && !post.event && (
          <div className="px-4 py-3">
            <div className="py-3">
              <div className="flex items-center space-x-3">
                <MapPin className={`w-6 h-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                <span className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                  {post.location.address}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Engagement Bar */}
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-1 -ml-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsLiked(!isLiked);
              }}
              className={`flex items-center space-x-1 px-3 py-2 rounded-full transition-colors duration-200 hover:bg-opacity-10 ${isLiked
                  ? theme === 'dark' ? 'text-red-500 hover:bg-red-500/10' : 'text-red-500 hover:bg-red-500/10'
                  : theme === 'dark' ? 'text-gray-400 hover:text-red-500 hover:bg-red-500/10' : 'text-gray-500 hover:text-red-500 hover:bg-red-500/10'
                }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                {isLiked ? 1 : 0}
              </span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setShowReply(!showReply);
              }}
              className={`flex items-center space-x-1 px-3 py-2 rounded-full transition-colors duration-200 hover:bg-opacity-10 ${theme === 'dark' ? 'text-gray-400 hover:text-blue-500 hover:bg-blue-500/10' : 'text-gray-500 hover:text-blue-500 hover:bg-blue-500/10'
                }`}
            >
              <MessageCircle className="w-5 h-5" />
              <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>0</span>
            </button>
            <button
              onClick={(e) => e.stopPropagation()}
              className={`flex items-center space-x-1 px-3 py-2 rounded-full transition-colors duration-200 hover:bg-opacity-10 ${theme === 'dark' ? 'text-gray-400 hover:text-green-500 hover:bg-green-500/10' : 'text-gray-500 hover:text-green-500 hover:bg-green-500/10'
                }`}
            >
              <Share className="w-5 h-5" />
              <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>0</span>
            </button>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsBookmarked(!isBookmarked);
            }}
            className={`flex items-center space-x-1 px-3 py-2 rounded-full transition-colors duration-200 hover:bg-opacity-10 ${isBookmarked
                ? theme === 'dark' ? 'text-yellow-500 hover:bg-yellow-500/10' : 'text-yellow-600 hover:bg-yellow-500/10'
                : theme === 'dark' ? 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-500/10' : 'text-gray-500 hover:text-yellow-500 hover:bg-yellow-500/10'
              }`}
          >
            <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>

      </div>

      {/* PostReply Component - Outside main post div */}
      {showReply && (
        <PostReply
          isOpen={true}
          onClose={() => setShowReply(false)}
          parentPostId={`${post.id}`}
          onReply={(content, parentPostId) => {
            console.log('Reply posted:', content, 'Parent ID:', parentPostId);
            setShowReply(false);

            // Refresh parent post (top-level post) to get updated children
            if (onRefreshParent) {
              onRefreshParent();
            }

            // Also refresh local children if in detail view
            if (isDetailView) {
              api.fetchPost(post.id)
                .then((response) => {
                  if (response.children) {
                    setChildren(response.children);
                  }
                })
                .catch((error) => {
                  console.error('Error refreshing children:', error);
                });
            }
          }}
        />
      )}

      {/* Children (Replies) Section - Outside main post div */}
      {(isDetailView || showChildren) && (
        <div className={`overflow-hidden border-b ${theme === 'dark'
            ? 'bg-black border-gray-800/40'
            : 'bg-white border-gray-100'
          }`}>
          <div className="px-4 py-3">
            {loadingChildren ? (
              <div className={`text-center py-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Loading replies...
              </div>
            ) : (children.length > 0 || (post.children && post.children.length > 0)) ? (
              <div className="space-y-4">
                <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Replies ({children.length || post.children?.length || 0})
                </div>
                {(children.length > 0 ? children : post.children || []).map((child) => (
                  <div key={child.id} className={`border-l-2 pl-4 pointer-events-none ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                    <div className="pointer-events-auto">
                      <Post
                        post={child}
                        onPostClick={onPostClick}
                        onProfileClick={onProfileClick}
                        isDetailView={false}
                        showChildren={true}
                        onRefreshParent={onRefreshParent}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Image Gallery Modal */}
      {isGalleryOpen && imageAttachments.length > 0 && (() => {
        const currentImage = imageAttachments[selectedImageIndex];

        if (!currentImage) return null;

        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              backgroundImage: theme ==="dark" ? 'radial-gradient(transparent 1px, #000000 1px)' : 'radial-gradient(transparent 1px, #000000 1px)',
             
              backdropFilter:`blur(3px)`,
              backgroundColor: 'transparent',

              backgroundSize: '2px 3px',
              transform:"none",
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
                      ? 'bg-black/40 border-gray-700/50 text-white'
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
                      ? 'bg-black/40 hover:bg-black/50 border-gray-700/50 text-white'
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
                  {!loadedImages.has(currentImage.file.url) && (
                    <div className="absolute inset-0 rounded-xl sm:rounded-2xl overflow-hidden z-20">
                      <ImageShimmer className="absolute inset-0 w-full h-full" />
                    </div>
                  )}

                  {/* Foreground image - Mobile optimized */}
                  <img
                    src={currentImage.file.url}
                    alt={`Gallery image ${selectedImageIndex + 1} of ${imageAttachments.length}`}
                    className={`relative max-w-full max-h-full object-cover rounded-xl sm:rounded-2xl shadow-2xl select-none transition-opacity duration-300 ${loadedImages.has(currentImage.file.url) ? 'opacity-100' : 'opacity-0'
                      }`}
                    style={{
                      filter: loadedImages.has(currentImage.file.url) ? 'drop-shadow(0 0 40px rgba(0,0,0,0.15))' : 'none'
                    }}
                    draggable={false}
                    onLoad={() => handleImageLoad(currentImage.file.url)}
                    onError={(e) => {
                      console.error('Image load error:', e);
                      // Mark as loaded even on error to hide shimmer
                      handleImageLoad(currentImage.file.url);
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
                        ? 'bg-black/40 hover:bg-black/50 border-gray-700/50 text-white'
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
                        ? 'bg-black/40 hover:bg-black/50 border-gray-700/50 text-white'
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
    </>
  );
};

export default Post;