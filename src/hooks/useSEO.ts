import { useEffect } from 'react'
import { resolveSeo, SITE_NAME, type SEOOptions } from '@/seo/seoConfig'

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

const DEFAULT_RESOLVED = resolveSeo()

export function useSEO(options: SEOOptions = {}) {
  useEffect(() => {
    const path = typeof window !== 'undefined' ? window.location.pathname : undefined
    const resolved = resolveSeo(options, path)

    document.title = resolved.title
    setMeta('description', resolved.description)
    if (resolved.keywords) setMeta('keywords', resolved.keywords)
    setMeta('robots', resolved.robots)
    setLink('canonical', resolved.canonicalUrl)

    setMeta('og:title', resolved.title, true)
    setMeta('og:description', resolved.description, true)
    setMeta('og:type', resolved.type, true)
    setMeta('og:url', resolved.canonicalUrl, true)
    setMeta('og:image', resolved.image, true)
    setMeta('og:site_name', SITE_NAME, true)

    setMeta('twitter:title', resolved.title)
    setMeta('twitter:description', resolved.description)
    setMeta('twitter:image', resolved.image)
    setMeta('twitter:card', 'summary_large_image')

    return () => {
      document.title = DEFAULT_RESOLVED.title
      setMeta('description', DEFAULT_RESOLVED.description)
      if (DEFAULT_RESOLVED.keywords) setMeta('keywords', DEFAULT_RESOLVED.keywords)
      setMeta('robots', DEFAULT_RESOLVED.robots)
      setLink('canonical', DEFAULT_RESOLVED.canonicalUrl)
      setMeta('og:title', DEFAULT_RESOLVED.title, true)
      setMeta('og:description', DEFAULT_RESOLVED.description, true)
      setMeta('og:type', DEFAULT_RESOLVED.type, true)
      setMeta('og:url', DEFAULT_RESOLVED.canonicalUrl, true)
      setMeta('og:image', DEFAULT_RESOLVED.image, true)
      setMeta('twitter:title', DEFAULT_RESOLVED.title)
      setMeta('twitter:description', DEFAULT_RESOLVED.description)
      setMeta('twitter:image', DEFAULT_RESOLVED.image)
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
