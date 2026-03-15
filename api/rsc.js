import { pathToFileURL, fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import { Readable } from 'node:stream'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distCandidates = [
  path.resolve(process.cwd(), 'dist'),
  path.resolve(process.cwd(), '.vercel', 'output', 'static'),
  path.resolve(__dirname, '..', 'dist'),
]

const resolveRscEntry = () => {
  for (const root of distCandidates) {
    const candidate = path.join(root, 'rsc', 'index.js')
    if (fs.existsSync(candidate)) return candidate
  }
  return path.join(distCandidates[0], 'rsc', 'index.js')
}

let handlerPromise
const loadHandler = async () => {
  if (!handlerPromise) {
    const rscEntry = resolveRscEntry()
    handlerPromise = import(pathToFileURL(rscEntry).href).then(
      (mod) => mod.default || mod.handleRequest || mod
    )
  }
  return handlerPromise
}

const readBody = (req) =>
  new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(chunks.length ? Buffer.concat(chunks) : undefined))
    req.on('error', reject)
  })

const toHeaders = (req) => {
  const headers = new Headers()
  Object.entries(req.headers || {}).forEach(([key, value]) => {
    if (typeof value === 'string') headers.set(key, value)
    else if (Array.isArray(value)) headers.set(key, value.join(','))
  })
  return headers
}

export default async function handler(req, res) {
  try {
    const method = req.method || 'GET'
    const headers = toHeaders(req)
    const host = req.headers?.host || process.env.VERCEL_URL || 'localhost'
    const proto =
      req.headers?.['x-forwarded-proto'] ||
      (host.includes('localhost') ? 'http' : 'https')
    const url = new URL(req.url || '/', `${proto}://${host}`)
    const body =
      method === 'GET' || method === 'HEAD' ? undefined : await readBody(req)

    const request = new Request(url, { method, headers, body })
    const handleRequest = await loadHandler()
    const response = await handleRequest(request)

    res.statusCode = response.status
    response.headers.forEach((value, key) => {
      res.setHeader(key, value)
    })

    if (!response.body) {
      res.end()
      return
    }

    if (Readable.fromWeb) {
      Readable.fromWeb(response.body).pipe(res)
      return
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    res.end(buffer)
  } catch (error) {
    console.error('RSC handler error', error)
    res.statusCode = 500
    res.end('Server error')
  }
}
