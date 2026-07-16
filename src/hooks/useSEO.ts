import { useEffect, useLayoutEffect } from 'react'
import {
  resolveSeo,
  SITE_NAME,
  SITE_TWITTER_HANDLE,
  DEFAULT_IMAGE_ALT,
  DEFAULT_OG_LOCALE,
  type SEOOptions
} from '@/seo/seoConfig'

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

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect

export function useSEO(options: SEOOptions = {}) {
  useIsomorphicLayoutEffect(() => {
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
    setMeta('og:image:alt', DEFAULT_IMAGE_ALT, true)
    setMeta('og:site_name', SITE_NAME, true)
    setMeta('og:locale', DEFAULT_OG_LOCALE, true)

    setMeta('twitter:title', resolved.title)
    setMeta('twitter:description', resolved.description)
    setMeta('twitter:image', resolved.image)
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:image:alt', DEFAULT_IMAGE_ALT)
    setMeta('twitter:site', SITE_TWITTER_HANDLE)
    setMeta('twitter:creator', SITE_TWITTER_HANDLE)
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
