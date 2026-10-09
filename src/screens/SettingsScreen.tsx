import { useState, useCallback, useMemo } from 'react';
import { useSEO } from '../hooks/useSEO';
import {
    Bell,
    Eye,
    EyeOff,
    Trash2,
    ChevronRight,
    Mail,
    MessageSquare,
    Heart,
    AlertTriangle,
    Moon,
    Sun,
    Languages,
    LogOut,
    FileText,
    ShieldCheck,
    Lightbulb,
    Search,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from '@/router';
import { api } from '../services/api';
import { openExternalUrl } from '../platform/runtime';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import LanguageSelectorModal from '../components/ui/LanguageSelector';
import Switch from '../components/ui/Switch';
import type { SettingName } from '../appSettings';

interface IOSRowDef {
    key: string;
    icon: React.ElementType;
    label: string;
    subtitle?: string;
    value?: string;
    toggleKey?: SettingName;
    switchOn?: boolean;
    onSwitch?: () => void;
    onClick?: () => void;
    danger?: boolean;
    centered?: boolean;
}

interface IOSGroupDef {
    key: string;
    title?: string;
    footer?: string;
    rows: IOSRowDef[];
}

export default function SettingsScreen() {
    const { t } = useTranslation('common');
    const { theme, toggleTheme } = useTheme();
    const { settings, setOption } = useSettings();
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const [isLangModalOpen, setIsLangModalOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const isDark = theme === 'dark';

    useSEO({
        title: 'Settings',
        description: 'Manage your CoolVibes account settings, privacy, notifications, and preferences.',
        canonical: '/settings',
        noindex: true,
    });

    const handleToggle = useCallback((key: SettingName) => {
        setOption(key, !(settings[key]));
    }, [settings, setOption]);

    const handleDeleteProfile = async () => {
        try {
            await api.handleDeleteProfile();
            logout();
            navigate('/', { replace: true });
        } catch (error) {
            console.error('Delete account failed:', error);
        }
    };

    const handleLogoutConfirm = useCallback(() => {
        logout();
        setIsLogoutModalOpen(false);
        navigate('/', { replace: true });
    }, [logout, navigate]);

    const handleDataRequest = useCallback(() => {
        if (typeof window === 'undefined') return;
        openExternalUrl('mailto:privacy@coolvibes.lgbt');
    }, []);

    const handleOpenPrivacyManager = useCallback(() => {
        navigate('/legal/privacy');
    }, [navigate]);

    const handleOpenProfile = useCallback(() => {
        navigate('/profile');
    }, [navigate]);

    const groups: IOSGroupDef[] = useMemo(() => ([
        {
            key: 'appearance',
            title: t('settings.appearance', { defaultValue: 'Appearance' }),
            footer: t('settings.appearance_footer', { defaultValue: 'Dark Mode follows a darker palette across the whole app.' }),
            rows: [
                {
                    key: 'dark-mode',
                    icon: isDark ? Moon : Sun,
                    label: t('settings.dark_mode', { defaultValue: 'Dark Mode' }),
                    subtitle: isDark
                        ? t('settings.dark_mode_on', { defaultValue: 'Currently using Dark' })
                        : t('settings.dark_mode_off', { defaultValue: 'Currently using Light' }),
                    switchOn: isDark,
                    onSwitch: toggleTheme,
                },
                {
                    key: 'dock-tips',
                    icon: Lightbulb,
                    label: t('settings.navigation_tips', { defaultValue: 'Dock tips' }),
                    subtitle: t('settings.navigation_tips_description', { defaultValue: 'Show navigation guides above the dock' }),
                    toggleKey: 'showDockTips',
                },
                {
                    key: 'language',
                    icon: Languages,
                    label: t('settings.language', { defaultValue: 'Language' }),
                    subtitle: i18n.language.toUpperCase(),
                    onClick: () => setIsLangModalOpen(true),
                },
            ],
        },
        {
            key: 'notifications',
            title: t('settings.notifications.title', { defaultValue: 'Notifications' }),
            footer: t('settings.notifications_footer', { defaultValue: 'You can change how you are notified at any time.' }),
            rows: [
                {
                    key: 'push',
                    icon: Bell,
                    label: t('settings.push_notifications', { defaultValue: 'Push Notifications' }),
                    subtitle: t('settings.push_notifications_sub', { defaultValue: 'Get notified in real-time' }),
                    toggleKey: 'pushNotifications',
                },
                {
                    key: 'email',
                    icon: Mail,
                    label: t('settings.email_notifications', { defaultValue: 'Email Notifications' }),
                    subtitle: t('settings.email_notifications_sub', { defaultValue: 'Weekly updates and alerts' }),
                    toggleKey: 'emailNotifications',
                },
                {
                    key: 'messages',
                    icon: MessageSquare,
                    label: t('settings.chat_notifications', { defaultValue: 'Messages' }),
                    subtitle: t('settings.chat_notifications_sub', { defaultValue: 'New message alerts' }),
                    toggleKey: 'messageNotifications',
                },
            ],
        },
        {
            key: 'privacy',
            title: t('settings.privacy', { defaultValue: 'Privacy' }),
            footer: t('settings.privacy_footer', { defaultValue: 'Blurred photos stay hidden until you choose to reveal them.' }),
            rows: [
                {
                    key: 'blur',
                    icon: settings.blurPhotos ? EyeOff : Eye,
                    label: t('settings.blur_photos', { defaultValue: 'Blur Photos in Posts' }),
                    subtitle: settings.blurPhotos
                        ? t('settings.blur_photos_on', { defaultValue: 'Photos are blurred' })
                        : t('settings.blur_photos_off', { defaultValue: 'Photos are clear' }),
                    toggleKey: 'blurPhotos',
                },
                {
                    key: 'likes',
                    icon: Heart,
                    label: t('settings.likes_visibility', { defaultValue: 'Who can see my likes' }),
                    subtitle: t('settings.likes_visibility_sub', { defaultValue: 'Public by default' }),
                    value: t('settings.likes_visibility_value', { defaultValue: 'Everyone' }),
                },
                {
                    key: 'online',
                    icon: settings.showOnlineStatus ? Eye : EyeOff,
                    label: t('settings.online_status', { defaultValue: 'Online Status' }),
                    subtitle: t('settings.online_status_sub', { defaultValue: "Let others know you're here" }),
                    toggleKey: 'showOnlineStatus',
                },
            ],
        },
        {
            key: 'gdpr',
            title: t('settings.gdpr.title', { defaultValue: 'Personal Data & GDPR' }),
            footer: t('settings.gdpr.footer', { defaultValue: 'You own your data. Export it or manage permissions anytime.' }),
            rows: [
                {
                    key: 'data-request',
                    icon: FileText,
                    label: t('settings.gdpr.request_title', { defaultValue: 'Data Request' }),
                    subtitle: t('settings.gdpr.request_subtitle', { defaultValue: 'Request a copy of the personal data we hold about you.' }),
                    onClick: handleDataRequest,
                },
                {
                    key: 'privacy-manager',
                    icon: ShieldCheck,
                    label: t('settings.gdpr.manager_title', { defaultValue: 'Open Privacy Manager' }),
                    subtitle: t('settings.gdpr.manager_subtitle', { defaultValue: 'You can manage your GDPR permissions in the Privacy Manager.' }),
                    onClick: handleOpenPrivacyManager,
                },
            ],
        },
        {
            key: 'signout',
            rows: [
                {
                    key: 'logout',
                    icon: LogOut,
                    label: t('settings.logout', { defaultValue: 'Log Out' }),
                    danger: true,
                    centered: true,
                    onClick: () => setIsLogoutModalOpen(true),
                },
            ],
        },
        {
            key: 'delete',
            footer: t('settings.delete_footer', { defaultValue: 'Deleting your account permanently removes posts, profile data and messages.' }),
            rows: [
                {
                    key: 'delete-account',
                    icon: Trash2,
                    label: t('settings.delete_account', { defaultValue: 'Delete Account' }),
                    danger: true,
                    centered: true,
                    onClick: () => setIsDeleteModalOpen(true),
                },
            ],
        },
    ]), [t, isDark, settings.blurPhotos, settings.showOnlineStatus, toggleTheme, handleDataRequest, handleOpenPrivacyManager]);

    const normalizedQuery = searchQuery.trim().toLocaleLowerCase('tr');
    const visibleGroups = useMemo(() => {
        if (!normalizedQuery) return groups;
        return groups
            .map((group) => ({
                ...group,
                rows: group.rows.filter((row) =>
                    `${row.label} ${row.subtitle ?? ''}`.toLocaleLowerCase('tr').includes(normalizedQuery),
                ),
            }))
            .filter((group) => group.rows.length > 0);
    }, [groups, normalizedQuery]);

    const pageBg = 'bg-[var(--cv-page-bg)]';
    const groupBg = 'bg-[var(--cv-card-bg-solid)]';
    const labelColor = (danger?: boolean) => danger ? 'text-[var(--color-brand)]' : 'text-[var(--cv-neutral-1)]';
    const secondaryColor = 'text-[var(--cv-neutral-2)]';
    const separatorColor = 'bg-[var(--cv-inner-border)]';
    const chevronColor = 'text-[var(--cv-neutral-3)]';
    const rowHover = 'hover:bg-[var(--cv-surface-2-hover)]';

    const displayName = user?.displayname || user?.username || '';
    const avatarUrl = user?.profile_image_url || '';

    return (
        <div className={`skyline-page-scroll w-full ${pageBg} text-[var(--cv-neutral-1)]`}>
            <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col px-4 pb-10 pt-[72px] md:px-6">
                {/* iOS large title */}
                <h1 className="pt-2 text-[34px] font-bold leading-tight tracking-tight">
                    {t('settings.title', { defaultValue: 'Settings' })}
                </h1>

                {/* iOS search field */}
                <div className={`mt-3 flex h-9 items-center gap-2 rounded-[10px] px-2.5 ${isDark ? 'bg-white/10' : 'bg-black/[0.06]'}`}>
                    <Search className={`h-4 w-4 shrink-0 ${secondaryColor}`} />
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('app.search_placeholder', { defaultValue: 'Ara' })}
                        aria-label={t('app.search_placeholder', { defaultValue: 'Ara' })}
                        className="w-full bg-transparent text-[17px] outline-none placeholder:text-[var(--cv-neutral-3)]"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            aria-label={t('search.clear', { defaultValue: 'Clear search' })}
                            className={`text-[15px] font-medium ${secondaryColor}`}
                        >
                            ×
                        </button>
                    )}
                </div>

                {/* iOS Apple-Account style profile cell */}
                {!normalizedQuery && (
                    <div className={`mt-5 overflow-hidden rounded-[12px] border border-[var(--cv-card-border)] ${groupBg}`}>
                        <button
                            type="button"
                            onClick={handleOpenProfile}
                            className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-all duration-150 active:opacity-60 ${rowHover}`}
                        >
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="" className="h-[58px] w-[58px] shrink-0 rounded-full object-cover" />
                            ) : (
                                <span className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full bg-brand text-[24px] font-semibold text-white">
                                    {(displayName || '?').charAt(0).toUpperCase()}
                                </span>
                            )}
                            <span className="min-w-0 flex-1">
                                <span className={`block truncate text-[20px] leading-tight ${isDark ? 'text-white' : 'text-black'}`}>
                                    {displayName}
                                </span>
                                <span className={`mt-0.5 block truncate text-[13px] ${secondaryColor}`}>
                                    {user?.username ? `@${user.username}` : t('settings.profile_subtitle', { defaultValue: 'CoolVibes Account' })}
                                </span>
                            </span>
                            <ChevronRight size={20} className={`shrink-0 ${chevronColor}`} />
                        </button>
                    </div>
                )}

                {/* iOS grouped sections */}
                <div className="mt-5 flex flex-col gap-5">
                    {visibleGroups.map((group) => {
                        const isButtonOnlyGroup = group.rows.length === 1 && group.rows[0].centered && group.rows[0].danger;
                        return (
                        <section key={group.key}>
                            {group.title && (
                                <h2 className={`px-4 pb-1.5 text-[13px] font-normal ${secondaryColor}`}>
                                    {group.title}
                                </h2>
                            )}
                            <div className={isButtonOnlyGroup ? '' : `overflow-hidden rounded-[12px] border border-[var(--cv-card-border)] ${groupBg}`}>
                                {group.rows.map((row, index) => {
                                    const RowIcon = row.icon;
                                    const isLast = index === group.rows.length - 1;
                                    const hasSwitch = !!row.toggleKey || !!row.onSwitch;
                                    const switchChecked = row.toggleKey ? !!settings[row.toggleKey] : !!row.switchOn;
                                    const doSwitch = () => {
                                        if (row.toggleKey) handleToggle(row.toggleKey);
                                        else row.onSwitch?.();
                                    };
                                    const content = (
                                        <>
                                            {!row.centered && (
                                                <span className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-light-solid)] text-[var(--color-brand)]">
                                                    <RowIcon size={17} strokeWidth={2.2} />
                                                </span>
                                            )}
                                            <span className={`min-w-0 flex-1 ${row.centered
                                                ? `text-center text-[17px] font-semibold ${row.key === 'delete-account' ? 'text-white' : 'text-[var(--color-brand)]'}`
                                                : labelColor(row.danger)
                                                }`}>
                                                {!row.centered && (
                                                    <>
                                                        <span className="block truncate text-[17px] leading-snug">{row.label}</span>
                                                        {row.subtitle && (
                                                            <span className={`block truncate text-[13px] ${secondaryColor}`}>
                                                                {row.subtitle}
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                                {row.centered && row.label}
                                            </span>
                                            {hasSwitch && (
                                                <Switch checked={switchChecked} onChange={doSwitch} aria-label={row.label} />
                                            )}
                                            {row.value && !hasSwitch && (
                                                <span className={`shrink-0 text-[17px] ${secondaryColor}`}>{row.value}</span>
                                            )}
                                            {row.onClick && !hasSwitch && !row.centered && (
                                                <ChevronRight size={20} className={`shrink-0 ${chevronColor}`} />
                                            )}
                                        </>
                                    );
                                    const rowClasses = row.centered && row.danger
                                        ? `flex w-full items-center justify-center gap-2 rounded-[16px] px-4 py-3 min-h-[44px] transition-all duration-150 active:scale-[0.98] active:opacity-90 ${row.key === 'delete-account'
                                            ? 'bg-[var(--color-brand)] hover:bg-[var(--color-brand-hovered)]'
                                            : 'bg-[var(--color-brand-light-solid)] hover:brightness-95'
                                        }`
                                        : `flex w-full items-center gap-3 px-4 py-2 min-h-[52px] text-left transition-all duration-150 active:opacity-60 ${rowHover}`;
                                    return (
                                        <div key={row.key}>
                                            {hasSwitch || row.onClick ? (
                                                hasSwitch ? (
                                                    <div onClick={doSwitch} className={`${rowClasses} cursor-pointer`}>
                                                        {content}
                                                    </div>
                                                ) : (
                                                    <button type="button" onClick={row.onClick} className={rowClasses}>
                                                        {content}
                                                    </button>
                                                )
                                            ) : (
                                                <div className={rowClasses}>{content}</div>
                                            )}
                                            {!isLast && <div className={`h-px w-full ${separatorColor}`} />}
                                        </div>
                                    );
                                })}
                            </div>
                            {group.footer && (
                                <p className={`px-4 pt-1.5 text-[13px] leading-snug ${secondaryColor}`}>
                                    {group.footer}
                                </p>
                            )}
                        </section>
                        );
                    })}
                    {normalizedQuery && visibleGroups.length === 0 && (
                        <p className={`px-4 py-8 text-center text-[15px] ${secondaryColor}`}>
                            {t('search.no_results', { defaultValue: 'No results found.' })}
                        </p>
                    )}
                </div>
            </div>

            <LanguageSelectorModal
                isOpen={isLangModalOpen}
                onClose={() => setIsLangModalOpen(false)}
            />

            <ConfirmationModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={handleLogoutConfirm}
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
        </div>
    );
}
