import { useTranslation } from 'react-i18next'

const RouteLoader = () => {
  const { t } = useTranslation('common')
  return <div className="cv-route-loading" role="status" aria-label={t('emoticons.loading')}>
    <progress aria-label={t('emoticons.loading')} />
  </div>
}

export default RouteLoader
