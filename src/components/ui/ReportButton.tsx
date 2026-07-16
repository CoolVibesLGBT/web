import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Flag, AlertTriangle, Loader2, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { useApp } from '../../contexts/AppContext';
import { api } from '../../services/api';

export type ReportableType = 'post' | 'user';

interface ReportButtonProps {
  type: ReportableType;
  id: string | number;
  onReportSuccess?: () => void;
  onModalClose?: () => void;
  trigger?: React.ReactNode;
  className?: string;
}

const ReportButton: React.FC<ReportButtonProps> = ({
  type,
  id,
  onReportSuccess,
  onModalClose,
  trigger,
  className = '',
}) => {
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReportKind, setSelectedReportKind] = useState<any>(null);
  const [reportDescription, setReportDescription] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [isReportKindPickerOpen, setIsReportKindPickerOpen] = useState(false);
  const [reportKindSearchQuery, setReportKindSearchQuery] = useState('');
  const reportKindPickerRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const { data: appData, defaultLanguage } = useApp();

  const resetModalState = () => {
    setSelectedReportKind(null);
    setReportDescription('');
    setIsReportKindPickerOpen(false);
    setReportKindSearchQuery('');
  };

  const closeReportModal = () => {
    setShowReportModal(false);
    resetModalState();
    onModalClose?.();
  };

  // Close dropdown when clicking outside (only within modal)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Only close dropdown if click is inside modal content but outside dropdown
      if (
        reportKindPickerRef.current && 
        modalContentRef.current &&
        !reportKindPickerRef.current.contains(target) &&
        modalContentRef.current.contains(target) &&
        showReportModal
      ) {
        setIsReportKindPickerOpen(false);
      }
    };

    if (isReportKindPickerOpen && showReportModal) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isReportKindPickerOpen, showReportModal]);

  // Close modal on ESC key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showReportModal && !isReporting) {
        closeReportModal();
      }
    };

    if (showReportModal) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showReportModal, isReporting]);

  // Get report kinds sorted by display_order
  const reportKinds = useMemo(() => {
    if (!appData?.report_kinds) return [];
    return [...appData.report_kinds].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  }, [appData?.report_kinds]);

  // Get localized text for report kind
  const getLocalizedText = (obj: any) => {
    if (!obj || typeof obj !== 'object') return '';
    return obj[defaultLanguage] || obj.en || obj[Object.keys(obj)[0]] || '';
  };

  // Handle modal open
  const handleOpenModal = () => {
    setShowReportModal(true);
    resetModalState();
  };

  // Handle report kind selection
  const handleReportKindSelect = (reportKind: any) => {
    setSelectedReportKind(reportKind);
  };

  // Minimum character requirement
  const MIN_DESCRIPTION_LENGTH = 200;
  const isDescriptionValid = reportDescription.trim().length >= MIN_DESCRIPTION_LENGTH;

  // Handle report submission
  const handleReportSubmit = async () => {
    if (!selectedReportKind) return;
    if (isReporting) return;
    if (!isDescriptionValid) return;

    setIsReporting(true);
    try {
      if (type === 'post') {
        await api.handlePostReport(id, selectedReportKind.key, reportDescription || '');
      } else if (type === 'user') {
        // User report
        await api.handleUserReport(id, selectedReportKind.key, reportDescription || '');
      }
      
      closeReportModal();
      onReportSuccess?.();
    } catch (error) {
      console.error('Error reporting:', error);
      // Error handling - you can add toast notification here
    } finally {
      setIsReporting(false);
    }
  };

  const defaultTrigger = (
    <motion.button
      onClick={(e) => {
        e.stopPropagation();
        handleOpenModal();
      }}
      whileTap={{ scale: 0.9 }}
      className={`p-2 rounded-full transition-colors ${theme === 'dark'
        ? 'hover:bg-gray-900/50'
        : 'hover:bg-gray-100'
      } ${className}`}
    >
      <Flag className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
    </motion.button>
  );

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    handleOpenModal();
  };

  return (
    <>
        {trigger ? (
          <div
            onClick={handleTriggerClick}
            className={`cursor-pointer ${className || 'w-full'}`}
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

      {/* Report Modal */}
      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {showReportModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="cv-modal-glass-backdrop fixed inset-0 z-[100] flex items-center justify-center p-4"
              onClick={(e) => {
                // Only close if clicking directly on backdrop (not on modal content)
                if (e.target === e.currentTarget && !isReporting) {
                  closeReportModal();
                }
              }}
              onMouseDown={(e) => {
                // Only close if clicking directly on backdrop
                if (e.target === e.currentTarget && !isReporting) {
                  e.stopPropagation();
                }
              }}
            >
              <motion.div
                ref={modalContentRef}
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 10 }}
                transition={{ 
                  duration: 0.3, 
                  ease: [0.4, 0, 0.2, 1],
                  opacity: { duration: 0.2 }
                }}
                className={`cv-modal-glass-panel w-full max-w-md rounded-2xl border ${
                  theme === 'dark'
                    ? 'text-white'
                    : 'text-gray-900'
                } max-h-[calc(100dvh-2rem)] min-h-[min(620px,calc(100dvh-2rem))] overflow-hidden flex flex-col`}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
              <div 
                className="p-5 sm:p-6 flex min-h-0 flex-1 flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div className="flex shrink-0 items-center gap-3 mb-5 sm:mb-6">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    theme === 'dark' ? 'bg-red-500/20' : 'bg-red-50'
                  }`}>
                    <AlertTriangle className={`w-5 h-5 ${
                      theme === 'dark' ? 'text-red-400' : 'text-red-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      Report {type === 'post' ? 'Post' : 'User'}
                    </h3>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 scrollbar-hide">
                  {/* Report Type Selection */}
                  <div className="mb-5 sm:mb-6">
                    <label className={`flex items-center gap-2 mb-2.5 ${
                      theme === 'dark' ? 'text-white/80' : 'text-gray-700'
                    }`}>
                      <Flag className="w-4 h-4" />
                      <span className="text-xs sm:text-sm font-semibold tracking-tight">Report Type *</span>
                    </label>
                    <motion.button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsReportKindPickerOpen(!isReportKindPickerOpen);
                        if (!isReportKindPickerOpen) {
                          setReportKindSearchQuery('');
                        }
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                      className={`w-full px-4 sm:px-5 py-4 sm:py-4.5 text-base sm:text-lg rounded-xl sm:rounded-2xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 backdrop-blur-xl font-medium text-left flex items-center justify-between gap-3 ${
                        theme === 'dark'
                          ? 'bg-gray-900/30 border-gray-900 text-white focus:border-gray-900 focus:ring-gray-900/30 hover:border-gray-900'
                          : 'bg-gray-50 border-gray-300/60 text-gray-900 focus:border-gray-400 focus:ring-gray-300/40 hover:border-gray-400'
                      }`}
                    >
                      <span className={`min-w-0 flex-1 truncate ${selectedReportKind ? '' : 'opacity-60'}`}>
                        {selectedReportKind
                          ? getLocalizedText(selectedReportKind.name)
                          : 'Select report type'
                        }
                      </span>
                      <motion.div
                        className="shrink-0"
                        animate={{ rotate: isReportKindPickerOpen ? 180 : 0 }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                      >
                        <X className={`w-5 h-5 transform transition-transform duration-300 ${isReportKindPickerOpen ? 'rotate-45' : ''}`} />
                      </motion.div>
                    </motion.button>

                    {/* Report Kind Picker - Dropdown below button */}
                    <AnimatePresence>
                      {isReportKindPickerOpen && (
                        <motion.div
                          ref={reportKindPickerRef}
                          initial={{ opacity: 0, y: -8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.98 }}
                          transition={{
                            duration: 0.25,
                            ease: [0.4, 0, 0.2, 1],
                            opacity: { duration: 0.2 }
                          }}
                          className={`w-full max-h-[min(280px,38dvh)] overflow-y-auto overscroll-contain scrollbar-hide mt-2 rounded-xl border-2 ${
                            theme === 'dark'
                              ? 'cv-card-surface-solid border-white/10'
                              : 'bg-white border-gray-200/60'
                          }`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Search Bar */}
                          <div className={`sticky top-0 z-10 p-3 sm:p-4 border-b ${
                            theme === 'dark' ? 'cv-card-surface-muted border-white/10' : 'border-gray-200/50 bg-white'
                          }`}>
                            <div className="relative">
                              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                                theme === 'dark' ? 'text-white/50' : 'text-gray-400'
                              }`} />
                              <input
                                type="text"
                                placeholder="Search report types..."
                                value={reportKindSearchQuery}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  setReportKindSearchQuery(e.target.value);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                onFocus={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                onPointerDown={(e) => e.stopPropagation()}
                                className={`w-full pl-10 pr-4 py-2.5 rounded-lg text-sm border transition-all duration-200 focus:outline-none focus:ring-2 ${
                                  theme === 'dark'
                                    ? 'bg-gray-900 border-gray-900 text-white placeholder-white/40 focus:border-gray-900 focus:ring-gray-900/30'
                                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-gray-300 focus:ring-gray-200'
                                }`}
                              />
                            </div>
                          </div>

                          {/* All Report Kinds - Single column */}
                          <div className="p-2 sm:p-3">
                            {reportKinds
                              .filter(kind => {
                                const name = getLocalizedText(kind.name).toLowerCase();
                                const desc = getLocalizedText(kind.description).toLowerCase();
                                const key = kind.key.toLowerCase();
                                const query = reportKindSearchQuery.toLowerCase();
                                return name.includes(query) || desc.includes(query) || key.includes(query);
                              })
                              .map((kind) => (
                                <motion.button
                                  key={kind.key}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReportKindSelect(kind);
                                    setIsReportKindPickerOpen(false);
                                    setReportKindSearchQuery('');
                                  }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onPointerDown={(e) => e.stopPropagation()}
                                  className={`w-full px-3 py-2.5 rounded-lg text-sm text-left transition-all duration-300 mb-1.5 ${
                                    selectedReportKind?.key === kind.key
                                      ? theme === 'dark'
                                        ? 'bg-white text-black shadow-lg'
                                        : 'bg-black text-white shadow-lg'
                                      : theme === 'dark'
                                        ? 'bg-gray-900/30 hover:bg-gray-900/50 text-white/80 hover:text-white'
                                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-900'
                                  }`}
                                  whileHover={{ scale: 1.005 }}
                                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                                >
                                  <div className="font-semibold">{getLocalizedText(kind.name)}</div>
                                  {getLocalizedText(kind.description) && (
                                    <div className={`text-xs mt-0.5 ${
                                      selectedReportKind?.key === kind.key
                                        ? theme === 'dark' ? 'text-black/70' : 'text-white/80'
                                        : theme === 'dark' ? 'text-white/50' : 'text-gray-500'
                                    }`}>
                                      {getLocalizedText(kind.description)}
                                    </div>
                                  )}
                                </motion.button>
                              ))}
                            {reportKinds.filter(kind => {
                              const name = getLocalizedText(kind.name).toLowerCase();
                              const desc = getLocalizedText(kind.description).toLowerCase();
                              const key = kind.key.toLowerCase();
                              const query = reportKindSearchQuery.toLowerCase();
                              return name.includes(query) || desc.includes(query) || key.includes(query);
                            }).length === 0 && (
                              <div className={`px-3 py-2.5 text-sm rounded-lg ${
                                theme === 'dark' ? 'bg-gray-900/30 text-gray-400' : 'bg-gray-50 text-gray-500'
                              }`}>
                                No report types found
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Report Description */}
                  <AnimatePresence>
                    {selectedReportKind && !isReportKindPickerOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{
                          duration: 0.22,
                          ease: [0.4, 0, 0.2, 1],
                          opacity: { duration: 0.18 }
                        }}
                        className="mb-5 sm:mb-6"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <label className={`block text-sm font-medium ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            Additional Details *
                          </label>
                          <span className={`text-xs ${
                            isDescriptionValid
                              ? theme === 'dark' ? 'text-green-400' : 'text-green-600'
                              : theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                          }`}>
                            {reportDescription.trim().length} / {MIN_DESCRIPTION_LENGTH}
                          </span>
                        </div>
                        <textarea
                          value={reportDescription}
                          onChange={(e) => {
                            e.stopPropagation();
                            setReportDescription(e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          onFocus={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                          placeholder={`Please provide at least ${MIN_DESCRIPTION_LENGTH} characters describing the issue...`}
                          rows={5}
                          className={`w-full min-h-[132px] px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-opacity-100 transition-all resize-none ${
                            !isDescriptionValid && reportDescription.trim().length > 0
                              ? theme === 'dark'
                                ? 'bg-gray-900/30 border-red-500/60 text-white placeholder-gray-500 focus:border-red-500'
                                : 'bg-gray-50 border-red-500/60 text-gray-900 placeholder-gray-500 focus:border-red-500'
                              : theme === 'dark'
                                ? 'bg-gray-900/30 border-gray-900 text-white placeholder-gray-500 focus:border-gray-700'
                                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-gray-900'
                          }`}
                        />
                        <div className="min-h-[1.25rem]">
                          {!isDescriptionValid && reportDescription.trim().length > 0 && (
                            <p className="mt-2 text-xs text-red-500 font-medium">
                              Please provide at least {MIN_DESCRIPTION_LENGTH} characters ({MIN_DESCRIPTION_LENGTH - reportDescription.trim().length} more required)
                            </p>
                          )}
                          {reportDescription.trim().length === 0 && (
                            <p className="mt-2 text-xs text-gray-500">
                              Minimum {MIN_DESCRIPTION_LENGTH} characters required
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex shrink-0 items-center gap-3 pt-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      closeReportModal();
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    disabled={isReporting}
                    className={`flex-1 px-4 py-2.5 rounded-xl font-semibold transition-all ${
                      theme === 'dark'
                        ? 'bg-gray-900/50 text-white hover:bg-gray-900/70'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    } ${isReporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleReportSubmit();
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    disabled={isReporting || !selectedReportKind || !isDescriptionValid}
                    className={`flex-1 px-4 py-2.5 rounded-xl font-semibold transition-all ${
                      theme === 'dark'
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    } ${isReporting || !selectedReportKind || !isDescriptionValid ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isReporting ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Reporting...
                      </span>
                    ) : (
                      'Submit Report'
                    )}
                  </button>
                </div>
              </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default ReportButton;
