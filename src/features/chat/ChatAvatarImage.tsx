import { useEffect, useState, type ImgHTMLAttributes } from 'react';
import { serviceURL } from '@/appSettings';

/** Chat-owned images require the same bearer authorization as message media. */
export default function ChatAvatarImage({ src, protectedMedia = false, ...props }: ImgHTMLAttributes<HTMLImageElement> & { protectedMedia?: boolean }) {
  const [loaded, setLoaded] = useState<{ source: string; url: string } | null>(null);
  useEffect(() => {
    if (!protectedMedia || !src) return;
    let address: URL;
    try { address = new URL(src, location.origin); } catch { return; }
    // Account credentials may only be sent to this application's configured API origins.
    if (!serviceURL.some(base => { try { return new URL(base).origin === address.origin; } catch { return false; } })) return;
    const controller = new AbortController(); let objectUrl: string | undefined;
    const token = localStorage.getItem('authToken');
    const authorization = token ? /^Bearer /i.test(token) ? token : `Bearer ${token}` : '';
    void fetch(address.href, { headers: authorization ? { Authorization: authorization } : {}, signal: controller.signal }).then(async response => {
      if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) throw new Error('Image unavailable');
      const blob = await response.blob();
      if (controller.signal.aborted) return;
      objectUrl = URL.createObjectURL(blob); setLoaded({ source: src, url: objectUrl });
    }).catch(() => { /* The peer's initials remain visible underneath. */ });
    return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [src, protectedMedia]);
  const isApiImage = protectedMedia && src && serviceURL.some(base => { try { return new URL(base).origin === new URL(src, location.origin).origin; } catch { return false; } });
  const resolved = isApiImage ? loaded?.source === src ? loaded.url : undefined : src;
  return resolved ? <img {...props} src={resolved} /> : null;
}
