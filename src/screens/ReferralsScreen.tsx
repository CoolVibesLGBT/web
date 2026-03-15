import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Share,
    Gift,
    Users
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { getSafeImageURLEx } from '../helpers/helpers';
import { DEFAULT_TOKEN_SYMBOL } from '../constants/constants';



interface ReferralEngagement {
    id: string;
    kind: string;
    created_at: string;
    engager: {
        username: string;
        public_id: number;
        avatar?: string;
    };
    details?: {
        amount?: number;
    };
}

const ReferralsScreen: React.FC = () => {
    const { theme } = useTheme();
    const { user } = useAuth();
    console.log("ERSAN", user)
    const navigate = useNavigate();
    const { t } = useTranslation('common');
    const [copied, setCopied] = useState(false);

    const referralCode = user?.public_id?.toString();
    const referralLink = `https://coolvibes.lgbt/ref/${referralCode}`;

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

    // Match ProfileScreen palette
    const bgColor = isDark ? 'bg-gray-950' : 'bg-white';
    const cardBgColor = isDark ? 'bg-gray-950' : 'bg-white';
    const textColor = isDark ? 'text-white' : 'text-gray-900';
    const secTextColor = isDark ? 'text-gray-400' : 'text-gray-600';
    const borderColor = isDark ? 'border-gray-900' : 'border-gray-200/50';

    return (
            <div className={`flex flex-col h-[100dvh] w-full max-w-[600px] mx-auto ${bgColor} ${textColor}`}>
            {/* Standardized Header */}
            <div className={`flex-shrink-0 sticky top-0 z-30 flex items-center justify-between h-[64px] px-4 ${isDark ? 'bg-gray-950/95' : 'bg-white/95'} backdrop-blur-md border-b ${borderColor}`}>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate(-1)}
                        className={`p-2.5 -ml-2 rounded-full transition-all active:scale-90 ${isDark ? 'hover:bg-gray-900/50' : 'hover:bg-gray-100'}`}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-[17px] font-bold tracking-tight">
                        {t('menu.referrals', { defaultValue: 'Referrals' })}
                    </h1>
                </div>
            </div>

            <div className={`flex-1 overflow-y-auto scrollbar-hide pb-24`}>

                {/* Hero section */}
                <div className="px-5 pt-10 pb-6 text-center flex flex-col items-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className={`w-[60px] h-[60px] rounded-[20px] flex items-center justify-center mb-5 ${isDark ? 'bg-gray-900/30 text-white' : 'bg-white text-gray-900 shadow-[0_2px_10px_rgba(0,0,0,0.04)]'} `}
                    >
                        <Gift className="w-8 h-8" strokeWidth={1.5} />
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.4 }}
                        className="text-[28px] font-bold tracking-tight mb-2"
                    >
                        Invite Friends
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15, duration: 0.4 }}
                        className={`text-[15px] max-w-[300px] leading-relaxed font-medium ${secTextColor}`}
                    >
                        You receive 50 {DEFAULT_TOKEN_SYMBOL} tokens instantly upon their successful registration.
                    </motion.p>
                </div>

                <div className="px-4 space-y-4">

                    {/* Share Action Box */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                    >
                        <div className={`flex items-center p-1.5 rounded-[22px] ${cardBgColor} shadow-sm border-[0.5px] ${borderColor}`}>
                            <div className={`flex items-center justify-center w-11 h-11 rounded-[16px] flex-shrink-0 ml-1 ${isDark ? 'bg-gray-900/50' : 'bg-gray-100'}`}>
                                <Users className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                            </div>
                            <div className="flex-1 px-3 overflow-hidden">
                                <p className={`text-[15px] font-semibold truncate ${textColor}`}>{referralLink}</p>
                            </div>
                            <button
                                onClick={copyToClipboard}
                                className={`flex items-center justify-center px-5 h-10 rounded-[14px] font-semibold text-[14px] transition-all ml-2 ${copied
                                    ? (isDark ? 'bg-white text-black' : 'bg-black text-white')
                                    : isDark
                                        ? 'bg-white text-black hover:bg-gray-200'
                                        : 'bg-gray-900 text-white hover:bg-gray-800'
                                    }`}
                            >
                                {copied ? 'Copied' : 'Copy'}
                            </button>
                        </div>

                        <button
                            onClick={handleShare}
                            className={`w-full mt-3 h-[52px] rounded-[22px] flex items-center justify-center gap-2 text-[15px] font-semibold transition-transform active:scale-[0.98] ${cardBgColor} border-[0.5px] ${borderColor} shadow-sm`}
                        >
                            <Share className={`w-[18px] h-[18px] ${textColor}`} />
                            {t('action.share', { defaultValue: 'Share Link' })}
                        </button>
                    </motion.div>

                    {/* Unified Stats Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25, duration: 0.4 }}
                        className={`grid grid-cols-2 rounded-[24px] overflow-hidden ${cardBgColor} border-[0.5px] ${borderColor} shadow-sm mt-6`}
                    >
                        <div className={`p-5 border-r-[0.5px] ${borderColor}`}>
                            <p className={`text-[13px] font-semibold uppercase tracking-wider mb-2 pr-1 ${secTextColor}`}>Invited</p>
                            <p className="text-[32px] font-bold leading-none tracking-tight">{user?.engagements?.counts?.referral_count || 0}</p>
                        </div>
                        <div className="p-5">
                            <p className={`text-[13px] font-semibold uppercase tracking-wider mb-2 pr-1 ${secTextColor}`}>Tokens</p>
                            <div className="flex items-end gap-1.5">
                                <p className="text-[32px] font-bold leading-none tracking-tight">{user?.engagements?.counts?.referral_amount || 0}</p>
                                <span className={`text-[13px] font-bold pb-1 ${secTextColor}`}>LGBT</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* How It Works (Timeline) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.4 }}
                        className={`p-6 rounded-[24px] ${cardBgColor} border-[0.5px] ${borderColor} shadow-sm`}
                    >
                        <h3 className="text-[17px] font-semibold mb-6">How to Earn</h3>

                        <div className="relative">
                            {/* Vertical Line */}
                            <div className={`absolute top-4 bottom-4 left-[15px] w-[2px] ${isDark ? 'bg-gray-900' : 'bg-gray-200/50'}`} />

                            <div className="space-y-6 relative">
                                {[
                                    { num: '1', title: 'Send Invitation', desc: 'Share your unique link with friends.' },
                                    { num: '2', title: 'Friends Join', desc: 'They create and verify an account.' },
                                    { num: '3', title: 'Get Rewarded', desc: 'You instantly receive 50 LGBT.' },
                                ].map((step, idx) => (
                                    <div key={idx} className="flex gap-4 relative z-10">
                                        <div className={`w-[32px] h-[32px] rounded-full flex items-center justify-center font-bold text-[14px] flex-shrink-0 transition-colors ${isDark
                                            ? 'bg-gray-900/30 text-white border-2 border-gray-900'
                                            : 'bg-white text-gray-900 border-2 border-gray-200/50'
                                            }`}>
                                            {step.num}
                                        </div>
                                        <div className="pt-1 flex-1">
                                            <h4 className="text-[15px] font-semibold mb-0.5">{step.title}</h4>
                                            <p className={`text-[14px] ${secTextColor}`}>{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* History */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35, duration: 0.4 }}
                        className="pb-4 pt-2"
                    >
                        <div className="flex items-center justify-between px-2 mb-3">
                            <h3 className="text-[15px] font-semibold">Recent Activity</h3>
                        </div>

                        <div className={`rounded-[24px] overflow-hidden ${cardBgColor} border-[0.5px] ${borderColor} shadow-sm`}>
                            {user?.engagements?.engagement_details?.filter((e: ReferralEngagement) => e.kind === 'referral')?.map((engagement: ReferralEngagement, idx: number, arr: ReferralEngagement[]) => (
                                <div
                                    key={engagement.id}
                                    onClick={() => navigate(`/${engagement.engager.username}`)}
                                    className={`p-4 flex items-center justify-between cursor-pointer transition-colors duration-200 ${idx !== arr.length - 1
                                        ? `border-b-[0.5px] ${borderColor}`
                                        : ''
                                        } ${isDark ? 'hover:bg-gray-900/50' : 'hover:bg-gray-100'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-[14px] overflow-hidden flex items-center justify-center font-bold text-[14px] ${isDark ? 'bg-gray-900/50 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                                            <img className='w-full h-full object-cover' src={getSafeImageURLEx(engagement.engager.public_id, engagement.engager.avatar || undefined, "thumbnail") || undefined} alt={engagement.engager.username} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-[15px]">{engagement.engager.username}</p>
                                            <p className={`text-[13px] font-medium ${secTextColor}`}>{formatTime(engagement.created_at)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end">

                                        <>
                                            <span className="text-[15px] font-semibold text-gray-900 dark:text-white">{engagement.details?.amount}</span>
                                            <span className={`text-[11px] font-medium mt-0.5 ${secTextColor}`}>Completed</span>
                                        </>

                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                </div>
            </div>
        </div>
    );
};

export default ReferralsScreen;
