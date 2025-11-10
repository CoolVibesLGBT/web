import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, poster, className = '' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<number | null>(null);
  const { theme } = useTheme();

  // Update current time and buffered progress
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => {
      setCurrentTime(video.currentTime);
      // Calculate buffered progress
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const bufferedProgress = (bufferedEnd / video.duration) * 100;
        setBuffered(bufferedProgress);
      }
    };
    const updateDuration = () => setDuration(video.duration);
    const handleLoadedData = () => setIsLoaded(true);
    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const bufferedProgress = (bufferedEnd / video.duration) * 100;
        setBuffered(bufferedProgress);
      }
    };

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('progress', handleProgress);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('progress', handleProgress);
    };
  }, []);

  // Handle fullscreen
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying && !isHovering) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying, isHovering]);

  useEffect(() => {
    if (isPlaying) {
      resetControlsTimeout();
    }
    return () => {
      if (controlsTimeoutRef.current) {
        window.clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, currentTime, resetControlsTimeout]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().catch((err) => {
        console.error('Error playing video:', err);
      });
      setIsPlaying(true);
    }
    resetControlsTimeout();
  }, [isPlaying, resetControlsTimeout]);

  const handleSeekStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = parseFloat(e.target.value);
    if (!isNaN(newTime) && newTime >= 0 && newTime <= duration) {
      video.currentTime = newTime;
      setCurrentTime(newTime);
      resetControlsTimeout();
    }
  }, [duration, resetControlsTimeout]);

  const handleSeekEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    resetControlsTimeout();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
    resetControlsTimeout();
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch((err) => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
    resetControlsTimeout();
  };

  const skip = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video || !duration) return;

    video.currentTime = Math.max(0, Math.min(duration, video.currentTime + seconds));
    resetControlsTimeout();
  }, [duration, resetControlsTimeout]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if the container or video is focused/visible
      if (!isHovering && !isFullscreen) return;
      
      const video = videoRef.current;
      if (!video) return;

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          if (isPlaying) {
            video.pause();
            setIsPlaying(false);
          } else {
            video.play().catch((err) => {
              console.error('Error playing video:', err);
            });
            setIsPlaying(true);
          }
          resetControlsTimeout();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skip(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skip(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.1));
          video.volume = Math.min(1, volume + 0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.1));
          video.volume = Math.max(0, volume - 0.1);
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          e.preventDefault();
          const percent = parseInt(e.key) / 10;
          video.currentTime = duration * percent;
          setCurrentTime(duration * percent);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHovering, isFullscreen, volume, duration, isPlaying, skip, resetControlsTimeout]);

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={containerRef}
      style={{
        backgroundImage: theme ==="dark" ? 'radial-gradient(transparent 1px,rgb(51, 48, 48) 1px)' : 'radial-gradient(transparent 1px, #000000 1px)',
       height:isFullscreen ? "100%" : undefined,
       width:isFullscreen ? "100%" : undefined,
        backdropFilter:`blur(3px)`,
        backgroundColor: theme === 'dark' ? "transparent" : 'white',

        backgroundSize: '2px 3px',
        transform:"none",
        WebkitMaskImage: 'linear-gradient(#ffffff calc(100% - 20px), transparent)', // Safari için
      }}
      className={`relative  w-full rounded-2xl overflow-hidden ${className} ${
        isFullscreen ? '!rounded-none flex items-center justify-center h-full' : ''
      }`}
      onMouseMove={() => {
        setIsHovering(true);
        resetControlsTimeout();
      }}
      onMouseLeave={() => {
        setIsHovering(false);
        if (isPlaying) {
          setShowControls(false);
        }
      }}
      onMouseEnter={() => {
        setIsHovering(true);
        setShowControls(true);
      }}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className={`object-contain  bg-transparent ${
          isFullscreen 
            ? 'max-w-full max-h-full w-auto h-auto' 
            : 'w-full h-auto max-h-[600px]'
        }`}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={togglePlay}
        playsInline
        preload="metadata"
      />

      {/* Loading Shimmer */}
      {!isLoaded && (
        <div className={`absolute inset-0 flex items-center justify-center ${
          theme === 'dark' ? 'bg-black/50' : 'bg-gray-100/50'
        }`}>
          <div className={`w-16 h-16 rounded-full border-4 ${
            theme === 'dark' ? 'border-gray-700 border-t-white' : 'border-gray-300 border-t-gray-600'
          } animate-spin`} />
        </div>
      )}

      {/* Controls Overlay - LGBTQ+ Rainbow Style (only at bottom) */}

<div
  className="absolute bottom-0 left-0 right-0 h-full z-[-10] pointer-events-none transition-opacity duration-300 backdrop-blur-xl"
  style={{
    opacity: showControls ? (theme === 'dark' ? 0.8 : 0.7) : 0,
    background: `linear-gradient(to top,
      rgba(255, 0, 0, 0.3) 0%,
      rgba(255, 165, 0, 0.25) 10%,
      rgba(255, 255, 0, 0.2) 20%,
      rgba(0, 128, 0, 0.15) 30%,
      rgba(0, 0, 255, 0.1) 40%,
      rgba(75, 0, 130, 0.1) 50%,
      rgba(238, 130, 238, 0.08) 60%,
      transparent 100%
    )`
  }}
/>
      {/* Clickable overlay for play/pause on video */}
      <div
        className="absolute inset-0 pointer-events-none"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            togglePlay();
          }
        }}
      />

      {/* Center Play Button - Shows when paused */}
      <AnimatePresence>
        {!isPlaying && showControls && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          >
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.1 }}
              className={`p-4 rounded-full backdrop-blur-xl shadow-2xl pointer-events-auto  transition-colors z-10 flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white/10 text-primary backdrop-blur-sm transition-opacity group-hover:opacity-100 `}
            >
              <Play className="w-12 h-12 ml-1" fill="currentColor" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Bar - Always Visible */}
      <div 
        className="absolute bottom-[48px] left-0 right-0 px-0 pointer-events-auto z-20"
        onMouseDown={(e) => e.stopPropagation()}
        onMouseEnter={() => {
          setIsHovering(true);
          setShowControls(true);
          resetControlsTimeout();
        }}
      >
        <div className="relative h-[4px] group/progress hover:h-[6px] transition-all duration-200 cursor-pointer">
          <input
            type="range"
            min="0"
            max={duration || 0}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            onMouseDown={(e) => {
              e.stopPropagation();
              handleSeekStart();
            }}
            onMouseUp={(e) => {
              e.stopPropagation();
              handleSeekEnd();
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              handleSeekStart();
              setIsHovering(true);
              setShowControls(true);
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              handleSeekEnd();
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className={`absolute inset-0 h-full rounded-full overflow-hidden ${
            theme === 'dark' 
              ? 'bg-white/15 group-hover/progress:bg-white/25' 
              : 'bg-black/15 group-hover/progress:bg-black/25'
          } transition-colors`}>
            {/* Buffered Progress */}
            {buffered > 0 && (
              <div 
                className={`absolute left-0 top-0 h-full rounded-full transition-all ${
                  theme === 'dark' ? 'bg-white/10' : 'bg-black/10'
                }`}
                style={{ width: `${buffered}%` }}
              />
            )}
            {/* Current Progress */}
            <motion.div 
              className="absolute left-0 top-0 h-full bg-[#ff0000] rounded-full"
              initial={{ width: 0 }}
              animate={{
                width: `${duration ? (currentTime / duration) * 100 : 0}%`
              }}
              transition={{ 
                duration: isDragging ? 0 : 0.1, 
                ease: 'linear' 
              }}
            />
          </div>
          <motion.div 
            className={`absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-[#ff0000] opacity-0 group-hover/progress:opacity-100 transition-opacity -translate-x-1/2 shadow-lg ring-2 z-20 ${
              theme === 'dark' ? 'ring-white/50' : 'ring-black/50'
            }`}
            style={{
              left: `${duration ? (currentTime / duration) * 100 : 0}%`
            }}
            whileHover={{ scale: 1.3 }}
            whileTap={{ scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          />
        </div>
      </div>

      {/* Controls Container - Smooth Fade */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-0 left-0 right-0 pointer-events-auto"
          >

        {/* Control Bar - YouTube Style */}
        <div className="absolute bottom-0 left-0 right-0 px-2 py-1 pointer-events-auto">
          <div className="flex items-center justify-between gap-2">
            {/* Left Controls */}
            <div className="flex items-center gap-0">
              {/* Play/Pause Button */}
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
                whileTap={{ scale: 0.85 }}
                whileHover={{ scale: 1.15 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className={`p-2 rounded-full transition-all duration-150 flex items-center justify-center z-10 flex shrink-0 items-center justify-center rounded-full bg-white/10 text-primary backdrop-blur-sm transition-opacity group-hover:opacity-100`}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" fill="currentColor" />
                ) : (
                  <Play className="w-6 h-6 ml-0.5" fill="currentColor" />
                )}
              </motion.button>

              {/* Previous/Next Buttons - Combined */}
              <div className="flex items-center">
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    skip(-10);
                  }}
                  whileTap={{ scale: 0.8 }}
                  whileHover={{ scale: 1.15 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  className={`p-2 rounded transition-all duration-150 ${
                    theme === 'dark' 
                      ? 'text-white hover:bg-white/10' 
                      : 'text-black hover:bg-black/10'
                  }`}
                  title="Rewind 10 seconds (←)"
                >
                  <SkipBack className="w-5 h-5" />
                </motion.button>
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    skip(10);
                  }}
                  whileTap={{ scale: 0.8 }}
                  whileHover={{ scale: 1.15 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  className={`p-2 rounded transition-all duration-150 ${
                    theme === 'dark' 
                      ? 'text-white hover:bg-white/10' 
                      : 'text-black hover:bg-black/10'
                  }`}
                  title="Forward 10 seconds (→)"
                >
                  <SkipForward className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Volume Control - YouTube Style */}
              <div className="flex items-center gap-0 group/volume">
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMute();
                  }}
                  whileTap={{ scale: 0.85 }}
                  whileHover={{ scale: 1.15 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  className={`p-2 rounded transition-all duration-150 ${
                    theme === 'dark' 
                      ? 'text-white hover:bg-white/10' 
                      : 'text-black hover:bg-black/10'
                  }`}
                  title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-6 h-6" />
                  ) : (
                    <Volume2 className="w-6 h-6" />
                  )}
                </motion.button>
                <div className="w-0 group-hover/volume:w-20 opacity-0 group-hover/volume:opacity-100 transition-all duration-200 overflow-hidden">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    onClick={(e) => e.stopPropagation()}
                    className={`w-full h-1 rounded-lg appearance-none cursor-pointer slider-volume ${
                      theme === 'dark' ? 'bg-white/30' : 'bg-black/30'
                    }`}
                    style={{
                      background: `linear-gradient(to right, ${
                        theme === 'dark' ? '#fff' : '#000'
                      } 0%, ${
                        theme === 'dark' ? '#fff' : '#000'
                      } ${
                        (isMuted ? 0 : volume) * 100
                      }%, ${
                        theme === 'dark' 
                          ? 'rgba(255, 255, 255, 0.3)' 
                          : 'rgba(0, 0, 0, 0.3)'
                      } ${
                        (isMuted ? 0 : volume) * 100
                      }%, ${
                        theme === 'dark' 
                          ? 'rgba(255, 255, 255, 0.3)' 
                          : 'rgba(0, 0, 0, 0.3)'
                      } 100%)`,
                    }}
                  />
                </div>
              </div>

              {/* Time Display - YouTube Style */}
              <div className="flex items-center gap-1 px-2">
                <span className={`text-xs font-medium tabular-nums ${
                  theme === 'dark' ? 'text-white' : 'text-black'
                }`}>
                  {formatTime(currentTime)}
                </span>
                <span className={`text-xs ${
                  theme === 'dark' ? 'text-white/70' : 'text-black/70'
                }`}>/</span>
                <span className={`text-xs tabular-nums ${
                  theme === 'dark' ? 'text-white/70' : 'text-black/70'
                }`}>
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-0">
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFullscreen();
                }}
                whileTap={{ scale: 0.85 }}
                whileHover={{ scale: 1.15 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className={`p-2 rounded transition-all duration-150 ${
                  theme === 'dark' 
                    ? 'text-white hover:bg-white/10' 
                    : 'text-black hover:bg-black/10'
                }`}
                title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}
              >
                {isFullscreen ? (
                  <Minimize className="w-6 h-6" />
                ) : (
                  <Maximize className="w-6 h-6" />
                )}
              </motion.button>
            </div>
          </div>
        </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Slider Styles - Theme Aware */}
      <style>{`
        .slider-volume::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: ${theme === 'dark' ? '#fff' : '#000'};
          cursor: pointer;
          transition: all 0.15s;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }
        .slider-volume::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
        }
        .slider-volume::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: ${theme === 'dark' ? '#fff' : '#000'};
          cursor: pointer;
          border: none;
          transition: all 0.15s;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }
        .slider-volume::-moz-range-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
        }
      `}</style>
    </div>
  );
};

export default VideoPlayer;

