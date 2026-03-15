export const SITE_URL = 'https://coolvibes.lgbt'
export const SITE_NAME = 'CoolVibes'

export const DEFAULT_TITLE =
  'CoolVibes – Inclusive LGBTIQA+ Gay Dating App'
export const DEFAULT_DESCRIPTION =
  'CoolVibes is the safest and most inclusive gay dating app for the LGBTIQA+ community. Connect, chat, and find meaningful relationships with like-minded people worldwide.'
export const DEFAULT_IMAGE = 'https://coolvibes.lgbt/images/icons/icon_512x512.jpg'
export const DEFAULT_KEYWORDS =
  'LGBTIQA+ dating, gay dating app, LGBTIQA+ community, inclusive dating, safe gay dating, LGBTQIA+ dating, find love, chat gay, CoolVibes app'

export const SEO_LANGUAGES = [
  { hrefLang: 'en', lang: 'en' },
  { hrefLang: 'tr', lang: 'tr' },
  { hrefLang: 'de', lang: 'de' },
  { hrefLang: 'es', lang: 'es' },
  { hrefLang: 'fr', lang: 'fr' },
  { hrefLang: 'x-default', lang: 'en' },
]

export interface SEOOptions {
  title?: string
  description?: string
  keywords?: string
  image?: string
  canonical?: string
  type?: 'website' | 'article' | 'profile'
  noindex?: boolean
}

export interface ResolvedSEO {
  title: string
  description: string
  keywords?: string
  image: string
  canonicalUrl: string
  type: 'website' | 'article' | 'profile'
  robots: string
  noindex: boolean
}

const normalizePath = (path?: string) => {
  if (!path) return '/'
  const stripped = path.split('?')[0]?.split('#')[0] || '/'
  if (stripped === '') return '/'
  return stripped.startsWith('/') ? stripped : `/${stripped}`
}

export const resolveSeo = (options: SEOOptions = {}, path?: string): ResolvedSEO => {
  const {
    title,
    description = DEFAULT_DESCRIPTION,
    keywords = DEFAULT_KEYWORDS,
    image = DEFAULT_IMAGE,
    canonical,
    type = 'website',
    noindex = false,
  } = options

  const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE
  const canonicalPath = normalizePath(canonical ?? path ?? '/')
  const canonicalUrl = canonical?.startsWith('http')
    ? canonical
    : `${SITE_URL}${canonicalPath}`
  const robots = noindex ? 'noindex, nofollow' : 'index, follow'

  return {
    title: fullTitle,
    description,
    keywords,
    image,
    canonicalUrl,
    type,
    robots,
    noindex,
  }
}
