import type { CSSProperties, ImgHTMLAttributes } from 'react'
import catalog from '@/features/illustrations/icon-catalog.json'

const byAlias = new Map<string, string>()
const normalize = (value: string) =>
  value.trim().toLocaleLowerCase().replace(/_/g, '-')
for (const icon of catalog) {
  byAlias.set(normalize(icon.key), icon.key)
  for (const alias of icon.aliases) byAlias.set(normalize(alias), icon.key)
}

export function getIllustratedIconKey(
  name: string,
  fallback = 'system-sparkles',
) {
  return (
    byAlias.get(normalize(name)) ||
    byAlias.get(normalize(fallback)) ||
    'system-sparkles'
  )
}

export type IllustratedIconProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'src'
> & {
  name?: string
  fallback?: string
  size?: number | string
  strokeWidth?: number
  absoluteStrokeWidth?: boolean
  color?: string
  fill?: string
}
export type IllustratedIconComponent = (
  props: IllustratedIconProps,
) => React.ReactElement

/** Original 256×256 AVIF artwork; the containing control supplies its accessible label. */
export default function IllustratedIcon({
  name = 'system-sparkles',
  fallback,
  size = 24,
  width,
  height,
  className = '',
  style,
  alt = '',
  strokeWidth: _strokeWidth,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  color: _color,
  fill: _fill,
  ...props
}: IllustratedIconProps) {
  // Compatibility props let existing controls retain their sizing while replacing SVG artwork.
  void _strokeWidth
  void _absoluteStrokeWidth
  void _color
  void _fill
  const key = getIllustratedIconKey(name, fallback)
  return (
    <img
      {...props}
      src={`/images/icons/dott/${key}.avif`}
      width={width || size}
      height={height || size}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      draggable={false}
      decoding="async"
      className={`cv-illustrated-icon ${className}`}
      style={
        {
          objectFit: 'contain',
          flexShrink: 0,
          contentVisibility: 'visible',
          ...style,
        } as CSSProperties
      }
    />
  )
}

export function createIllustratedIcon(name: string): IllustratedIconComponent {
  return function ArtIcon(props: IllustratedIconProps) {
    return <IllustratedIcon {...props} name={name} />
  }
}
