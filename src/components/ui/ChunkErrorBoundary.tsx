import React from 'react'
import i18n from '@/i18n'

interface State { hasError: boolean; reloading: boolean; chunkError: boolean }
const isChunkError = (error: Error) => error?.name === 'ChunkLoadError' || [
  'Failed to fetch dynamically imported module', 'Loading chunk', 'Loading CSS chunk', 'Importing a module script failed',
].some(message => error?.message?.includes(message))

/** Recover stale deployment chunks once; contain other render errors without a blank app. */
class ChunkErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  static SESSION_KEY = 'chunk_reload_attempted'
  state: State = { hasError: false, reloading: false, chunkError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, reloading: false, chunkError: isChunkError(error) }
  }

  componentDidCatch(error: Error) {
    if (!isChunkError(error) || !import.meta.env.PROD) return
    try {
      if (sessionStorage.getItem(ChunkErrorBoundary.SESSION_KEY)) return
      sessionStorage.setItem(ChunkErrorBoundary.SESSION_KEY, '1')
    } catch { return }
    this.setState({ reloading: true })
    window.location.reload()
  }

  retry = () => {
    if (!this.state.chunkError) {
      this.setState({ hasError: false, reloading: false, chunkError: false })
      return
    }
    try { sessionStorage.removeItem(ChunkErrorBoundary.SESSION_KEY) } catch { /* Storage can be disabled. */ }
    this.setState({ reloading: true })
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return <div role="alert" className="flex h-full min-h-64 w-full flex-col items-center justify-center gap-4 bg-[var(--cv-page-bg)] p-6 text-center text-[var(--cv-neutral-1)]">
      <h1 className="text-xl font-semibold">{i18n.t('app.screen_error_title')}</h1>
      <p className="max-w-md text-base text-[var(--cv-neutral-2)]">{i18n.t('app.screen_error_message')}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" onClick={this.retry} disabled={this.state.reloading} className="cv-btn">{i18n.t('app.trending_retry')}</button>
        <a href="/" className="cv-btn cv-btn-secondary">{i18n.t('app.nav.home')}</a>
      </div>
    </div>
  }
}

export default ChunkErrorBoundary
