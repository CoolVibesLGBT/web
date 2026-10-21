import React, { useState, useRef, useTransition, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, User, Heart, Shield, Globe, Check } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { api, getCurrentAppDomain } from '../../services/api';
import { useTranslation } from 'react-i18next';
import { RECAPTCHA_SITE_KEY } from '../../appSettings';
import { canUseBrowserNotifications, getRuntimeRegistrationURL, openExternalUrl } from '../../platform/runtime';
import ReCAPTCHA from 'react-google-recaptcha';
import LanguageSelectorModal, { getLanguageFlagDisplay } from '../../components/ui/LanguageSelector';
import { DEFAULT_APP_NAME } from '../../constants/constants';
import { getLanguageTag, normalizeLanguage } from '@/i18n/language';
import { FormField, Sheet } from '@/components/ui/Interface';
import AuthIllustration from '@/features/auth/AuthIllustration';

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
          <div className="cv-auth-choices">
            {(['login', 'register'] as const).map(kind => (
              <button
                key={kind}
                type="button"
                onClick={() => {
                  if (kind === 'register' && externalRegistrationURL) {
                    openExternalUrl(externalRegistrationURL);
                    return;
                  }
                  setAuthMode(kind);
                }}
                aria-pressed={authMode === kind}
                className="cv-auth-choice"
              >
                <span className="cv-auth-choice-check" aria-hidden="true"><Check /></span>
                <AuthIllustration kind={kind} />
                <span className="cv-auth-choice-copy">
                  <span className="cv-auth-choice-title">{t(kind === 'login' ? 'have_account' : 'create_account')}</span>
                  <span className="cv-auth-choice-description">{t(kind === 'login' ? 'sign_in_subtitle' : 'create_account_subtitle')}</span>
                  {kind === 'register' && externalRegistrationURL && (
                    <span className="cv-auth-choice-description">{t('opens_in_browser')}</span>
                  )}
                </span>
              </button>
            ))}
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
            <p className="cv-auth-captcha-description">{t('captcha_instructions')}</p>
            <div className="flex justify-center">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={RECAPTCHA_SITE_KEY}
                size="compact"
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

  const languageButton = (
    <button type="button" onClick={() => setIsLanguageSelectorOpen(true)} aria-label={t('language')} className="cv-auth-language">
      {selectedFlag.src && !languageFlagFailed ? (
        <img src={selectedFlag.src} alt="" onError={() => setLanguageFlagFailed(true)} />
      ) : <Globe aria-hidden="true" />}
      <span>{languageDisplay}</span>
    </button>
  );

  const actions = (
    <div className="cv-auth-actions">
      {currentStep > 0 && (
        <button type="button" onClick={handleBack} aria-label={t('back')} className="cv-auth-back">
          <ArrowLeft aria-hidden="true" /><span>{t('back')}</span>
        </button>
      )}
      <button type="button" onClick={handleNext} disabled={!canProceed() || isPending} aria-busy={isPending} className="cv-auth-submit">
        {isPending ? (
          <><span className="cv-auth-spinner" aria-hidden="true" /><span>{authMode === 'login' ? t('signing_in') : t('creating_account')}</span></>
        ) : (
          <><span>{currentStep === (authMode === 'login' ? 1 : 3) ? (authMode === 'login' ? t('sign_in') : t('complete_registration')) : t('continue')}</span><ArrowRight aria-hidden="true" /></>
        )}
      </button>
    </div>
  );

  const content = (
    <div className="cv-auth-panel">
      <LanguageSelectorModal isOpen={isLanguageSelectorOpen} onClose={() => setIsLanguageSelectorOpen(false)} />
      <div className={`cv-auth-intro ${currentStep === 0 ? 'cv-auth-intro-welcome' : ''}`}>
        {currentStep > 0 && authMode && <AuthIllustration kind={authMode} placement="heading" />}
        <h2 id="auth-wizard-title">{currentStepData.title}</h2>
        <p>{currentStepData.subtitle}</p>
      </div>
      {currentStep > 0 && (
        <div className="cv-auth-progress" aria-label={t('step_progress', {current: getCurrentStepIndex() + 1, total: getTotalSteps()})}>
          {Array.from({length: getTotalSteps()}, (_, index) => <span key={index} data-complete={index <= getCurrentStepIndex()} />)}
        </div>
      )}
      <div className="cv-auth-fields" onKeyDown={event => { if (event.key === 'Enter' && (currentStep === 1 || currentStep === 2) && canProceed() && !isPending) { event.preventDefault(); handleNext(); } }}>
        {renderFormField()}
      </div>
      {error && <p role="alert" className="cv-auth-error">{error}</p>}
      {currentStep === 0 && <p className="cv-auth-note">{t('account_note')}</p>}
    </div>
  );

  if (mode === 'inline') {
    return <section className="cv-auth-inline" aria-labelledby="auth-wizard-title">
      <header className="cv-auth-inline-header"><span>{DEFAULT_APP_NAME}</span>{languageButton}</header>
      {content}
      {actions}
    </section>;
  }

  return <Sheet isOpen={isOpen} onClose={onClose} title={DEFAULT_APP_NAME} className="cv-auth-dialog" headerActions={languageButton} actions={actions}>
    {content}
  </Sheet>;
};

export default AuthWizard;
