import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Cookie, FileText, Users, Eye, Info, HelpCircle, ChevronRight, HandFist } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useSEO } from '../hooks/useSEO';

type LegalPage = 'privacy' | 'cookies' | 'terms' | 'guidelines' | 'accessibility' | 'about' | 'help' | 'conduct';

const PAGES: Record<LegalPage, {
  icon: React.FC<{ className?: string; strokeWidth?: number }>;
  title: string;
  description: string;
  sections: { heading: string; body: string }[];
}> = {
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

const LegalScreen: React.FC = () => {
  const { page } = useParams<{ page: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const currentPage = page as LegalPage | undefined;
  const pageData = currentPage ? PAGES[currentPage] : null;

  // Dynamic SEO per sub-page
  useSEO({
    title: pageData ? pageData.title : 'Legal Center',
    description: pageData
      ? `${pageData.title} – ${pageData.description}. CoolVibes LGBTIQA+ app.`
      : 'Explore our Privacy Policy, Terms of Service, Community Guidelines and more. CoolVibes LGBTIQA+ dating app legal center.',
    canonical: page ? `/legal/${page}` : '/legal',
    keywords: `CoolVibes legal, ${pageData?.title || 'privacy policy terms'}, LGBTIQA+ app`,
    noindex: false,
  });

  const isDark = theme === 'dark';
  const bgColor = isDark ? 'bg-gray-950' : 'bg-white';
  const textColor = isDark ? 'text-white' : 'text-gray-900';
  const secTextColor = isDark ? 'text-gray-400' : 'text-gray-600';
  const borderColor = isDark ? 'border-gray-900' : 'border-gray-200/50';
  const cardBg = isDark ? 'bg-gray-900/40' : 'bg-gray-50';

  // If no page is specified, show the index page
  if (!page) {
    return (
      <div className={`flex flex-col h-[100dvh] w-full max-w-[600px] mx-auto ${bgColor} ${textColor}`}>
        <div className={`flex-shrink-0 sticky top-0 z-30 flex items-center h-[64px] px-4 ${isDark ? 'bg-gray-950/95' : 'bg-white/95'} backdrop-blur-md border-b ${borderColor}`}>
          <button 
            onClick={() => navigate(-1)} 
            className={`p-2.5 -ml-2 rounded-full transition-all active:scale-90 ${isDark ? 'hover:bg-gray-900/50' : 'hover:bg-gray-100'}`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[17px] font-bold tracking-tight ml-2">Legal & Privacy</h1>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide pb-24">
          <div className="px-6 pt-12 pb-8">
            <h2 className="text-[32px] font-black tracking-tighter mb-3 leading-tight text-center">
              Legal Center
            </h2>
            <p className="text-[16px] leading-relaxed font-semibold opacity-60 text-center mx-auto max-w-[320px]">
              Explore our policies, terms, and community guidelines for a safe experience.
            </p>
          </div>

          <div className="px-4 space-y-3">
            {(Object.entries(PAGES) as [LegalPage, typeof PAGES['privacy']][]).map(([key, pageData], i) => (
              <motion.button
                key={key}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/legal/${key}`)}
                className={`w-full p-4 rounded-[24px] ${cardBg} border-[0.5px] ${borderColor} flex items-center gap-4 text-left transition-all active:scale-[0.98] group hover:border-gray-500/30`}
              >
                <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center shrink-0 ${isDark ? 'bg-white/10 text-white' : 'bg-black/5 text-black'}`}>
                  <pageData.icon className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[17px] font-bold tracking-tight">{pageData.title}</h3>
                  <p className={`text-[13px] font-medium ${secTextColor} truncate truncate opacity-80`}>
                    {pageData.description}
                  </p>
                </div>
                <ChevronRight className={`w-5 h-5 shrink-0 transition-transform group-hover:translate-x-1 opacity-20`} />
              </motion.button>
            ))}
          </div>

          <div className="pt-12 flex flex-col items-center">
            <div className={`w-12 h-1 rounded-full mb-6 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`} />
            <p className={`text-[12px] font-bold uppercase tracking-[0.2em] ${isDark ? 'text-gray-700' : 'text-gray-300'}`}>
              © {new Date().getFullYear()} CoolVibes LGBT
            </p>
          </div>
        </div>
      </div>
    );
  }

  const data = PAGES[page as LegalPage];

  if (!data) {
    return (
      <div className={`flex flex-col h-[100dvh] w-full max-w-[600px] mx-auto ${bgColor} ${textColor}`}>
        <div className={`flex-shrink-0 sticky top-0 z-30 flex items-center justify-between h-[64px] px-4 ${isDark ? 'bg-gray-950/95' : 'bg-white/95'} backdrop-blur-md border-b ${borderColor}`}>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate(-1)} 
            className={`p-2.5 -ml-2 rounded-full transition-all active:scale-90 ${isDark ? 'hover:bg-gray-900/50' : 'hover:bg-gray-100'}`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[17px] font-bold tracking-tight">Not Found</h1>
        </div>
      </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <p className={`text-[17px] font-semibold ${textColor}`}>Page not found</p>
          <p className={`text-[14px] mt-2 ${secTextColor}`}>The page you're looking for doesn't exist.</p>
          <button onClick={() => navigate('/legal')} className={`mt-6 px-6 py-3 rounded-[16px] font-semibold text-[15px] ${isDark ? 'bg-white text-black' : 'bg-gray-900 text-white'}`}>
            View Legal Index
          </button>
        </div>
      </div>
    );
  }

  const Icon = data.icon;

  return (
    <div className={`flex flex-col h-[100dvh] w-full max-w-[600px] mx-auto ${bgColor} ${textColor}`}>

      {/* Sticky Header — Standardized alignment */}
      <div className={`flex-shrink-0 sticky top-0 z-30 flex items-center justify-between h-[64px] px-4 ${isDark ? 'bg-gray-950/95' : 'bg-white/95'} backdrop-blur-md border-b ${borderColor}`}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className={`p-2.5 -ml-2 rounded-full transition-all active:scale-90 ${isDark ? 'hover:bg-gray-900/50' : 'hover:bg-gray-100'}`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[17px] font-bold tracking-tight">{data.title}</h1>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide pb-24">

        {/* Hero section with enhanced styling */}
        <div className="px-6 pt-12 pb-10 text-center flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={`w-[72px] h-[72px] rounded-[24px] flex items-center justify-center mb-6 shadow-xl ${isDark ? 'bg-white text-black' : 'bg-gray-900 text-white'}`}
          >
            <Icon className="w-10 h-10" strokeWidth={1.5} />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="text-[32px] font-black tracking-tighter mb-3 leading-tight"
          >
            {data.title}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className={`text-[16px] max-w-[320px] leading-relaxed font-semibold opacity-60`}
          >
            {data.description}
          </motion.p>
        </div>

        {/* Sections with premium card design */}
        <div className="px-4 space-y-4 pb-12">
          {data.sections.map((section, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05, duration: 0.5 }}
              className={`p-6 rounded-[28px] ${cardBg} border-[0.5px] ${borderColor} shadow-sm group hover:border-gray-500/30 transition-colors`}
            >
              <h3 className={`text-[17px] font-bold mb-3 ${textColor}`}>
                {section.heading}
              </h3>
              <p className={`text-[15px] leading-relaxed font-medium ${secTextColor}`}>
                {section.body}
              </p>
            </motion.div>
          ))}

          {/* Footer note */}
          <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 0.6 }}
             className="pt-8 flex flex-col items-center"
          >
            <div className={`w-12 h-1 rounded-full mb-6 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`} />
            <p className={`text-[12px] font-bold uppercase tracking-[0.2em] ${isDark ? 'text-gray-700' : 'text-gray-300'}`}>
              © {new Date().getFullYear()} CoolVibes LGBT
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LegalScreen;
