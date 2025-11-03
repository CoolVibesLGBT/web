import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Users, 
  Globe, 
  Shield, 
  Sparkles, 
  ArrowRight, 
  Download,
  Smartphone,
  Laptop,
  Monitor,
  Server,
  Globe as GlobeIcon
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const LandingPage: React.FC = () => {
  const { theme } = useTheme();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const downloadLinks = [
    { platform: 'iOS', icon: Smartphone, url: '#', color: 'bg-black text-white' },
    { platform: 'Android', icon: Smartphone, url: '#', color: 'bg-black text-white' },
    { platform: 'Web', icon: GlobeIcon, url: '#', color: 'bg-black text-white' },
    { platform: 'macOS', icon: Laptop, url: '#', color: 'bg-black text-white' },
    { platform: 'Windows', icon: Monitor, url: '#', color: 'bg-black text-white' },
    { platform: 'Linux', icon: Server, url: '#', color: 'bg-black text-white' },
  ];

  const features = [
    {
      icon: Users,
      title: 'Unified Community',
      description: 'Connect with LGBTQI+ communities worldwide in one safe, inclusive space.'
    },
    {
      icon: Heart,
      title: 'Authentic Connections',
      description: 'Build meaningful relationships and find your tribe with ease.'
    },
    {
      icon: Shield,
      title: 'Safe Space',
      description: 'Your privacy and safety are our top priorities with advanced protection.'
    },
    {
      icon: Globe,
      title: 'Global Reach',
      description: 'Connect across borders and cultures, breaking down barriers together.'
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0
    }
  };

  return (
    <div 
      className={`relative w-full h-screen overflow-hidden ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}
      style={{ maxHeight: '100dvh' }}
    >
      {/* Animated Background Grid */}
      <div className="absolute inset-0 opacity-10">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(${theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'} 1px, transparent 1px),
              linear-gradient(90deg, ${theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'} 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            transform: `translate(${mousePosition.x * 0.01}px, ${mousePosition.y * 0.01}px)`
          }}
        />
      </div>

      {/* Main Content Container */}
      <motion.div
        className="relative z-10 h-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Section */}
        <div className="max-w-7xl w-full mx-auto text-center">
          {/* Main Heading */}
          <motion.div variants={itemVariants} className="mb-4 sm:mb-6">
            <motion.h1
              className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-black'
              }`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              Where Every
              <br />
              <motion.span
                className="relative inline-block"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                Voice
                <motion.div
                  className={`absolute bottom-2 left-0 right-0 h-1 ${
                    theme === 'dark' ? 'bg-white' : 'bg-black'
                  }`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                />
              </motion.span>
              {' '}Matters
            </motion.h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            transition={{ duration: 0.6 }}
            className={`text-base sm:text-lg md:text-xl mb-6 sm:mb-8 max-w-2xl mx-auto ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}
          >
            The social platform uniting all LGBTQI+ communities worldwide.
            <br />
            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
              Connect, share, and thrive together.
            </span>
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            transition={{ duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`group relative px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg overflow-hidden ${
                theme === 'dark'
                  ? 'bg-white text-black'
                  : 'bg-black text-white'
              } transition-all duration-300`}
            >
              <span className="relative z-10 flex items-center gap-2">
                Get Started
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <motion.div
                className={`absolute inset-0 ${
                  theme === 'dark' ? 'bg-black' : 'bg-white'
                }`}
                initial={{ scale: 0 }}
                whileHover={{ scale: 1 }}
                transition={{ duration: 0.3 }}
              />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg border-2 ${
                theme === 'dark'
                  ? 'border-white text-white hover:bg-white hover:text-black'
                  : 'border-black text-black hover:bg-black hover:text-white'
              } transition-all duration-300`}
            >
              Learn More
            </motion.button>
          </motion.div>

          {/* Download Section */}
          <motion.div variants={itemVariants} transition={{ duration: 0.6 }} className="mb-6 sm:mb-8">
            <p className={`text-xs sm:text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Download for your platform
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              {downloadLinks.map((link, index) => (
                <motion.a
                  key={link.platform}
                  href={link.url}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  whileHover={{ scale: 1.1, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-300 ${
                    theme === 'dark'
                      ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                      : 'bg-black/10 hover:bg-black/20 text-black border border-black/20'
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{link.platform}</span>
                  <Download className="w-3.5 h-3.5 opacity-60" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto"
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                transition={{ duration: 0.6 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className={`p-4 sm:p-6 rounded-2xl ${
                  theme === 'dark'
                    ? 'bg-white/5 border border-white/10 hover:bg-white/10'
                    : 'bg-black/5 border border-black/10 hover:bg-black/10'
                } transition-all duration-300`}
              >
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 ${
                    theme === 'dark'
                      ? 'bg-white/10 text-white'
                      : 'bg-black/10 text-black'
                  }`}
                >
                  <feature.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h3
                  className={`text-lg sm:text-xl font-bold mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-black'
                  }`}
                >
                  {feature.title}
                </h3>
                <p
                  className={`text-xs sm:text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* Bottom Accent */}
          <motion.div
            variants={itemVariants}
            transition={{ duration: 0.6 }}
            className="mt-6 sm:mt-8 flex items-center justify-center gap-2"
          >
            <Sparkles className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
            <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Built with love for the community
            </span>
            <Sparkles className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
          </motion.div>
        </div>
      </motion.div>

      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl opacity-20 bg-white pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl opacity-20 bg-white pointer-events-none" />
    </div>
  );
};

export default LandingPage;
