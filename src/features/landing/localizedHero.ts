import { normalizeLanguage } from '@/i18n/language'

type Hero = { image: string; place: string }

const locations: Record<string, string> = {
  ne: 'काठमाडौं · नेपाल',
  km: 'ភ្នំពេញ · កម្ពុជា',
  tr: 'İstanbul · Türkiye',
  en: 'New York · United States',
  de: 'Berlin · Deutschland',
  fr: 'Paris · France',
  es: 'Barcelona · España',
  pt: 'Rio de Janeiro · Brasil',
  zh: '上海 · 中国',
  tw: '台北 · 台灣',
  hk: '維多利亞港 · 香港',
  ja: '東京 · 日本',
  he: 'תל אביב · ישראל',
  fa: 'اصفهان · ایران',
  ar: 'تراث العالم العربي',
  bn: 'ঢাকা · বাংলাদেশ',
  hi: 'जयपुर · भारत',
  th: 'กรุงเทพมหานคร · ประเทศไทย',
  id: 'Yogyakarta · Indonesia',
  pl: 'Warszawa · Polska',
  ru: 'Санкт-Петербург · Россия',
  kr: '서울 · 대한민국',
  kp: '개성 · 조선',
}

export function getLocalizedHero(language: string): Hero {
  const locale = normalizeLanguage(language)
  return {
    image: `/images/landing/${locale === 'tr' ? 'istanbul-hero' : `hero-${locale}`}.avif`,
    place: locations[locale],
  }
}
