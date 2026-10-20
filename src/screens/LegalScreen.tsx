import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, Link } from '@/router'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { useSEO } from '@/hooks/useSEO'
import LegalIllustration from '@/features/legal/LegalIllustration'
import Brand from '@/features/landing/Brand'
import { getLanguageTag, normalizeLanguage } from '@/i18n/language'
import { LEGAL_PAGES, type LegalPage } from '@/features/legal/legalContent'
import LanguageSelector, {
  getLanguageFlagDisplay,
} from '@/components/ui/LanguageSelector'
import AuthWizard from '@/features/auth/AuthWizard'
import './LandingPage.css'
import './LegalScreen.css'

const entries = Object.entries(LEGAL_PAGES) as [
  LegalPage,
  (typeof LEGAL_PAGES)[LegalPage],
][]

export default function LegalScreen() {
  const { t, i18n } = useTranslation('legal')
  const { t: landing } = useTranslation('landing')
  const { theme, toggleTheme } = useTheme()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const rootRef = useRef<HTMLDivElement>(null)
  const [languageOpen, setLanguageOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const requestedPage = location.pathname.match(/^\/legal\/([^/]+)\/?$/)?.[1]
  const currentPage =
    requestedPage &&
    Object.prototype.hasOwnProperty.call(LEGAL_PAGES, requestedPage)
      ? (requestedPage as LegalPage)
      : undefined
  const page = currentPage ? LEGAL_PAGES[currentPage] : undefined
  const language = normalizeLanguage(i18n.language)
  const flag = getLanguageFlagDisplay(undefined, language)
  const title =
    currentPage && page
      ? t(`pages.${currentPage}.title`, { defaultValue: page.title })
      : t('center_title')
  const description =
    currentPage && page
      ? t(`pages.${currentPage}.description`, {
          defaultValue: page.description,
        })
      : t('center_description')
  const notFound = Boolean(requestedPage && !page)
  const titleFor = (key: LegalPage) =>
    t(`pages.${key}.title`, { defaultValue: LEGAL_PAGES[key].title })

  useSEO({
    title: notFound ? t('not_found') : title,
    description,
    canonical: currentPage ? `/legal/${currentPage}` : '/legal',
    noindex: notFound,
  })
  useEffect(() => {
    rootRef.current?.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

  const join = () => (isAuthenticated ? navigate('/pride') : setAuthOpen(true))
  const scrollTo = (id: string) =>
    rootRef.current?.querySelector<HTMLElement>(`#${id}`)?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
      block: 'start',
    })

  return (
    <div
      ref={rootRef}
      className="cv-landing cv-legal"
      lang={getLanguageTag(i18n.language)}
      dir={i18n.dir()}
    >
      <a className="cv-landing-skip" href="#legal-content">
        {landing('skip')}
      </a>
      <header className="cv-landing-header">
        <div className="cv-landing-header-inner">
          <Brand onClick={() => navigate('/')} />
          <Link to="/legal" className="cv-legal-header-label">
            {t('center_title')}
          </Link>
          <div className="cv-landing-header-actions">
            <button
              className="cv-landing-language"
              onClick={() => setLanguageOpen(true)}
              aria-label={landing('language')}
              aria-haspopup="dialog"
            >
              {flag.src && <img src={flag.src} alt="" width={20} height={20} />}
              <span>{language.toUpperCase()}</span>
            </button>
            <button
              className="cv-legal-theme"
              onClick={toggleTheme}
              aria-label={landing(
                theme === 'dark' ? 'theme_light' : 'theme_dark',
              )}
            >
              {t(theme === 'dark' ? 'theme_light' : 'theme_dark')}
            </button>
            <button className="cv-landing-login" onClick={join}>
              {landing(isAuthenticated ? 'open_app' : 'login')}
            </button>
          </div>
        </div>
      </header>

      <main id="legal-content" className="cv-legal-main">
        <nav className="cv-legal-breadcrumb" aria-label={t('all_documents')}>
          <Link to="/">{t('home')}</Link>
          <Link to="/legal">{t('center_title')}</Link>
          {page && (
            <>
              <span aria-current="page">{title}</span>
            </>
          )}
        </nav>
        {notFound ? (
          <div className="cv-legal-not-found">
            <h1>{t('not_found')}</h1>
            <p>{t('not_found_body')}</p>
            <Link to="/legal" className="cv-legal-back">
              {t('all_documents')}
            </Link>
          </div>
        ) : (
          <>
            <header className="cv-legal-title">
              <p className="cv-landing-kicker">{t('legal_label')}</p>
              <h1>{title}</h1>
              <p>{description}</p>
            </header>
            <LegalIllustration
              page={currentPage || 'about'}
              className="cv-legal-cover"
              label={t('image_alt', { title })}
              eager
            />
            {page && currentPage ? (
              <>
                <nav
                  className="cv-legal-document-nav"
                  aria-label={t('all_documents')}
                >
                  {entries.map(([key]) => (
                    <Link
                      key={key}
                      to={`/legal/${key}`}
                      aria-current={key === currentPage ? 'page' : undefined}
                    >
                      {titleFor(key)}
                    </Link>
                  ))}
                </nav>
                <div className="cv-legal-reading-column">
                  <nav
                    className="cv-legal-contents"
                    aria-label={t('table_of_contents')}
                  >
                    <p>{t('table_of_contents')}</p>
                    <ol>
                      {page.sections.map((section, index) => (
                        <li key={index}>
                          <button
                            onClick={() => scrollTo(`legal-section-${index}`)}
                          >
                            {t(
                              `pages.${currentPage}.sections.${index}.heading`,
                              { defaultValue: section.heading },
                            )}
                          </button>
                        </li>
                      ))}
                    </ol>
                  </nav>
                  <article className="cv-legal-document">
                    {page.sections.map((section, index) => (
                      <section id={`legal-section-${index}`} key={index}>
                        <h2>
                          <span aria-hidden="true">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          {t(`pages.${currentPage}.sections.${index}.heading`, {
                            defaultValue: section.heading,
                          })}
                        </h2>
                        <p>
                          {t(`pages.${currentPage}.sections.${index}.body`, {
                            defaultValue: section.body,
                          })}
                        </p>
                        <LegalIllustration
                          page={currentPage}
                          panel={index}
                          className="cv-legal-section-art"
                          label={t('section_image_alt', {
                            heading: t(
                              `pages.${currentPage}.sections.${index}.heading`,
                              { defaultValue: section.heading },
                            ),
                          })}
                        />
                      </section>
                    ))}
                  </article>
                  <div className="cv-legal-support">
                    <div>
                      <p>{t('need_help')}</p>
                      <span>support@coolvibes.lgbt</span>
                    </div>
                    <Link to="/legal/help">{t('help_cta')}</Link>
                  </div>
                  <section
                    className="cv-legal-related"
                    aria-label={t('related')}
                  >
                    <h2>{t('related')}</h2>
                    {entries
                      .filter(([key]) => key !== currentPage)
                      .slice(0, 3)
                      .map(([key]) => (
                        <Link key={key} to={`/legal/${key}`}>
                          <span>{titleFor(key)}</span>
                        </Link>
                      ))}
                  </section>
                </div>
              </>
            ) : (
              <div className="cv-legal-index">
                {entries.map(([key, item]) => (
                  <Link
                    key={key}
                    to={`/legal/${key}`}
                    className="cv-legal-index-item"
                  >
                    <LegalIllustration
                      page={key}
                      className="cv-legal-index-image"
                    />
                    <div>
                      <h2>{titleFor(key)}</h2>
                      <p>
                        {t(`pages.${key}.description`, {
                          defaultValue: item.description,
                        })}
                      </p>
                      <span className="cv-legal-read">
                        {t('read_document')}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </main>
      <footer className="cv-legal-footer">
        <Brand onClick={() => navigate('/')} />
        <p>
          © {new Date().getFullYear()} {t('copyright')}
        </p>
        <Link to="/">{t('home')}</Link>
      </footer>
      <LanguageSelector
        isOpen={languageOpen}
        onClose={() => setLanguageOpen(false)}
      />
      <AuthWizard isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  )
}
