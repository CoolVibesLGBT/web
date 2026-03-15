import { useEffect } from 'react'

const DEFAULT_TITLE = 'CoolVibes – Inclusive LGBTIQA+ Gay Dating App'
const DEFAULT_DESCRIPTION =
  'CoolVibes is the safest and most inclusive gay dating app for the LGBTIQA+ community. Connect, chat, and find meaningful relationships with like-minded people worldwide.'
const DEFAULT_IMAGE = 'https://coolvibes.lgbt/images/icons/icon_512x512.jpg'
const SITE_URL = 'https://coolvibes.lgbt'
const SITE_NAME = 'CoolVibes'

interface SEOOptions {
  title?: string
  description?: string
  keywords?: string
  image?: string
  canonical?: string
  type?: 'website' | 'article' | 'profile'
  noindex?: boolean
}

function setMeta(name: string, content: string, property = false) {
  const attr = property ? 'property' : 'name'
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

export function useSEO(options: SEOOptions = {}) {
  useEffect(() => {
    const {
      title,
      description = DEFAULT_DESCRIPTION,
      keywords,
      image = DEFAULT_IMAGE,
      canonical,
      type = 'website',
      noindex = false,
    } = options

    // Title
    const fullTitle = title ? `${title} | CoolVibes` : DEFAULT_TITLE
    document.title = fullTitle

    // Core meta
    setMeta('description', description)
    if (keywords) setMeta('keywords', keywords)
    setMeta('robots', noindex ? 'noindex, nofollow' : 'index, follow')

    // Canonical
    const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : SITE_URL
    setLink('canonical', canonicalUrl)

    // Open Graph
    setMeta('og:title', fullTitle, true)
    setMeta('og:description', description, true)
    setMeta('og:type', type, true)
    setMeta('og:url', canonicalUrl, true)
    setMeta('og:image', image, true)
    setMeta('og:site_name', SITE_NAME, true)

    // Twitter Card
    setMeta('twitter:title', fullTitle)
    setMeta('twitter:description', description)
    setMeta('twitter:image', image)
    setMeta('twitter:card', 'summary_large_image')

    // Cleanup: restore meta on unmount (title is set by next route or App fallback)
    return () => {
      setMeta('description', DEFAULT_DESCRIPTION)
      setMeta('robots', 'index, follow')
      setLink('canonical', SITE_URL)
      setMeta('og:title', DEFAULT_TITLE, true)
      setMeta('og:description', DEFAULT_DESCRIPTION, true)
      setMeta('og:type', 'website', true)
      setMeta('og:url', SITE_URL, true)
      setMeta('og:image', DEFAULT_IMAGE, true)
      setMeta('twitter:title', DEFAULT_TITLE)
      setMeta('twitter:description', DEFAULT_DESCRIPTION)
      setMeta('twitter:image', DEFAULT_IMAGE)
    }
  }, [
    options.title,
    options.description,
    options.keywords,
    options.image,
    options.canonical,
    options.type,
    options.noindex,
  ])
}

export default useSEO
