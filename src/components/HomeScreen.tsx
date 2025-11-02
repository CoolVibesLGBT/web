import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { motion } from 'framer-motion';
import Stories from './Stories';
import CreatePost from './CreatePost';
import Post from './Post';
import { api } from '../services/api';

// Import the ApiPost interface from Post component
interface ApiPost {
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

interface TimelineResponse {
  posts: ApiPost[];
  next_cursor: number;
}

const HomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string>('');

  const [activeTab, setActiveTab] = useState('foryou');
  
  // Get selected post from URL or null
  const selectedPost = location.pathname.includes('/status/') 
    ? location.pathname.split('/status/')[1] 
    : null;

  // Separate state for post detail data (fetched independently)
  const [selectedPostData, setSelectedPostData] = useState<ApiPost | null>(null);
  const [loadingPostDetail, setLoadingPostDetail] = useState(false);

  // Handle post click - update URL
  const handlePostClick = (postId: string, username: string) => {
    navigate(`/${username}/status/${postId}`, { replace: true });
  };

  // Handle back button click
  const handleBackClick = () => {
    navigate('/', { replace: true });
  };

  // Handle profile click - navigate to profile page
  const handleProfileClick = (username: string) => {
    navigate(`/${username}`, { replace: true });
  };

  // Fetch posts from API
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response: TimelineResponse = await api.fetchTimeline({ limit: 10, cursor: "" });
        setPosts(response.posts);
        setNextCursor(response.next_cursor?.toString() || '');
        setHasMore(response.posts.length > 0);
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError('Failed to load posts. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch post detail when selectedPost changes
  useEffect(() => {
    const fetchPostDetail = async () => {
      if (!selectedPost) {
        setSelectedPostData(null);
        return;
      }

      try {
        setLoadingPostDetail(true);
        const response = await api.fetchPost(selectedPost);
        setSelectedPostData(response);
      } catch (err) {
        console.error('Error fetching post detail:', err);
        setError('Failed to load post. Please try again.');
      } finally {
        setLoadingPostDetail(false);
      }
    };

    fetchPostDetail();
  }, [selectedPost]);

  // Load more posts function
  const loadMorePosts = useCallback(async () => {
    if (!nextCursor || loadingMore) {
      console.log('Load more skipped:', { nextCursor, loadingMore });
      return;
    }

    try {
      console.log('Loading more posts with cursor:', nextCursor);
      setLoadingMore(true);
      const response: TimelineResponse = await api.fetchTimeline({ limit: 10, cursor: nextCursor });
      
      console.log('Load more response:', response);
      
      if (response.posts.length > 0) {
        setPosts(prevPosts => [...prevPosts, ...response.posts]);
        setNextCursor(response.next_cursor?.toString() || '');
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading more posts:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore]);

  // Load more posts when scrolling to bottom
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      const clientHeight = document.documentElement.clientHeight;

      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
      
      // Load more when 200px from bottom
      if (distanceFromBottom <= 200 && hasMore && !loadingMore && !loading && !selectedPost) {
        console.log('Triggering load more:', { distanceFromBottom, hasMore, loadingMore, loading, selectedPost });
        loadMorePosts();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loadingMore, loading, selectedPost, loadMorePosts]);

  return (
    <div className={`scrollbar-hide max-h-[100dvh]  overflow-y-auto ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
      
      {/* Stories Above Tabs - Only show when not in post detail view */}
      {!selectedPost && (
      <div className={`hidden lg:block ${theme === 'dark' ? 'bg-black' : 'bg-white'} border-b ${theme === 'dark' ? 'border-black' : 'border-gray-100'} p-4`}>
        <Stories />
      </div>
      )}

      {/* Header - Show Post Detail or Tabs */}
      <div className={`sticky top-0 lg:top-0 z-40 ${theme === 'dark' ? 'bg-black/95 backdrop-blur-xl' : 'bg-white/95 backdrop-blur-xl'} border-b ${theme === 'dark' ? 'border-gray-800/50' : 'border-gray-100/50'}`}>
        {selectedPost ? (
          // Post Detail Header
          <div className="flex items-center px-4 py-3">
            <button
              onClick={handleBackClick}
              className={`p-2 rounded-full transition-all duration-200 mr-3 ${
                theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
              }`}
            >
              <ArrowLeft className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
            </button>
            <div>
              <h2 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Post
              </h2>
            </div>
          </div>
        ) : (
          // Tab Navigation
          <div className="flex relative">
            <motion.button
              onClick={() => setActiveTab('foryou')}
              whileHover={{ backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
              whileTap={{ scale: 0.99 }}
              className={`flex-1 py-4 font-semibold text-[15px] relative transition-all duration-200 ${
                activeTab === 'foryou'
                  ? theme === 'dark' ? 'text-white' : 'text-black'
                  : theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="relative z-10">Flows</span>
              {activeTab === 'foryou' && (
                <motion.div
                  className={`absolute bottom-0 left-0 right-0 h-1 ${theme === 'dark' ? 'bg-white' : 'bg-black'}`}
                  layoutId="activeTabIndicator"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
            <motion.button
              onClick={() => setActiveTab('following')}
              whileHover={{ backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
              whileTap={{ scale: 0.99 }}
              className={`flex-1 py-4 font-semibold text-[15px] relative transition-all duration-200 ${
                activeTab === 'following'
                  ? theme === 'dark' ? 'text-white' : 'text-black'
                  : theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="relative z-10">Vibes</span>
              {activeTab === 'following' && (
                <motion.div
                  className={`absolute bottom-0 left-0 right-0 h-1 ${theme === 'dark' ? 'bg-white' : 'bg-black'}`}
                  layoutId="activeTabIndicator"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          </div>
        )}
      </div>

      <div className="w-full lg:max-w-[1380px] lg:mx-auto">
        
 
      <main className={`flex-1 w-full min-w-0 lg:border-x ${theme === 'dark' ? 'lg:border-black' : 'lg:border-gray-100'}`}>
        {selectedPost ? (
          // Post Detail View
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className={`${theme === 'dark' ? 'bg-black' : 'bg-white'}`}
          >
            {loadingPostDetail ? (
              <div className={`flex items-center justify-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Loading post...
              </div>
            ) : selectedPostData ? (
              <Post 
                post={selectedPostData} 
                onPostClick={(postId, username) => handlePostClick(postId, username)}
                onProfileClick={handleProfileClick}
                isDetailView={true}
                onRefreshParent={() => {
                  // Refresh the specific post when a reply is posted
                  const refreshPost = async () => {
                    try {
                      const response = await api.fetchPost(selectedPostData.id);
                      setSelectedPostData(response);
                    } catch (err) {
                      console.error('Error refreshing post:', err);
                    }
                  };
                  refreshPost();
                }}
              />
            ) : (
              <div className={`text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Post not found
              </div>
            )}
          </motion.div>
        ) : (
          // Posts Feed
          <>
            {/* Create Post */}
            <div className={`${theme === 'dark' ? 'bg-black border-b border-black' : 'bg-white border-b border-gray-100'}`}>
              <CreatePost 
                onPostCreated={() => {
                  // Refresh the timeline when a new post is created
                  const fetchPosts = async () => {
                    try {
                      const response: TimelineResponse = await api.fetchTimeline({ limit: 10, cursor: "" });
                      setPosts(response.posts);
                      setNextCursor(response.next_cursor?.toString() || '');
                      setHasMore(response.posts.length > 0);
                    } catch (err) {
                      console.error('Error refreshing posts:', err);
                    }
                  };
                  fetchPosts();
                }}
              />
            </div>

            {/* Posts Feed */}
            <div>
              {loading ? (
                <div className={`p-8 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Loading posts...
                </div>
              ) : error ? (
                <div className={`p-8 text-center ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>
                  {error}
                </div>
              ) : posts.length === 0 ? (
                <div className={`p-8 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  No posts available
                </div>
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
                            post={post}
                            onPostClick={(postId, username) => handlePostClick(postId, username)}
                            onProfileClick={handleProfileClick}
                            onRefreshParent={() => {
                              // Refresh the entire timeline when a reply is posted
                              const fetchPosts = async () => {
                                try {
                                  const response: TimelineResponse = await api.fetchTimeline({ limit: 10, cursor: "" });
                                  setPosts(response.posts);
                                  setNextCursor(response.next_cursor?.toString() || '');
                                  setHasMore(response.posts.length > 0);
                                } catch (err) {
                                  console.error('Error refreshing posts:', err);
                                }
                              };
                              fetchPosts();
                            }}
                          />
                  </motion.div>
                ))
              )}
              {/* Loading More Indicator */}
              {loadingMore && (
                <div className={`p-8 text-center border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-100'}`}>
                  <div className={`inline-flex items-center space-x-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
                    <span>Loading more posts...</span>
                        </div>
                      </div>
              )}
              {!hasMore && posts.length > 0 && (
                <div className={`p-8 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  No more posts to load
                      </div>
                    )}
            </div>
          </>
        )}
      </main>
      </div>
    </div>
  );
};

export default HomeScreen;