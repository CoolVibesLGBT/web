import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import Stories from './Stories';
import PostDetails from './PostDetails';
import Flows from './Flows';
import Vibes from './Vibes';
import CreatePost from './CreatePost';
import { api } from '../services/api';
import { useSettings } from '../contexts/SettingsContext';

const MAX_HEADER_HEIGHT = 335;
const MIN_HEADER_HEIGHT = 80;


const HomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('flows');
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const { showBottomBar, setShowBottomBar } = useSettings();

  // Get selected post from URL or null
  const selectedPost = location.pathname.includes('/status/')
    ? location.pathname.split('/status/')[1]
    : null;

  // Separate state for post detail data (fetched independently)
  const [selectedPostData, setSelectedPostData] = useState<any | null>(null);
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

  const [headerHeight, setHeaderHeight] = useState(MAX_HEADER_HEIGHT);
  const headerVisibilityProgress = Math.max(
    0,
    Math.min(
      1,
      (headerHeight - MIN_HEADER_HEIGHT) / (MAX_HEADER_HEIGHT - MIN_HEADER_HEIGHT)
    )
  );
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const scrollTop = scrollContainerRef.current.scrollTop;
    const newHeight = Math.max(MIN_HEADER_HEIGHT, MAX_HEADER_HEIGHT - scrollTop);
    setHeaderHeight(newHeight);
  };

  useEffect(() => {
    const current = scrollContainerRef.current;
    if (current) {
      current.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (current) {
        current.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);


  return (
    <div
      ref={scrollContainerRef}
      style={{
        height: '100dvh',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
      className={`flex flex-col  overflow-y-auto scrollbar-hide max-h-[100dvh]`}>

{
          activeTab == "flows" && !selectedPost && <div
            className={`flex-shrink-0 px-1 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] border-b ${theme === 'dark' ? 'border-black' : 'border-gray-100'}`}
            style={{
              opacity: headerVisibilityProgress,
              transform: `translateY(${(1 - headerVisibilityProgress) * -0}px)`,
              pointerEvents: headerVisibilityProgress < 0.2 ? 'none' : 'auto',
              height: headerHeight == MIN_HEADER_HEIGHT ? 0 : "190px"
            }}>
            <Stories />
          </div>
        }

      <header className={`${theme == "dark" ? "bg-black" : "bg-white"} flex flex-col gap-0`}

        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1,
          transition: 'height 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
          willChange: 'height',

        }}
      >

      

        <div className='w-full flex-grow'>
          <div className={`z-40 border-b  ${theme === 'dark' ? 'bg-black border-gray-800/50' : 'bg-white border-gray-100/50'}`}>
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
              <div className="flex">
                <motion.button
                  onClick={() => {
                    setActiveTab('flows')
                    setShowBottomBar(true)
                  }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex-1 py-2 cursor-pointer font-semibold text-[15px] relative transition-all duration-200 ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-black/5'
                    } ${activeTab === 'flows'
                      ? theme === 'dark' ? 'text-white' : 'text-black'
                      : theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  <div className='relative z-10 w-full flex flex-row gap-2 items-center justify-center'>
                    <img src={"/icons/flows.webp"} className='w-12 h-12' />
                    <span>Cool</span>
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
                  onClick={() => {
                    setActiveTab('vibes')
                    setShowBottomBar(false)
                  }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex-1 cursor-pointer py-2 font-semibold text-[15px] relative transition-all duration-200 ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-black/5'
                    } ${activeTab === 'vibes'
                      ? theme === 'dark' ? 'text-white' : 'text-black'
                      : theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  <div className='relative z-10 w-full flex flex-row gap-2 items-center justify-center'>
                    <img src={"/icons/vibes.webp"} className='w-12 h-12 rounded-lg' />
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

        </div>
      </header>




      <main className={`flex-grow w-full min-w-0 lg:border-x ${theme === 'dark' ? 'lg:border-black' : 'lg:border-gray-100'}`}>

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
              <PostDetails
                post={selectedPostData}
                onPostClick={(postId, username) => handlePostClick(postId, username)}
                onProfileClick={handleProfileClick}
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

      {/* FAB Button - Mobile Only, Flows Tab Only */}
      {!selectedPost && activeTab === 'flows' && (
        <motion.button
          onClick={() => {
            setIsCreatePostOpen(true)
          }}
          className="lg:hidden fixed bottom-24 right-4 z-[60] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          style={{
            background: theme === 'dark'
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }}
        >
          <Plus className="w-6 h-6 text-white" />
        </motion.button>
      )}

      {/* CreatePost Modal - Mobile Full Screen */}
      <AnimatePresence>
        {isCreatePostOpen && (
         
                <CreatePost
                  title="Create Post"
                  buttonText="Post"
                  fullScreen={true}
                  
                  placeholder="Every vibe tells a story. What's yours? 🌈"
                  canClose={true}
                  onClose={() => setIsCreatePostOpen(false)}
                  onPostCreated={() => {

                    setIsCreatePostOpen(false);
                  
                  }}
                />
        
        )}
      </AnimatePresence>
    </div>
  );
};

export default HomeScreen;