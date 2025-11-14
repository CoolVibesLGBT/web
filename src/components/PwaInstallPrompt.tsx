import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

interface InstallContextValue {
  canInstall: boolean;
  promptInstall: () => Promise<{ outcome: 'accepted' | 'dismissed'; platform: string } | null>;
  dismissPrompt: () => void;
}

const InstallPromptContext = React.createContext<InstallContextValue>({
  canInstall: false,
  promptInstall: async () => null,
  dismissPrompt: () => {},
});

export const PwaInstallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setDismissed(false);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setDismissed(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = React.useCallback(async () => {
    if (!deferredPrompt) return null;

    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      setDeferredPrompt(null);
      setDismissed(true);
    }
    return choiceResult;
  }, [deferredPrompt]);

  const dismissPrompt = React.useCallback(() => {
    setDismissed(true);
  }, []);

  const value = React.useMemo(
    () => ({
      canInstall: !!deferredPrompt && !dismissed,
      promptInstall,
      dismissPrompt,
    }),
    [deferredPrompt, dismissed, promptInstall, dismissPrompt]
  );

  return <InstallPromptContext.Provider value={value}>{children}</InstallPromptContext.Provider>;
};

export const usePwaInstall = () => React.useContext(InstallPromptContext);

type PromptVariant = 'card' | 'floating';

interface PwaInstallPromptProps {
  variant?: PromptVariant;
  className?: string;
  position?: 'bottom-left' | 'bottom-right';
  onDismiss?: () => void;
  onInstalled?: () => void;
}

const PwaInstallPrompt: React.FC<PwaInstallPromptProps> = ({
  variant = 'floating',
  className = '',
  position = 'bottom-right',
  onDismiss,
  onInstalled,
}) => {
  const { canInstall, promptInstall, dismissPrompt } = usePwaInstall();
  const { theme } = useTheme();
  const { t } = useTranslation('common');

  const handleInstallClick = React.useCallback(async () => {
    const result = await promptInstall();
    if (result?.outcome === 'accepted') {
      onInstalled?.();
      onDismiss?.();
    }
  }, [promptInstall, onDismiss, onInstalled]);

  const handleDismiss = React.useCallback(() => {
    dismissPrompt();
    onDismiss?.();
  }, [dismissPrompt, onDismiss]);

  if (!canInstall) {
    return null;
  }

  if (variant === 'card') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className={`rounded-2xl p-5 border ${
          theme === 'dark'
            ? 'bg-gradient-to-br from-gray-900/90 via-black/90 to-gray-950 border-white/10'
            : 'bg-gradient-to-br from-white via-gray-50 to-white border-gray-200 shadow-sm'
        } ${className}`}
      >
        <div className="flex items-start gap-3 mb-4">
          <div
            className={`p-3 rounded-2xl ${
              theme === 'dark' ? 'bg-white/10 text-white' : 'bg-gray-900/5 text-gray-900'
            }`}
          >
            <Download className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className={`text-base font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {t('app.install_prompt_title', { defaultValue: 'Install CoolVibes' })}
            </h3>
            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('app.install_prompt_desc_sidebar', {
                defaultValue: 'Add the app to your device for a faster, full-screen experience.',
              })}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleInstallClick}
          className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            theme === 'dark' ? 'bg-white text-gray-900 hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'
          }`}
        >
          <Download className="w-4 h-4" />
          {t('app.install_now', { defaultValue: 'Install' })}
        </button>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.25 }}
        className={`fixed z-[210] max-w-xs rounded-2xl border shadow-2xl backdrop-blur-md p-4 flex items-start gap-3 ${
          position === 'bottom-right' ? 'bottom-24 right-5' : 'bottom-24 left-5'
        } ${
          theme === 'dark'
            ? 'border-white/10 bg-gray-900/90 text-white'
            : 'border-gray-200 bg-white/95 text-gray-900'
        } ${className}`}
      >
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
            theme === 'dark' ? 'bg-white/10 text-white' : 'bg-gray-900/10 text-gray-900'
          }`}
        >
          <Download className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold mb-1">
            {t('app.install_prompt_title', { defaultValue: 'Install CoolVibes' })}
          </p>
          <p className={`text-xs mb-3 ${theme === 'dark' ? 'text-white/70' : 'text-gray-600'}`}>
            {t('app.install_prompt_desc', {
              defaultValue: 'Add the app to your home screen for a faster experience.',
            })}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className={`flex-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                theme === 'dark' ? 'bg-white text-gray-900 hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
            >
              {t('app.install_now', { defaultValue: 'Install' })}
            </button>
            <button
              onClick={handleDismiss}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                theme === 'dark'
                  ? 'border-white/20 text-white hover:bg-white/10'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {t('app.not_now', { defaultValue: 'Later' })}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PwaInstallPrompt;

