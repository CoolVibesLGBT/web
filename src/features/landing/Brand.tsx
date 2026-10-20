import { useTranslation } from 'react-i18next'

export default function Brand({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation('landing')
  return (
    <button
      className="cv-landing-brand"
      onClick={onClick}
      aria-label={t('home_label')}
    >
      <span>
        coolvibes<span className="cv-landing-brand-dot">.</span>
      </span>
    </button>
  )
}
