import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import Stories from '../features/post/Stories';
import Flows from '../features/post/Flows';
import CreatePost from '../features/post/CreatePost';
import { useSettings } from '../contexts/SettingsContext';
import VibesGL from '../features/post/VibesGL/VibesGL';
import { useSEO } from '../hooks/useSEO';

const MAX_HEADER_HEIGHT = 335;
const MIN_HEADER_HEIGHT = 80;


const HomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('flows');
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const { setShowBottomBar } = useSettings();

  useSEO({
    title: 'Home',
    description: 'Your LGBTIQA+ social feed. Discover flows, vibes and connect with people who get you on CoolVibes.',
    canonical: '/home',
    noindex: true, // Protected route – no public indexing needed
  });

  // Handle post click - update URL
  const handlePostClick = (postId: string, username: string) => {
    navigate(`/${username}/status/${postId}`, { replace: true });
  };

  // Handle profile click - navigate to profile page
  const handleProfileClick = (username: string) => {
    navigate(`/${username}`, { replace: true });
  };

  const [headerHeight, setHeaderHeight] = useState(MAX_HEADER_HEIGHT);
  const headerVisibilityProgress = Math.max(
    0,
    Math.min(
      1,
      (headerHeight - MIN_HEADER_HEIGHT) / (MAX_HEADER_HEIGHT - MIN_HEADER_HEIGHT)
    )
  );
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastScrollTopRef = useRef(0);
  const isTickingRef = useRef(false);

  const updateHeaderHeight = useCallback(() => {
    const scrollTop = lastScrollTopRef.current;
    const newHeight = Math.max(MIN_HEADER_HEIGHT, MAX_HEADER_HEIGHT - scrollTop);
    setHeaderHeight((prev) => {
      if (Math.abs(prev - newHeight) < 0.5) {
        return prev;
      }
      return newHeight;
    });
    isTickingRef.current = false;
  }, []);

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    lastScrollTopRef.current = scrollContainerRef.current.scrollTop;

    if (!isTickingRef.current) {
      isTickingRef.current = true;
      requestAnimationFrame(updateHeaderHeight);
    }
  }, [updateHeaderHeight]);

  useEffect(() => {
    const current = scrollContainerRef.current;
    if (current) {
      current.addEventListener('scroll', handleScroll, { passive: true });
    }
    return () => {
      if (current) {
        current.removeEventListener('scroll', handleScroll);
      }
    };
  }, [handleScroll]);


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
        activeTab == "flows" && <div
          className={`flex-shrink-0 px-1 transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] border-b ${theme === 'dark' ? 'border-black' : 'border-gray-100'}`}
          style={{
            opacity: headerVisibilityProgress,
            pointerEvents: headerVisibilityProgress < 0.2 ? 'none' : 'auto',
            height: 190 // Fixed height prevents layout jumps that break Virtuoso tracking
          }}>
          <Stories />
        </div>
      }

      <header className={` flex flex-col gap-0`}

        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1,
          transition: 'height 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
          willChange: 'height',

        }}
      >



        <div className='w-full flex-grow'>
          <div className={`z-40 border-b  ${theme === 'dark' ? 'bg-gray-950 border-gray-800/50' : 'bg-white border-gray-100/50'}`}>
            {/* Tab Navigation */}
            <div className="flex z-10">
              <motion.button
                onClick={() => {
                  setActiveTab('flows')
                  setShowBottomBar(true)
                }}
                whileTap={{ scale: 0.98 }}
                className={`flex-1 py-2 cursor-pointer font-semibold text-[15px] relative transition-all duration-200 ${theme === 'dark' ? 'hover:bg-gray-900' : 'hover:bg-black/5'
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
                    className={`absolute bottom-0 left-0 right-0 h-1 ${theme === 'dark' ? 'bg-gray-900' : 'bg-black'}`}
                    layoutId="homeScreenTabIndicator"
                    layout="position"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    style={{ willChange: 'transform' }}
                  />
                )}
              </motion.button>
              <motion.button
                onClick={() => {
                  setActiveTab('vibes')
                  setShowBottomBar(false)
                }}
                whileTap={{ scale: 0.98 }}
                className={`flex-1 cursor-pointer py-2 font-semibold text-[15px] relative transition-all duration-200 ${theme === 'dark' ? 'hover:bg-gray-900' : 'hover:bg-black/5'
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
                    className={`absolute bottom-0 left-0 right-0 h-1 ${theme === 'dark' ? 'bg-gray-900' : 'bg-black'}`}
                    layoutId="homeScreenTabIndicator"
                    layout="position"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    style={{ willChange: 'transform' }}
                  />
                )}
              </motion.button>
              <motion.button
                onClick={() => {
                  setActiveTab('live')
                  setShowBottomBar(false)
                }}
                whileTap={{ scale: 0.98 }}
                className={`hidden flex-1 cursor-pointer py-2 font-semibold text-[15px] relative transition-all duration-200 ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-black/5'
                  } ${activeTab === 'live'
                    ? theme === 'dark' ? 'text-white' : 'text-black'
                    : theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <div className='relative z-10 w-full flex flex-row gap-2 items-center justify-center'>
                  <img src={"/icons/live.webp"} className='w-12 h-12 rounded-lg' />
                  <span>Live</span>
                </div>

                {activeTab === 'live' && (
                  <motion.div
                    className={`absolute bottom-0 left-0 right-0 h-1 ${theme === 'dark' ? 'bg-white/20' : 'bg-black'}`}
                    layoutId="homeScreenTabIndicator"
                    layout="position"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    style={{ willChange: 'transform' }}
                  />
                )}
              </motion.button>
            </div>
          </div>

        </div>
      </header>




      <main className={`flex-grow w-full min-w-0 lg:border-x ${theme === 'dark' ? 'lg:border-black' : 'lg:border-gray-100'}`}>
        {/* Posts Feed or Vibes Grid */}
        <AnimatePresence mode="wait">
          {activeTab === 'flows' ? (
            <Flows
              key="flows"
              onPostClick={handlePostClick}
              onProfileClick={handleProfileClick}
              scrollParentRef={scrollContainerRef}
            />
          ) : (
            <>
              <VibesGL />

            </>
          )}
        </AnimatePresence>
      </main>

      {/* FAB Button - Mobile Only, Flows Tab Only */}
      {activeTab === 'flows' && (
        <motion.button
          onClick={() => {
            setIsCreatePostOpen(true)
          }}
          className="lg:hidden fixed bottom-24 right-4 z-[10] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all"
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