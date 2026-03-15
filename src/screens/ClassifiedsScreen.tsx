import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  X,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  MoreHorizontal,
  Globe,
  Briefcase
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import Container from '../components/ui/Container';
import { useTranslation } from 'react-i18next';

interface Topic {
  id: string;
  type: 'seeking' | 'hiring';
  title: string;
  description: string;
  details: string;
  author: {
    name: string;
    avatar: string;
    isVerified: boolean;
  };
  timestamp: string;
}

const MOCK_TOPICS: Topic[] = [
  {
    id: '1',
    type: 'hiring',
    title: 'Senior React Developer',
    description: 'Yeni nesil fintech projemiz için deneyimli bir React geliştirici arıyoruz. Modern tech stack ve yüksek otonomi.',
    details: 'Full-time • $4000 - $6000 • Remote',
    author: {
      name: 'TechFlow Studio',
      avatar: 'https://i.pravatar.cc/150?u=techflow',
      isVerified: true
    },
    timestamp: '12:45'
  },
  {
    id: '2',
    type: 'seeking',
    title: 'Senior Product Designer',
    description: '5+ yıl deneyim. B2B SaaS ve mobil uygulama odaklı çalışıyorum. Yeni meydan okumalara hazırım.',
    details: 'Freelance/Full-time • İstanbul • Immediate',
    author: {
      name: 'Can Demir',
      avatar: 'https://i.pravatar.cc/150?u=can',
      isVerified: false
    },
    timestamp: '14:20'
  }
];

// Generate more dummy data for scroll testing
const GENERATED_TOPICS: Topic[] = Array.from({ length: 20 }).map((_, i) => {
  const isHiring = i % 2 === 0;
  return {
    id: (i + 3).toString(),
    type: isHiring ? 'hiring' : 'seeking',
    title: isHiring ? `Senior ${['Backend', 'Product', 'DevOps', 'Mobile'][i % 4]} Engineer` : `${['Full Stack', 'UI Designer', 'Project Manager', 'Data Scientist'][i % 4]} looking for projects`,
    description: isHiring
      ? 'Hızla büyüyen ekibimize katılmak üzere yetenekli çalışma arkadaşları arıyoruz.'
      : 'Uçtan uca ürün geliştirme süreçlerinde deneyimliyim, yeni fırsatları değerlendirebilirim.',
    details: 'Full-time • Remote • 5+ Years Exp',
    author: {
      name: isHiring ? `Company ${i}` : `Professional ${i}`,
      avatar: `https://i.pravatar.cc/150?u=${i}`,
      isVerified: i % 3 === 0
    },
    timestamp: `${i + 1} saat önce`
  };
});

const ALL_TOPICS = [...MOCK_TOPICS, ...GENERATED_TOPICS];

export default function ClassifiedsScreen() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const dark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<'seeking' | 'hiring'>('hiring');
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTopics = ALL_TOPICS.filter(t => t.type === activeTab &&
    (t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSelectTopic = (topic: Topic) => {
    navigate(`/classifieds/${topic.id}`);
  };

  return (
    <Container className={`${dark ? 'bg-gray-950 text-white' : 'bg-white text-slate-900'}`}>

      {/* Integrated Professional Header - Fixed within Container context */}
      <header className={`sticky top-0 z-50 border-b backdrop-blur-xl ${dark ? 'bg-gray-950/95 border-gray-800' : 'bg-white/95 border-slate-200'}`}>
        <div className="w-full flex items-stretch h-14 md:h-16">

          {/* Brand/Logo Area */}
          <div className={`flex items-center px-4 md:px-6 border-r ${dark ? 'border-gray-800' : 'border-slate-200'}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${dark ? 'bg-white text-black' : 'bg-slate-900 text-white'}`}>
              <Briefcase className="w-4 h-4" />
            </div>
          </div>

          {/* Navigation Area */}
          <div className="flex-1 flex items-center justify-between px-3 md:px-6">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('hiring')}
                className={`px-3 md:px-5 h-9 md:h-10 rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'hiring'
                  ? dark ? 'bg-white text-black' : 'bg-slate-900 text-white'
                  : dark ? 'text-gray-500 hover:bg-white/5' : 'text-slate-400 hover:bg-slate-50'
                  }`}
              >
                {t('classifieds.hire')}
              </button>
              <button
                onClick={() => setActiveTab('seeking')}
                className={`px-3 md:px-5 h-9 md:h-10 rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'seeking'
                  ? dark ? 'bg-white text-black' : 'bg-slate-900 text-white'
                  : dark ? 'text-gray-500 hover:bg-white/5' : 'text-slate-400 hover:bg-slate-50'
                  }`}
              >
                {t('classifieds.jobs')}
              </button>
            </div>

            {/* Smart Search Input */}
            <div className="flex-1 max-w-[240px] lg:max-w-sm ml-4 hidden md:flex items-center h-10 relative group">
              <Search className={`absolute left-3.5 w-4 h-4 transition-colors ${dark ? 'text-gray-600 group-focus-within:text-white' : 'text-slate-300 group-focus-within:text-slate-900'}`} />
              <input
                type="text"
                placeholder={t(activeTab === 'hiring' ? 'classifieds.search_placeholder_hiring' : 'classifieds.search_placeholder_seeking')}
                className={`w-full h-full pl-10 pr-4 rounded-xl border text-xs font-bold transition-all focus:outline-none focus:ring-1 focus:ring-indigo-500/20 ${dark
                  ? 'bg-white/[0.03] border-gray-800 placeholder:text-gray-700 text-white focus:bg-white/[0.06] focus:border-gray-700'
                  : 'bg-slate-50 border-slate-100 placeholder:text-slate-400 text-slate-900 focus:bg-white focus:border-slate-300'
                  }`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Action Area */}
          <div className={`flex items-center px-4 md:px-6 border-l ${dark ? 'border-gray-800' : 'border-slate-200'}`}>
            <button
              onClick={() => setIsAddingTopic(true)}
              className={`h-9 md:h-11 px-4 md:px-5 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] ${dark
                ? 'bg-white text-black hover:bg-gray-100'
                : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content with Optimized Scrolling Styles from NearbyScreen */}
      <main
        className="w-full relative"
        style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full"
        >
          {/* Global Meta Info Box */}
          <div className={`px-6 py-4 border-b flex items-center justify-between ${dark ? 'bg-gray-950/40 border-gray-800' : 'bg-slate-50/50 border-slate-100'}`}>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${dark ? 'text-gray-600' : 'text-slate-400'}`}>
                <Globe className="w-3.5 h-3.5" />
                {t('classifieds.global_network')}
              </div>
              <div className={`hidden sm:block h-3 w-px ${dark ? 'bg-gray-800' : 'bg-slate-200'}`} />
              <div className={`text-[10px] font-mono font-bold ${dark ? 'text-indigo-500/80' : 'text-indigo-600'}`}>
                {t('classifieds.active_listings', { count: filteredTopics.length })}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className={`p-1.5 rounded-lg transition-colors ${dark ? 'hover:bg-white/5 text-gray-700' : 'hover:bg-slate-200 text-slate-400'}`}>
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Feed List */}
          <div className={`divide-y ${dark ? 'divide-gray-800' : 'divide-slate-100'}`}>
            {filteredTopics.length > 0 ? (
              filteredTopics.map((topic) => (
                <div
                  key={topic.id}
                  onClick={() => handleSelectTopic(topic)}
                  className={`group flex flex-col p-6 md:p-10 transition-all cursor-pointer ${dark ? 'hover:bg-white/[0.015]' : 'hover:bg-slate-50/40'}`}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <img src={topic.author.avatar} className="w-10 h-10 rounded-xl grayscale border border-slate-200/50" alt="" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-black uppercase tracking-wider ${dark ? 'text-white' : 'text-slate-900'}`}>{topic.author.name}</span>
                          {topic.author.isVerified && <ShieldCheck className={`w-3.5 h-3.5 ${dark ? 'text-blue-400' : 'text-indigo-600'}`} />}
                        </div>
                        <span className={`text-[9px] font-mono font-bold tracking-tighter ${dark ? 'text-gray-600' : 'text-slate-400'}`}>#{topic.id} • {topic.timestamp}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="space-y-4">
                    <h3 className={`text-2xl md:text-3xl font-bold tracking-tighter leading-tight group-hover:text-indigo-500 transition-colors ${dark ? 'text-white' : 'text-slate-900'}`}>
                      {topic.title}
                    </h3>
                    <p className={`text-sm md:text-base leading-relaxed line-clamp-2 ${dark ? 'text-gray-500' : 'text-slate-500'}`}>
                      {topic.description}
                    </p>
                  </div>

                  {/* Card Footer */}
                  <div className="flex items-center justify-between pt-8">
                    <div className="flex flex-wrap items-center gap-3">
                      {topic.details.split('•').map((item, idx) => (
                        <div key={idx} className={`flex items-center gap-2 text-[9px] md:text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border ${dark ? 'border-gray-800 text-gray-500 bg-gray-900/40' : 'border-slate-100 text-slate-500 bg-white'}`}>
                          {idx === 0 && <Briefcase className="w-3 h-3 text-indigo-500" />}
                          {idx === 1 && <Globe className="w-3 h-3 text-emerald-500" />}
                          {idx === 2 && <MapPin className="w-3 h-3 text-rose-500" />}
                          {item.trim()}
                        </div>
                      ))}
                    </div>
                    <div className={`hidden md:flex items-center gap-4 text-[11px] font-black uppercase tracking-widest group-hover:translate-x-2 transition-transform ${dark ? 'text-white' : 'text-slate-900'}`}>
                      {t('classifieds.detail')}
                      <ArrowUpRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-40 text-center">
                <Search className={`w-12 h-12 mx-auto mb-6 ${dark ? 'text-gray-800' : 'text-slate-200'}`} />
                <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${dark ? 'text-gray-700' : 'text-slate-300'}`}>{t('classifieds.no_results')}</p>
                <button onClick={() => setSearchQuery('')} className="mt-4 text-[10px] font-black uppercase text-indigo-500 hover:underline">{t('classifieds.clear_search')}</button>
              </div>
            )}
          </div>
        </motion.div>
      </main>

      {/* Adding Topic Modal */}
      <AnimatePresence>
        {isAddingTopic && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-lg border rounded-[32px] overflow-hidden ${dark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
            >
              <div className={`flex items-center justify-between px-8 h-16 border-b ${dark ? 'bg-gray-950/50 border-gray-800' : 'bg-slate-50 border-slate-200'}`}>
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em]">{t('classifieds.new_topic')}</h3>
                <button onClick={() => setIsAddingTopic(false)} className="p-2"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-8 space-y-6">
                {/* Modal content simplified for focus on layout/scroll */}
                <div className="h-40 flex items-center justify-center text-gray-500">{t('classifieds.form_description')}</div>
                <button className={`w-full h-14 rounded-2xl font-black uppercase tracking-widest ${dark ? 'bg-white text-black' : 'bg-slate-900 text-white'}`}>{t('classifieds.publish')}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Container>
  );
}
