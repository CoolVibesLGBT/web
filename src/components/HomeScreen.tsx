import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import Stories from './Stories';
import Post from './Post';
import Flows from './Flows';
import Vibes from './Vibes';
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

const HomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('flows');

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
      } finally {
        setLoadingPostDetail(false);
      }
    };

    fetchPostDetail();
  }, [selectedPost]);

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
              className={`p-2 rounded-full transition-all duration-200 mr-3 ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
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
              onClick={() => setActiveTab('flows')}
              whileTap={{ scale: 0.98 }}
              className={`flex-1 py-4 cursor-pointer font-semibold text-[15px] relative transition-all duration-200 ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-black/5'
                } ${activeTab === 'flows'
                  ? theme === 'dark' ? 'text-white' : 'text-black'
                  : theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <div className='relative z-10 w-full flex flex-row gap-2 items-center justify-center'>
                <img src={"/icons/flows.webp"} className='w-12 h-12' />
                <span>Flows</span>
              </div>
           
              {activeTab === 'flows' && (
                <motion.div
                  className={`absolute bottom-0 left-0 right-0 h-1 ${theme === 'dark' ? 'bg-white/20' : 'bg-black'}`}
                  layoutId="homeScreenTabIndicator"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
            <motion.button
              onClick={() => setActiveTab('vibes')}
              whileTap={{ scale: 0.98 }}
              className={`flex-1 cursor-pointer py-4 font-semibold text-[15px] relative transition-all duration-200 ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-black/5'
                } ${activeTab === 'vibes'
                  ? theme === 'dark' ? 'text-white' : 'text-black'
                  : theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <div className='relative z-10 w-full flex flex-row gap-2 items-center justify-center'>
                <img src={"/icons/vibes.webp"}  className='w-12 h-12 rounded-lg' />
                <span>Vibes</span>
              </div>

              {activeTab === 'vibes' && (
                <motion.div
                  className={`absolute bottom-0 left-0 right-0 h-1 ${theme === 'dark' ? 'bg-white/20' : 'bg-black'}`}
                  layoutId="homeScreenTabIndicator"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          </div>
        )}
      </div>

      <div className="w-full min-h-[100dvh] lg:max-w-[1380px] lg:mx-auto">


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
            // Posts Feed or Vibes Grid
            <AnimatePresence mode="wait">
              {activeTab === 'flows' ? (
                <Flows
                  key="flows"
                  onPostClick={handlePostClick}
                  onProfileClick={handleProfileClick}
                />
              ) : (
                <Vibes
                  key="vibes"
                  activeTab={activeTab}
                  onPostClick={handlePostClick}
                />
              )}
            </AnimatePresence>
          )}
        </main>
      </div>
    </div>
  );
};

export default HomeScreen;