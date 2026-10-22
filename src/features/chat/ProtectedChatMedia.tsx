import { useEffect, useState, type ImgHTMLAttributes, type VideoHTMLAttributes, type ReactNode } from 'react'
import { serviceURL } from '@/appSettings'

function requiresAuthorization(src: string | undefined) {
  if (!src) return false
  try {
    const address = new URL(src, location.origin)
    return address.pathname.startsWith('/static/uploads/') && serviceURL.some(base => new URL(base).origin === address.origin)
  } catch { return false }
}

/** Load private chat files without putting credentials in URLs or public requests. */
function useChatMediaSource(src: string | undefined): { url?: string; failed?: boolean } {
  const protectedSource = requiresAuthorization(src)
  const [result, setResult] = useState<{ source: string; url?: string; failed?: boolean } | null>(null)
  useEffect(() => {
    if (!src || !protectedSource) return
    const controller = new AbortController()
    let objectUrl: string | undefined
    const token = localStorage.getItem('authToken')
    const authorization = token ? /^Bearer /i.test(token) ? token : `Bearer ${token}` : ''
    void fetch(src, { headers: authorization ? { Authorization: authorization } : {}, signal: controller.signal, cache: 'no-store' })
      .then(async response => {
        if (!response.ok || !/^(image|video)\//i.test(response.headers.get('content-type') || '')) throw new Error('Media unavailable')
        const blob = await response.blob()
        if (controller.signal.aborted) return
        objectUrl = URL.createObjectURL(blob)
        setResult({ source: src, url: objectUrl })
      }).catch(() => { if (!controller.signal.aborted) setResult({ source: src, failed: true }) })
    return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [src, protectedSource])
  return protectedSource ? result?.source === src ? result : {} : { url: src }
}

export function ChatMediaImage({ src, unavailable, ...props }: ImgHTMLAttributes<HTMLImageElement> & { unavailable?: ReactNode }) {
  const source = useChatMediaSource(src)
  if (source.failed) return <>{unavailable}</>
  return source.url ? <img {...props} src={source.url} /> : null
}

export function ChatMediaVideo({ src, poster, unavailable, ...props }: VideoHTMLAttributes<HTMLVideoElement> & { unavailable?: ReactNode }) {
  const source = useChatMediaSource(src)
  const preview = useChatMediaSource(poster)
  if (source.failed) return <>{unavailable}</>
  return source.url ? <video {...props} src={source.url} poster={preview.url} /> : null
}
