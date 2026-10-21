import { useState } from 'react'
import { ArrowRight, Globe, Languages, Menu, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/contexts/ThemeContext'
import { GroupedSection, ListRow, Sheet } from '@/components/ui/Interface'
import Brand from '@/features/landing/Brand'

interface PublicHeaderProps {
  onHome: () => void
  onLogin: () => void
  loginLabel: string
  onLanguage: () => void
  language: string
  flag?: string
  navigation: Array<{ label: string; onSelect: () => void }>
}

export default function PublicHeader({ onHome, onLogin, loginLabel, onLanguage, language, flag, navigation }: PublicHeaderProps) {
  const { t } = useTranslation('landing')
  const { theme, toggleTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const themeLabel = t(theme === 'dark' ? 'theme_light' : 'theme_dark')
  return <>
    <header className="cv-public-header">
      <div className="cv-public-header-inner">
        <Brand onClick={onHome} />
        <nav className="cv-public-navigation" aria-label={t('main_nav')}>
          {navigation.map(item => <button type="button" key={item.label} onClick={item.onSelect}>{item.label}</button>)}
        </nav>
        <div className="cv-public-actions">
          <button type="button" className="cv-public-desktop-control cv-public-language" onClick={onLanguage} aria-label={t('language')} aria-haspopup="dialog">
            {flag ? <img src={flag} alt="" width={20} height={20} /> : <Globe size={20} aria-hidden="true" />}<span>{language.toUpperCase()}</span>
          </button>
          <button type="button" className="cv-public-desktop-control cv-icon-button" onClick={toggleTheme} aria-label={themeLabel}>
            {theme === 'dark' ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
          </button>
          <button type="button" className="cv-landing-login cv-public-login" onClick={onLogin}><span>{loginLabel}</span><ArrowRight size={18} aria-hidden="true" /></button>
          <button type="button" className="cv-public-mobile-control cv-icon-button" onClick={() => setMenuOpen(true)} aria-label={t('main_nav')} aria-haspopup="dialog" aria-expanded={menuOpen}><Menu aria-hidden="true" /></button>
        </div>
      </div>
    </header>
    <Sheet isOpen={menuOpen} onClose={() => setMenuOpen(false)} title={t('main_nav')}>
      <GroupedSection>{navigation.map(item => <ListRow key={item.label} title={item.label} onClick={() => { setMenuOpen(false); item.onSelect() }} />)}</GroupedSection>
      <GroupedSection>
        <ListRow title={t('language')} value={language.toUpperCase()} icon={<Languages />} onClick={() => { setMenuOpen(false); onLanguage() }} />
        <ListRow title={themeLabel} icon={theme === 'dark' ? <Sun /> : <Moon />} onClick={toggleTheme} />
      </GroupedSection>
    </Sheet>
  </>
}
