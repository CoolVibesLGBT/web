import { createRoot, hydrateRoot } from 'react-dom/client'
import { createFromReadableStream, encodeReply, setServerCallback } from '@vitejs/plugin-rsc/browser'

const container = document.getElementById('root')

if (!container) {
  throw new Error('Root container not found')
}

let root: ReturnType<typeof createRoot> | null = null

const getRscResponse = async () => {
  const rscUrl = new URL(window.location.href)
  rscUrl.pathname += '.rsc'
  const response = await fetch(rscUrl)
  if (!response.body) {
    throw new Error('Missing RSC response body')
  }
  return response.body
}

const callServer = async (actionId: string, args: unknown[]) => {
  const body = await encodeReply(args)
  const response = await fetch('/__rsc_action', {
    method: 'POST',
    headers: {
      'x-rsc-action': actionId,
    },
    body,
    credentials: 'include',
  })

  let payload: any = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    const error = new Error(payload?.message || payload?.error || 'Server action failed') as Error & {
      response?: { status: number; data: unknown; message?: string }
    }
    error.response = {
      status: response.status,
      data: payload,
      message: payload?.message,
    }
    throw error
  }

  return payload?.data ?? payload
}

setServerCallback(callServer)

const render = async () => {
  const rscStream = await getRscResponse()
  const rscRoot = await createFromReadableStream(rscStream)

  if (!root) {
    if (container.hasChildNodes()) {
      root = hydrateRoot(container, rscRoot)
      return
    }
    root = createRoot(container)
  }

  root.render(rscRoot)
}

render()

if (import.meta.hot) {
  import.meta.hot.on('rsc:update', render)
}
