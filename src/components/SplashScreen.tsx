import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { applicationName } from '../appSettings';

const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { theme } = useTheme();
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(() => {
        onComplete();
      }, 500);
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className={`fixed inset-0 z-[9999] flex items-center justify-center ${
            theme === 'dark' ? 'bg-black' : 'bg-white'
          }`}
        >
          <div className="text-center">
            {/* Logo Animation */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                duration: 0.6, 
                ease: 'easeOut',
                delay: 0.2
              }}
              className={`w-24 h-24 mx-auto mb-6 rounded-2xl flex items-center justify-center ${
                theme === 'dark'
                  ? 'bg-gradient-to-br from-white to-gray-300'
                  : 'bg-gradient-to-br from-black to-gray-700'
              }`}
            >
              <span className={`text-5xl font-black ${
                theme === 'dark' ? 'text-black' : 'text-white'
              }`}>
                C
              </span>
            </motion.div>

            {/* App Name */}
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ 
                duration: 0.6, 
                ease: 'easeOut',
                delay: 0.4
              }}
              className={`text-4xl font-black mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-black'
              }`}
            >
              {applicationName}
            </motion.h1>

            {/* Tagline */}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ 
                duration: 0.6, 
                ease: 'easeOut',
                delay: 0.5
              }}
              className={`text-base font-medium ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              Stories from the Rainbow
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;

