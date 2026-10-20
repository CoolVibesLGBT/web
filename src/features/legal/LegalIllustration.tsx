import illustrationSizes from './illustrationSizes.json'

type Props = {
  page: string
  panel?: number
  className: string
  label?: string
  eager?: boolean
}

export default function LegalIllustration({
  page,
  panel = 0,
  className,
  label,
  eager = false,
}: Props) {
  const sizes = illustrationSizes[page as keyof typeof illustrationSizes]
  const size = sizes[panel] || sizes[0]

  return (
    <div className={`cv-legal-artwork ${className}`}>
      <img
        src={`/images/landing/legal-${page}-${panel}.avif`}
        alt={label || ''}
        width={size.width}
        height={size.height}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
      />
    </div>
  )
}
