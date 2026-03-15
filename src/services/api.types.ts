export interface ApiRequestOptions {
  method?: 'GET' | 'POST'
  params?: Record<string, unknown>
  body?: Record<string, unknown> | FormData | unknown
}

export interface ApiRequestContext {
  baseURL: string
  authToken?: string | null
}
