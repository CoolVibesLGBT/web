import React from 'react';
import { motion, useAnimationFrame } from 'framer-motion';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  Infinity,
  ArrowRight,
  Award,
  Users,
  MessageCircle,
  HeartHandshake,
  Check,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const tiers = [
  {
    title: 'Creator',
    price: '$12',
    cadence: '/month',
    badge: 'Most Popular',
    description: 'Grow your vibe, unlock deeper analytics and priority exposure.',
    highlights: ['Unlimited Boosts', 'Advanced Insights', 'Priority Discoverability'],
    accent: 'from-violet-500/20 via-indigo-500/10 to-transparent',
  },
  {
    title: 'Icon',
    price: '$25',
    cadence: '/month',
    badge: 'All‑Access',
    description: 'For power users and tastemakers who lead every trend.',
    highlights: ['Concierge onboarding', 'Invite-only rooms', 'Revenue share perks'],
    accent: 'from-amber-400/25 via-orange-500/10 to-transparent',
  },
];

const valueProps = [
  { icon: Sparkles, title: 'Ultra Boosted Reach', text: 'Appear in premium carousels and curated feeds across CoolVibes.' },
  { icon: ShieldCheck, title: 'Verified Shield', text: 'Instant verification, anti-spam filter and safer conversations.' },
  { icon: MessageCircle, title: 'Priority Messaging', text: 'Jump to the top of inboxes with read receipts and VIP indicators.' },
  { icon: Users, title: 'Private Collectives', text: 'Host exclusive rooms, invite followers and sell digital perks.' },
];

const guarantees = [
  { icon: HeartHandshake, title: 'Cancel anytime, no lock-in.' },
  { icon: Award, title: '7-day satisfaction promise.' },
  { icon: ShieldCheck, title: 'Secure payments via Stripe.' },
];

const PremiumScreen: React.FC = () => {
  const glowRef = React.useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  useAnimationFrame((t) => {
    if (!glowRef.current) return;
    const x = 50 + Math.sin(t / 1800) * 20;
    const y = 40 + Math.cos(t / 2200) * 15;
    glowRef.current.style.setProperty('--glow-x', `${x}%`);
    glowRef.current.style.setProperty('--glow-y', `${y}%`);
  });

  return (
    <div
      className={`relative min-h-screen overflow-hidden ${
        isDarkMode
          ? 'bg-[#03030a] text-white'
          : 'bg-gradient-to-br from-white via-slate-50 to-slate-100 text-slate-900'
      }`}
    >
      <div
        ref={glowRef}
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background: isDarkMode
            ? 'radial-gradient(circle at var(--glow-x,50%) var(--glow-y,50%), rgba(99,102,241,0.35), transparent 45%)'
            : 'radial-gradient(circle at var(--glow-x,50%) var(--glow-y,50%), rgba(99,102,241,0.15), transparent 45%)',
        }}
      />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-24 pt-20 lg:px-10">
        <motion.section
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center text-center"
        >
          <div
            className={`mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.4em] ${
              isDarkMode ? 'border-white/10 bg-white/5 text-indigo-100' : 'border-indigo-100 bg-indigo-50 text-indigo-600'
            }`}
          >
            Premium
            <Zap className={`h-4 w-4 ${isDarkMode ? 'text-amber-400' : 'text-amber-500'}`} />
          </div>
          <h1 className="mb-4 text-3xl font-black leading-tight tracking-tight sm:text-5xl">
            Upgrade your vibe.
            <br />
            <span className="bg-gradient-to-r from-indigo-300 via-pink-200 to-amber-200 bg-clip-text text-transparent">
              Own every moment.
            </span>
          </h1>
          <p
            className={`max-w-2xl text-base sm:text-lg ${
              isDarkMode ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            CoolVibes Premium unlocks boosted discovery, deeper insights, concierge support and invite-only spaces built for creators.
          </p>
          <div
            className={`mt-8 flex flex-wrap justify-center gap-4 text-sm ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className={`h-4 w-4 ${isDarkMode ? 'text-indigo-300' : 'text-indigo-500'}`} />
              Guaranteed profile boost
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className={`h-4 w-4 ${isDarkMode ? 'text-emerald-300' : 'text-emerald-500'}`} />
              Verified instantly
            </div>
            <div className="flex items-center gap-2">
              <Infinity className={`h-4 w-4 ${isDarkMode ? 'text-amber-300' : 'text-amber-500'}`} />
              Unlimited vibes
            </div>
          </div>
        </motion.section>

        <section className="grid gap-8 lg:grid-cols-2">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.title}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`relative overflow-hidden rounded-3xl border p-8 backdrop-blur-xl ${
                isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'
              }`}
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tier.accent}`} />
              <div className="relative flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className={`text-sm uppercase tracking-[0.3em] ${
                        isDarkMode ? 'text-white/60' : 'text-slate-500'
                      }`}
                    >
                      {tier.title}
                    </p>
                    <p className={`mt-1 text-3xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {tier.price}
                      <span
                        className={`text-base font-medium ${
                          isDarkMode ? 'text-white/60' : 'text-slate-500'
                        }`}
                      >
                        {tier.cadence}
                      </span>
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      isDarkMode ? 'border-white/20 text-white/80' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    {tier.badge}
                  </span>
                </div>
                <p
                  className={`text-sm ${
                    isDarkMode ? 'text-white/80' : 'text-slate-600'
                  }`}
                >
                  {tier.description}
                </p>
                <ul
                  className={`space-y-3 text-sm ${
                    isDarkMode ? 'text-white/80' : 'text-slate-600'
                  }`}
                >
                  {tier.highlights.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Check className={`h-4 w-4 ${isDarkMode ? 'text-emerald-300' : 'text-emerald-500'}`} />
                      {item}
                    </li>
                  ))}
                </ul>
                <button
                  className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                    isDarkMode
                      ? 'bg-white/90 text-slate-900 hover:bg-white'
                      : 'bg-slate-900 text-white hover:bg-black'
                  }`}
                >
                  Start {tier.title}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </section>

        <section
          className={`grid gap-6 rounded-4xl border p-6 backdrop-blur-3xl sm:grid-cols-2 ${
            isDarkMode ? 'border-white/5 bg-white/[0.02]' : 'border-slate-200 bg-white'
          }`}
        >
          {valueProps.map((item) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className={`rounded-3xl border p-5 ${
                isDarkMode ? 'border-white/5 bg-white/[0.02]' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div
                className={`mb-3 inline-flex rounded-2xl p-3 ${
                  isDarkMode ? 'bg-white/10 text-white' : 'bg-white text-slate-900 shadow-sm'
                }`}
              >
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {item.title}
              </h3>
              <p className={`mt-2 text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                {item.text}
              </p>
            </motion.div>
          ))}
        </section>

        <section
          className={`rounded-4xl border p-8 text-center backdrop-blur-xl ${
            isDarkMode ? 'border-white/5 bg-white/[0.02]' : 'border-slate-200 bg-white'
          }`}
        >
          <div
            className={`flex flex-wrap items-center justify-center gap-4 text-sm ${
              isDarkMode ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            {guarantees.map((item) => (
              <span
                key={item.title}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 ${
                  isDarkMode ? 'border-white/10' : 'border-slate-200'
                }`}
              >
                <item.icon className={`h-4 w-4 ${isDarkMode ? 'text-emerald-300' : 'text-emerald-500'}`} />
                {item.title}
              </span>
            ))}
          </div>
          <p
            className={`mt-6 text-sm ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Everything is included in CoolVibes Premium. Taxes may apply. Switching plans is seamless anytime.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PremiumScreen;