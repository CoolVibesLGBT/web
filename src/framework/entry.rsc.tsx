import { decodeReply, loadServerAction, renderToReadableStream } from '@vitejs/plugin-rsc/rsc'
import AppShell from './AppShell'

type ServerHandler = (request: Request) => Promise<Response>

const ACTION_HEADER = 'x-rsc-action'
const ACTION_PATH = '/__rsc_action'

const handleRequest: ServerHandler = async (request) => {
  const url = new URL(request.url)

  if (url.pathname === ACTION_PATH && request.method === 'POST') {
    const actionId = request.headers.get(ACTION_HEADER)
    if (!actionId) {
      return new Response(JSON.stringify({ message: 'Missing action id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    try {
      const contentType = request.headers.get('content-type') || ''
      const body =
        contentType.includes('multipart/form-data')
          ? await request.formData()
          : await request.text()

      const args = (await decodeReply(body)) as unknown[]
      const action = await loadServerAction(actionId)
      const result = await action(...args)

      return new Response(JSON.stringify({ data: result }), {
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (error: any) {
      return new Response(
        JSON.stringify({ message: error?.message || 'Server action failed' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }
  }
  const rscStream = renderToReadableStream(<AppShell initialUrl={request.url} />)

  if (url.pathname.endsWith('.rsc')) {
    return new Response(rscStream, {
      headers: {
        'Content-Type': 'text/x-component;charset=utf-8'
      }
    })
  }

  const ssrEntry = await import.meta.viteRsc.loadModule<
    typeof import('./entry.ssr')
  >('ssr', 'index')

  const html = await ssrEntry.handleSsr(rscStream, request.url)

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8'
    }
  })
}

export default handleRequest

if (import.meta.hot) {
  import.meta.hot.accept()
}
