import React from 'react';
import { useParams, useNavigate, Link, useLocation } from '@/router';
import { motion } from 'framer-motion';
import { Shield, Cookie, FileText, Users, Eye, Info, HelpCircle, ChevronRight, HandFist } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useSEO } from '../hooks/useSEO';
import { DEFAULT_APP_NAME } from '@/constants/constants';

type LegalPage = 'privacy' | 'cookies' | 'terms' | 'guidelines' | 'accessibility' | 'about' | 'help' | 'conduct';

type LegalPageData = {
  icon: React.FC<{ className?: string; strokeWidth?: number }>;
  title: string;
  description: string;
  sections: { heading: string; body: string }[];
};

const PAGES: Record<LegalPage, LegalPageData> = {
  privacy: {
    icon: Shield,
    title: 'Privacy Policy',
    description: 'Last updated: March 2025',
    sections: [
      { heading: 'Information We Collect', body: 'We collect information you provide directly to us, such as when you create an account, update your profile, or communicate with other users. This includes your name, username, email address, password, and profile information.' },
      { heading: 'How We Use Your Information', body: 'We use the information we collect to provide, maintain, and improve our services, process transactions, send you technical notices and support messages, respond to your comments and questions, and to send you marketing communications where permitted by law.' },
      { heading: 'Data Sharing', body: 'We do not sell your personal information. We may share information with vendors, consultants, and other service providers who need access to such information to carry out work on our behalf.' },
      { heading: 'Data Retention', body: 'We retain your personal data for as long as necessary to provide the services and fulfill the purposes described in this policy, unless a longer retention period is required or permitted by law.' },
      { heading: 'Your Rights', body: 'Under GDPR, CCPA, and CPRA, you have the right to access, correct, or delete your personal data. You can also object to processing or request data portability at any time.' },
      { heading: 'Account & Data Deletion', body: 'You can delete your account and all associated data directly from Settings. Once initiated, all personal information, posts, and matches will be permanently removed from our active servers within 30 days.' },
      { heading: 'Contact', body: 'If you have any questions about this Privacy Policy, please contact us at privacy@coolvibes.lgbt.' },
    ],
  },
  cookies: {
    icon: Cookie,
    title: 'Cookie Policy',
    description: 'Last updated: March 2025',
    sections: [
      { heading: 'What Are Cookies', body: 'Cookies are small text files stored on your device when you visit our website. They help us remember your preferences and improve your experience.' },
      { heading: 'Essential Cookies', body: 'These cookies are required for the website to function and cannot be disabled. They include authentication tokens and session identifiers.' },
      { heading: 'Analytics Cookies', body: 'We use analytics cookies to understand how visitors interact with our site. This information is used to improve our services.' },
      { heading: 'Managing Cookies', body: 'You can control cookies through your browser settings. Note that disabling certain cookies may affect site functionality.' },
    ],
  },
  terms: {
    icon: FileText,
    title: 'Terms of Service',
    description: 'Last updated: March 2025',
    sections: [
      { heading: 'Age & Eligibility', body: 'You must be at least 18 years old to create an account and use CoolVibes. By using the service, you represent that you meet this age requirement.' },
      { heading: 'User Accounts', body: 'You are responsible for safeguarding your credentials. We reserve the right to verify identities and remove accounts that provide false information.' },
      { heading: 'Apple EULA Acknowledgement', body: 'By using CoolVibes on an iOS device, you acknowledge that these terms are between you and CoolVibes only, not Apple. Your use of the app must also comply with Apple’s Standard EULA.' },
      { heading: 'UGC Moderation SLA', body: 'We maintain a zero-tolerance policy for objectionable content. All reports regarding User Generated Content (UGC) are reviewed within 24 hours. We reserve the right to remove non-compliant content and ban users immediately.' },
      { heading: 'Prohibited Content', body: 'You may not post content that is illegal, harmful, or violates others’ rights. This includes a strict ban on "Sugar Dating", sexual solicitation, and any form of harassment.' },
      { heading: 'Zero Tolerance for CSAM', body: 'We have zero tolerance for Child Sexual Abuse Material (CSAM). Any such content will be removed immediately, and the involved accounts will be reported to the appropriate authorities.' },
      { heading: 'Termination', body: 'We may terminate or suspend your account at our sole discretion, without prior notice, for any conduct that we believe violates these Terms or is harmful to our community.' },
      { heading: 'Changes to Terms', body: 'We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.' },
    ],
  },
  guidelines: {
    icon: Users,
    title: 'Community Guidelines',
    description: 'Building a safe and inclusive space',
    sections: [
      { heading: 'Be Respectful', body: 'CoolVibes is a safe space for the LGBTQ+ community and allies. Treat all members with kindness and respect, regardless of their identity or background.' },
      { heading: 'Zero Tolerance for Hate', body: 'Hate speech, discrimination, harassment, or bullying based on sexual orientation, gender identity, race, ethnicity, religion, or any other characteristic is strictly prohibited.' },
      { heading: 'Authentic Profiles', body: 'Use your real identity or a consistent pseudonym. Impersonating other people or creating fake profiles is not allowed.' },
      { heading: 'Safe Content', body: 'Keep content appropriate. Explicit sexual content must be marked as such. Child sexual abuse material (CSAM) is strictly prohibited and will be reported to authorities.' },
      { heading: 'Safe Content', body: 'Keep content appropriate. Explicit sexual content must be marked as such. We maintain a zero-tolerance policy for harassment and abusive behavior.' },
      { heading: 'Reporting & Blocking', body: 'If you encounter any violation or feel unsafe, use the "Report" or "Block" features immediately. All reports are reviewed by our safety team within 24 hours to ensure a safe environment for all.' },
    ],
  },
  accessibility: {
    icon: Eye,
    title: 'Accessibility',
    description: 'Our commitment to an inclusive experience',
    sections: [
      { heading: 'Our Commitment', body: 'CoolVibes is committed to ensuring digital accessibility for people with disabilities. We continually improve the user experience for everyone.' },
      { heading: 'Standards', body: 'We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 at Level AA. These guidelines explain how to make web content more accessible.' },
      { heading: 'Features', body: 'Our platform supports screen readers, keyboard navigation, sufficient color contrast, and resizable text to ensure usability for all users.' },
      { heading: 'Feedback', body: 'We welcome your feedback on the accessibility of CoolVibes. Please contact us at accessibility@coolvibes.lgbt if you experience accessibility barriers.' },
    ],
  },
  about: {
    icon: Info,
    title: 'About CoolVibes',
    description: 'Stories from the Rainbow 🌈',
    sections: [
      { heading: 'Our Mission', body: 'CoolVibes is a social platform built for the LGBTQ+ community. Our mission is to create a safe, vibrant, and inclusive space where everyone can express themselves authentically.' },
      { heading: 'Our Values', body: 'We believe in authenticity, inclusivity, respect, and community. Every feature we build is designed with the safety and empowerment of LGBTQ+ individuals in mind.' },
      { heading: 'The Team', body: 'CoolVibes is built and maintained by a diverse, passionate team of people who believe in the power of community and connection.' },
      { heading: 'Contact', body: 'Reach us at hello@coolvibes.lgbt for partnerships, press inquiries, or general questions.' },
    ],
  },
  help: {
    icon: HelpCircle,
    title: 'Help Center',
    description: 'Frequently asked questions',
    sections: [
      { heading: 'Getting Started', body: 'Create an account, complete your profile, and start connecting with the LGBTQ+ community near you. Use the Nearby feature to discover people in your area.' },
      { heading: 'Account Issues', body: 'If you have trouble logging in, use the "Forgot Password" option on the login screen. If you continue to have issues, contact support@coolvibes.lgbt.' },
      { heading: 'Privacy & Safety', body: 'You can block or report any user from their profile page. Reports are reviewed by our moderation team within 24 hours.' },
      { heading: 'Deleting Your Account', body: 'You can delete your account from Settings → Account → Delete Account. This action is permanent and all your data will be removed within 30 days.' },
      { heading: 'Contact Support', body: 'For any other issues, email us at support@coolvibes.lgbt or use the in-app feedback button in Settings.' },
    ],
  },
  conduct: {
    icon: HandFist,
    title: 'Code of Conduct',
    description: 'Prioritizing safety and well-being for all members',
    sections: [
      { heading: 'Core Principle', body: 'CoolVibes prioritizes the safety and well-being of marginalized people over the comfort of privileged members. We are dedicated to providing a harassment-free experience for everyone.' },
      { heading: 'Prohibited Conduct', body: 'We do not tolerate harassment, bullying, or discrimination. This includes: no questioning of stated identities, no incitement of violence, no deliberate "outing", and no publication of private communications without consent.' },
      { heading: 'Zero Tolerance for Hate', body: 'No racist, sexist, cissexist, ableist, or otherwise oppressive behavior is allowed, whether casual or explicit. This includes harmful language or actions toward people of color, trans folks, and disabled members.' },
      { heading: 'Reporting Violations', body: 'If you see a violation, please use the report button on the profile or post. Our moderation team reviews all reports within 24 hours and will prioritize the well-being of those affected.' },
      { heading: 'Consequences', body: 'Participants asked to stop harmful behavior must comply immediately. Administrators may take any action deemed appropriate, up to and including permanent expulsion from CoolVibes.' },
      { heading: 'Community Accountability', body: 'We foster a culture of accountability and growth. We encourage discussions challenging privilege and respect the emotional labor provided by marginalized members of our community.' },
    ],
  },
};

const LEGAL_ENTRIES = Object.entries(PAGES) as [LegalPage, LegalPageData][];

const isLegalPage = (value?: string): value is LegalPage => Boolean(value && value in PAGES);

const LegalScreen: React.FC = () => {
  const { page: routePage } = useParams<{ page?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const pathPage = React.useMemo(() => {
    const match = location.pathname.match(/^\/legal\/([^/?#]+)/);
    return match ? decodeURIComponent(match[1]) : undefined;
  }, [location.pathname]);
  const requestedPage = routePage || pathPage;
  const currentPage = isLegalPage(requestedPage) ? requestedPage : undefined;
  const pageData = currentPage ? PAGES[currentPage] : null;

  // Dynamic SEO per sub-page
  useSEO({
    title: pageData ? pageData.title : 'Legal Center',
    description: pageData
      ? `${pageData.title} – ${pageData.description}. CoolVibes LGBTIQA+ app.`
      : 'Explore our Privacy Policy, Terms of Service, Community Guidelines and more. CoolVibes LGBTIQA+ dating app legal center.',
    canonical: currentPage ? `/legal/${currentPage}` : '/legal',
    keywords: `CoolVibes legal, ${pageData?.title || 'privacy policy terms'}, LGBTIQA+ app`,
    noindex: false,
  });

  const isDark = theme === 'dark';
  const textColor = isDark ? 'text-white' : 'text-slate-950';
  const secTextColor = isDark ? 'text-zinc-500' : 'text-slate-500';
  const panelClass = isDark
    ? 'cv-card-surface-soft border-white/10'
    : 'border-white/70 bg-white/75';
  const mutedPanelClass = isDark
    ? 'cv-card-surface-muted border-white/10'
    : 'border-slate-200/70 bg-white/70';
  const dividerClass = isDark ? 'border-white/10' : 'border-slate-200/80';
  const pillClass = isDark ? 'bg-white/[0.04] text-zinc-400' : 'bg-white/70 text-slate-500';

  // If no page is specified, show the index page
  if (!requestedPage) {
    return (
      <div className={`skyline-page-scroll w-full ${textColor}`}>
        <div className="mx-auto flex min-h-full w-full max-w-7xl flex-col gap-5 px-1 pb-8 pt-24 md:px-2 md:pt-28">
          <section className={`border-b pb-5 ${dividerClass}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className={`text-[10px] font-black uppercase tracking-[0.22em] ${isDark ? 'text-sky-300' : 'text-sky-700'}`}>
                  {DEFAULT_APP_NAME}
                </p>
                <h1 className="mt-2 text-3xl font-black leading-tight tracking-tight sm:text-4xl">
                  Legal Center
                </h1>
                <p className={`mt-2 max-w-2xl text-sm font-semibold leading-6 ${secTextColor}`}>
                  Policies, terms, safety rules, and support information for the CoolVibes experience.
                </p>
              </div>
              <div className={`flex h-9 shrink-0 items-center rounded-full px-3 text-[10px] font-black uppercase tracking-[0.14em] ${pillClass}`}>
                {LEGAL_ENTRIES.length} documents
              </div>
            </div>
          </section>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {LEGAL_ENTRIES.map(([key, pageData], i) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/legal/${key}`}
                  className={`elite-card-static group flex min-h-[148px] w-full flex-col justify-between p-4 text-left transition-colors active:scale-[0.99] ${isDark ? 'hover:border-white/20' : 'hover:border-sky-200'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] ${isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-950'}`}>
                      <pageData.icon className="h-5 w-5" strokeWidth={1.6} />
                    </div>
                    <ChevronRight className={`h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5 ${isDark ? 'text-white/25' : 'text-slate-300'}`} />
                  </div>
                  <div className="min-w-0 pt-4">
                    <h2 className="text-[17px] font-black leading-6 tracking-tight">{pageData.title}</h2>
                    <p className={`mt-1 line-clamp-2 text-[13px] font-semibold leading-5 ${secTextColor}`}>
                      {pageData.description}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className={`border-t pt-5 ${dividerClass}`}>
            <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${isDark ? 'text-zinc-700' : 'text-slate-300'}`}>
              © {new Date().getFullYear()} {DEFAULT_APP_NAME}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className={`skyline-page-scroll w-full ${textColor}`}>
        <div className="mx-auto flex min-h-full w-full max-w-7xl flex-col items-center justify-center px-1 pb-8 pt-24 text-center md:px-2 md:pt-28">
          <div className={`w-full max-w-xl rounded-[30px] border p-6 backdrop-blur-3xl md:p-8 ${panelClass} shadow-[0_24px_70px_-48px_rgba(15,23,42,0.55)]`}>
            <p className="text-[20px] font-black tracking-tight">Page not found</p>
            <p className={`mt-2 text-[14px] font-semibold ${secTextColor}`}>The legal page you're looking for doesn't exist.</p>
            <button
              type="button"
              onClick={() => navigate('/legal')}
              className={`mt-6 rounded-full px-6 py-3 text-[13px] font-black uppercase tracking-[0.12em] transition-all active:scale-[0.98] ${isDark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-slate-950 text-white hover:bg-slate-800'}`}
            >
              View Legal Index
            </button>
          </div>
        </div>
      </div>
    );
  }

  const Icon = pageData.icon;

  return (
    <div className={`skyline-page-scroll w-full ${textColor}`}>
      <div className="mx-auto grid min-h-full w-full max-w-7xl gap-4 px-1 pb-8 pt-24 md:px-2 md:pt-28 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <nav className={`rounded-[30px] border p-2 backdrop-blur-3xl ${panelClass} shadow-[0_24px_70px_-48px_rgba(15,23,42,0.55)]`} aria-label="Legal pages">
            <Link
              to="/legal"
              className={`flex h-10 items-center justify-between rounded-full px-3 text-[10px] font-black uppercase tracking-[0.14em] transition-colors ${isDark ? 'text-zinc-400 hover:bg-white/10 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-950'}`}
            >
              Legal Center
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
            <div className={`my-2 border-t ${dividerClass}`} />
            <div className="space-y-1">
              {LEGAL_ENTRIES.map(([key, item]) => {
                const ItemIcon = item.icon;
                const isActive = key === currentPage;
                return (
                  <Link
                    key={key}
                    to={`/legal/${key}`}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex min-h-11 items-center gap-2 rounded-2xl px-3 py-2 text-left text-[12px] font-black transition-colors ${isActive
                      ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20'
                      : isDark
                        ? 'text-zinc-500 hover:bg-white/10 hover:text-white'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-950'
                      }`}
                  >
                    <ItemIcon className="h-4 w-4 shrink-0" strokeWidth={1.7} />
                    <span className="min-w-0 truncate">{item.title}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </aside>

        <main className="min-w-0">
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={`mb-4 rounded-[30px] border p-5 backdrop-blur-3xl md:p-6 ${panelClass} shadow-[0_24px_70px_-48px_rgba(15,23,42,0.55)]`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] ${isDark ? 'bg-white text-slate-950' : 'bg-slate-950 text-white'}`}>
                <Icon className="h-7 w-7" strokeWidth={1.6} />
              </div>
              <div className="min-w-0">
                <p className={`text-[10px] font-black uppercase tracking-[0.22em] ${isDark ? 'text-sky-300' : 'text-sky-700'}`}>
                  {DEFAULT_APP_NAME} Legal
                </p>
                <h1 className="mt-2 text-3xl font-black leading-tight tracking-tight sm:text-4xl">
                  {pageData.title}
                </h1>
                <p className={`mt-2 max-w-2xl text-sm font-semibold leading-6 ${secTextColor}`}>
                  {pageData.description}
                </p>
              </div>
            </div>
          </motion.section>

          <article className={`overflow-hidden rounded-[30px] border backdrop-blur-3xl ${mutedPanelClass}`}>
            {pageData.sections.map((section, i) => (
              <section
                key={`${section.heading}-${i}`}
                className={`px-5 py-5 md:px-6 ${i === 0 ? '' : `border-t ${dividerClass}`}`}
              >
                <h2 className="text-[17px] font-black leading-6 tracking-tight">
                  {section.heading}
                </h2>
                <p className={`mt-3 text-[15px] font-medium leading-7 ${secTextColor}`}>
                  {section.body}
                </p>
              </section>
            ))}
          </article>

          <div className={`mt-5 border-t pt-5 ${dividerClass}`}>
            <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${isDark ? 'text-zinc-700' : 'text-slate-300'}`}>
              © {new Date().getFullYear()} {DEFAULT_APP_NAME}
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LegalScreen;
