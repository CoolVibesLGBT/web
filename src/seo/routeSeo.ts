import type { SEOOptions } from '@/seo/seoConfig'

type RouteMatcher = string | RegExp | ((path: string) => boolean)

export const ROUTE_DEFAULT_TITLES: Record<string, string> = {
  '/': 'Pride',
  '/home': 'Home',
  '/pride': 'Pride',
  '/search': 'Search',
  '/nearby': 'Nearby',
  '/match': 'Match',
  '/messages': 'Messages',
  '/notifications': 'Notifications',
  '/places': 'LGBTQ+ Places',
  '/wallet': 'Wallet',
  '/referrals': 'Referrals',
  '/classifieds': 'Classifieds',
  '/checkin': 'Check-In',
  '/settings': 'Settings',
  '/profile': 'Profile',
  '/landing': 'Where Every Voice Matters',
  '/legal': 'Legal',
  '/premium': 'Premium',
}

const ROUTE_DESCRIPTIONS: Record<string, string> = {
  '/': 'Explore the Pride feed and discover the CoolVibes community.',
  '/home': 'Your CoolVibes home base for updates and new connections.',
  '/pride': 'Explore the Pride feed and discover the CoolVibes community.',
  '/search': 'Search profiles, posts, and places on CoolVibes.',
  '/nearby': 'Find LGBTQ+ people and places nearby.',
  '/match': 'Discover and match with new people on CoolVibes.',
  '/messages': 'Private conversations on CoolVibes.',
  '/notifications': 'Your CoolVibes notifications and alerts.',
  '/places': 'Discover LGBTQ+ friendly places, venues, and events.',
  '/wallet': 'Wallet and billing on CoolVibes.',
  '/referrals': 'Invite friends and grow the CoolVibes community.',
  '/classifieds': 'Browse classifieds from the CoolVibes community.',
  '/checkin': 'Share check-ins at LGBTQ+ friendly places.',
  '/settings': 'Manage your CoolVibes account settings.',
  '/profile': 'Your profile and activity on CoolVibes.',
  '/landing': 'Where every voice matters. Join the inclusive CoolVibes community.',
  '/legal': 'Legal information, policies, and guidelines for CoolVibes.',
  '/premium': 'Learn about CoolVibes Premium benefits.',
}

const NOINDEX_PREFIXES = [
  '/messages',
  '/settings',
  '/wallet',
  '/profile',
  '/notifications',
  '/match',
  '/checkin',
  '/referrals',
  '/classifieds',
  '/search',
  '/nearby',
  '/premium',
  '/testpage',
  '/ref/',
]

const ROUTE_SEO: Array<{ match: RouteMatcher; seo: SEOOptions }> = [
  { match: '/', seo: { title: ROUTE_DEFAULT_TITLES['/'], description: ROUTE_DESCRIPTIONS['/'] } },
  { match: '/landing', seo: { title: ROUTE_DEFAULT_TITLES['/landing'], description: ROUTE_DESCRIPTIONS['/landing'] } },
  { match: '/places', seo: { title: ROUTE_DEFAULT_TITLES['/places'], description: ROUTE_DESCRIPTIONS['/places'] } },
  { match: /^\/places\//, seo: { title: 'LGBTQ+ Place', description: ROUTE_DESCRIPTIONS['/places'] } },
  { match: /^\/legal(\/|$)/, seo: { title: ROUTE_DEFAULT_TITLES['/legal'], description: ROUTE_DESCRIPTIONS['/legal'] } },
  { match: '/pride', seo: { title: ROUTE_DEFAULT_TITLES['/pride'], description: ROUTE_DESCRIPTIONS['/pride'] } },
  { match: '/home', seo: { title: ROUTE_DEFAULT_TITLES['/home'], description: ROUTE_DESCRIPTIONS['/home'] } },
  { match: '/search', seo: { title: ROUTE_DEFAULT_TITLES['/search'], description: ROUTE_DESCRIPTIONS['/search'], noindex: true } },
  { match: '/nearby', seo: { title: ROUTE_DEFAULT_TITLES['/nearby'], description: ROUTE_DESCRIPTIONS['/nearby'], noindex: true } },
  { match: '/match', seo: { title: ROUTE_DEFAULT_TITLES['/match'], description: ROUTE_DESCRIPTIONS['/match'], noindex: true } },
  { match: '/messages', seo: { title: ROUTE_DEFAULT_TITLES['/messages'], description: ROUTE_DESCRIPTIONS['/messages'], noindex: true } },
  { match: '/notifications', seo: { title: ROUTE_DEFAULT_TITLES['/notifications'], description: ROUTE_DESCRIPTIONS['/notifications'], noindex: true } },
  { match: '/classifieds', seo: { title: ROUTE_DEFAULT_TITLES['/classifieds'], description: ROUTE_DESCRIPTIONS['/classifieds'], noindex: true } },
  { match: '/checkin', seo: { title: ROUTE_DEFAULT_TITLES['/checkin'], description: ROUTE_DESCRIPTIONS['/checkin'], noindex: true } },
  { match: '/wallet', seo: { title: ROUTE_DEFAULT_TITLES['/wallet'], description: ROUTE_DESCRIPTIONS['/wallet'], noindex: true } },
  { match: '/referrals', seo: { title: ROUTE_DEFAULT_TITLES['/referrals'], description: ROUTE_DESCRIPTIONS['/referrals'], noindex: true } },
  { match: '/settings', seo: { title: ROUTE_DEFAULT_TITLES['/settings'], description: ROUTE_DESCRIPTIONS['/settings'], noindex: true } },
  { match: '/premium', seo: { title: ROUTE_DEFAULT_TITLES['/premium'], description: ROUTE_DESCRIPTIONS['/premium'], noindex: true } },
  { match: '/profile', seo: { title: ROUTE_DEFAULT_TITLES['/profile'], description: ROUTE_DESCRIPTIONS['/profile'], noindex: true } },
]

const normalizePath = (path: string) => {
  if (!path) return '/'
  const cleaned = path.split('?')[0]?.split('#')[0] || '/'
  if (cleaned !== '/' && cleaned.endsWith('/')) {
    return cleaned.slice(0, -1)
  }
  return cleaned
}

const matches = (matcher: RouteMatcher, path: string) => {
  if (typeof matcher === 'string') return matcher === path
  if (matcher instanceof RegExp) return matcher.test(path)
  return matcher(path)
}

const isNoindexPath = (path: string) =>
  NOINDEX_PREFIXES.some((prefix) =>
    prefix.endsWith('/')
      ? path.startsWith(prefix)
      : path === prefix || path.startsWith(`${prefix}/`)
  )

export const getRouteSeo = (path: string): SEOOptions => {
  const normalized = normalizePath(path)

  const matched = ROUTE_SEO.find(({ match }) => matches(match, normalized))
  if (matched) {
    return {
      canonical: normalized,
      ...matched.seo,
      noindex: matched.seo.noindex ?? isNoindexPath(normalized),
    }
  }

  if (normalized.includes('/status/')) {
    return {
      title: 'Post',
      description: 'Read the latest post on CoolVibes.',
      type: 'article',
      canonical: normalized,
      noindex: isNoindexPath(normalized),
    }
  }

  const segments = normalized.split('/').filter(Boolean)
  if (segments.length === 1) {
    return {
      title: 'Profile',
      description: 'Member profile on CoolVibes.',
      type: 'profile',
      canonical: normalized,
      noindex: isNoindexPath(normalized),
    }
  }

  return {
    canonical: normalized,
    noindex: isNoindexPath(normalized),
  }
}
