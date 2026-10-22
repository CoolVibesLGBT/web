import { useState } from 'react'
import { Download, ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from '@/router'
import { useAuth } from '@/contexts/AuthContext'
import { useSEO } from '@/hooks/useSEO'
import { getLanguageTag, normalizeLanguage } from '@/i18n/language'
import PublicHeader from '@/features/landing/PublicHeader'
import Brand from '@/features/landing/Brand'
import LanguageSelector, { getLanguageFlagDisplay } from '@/components/ui/LanguageSelector'
import AuthWizard from '@/features/auth/AuthWizard'
import './LandingPage.css'
import './BrandkitScreen.css'

const base = '/images/brand/dott-v3/'
const colors = ['#56C8CE', '#8774E1', '#082C72', '#3390EC', '#FF6055', '#FF9500', '#FFD45C', '#ADD64B']
const assets = [
  { id: 'logo', file: 'wordmark-master.png', preview: 'wordmark.png', format: 'PNG · 2172 × 724', className: 'wordmark' },
  { id: 'icon', file: 'icon-1024.png', preview: 'icon-512.png', format: 'PNG · 1024 × 1024', className: 'icon' },
  { id: 'social', file: 'og-1200x630.jpg', preview: 'og-1200x630.jpg', format: 'JPG · 1200 × 630', className: 'social' },
]

export default function BrandkitScreen() {
  const { t, i18n } = useTranslation('landing')
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [languageOpen, setLanguageOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const language = normalizeLanguage(i18n.language)
  const flag = getLanguageFlagDisplay(undefined, language)
  useSEO({ title: `CoolVibes — ${t('brandkit.title')}`, description: t('brandkit.description'), canonical: '/brandkit' })
  const join = () => isAuthenticated ? navigate('/pride') : setAuthOpen(true)

  return <div className="cv-landing cv-brandkit" lang={getLanguageTag(i18n.language)} dir={i18n.dir()}>
    <a className="cv-landing-skip" href="#brandkit-content">{t('skip')}</a>
    <PublicHeader onHome={() => navigate('/')} onLogin={join} loginLabel={t(isAuthenticated ? 'open_app' : 'login')} onLanguage={() => setLanguageOpen(true)} language={language} flag={flag.src} navigation={[]} />
    <main id="brandkit-content" className="cv-brandkit-main">
      <Link to="/" className="cv-brandkit-back"><ArrowLeft size={18} aria-hidden="true" />{t('home_label')}</Link>
      <header className="cv-brandkit-heading">
        <h1>{t('brandkit.title')}</h1>
        <p>{t('brandkit.description')}</p>
        <a className="cv-brandkit-download" href={`${base}coolvibes-brandkit.zip`} download><Download size={20} aria-hidden="true" />{t('brandkit.download_all')} <span>ZIP</span></a>
      </header>
      <div className="cv-brandkit-hero"><img src={`${base}wordmark-master.png`} alt="CoolVibes" width={2172} height={724} fetchPriority="high" /></div>
      <section aria-labelledby="brandkit-assets">
        <h2 id="brandkit-assets">{t('brandkit.assets')}</h2>
        <div className="cv-brandkit-assets">
          {assets.map(asset => <article key={asset.id} className="cv-brandkit-card">
            <div className={`cv-brandkit-preview cv-brandkit-preview-${asset.className}`}><img src={base + asset.preview} alt={t(`brandkit.${asset.id}`)} loading="lazy" /></div>
            <div className="cv-brandkit-card-body"><h3>{t(`brandkit.${asset.id}`)}</h3><p dir="ltr">{asset.format}</p>
              <a className="cv-brandkit-file" href={base + asset.file} download><Download size={18} aria-hidden="true" />{t('brandkit.download')}<span className="sr-only"> — {t(`brandkit.${asset.id}`)}</span></a>
            </div>
          </article>)}
        </div>
        <p className="cv-brandkit-note">{t('brandkit.package')}</p>
      </section>
      <section aria-labelledby="brandkit-colors">
        <h2 id="brandkit-colors">{t('brandkit.colors')}</h2>
        <div className="cv-brandkit-colors">{colors.map(color => <div className="cv-brandkit-color" key={color}><span style={{ background: color }} aria-hidden="true" /><code dir="ltr">{color}</code></div>)}</div>
      </section>
      <section className="cv-brandkit-guidelines" aria-labelledby="brandkit-usage">
        <h2 id="brandkit-usage">{t('brandkit.usage')}</h2>
        <ul>{['spacing', 'preserve', 'contrast'].map(key => <li key={key}>{t(`brandkit.${key}`)}</li>)}</ul>
      </section>
    </main>
    <footer className="cv-brandkit-footer"><Brand onClick={() => navigate('/')} /><nav aria-label={t('footer_nav')}><Link to="/legal/terms">{t('terms')}</Link><Link to="/legal/privacy">{t('privacy')}</Link><Link to="/brandkit" aria-current="page">{t('brandkit.title')}</Link></nav><p>© {new Date().getFullYear()} CoolVibes</p></footer>
    <LanguageSelector isOpen={languageOpen} onClose={() => setLanguageOpen(false)} />
    <AuthWizard isOpen={authOpen} onClose={() => setAuthOpen(false)} />
  </div>
}
