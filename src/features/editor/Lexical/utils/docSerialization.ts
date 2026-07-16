import type { SerializedDocument } from '@lexical/file'

const encode = (value: string) => {
  if (typeof btoa === 'undefined') return ''
  return btoa(unescape(encodeURIComponent(value)))
}

const decode = (value: string) => {
  if (typeof atob === 'undefined') return ''
  return decodeURIComponent(escape(atob(value)))
}

export async function docToHash(doc: SerializedDocument): Promise<string> {
  try {
    return encode(JSON.stringify(doc))
  } catch {
    return ''
  }
}

export async function docFromHash(hash: string): Promise<SerializedDocument | null> {
  if (!hash) return null
  const cleaned = hash.startsWith('#') ? hash.slice(1) : hash
  if (!cleaned) return null

  try {
    const json = decode(cleaned)
    if (!json) return null
    return JSON.parse(json) as SerializedDocument
  } catch {
    return null
  }
}
