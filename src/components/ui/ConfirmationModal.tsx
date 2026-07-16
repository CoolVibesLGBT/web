import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
  icon?: React.ReactNode;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  icon,
}) => {
  const { theme } = useTheme();

  const handleConfirm = () => {
    onConfirm();
    // The modal will be closed by the parent component setting isOpen to false
  };

  const confirmButtonClasses = variant === 'danger'
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : (theme === 'dark' ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800');

  const cancelButtonClasses = theme === 'dark'
    ? 'bg-gray-800 hover:bg-gray-700 text-white'
    : 'bg-gray-200 hover:bg-gray-300 text-gray-800';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="cv-modal-glass-backdrop fixed inset-0 z-[100]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`fixed inset-0 z-[101] m-auto flex max-h-[90vh] w-[90vw] max-w-md flex-col overflow-hidden rounded-2xl border ${theme === 'dark'
                ? 'cv-card-surface-solid border-white/10'
                : 'border-gray-200 bg-white'
              }`}
            style={{ height: 'fit-content' }}
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className={`mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${variant === 'danger' ? 'bg-red-500/10' : (theme === 'dark' ? 'bg-white/10' : 'bg-black/10')
                  }`}>
                  {icon || (
                    <AlertTriangle className={`h-6 w-6 ${variant === 'danger' ? 'text-red-500' : (theme === 'dark' ? 'text-white' : 'text-black')}`} />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
                  <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{message}</p>
                </div>
              </div>
            </div>
            <div className={`flex justify-end gap-3 rounded-b-2xl px-6 py-4 ${theme === 'dark' ? 'cv-card-surface-muted' : 'bg-gray-50'
              }`}>
              <button
                type="button"
                onClick={onClose}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${cancelButtonClasses}`}
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${confirmButtonClasses}`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationModal;
