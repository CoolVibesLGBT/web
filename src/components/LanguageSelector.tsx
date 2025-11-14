// LanguageSelectorModal.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import { X, Check } from 'lucide-react';
import { setLanguage } from '../i18n';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const LanguageSelectorModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { data, defaultLanguage, setDefaultLanguage } = useApp();
  const { theme } = useTheme();

  const handleLanguageSelect = (langCode: string) => {
    setDefaultLanguage(langCode);
    setLanguage(langCode as 'en' | 'tr');
    onClose();
  };

  const languages = data ? Object.values(data.languages) : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50"
            onClick={onClose}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ 
                type: 'spring', 
                stiffness: 300, 
                damping: 30,
                duration: 0.3
              }}
              className={`relative w-full max-w-[280px] ${
                theme === 'dark' 
                  ? 'bg-gray-900 border border-gray-800' 
                  : 'bg-white border border-gray-200'
              } rounded-lg shadow-2xl pointer-events-auto overflow-hidden`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`relative px-3 pt-3 pb-2.5 border-b ${
                theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <h2 className={`text-sm font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Language
                  </h2>
                  
                  {/* Close Button */}
                  <motion.button
                    onClick={onClose}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={`p-1 rounded-full transition-colors ${
                      theme === 'dark' 
                        ? 'hover:bg-gray-800 text-gray-400 hover:text-white' 
                        : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
              </div>

              {/* Language Grid */}
              <div className="p-3">
                <div className="grid grid-cols-3 gap-1.5">
                  {languages.map((lang, index) => {
                    const isSelected = defaultLanguage === lang.code;

                    return (
                      <motion.button
                        key={lang.code}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ 
                          delay: index * 0.02,
                          duration: 0.15
                        }}
                        onClick={() => handleLanguageSelect(lang.code)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`relative group flex flex-col items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg cursor-pointer transition-all duration-150 ${
                          isSelected
                            ? theme === 'dark'
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'bg-black text-white shadow-sm'
                            : theme === 'dark'
                            ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {/* Flag */}
                        <span className="text-xl leading-none">{lang.flag}</span>
                        
                        {/* Language Name */}
                        <span className={`text-[10px] font-medium leading-tight ${
                          isSelected ? '' : theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {lang.name}
                        </span>

                        {/* Selected Indicator */}
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ 
                              type: 'spring',
                              stiffness: 500,
                              damping: 30
                            }}
                            className={`absolute top-1 right-1 w-3 h-3 rounded-full flex items-center justify-center ${
                              theme === 'dark' ? 'bg-gray-900' : 'bg-white'
                            }`}
                          >
                            <Check className={`w-2 h-2 ${
                              theme === 'dark' ? 'text-white' : 'text-black'
                            }`} />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LanguageSelectorModal;