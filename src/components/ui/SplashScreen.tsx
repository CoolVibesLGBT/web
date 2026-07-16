import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { applicationName } from '../../appSettings';
import { resolvePublicAssetUrl } from '@/platform/runtime';

interface SplashScreenProps {
  onComplete?: () => void;
  autoDismiss?: boolean;
  durationMs?: number;
  fullScreen?: boolean;
  animate?: boolean;
}

const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  autoDismiss = true,
  durationMs = 2000,
  fullScreen = true,
  animate = true,
}) => {
  const { theme } = useTheme();
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (!autoDismiss) return;
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(() => {
        onComplete?.();
      }, 500);
    }, durationMs);

    return () => clearTimeout(timer);
  }, [autoDismiss, durationMs, onComplete]);

  const containerClass = fullScreen
    ? 'fixed inset-0 z-[9999]'
    : 'absolute inset-0'

  const motionProps = animate
    ? {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.5, ease: 'easeInOut' as const },
      }
    : {
        initial: false,
        animate: { opacity: 1 },
        exit: { opacity: 1 },
        transition: { duration: 0 },
      }

  const iconSrc = resolvePublicAssetUrl('/icons/icon_128x128.png')
  const shellClass = theme === 'dark'
    ? 'cv-pride-hero-bg text-white'
    : 'cv-pride-hero-bg text-slate-950'
  const panelClass = theme === 'dark'
    ? 'border-white/[0.12] bg-black/[0.35] shadow-[0_40px_120px_rgba(0,0,0,0.55)]'
    : 'border-white/80 bg-white/[0.72] shadow-[0_40px_120px_rgba(15,23,42,0.16)]'
  const mutedTextClass = theme === 'dark' ? 'text-white/58' : 'text-slate-500'

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          {...motionProps}
          className={`${containerClass} flex items-center justify-center overflow-hidden ${shellClass}`}
        >
          <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-gradient-to-b from-black/16 via-transparent to-black/36' : 'bg-gradient-to-b from-white/20 via-transparent to-white/58'}`} />

          <motion.div
            initial={{ y: 18, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{
              duration: 0.7,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.12,
            }}
            className={`relative mx-6 w-full max-w-[360px] rounded-[32px] border px-6 py-7 text-center backdrop-blur-3xl ${panelClass}`}
          >
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[26px] border border-white/20 bg-white/12 p-2 shadow-[0_24px_70px_rgba(0,0,0,0.25)]">
              <img
                src={iconSrc}
                alt={applicationName}
                className="h-full w-full rounded-[20px] object-cover"
                width={80}
                height={80}
              />
            </div>

            <motion.div
              initial={{ width: '18%' }}
              animate={{ width: '100%' }}
              transition={{
                duration: Math.max(0.9, durationMs / 1000 - 0.45),
                ease: [0.22, 1, 0.36, 1],
              }}
              className="mx-auto mb-5 h-1 rounded-full bg-[linear-gradient(90deg,#d04b36,#e36511,#ffba00,#00b180,#147aab,#675997)] shadow-[0_0_22px_rgba(20,122,171,0.34)]"
            />

            <motion.h1
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                duration: 0.55,
                ease: [0.22, 1, 0.36, 1],
                delay: 0.28,
              }}
              className="text-[28px] font-black leading-none text-current"
            >
              {applicationName}
            </motion.h1>

            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                duration: 0.55,
                ease: [0.22, 1, 0.36, 1],
                delay: 0.38,
              }}
              className={`mt-3 text-sm font-semibold ${mutedTextClass}`}
            >
              Stories from the Rainbow
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                duration: 0.45,
                ease: 'easeOut',
                delay: 0.52,
              }}
              className="mx-auto mt-5 flex w-fit items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-current/60"
            >
              CoolVibes
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
