import React, { useMemo, useState } from 'react';
import { useNavigate } from '@/router';
import { useTranslation } from 'react-i18next';
import {
    Check,
    Copy,
    Share,
    Sparkles,
    Gift,
    Users,
} from 'lucide-react';
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

    const divider = <div className="h-px w-full bg-[var(--cv-inner-border)]" />;

    const stats = [
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
    ];

    const steps = [
        { num: '1', title: t('referrals.step_send', { defaultValue: 'Send Invitation' }), desc: t('referrals.step_send_desc', { defaultValue: 'Share your unique link with friends.' }) },
        { num: '2', title: t('referrals.step_join', { defaultValue: 'Friends Join' }), desc: t('referrals.step_join_desc', { defaultValue: 'They create and verify an account.' }) },
        { num: '3', title: t('referrals.step_reward', { defaultValue: 'Get Rewarded' }), desc: t('referrals.step_reward_desc', { defaultValue: `You instantly receive 50 ${DEFAULT_TOKEN_SYMBOL}.`, token: DEFAULT_TOKEN_SYMBOL }) },
    ];

    return (
        <div className="skyline-page-scroll w-full bg-[var(--cv-page-bg)] text-[var(--cv-neutral-1)]">
            <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col gap-5 px-4 pb-10 pt-4 md:px-6">
                {/* Invite */}
                <section className="overflow-hidden rounded-[12px] border border-[var(--cv-card-border)] bg-[var(--cv-card-bg-solid)]">
                    <div className="flex items-center gap-3 p-4">
                        <span className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-light-solid)] text-[var(--color-brand)]">
                            <Gift className="h-[18px] w-[18px]" strokeWidth={2} />
                        </span>
                        <div className="min-w-0">
                            <p className="text-[1.0rem] font-semibold leading-tight">
                                {t('referrals.invite_title', { defaultValue: 'Invite Friends' })}
                            </p>
                            <p className="text-[0.765rem] leading-snug text-[var(--cv-neutral-2)]">
                                {t('referrals.invite_subtitle', {
                                    defaultValue: `You receive 50 ${DEFAULT_TOKEN_SYMBOL} tokens instantly upon their successful registration.`,
                                    token: DEFAULT_TOKEN_SYMBOL,
                                })}
                            </p>
                        </div>
                    </div>
                    {divider}
                    <div className="flex flex-col gap-3 p-4">
                        <div className="flex min-w-0 items-center gap-3 rounded-[10px] bg-[var(--cv-surface-2)] px-3 py-3">
                            <Users className="h-[18px] w-[18px] shrink-0 text-[var(--cv-neutral-3)]" />
                            <p className="min-w-0 flex-1 truncate text-[0.824rem] font-medium">{referralLink}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={copyToClipboard}
                                disabled={!referralCode}
                                className={`flex h-11 items-center justify-center gap-2 rounded-[16px] text-[0.882rem] font-semibold transition-all active:scale-[0.98] disabled:cursor-default disabled:opacity-50 ${copied
                                    ? 'bg-[var(--cv-success)] text-white'
                                    : 'bg-[var(--cv-neutral-1)] text-[var(--cv-page-bg)] hover:bg-[var(--cv-neutral-1-hover)]'
                                    }`}
                            >
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                {copied ? t('action.copied', { defaultValue: 'Copied' }) : t('action.copy', { defaultValue: 'Copy' })}
                            </button>
                            <button
                                type="button"
                                onClick={handleShare}
                                disabled={!referralCode}
                                className="flex h-11 items-center justify-center gap-2 rounded-[16px] bg-[var(--color-brand)] text-[0.882rem] font-semibold text-white transition-all hover:bg-[var(--color-brand-hovered)] active:scale-[0.98] disabled:cursor-default disabled:opacity-50"
                            >
                                <Share className="h-4 w-4" />
                                {t('action.share', { defaultValue: 'Share' })}
                            </button>
                        </div>
                    </div>
                </section>

                {/* Reward status */}
                <section className="overflow-hidden rounded-[12px] border border-[var(--cv-card-border)] bg-[var(--cv-card-bg-solid)]">
                    <div className="flex items-center gap-3 p-4">
                        <span className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-light-solid)] text-[var(--color-brand)]">
                            <Sparkles className="h-[18px] w-[18px]" strokeWidth={2} />
                        </span>
                        <p className="text-[1.0rem] font-semibold leading-tight">
                            {t('referrals.reward_status', { defaultValue: 'Reward status' })}
                        </p>
                    </div>
                    {divider}
                    {stats.map((stat, i) => (
                        <React.Fragment key={stat.label}>
                            <div className="flex items-center justify-between gap-4 p-4">
                                <div className="min-w-0">
                                    <p className="text-[0.882rem] font-medium leading-tight">{stat.label}</p>
                                    <p className="mt-0.5 truncate text-[0.765rem] leading-tight text-[var(--cv-neutral-2)]">{stat.subtitle}</p>
                                </div>
                                <div className="shrink-0 text-end">
                                    <p className="text-[1.294rem] font-bold leading-none">{stat.value}</p>
                                    {stat.suffix && (
                                        <p className="mt-1 text-[0.765rem] font-semibold normal-case tracking-wide text-[var(--cv-neutral-2)]">{stat.suffix}</p>
                                    )}
                                </div>
                            </div>
                            {i < stats.length - 1 && divider}
                        </React.Fragment>
                    ))}
                </section>

                {/* How to earn */}
                <section className="overflow-hidden rounded-[12px] border border-[var(--cv-card-border)] bg-[var(--cv-card-bg-solid)]">
                    <div className="flex items-center gap-3 p-4">
                        <span className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-light-solid)] text-[var(--color-brand)]">
                            <Sparkles className="h-[18px] w-[18px]" strokeWidth={2} />
                        </span>
                        <p className="text-[1.0rem] font-semibold leading-tight">
                            {t('referrals.how_to_earn', { defaultValue: 'How to Earn' })}
                        </p>
                    </div>
                    {divider}
                    {steps.map((step, i) => (
                        <React.Fragment key={step.num}>
                            <div className="flex items-center gap-3 p-4">
                                <span className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-light-solid)] text-[0.824rem] font-bold text-[var(--color-brand)]">
                                    {step.num}
                                </span>
                                <div className="min-w-0">
                                    <p className="text-[0.882rem] font-semibold leading-tight">{step.title}</p>
                                    <p className="mt-0.5 text-[0.765rem] leading-snug text-[var(--cv-neutral-2)]">{step.desc}</p>
                                </div>
                            </div>
                            {i < steps.length - 1 && divider}
                        </React.Fragment>
                    ))}
                </section>

                {/* Recent referrals */}
                <section className="overflow-hidden rounded-[12px] border border-[var(--cv-card-border)] bg-[var(--cv-card-bg-solid)]">
                    <div className="flex items-center justify-between gap-3 p-4">
                        <p className="text-[1.0rem] font-semibold leading-tight">
                            {t('referrals.recent_title', { defaultValue: 'Recent Referrals' })}
                        </p>
                        <span className="rounded-full bg-[var(--cv-surface-3)] px-2.5 py-1 text-[0.765rem] font-semibold text-[var(--cv-neutral-2)]">
                            {referralHistory.length}
                        </span>
                    </div>
                    {divider}
                    {referralHistory.length === 0 ? (
                        <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                            <Users className="h-9 w-9 text-[var(--cv-neutral-3)]" />
                            <p className="mt-4 text-[0.882rem] font-semibold">
                                {t('referrals.no_referrals', { defaultValue: 'No referrals yet' })}
                            </p>
                            <p className="mt-1 max-w-xs text-[0.765rem] leading-snug text-[var(--cv-neutral-2)]">
                                {t('referrals.no_referrals_desc', { defaultValue: 'Share your link and completed registrations will appear here.' })}
                            </p>
                        </div>
                    ) : (
                        referralHistory.map((engagement: ReferralEngagement, idx: number) => {
                            const avatarSrc = getSafeImageURLEx(engagement.engager?.public_id, engagement.engager?.avatar || undefined, 'thumbnail') || undefined;
                            const username = engagement.engager?.username || 'Member';
                            const isLast = idx === referralHistory.length - 1;
                            return (
                                <React.Fragment key={engagement.id || `${username}-${idx}`}>
                                    <button
                                        type="button"
                                        onClick={() => engagement.engager?.username && navigate(`/${engagement.engager.username}`)}
                                        className="flex w-full items-center justify-between gap-3 p-4 text-start transition-colors hover:bg-[var(--cv-surface-2-hover)]"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-[var(--cv-surface-2)]">
                                                {avatarSrc ? (
                                                    <img className="h-full w-full object-cover" src={avatarSrc} alt={username} />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-[0.882rem] font-semibold normal-case text-[var(--cv-neutral-2)]">
                                                        {username.slice(0, 1)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-[0.882rem] font-semibold leading-tight">{username}</p>
                                                <p className="text-[0.765rem] text-[var(--cv-neutral-2)]">
                                                    {engagement.created_at ? formatTime(engagement.created_at) : ''}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="shrink-0 text-end">
                                            <p className="text-[0.882rem] font-semibold leading-tight">{engagement.details?.amount || 0}</p>
                                            <p className="text-[0.765rem] font-semibold normal-case tracking-wide text-[var(--cv-neutral-2)]">{DEFAULT_TOKEN_SYMBOL}</p>
                                        </div>
                                    </button>
                                    {!isLast && divider}
                                </React.Fragment>
                            );
                        })
                    )}
                </section>
            </div>
        </div>
    );
};

export default ReferralsScreen;
