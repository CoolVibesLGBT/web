import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, User, Calendar, Heart, X, ChevronLeft, ChevronRight, ChevronDown, LocateFixed, MapPin, Bell, Shield } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useApp } from '../contexts/AppContext';
import { api } from '../services/api.tsx';
import { useTranslation } from 'react-i18next';
import { applicationName, RECAPTCHA_SITE_KEY } from '../appSettings';
import ReCAPTCHA from 'react-google-recaptcha';

interface AuthWizardProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'modal' | 'inline';
}

const AuthWizard: React.FC<AuthWizardProps> = ({ isOpen, onClose, mode = 'modal' }): JSX.Element | null => {
  const { theme } = useTheme();
  const { login } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const { data: _data, defaultLanguage: _defaultLanguage } = useApp();
  const { t } = useTranslation('common');

  // Track notification permission
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null);
  const requestNotificationPermission = async () => {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const perm = await Notification.requestPermission();
        setNotificationPermission(perm);
      }
    } catch (_) {
      // ignore unsupported
    }
  };

  // Location status for UI
  const [locationStatus, setLocationStatus] = useState<string>('');

  const [formData, setFormData] = useState<{
    name: string;
    nickname: string;
    password: string;
    confirmPassword: string;
    birthDate: string;
    day: string;
    month: string;
    year: string;
    location: {
      country_code: string;
      country_name: string;
      city: string;
      region?: string;
      lat: number;
      lng: number;
      timezone?: string;
      display: string;
    } | null;
  }>({
    name: '',
    nickname: '',
    password: '',
    confirmPassword: '',
    birthDate: '',
    day: '',
    month: '',
    year: '',
    location: null
  });

  // Date picker state
  const [selectedDate, setSelectedDate] = useState({
    day: 0,
    month: 0,
    year: 0
  });

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear() - 25);
  const [viewMode, setViewMode] = useState<'day' | 'month' | 'year'>('day');
  const [decadeStart, setDecadeStart] = useState(Math.floor((new Date().getFullYear() - 25) / 20) * 20);
  const months = [
    t('months.january'),
    t('months.february'),
    t('months.march'),
    t('months.april'),
    t('months.may'),
    t('months.june'),
    t('months.july'),
    t('months.august'),
    t('months.september'),
    t('months.october'),
    t('months.november'),
    t('months.december')
  ];

  const steps = [
    {
      id: 'auth-mode',
      title: t('auth.welcome_title', { appName: applicationName }),
      subtitle: t('auth.welcome_subtitle'),
      icon: Heart,
      field: 'authMode',
      placeholder: '',
      type: 'auth-mode'
    },
    {
      id: 'location',
      title: t('auth.enable_location_title'),
      subtitle: t('auth.enable_location_subtitle'),
      icon: MapPin,
      field: 'location',
      placeholder: '',
      type: 'location'
    },
    {
      id: 'notifications',
      title: t('auth.enable_notifications_title'),
      subtitle: t('auth.enable_notifications_subtitle'),
      icon: Bell,
      field: 'notifications',
      placeholder: '',
      type: 'notifications'
    },
    {
      id: 'login-form',
      title: t('auth.sign_in'),
      subtitle: t('auth.sign_in_subtitle'),
      icon: User,
      field: 'loginForm',
      placeholder: '',
      type: 'login-form'
    },
    {
      id: 'birthdate',
      title: t('auth.birthdate_title', { defaultValue: 'When were you born?' }),
      subtitle: t('auth.birthdate_subtitle', { defaultValue: 'This helps us create better matches' }),
      icon: Calendar,
      field: 'birthDate',
      placeholder: '',
      type: 'date-picker'
    },
    {
      id: 'nickname',
      title: t('auth.create_account'),
      subtitle: t('auth.welcome_subtitle'),
      icon: User,
      field: 'nickname',
      placeholder: 'nickname',
      type: 'text'
    },
    {
      id: 'captcha',
      title: t('auth.verify_human', { defaultValue: 'Verify you are human' }),
      subtitle: t('auth.verify_human_subtitle', { defaultValue: 'Please complete the security check' }),
      icon: Shield,
      field: 'captcha',
      placeholder: '',
      type: 'captcha'
    },
    
  ];

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handleDateSelect = (day: number) => {
    setSelectedDate({ day, month: currentMonth + 1, year: currentYear });
    updateFormData('day', day.toString());
    updateFormData('month', (currentMonth + 1).toString());
    updateFormData('year', currentYear.toString());
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days: React.ReactNode[] = [];
    const today = new Date();
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-10 h-10 sm:w-10 sm:h-10" />);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = selectedDate.day === day &&
        selectedDate.month === currentMonth + 1 &&
        selectedDate.year === currentYear;
      const isToday =
        day === today.getDate() &&
        currentMonth === today.getMonth() &&
        currentYear === today.getFullYear();
      days.push(
        <motion.button
          key={day}
          onClick={() => handleDateSelect(day)}
          className={`relative w-10 h-10 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-sm font-medium transition-all
            ${isSelected
              ? (theme === 'dark'
                ? 'bg-white text-gray-900 ring-2 sm:ring-2 ring-black/50'
                : 'bg-gray-900 text-white ring-2 sm:ring-2 ring-black/50')
              : (theme === 'dark'
                ? 'text-white hover:bg-gray-700'
                : 'text-gray-900 hover:bg-gray-100')
            }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="relative justify-center flex flex-col items-center w-full h-full">
            <span>{day}</span>
            {isToday && (
              <span
                className={`mt-0.5 w-1.5 h-1.5 rounded-full ${theme === 'dark' ? 'bg-black/80' : 'bg-black/80'
                  }`}
              />
            )}
          </span>
        </motion.button>
      );
    }
    return days;
  };

  const handleNext = () => {
    if (currentStep === 0) {
      setCurrentStep(1);
    } else if (currentStep === 1) {
      setCurrentStep(2); // notifications
    } else if (currentStep === 2) {
      if (authMode === 'login') {
        setCurrentStep(3); // login-form
      } else {
        setCurrentStep(4); // birthdate (doğum tarihi önce)
      }
    } else if (currentStep === 3 && authMode === 'login') {
      setIsLoading(true);
      setError('');
      const loginData: any = {
        nickname: formData.nickname,
        password: formData.password
      };
      
      // Add location if available
      if (formData.location) {
        loginData.location = formData.location;
      }
      
      api.handleLogin(loginData)
        .then(response => {
          login(response.token, response.user);
          onClose();
        })
        .catch(err => {
          setError(err.response?.data?.message || 'Login failed. Please try again.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (currentStep === 4 && authMode === 'register') {
      setCurrentStep(5); // nickname (hesap oluşturma formu sonra)
    } else if (currentStep === 5 && authMode === 'register') {
      setCurrentStep(6); // captcha step
    } else if (currentStep === 6 && authMode === 'register') {
      if (!recaptchaToken) {
        setError(t('auth.captcha_required', { defaultValue: 'Please complete the reCAPTCHA verification' }));
        return;
      }

      const birthDate = selectedDate.day && selectedDate.month && selectedDate.year
        ? `${selectedDate.year}-${selectedDate.month.toString().padStart(2, '0')}-${selectedDate.day.toString().padStart(2, '0')}`
        : '';

      const user = {
        name: formData.nickname,
        nickname: formData.nickname,
        password: formData.password,
        birthDate: birthDate,
        location: formData.location,
        recaptchaToken: recaptchaToken
      };

      setIsLoading(true);
      setError('');
      api.handleRegister(user)
        .then(response => {
          login(response.token, response.user);
          onClose();
        })
        .catch(err => {
          setError(err.response?.data?.message || 'Registration failed. Please try again.');
          // Reset captcha on error
          if (recaptchaRef.current) {
            recaptchaRef.current.reset();
          }
          setRecaptchaToken(null);
        })
        .finally(() => {
          setIsLoading(false);
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
      
      // Handle register flow: step 4 (birthdate) should go back to step 2 (notifications), not step 3 (login-form)
      // Step 5 (nickname) should go back to step 4 (birthdate)
      // Step 6 (captcha) should go back to step 5 (nickname)
      if (authMode === 'register' && currentStep === 4) {
        setCurrentStep(2); // Go back to notifications
      } else if (authMode === 'register' && currentStep === 5) {
        setCurrentStep(4); // Go back to birthdate
      } else if (authMode === 'register' && currentStep === 6) {
        setCurrentStep(5); // Go back to nickname
        // Reset captcha when going back
        if (recaptchaRef.current) {
          recaptchaRef.current.reset();
        }
        setRecaptchaToken(null);
      } else if (authMode === 'login' && currentStep === 3) {
        setCurrentStep(2); // Go back to notifications
      } else {
        // Otherwise go to previous step
      setCurrentStep(currentStep - 1);
      }
    }
  };

  const updateFormData = <T extends keyof typeof formData>(field: T, value: typeof formData[T]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const currentStepData = steps[currentStep];

  // Progress bar mapping
  const getTotalSteps = () => {
    if (authMode === 'login') {
      return 4; // auth-mode, location, notifications, login-form
    } else if (authMode === 'register') {
      return 6; // auth-mode, location, notifications, birthdate, nickname, captcha
    }
    return steps.length;
  };

  const getCurrentStepIndex = () => {
    if (authMode === 'login') {
      if (currentStep === 0) return 0; // auth-mode
      if (currentStep === 1) return 1; // location
      if (currentStep === 2) return 2; // notifications
      if (currentStep === 3) return 3; // login-form
    } else if (authMode === 'register') {
      if (currentStep === 0) return 0; // auth-mode
      if (currentStep === 1) return 1; // location
      if (currentStep === 2) return 2; // notifications
      if (currentStep === 4) return 3; // birthdate
      if (currentStep === 5) return 4; // nickname
      if (currentStep === 6) return 5; // captcha
    }
    return currentStep;
  };

  const canProceed = () => {
    switch (currentStepData.field) {
      case 'authMode':
        return authMode !== null;
      case 'location':
        return !!formData.location;
      case 'notifications':
        return true; // optional
      case 'loginForm':
        return formData.nickname.trim() !== '' && formData.password.trim() !== '';
      case 'nickname':
        return formData.nickname.trim() !== '' &&
          formData.password.trim() !== '' &&
          formData.confirmPassword.trim() !== '' &&
          formData.password === formData.confirmPassword;
      case 'birthDate':
        return selectedDate.day && selectedDate.month && selectedDate.year;
      case 'captcha':
        return !!recaptchaToken;
      default:
        return false;
    }
  };

  const renderFormField = () => {
    switch (currentStepData.type) {
      case 'auth-mode':
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <motion.button
                onClick={() => setAuthMode('login')}
                className={`p-4 sm:p-6 rounded-2xl border-2 text-center transition-all w-full ${authMode === 'login'
                    ? theme === 'dark'
                      ? 'bg-white text-gray-900 border-white shadow-md'
                      : 'bg-gray-900 text-white border-gray-900 shadow-md'
                    : theme === 'dark'
                      ? 'bg-gray-800 border-gray-700 text-white hover:border-gray-600'
                      : 'bg-gray-50 border-gray-200 text-gray-900 hover:border-gray-300'
                  }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <User className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 sm:mb-3" />
                <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">{t('auth.have_account')}</h3>
                <p className="text-xs sm:text-sm opacity-80">{t('auth.sign_in_subtitle')}</p>
              </motion.button>

              <motion.button
                onClick={() => setAuthMode('register')}
                className={`p-4 sm:p-6 rounded-2xl border-2 text-center transition-all w-full ${authMode === 'register'
                    ? theme === 'dark'
                      ? 'bg-white text-gray-900 border-white shadow-md'
                      : 'bg-gray-900 text-white border-gray-900 shadow-md'
                    : theme === 'dark'
                      ? 'bg-gray-800 border-gray-700 text-white hover:border-gray-600'
                      : 'bg-gray-50 border-gray-200 text-gray-900 hover:border-gray-300'
                  }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Heart className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 sm:mb-3" />
                <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">{t('auth.create_account')}</h3>
                <p className="text-xs sm:text-sm opacity-80">{t('auth.create_account_subtitle')}</p>
              </motion.button>
            </div>
          </div>
        );

      case 'login-form':
        return (
          <div className="space-y-2 sm:space-y-4">
            <div>
              <label className={`block text-sm sm:text-sm font-medium mb-2 sm:mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('auth.nickname')}
              </label>
              <input
                type="text"
                placeholder={t('auth.placeholder_nickname')}
                value={formData.nickname}
                onChange={(e) => updateFormData('nickname', e.target.value)}
                className={`w-full px-4 sm:px-4 py-4 sm:py-4 rounded-xl sm:rounded-2xl border-2 focus:outline-none focus:border-opacity-100 transition-all text-base sm:text-base ${theme === 'dark'
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-white'
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-gray-900'
                  }`}
                autoFocus
              />
            </div>
            <div>
              <label className={`block text-sm sm:text-sm font-medium mb-2 sm:mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('auth.password')}
              </label>
              <input
                type="password"
                placeholder={t('auth.placeholder_password')}
                value={formData.password}
                onChange={(e) => updateFormData('password', e.target.value)}
                className={`w-full px-4 sm:px-4 py-4 sm:py-4 rounded-xl sm:rounded-2xl border-2 focus:outline-none focus:border-opacity-100 transition-all text-base sm:text-base ${theme === 'dark'
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-white'
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-gray-900'
                  }`}
              />
            </div>
          </div>
        );

      case 'text':
        return (
          <div className="space-y-2 sm:space-y-4">
            <div>
              <label className={`block text-sm sm:text-sm font-medium mb-2 sm:mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('auth.nickname')}
              </label>
              <input
                type="text"
                placeholder={t('auth.placeholder_nickname')}
                value={formData.nickname}
                onChange={(e) => updateFormData('nickname', e.target.value)}
                className={`w-full px-4 sm:px-4 py-4 sm:py-4 rounded-xl sm:rounded-2xl border-2 focus:outline-none focus:border-opacity-100 transition-all text-base sm:text-base ${theme === 'dark'
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-white'
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-gray-900'
                  }`}
                autoFocus
              />
            </div>
            <div>
              <label className={`block text-sm sm:text-sm font-medium mb-2 sm:mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('auth.password')}
              </label>
              <input
                type="password"
                placeholder={t('auth.placeholder_password')}
                value={formData.password}
                onChange={(e) => updateFormData('password', e.target.value)}
                className={`w-full px-4 sm:px-4 py-4 sm:py-4 rounded-xl sm:rounded-2xl border-2 focus:outline-none focus:border-opacity-100 transition-all text-base sm:text-base ${theme === 'dark'
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-white'
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-gray-900'
                  }`}
              />
            </div>
            <div>
              <label className={`block text-sm sm:text-sm font-medium mb-2 sm:mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('auth.confirm_password')}
              </label>
              <input
                type="password"
                placeholder={t('auth.placeholder_confirm_password')}
                value={formData.confirmPassword}
                onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                className={`w-full px-4 sm:px-4 py-4 sm:py-4 rounded-xl sm:rounded-2xl border-2 focus:outline-none focus:border-opacity-100 transition-all text-base sm:text-base ${theme === 'dark'
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-white'
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-gray-900'
                  }`}
              />
              {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className={`text-xs sm:text-sm mt-1 sm:mt-2 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                  {t('auth.passwords_not_match')}
                </p>
              )}
              {formData.password && formData.confirmPassword && formData.password === formData.confirmPassword && (
                <p className={`text-xs sm:text-sm mt-1 sm:mt-2 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                  {t('auth.passwords_match')}
                </p>
              )}
            </div>
          </div>
        );

      case 'location':
        // Robust geolocation that works better across browsers (incl. Opera)
        const getPositionWithTimeout = (options: PositionOptions, timeoutMs = 10000) => {
          return new Promise<GeolocationPosition>((resolve, reject) => {
            let settled = false;
            const timer = setTimeout(() => {
              if (!settled) {
                settled = true;
                reject(new Error('Location request timed out'));
              }
            }, timeoutMs);
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                if (!settled) {
                  settled = true;
                  clearTimeout(timer);
                  resolve(pos);
                }
              },
              (err) => {
                if (!settled) {
                  settled = true;
                  clearTimeout(timer);
                  reject(err);
                }
              },
              options
            );
          });
        };

        const fetchIpFallback = async () => {
          // As a last resort, use IP-based geolocation (approximate city-level)
          // Multiple providers in case one fails
          const providers = [
            'https://ipapi.co/json/',
            'https://ipinfo.io/json?token=17064ceadbe842', // token optional; will still respond limited
          ];
          for (const url of providers) {
            try {
              const res = await fetch(url, { cache: 'no-store' });
              if (!res.ok) continue;
              const j = await res.json();
              const locStr: string | undefined = j.loc || (j.latitude && j.longitude ? `${j.latitude},${j.longitude}` : undefined);
              const [latStr, lngStr] = (locStr || '').split(',');
              const lat = parseFloat(j.latitude ?? latStr);
              const lng = parseFloat(j.longitude ?? lngStr);
              const display = j.city ? `${j.city}, ${j.country_name || j.country || ''}` : `${lat?.toFixed?.(3) || ''}, ${lng?.toFixed?.(3) || ''}`;
              if (!isNaN(lat) && !isNaN(lng)) {
                return {
                  country_code: (j.country_code || j.country || '').toString().toUpperCase(),
                  country_name: (j.country_name || j.country || '').toString(),
                  city: (j.city || '').toString(),
                  region: (j.region || j.region_name || '').toString(),
                  lat,
                  lng,
                  timezone: (j.timezone || '').toString(),
                  display,
                };
              }
            } catch (_) {
              // try next provider
            }
          }
          throw new Error('IP geolocation failed');
        };

        const handleLocationRequest = async () => {
          try {
            setLocationStatus(t('location.requesting_permission'));
            if (!navigator.geolocation) {
              setLocationStatus(t('location.geo_api_unavailable'));
              return;
            }

            // Check permission state if supported
            try {
              if ('permissions' in navigator && (navigator as any).permissions?.query) {
                const status = await (navigator as any).permissions.query({ name: 'geolocation' });
                if (status.state === 'denied') {
                  setLocationStatus(t('location.permission_denied'));
                  return;
                }
              }
            } catch (_) {}

            setLocationStatus(t('location.fetching_accurate'));
            const pos = await getPositionWithTimeout({ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }, 12000);
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;

            // Reverse geocode (existing flow)
            try {
              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
              const data = await res.json();
              const address = data.address || {};
              updateFormData('location', {
                country_code: address.country_code?.toUpperCase() || '',
                country_name: address.country || '',
                city: address.city || address.town || address.village || '',
                region: address.state || '',
                lat,
                lng,
                timezone: '',
                display: `${address.city || address.town || address.village || lat.toFixed(3)}, ${address.country || ''}`,
              });
              setLocationStatus(t('location.detected'));
            } catch (e) {
              // If reverse geocoding fails, still save coordinates
              updateFormData('location', {
                country_code: '',
                country_name: '',
                city: '',
                region: '',
                lat,
                lng,
                timezone: '',
                display: `${lat.toFixed(3)}, ${lng.toFixed(3)}`,
              });
              setLocationStatus(t('location.detected_no_address'));
            }
          } catch (geoErr: any) {
            // Opera and some browsers can hang or error; fallback to IP
            setLocationStatus(t('location.trying_ip'));
            try {
              const ipLoc = await fetchIpFallback();
              updateFormData('location', ipLoc);
              setLocationStatus(t('location.approximate_detected'));
            } catch (_) {
              setLocationStatus(t('location.failed'));
            }
          }
        };
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                <LocateFixed className={`w-8 h-8 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              {locationStatus && (
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{locationStatus}</p>
              )}
            </div>

            {!formData.location && (
              <motion.button
                onClick={handleLocationRequest}
                className={`w-full px-6 py-4 rounded-2xl font-semibold text-lg transition-all duration-200 ${theme === 'dark'
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-blue-500/25'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-blue-500/25'
                  }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {t('auth.allow_location')}
              </motion.button>
            )}

            {formData.location && (
              <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'}`}>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-3 ${theme === 'dark' ? 'bg-green-400' : 'bg-green-500'}`}></div>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-green-300' : 'text-green-700'}`}>
                    {t('auth.location_saved')}: {formData.location.display}
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      case 'notifications':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-yellow-900/20' : 'bg-yellow-100'}`}>
                <Bell className={`w-8 h-8 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`} />
              </div>
              <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('auth.current_status')}: {notificationPermission ?? 'unknown'}</p>
            </div>
            <motion.button
              onClick={requestNotificationPermission}
              className={`w-full px-6 py-4 rounded-2xl font-semibold text-lg transition-all duration-200 ${theme === 'dark'
                ? 'bg-yellow-500 text-black hover:bg-yellow-400'
                : 'bg-yellow-500 text-black hover:bg-yellow-600'
                }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {t('auth.enable_notifications')}
            </motion.button>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>{t('auth.change_later')}</p>
          </div>
        );
      case 'date-picker': {
        // Calculate year range for 20-year navigation
        const minYear = new Date().getFullYear() - 80;
        const maxYear = new Date().getFullYear() - 18;

        // 20-year block for year view
        const decadeYears: number[] = [];
        for (let y = decadeStart; y < decadeStart + 20; y++) {
          if (y >= minYear && y <= maxYear) {
            decadeYears.push(y);
          }
        }
        // For grid: fill to 20 years if possible
        while (decadeYears.length < 20) {
          decadeYears.push(NaN);
        }

        // Calendar Header: separate month and year buttons, highlight active
        return (
          <div className="space-y-2 sm:space-y-4">
            {/* Selected Date Display */}
            {selectedDate.day > 0 && selectedDate.month > 0 && selectedDate.year > 0 && (
              <div className={`text-center p-4 sm:p-4 rounded-xl sm:rounded-2xl border ${theme === 'dark'
                ? 'bg-gray-800/50 border-gray-700 text-white'
                : 'bg-gray-50 border-gray-200 text-gray-900'
                }`}>
                <div className="text-lg sm:text-lg font-semibold">
                  {selectedDate.day} {months[selectedDate.month - 1]} {selectedDate.year}
                </div>
              </div>
            )}
            {/* Calendar */}
            <div className={`p-4 sm:p-4 rounded-xl sm:rounded-2xl border ${theme === 'dark'
              ? 'bg-gray-800/30 border-gray-700'
              : 'bg-gray-50/30 border-gray-200'
              }`}>
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-4 sm:mb-4">
                {/* Left/Right for year or decade navigation */}
                {viewMode === 'day' && (
                  <button
                    type="button"
                    className="rounded-full p-2 sm:p-1.5 transition-colors"
                    onClick={() => navigateMonth('prev')}
                  >
                    <ChevronLeft className={`w-5 h-5 sm:w-5 sm:h-5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} />
                  </button>
                )}
                {viewMode === 'month' && (
                  <button
                    type="button"
                    className="rounded-full p-2 sm:p-1.5 transition-colors"
                    onClick={() => setCurrentYear(currentYear - 1)}
                    disabled={currentYear - 1 < minYear}
                  >
                    <ChevronLeft className={`w-5 h-5 sm:w-5 sm:h-5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} ${currentYear - 1 < minYear ? 'opacity-30' : ''}`} />
                  </button>
                )}
                {viewMode === 'year' && (
                  <button
                    type="button"
                    className="rounded-full p-2 sm:p-1.5 transition-colors"
                    onClick={() => setDecadeStart(ds => Math.max(ds - 20, minYear))}
                    disabled={decadeStart - 20 < minYear}
                  >
                    <ChevronLeft className={`w-5 h-5 sm:w-5 sm:h-5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} ${decadeStart - 20 < minYear ? 'opacity-30' : ''}`} />
                  </button>
                )}
                {/* Month and Year buttons */}
                <div className="grid grid-cols-2 gap-2 w-full flex-1">
                  <button
                    type="button"
                    className={`w-full flex items-center justify-center gap-1 sm:gap-1 px-3 sm:px-3 py-3 sm:py-2 rounded-md sm:rounded-lg text-base sm:text-base font-semibold transition-colors
                      ${viewMode === 'month'
                        ? (theme === 'dark'
                          ? 'bg-indigo-500 text-white'
                          : 'bg-indigo-100 text-indigo-900')
                        : (theme === 'dark'
                          ? 'bg-gray-700 hover:bg-gray-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-900')
                      }`}
                    onClick={() => setViewMode('month')}
                  >
                    <span>{months[currentMonth]}</span>
                    <ChevronDown className={`w-4 h-4 sm:w-4 sm:h-4 ml-1 sm:ml-1 transition-transform ${viewMode === 'month' ? 'rotate-180' : ''}`} />
                  </button>
                  <button
                    type="button"
                    className={`w-full flex items-center justify-center gap-1 sm:gap-1 px-3 sm:px-3 py-3 sm:py-2 rounded-md sm:rounded-lg text-base sm:text-base font-semibold transition-colors
                      ${viewMode === 'year'
                        ? (theme === 'dark'
                          ? 'bg-indigo-500 text-white'
                          : 'bg-indigo-100 text-indigo-900')
                        : (theme === 'dark'
                          ? 'bg-gray-700 hover:bg-gray-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-900')
                      }`}
                    onClick={() => setViewMode('year')}
                  >
                    {currentYear}
                    <ChevronDown className={`w-4 h-4 sm:w-4 sm:h-4 ml-1 sm:ml-1 transition-transform ${viewMode === 'year' ? 'rotate-180' : ''}`} />
                  </button>
                </div>
                {viewMode === 'day' && (
                  <button
                    type="button"
                    className="rounded-full p-2 sm:p-1.5 transition-colors"
                    onClick={() => navigateMonth('next')}
                  >
                    <ChevronRight className={`w-5 h-5 sm:w-5 sm:h-5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} />
                  </button>
                )}
                {viewMode === 'month' && (
                  <button
                    type="button"
                    className="rounded-full p-2 sm:p-1.5 transition-colors"
                    onClick={() => setCurrentYear(currentYear + 1)}
                    disabled={currentYear + 1 > maxYear}
                  >
                    <ChevronRight className={`w-5 h-5 sm:w-5 sm:h-5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} ${currentYear + 1 > maxYear ? 'opacity-30' : ''}`} />
                  </button>
                )}
                {viewMode === 'year' && (
                  <button
                    type="button"
                    className="rounded-full p-2 sm:p-1.5 transition-colors"
                    onClick={() => setDecadeStart(ds => Math.min(ds + 20, maxYear - 19))}
                    disabled={decadeStart + 20 > maxYear}
                  >
                    <ChevronRight className={`w-5 h-5 sm:w-5 sm:h-5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} ${decadeStart + 20 > maxYear ? 'opacity-30' : ''}`} />
                  </button>
                )}
              </div>
              {/* AnimatePresence for view modes */}
              <AnimatePresence mode="wait" initial={false}>
                {viewMode === 'year' && (
                  <motion.div
                    key="year"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="grid grid-cols-5 gap-1 sm:gap-2 mb-1 sm:mb-2">
                      {decadeYears.map((y, idx) =>
                        isNaN(y) ? (
                          <div key={idx} />
                        ) : (
                          <button
                            type="button"
                            key={y}
                            onClick={() => {
                              setCurrentYear(y);
                              setViewMode('month');
                            }}
                            className={`rounded-md sm:rounded-lg px-3 sm:px-3 py-3 sm:py-2 text-sm sm:text-sm font-medium transition-colors
                              ${currentYear === y
                                ? (theme === 'dark'
                                  ? 'bg-white text-gray-900'
                                  : 'bg-gray-900 text-white')
                                : (theme === 'dark'
                                  ? 'text-white hover:bg-gray-700'
                                  : 'text-gray-900 hover:bg-gray-100')
                              }`}
                          >
                            {y}
                          </button>
                        )
                      )}
                    </div>
                    <div className="text-[10px] sm:text-xs text-center text-gray-400 mt-0.5 sm:mt-1">
                      {decadeStart} – {decadeStart + 19}
                    </div>
                  </motion.div>
                )}
                {viewMode === 'month' && (
                  <motion.div
                    key="month"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="grid grid-cols-3 gap-1 sm:gap-2 mb-1 sm:mb-2">
                      {months.map((m, idx) => (
                        <button
                          type="button"
                          key={m}
                          onClick={() => {
                            setCurrentMonth(idx);
                            setViewMode('day');
                          }}
                          className={`rounded-md sm:rounded-lg px-3 sm:px-3 py-3 sm:py-2 text-sm sm:text-sm font-medium transition-colors
                            ${currentMonth === idx
                              ? (theme === 'dark'
                                ? 'bg-white text-gray-900'
                                : 'bg-gray-900 text-white')
                              : (theme === 'dark'
                                ? 'text-white hover:bg-gray-700'
                                : 'text-gray-900 hover:bg-gray-100')
                            }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
                {viewMode === 'day' && (
                  <motion.div
                    key="day"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Days of Week */}
                    <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2 sm:mb-2">
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                        <div key={day} className={`text-center text-xs sm:text-xs font-medium py-2 sm:py-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                          {day}
                        </div>
                      ))}
                    </div>
                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                      {renderCalendar()}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        );
      }
      case 'captcha':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-indigo-900/30' : 'bg-indigo-100'}`}>
                <Shield className={`w-8 h-8 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`} />
              </div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {t('auth.captcha_instructions', { defaultValue: 'Please verify that you are not a robot' })}
              </p>
            </div>
            <div className="flex justify-center">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={RECAPTCHA_SITE_KEY}
                onChange={(token) => {
                  setRecaptchaToken(token);
                  setError(''); // Clear error when captcha is completed
                }}
                onExpired={() => {
                  setRecaptchaToken(null);
                }}
                onError={() => {
                  setRecaptchaToken(null);
                  setError(t('auth.captcha_error', { defaultValue: 'reCAPTCHA verification failed. Please try again.' }));
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
      {/* Header - Only show in modal mode */}
      {mode === 'modal' && (
        <div className="flex items-center justify-between p-4 sm:p-6 pb-3 sm:pb-4 border-b border-gray-200 dark:border-gray-800">
          {/* Progress Bar */}
          <div className="flex-1 flex space-x-1 sm:space-x-2 mr-3 sm:mr-6">
            {Array.from({ length: getTotalSteps() }, (_, index) => (
              <div
                key={index}
                className={`h-1.5 sm:h-2 flex-1 rounded-full transition-all duration-300 ${index <= getCurrentStepIndex()
                  ? theme === 'dark' ? 'bg-white shadow-sm' : 'bg-gray-900 shadow-sm'
                  : theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
                  }`}
              />
            ))}
          </div>

          {/* X Button */}
          <button
            onClick={onClose}
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 ${theme === 'dark'
              ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-300'
              : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      )}

          {/* Step Content */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-center px-4 sm:px-8 py-2 sm:py-6"
          >
            <div className={`w-10 h-10 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-6 rounded-xl sm:rounded-2xl flex items-center justify-center ${theme === 'dark'
              ? 'bg-gray-800'
              : 'bg-gray-100'
              }`}>
              <currentStepData.icon className={`w-5 h-5 sm:w-8 sm:h-8 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`} />
            </div>
            <h2 className={`text-lg sm:text-2xl font-bold mb-1 sm:mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
              {currentStepData.title}
            </h2>
            <p className={`text-xs sm:text-base leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
              {currentStepData.subtitle}
            </p>
          </motion.div>

          {/* Form */}
          <div className="px-4 sm:px-8 pb-20 sm:pb-8">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-3 sm:mb-8"
            >
              {renderFormField()}
            </motion.div>

            {/* Error Message - Show for all steps if error exists */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`mb-6 p-4 rounded-2xl border ${theme === 'dark'
                  ? 'bg-red-900/20 border-red-700 text-red-300'
                  : 'bg-red-50 border-red-200 text-red-700'
                }`}
              >
                <p className="text-sm font-medium">{error}</p>
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex flex-row flex-nowrap gap-2 sm:gap-4 items-stretch">
              {currentStep > 0 ? (
                <motion.button
                  onClick={handleBack}
                  className={`flex-shrink-0 flex items-center justify-center px-4 sm:px-6 py-4 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-base sm:text-base transition-all duration-200 whitespace-nowrap ${theme === 'dark'
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                    }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ArrowLeft className="w-5 h-5 sm:w-5 sm:h-5 mr-2 sm:mr-2" />
                  <span>{t('auth.back')}</span>
                </motion.button>
              ) : (
                <motion.button
                  onClick={onClose}
                  className={`flex-shrink-0 flex items-center justify-center px-4 sm:px-6 py-4 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-base sm:text-base transition-all duration-200 whitespace-nowrap ${theme === 'dark'
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                    }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ArrowLeft className="w-5 h-5 sm:w-5 sm:h-5 mr-2 sm:mr-2" />
                  <span>{t('auth.back')}</span>
                </motion.button>
              )}

              <motion.button
                onClick={handleNext}
                disabled={!canProceed() || isLoading}
                className={`flex-1 flex items-center justify-center px-4 sm:px-8 py-4 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-base sm:text-lg transition-all duration-200 min-w-0 ${canProceed() && !isLoading
                  ? theme === 'dark'
                    ? 'bg-white text-gray-900 hover:bg-gray-100 shadow-lg hover:shadow-white/25'
                    : 'bg-gray-900 text-white hover:bg-gray-800 shadow-lg hover:shadow-gray-900/25'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                whileHover={canProceed() && !isLoading ? { scale: 1.02 } : {}}
                whileTap={canProceed() && !isLoading ? { scale: 0.98 } : {}}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className={`w-4 h-4 sm:w-5 sm:h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2`} />
                    <span className="text-sm sm:text-base">{authMode === 'login' ? t('auth.signing_in') : t('auth.creating_account')}</span>
                  </div>
                ) : (
                  <>
                    <span className="text-base sm:text-base whitespace-nowrap">{currentStep === (authMode === 'login' ? 3 : 6) ? (authMode === 'login' ? t('auth.sign_in') : t('auth.complete_registration')) : t('auth.continue')}</span>
                    <ArrowRight className="w-5 h-5 sm:w-5 sm:h-5 ml-2 flex-shrink-0" />
                  </>
                )}
              </motion.button>

            </div>
          </div>
    </>
  );

  if (mode === 'inline') {
    return (
      <div className={`w-full rounded-3xl overflow-hidden ${theme === 'dark'
        ? 'bg-gray-900'
        : 'bg-white'
      }`}>
        {content}
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={`w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border ${theme === 'dark'
            ? 'bg-gray-900 border-gray-800'
            : 'bg-white border-gray-200'
          }`}
        >
          {content}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AuthWizard;
