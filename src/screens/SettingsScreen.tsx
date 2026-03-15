import { useState, useCallback, memo } from 'react';
import {
    Bell,
    Eye,
    EyeOff,
    Trash2,
    ChevronRight,
    Mail,
    MessageSquare,
    Heart,
    ArrowLeft,
    AlertTriangle,
    Moon,
    Sun,
    Languages,
    LogOut
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Container from '../components/ui/Container';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import LanguageSelectorModal from '../components/ui/LanguageSelector';

// --- Sub-components (Refined for a Professional Look) ---

const SettingItem = memo(({ icon: Icon, label, subtitle, onClick, value, toggle, danger, dark, border = true }: any) => (
    <div
        onClick={onClick}
        className={`group flex items-center justify-between p-4 cursor-pointer transition-all ${dark ? 'hover:bg-gray-900/50' : 'hover:bg-gray-100'
            } ${border ? (dark ? 'border-b border-gray-900' : 'border-b border-gray-200/50') : ''}`}
    >
        <div className="flex items-center gap-4 min-w-0">
            <div className={`flex items-center justify-center w-10 h-10 rounded-2xl transition-colors ${danger
                ? (dark ? 'bg-red-500/10 text-red-500' : 'bg-red-50 text-red-600')
                : (dark ? 'bg-gray-900/50 text-gray-300 group-hover:text-white' : 'bg-gray-100 text-gray-600 group-hover:text-gray-900')
                }`}>
                <Icon size={20} strokeWidth={2} />
            </div>
            <div className="flex flex-col min-w-0">
                <span className={`text-[15px] font-semibold leading-tight ${danger ? 'text-red-500' : (dark ? 'text-white' : 'text-gray-900')}`}>
                    {label}
                </span>
                {subtitle && (
                    <span className={`text-[12px] truncate leading-tight mt-0.5 ${dark ? 'text-gray-500' : 'text-gray-500'}`}>
                        {subtitle}
                    </span>
                )}
            </div>
        </div>
        <div className="flex items-center gap-3">
            {toggle && <Toggle value={value} dark={dark} />}
            {!toggle && !value && <ChevronRight size={18} className={dark ? 'text-gray-700' : 'text-gray-300'} />}
            {value && !toggle && <span className={`text-sm font-medium ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{value}</span>}
        </div>
    </div>
));

SettingItem.displayName = 'SettingItem';

const Section = memo(({ title, children, dark }: any) => (
    <div className="mb-8">
        {title && (
            <h3 className={`px-4 mb-3 text-[11px] font-bold uppercase tracking-[0.2em] ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                {title}
            </h3>
        )}
        <div className={`overflow-hidden rounded-[24px] border ${dark ? 'bg-gray-950 border-gray-900' : 'bg-white border-gray-200/50 shadow-sm'
            }`}>
            {children}
        </div>
    </div>
));

Section.displayName = 'Section';

const Toggle = memo(({ value, dark }: { value: boolean, dark: boolean }) => (
    <div
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${value ? (dark ? 'bg-white' : 'bg-black') : (dark ? 'bg-gray-800' : 'bg-gray-200')
            }`}
    >
        <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full ${value ? (dark ? 'bg-black' : 'bg-white') : 'bg-white'} shadow-md ring-0 transition duration-200 ease-in-out ${value ? 'translate-x-[22px]' : 'translate-x-1'
                } mt-[4px]`}
        />
    </div>
));

Toggle.displayName = 'Toggle';

// --- Main Settings Screen ---

export default function SettingsScreen() {
    const { t } = useTranslation('common');
    const { theme, toggleTheme } = useTheme();
    const { settings, setOption } = useSettings();
    const { logout } = useAuth();
    const navigate = useNavigate();

    const [isLangModalOpen, setIsLangModalOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const isDark = theme === 'dark';

    const handleToggle = useCallback((key: string) => {
        setOption(key as any, !((settings as any)[key]));
    }, [settings, setOption]);

    const handleDeleteProfile = async () => {
        try {
            await api.handleDeleteProfile();
            logout();
            navigate('/', { replace: true });
        } catch (error) {
            console.error('Delete account failed:', error);
            // Optional: Show error toast/message
        }
    };

    return (
        <Container>
            <div className={`flex flex-col h-[100dvh] w-full max-w-[600px] mx-auto ${isDark ? 'bg-gray-950 text-white' : 'bg-white text-gray-900'}`}>
                {/* Header */}
                <div className={`flex-shrink-0 sticky top-0 z-30 flex items-center justify-between h-[64px] px-4 ${isDark ? 'bg-gray-950/95' : 'bg-white/95'} backdrop-blur-md border-b ${isDark ? 'border-gray-900' : 'border-gray-200/50'}`}>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate(-1)}
                            className={`p-2.5 -ml-2 rounded-full transition-all active:scale-90 ${isDark ? 'hover:bg-gray-900/50' : 'hover:bg-gray-100'}`}
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-[17px] font-bold tracking-tight">
                            {t('settings.title', { defaultValue: 'Settings' })}
                        </h1>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-hide pb-24">
                    <div className="max-w-xl mx-auto px-4 pt-6">

                    <Section title={t('settings.appearance', { defaultValue: 'Appearance' })} dark={isDark}>
                        <SettingItem
                            icon={isDark ? Moon : Sun}
                            label={t('settings.dark_mode', { defaultValue: 'Dark Mode' })}
                            subtitle={isDark ? 'Currently using Dark' : 'Currently using Light'}
                            onClick={toggleTheme}
                            value={isDark}
                            toggle
                            dark={isDark}
                        />
                        <SettingItem
                            icon={Languages}
                            label={t('settings.language', { defaultValue: 'Language' })}
                            subtitle={i18n.language.toUpperCase()}
                            onClick={() => setIsLangModalOpen(true)}
                            dark={isDark}
                            border={false}
                        />
                    </Section>

                    <Section title={t('settings.notifications.title', { defaultValue: 'Notifications' })} dark={isDark}>
                        <SettingItem
                            icon={Bell}
                            label={t('settings.push_notifications', { defaultValue: 'Push Notifications' })}
                            subtitle="Get notified in real-time"
                            onClick={() => handleToggle('pushNotifications')}
                            value={settings.pushNotifications}
                            toggle
                            dark={isDark}
                        />
                        <SettingItem
                            icon={Mail}
                            label={t('settings.email_notifications', { defaultValue: 'Email Notifications' })}
                            subtitle="Weekly updates and alerts"
                            onClick={() => handleToggle('emailNotifications')}
                            value={settings.emailNotifications}
                            toggle
                            dark={isDark}
                        />
                        <SettingItem
                            icon={MessageSquare}
                            label={t('settings.chat_notifications', { defaultValue: 'Messages' })}
                            subtitle="New message alerts"
                            onClick={() => handleToggle('messageNotifications')}
                            value={settings.messageNotifications}
                            toggle
                            dark={isDark}
                            border={false}
                        />
                    </Section>

                    <Section title={t('settings.privacy', { defaultValue: 'Privacy' })} dark={isDark}>
                        <SettingItem
                            icon={settings.blurPhotos ? EyeOff : Eye}
                            label={t('settings.blur_photos', { defaultValue: 'Blur Photos in Posts' })}
                            subtitle={settings.blurPhotos ? 'Photos are blurred' : 'Photos are clear'}
                            onClick={() => handleToggle('blurPhotos')}
                            value={settings.blurPhotos}
                            toggle
                            dark={isDark}
                        />
                        <SettingItem
                            icon={Heart}
                            label={t('settings.likes_visibility', { defaultValue: 'Who can see my likes' })}
                            subtitle="Public by default"
                            onClick={() => { }}
                            value="Everyone"
                            dark={isDark}
                        />
                        <SettingItem
                            icon={settings.showOnlineStatus ? Eye : EyeOff}
                            label={t('settings.online_status', { defaultValue: 'Online Status' })}
                            subtitle="Let others know you're here"
                            onClick={() => handleToggle('showOnlineStatus')}
                            value={settings.showOnlineStatus}
                            toggle
                            dark={isDark}
                            border={false}
                        />
                    </Section>

                    <Section title={t('settings.account.title', { defaultValue: 'Account' })} dark={isDark}>
                        <SettingItem
                            icon={LogOut}
                            label={t('settings.logout', { defaultValue: 'Log Out' })}
                            subtitle="Sign out from this device"
                            onClick={() => setIsLogoutModalOpen(true)}
                            danger
                            dark={isDark}
                            border={false}
                        />
                        <div className={`h-2 ${isDark ? 'bg-gray-900/40' : 'bg-gray-50'}`} />
                        <SettingItem
                            icon={Trash2}
                            label={t('settings.delete_account', { defaultValue: 'Delete Account' })}
                            subtitle="Permanently remove your data"
                            onClick={() => setIsDeleteModalOpen(true)}
                            danger
                            dark={isDark}
                            border={false}
                        />
                    </Section>

                    </div>
                </div>
            </div>

            <LanguageSelectorModal
                isOpen={isLangModalOpen}
                onClose={() => setIsLangModalOpen(false)}
            />

            <ConfirmationModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={logout}
                title={t('settings.logout_confirm_title', { defaultValue: 'Log Out?' })}
                message={t('settings.logout_confirm_message', { defaultValue: 'Are you sure you want to sign out? You will need to login again to access your profile.' })}
                confirmText={t('settings.logout', { defaultValue: 'Log Out' })}
                cancelText={t('common.cancel', { defaultValue: 'Cancel' })}
                variant="danger"
                icon={<AlertTriangle className="text-white" />}
            />

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteProfile}
                title={t('settings.delete_confirm_title', { defaultValue: 'Delete Account?' })}
                message={t('settings.delete_confirm_message', { defaultValue: 'This action is PERMANENT. All your posts, profile data, and messages will be deleted forever. This cannot be undone.' })}
                confirmText={t('settings.delete_account', { defaultValue: 'Delete Everything' })}
                cancelText={t('common.cancel', { defaultValue: 'Cancel' })}
                variant="danger"
                icon={<AlertTriangle className="text-white" />}
            />
        </Container>
    );
}
