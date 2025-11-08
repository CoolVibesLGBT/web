import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import CreatePost from './CreatePost';
import Post from './Post';
import { api } from '../services/api';
import Container from './Container';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface ApiPost {
  id: string;
  public_id: string;
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

interface FlowsProps {
  onPostClick: (postId: string, username: string) => void;
  onProfileClick: (username: string) => void;
}

const Flows: React.FC<FlowsProps> = ({ onPostClick, onProfileClick }) => {
  const { theme } = useTheme();
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string>('');

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
      if (distanceFromBottom <= 200 && hasMore && !loadingMore && !loading) {
        console.log('Triggering load more:', { distanceFromBottom, hasMore, loadingMore, loading });
        loadMorePosts();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loadingMore, loading, loadMorePosts]);

  const refreshPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response: TimelineResponse = await api.fetchTimeline({ limit: 10, cursor: "" });
      setPosts(response.posts);
      setNextCursor(response.next_cursor?.toString() || '');
      setHasMore(response.posts.length > 0);
    } catch (err) {
      console.error('Error refreshing posts:', err);
      setError('Failed to load posts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='w-full'>
      {/* Create Post - Hidden on mobile */}
      <div className={`hidden lg:block ${theme === 'dark' ? 'bg-black border-b border-black' : 'bg-white border-b border-gray-100'}`}>
        <CreatePost
        fullScreen={false}
          title="Create Post"
          buttonText="Post"
          placeholder="Every vibe tells a story. What's yours? 🌈"
          onPostCreated={() => {
            refreshPosts();
          }}
        />
      </div>
 

      {/* Posts Feed */}
      <div className='pb-[25dvh] '>
        {loading ? (
          <div className={`p-8 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Loading posts...
          </div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center py-12 px-4"
          >
            <div className={`rounded-3xl overflow-hidden backdrop-blur-xl max-w-md w-full ${
              theme === 'dark'
                ? 'bg-white/5 border border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]'
                : 'bg-white border border-gray-200/50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]'
            }`}>
              <div className="p-6 sm:p-8">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center backdrop-blur-xl ${
                    theme === 'dark'
                      ? 'bg-red-500/10 border border-red-500/20'
                      : 'bg-red-50 border border-red-200/50'
                  }`}>
                    <AlertCircle className={`w-8 h-8 sm:w-10 sm:h-10 ${
                      theme === 'dark' ? 'text-red-400' : 'text-red-500'
                    }`} />
                  </div>
                  <div>
                    <h3 className={`text-lg sm:text-xl font-semibold tracking-tight mb-2 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      Unable to Load Posts
                    </h3>
                    <p className={`text-sm sm:text-base font-medium ${
                      theme === 'dark' ? 'text-white/60' : 'text-gray-500'
                    }`}>
                      We couldn't connect to the server. Please check your connection and try again.
                    </p>
                  </div>
                  <motion.button
                    onClick={refreshPosts}
                    disabled={loading}
                    className={`flex items-center gap-2.5 px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base transition-all duration-200 backdrop-blur-xl ${
                      loading
                        ? theme === 'dark'
                          ? 'bg-gray-800/50 text-gray-500 cursor-not-allowed'
                          : 'bg-gray-200/50 text-gray-400 cursor-not-allowed'
                        : theme === 'dark'
                        ? 'bg-white text-black hover:bg-gray-100 active:bg-gray-100'
                        : 'bg-black text-white hover:bg-gray-800 active:bg-gray-800'
                    }`}
                    whileHover={!loading ? { scale: 1.02 } : {}}
                    whileTap={!loading ? { scale: 0.98 } : {}}
                  >
                    <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? 'animate-spin' : ''}`} />
                    <span>{loading ? 'Reloading...' : 'Reload'}</span>
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
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
                onPostClick={(postId, username) => onPostClick(postId, username)}
                onProfileClick={onProfileClick}
                onRefreshParent={() => {
                  refreshPosts();
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
  
      </div>
  );
};

export default Flows;

