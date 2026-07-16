export interface ApiRequestOptions {
  method?: 'GET' | 'POST'
  params?: Record<string, unknown>
  body?: Record<string, unknown> | FormData | unknown
  onUploadProgress?: (progressEvent: { loaded: number; total?: number }) => void
}

export interface ApiRequestContext {
  baseURL: string
  authToken?: string | null
}
