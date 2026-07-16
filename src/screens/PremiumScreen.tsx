import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  Crown,
  CreditCard,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from '@/router';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';

type BillingCycle = 'monthly' | 'yearly';

const planMeta = {
  monthly: {
    id: 'premium_monthly',
    price: '$11.99',
    cadence: '/month',
    badge: 'Flexible',
    save: null as string | null,
  },
  yearly: {
    id: 'premium_yearly',
    price: '$89.99',
    cadence: '/year',
    badge: 'Best value',
    save: 'Save 37%',
  },
};

const featureRows = [
  {
    icon: Video,
    title: 'Live hosting & guest requests',
    description: 'Open your own live stream and request to join live rooms.',
  },
  {
    icon: Users,
    title: 'Advanced Nearby modes',
    description: 'Unlock Bubble and Dome views in Nearby discovery.',
  },
  {
    icon: Sparkles,
    title: 'Priority visibility',
    description: 'Higher feed exposure for selected premium surfaces.',
  },
  {
    icon: ShieldCheck,
    title: 'Premium access badge',
    description: 'Show premium status across supported app surfaces.',
  },
];

const includeRows = [
  'Unlimited premium feature access',
  'All premium updates included',
  'Cancel anytime',
  'Secure payment flow',
];

const PremiumScreen: React.FC = () => {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { premiumFeatureEnabled, isPremiumUser } = usePremiumAccess();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('yearly');

  const activePlan = useMemo(() => planMeta[billingCycle], [billingCycle]);

  if (!premiumFeatureEnabled) {
    return (
      <div className={`skyline-page-scroll w-full ${dark ? 'text-white' : 'text-slate-950'}`}>
        <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col px-1 pb-8 pt-24 md:px-2 md:pt-28">
        <div className={`mx-auto w-full max-w-xl rounded-[30px] border p-8 text-center backdrop-blur-3xl ${dark ? 'cv-card-surface-soft border-white/10' : 'border-white/70 bg-white/75'} shadow-[0_24px_70px_-48px_rgba(15,23,42,0.55)]`}>
          <p className="text-xl font-semibold">
            {t('premium.disabled_title', { defaultValue: 'Premium is currently unavailable' })}
          </p>
          <p className={`mt-2 text-sm ${dark ? 'text-white/70' : 'text-black/70'}`}>
            {t('premium.disabled_description', { defaultValue: 'Please check back later.' })}
          </p>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`skyline-page-scroll w-full ${dark ? 'text-white' : 'text-slate-950'}`}>
      <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col gap-5 px-1 pb-8 pt-24 md:px-2 md:pt-28">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${dark ? 'border-white/20 bg-white/10 text-white' : 'border-black/15 bg-black/[0.04] text-black'}`}>
              <Crown className="h-4 w-4" />
              {t('premium.badge', { defaultValue: 'Premium' })}
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              {t('premium.title', { defaultValue: 'Upgrade to CoolVibes Premium' })}
            </h1>
            <p className={`mt-3 max-w-2xl text-sm sm:text-base ${dark ? 'text-white/75' : 'text-black/70'}`}>
              {t('premium.subtitle', {
                defaultValue: 'Unlock paid live features, advanced discovery modes, and premium visibility controls.',
              })}
            </p>
          </div>

          {isPremiumUser && (
            <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${dark ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200' : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700'}`}>
              {t('premium.active_member', { defaultValue: 'You already have Premium access' })}
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-[1.15fr_0.85fr]">
          <div className={`rounded-[30px] border p-5 backdrop-blur-3xl sm:p-6 ${dark ? 'cv-card-surface-soft border-white/10' : 'border-white/70 bg-white/75'} shadow-[0_24px_70px_-48px_rgba(15,23,42,0.55)]`}>
            <p className="text-sm font-semibold">
              {t('premium.whats_included', { defaultValue: "What's included" })}
            </p>
            <div className="mt-4 grid gap-3">
              {featureRows.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.04 }}
                  className={`flex items-start gap-3 rounded-2xl border p-4 ${dark ? 'cv-card-surface-muted border-white/10' : 'border-black/10 bg-white'}`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${dark ? 'bg-white/10 text-white' : 'bg-black/[0.06] text-black'}`}>
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{feature.title}</p>
                    <p className={`mt-1 text-xs ${dark ? 'text-white/70' : 'text-black/65'}`}>{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className={`rounded-[30px] border p-5 backdrop-blur-3xl sm:p-6 ${dark ? 'cv-card-surface-soft border-white/10' : 'border-white/70 bg-white/75'} shadow-[0_24px_70px_-48px_rgba(15,23,42,0.55)]`}>
            <div className={`inline-flex rounded-full p-1 ${dark ? 'bg-white/10' : 'bg-black/[0.06]'}`}>
              {(['monthly', 'yearly'] as BillingCycle[]).map((cycle) => (
                <button
                  key={cycle}
                  type="button"
                  onClick={() => setBillingCycle(cycle)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    billingCycle === cycle
                      ? dark
                        ? 'bg-white text-black'
                        : 'bg-black text-white'
                      : dark
                        ? 'text-white/70'
                        : 'text-black/70'
                  }`}
                >
                  {cycle === 'monthly'
                    ? t('premium.monthly', { defaultValue: 'Monthly' })
                    : t('premium.yearly', { defaultValue: 'Yearly' })}
                </button>
              ))}
            </div>

            <div className={`mt-5 rounded-2xl border p-4 ${dark ? 'cv-card-surface-muted border-white/10' : 'border-black/10 bg-white'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{activePlan.badge}</p>
                  <p className="mt-2 text-3xl font-black leading-none">
                    {activePlan.price}
                    <span className={`ml-1 text-sm font-medium ${dark ? 'text-white/70' : 'text-black/65'}`}>
                      {activePlan.cadence}
                    </span>
                  </p>
                </div>
                {activePlan.save && (
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${dark ? 'bg-emerald-400/15 text-emerald-200' : 'bg-emerald-500/10 text-emerald-700'}`}>
                    {activePlan.save}
                  </span>
                )}
              </div>

              <ul className="mt-4 space-y-2">
                {includeRows.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs">
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full ${dark ? 'bg-white/10 text-white' : 'bg-black/10 text-black'}`}>
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <span className={dark ? 'text-white/80' : 'text-black/70'}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={() => navigate(`/wallet?source=premium&plan=${activePlan.id}`)}
              className={`mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition ${
                dark ? 'bg-white text-black hover:bg-white/90' : 'bg-black text-white hover:bg-black/90'
              }`}
            >
              <CreditCard className="h-4 w-4" />
              {t('premium.checkout', { defaultValue: 'Proceed to payment' })}
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/settings')}
              className={`mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-full border text-xs font-semibold transition ${
                dark ? 'border-white/15 text-white/80 hover:bg-white/10' : 'border-black/15 text-black/75 hover:bg-black/[0.04]'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              {t('premium.manage', { defaultValue: 'Manage plan later' })}
            </button>

            <div className={`mt-4 flex items-start gap-2 rounded-xl border p-3 text-[11px] leading-relaxed ${dark ? 'cv-card-surface-muted border-white/10 text-white/70' : 'border-black/10 bg-white text-black/65'}`}>
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p>
                {t('premium.note', {
                  defaultValue: 'Subscription renews automatically until canceled. You can cancel anytime from your account settings.',
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumScreen;
