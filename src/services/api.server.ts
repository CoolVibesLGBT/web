'use server'

import type { ActionType } from './actions'
import type { ApiRequestContext, ApiRequestOptions } from './api.types'

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof FormData)

const buildAuthHeaders = (authToken?: string | null) =>
  authToken ? { Authorization: authToken } : {}

const readJsonSafely = async (response: Response) => {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

const makeApiError = (response: Response, payload: any) => {
  const message =
    payload?.message ||
    payload?.error ||
    response.statusText ||
    'Request failed'

  const error = new Error(message) as Error & {
    response?: { status: number; data: unknown; message?: string }
  }

  error.response = {
    status: response.status,
    data: payload,
    message: payload?.message
  }

  return error
}

export async function callApi<T = unknown>(
  action: ActionType,
  options: ApiRequestOptions = {},
  context: ApiRequestContext
): Promise<T> {
  const baseURL = context.baseURL
  if (!baseURL) {
    throw new Error('Missing API base URL')
  }

  const method = options.method ?? 'GET'
  const authHeaders = buildAuthHeaders(context.authToken)
  const url = new URL('/', baseURL)

  if (method === 'GET') {
    url.searchParams.set('action', action)
    if (options.params) {
      for (const [key, value] of Object.entries(options.params)) {
        if (value === undefined || value === null) continue
        if (Array.isArray(value)) {
          value.forEach((entry) => url.searchParams.append(key, String(entry)))
        } else {
          url.searchParams.set(key, String(value))
        }
      }
    }

    const response = await fetch(url.toString(), {
      headers: {
        ...authHeaders,
        Accept: 'application/json'
      }
    })

    const payload = await readJsonSafely(response)
    if (!response.ok) {
      throw makeApiError(response, payload)
    }
    return (payload?.data ?? payload) as T
  }

  const body = options.body ?? {}
  const formData = body instanceof FormData ? body : new FormData()

  if (!(body instanceof FormData)) {
    if (isPlainObject(body)) {
      for (const [key, value] of Object.entries(body)) {
        if (value === undefined || value === null) continue
        const isBlob = typeof Blob !== 'undefined' && value instanceof Blob
        const isFile = typeof File !== 'undefined' && value instanceof File
        if (isBlob || isFile) {
          formData.append(key, value as Blob)
        } else if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value))
        } else {
          formData.append(key, String(value))
        }
      }
    } else if (body !== undefined && body !== null) {
      formData.append(
        'body',
        typeof body === 'string' ? body : JSON.stringify(body)
      )
    }
  }

  if (!formData.has('action')) {
    formData.append('action', action)
  }

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      ...authHeaders
    },
    body: formData
  })

  const payload = await readJsonSafely(response)
  if (!response.ok) {
    throw makeApiError(response, payload)
  }
  return (payload?.data ?? payload) as T
}
