import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowDown,
  ArrowRight,
  Check,
  ChevronDown,
  Heart,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from '@/router'
import { useSEO } from '@/hooks/useSEO'
import LanguageSelector, {
  getLanguageFlagDisplay,
} from '@/components/ui/LanguageSelector'
import AuthWizard from '@/features/auth/AuthWizard'
import PublicHeader from '@/features/landing/PublicHeader'
import Brand from '@/features/landing/Brand'
import ProductPreview from '@/features/landing/ProductPreview'
import CharacterPortrait from '@/features/landing/CharacterPortrait'
import { getLocalizedHero } from '@/features/landing/localizedHero'
import { getLanguageTag, normalizeLanguage } from '@/i18n/language'
import './LandingPage.css'

const sections = [
  {
    id: 'community',
    copy: 'community',
    detail: 'community',
    icon: Users,
    image: 'tokyo-community',
    city: 'Tokyo',
    country: 'Japan',
  },
  {
    id: 'dating',
    copy: 'dating',
    detail: 'dating',
    icon: Heart,
    image: 'taipei-dating',
    city: 'Taipei',
    country: 'Taiwan',
  },
  {
    id: 'nearby',
    copy: 'nearby',
    detail: 'nearby',
    icon: MapPin,
    image: 'shanghai-nearby',
    city: 'Shanghai',
    country: 'China',
  },
  {
    id: 'chat',
    copy: 'messages',
    detail: 'chat',
    icon: MessageCircle,
    image: 'tel-aviv-chat',
    city: 'Tel Aviv',
    country: 'Israel',
  },
]
const portraits = [0, 1, 2, 3, 4, 5]

export default function LandingPage() {
  const { t, i18n } = useTranslation('landing')
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const pageRef = useRef<HTMLDivElement>(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [languageOpen, setLanguageOpen] = useState(false)
  const languageCode = normalizeLanguage(i18n.language)
  const languageFlag = getLanguageFlagDisplay(undefined, languageCode)
  const hero = getLocalizedHero(i18n.language)

  useSEO({
    title: t('seo_title'),
    description: t('seo_description'),
    keywords:
      'LGBTIQA+, gay social network, gay dating, queer community, LGBT social media, CoolVibes',
    canonical: '/',
    type: 'website',
  })

  const scrollTo = (id: string) => {
    pageRef.current?.querySelector<HTMLElement>(`#${id}`)?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
      block: 'start',
    })
  }
  const scrollHome = () =>
    pageRef.current?.scrollTo({
      top: 0,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    })
  const join = () => {
    if (isAuthenticated) navigate('/pride')
    else setAuthOpen(true)
  }

  return (
    <div
      ref={pageRef}
      className="cv-landing"
      lang={getLanguageTag(i18n.language)}
      dir={i18n.dir()}
    >
      <a className="cv-landing-skip" href="#landing-main">
        {t('skip')}
      </a>
      <PublicHeader onHome={scrollHome} onLogin={join} loginLabel={t(isAuthenticated ? 'open_app' : 'login')} onLanguage={() => setLanguageOpen(true)} language={languageCode} flag={languageFlag.src} navigation={[
        { label: t('nav_discover'), onSelect: () => scrollTo('kesfet') },
        { label: t('nav_safety'), onSelect: () => scrollTo('guvenlik') },
        { label: t('nav_faq'), onSelect: () => scrollTo('sorular') },
      ]} />

      <main id="landing-main">
        <section className="cv-landing-hero" aria-labelledby="landing-title">
          <img
            className="cv-landing-hero-image"
            src={hero.image}
            alt={t('hero_image_alt', { place: hero.place })}
            width={1536}
            height={1024}
            fetchPriority="high"
          />
          <div className="cv-landing-hero-shade" />
          <div className="cv-landing-hero-inner">
            <div className="cv-landing-hero-content">
              <p className="cv-landing-eyebrow">
                <span className="cv-landing-pride-stripes" />
                {t('eyebrow')}
              </p>
              <h1 id="landing-title">
                {t('hero_title')}
                <br />
                <span>{t('hero_accent')}</span>
              </h1>
              <p className="cv-landing-hero-description">
                {t('hero_description_1')}
                <br />
                {t('hero_description_2')}
              </p>
              <button
                className="cv-landing-button cv-landing-button-primary"
                onClick={join}
              >
                {t('hero_cta')}
                <ArrowRight size={18} />
              </button>
              <p className="cv-landing-hero-note">
                <ShieldCheck size={14} />
                {t('hero_note')}
                <span>18+</span>
              </p>
            </div>
          </div>
          <div className="cv-landing-hero-bottom">
            <button onClick={() => scrollTo('kesfet')}>
              {t('scroll')}
              <ArrowDown size={16} />
            </button>
            <span>
              <MapPin size={14} />
              <bdi>{hero.place}</bdi>
            </span>
          </div>
        </section>

        <div className="cv-landing-explore-bar">
          <div>
            {sections.map(({ id, copy, icon: Icon }) => (
              <button key={id} onClick={() => scrollTo(id)}>
                <Icon size={17} />
                {t(`${copy}_tag`)}
                <ArrowRight size={14} />
              </button>
            ))}
          </div>
        </div>

        <section
          id="kesfet"
          className="cv-landing-introduction cv-landing-container"
          aria-labelledby="discover-title"
        >
          <div>
            <p className="cv-landing-kicker">
              <Sparkles size={15} />
              {t('welcome')}
            </p>
            <h2 id="discover-title">
              {t('discover_title')}
              <br />
              <span>{t('discover_accent')}</span>
            </h2>
          </div>
          <p>
            {t('discover_desc_1')}
            <br />
            {t('discover_desc_2')}
          </p>
        </section>

        <div className="cv-landing-product-sections cv-landing-container">
          {sections.map(
            ({ id, copy, detail, icon: Icon, image, city, country }, index) => (
              <section
                id={id}
                key={id}
                className={`cv-landing-product-section${index % 2 ? ' is-reversed' : ''}${index === 0 ? ' has-demo' : ''}`}
                aria-labelledby={`${id}-title`}
              >
                <div className="cv-landing-section-copy">
                  <p className="cv-landing-kicker">
                    <Icon size={16} />
                    {t(`${copy}_tag`)}
                  </p>
                  <h2 id={`${id}-title`}>
                    {t(`${copy}_title`)}
                    <br />
                    <span>{t(`${copy}_title_2`)}</span>
                  </h2>
                  <p className="cv-landing-section-lead">{t(`${copy}_body`)}</p>
                  <p className="cv-landing-section-detail">
                    {t(`${detail}_detail`)}
                  </p>
                  <ul className="cv-landing-section-points">
                    {[1, 2, 3].map((item) => (
                      <li key={item}>
                        <Check size={16} />
                        <span>{t(`${detail}_point_${item}`)}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    className="cv-landing-text-link"
                    onClick={id === 'nearby' ? () => navigate('/places') : join}
                  >
                    {t(`${copy}_cta`)}
                    <ArrowRight size={17} />
                  </button>
                </div>
                <div className="cv-landing-section-visual">
                  <div className="cv-landing-section-image">
                    <img
                      src={`/images/landing/${image}.avif`}
                      alt={t(`${detail}_image_alt`)}
                      width={1536}
                      height={1024}
                      loading="lazy"
                    />
                    <span className="cv-landing-city-label">
                      <MapPin size={13} />
                      {city}
                      <span>{country}</span>
                    </span>
                  </div>
                  {index === 0 && (
                    <div className="cv-landing-product-demo">
                      <ProductPreview onJoin={join} />
                    </div>
                  )}
                </div>
              </section>
            ),
          )}

          <section
            id="guvenlik"
            className="cv-landing-product-section cv-landing-safety"
            aria-labelledby="safety-title"
          >
            <div className="cv-landing-section-copy">
              <p className="cv-landing-kicker">
                <ShieldCheck size={16} />
                {t('safety_tag')}
              </p>
              <h2 id="safety-title">
                {t('safety_title')}
                <br />
                <span>{t('safety_accent')}</span>
              </h2>
              <p className="cv-landing-section-lead">{t('safety_body')}</p>
              <ul className="cv-landing-section-points">
                {['safety_photos', 'safety_block', 'safety_pace'].map((key) => (
                  <li key={key}>
                    <Check size={16} />
                    <span>{t(key)}</span>
                  </li>
                ))}
              </ul>
              <button
                className="cv-landing-text-link"
                onClick={() => navigate('/legal/privacy')}
              >
                {t('privacy_cta')}
                <ArrowRight size={17} />
              </button>
            </div>
            <div className="cv-landing-section-visual">
              <div className="cv-landing-section-image">
                <img
                  src="/images/landing/hong-kong-privacy.avif"
                  alt={t('safety_image_alt')}
                  width={1536}
                  height={1024}
                  loading="lazy"
                />
                <span className="cv-landing-city-label">
                  <MapPin size={13} />
                  Hong Kong
                </span>
              </div>
            </div>
          </section>
        </div>

        <section
          id="sorular"
          className="cv-landing-faq cv-landing-container"
          aria-labelledby="faq-title"
        >
          <div>
            <p className="cv-landing-kicker">{t('faq_tag')}</p>
            <h2 id="faq-title">
              {t('faq_title')}
              <br />
              <span>{t('faq_accent')}</span>
            </h2>
            <p>{t('faq_note')}</p>
          </div>
          <div className="cv-landing-faq-list">
            {[1, 2, 3, 4, 5].map((item) => (
              <details key={item}>
                <summary>
                  {t(`faq_${item}_q`)}
                  <ChevronDown size={18} />
                </summary>
                <p>{t(`faq_${item}_a`)}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="cv-landing-final">
          <div className="cv-landing-final-avatars" aria-hidden="true">
            {portraits.map((character) => (
              <CharacterPortrait key={character} character={character} />
            ))}
          </div>
          <p className="cv-landing-kicker">{t('final_tag')}</p>
          <h2>{t('final_title')}</h2>
          <p>{t('final_body')}</p>
          <button
            className="cv-landing-button cv-landing-button-primary"
            onClick={join}
          >
            {t('join')}
            <ArrowRight size={18} />
          </button>
          <small>{t('age_note')}</small>
        </section>
      </main>

      <footer className="cv-landing-footer cv-landing-container">
        <div className="cv-landing-footer-main">
          <div>
            <Brand onClick={scrollHome} />
            <p>{t('footer_motto')}</p>
          </div>
          <nav aria-label={t('footer_nav')}>
            <button onClick={() => navigate('/legal/terms')}>
              {t('terms')}
            </button>
            <button onClick={() => navigate('/legal/privacy')}>
              {t('privacy')}
            </button>
            <button onClick={() => navigate('/legal/guidelines')}>
              {t('guidelines')}
            </button>
          </nav>
          <button className="cv-landing-footer-join" onClick={join}>
            {t('footer_join')}
            <ArrowRight size={15} />
          </button>
        </div>
        <div className="cv-landing-footer-bottom">
          <span>
            © {new Date().getFullYear()} {t('footer_copyright')}
          </span>
          <span>
            <span className="cv-landing-pride-stripes" />
            {t('footer_pride')}
          </span>
        </div>
      </footer>
      <LanguageSelector
        isOpen={languageOpen}
        onClose={() => setLanguageOpen(false)}
      />
      <AuthWizard
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
      />
    </div>
  )
}
