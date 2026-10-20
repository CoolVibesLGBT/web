import { SUPPORTED_LOCALES } from '@/seo/seoConfig'

const supported = new Set<string>(SUPPORTED_LOCALES.map(({ lang }) => lang))

/** Convert browser/API BCP 47 tags to the application's existing locale codes. */
export function normalizeLanguage(language?: string): string {
  const tag = (language || '').trim().toLowerCase().replace(/_/g, '-')
  if (supported.has(tag)) return tag
  const parts = tag.split('-')
  if (parts[0] === 'zh') {
    if (parts.includes('hk') || parts.includes('mo')) return 'hk'
    if (parts.includes('tw') || parts.includes('hant')) return 'tw'
    return 'zh'
  }
  if (parts[0] === 'yue') return 'hk'
  if (parts[0] === 'ko') return parts.includes('kp') ? 'kp' : 'kr'
  const base = ({ iw: 'he', in: 'id' } as Record<string, string>)[parts[0]] || parts[0]
  return supported.has(base) ? base : 'en'
}

/** Valid HTML language tags; hk/tw/kr/kp are internal application identifiers. */
export function getLanguageTag(language: string): string {
  const locale = normalizeLanguage(language)
  return SUPPORTED_LOCALES.find(({ lang }) => lang === locale)?.hrefLang || 'en'
}
