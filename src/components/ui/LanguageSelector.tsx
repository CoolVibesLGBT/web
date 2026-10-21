// LanguageSelectorModal.tsx
import React, { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Check, Globe, Search } from 'lucide-react';
import { Sheet } from '@/components/ui/Interface';
import { setLanguage } from '../../i18n';
import { resolvePublicAssetUrl } from '../../platform/runtime';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LOCALES } from '@/seo/seoConfig';
import { normalizeLanguage } from '@/i18n/language';

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

  if (/^(zh|ko|yue)(-|$)/.test(normalized)) return normalizeLanguage(normalized);

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
        ? 'hover:bg-[var(--cv-list-hover)] active:bg-[var(--cv-list-pressed)]'
        : 'hover:bg-[var(--cv-list-hover)] active:bg-[var(--cv-list-pressed)]'
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
          <span className={`text-[0.765rem] font-bold tracking-tight ${theme === 'dark' ? 'text-white/90' : 'text-gray-900'
            }`}>
            {lang.name}
          </span>
          <span className={`text-[0.765rem] normal-case tracking-wider opacity-40 font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
            {lang.code}
          </span>
        </div>
      </div>

      {isSelected && (
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-5 h-5 rounded-full flex items-center justify-center bg-brand"
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
  const [search, setSearch] = useState('');
  useEffect(() => { if (!isOpen) setSearch(''); }, [isOpen]);

  const handleLanguageSelect = (langCode: string) => {
    const locale = normalizeLanguage(langCode);
    setDefaultLanguage(locale);
    setLanguage(locale);
    onClose();
  };

  const remoteLanguages = Object.values(data?.languages ?? {}) as LanguageOption[];
  const fallbackLanguages = SUPPORTED_LOCALES.map(({ lang }) => ({
    code: lang,
    name: ({ hk: '繁體中文（香港）', tw: '繁體中文（台灣）', kp: '조선말', kr: '한국어' } as Record<string, string>)[lang] || new Intl.DisplayNames([lang], { type: 'language' }).of(lang) || lang,
  }));
  const languages = fallbackLanguages.map(language => ({
    ...language,
    ...remoteLanguages.find(remote => normalizeLanguage(remote.code) === language.code),
    code: language.code,
  }));
  const visibleLanguages = languages.filter(({ name, code }) => `${name} ${code}`.toLocaleLowerCase().includes(search.toLocaleLowerCase().trim()));

  return <Sheet isOpen={isOpen} onClose={onClose} title={t('app.language', { defaultValue: 'Language' })}>
    <label className="cv-search mb-4">
      <Search className="h-5 w-5 shrink-0" aria-hidden="true" />
      <input type="search" value={search} onChange={event => setSearch(event.target.value)} aria-label={t('app.search', { defaultValue: 'Search' })} placeholder={t('app.search', { defaultValue: 'Search' })} />
    </label>
    <div className="cv-language-list">
      {visibleLanguages.map(lang => <LanguageItem key={lang.code} lang={lang} isSelected={defaultLanguage === lang.code} onClick={handleLanguageSelect} theme={theme} />)}
    </div>
  </Sheet>;
};

export default LanguageSelectorModal;
