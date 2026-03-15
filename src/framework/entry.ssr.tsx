import { createFromReadableStream } from '@vitejs/plugin-rsc/ssr'
import { renderToReadableStream } from 'react-dom/server.edge'
import htmlTemplate from '../../index.html?raw'
import { getRouteSeo } from '@/seo/routeSeo'
import { resolveSeo, SITE_NAME } from '@/seo/seoConfig'

const ROOT_MARKUP = '<div id="root"></div>'
const SCRIPT_TAG = '<script type="module" src="/src/framework/entry.browser.tsx"></script>'

const injectRootHtml = (html: string, appHtml: string) => {
  if (html.includes(ROOT_MARKUP)) {
    return html.replace(ROOT_MARKUP, `<div id="root">${appHtml}</div>`)
  }
  return html.replace(
    /<div\s+id="root"><\/div>/,
    `<div id="root">${appHtml}</div>`
  )
}

const injectBootstrapScript = (html: string, bootstrapScriptContent: string) => {
  if (html.includes(SCRIPT_TAG)) {
    return html.replace(
      SCRIPT_TAG,
      `<script type="module">${bootstrapScriptContent}</script>`
    )
  }

  return html.replace(
    /<script\s+type="module"\s+src="[^"]+"><\/script>/,
    `<script type="module">${bootstrapScriptContent}</script>`
  )
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const insertBeforeHeadClose = (html: string, snippet: string) => {
  const closeIndex = html.indexOf('</head>')
  if (closeIndex === -1) return html + snippet
  return `${html.slice(0, closeIndex)}${snippet}${html.slice(closeIndex)}`
}

const upsertTitle = (html: string, title: string) => {
  const tag = `<title>${escapeHtml(title)}</title>`
  const pattern = /<title>[\s\S]*?<\/title>/i
  if (pattern.test(html)) {
    return html.replace(pattern, tag)
  }
  return insertBeforeHeadClose(html, `  ${tag}\n`)
}

const upsertMeta = (html: string, attr: 'name' | 'property', name: string, content: string) => {
  const tag = `<meta ${attr}="${name}" content="${escapeHtml(content)}" />`
  const pattern = new RegExp(
    `<meta\\s+[^>]*${attr}=(["'])${escapeRegExp(name)}\\1[^>]*>`,
    'i'
  )
  if (pattern.test(html)) {
    return html.replace(pattern, tag)
  }
  return insertBeforeHeadClose(html, `  ${tag}\n`)
}

const upsertLink = (html: string, rel: string, href: string) => {
  const tag = `<link rel="${rel}" href="${escapeHtml(href)}" />`
  const pattern = new RegExp(
    `<link\\s+[^>]*rel=(["'])${escapeRegExp(rel)}\\1[^>]*>`,
    'i'
  )
  if (pattern.test(html)) {
    return html.replace(pattern, tag)
  }
  return insertBeforeHeadClose(html, `  ${tag}\n`)
}

const injectSeoTags = (html: string, requestUrl?: string) => {
  const path = (() => {
    if (!requestUrl) return '/'
    try {
      const url = new URL(requestUrl)
      return url.pathname || '/'
    } catch {
      return '/'
    }
  })()

  const routeSeo = getRouteSeo(path)
  const resolved = resolveSeo(routeSeo, path)

  let next = html
  next = upsertTitle(next, resolved.title)
  next = upsertMeta(next, 'name', 'description', resolved.description)
  if (resolved.keywords) {
    next = upsertMeta(next, 'name', 'keywords', resolved.keywords)
  }
  next = upsertMeta(next, 'name', 'robots', resolved.robots)
  next = upsertLink(next, 'canonical', resolved.canonicalUrl)

  next = upsertMeta(next, 'property', 'og:title', resolved.title)
  next = upsertMeta(next, 'property', 'og:description', resolved.description)
  next = upsertMeta(next, 'property', 'og:type', resolved.type)
  next = upsertMeta(next, 'property', 'og:url', resolved.canonicalUrl)
  next = upsertMeta(next, 'property', 'og:image', resolved.image)
  next = upsertMeta(next, 'property', 'og:site_name', SITE_NAME)

  next = upsertMeta(next, 'name', 'twitter:title', resolved.title)
  next = upsertMeta(next, 'name', 'twitter:description', resolved.description)
  next = upsertMeta(next, 'name', 'twitter:image', resolved.image)
  next = upsertMeta(next, 'name', 'twitter:card', 'summary_large_image')

  return next
}

export async function handleSsr(rscStream: ReadableStream, requestUrl?: string) {
  const root = await createFromReadableStream(rscStream)
  const bootstrapScriptContent = await import.meta.viteRsc.loadBootstrapScriptContent('index')
  const htmlStream = await renderToReadableStream(root)
  const streamWithReady = htmlStream as ReadableStream<Uint8Array> & {
    allReady?: Promise<void>
  }

  if (streamWithReady.allReady) {
    await streamWithReady.allReady
  }

  const appHtml = await new Response(streamWithReady).text()
  const withAppHtml = injectRootHtml(htmlTemplate, appHtml)
  const withSeo = injectSeoTags(withAppHtml, requestUrl)
  return injectBootstrapScript(withSeo, bootstrapScriptContent)
}
