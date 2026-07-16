import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Bell,
  Globe,
  Heart,
  MessageSquare,
  Moon,
  Search,
  Shield,
  Sparkles,
  Sun,
  Users,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useSEO } from '../hooks/useSEO';
import AuthWizard from '../features/auth/AuthWizard';
import { DEFAULT_APP_MOTTO, DEFAULT_APP_NAME } from '../constants/constants';

const previewImages = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=900',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=900',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=900',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=900',
];

const LandingPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [isAuthWizardOpen, setIsAuthWizardOpen] = useState(false);

  useSEO({
    title: 'LGBTQIA+ Social Network & Gay Dating App',
    description: 'CoolVibes is a LGBTQIA+ social network and LGBT gay dating app. Connect, share, and build meaningful relationships worldwide.',
    keywords: 'gay social network, LGBTQIA+ social media, LGBT gay dating, LGBTQIA+ dating app, queer community, inclusive social platform, CoolVibes',
    canonical: '/landing',
    type: 'website',
  });

  return (
    <div className="cv-pride-hero-bg relative h-[100dvh] w-full overflow-hidden text-slate-950 transition-colors duration-700 dark:text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className={theme === 'dark' ? 'absolute inset-0 bg-gradient-to-b from-black/24 via-black/10 to-[#050505]/58' : 'absolute inset-0 bg-gradient-to-b from-white/10 via-white/18 to-slate-50/68'} />
      </div>

      <header className="fixed top-4 inset-x-0 z-[60] pointer-events-none flex justify-center px-4 md:top-8 md:px-12">
        <div className="flex w-full max-w-[1440px] items-center justify-between">
          <div className="elite-floating pointer-events-auto flex items-center gap-3 px-4 py-2 md:px-5 md:py-2.5">
            <div className="sky-glow flex h-9 w-9 items-center justify-center rounded-full text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase leading-none tracking-[0.34em]">{DEFAULT_APP_NAME}</span>
              <span className="mt-0.5 text-[8px] font-bold uppercase tracking-normal text-sky-600">{DEFAULT_APP_MOTTO}</span>
            </div>
          </div>

          <div className="pointer-events-auto flex items-center gap-2 md:gap-3">
            <div className="elite-floating hidden h-11 items-center gap-3 px-4 text-slate-400 md:flex">
              <Search className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Arama</span>
            </div>
            <button
              onClick={toggleTheme}
              className={`elite-btn elite-floating h-11 w-11 ${theme === 'dark' ? 'text-amber-300' : 'text-indigo-500'}`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button
              onClick={() => setIsAuthWizardOpen(true)}
              className="hidden h-11 items-center gap-2 rounded-full bg-sky-600 px-6 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-sky-600/25 transition hover:bg-sky-500 sm:flex"
            >
              Join
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid h-full max-w-[1440px] grid-cols-1 items-center gap-10 px-4 pb-28 pt-28 md:px-12 md:pb-36 md:pt-36 lg:grid-cols-12">
        <section className="lg:col-span-7">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl"
          >
            <p className="mb-5 text-[10px] font-black uppercase tracking-[0.34em] text-sky-700 dark:text-sky-300">
              {DEFAULT_APP_MOTTO}
            </p>
            <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-normal text-slate-950 drop-shadow-[0_16px_50px_rgba(255,255,255,0.45)] dark:text-white dark:drop-shadow-[0_20px_50px_rgba(0,0,0,0.55)] md:text-7xl xl:text-8xl">
              {DEFAULT_APP_NAME}
              <span className="block bg-[linear-gradient(90deg,#d04b36,#e36511,#ffba00,#00b180,#147aab,#675997)] bg-clip-text text-transparent drop-shadow-none">Rainbow</span>
              Community
            </h1>
            <p className={`mt-7 max-w-2xl text-base font-semibold leading-relaxed md:text-lg ${theme === 'dark' ? 'text-white/72' : 'text-slate-700'}`}>
              LGBTQ+ topluluğu için güvenli, renkli ve kapsayıcı sosyal keşif, sohbet ve bağlantı deneyimi.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => setIsAuthWizardOpen(true)}
                className="inline-flex h-14 items-center justify-center gap-3 rounded-full bg-slate-950 px-8 text-[12px] font-black uppercase tracking-[0.18em] text-white shadow-2xl shadow-slate-950/20 transition hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-white/90"
              >
                Başla
                <ArrowRight className="h-5 w-5" />
              </button>
              <button className={`inline-flex h-14 items-center justify-center gap-3 rounded-full border px-8 text-[12px] font-black uppercase tracking-[0.18em] transition ${theme === 'dark' ? 'border-white/12 bg-white/[0.08] text-white hover:bg-white/[0.12]' : 'border-white/80 bg-white/75 text-slate-950 hover:bg-white'}`}>
                <Globe className="h-5 w-5" />
                Explore
              </button>
            </div>
          </motion.div>
        </section>

        <section className="hidden lg:col-span-5 lg:block">
          <div className="grid grid-cols-2 gap-5">
            {previewImages.map((src, index) => (
              <motion.div
                key={src}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.08 }}
                className={`overflow-hidden rounded-[30px] border border-white/65 bg-white/55 p-3 shadow-[0_28px_80px_rgba(15,23,42,0.16)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.07] dark:shadow-black/40 ${index % 2 === 1 ? 'translate-y-10' : ''}`}
              >
                <div className="aspect-[3/4] overflow-hidden rounded-[24px]">
                  <img src={src} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      <div className="fixed bottom-5 left-1/2 z-[70] -translate-x-1/2 md:bottom-10">
        <div className="elite-floating flex items-center gap-1.5 p-2">
          {[
            { icon: Users, label: 'People' },
            { icon: Heart, label: 'Match' },
            { icon: MessageSquare, label: 'Chat', active: true },
            { icon: Bell, label: 'Alerts' },
            { icon: Shield, label: 'Safety' },
          ].map((item) => (
            <button
              key={item.label}
              title={item.label}
              className={`elite-btn relative h-11 w-11 md:h-12 md:w-12 ${item.active ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30' : theme === 'dark' ? 'text-zinc-500 hover:bg-zinc-800 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-sky-600'}`}
            >
              <item.icon className="h-5 w-5" />
            </button>
          ))}
        </div>
      </div>

      <AuthWizard isOpen={isAuthWizardOpen} onClose={() => setIsAuthWizardOpen(false)} />
    </div>
  );
};

export default LandingPage;
