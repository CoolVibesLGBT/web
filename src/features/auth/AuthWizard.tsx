import React, { useState, useRef, useTransition, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, User, Heart, Shield, Globe, Sparkles } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { api, getCurrentAppDomain } from '../../services/api';
import { useTranslation } from 'react-i18next';
import { RECAPTCHA_SITE_KEY } from '../../appSettings';
import { canUseBrowserNotifications, getRuntimeRegistrationURL, openExternalUrl } from '../../platform/runtime';
import ReCAPTCHA from 'react-google-recaptcha';
import LanguageSelectorModal, { getLanguageFlagDisplay } from '../../components/ui/LanguageSelector';
import { DEFAULT_APP_MOTTO, DEFAULT_APP_NAME } from '../../constants/constants';
import { getLanguageTag, normalizeLanguage } from '@/i18n/language';
import { FormField, Sheet } from '@/components/ui/Interface';

interface AuthWizardProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'modal' | 'inline';
}

const AuthWizard: React.FC<AuthWizardProps> = ({ isOpen, onClose, mode = 'modal' }): React.ReactElement | null => {
  const { theme } = useTheme();
  const { login } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const { data, defaultLanguage } = useApp();
  const { t, i18n } = useTranslation('auth');
  const [isLanguageSelectorOpen, setIsLanguageSelectorOpen] = useState(false);
  const [languageFlagFailed, setLanguageFlagFailed] = useState(false);
  const externalRegistrationURL = getRuntimeRegistrationURL();

  useEffect(() => {
    if (!isOpen) return;
    setAuthMode(null);
    setCurrentStep(0);
    setError('');
    setRecaptchaToken(null);
  }, [isOpen]);

  const languageDisplay = React.useMemo(() => {
    const lang = i18n?.language || 'en';
    const base = normalizeLanguage(lang);
    return base.toUpperCase();
  }, [i18n?.language]);

  const languagesByCode = data?.languages;
  const selectedLanguage = React.useMemo(() => {
    const languages = languagesByCode || {};
    const activeLanguage = defaultLanguage || i18n?.language || 'en';
    const activeBase = activeLanguage.split('-')[0] || activeLanguage;
    return languages[activeLanguage] ||
      languages[activeBase] ||
      Object.values(languages).find((lang: any) => lang?.code === activeLanguage || lang?.code === activeBase);
  }, [languagesByCode, defaultLanguage, i18n?.language]);

  const selectedFlag = React.useMemo(
    () => getLanguageFlagDisplay((selectedLanguage as any)?.flag, (selectedLanguage as any)?.code || defaultLanguage || i18n?.language),
    [selectedLanguage, defaultLanguage, i18n?.language]
  );

  useEffect(() => {
    setLanguageFlagFailed(false);
  }, [selectedFlag.emoji, selectedFlag.src]);

  // Track notification permission
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null);


  const requestNotificationPermission = async () => {
    if (!canUseBrowserNotifications()) {
      return;
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        const perm = await Notification.requestPermission();
        setNotificationPermission(perm);
        console.log('Permission result:', perm);
      } else {
        setNotificationPermission(Notification.permission);
        console.log('Existing permission:', Notification.permission);
      }
    }
  };


  const [formData, setFormData] = useState<{
    name: string;
    nickname: string;
    password: string;
    confirmPassword: string;
    birthDate: string;
    day: string;
    month: string;
    year: string;
    referralCode: string;
  }>({
    name: '',
    nickname: '',
    password: '',
    confirmPassword: '',
    birthDate: '',
    day: '',
    month: '',
    year: '',
    referralCode: ''
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedReferral = localStorage.getItem('referralCode') || '';
    if (savedReferral) {
      setFormData((prev) => ({
        ...prev,
        referralCode: savedReferral
      }));
    }
  }, []);



  const steps = [
    {
      id: 'auth-mode',
      title: t('welcome_title', { appName: DEFAULT_APP_NAME }),
      subtitle: t('welcome_subtitle'),
      icon: Heart,
      field: 'authMode',
      placeholder: '',
      type: 'auth-mode'
    },
    {
      id: 'login-form',
      title: t('sign_in'),
      subtitle: t('sign_in_subtitle'),
      icon: User,
      field: 'loginForm',
      placeholder: '',
      type: 'login-form'
    },
    {
      id: 'nickname',
      title: t('create_account'),
      subtitle: t('register_subtitle'),
      icon: User,
      field: 'nickname',
      placeholder: 'nickname',
      type: 'nickname'
    },
    {
      id: 'captcha',
      title: t('verify_human', { defaultValue: 'Verify you are human' }),
      subtitle: t('verify_human_subtitle', { defaultValue: 'Please complete the security check' }),
      icon: Shield,
      field: 'captcha',
      placeholder: '',
      type: 'captcha'
    },

  ];

  const handleNext = () => {
    if (currentStep === 0) {
      if (authMode === 'login') {
        setCurrentStep(1); // login-form
      } else {
        setCurrentStep(2); // nickname (register için)
      }
    } else if (currentStep === 1 && authMode === 'login') {
      setError('');
      const loginData: any = {
        nickname: formData.nickname,
        password: formData.password
      };

      startTransition(async () => {
        try {
          const response = await api.handleLogin(loginData);
          login(response.token, response.user);
          onClose();
        } catch (err: any) {
          const message = err.response?.data?.message ?? err.response?.message;
          setError(typeof message === 'string' ? message : t('login_error'));
        }
      });
    } else if (currentStep === 2 && authMode === 'register') {
      setCurrentStep(3); // captcha step
    } else if (currentStep === 3 && authMode === 'register') {
      if (!recaptchaToken) {
        setError(t('captcha_required', { defaultValue: 'Please complete the reCAPTCHA verification' }));
        return;
      }

      const user = {
        name: formData.nickname,
        nickname: formData.nickname,
        password: formData.password,
        referralCode: formData.referralCode,
        recaptchaToken: recaptchaToken,
        domain: getCurrentAppDomain(),
      };

      setError('');
      startTransition(async () => {
        try {
          const response = await api.handleRegister(user);
          login(response.token, response.user);
          onClose();
        } catch (err: any) {
          const message = err.response?.data?.message ?? err.response?.message;
          setError(typeof message === 'string' ? message : t('register_error'));
          // Reset captcha on error
          if (recaptchaRef.current) {
            recaptchaRef.current.reset();
          }
          setRecaptchaToken(null);
        }
      });
    }
  };

  const handleBack = () => {
    if (currentStep === 0) {
      // If on auth-mode step, close wizard
      onClose();
    } else {
      // Clear error when going back
      setError('');

      // Handle register flow
      if (authMode === 'register' && currentStep === 2) {
        setCurrentStep(0); // Go back to auth-mode
      } else if (authMode === 'register' && currentStep === 3) {
        setCurrentStep(2); // Go back to nickname
        // Reset captcha when going back
        if (recaptchaRef.current) {
          recaptchaRef.current.reset();
        }
        setRecaptchaToken(null);
      } else if (authMode === 'login' && currentStep === 1) {
        setCurrentStep(0); // Go back to auth-mode
      } else {
        // Otherwise go to previous step
        setCurrentStep(currentStep - 1);
      }
    }
  };

  const updateFormData = <T extends keyof typeof formData>(field: T, value: typeof formData[T]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Only letters, digits, and underscores are allowed in usernames
  const NICKNAME_REGEX = /^[a-z0-9_]*$/;

  const getNicknameError = (nickname: string): string => {
    if (nickname.length === 0) return '';
    if (nickname.length < 3) return t('nickname_too_short', { defaultValue: 'Username must be at least 3 characters.' });
    if (!NICKNAME_REGEX.test(nickname)) return t('nickname_invalid_chars', { defaultValue: 'Username can only contain letters, numbers, and underscores (_).' });
    return '';
  };

  const handleNicknameChange = (nickname: string) => {
    // Strip whitespace and convert to lowercase, but keep special chars so the user sees the error
    const normalized = nickname.toLowerCase().replace(/\s+/g, '');
    updateFormData('nickname', normalized);
  };

  const currentStepData = steps[currentStep];

  // Progress bar mapping
  const getTotalSteps = () => {
    if (authMode === 'login') {
      return 2; // auth-mode, login-form
    } else if (authMode === 'register') {
      return 3; // auth-mode, nickname, captcha
    }
    return 3;
  };

  const getCurrentStepIndex = () => {
    if (authMode === 'login') {
      if (currentStep === 0) return 0; // auth-mode
      if (currentStep === 1) return 1; // login-form
    } else if (authMode === 'register') {
      if (currentStep === 0) return 0; // auth-mode
      if (currentStep === 2) return 1; // nickname
      if (currentStep === 3) return 2; // captcha
    }
    return currentStep;
  };

  const canProceed = () => {
    switch (currentStepData.field) {
      case 'authMode':
        return authMode !== null;
      case 'loginForm':
        return formData.nickname.trim() !== '' && formData.password.trim() !== '';
      case 'nickname': {
        const nicknameValid =
          formData.nickname.trim().length >= 3 &&
          NICKNAME_REGEX.test(formData.nickname.trim());
        return nicknameValid &&
          formData.password.trim() !== '' &&
          formData.confirmPassword.trim() !== '' &&
          formData.password === formData.confirmPassword;
      }
      case 'captcha':
        return !!recaptchaToken;
      default:
        return false;
    }
  };

  const inputClass = `w-full rounded-full border px-5 py-4 text-[0.882rem] font-semibold outline-none transition-all duration-300 ${
    theme === 'dark'
      ? 'border-white/5 bg-white/[0.05] text-white placeholder:text-zinc-600 focus:border-[var(--color-brand)] focus:bg-white/[0.08] focus:ring-4 focus:ring-[var(--color-brand)]/10'
      : 'border-slate-200/60 bg-slate-50/70 text-slate-950 placeholder:text-slate-400 focus:border-[var(--color-brand)] focus:bg-white focus:ring-4 focus:ring-[var(--color-brand)]/10'
  }`;

  const renderFormField = () => {
    switch (currentStepData.type) {
      case 'auth-mode':
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <motion.button
                onClick={() => setAuthMode('login')}
                aria-pressed={authMode === 'login'}
                className={`group w-full rounded-[26px] border p-4 text-start transition-all duration-500 ${authMode === 'login'
                  ? 'border-[var(--color-brand)] bg-[var(--color-brand)] text-white shadow-2xl shadow-[var(--color-brand)]/25'
                  : theme === 'dark'
                    ? 'border-white/5 bg-white/[0.04] text-white hover:border-[var(--color-brand)]/30 hover:bg-white/[0.07]'
                    : 'border-slate-100 bg-slate-50/80 text-slate-900 hover:border-[var(--color-brand)]/30 hover:bg-white'
                  }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-2xl transition-all ${authMode === 'login' ? 'bg-white/15 text-white' : 'bg-[var(--color-brand)]/10 text-[var(--color-brand)] group-hover:bg-[var(--color-brand)] group-hover:text-white'}`}>
                  <User className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-sm font-semibold normal-case tracking-tight sm:text-base">{t('have_account')}</h3>
                <p className="text-xs font-medium leading-relaxed opacity-75">{t('sign_in_subtitle')}</p>
              </motion.button>

              <motion.button
                onClick={() => {
                  if (externalRegistrationURL) {
                    openExternalUrl(externalRegistrationURL);
                    return;
                  }
                  setAuthMode('register');
                }}
                aria-pressed={authMode === 'register'}
                className={`group w-full rounded-[26px] border p-4 text-start transition-all duration-500 ${authMode === 'register'
                  ? 'border-[var(--color-brand)] bg-[var(--color-brand)] text-white shadow-2xl shadow-[var(--color-brand)]/25'
                  : theme === 'dark'
                    ? 'border-white/5 bg-white/[0.04] text-white hover:border-[var(--color-brand)]/30 hover:bg-white/[0.07]'
                    : 'border-slate-100 bg-slate-50/80 text-slate-900 hover:border-[var(--color-brand)]/30 hover:bg-white'
                  }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-2xl transition-all ${authMode === 'register' ? 'bg-white/15 text-white' : 'bg-[var(--color-brand)]/10 text-[var(--color-brand)] group-hover:bg-[var(--color-brand)] group-hover:text-white'}`}>
                  <Heart className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-sm font-semibold normal-case tracking-tight sm:text-base">{t('create_account')}</h3>
                <p className="text-xs font-medium leading-relaxed opacity-75">{t('create_account_subtitle')}</p>
                {externalRegistrationURL && (
                  <p className="mt-2 text-[0.765rem] font-semibold normal-case tracking-normal opacity-70">
                    {t('opens_in_browser', { defaultValue: 'Opens in your browser' })}
                  </p>
                )}
              </motion.button>
            </div>
          </div>
        );

      case 'login-form':
        return (
          <div className="space-y-5">
            <FormField label={t('nickname')}>
              <input type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder={t('placeholder_nickname')} value={formData.nickname} onChange={event => handleNicknameChange(event.target.value)} className={inputClass} />
            </FormField>
            <FormField label={t('password')}>
              <input type="password" autoComplete="current-password" placeholder={t('placeholder_password')} value={formData.password} onChange={event => updateFormData('password', event.target.value)} className={inputClass} />
            </FormField>
          </div>
        );
      case 'nickname':
        return (
          <div className="space-y-5">
            <FormField label={t('nickname')} error={getNicknameError(formData.nickname)} hint={t('nickname_hint')}>
              <input type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder={t('placeholder_nickname')} value={formData.nickname} onChange={event => handleNicknameChange(event.target.value)} className={inputClass} />
            </FormField>
            <FormField label={t('password')}>
              <input type="password" autoComplete="new-password" placeholder={t('placeholder_password')} value={formData.password} onChange={event => updateFormData('password', event.target.value)} className={inputClass} />
            </FormField>
            <FormField label={t('confirm_password')} error={formData.confirmPassword && formData.password !== formData.confirmPassword ? t('passwords_not_match') : undefined}>
              <input type="password" autoComplete="new-password" placeholder={t('placeholder_confirm_password')} value={formData.confirmPassword} onChange={event => updateFormData('confirmPassword', event.target.value)} className={inputClass} />
            </FormField>
            <FormField label={t('referral_code')} hint={t('referral_hint')}>
              <input type="text" placeholder={t('placeholder_referral_code')} value={formData.referralCode} onChange={event => updateFormData('referralCode', event.target.value)} className={inputClass} />
            </FormField>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('current_status')}: {notificationPermission ?? 'unknown'}</p>
            </div>
            <motion.button
              onClick={() => {
                requestNotificationPermission()
              }}
              className={`w-full px-6 py-4 rounded-2xl font-semibold text-lg transition-all duration-200 ${theme === 'dark'
                ? 'bg-yellow-500 text-black hover:bg-yellow-400'
                : 'bg-yellow-500 text-black hover:bg-yellow-600'
                }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {t('enable_notifications')}
            </motion.button>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>{t('change_later')}</p>
          </div>
        );
      case 'captcha':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-indigo-900/30' : 'bg-indigo-100'}`}>
                <Shield className={`w-8 h-8 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`} />
              </div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {t('captcha_instructions', { defaultValue: 'Please verify that you are not a robot' })}
              </p>
            </div>
            <div className="flex justify-center">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={RECAPTCHA_SITE_KEY}
                hl={getLanguageTag(i18n.language)}
                onChange={(token) => {
                  setRecaptchaToken(token);
                  setError(''); // Clear error when captcha is completed
                }}
                onExpired={() => {
                  setRecaptchaToken(null);
                }}
                onErrored={() => {
                  setRecaptchaToken(null);
                  setError(t('captcha_error', { defaultValue: 'reCAPTCHA verification failed. Please try again.' }));
                }}
                theme={theme === 'dark' ? 'dark' : 'light'}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  const content = (
    <>
      <div className="flex items-center justify-between px-5 pb-2 pt-4 sm:px-6 sm:pt-5 cv-auth-brand">
        <div className="flex items-center gap-3">
          <div className="sky-glow flex h-10 w-10 items-center justify-center rounded-full text-white shadow-lg">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className={`text-[0.765rem] font-semibold normal-case leading-none tracking-normal ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>
              {DEFAULT_APP_NAME}
            </span>
            <span className="mt-1 text-[0.765rem] font-bold normal-case tracking-tighter text-[var(--color-brand)]">
              {DEFAULT_APP_MOTTO}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLanguageSelectorOpen(true)}
            aria-label={t('language')}
            className={`elite-btn h-10 px-3 text-[0.765rem] font-bold normal-case tracking-wider ${theme === 'dark' ? 'bg-white/[0.05] text-white/60 hover:bg-white/10 hover:text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-950'}`}
          >
            {selectedFlag.emoji ? (
              <span className="flex h-4 w-4 shrink-0 items-center justify-center text-sm leading-none">
                {selectedFlag.emoji}
              </span>
            ) : selectedFlag.src && !languageFlagFailed ? (
              <span className={`flex h-4 w-4 shrink-0 overflow-hidden rounded-full border ${theme === 'dark' ? 'border-white/10' : 'border-black/10'}`}>
                <img
                  src={selectedFlag.src}
                  alt={(selectedLanguage as any)?.name || languageDisplay}
                  className="h-full w-full object-cover"
                  onError={() => setLanguageFlagFailed(true)}
                />
              </span>
            ) : (
              <Globe className="h-4 w-4" />
            )}
            <span className="ml-1.5">{languageDisplay}</span>
          </button>
        </div>
      </div>

      <div className="px-5 sm:px-6">
        <p className="sr-only" aria-live="polite">{t('step_progress', { current: getCurrentStepIndex() + 1, total: getTotalSteps() })}</p>
        <div className="flex space-x-1.5">
            {Array.from({ length: getTotalSteps() }, (_, index) => (
              <div
                key={index}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${index <= getCurrentStepIndex()
                  ? 'bg-[var(--color-brand)] shadow-sm shadow-[var(--color-brand)]/30'
                  : theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'
                  }`}
              />
            ))}
        </div>
      </div>

      <LanguageSelectorModal 
        isOpen={isLanguageSelectorOpen} 
        onClose={() => setIsLanguageSelectorOpen(false)} 
      />

      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="px-5 py-5 text-start sm:px-6"
      >
        <div className="mb-4 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] bg-[var(--color-brand)]/10 text-[var(--color-brand)] ring-1 ring-[var(--color-brand)]/10">
            <currentStepData.icon className="h-6 w-6" />
          </div>
          <div>
            <p className="mb-1 text-[0.765rem] font-semibold normal-case tracking-normal text-[var(--color-brand)]">
              {t('access_label')}
            </p>
            <h2 id="auth-wizard-title" className={`text-2xl font-semibold normal-case leading-none tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>
              {currentStepData.title}
            </h2>
          </div>
        </div>
        <p className={`max-w-md text-sm font-medium leading-relaxed ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'}`}>
          {currentStepData.subtitle}
        </p>
      </motion.div>

      <div className="px-5 pb-5 sm:px-6" onKeyDown={event => { if (event.key === 'Enter' && (currentStep === 1 || currentStep === 2) && canProceed() && !isPending) { event.preventDefault(); handleNext(); } }}>
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-5"
        >
          {renderFormField()}
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mb-6 rounded-[22px] border p-4 ${theme === 'dark'
              ? 'border-red-500/20 bg-red-500/10 text-red-300'
              : 'border-red-200 bg-red-50 text-red-700'
              }`}
          >
            <p className="text-sm font-semibold">{error}</p>
          </motion.div>
        )}

        <div className="flex flex-row flex-nowrap items-stretch gap-3">
          {currentStep > 0 ? (
            <motion.button
              onClick={handleBack}
              aria-label={t('back')}
              className={`flex shrink-0 items-center justify-center rounded-full border px-5 py-3.5 text-sm font-semibold normal-case tracking-widest transition-all duration-300 ${theme === 'dark'
                ? 'border-white/5 bg-white/[0.05] text-zinc-400 hover:bg-white/10 hover:text-white'
                : 'border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-950'
                }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">{t('back')}</span>
            </motion.button>
          ) : mode === 'modal' ? (
            <motion.button
              onClick={onClose}
              aria-label={t('close')}
              className={`flex shrink-0 items-center justify-center rounded-full border px-5 py-3.5 text-sm font-semibold normal-case tracking-widest transition-all duration-300 ${theme === 'dark'
                ? 'border-white/5 bg-white/[0.05] text-zinc-400 hover:bg-white/10 hover:text-white'
                : 'border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-950'
                }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">{t('back')}</span>
            </motion.button>
          ) : (
            null
          )}

          <motion.button
            onClick={handleNext}
            disabled={!canProceed() || isPending}
            className={`cv-auth-submit flex min-w-0 flex-1 items-center justify-center rounded-full px-5 py-3.5 text-sm font-semibold normal-case tracking-widest transition-all duration-300 ${canProceed() && !isPending
              ? 'bg-[var(--color-brand)] text-white shadow-2xl shadow-[var(--color-brand)]/25 hover:bg-[var(--color-brand-hovered)]'
              : theme === 'dark'
                ? 'cursor-not-allowed bg-white/[0.05] text-zinc-700'
                : 'cursor-not-allowed bg-slate-200 text-slate-400'
              }`}
            whileHover={canProceed() && !isPending ? { scale: 1.02 } : {}}
            whileTap={canProceed() && !isPending ? { scale: 0.98 } : {}}
          >
            {isPending ? (
              <div className="flex items-center justify-center">
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span>{authMode === 'login' ? t('signing_in') : t('creating_account')}</span>
              </div>
            ) : (
              <>
                <span className="whitespace-nowrap">{currentStep === (authMode === 'login' ? 1 : 3) ? (authMode === 'login' ? t('sign_in') : t('complete_registration')) : t('continue')}</span>
                <ArrowRight className="ml-2 h-4 w-4 shrink-0" />
              </>
            )}
          </motion.button>
        </div>
      </div>
    </>
  );

  if (mode === 'inline') {
    return (
      <div className={`w-full overflow-hidden rounded-[20px] border shadow-[0_28px_90px_rgba(15,23,42,0.16)] backdrop-blur-2xl ${
        theme === 'dark'
          ? 'border-white/10 bg-zinc-950/82 shadow-black/35'
          : 'border-white/80 bg-white/88'
      }`}>
        {content}
      </div>
    );
  }

  return <Sheet isOpen={isOpen} onClose={onClose} title={DEFAULT_APP_NAME}>
    <div className="cv-auth-panel">{content}</div>
  </Sheet>;
};

export default AuthWizard;
