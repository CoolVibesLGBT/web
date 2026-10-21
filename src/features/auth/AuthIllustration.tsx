import { useTranslation } from 'react-i18next'
import { resolvePublicAssetUrl } from '@/platform/runtime'

type AuthIllustrationProps = {
  kind: 'login' | 'register'
  placement?: 'choice' | 'heading'
}

export default function AuthIllustration({
  kind,
  placement = 'choice',
}: AuthIllustrationProps) {
  const { t } = useTranslation('auth')
  return (
    <img
      src={resolvePublicAssetUrl(`/images/auth/${kind}-bear.avif`)}
      width={512}
      height={512}
      alt={t(`${kind}_illustration_alt`)}
      draggable={false}
      decoding="async"
      style={{ contentVisibility: 'visible' }}
      className={
        placement === 'heading'
          ? 'h-28 w-28 shrink-0 object-contain sm:h-32 sm:w-32'
          : 'h-24 w-24 shrink-0 object-contain sm:h-32 sm:w-32'
      }
    />
  )
}
