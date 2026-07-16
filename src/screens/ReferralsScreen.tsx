import React, { useMemo, useState } from 'react';
import { useNavigate } from '@/router';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    Check,
    Copy,
    Share,
    Sparkles,
    Gift,
    Users
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { getSafeImageURLEx } from '../helpers/helpers';
import { DEFAULT_TOKEN_SYMBOL } from '../constants/constants';



interface ReferralEngagement {
    id?: string;
    kind?: string;
    created_at?: string;
    details?: {
        amount?: number;
    };
    engager?: {
        id?: string;
        public_id?: number | string;
        username?: string;
        avatar?: string | null;
    };
}

const ReferralsScreen: React.FC = () => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation('common');
    const [copied, setCopied] = useState(false);

    const referralCode = user?.public_id?.toString() ?? '';
    const referralLink = `https://coolvibes.lgbt/ref/${referralCode}`;
    const referralCount = user?.engagements?.counts?.referral_count || 0;
    const referralAmount = user?.engagements?.counts?.referral_amount || 0;
    const referralHistory = useMemo(
        () => user?.engagements?.engagement_details?.filter((e: ReferralEngagement) => e.kind === 'referral') || [],
        [user?.engagements?.engagement_details]
    );

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(referralLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const formatTime = (createdAt: string) => {
        const now = new Date();
        const created = new Date(createdAt);
        const diffMs = now.getTime() - created.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) {
            return t('notifications.just_now', { defaultValue: 'Just now' });
        } else if (diffMins < 60) {
            return diffMins === 1
                ? t('notifications.min_ago', { count: diffMins, defaultValue: '1 min ago' })
                : t('notifications.mins_ago', { count: diffMins, defaultValue: `${diffMins} mins ago` });
        } else if (diffHours < 24) {
            return diffHours === 1
                ? t('notifications.hour_ago', { count: diffHours, defaultValue: '1 hour ago' })
                : t('notifications.hours_ago', { count: diffHours, defaultValue: `${diffHours} hours ago` });
        } else if (diffDays < 7) {
            return diffDays === 1
                ? t('notifications.day_ago', { count: diffDays, defaultValue: '1 day ago' })
                : t('notifications.days_ago', { count: diffDays, defaultValue: `${diffDays} days ago` });
        } else {
            return created.toLocaleDateString();
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Join CoolVibes! 🌈',
                    text: `Join me on CoolVibes and earn free ${DEFAULT_TOKEN_SYMBOL} tokens!`,
                    url: referralLink,
                });
            } catch (err) {
                console.debug('Share cancelled or failed:', err);
            }
        } else {
            copyToClipboard();
        }
    };

    const isDark = theme === 'dark';
    const textColor = isDark ? 'text-white' : 'text-slate-950';
    const secTextColor = isDark ? 'text-zinc-400' : 'text-slate-500';
    const panelClassName = isDark
        ? 'cv-card-surface-soft border-white/10'
        : 'border-white/70 bg-white/75';

    return (
        <div className={`skyline-page-scroll w-full ${textColor}`}>
            <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col gap-5 px-1 pb-8 pt-24 md:px-2 md:pt-28">
                <div className="grid w-full gap-5 lg:grid-cols-[1.18fr_0.82fr]">
                    <motion.section
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                        className={`relative overflow-hidden rounded-[30px] border p-5 backdrop-blur-3xl md:p-6 ${panelClassName} shadow-[0_24px_70px_-48px_rgba(15,23,42,0.55)]`}
                    >
                        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-sky-500/50 to-transparent" />
                        <div className="flex flex-col gap-5">
                            <div className="flex items-center gap-3">
                                <div className="sky-glow flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white">
                                    <Gift className="h-6 w-6" strokeWidth={1.8} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[9px] font-black uppercase tracking-[0.32em] text-sky-600">
                                        {t('app.nav.referrals', { defaultValue: 'Referrals' })}
                                    </p>
                                    <h2 className="mt-1 truncate text-2xl font-black leading-none tracking-tight md:text-3xl">
                                        {t('referrals.invite_title', { defaultValue: 'Invite Friends' })}
                                    </h2>
                                </div>
                            </div>
                            <p className={`max-w-lg text-sm font-semibold leading-relaxed md:text-[15px] ${secTextColor}`}>
                                {t('referrals.invite_subtitle', {
                                    defaultValue: `You receive 50 ${DEFAULT_TOKEN_SYMBOL} tokens instantly upon their successful registration.`,
                                    token: DEFAULT_TOKEN_SYMBOL,
                                })}
                            </p>

                            <div className={`flex flex-col gap-2 rounded-[26px] border p-2 md:flex-row md:items-center ${isDark ? 'cv-card-surface-muted border-white/10' : 'border-slate-200 bg-white/70'}`}>
                                <div className={`flex min-w-0 flex-1 items-center gap-3 rounded-[20px] px-3 py-3 ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                                    <Users className={`h-5 w-5 shrink-0 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`} />
                                    <p className="truncate text-sm font-bold">{referralLink}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-2 md:flex md:shrink-0">
                                    <button
                                        type="button"
                                        onClick={copyToClipboard}
                                        disabled={!referralCode}
                                        className={`inline-flex h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-black transition-all disabled:cursor-default disabled:opacity-50 ${copied
                                            ? 'bg-emerald-500 text-white'
                                            : isDark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-slate-950 text-white hover:bg-slate-800'
                                            }`}
                                    >
                                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                        {copied ? t('action.copied', { defaultValue: 'Copied' }) : t('action.copy', { defaultValue: 'Copy' })}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleShare}
                                        disabled={!referralCode}
                                        className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-sky-600 px-4 text-sm font-black text-white transition-all hover:bg-sky-500 disabled:cursor-default disabled:opacity-50"
                                    >
                                        <Share className="h-4 w-4" />
                                        {t('action.share', { defaultValue: 'Share' })}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.section>

                    <motion.section
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.04, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                        className={`overflow-hidden rounded-[30px] border backdrop-blur-3xl ${panelClassName} shadow-[0_24px_70px_-48px_rgba(15,23,42,0.55)]`}
                    >
                        <div className="flex items-center gap-3 px-5 py-4 md:px-6">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${isDark ? 'bg-white/[0.08] text-zinc-300' : 'bg-white/80 text-slate-500'}`}>
                                <Sparkles className="h-5 w-5" />
                            </div>
                            <div>
                                <p className={`text-[11px] font-bold uppercase tracking-[0.2em] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                                    {t('referrals.overview', { defaultValue: 'Overview' })}
                                </p>
                                <p className="mt-0.5 text-sm font-black">
                                    {t('referrals.reward_status', { defaultValue: 'Reward status' })}
                                </p>
                            </div>
                        </div>

                        <div className={`divide-y ${isDark ? 'divide-white/5' : 'divide-white/70'}`}>
                            {[
                                {
                                    label: t('referrals.invited', { defaultValue: 'Invited' }),
                                    subtitle: t('referrals.successful_registrations', { defaultValue: 'Successful registrations' }),
                                    value: referralCount,
                                    suffix: '',
                                },
                                {
                                    label: t('referrals.tokens', { defaultValue: 'Tokens' }),
                                    subtitle: t('referrals.total_rewards', { defaultValue: 'Total referral rewards' }),
                                    value: referralAmount,
                                    suffix: DEFAULT_TOKEN_SYMBOL,
                                },
                            ].map((stat) => (
                                <div
                                    key={stat.label}
                                    className={`flex items-center justify-between gap-4 px-5 py-4 transition-colors md:px-6 ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-sky-50/70'}`}
                                >
                                    <div className="min-w-0">
                                        <p className="text-[15px] font-semibold leading-tight">{stat.label}</p>
                                        <p className={`mt-0.5 truncate text-[12px] leading-tight ${secTextColor}`}>{stat.subtitle}</p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="text-3xl font-black leading-none">{stat.value}</p>
                                        {stat.suffix && (
                                            <p className={`mt-1 text-[10px] font-black uppercase tracking-wider ${secTextColor}`}>{stat.suffix}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.section>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                    <motion.section
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.08, duration: 0.4 }}
                        className={`rounded-[32px] border p-5 backdrop-blur-3xl ${panelClassName} shadow-[0_28px_90px_-48px_rgba(15,23,42,0.45)]`}
                    >
                        <div className="mb-5 flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isDark ? 'bg-white/5 text-zinc-300' : 'bg-slate-100 text-slate-700'}`}>
                                <Sparkles className="h-5 w-5" />
                            </div>
                            <h3 className="text-base font-black tracking-tight">How to Earn</h3>
                        </div>

                        <div className="grid gap-3">
                            {[
                                { num: '1', title: 'Send Invitation', desc: 'Share your unique link with friends.' },
                                { num: '2', title: 'Friends Join', desc: 'They create and verify an account.' },
                                { num: '3', title: 'Get Rewarded', desc: `You instantly receive 50 ${DEFAULT_TOKEN_SYMBOL}.` },
                            ].map((step) => (
                                <div
                                    key={step.num}
                                    className={`flex gap-3 rounded-[24px] border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/70'}`}
                                >
                                    <div className="sky-glow flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black text-white">
                                        {step.num}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-sm font-black">{step.title}</h4>
                                        <p className={`mt-1 text-xs font-semibold leading-relaxed ${secTextColor}`}>{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.section>

                    <motion.section
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.14, duration: 0.4 }}
                        className={`rounded-[32px] border p-5 backdrop-blur-3xl ${panelClassName} shadow-[0_28px_90px_-48px_rgba(15,23,42,0.45)]`}
                    >
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.32em] text-sky-600">Activity</p>
                                <h3 className="mt-1 text-base font-black tracking-tight">Recent Referrals</h3>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${isDark ? 'bg-white/5 text-zinc-400' : 'bg-slate-100 text-slate-500'}`}>
                                {referralHistory.length}
                            </span>
                        </div>

                        {referralHistory.length === 0 ? (
                            <div className={`flex min-h-[220px] flex-col items-center justify-center rounded-[28px] border px-6 py-10 text-center ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/70'}`}>
                                <Users className={`h-10 w-10 ${isDark ? 'text-zinc-600' : 'text-slate-300'}`} />
                                <p className="mt-4 text-sm font-black">No referrals yet</p>
                                <p className={`mt-1 max-w-xs text-xs font-semibold leading-relaxed ${secTextColor}`}>
                                    Share your link and completed registrations will appear here.
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {referralHistory.map((engagement: ReferralEngagement, idx: number) => {
                                    const avatarSrc = getSafeImageURLEx(engagement.engager?.public_id, engagement.engager?.avatar || undefined, 'thumbnail') || undefined;
                                    const username = engagement.engager?.username || 'Member';
                                    return (
                                        <button
                                            key={engagement.id || `${username}-${idx}`}
                                            type="button"
                                            onClick={() => engagement.engager?.username && navigate(`/${engagement.engager.username}`)}
                                            className={`group flex items-center justify-between gap-3 rounded-[24px] border p-3 text-left transition-all hover:-translate-y-0.5 ${isDark ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-slate-200 bg-white/70 hover:bg-slate-50'}`}
                                        >
                                            <div className="flex min-w-0 items-center gap-3">
                                                <div className={`h-11 w-11 shrink-0 overflow-hidden rounded-full border ${isDark ? 'border-white/10 bg-zinc-900' : 'border-white bg-slate-100'}`}>
                                                    {avatarSrc ? (
                                                        <img className="h-full w-full object-cover" src={avatarSrc} alt={username} />
                                                    ) : (
                                                        <div className={`flex h-full w-full items-center justify-center text-sm font-black uppercase ${secTextColor}`}>
                                                            {username.slice(0, 1)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-black">{username}</p>
                                                    <p className={`text-xs font-semibold ${secTextColor}`}>
                                                        {engagement.created_at ? formatTime(engagement.created_at) : ''}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <p className="text-sm font-black">{engagement.details?.amount || 0}</p>
                                                <p className={`text-[10px] font-black uppercase tracking-wider ${secTextColor}`}>{DEFAULT_TOKEN_SYMBOL}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </motion.section>
                </div>
            </div>
        </div>
    );
};

export default ReferralsScreen;
