// LanguageSelectorModal.tsx
import React, { useState, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { X, Check, Globe } from 'lucide-react';
import { setLanguage } from '../../i18n';
import { resolvePublicAssetUrl } from '../../platform/runtime';
import { useTranslation } from 'react-i18next';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type LanguageOption = {
  code: string;
  name: string;
  flag?: string;
}

const FLAG_ASSET_BASE = '/images/countries/1x1';
const regionalIndicatorPattern = /[\u{1F1E6}-\u{1F1FF}]/u;

const LANGUAGE_FLAG_CODES: Record<string, string> = {
  ar: 'arab',
  bn: 'bd',
  en: 'us',
  fa: 'ir',
  he: 'il',
  hi: 'in',
  hk: 'hk',
  id: 'id',
  ja: 'jp',
  kp: 'kp',
  kr: 'kr',
  pt: 'br',
  th: 'th',
  tr: 'tr',
  tw: 'tw',
  zh: 'cn',
};

const normalizeLanguageCode = (code?: string) => {
  const normalized = `${code || ''}`.trim().toLowerCase().replace('_', '-').replace(/\.svg$/, '');

  if (normalized === 'zh-tw') return 'tw';
  if (normalized === 'zh-hk') return 'hk';

  return normalized.split('-')[0] || normalized;
};

export const getLanguageFlagDisplay = (flag?: string, code?: string) => {
  const value = `${flag || ''}`.trim();
  const valueIsAsset = /^(https?:|data:|blob:)/i.test(value) || value.startsWith('/') || value.includes('/');
  const valueCanRepresentCode = Boolean(value && !valueIsAsset && !regionalIndicatorPattern.test(value));
  const languageCode = normalizeLanguageCode(code || (valueCanRepresentCode ? value : ''));
  const mappedFlagCode = languageCode ? LANGUAGE_FLAG_CODES[languageCode] || languageCode : '';

  if (value && regionalIndicatorPattern.test(value) && !mappedFlagCode) {
    return { emoji: value, src: '' };
  }

  if (!value && !code) {
    return { emoji: '', src: '' };
  }

  const resolveFlagUrl = (candidate: string) => {
    if (/^(https?:|data:|blob:)/i.test(candidate)) return candidate;
    if (candidate.startsWith('/')) return resolvePublicAssetUrl(candidate);
    if (candidate.includes('/')) return resolvePublicAssetUrl(`/${candidate.replace(/^\/+/, '')}`);

    const normalized = normalizeLanguageCode(candidate);
    const filename = normalized.endsWith('.svg') ? normalized : `${normalized}.svg`;
    return resolvePublicAssetUrl(`${FLAG_ASSET_BASE}/${filename}`);
  };

  const candidate = valueIsAsset ? value : (mappedFlagCode || normalizeLanguageCode(value));

  return { emoji: '', src: candidate ? resolveFlagUrl(candidate) : '' };
};

const LanguageItem = memo(({ lang, isSelected, onClick, theme }: any) => {
  const [flagFailed, setFlagFailed] = useState(false);
  const flagDisplay = React.useMemo(() => getLanguageFlagDisplay(lang?.flag, lang?.code), [lang?.flag, lang?.code]);

  useEffect(() => {
    setFlagFailed(false);
  }, [flagDisplay.emoji, flagDisplay.src]);

  return (
    <button
      onClick={() => onClick(lang.code)}
      className={`w-full flex items-center justify-between p-3.5 px-5 transition-all outline-none ${theme === 'dark'
        ? 'hover:bg-white/[0.04] active:bg-white/[0.08]'
        : 'hover:bg-gray-50 active:bg-gray-100'
        } ${isSelected ? (theme === 'dark' ? 'bg-white/[0.02]' : 'bg-gray-50/30') : ''}`}
    >
      <div className="flex items-center gap-3.5">
        <div className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-lg overflow-hidden border ${theme === 'dark' ? 'border-gray-800' : 'border-gray-100'
          }`}>
          {flagDisplay.emoji ? (
            <span className="text-lg leading-none">{flagDisplay.emoji}</span>
          ) : flagDisplay.src && !flagFailed ? (
            <img
              src={flagDisplay.src}
              alt={lang.name}
              className="w-full h-full object-cover"
              onError={() => setFlagFailed(true)}
            />
          ) : (
            <Globe className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
          )}
        </div>
        <div className="flex flex-col">
          <span className={`text-[13px] font-bold tracking-tight ${theme === 'dark' ? 'text-white/90' : 'text-gray-900'
            }`}>
            {lang.name}
          </span>
          <span className={`text-[10px] uppercase tracking-wider opacity-40 font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
            {lang.code}
          </span>
        </div>
      </div>

      {isSelected && (
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-5 h-5 rounded-full flex items-center justify-center bg-emerald-500"
        >
          <Check className="w-3 h-3 text-white stroke-[3.5]" />
        </motion.div>
      )}
    </button>
  );
});

LanguageItem.displayName = 'LanguageItem';

const LanguageSelectorModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { data, defaultLanguage, setDefaultLanguage } = useApp();
  const { theme } = useTheme();
  const { t } = useTranslation('common');
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  const handleLanguageSelect = (langCode: string) => {
    setDefaultLanguage(langCode);
    setLanguage(langCode);
    onClose();
  };

  const languages = Object.values(data?.languages ?? {}) as LanguageOption[];

  const modal = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1200] flex items-end lg:items-center justify-center">
          {/* Backdrop - Minimalist */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Compact Content Panel */}
          <motion.div
            initial={isDesktop ? { scale: 0.98, opacity: 0 } : { y: '100%' }}
            animate={isDesktop ? { scale: 1, opacity: 1 } : { y: 0 }}
            exit={isDesktop ? { scale: 0.98, opacity: 0 } : { y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            className={`relative w-full lg:max-w-[340px] max-h-[70vh] flex flex-col overflow-hidden ${theme === 'dark'
              ? 'cv-card-surface-solid border-t lg:border border-white/10'
              : 'bg-white border-t lg:border border-gray-100'
              } rounded-t-[28px] lg:rounded-[24px] shadow-2xl pointer-events-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle - Mobile Only */}
            <div className="lg:hidden flex justify-center py-2.5">
              <div className={`w-8 h-1 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`} />
            </div>

            {/* Header - Compact */}
            <div className={`px-5 py-3.5 flex items-center justify-between border-b ${theme === 'dark' ? 'border-gray-800/40' : 'border-gray-50'
              }`}>
              <div className="flex items-center gap-2.5">
                <Globe className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                <h2 className={`text-[11px] font-black uppercase tracking-[0.15em] ${theme === 'dark' ? 'text-white/90' : 'text-gray-900'
                  }`}>
                  {t('app.language', { defaultValue: 'Language' })}
                </h2>
              </div>
              <button
                onClick={onClose}
                className={`p-1.5 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-white/5 text-gray-500' : 'hover:bg-gray-50 text-gray-400'
                  }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Language Scroll List */}
            <div className="flex-1 overflow-y-auto scrollbar-hide py-1">
              <div className={`divide-y ${theme === 'dark' ? 'divide-gray-800/30' : 'divide-gray-50'}`}>
                {languages.map((lang) => (
                  <LanguageItem
                    key={lang.code}
                    lang={lang}
                    isSelected={defaultLanguage === lang.code}
                    onClick={handleLanguageSelect}
                    theme={theme}
                  />
                ))}
              </div>
            </div>

            {/* Safe Area for Mobile */}
            <div className="h-6 safe-area-inset-bottom lg:hidden bg-transparent" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return modal;

  return createPortal(modal, document.body);
};

export default LanguageSelectorModal;
