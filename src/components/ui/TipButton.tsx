import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from '@/router';
import { Coins, X, Loader2, CheckCircle2, DollarSign, HandCoins, ArrowRight, AlertTriangle, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

interface TipButtonProps {
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
  recipientUsername?: string;
  onTipSuccess?: (amount: number) => void;
  trigger?: React.ReactNode;
  className?: string;
}

const tipAmounts = [
    { amount: 0.10, label: '0.10' },
    { amount: 0.25, label: '0.25' },
    { amount: 0.50, label: '0.50' },
    { amount: 0.75, label: '0.75' },
    { amount: 1.00, label: '1.00' },
    { amount: 1.25, label: '1.25' },
    { amount: 1.50, label: '1.50' },
    { amount: 1.75, label: '1.75' },
    { amount: 2.00, label: '2.00' },
    { amount: 2.25, label: '2.25' },
    { amount: 2.50, label: '2.50' },
    { amount: 2.75, label: '2.75' },
    { amount: 3.00, label: '3.00' },
    { amount: 3.50, label: '3.50' },
    { amount: 4.00, label: '4.00' },
    { amount: 4.50, label: '4.50' },
    { amount: 5.00, label: '5.00' },
    { amount: 10, label: '10.00' },
    { amount: 20, label: '20.00' },
    { amount: 30, label: '30.00' },
    { amount: 40, label: '40.00' },
    { amount: 50, label: '50.00' },
    { amount: 75, label: '75.00' },
    { amount: 100, label: '100' },
  ];

const rainbowRankStyles: Array<{ background: string; color: string }> = [
  { background: 'linear-gradient(135deg, #FF3B30 0%, #FF6B3B 100%)', color: '#ffffff' },
  { background: 'linear-gradient(135deg, #FF9500 0%, #FFD60A 100%)', color: '#1f2937' },
  { background: 'linear-gradient(135deg, #FFD60A 0%, #34C759 100%)', color: '#1f2937' },
  { background: 'linear-gradient(135deg, #34C759 0%, #32D74B 100%)', color: '#ffffff' },
  { background: 'linear-gradient(135deg, #007AFF 0%, #5AC8FA 100%)', color: '#ffffff' },
  { background: 'linear-gradient(135deg, #5856D6 0%, #5E5CE6 100%)', color: '#ffffff' },
  { background: 'linear-gradient(135deg, #AF52DE 0%, #FF2D55 100%)', color: '#ffffff' },
];

const tipBurstPalette = ['#111827', '#374151', '#6b7280', '#9ca3af', '#e5e7eb'];
const TIP_CELEBRATION_DURATION = 2600;
const TIP_SUCCESS_DISPLAY_DURATION = 2000;

type TipParticle = {
  id: number;
  x: number;
  y: number;
  rotate: number;
  Icon: typeof DollarSign;
  color: string;
  delay: number;
};

type TipConfetti = {
  id: number;
  size: number;
  color: string;
  shape: 'circle' | 'square' | 'triangle';
  x: number;
  y: number;
  driftX: number;
  driftY: number;
  rotate: number;
  duration: number;
  delay: number;
};

type TipStreak = {
  id: number;
  angle: number;
  length: number;
  delay: number;
};

const createTipParticles = (count: number = 16): TipParticle[] =>
  Array.from({ length: count }).map((_, index) => {
    const radius = 180 + Math.random() * 80;
    const angle = (index * 360) / count;
    const x = Math.cos((angle * Math.PI) / 180) * radius;
    const y = Math.sin((angle * Math.PI) / 180) * radius;
    const color = tipBurstPalette[index % tipBurstPalette.length];

    return {
      id: index,
      x,
      y,
      rotate: Math.random() * 360,
      Icon: DollarSign,
      color,
      delay: index * 0.06,
    };
  });

const createTipConfetti = (count: number = 26): TipConfetti[] =>
  Array.from({ length: count }).map((_, index) => {
    const size = 8 + Math.random() * 8;
    const angle = (index * 360) / count;
    const radius = 60 + Math.random() * 160;
    const x = Math.cos((angle * Math.PI) / 180) * radius;
    const y = Math.sin((angle * Math.PI) / 180) * radius;
    const shapes: Array<'circle' | 'square' | 'triangle'> = ['circle', 'square', 'triangle'];
    return {
      id: index,
      size,
      color: tipBurstPalette[index % tipBurstPalette.length],
      shape: shapes[index % shapes.length],
      x,
      y,
      driftX: Math.random() * 40 - 20,
      driftY: Math.random() * 80 + 20,
      rotate: Math.random() * 180,
      duration: 1.2 + Math.random() * 0.5,
      delay: index * 0.05,
    };
  });

const createTipStreaks = (count: number = 6): TipStreak[] =>
  Array.from({ length: count }).map((_, index) => ({
    id: index,
    angle: Math.random() * 360,
    length: 110 + Math.random() * 60,
    delay: index * 0.1,
  }));
  
const TipButton: React.FC<TipButtonProps> = ({
  recipientId,
  recipientName,
  recipientAvatar,
  recipientUsername,
  onTipSuccess,
  trigger,
  className = '',
}) => {
  const [showTipModal, setShowTipModal] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [customMode, setCustomMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successAmount, setSuccessAmount] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [showTipCelebration, setShowTipCelebration] = useState(false);
  const [tipParticles, setTipParticles] = useState<TipParticle[]>(() => createTipParticles());
  const [tipConfetti, setTipConfetti] = useState<TipConfetti[]>(() => createTipConfetti());
  const [tipStreaks, setTipStreaks] = useState<TipStreak[]>(() => createTipStreaks());
  const [tipOverlayKey, setTipOverlayKey] = useState(0);
  const [tipError, setTipError] = useState<{ message: string; code?: string } | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);
  const celebrationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successRevealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const floatingCoinAngles = useMemo(
    () => ['-90deg', '-35deg', '15deg', '80deg', '135deg'],
    []
  );

  const { theme } = useTheme();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  
  // Get user balance (default to 0 if not available, ensure it's a number)
  const userBalance = useMemo(() => {
    const balance = (user as any)?.balance;
    if (balance === null || balance === undefined) return 0;
    const numBalance = typeof balance === 'string' ? parseFloat(balance) : Number(balance);
    return isNaN(numBalance) ? 0 : numBalance;
  }, [user]);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    return () => {
      if (celebrationTimeoutRef.current) {
        clearTimeout(celebrationTimeoutRef.current);
      }
      if (successRevealTimeoutRef.current) {
        clearTimeout(successRevealTimeoutRef.current);
      }
      if (successCloseTimeoutRef.current) {
        clearTimeout(successCloseTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (showTipCelebration) {
      setTipOverlayKey(Date.now());
      setTipParticles(createTipParticles());
      setTipConfetti(createTipConfetti());
      setTipStreaks(createTipStreaks());
    }
  }, [showTipCelebration]);

  // Close modal on ESC key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showTipModal) {
        setShowTipModal(false);
      }
    };

    if (showTipModal) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showTipModal]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowTipModal(false);
      }
    };

    if (showTipModal) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTipModal]);

  const handleOpenModal = () => {
    setShowTipModal(true);
    setSelectedAmount(null);
    setCustomAmount('');
    setIsProcessing(false);
    setCustomMode(false);
    setIsSuccess(false);
    setSuccessAmount(0);
    setTipError(null);
    if (celebrationTimeoutRef.current) {
      clearTimeout(celebrationTimeoutRef.current);
    }
    if (successRevealTimeoutRef.current) {
      clearTimeout(successRevealTimeoutRef.current);
    }
    if (successCloseTimeoutRef.current) {
      clearTimeout(successCloseTimeoutRef.current);
    }
    setShowTipCelebration(false);
  };

  const handleAmountSelect = (amount: number) => {
    // Toggle: If the same amount is clicked, deselect it
    if (selectedAmount === amount) {
      setSelectedAmount(null);
    } else {
      setSelectedAmount(amount);
      setCustomAmount('');
    }
    setCustomMode(false);
    setTipError(null);
  };

  const handleCustomAmountChange = (value: string) => {
    // Only allow numbers and up to 2 decimal places
    const regex = /^\d*(\.\d{0,2})?$/;
    if (regex.test(value) || value === '') {
      setCustomAmount(value);
      setSelectedAmount(null);
      setCustomMode(true);
      setTipError(null);
    }
  };

  const handleCustomCardSelect = () => {
    if (!customMode) {
      setCustomMode(true);
    }
    setSelectedAmount(null);
    setTipError(null);
    setTimeout(() => customInputRef.current?.focus(), 0);
  };

  const handleCustomRatioSelect = (ratio: number) => {
    if (userBalance <= 0) return;
    const value = (userBalance * ratio).toFixed(2);
    setCustomAmount(value);
    setSelectedAmount(null);
    setCustomMode(true);
    setTimeout(() => customInputRef.current?.focus(), 0);
  };

  const shouldShowCustomInput = customMode || customAmount !== '';

  const getFinalAmount = (): number => {
    if (customAmount) {
      const parsed = parseFloat(customAmount);
      return isNaN(parsed) || parsed <= 0 ? 0 : Math.max(0, parsed);
    }
    return selectedAmount ? Math.max(0, selectedAmount) : 0;
  };

  const handleTipSubmit = async () => {
    const amount = getFinalAmount();
    if (amount <= 0 || isProcessing || isSuccess) return;

    setIsProcessing(true);
    setTipError(null);
    try {
      const response = await api.handleSendTip(recipientId, amount);

      const nextBalance = response?.balance;
      if (typeof nextBalance === 'number' || typeof nextBalance === 'string') {
        const parsedBalance = Number(nextBalance);
        if (!Number.isNaN(parsedBalance)) {
          updateUser({ balance: parsedBalance });
        }
      }

      setSuccessAmount(amount);
      setIsSuccess(false);
      setShowTipModal(false);
      setShowTipCelebration(true);
      if (celebrationTimeoutRef.current) {
        clearTimeout(celebrationTimeoutRef.current);
      }
      celebrationTimeoutRef.current = setTimeout(() => {
        setShowTipCelebration(false);
      }, TIP_CELEBRATION_DURATION);

      if (successRevealTimeoutRef.current) {
        clearTimeout(successRevealTimeoutRef.current);
      }
      successRevealTimeoutRef.current = setTimeout(() => {
        setShowTipModal(true);
        setIsSuccess(true);
        if (successCloseTimeoutRef.current) {
          clearTimeout(successCloseTimeoutRef.current);
        }
        successCloseTimeoutRef.current = setTimeout(() => {
          setShowTipModal(false);
          setIsSuccess(false);
        }, TIP_SUCCESS_DISPLAY_DURATION);
      }, TIP_CELEBRATION_DURATION);

      onTipSuccess?.(amount);
      setSelectedAmount(null);
      setCustomAmount('');
      setCustomMode(false);
    } catch (error) {
      const responseData = (error as any)?.response?.data;
      const message =
        responseData?.message ||
        (error as any)?.message ||
        'Unable to send tip. Please try again.';
      const code = responseData?.code;
      setTipError({ message, code });
      console.error('Error sending tip:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const defaultTrigger = (
    <motion.button
      onClick={handleOpenModal}
      whileTap={{ scale: 0.9 }}
      className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-colors duration-200 ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-slate-900 hover:bg-slate-900/10'}`}
    >
      <HandCoins className="w-5 h-5" />
      <span className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Tip</span>
    </motion.button>
  );

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    handleOpenModal();
  };

  const finalAmount = useMemo(() => {
    const amount = getFinalAmount();
    return isNaN(amount) ? 0 : Math.max(0, amount);
  }, [selectedAmount, customAmount]);
  
  const canSubmit = finalAmount > 0 && !isProcessing && !isSuccess && finalAmount <= userBalance;

  return (
    <>
      {trigger ? (
        <div
          className={className}
          onClick={handleTriggerClick}
          style={{ pointerEvents: 'auto' }}
        >
          {React.isValidElement(trigger)
            ? React.cloneElement(trigger as React.ReactElement<any>, {
                onClick: (e: React.MouseEvent) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleOpenModal();
                },
                style: { pointerEvents: 'auto' as const, ...((trigger as any).props?.style || {}) }
              })
            : trigger
          }
        </div>
      ) : (
        defaultTrigger
      )}

      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {showTipModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="cv-modal-glass-backdrop fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-2 md:p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowTipModal(false);
                }
              }}
            >
              <motion.div
                ref={modalRef}
                initial={{ 
                  opacity: 0, 
                  y: isMobile ? '100%' : 20,
                  scale: isMobile ? 1 : 0.95
                }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  scale: 1
                }}
                exit={{ 
                  opacity: 0, 
                  y: isMobile ? '100%' : 20,
                  scale: isMobile ? 1 : 0.95
                }}
                transition={{ 
                  duration: isMobile ? 0.3 : 0.2,
                  ease: [0.4, 0, 0.2, 1]
                }}
                onClick={(e) => e.stopPropagation()}
                className={`w-full sm:w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden ${
                  theme === 'dark'
                    ? 'cv-card-surface-solid border border-white/10'
                    : 'bg-white border border-slate-200'
                }`}
              >
                {/* Mobile Drag Handle */}
                {isMobile && (
                  <div className="flex justify-center pt-3 pb-2">
                    <div className={`w-12 h-1.5 rounded-full ${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                    }`} />
                  </div>
                )}
                
                <div className="max-h-[90vh] sm:max-h-none overflow-y-auto sm:overflow-visible scrollbar-hide">
                  {/* Success State */}
                  {isSuccess ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="px-5 py-8 sm:py-10 flex flex-col items-center justify-center min-h-[280px]"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${
                          theme === 'dark' ? 'bg-green-500/20' : 'bg-green-50'
                        }`}
                      >
                        <CheckCircle2 className="w-7 h-7 text-green-500" />
                      </motion.div>
                      <motion.h3
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className={`text-xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                      >
                        Tip Sent!
                      </motion.h3>
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}
                      >
                        ${successAmount.toFixed(2)} sent to {recipientName}
                      </motion.p>
                    </motion.div>
                  ) : (
                    <>
                      {/* Modal Header - Compact Design */}
                      <div className={`px-4 py-3 sm:px-5 sm:py-3.5 border-b ${
                        theme === 'dark' ? 'border-white/10' : 'border-slate-200 bg-white'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              theme === 'dark'
                                ? 'bg-white/10 text-white'
                                : 'bg-slate-900 text-white'
                            }`}>
                              <Coins className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className={`text-sm sm:text-base font-semibold truncate ${
                                theme === 'dark' ? 'text-white' : 'text-slate-900'
                              }`}>
                                Send Tip
                              </h3>
                              <p className={`text-xs mt-0.5 truncate ${
                                theme === 'dark' ? 'text-gray-400' : 'text-slate-500'
                              }`}>
                                Support {recipientName}
                              </p>
                            </div>
                          </div>
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowTipModal(false);
                            }}
                            whileTap={{ scale: 0.9 }}
                            className={`p-1 rounded-full transition-colors duration-200 flex-shrink-0 ${
                              theme === 'dark'
                                ? 'hover:bg-gray-800 text-gray-400 hover:text-white'
                                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
                            }`}
                          >
                            <X className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>

                      {/* Enterprise Body */}
                      <div className="px-5 sm:px-6 py-4 space-y-3">
                        <div className={`rounded-xl border p-3 sm:p-4 ${theme === 'dark'
                          ? 'border-white/10 bg-white/5'
                          : 'border-slate-200 bg-white'}`}>
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              {recipientAvatar ? (
                                <img
                                  src={recipientAvatar}
                                  alt={recipientName}
                                  className="w-9 h-9 rounded-full object-cover shadow-sm"
                                />
                              ) : (
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold ${theme === 'dark' ? 'bg-white/10 text-white/90' : 'bg-slate-200 text-slate-700'}`}>
                                  {recipientName.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className={`text-sm font-semibold truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                  {recipientName}
                                </p>
                                {recipientUsername && (
                                  <p className={`text-xs truncate ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>
                                    @{recipientUsername}
                                  </p>
                                )}
                                <p className={`text-[11px] ${theme === 'dark' ? 'text-gray-500' : 'text-slate-400'}`}>
                                  Recipient
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-[10px] uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>
                                Balance
                              </p>
                              <p className={`text-lg font-semibold tabular-nums ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                {'$' + userBalance.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className={`rounded-xl border p-3 sm:p-4 ${theme === 'dark'
                          ? 'border-white/10 bg-white/5'
                          : 'border-slate-200 bg-white'}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`text-[10px] uppercase tracking-wider font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-slate-600'}`}>
                                Amount
                              </p>
                              <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-slate-500'}`}>
                                Choose an amount or enter a custom value
                              </p>
                            </div>
                            <div className={`text-lg font-semibold tabular-nums ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                              {'$' + finalAmount.toFixed(2)}
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-4 sm:grid-cols-6 gap-1.5 sm:gap-2">
                            {tipAmounts.map((tip, index) => {
                              const isSelected = selectedAmount === tip.amount;
                              const gradientStyle = rainbowRankStyles[index % rainbowRankStyles.length];
                              return (
                                <motion.button
                                  key={tip.amount}
                                  onClick={() => handleAmountSelect(tip.amount)}
                                  whileTap={{ scale: 0.96 }}
                                  whileHover={{ scale: 1.01 }}
                                  className={`relative cursor-pointer w-full h-14 rounded-2xl flex flex-col items-center justify-center gap-1 text-[12px] font-semibold tabular-nums transition-all duration-200 border ${isSelected
                                    ? theme === 'dark'
                                      ? 'bg-white text-gray-900 border-white/20'
                                      : 'bg-slate-900 text-white border-slate-900'
                                    : theme === 'dark'
                                      ? 'bg-white/5 border-white/10 text-gray-200 hover:bg-white/10 hover:border-white/20'
                                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'}`}
                                >
                                  <span
                                    className="inline-flex h-5 w-5 items-center justify-center rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.25)]"
                                    style={{ background: gradientStyle.background }}
                                  >
                                    <DollarSign className="h-3 w-3" style={{ color: gradientStyle.color }} />
                                  </span>
                                  <span className="leading-none">
                                    {'$' + tip.label}
                                  </span>
                                </motion.button>
                              );
                            })}
                            <motion.button
                              onClick={handleCustomCardSelect}
                              whileTap={{ scale: 0.96 }}
                              whileHover={{ scale: 1.01 }}
                              className={`relative cursor-pointer w-full h-14 rounded-2xl flex flex-col items-center justify-center gap-1 text-[12px] font-semibold tabular-nums transition-all duration-200 border ${customMode
                                ? theme === 'dark'
                                  ? 'bg-white text-gray-900 border-white/20'
                                  : 'bg-slate-900 text-white border-slate-900'
                                : theme === 'dark'
                                  ? 'bg-white/5 border-white/10 text-gray-200 hover:bg-white/10 hover:border-white/20'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'}`}
                            >
                              <span
                                className="inline-flex h-5 w-5 items-center justify-center rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.25)]"
                                style={{
                                  background: rainbowRankStyles[0].background,
                                  color: rainbowRankStyles[0].color,
                                }}
                              >
                                <Plus className="h-3 w-3" />
                              </span>
                              <span className="leading-none">Custom</span>
                            </motion.button>
                          </div>

                          <AnimatePresence>
                            {shouldShowCustomInput && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className={`mt-3 rounded-lg border p-3 overflow-hidden ${theme === 'dark'
                                  ? 'border-white/10 bg-white/5'
                                  : 'border-slate-200 bg-slate-50'}`}
                              >
                                <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${theme === 'dark' ? 'text-gray-300' : 'text-slate-600'}`}>
                                  Custom Amount
                                </label>
                                <div className="relative group">
                                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 flex items-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                    <span className="text-lg font-semibold">$</span>
                                  </div>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={customAmount}
                                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                                    onFocus={() => setCustomMode(true)}
                                    placeholder="Enter amount"
                                    ref={customInputRef}
                                    className={`w-full pl-9 pr-4 py-2.5 rounded-lg text-base font-semibold transition-all duration-200 ${theme === 'dark'
                                      ? 'bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-white/40 focus:bg-white/10 focus:ring-2 focus:ring-white/10'
                                      : 'bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200/60'} focus:outline-none`}
                                  />
                                  {customAmount && (
                                    <motion.div
                                      initial={{ opacity: 0, x: -5 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      className={`absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}
                                    >
                                      {parseFloat(customAmount) > 0 && ('$' + parseFloat(customAmount).toFixed(2))}
                                    </motion.div>
                                  )}
                                </div>
                                <div className="mt-2 flex items-center gap-1.5">
                                  {[0.25, 0.5, 0.75, 1].map((ratio) => (
                                    <button
                                      key={ratio}
                                      type="button"
                                      onClick={() => handleCustomRatioSelect(ratio)}
                                      className={`flex-1 px-2 py-1 rounded-full text-[11px] font-semibold transition-colors ${theme === 'dark'
                                        ? 'bg-white/5 text-gray-300 hover:bg-white/10'
                                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                                    >
                                      {Math.round(ratio * 100)}%
                                    </button>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {tipError && (
                          <div className={`rounded-lg border p-2.5 flex items-start gap-2 text-xs ${theme === 'dark'
                            ? 'border-rose-500/30 bg-rose-500/10'
                            : 'border-rose-200 bg-rose-50'}`}>
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-rose-500/20 text-rose-200' : 'bg-rose-100 text-rose-600'}`}>
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className={`text-[11px] font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-rose-100' : 'text-rose-700'}`}>
                                Tip failed
                              </p>
                              <p className={`${theme === 'dark' ? 'text-rose-200/90' : 'text-rose-600'}`}>
                                {tipError.message}
                              </p>
                              {tipError.code && (
                                <span className={`mt-1 inline-flex text-[10px] uppercase tracking-wider ${theme === 'dark' ? 'text-rose-200/80' : 'text-rose-500'}`}>
                                  {tipError.code}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        <AnimatePresence>
                          {finalAmount > userBalance && finalAmount > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className={`rounded-lg border p-2.5 flex items-center justify-between gap-2 ${theme === 'dark'
                                ? 'border-rose-500/30 bg-rose-500/10'
                                : 'border-rose-200 bg-rose-50'}`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <X className={`w-4 h-4 ${theme === 'dark' ? 'text-rose-300' : 'text-rose-600'}`} />
                                <div className="min-w-0">
                                  <p className={`text-[11px] font-semibold ${theme === 'dark' ? 'text-rose-200' : 'text-rose-700'}`}>
                                    Insufficient balance
                                  </p>
                                  <p className={`text-[11px] ${theme === 'dark' ? 'text-rose-200/80' : 'text-rose-600'}`}>
                                    Need {'$' + Math.max(0, finalAmount - userBalance).toFixed(2)} more
                                  </p>
                                </div>
                              </div>
                              <motion.button
                                onClick={() => {
                                  setShowTipModal(false);
                                  navigate('/wallet');
                                }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`px-3 py-1.5 rounded-full font-semibold text-[10px] uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 ${theme === 'dark'
                                  ? 'bg-white/10 text-white hover:bg-white/20'
                                  : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                              >
                                <Coins className="w-3.5 h-3.5" />
                                <span>Deposit</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </motion.button>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <motion.button
                          onClick={handleTipSubmit}
                          disabled={!canSubmit}
                          whileTap={canSubmit ? { scale: 0.98 } : undefined}
                          className={`w-full py-3 rounded-lg font-semibold text-sm sm:text-base transition-all duration-200 flex items-center justify-center gap-2 ${canSubmit
                            ? theme === 'dark'
                              ? 'bg-white text-black hover:bg-gray-100 shadow-md shadow-white/10'
                              : 'bg-slate-900 text-white hover:bg-slate-800 shadow-md shadow-black/10'
                            : theme === 'dark'
                              ? 'bg-white/10 text-gray-500 cursor-not-allowed'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>Processing...</span>
                            </>
                          ) : (
                            <>
                              <Coins className="w-5 h-5" />
                              <span>Send {'$' + finalAmount.toFixed(2)}</span>
                            </>
                          )}
                        </motion.button>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {showTipCelebration && (
            <motion.div
              key={tipOverlayKey}
              className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <motion.div
                className="absolute inset-0 bg-black/70"
                initial={{ opacity: 0 }}
                animate={{ opacity: theme === 'dark' ? 0.8 : 0.6 }}
                exit={{ opacity: 0 }}
              />
              <motion.div
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                style={{
                  background:
                    'linear-gradient(135deg, rgba(67,3,7,0.98) 0%, rgba(127,29,29,0.95) 40%, rgba(220,38,38,0.9) 75%, rgba(248,113,113,0.85) 100%)',
                }}
              />
    
              <motion.div
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.3, 0.1, 0.35] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                style={{
                  background: 'radial-gradient(circle at 70% 40%, rgba(220,38,38,0.5), rgba(0,0,0,0) 60%)',
                  mixBlendMode: 'screen',
                }}
              />
              <motion.div
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: [0, 0.4, 0], scale: [0.6, 1, 1.3] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.1, ease: 'easeOut' }}
                style={{
                  background: 'radial-gradient(circle, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 65%)',
                }}
              />
              <motion.div
                className="absolute"
                style={{ width: 260, height: 260 }}
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: [0.4, 1.2, 1.4], opacity: [0.35, 0.1, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.6, ease: 'easeOut', repeat: Infinity, repeatType: 'loop' }}
              >
                <div className="w-full h-full rounded-full border border-white/15" />
              </motion.div>

              {tipStreaks.map((streak) => (
                <motion.span
                  key={`tip-streak-${streak.id}`}
                  className="absolute origin-center"
                  style={{
                    width: streak.length,
                    height: 2,
                    rotate: `${streak.angle}deg`,
                    background:
                      'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.9) 40%, rgba(255,255,255,0.1) 100%)',
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 1.05, 0.8], opacity: [0, 1, 0] }}
                  transition={{ duration: 1.1, ease: 'easeOut', delay: streak.delay, repeat: Infinity, repeatType: 'loop' }}
                />
              ))}

              {floatingCoinAngles.map((angle, index) => (
                <motion.div
                  key={`floating-coin-${index}`}
                  className="absolute text-white/70"
                  style={{ rotate: angle }}
                  initial={{ opacity: 0, scale: 0.4, y: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0.4, 0.95, 1.15],
                    y: [-10, -40, -65],
                  }}
                  transition={{
                    duration: 1.6 + index * 0.1,
                    delay: 0.15 * index,
                    repeat: Infinity,
                    repeatType: 'loop',
                    ease: 'easeOut',
                  }}
                >
                  <DollarSign className="h-7 w-7 text-white/80" />
                </motion.div>
              ))}

              <div className="relative z-[1] flex flex-col items-center gap-4 text-center">
                <motion.div
                  initial={{ scale: 0, rotate: -25 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 15 }}
                  className="relative"
                >
                  <motion.div
                    animate={{ scale: [1, 1.08, 1], rotate: [0, 4, -4, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                    className="rounded-full drop-shadow-[0_0_65px_rgba(248,113,113,0.45)]"
                  >
                    <div className="w-28 h-28 rounded-full flex items-center justify-center bg-red-500/30">
                      <Coins className="w-14 h-14 text-white" />
                    </div>
                  </motion.div>
                </motion.div>

                <motion.h3
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.35 }}
                  className="text-3xl font-bold tracking-tight text-white"
                >
                  Tip sent to {recipientName}!
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.35 }}
                  className="text-lg font-semibold text-white"
                >
                  +${successAmount.toFixed(2)}
                </motion.p>
              </div>

              {tipParticles.map((particle) => (
                <motion.div
                  key={`tip-particle-${particle.id}`}
                  className="absolute drop-shadow-[0_0_18px_rgba(255,255,255,0.35)]"
                  initial={{ x: 0, y: 0, scale: 0, opacity: 0, rotate: 0 }}
                  animate={{
                    x: particle.x,
                    y: particle.y,
                    scale: [0, 1.3, 0.9],
                    opacity: [0, 1, 0],
                    rotate: particle.rotate + 120,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.3, ease: 'easeOut', delay: particle.delay }}
                >
                  <particle.Icon className="w-10 h-10" style={{ color: particle.color }} />
                </motion.div>
              ))}

              {tipConfetti.map((confetti) => (
                <motion.span
                  key={`tip-confetti-${confetti.id}`}
                  className="absolute left-1/2 top-1/2"
                  initial={{ opacity: 0, scale: 0.4, x: 0, y: 0, rotate: 0 }}
                  animate={{
                    opacity: [0, 1, 0.8, 0],
                    scale: [0.4, 1, 0.9, 0.5],
                    x: [0, confetti.x * 0.6, confetti.x + confetti.driftX],
                    y: [0, confetti.y * 0.6, confetti.y + confetti.driftY],
                    rotate: [0, confetti.rotate * 0.6, confetti.rotate * 1.2],
                  }}
                  exit={{ opacity: 0, scale: 0.3, x: confetti.x * 1.1, y: confetti.y * 1.1 }}
                  transition={{
                    duration: confetti.duration,
                    ease: 'easeOut',
                    delay: confetti.delay,
                    repeat: Infinity,
                    repeatType: 'mirror',
                  }}
                  style={{
                    width: confetti.size,
                    height: confetti.size,
                    backgroundColor: confetti.color,
                    borderRadius: confetti.shape === 'circle' ? '9999px' : confetti.shape === 'square' ? '4px' : undefined,
                    clipPath:
                      confetti.shape === 'triangle'
                        ? 'polygon(50% 0%, 0% 100%, 100% 100%)'
                        : undefined,
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default TipButton;
