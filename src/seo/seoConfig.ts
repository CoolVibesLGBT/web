export const SITE_URL = 'https://coolvibes.lgbt'
export const SITE_NAME = 'CoolVibes'
export const SITE_TWITTER_HANDLE = '@coolvibeslgbt'
export const GA_MEASUREMENT_ID =
  import.meta.env.PUBLIC_GA_MEASUREMENT_ID || 'G-ZSKTH9D2CQ'

export const DEFAULT_TITLE =
  'CoolVibes – LGBTQIA+ Social Network & Gay Dating App'
export const DEFAULT_DESCRIPTION =
  'CoolVibes is a LGBTQIA+ social network and LGBT gay dating app. Meet people, chat, and build meaningful relationships in an inclusive community worldwide.'
export const DEFAULT_IMAGE = 'https://coolvibes.lgbt/images/icons/icon_512x512.jpg'
export const DEFAULT_IMAGE_ALT = 'CoolVibes – LGBTQIA+ social network'
export const DEFAULT_KEYWORDS =
  'gay social network, LGBTQIA+ social media, LGBT gay dating, LGBTQIA+ dating app, queer community, inclusive social platform, CoolVibes'

export const SUPPORTED_LOCALES = [
  { lang: 'en', hrefLang: 'en', ogLocale: 'en_US' },
  { lang: 'tr', hrefLang: 'tr', ogLocale: 'tr_TR' },
  { lang: 'de', hrefLang: 'de', ogLocale: 'de_DE' },
  { lang: 'es', hrefLang: 'es', ogLocale: 'es_ES' },
  { lang: 'fr', hrefLang: 'fr', ogLocale: 'fr_FR' },
  { lang: 'ar', hrefLang: 'ar-SA', ogLocale: 'ar_SA' },
  { lang: 'bn', hrefLang: 'bn-BD', ogLocale: 'bn_BD' },
  { lang: 'fa', hrefLang: 'fa-IR', ogLocale: 'fa_IR' },
  { lang: 'he', hrefLang: 'he-IL', ogLocale: 'he_IL' },
  { lang: 'hi', hrefLang: 'hi-IN', ogLocale: 'hi_IN' },
  { lang: 'hk', hrefLang: 'zh-HK', ogLocale: 'zh_HK' },
  { lang: 'id', hrefLang: 'id-ID', ogLocale: 'id_ID' },
  { lang: 'ja', hrefLang: 'ja-JP', ogLocale: 'ja_JP' },
  { lang: 'kp', hrefLang: 'ko-KP', ogLocale: 'ko_KP' },
  { lang: 'kr', hrefLang: 'ko-KR', ogLocale: 'ko_KR' },
  { lang: 'pl', hrefLang: 'pl-PL', ogLocale: 'pl_PL' },
  { lang: 'pt', hrefLang: 'pt-BR', ogLocale: 'pt_BR' },
  { lang: 'ru', hrefLang: 'ru-RU', ogLocale: 'ru_RU' },
  { lang: 'th', hrefLang: 'th-TH', ogLocale: 'th_TH' },
  { lang: 'tw', hrefLang: 'zh-TW', ogLocale: 'zh_TW' },
  { lang: 'zh', hrefLang: 'zh-CN', ogLocale: 'zh_CN' },
]

export const DEFAULT_OG_LOCALE = SUPPORTED_LOCALES[0]?.ogLocale || 'en_US'

export const SEO_LANGUAGES = [
  ...SUPPORTED_LOCALES.map(({ hrefLang, lang }) => ({ hrefLang, lang })),
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

const ROBOTS_INDEX =
  'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
const ROBOTS_NOINDEX = 'noindex, nofollow'

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
  const robots = noindex ? ROBOTS_NOINDEX : ROBOTS_INDEX

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
