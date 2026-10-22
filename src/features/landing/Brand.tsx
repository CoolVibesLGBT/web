import { useTranslation } from 'react-i18next'

export default function Brand({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation('landing')
  return (
    <button
      className="cv-landing-brand"
      style={{ minHeight: 44, flexShrink: 0 }}
      onClick={onClick}
      aria-label={t('home_label')}
    >
      <img src="/images/brand/dott-v3/wordmark.png" alt="CoolVibes" width={840} height={280} style={{ width: '8.25rem', height: 'auto', display: 'block' }} />
    </button>
  )
}
