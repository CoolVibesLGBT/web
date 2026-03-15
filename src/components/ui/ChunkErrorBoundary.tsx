import React from 'react';

interface State {
  hasError: boolean;
  reloading: boolean;
}

/**
 * ChunkErrorBoundary
 *
 * Catches dynamic import / chunk-load failures that happen when a new
 * production build is deployed while a user still has the old version
 * open in their browser. In that case:
 *
 *   1. Vite renames chunk files with new content hashes.
 *   2. The old index.html tries to fetch the OLD hash → 404.
 *   3. The server returns the SPA fallback HTML with a 200.
 *   4. The browser rejects it because MIME type is "text/html", not JS.
 *
 * When this boundary catches such an error it automatically triggers a
 * hard-reload so the browser fetches the fresh index.html and everything
 * works again. A "Reload" button is shown as a fallback in case the
 * automatic reload itself fails.
 */
class ChunkErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  static SESSION_KEY = 'chunk_reload_attempted';
  static SHOULD_AUTO_RELOAD = import.meta.env.PROD;

  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, reloading: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const isChunkError =
      error?.name === 'ChunkLoadError' ||
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Loading chunk') ||
      error?.message?.includes('Loading CSS chunk') ||
      error?.message?.includes('Importing a module script failed');

    if (isChunkError) {
      return { hasError: true, reloading: false };
    }
    // For non-chunk errors rethrow (don't swallow them here)
    throw error;
  }

  componentDidCatch(error: Error) {
    const isChunkError =
      error?.name === 'ChunkLoadError' ||
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Loading chunk') ||
      error?.message?.includes('Loading CSS chunk') ||
      error?.message?.includes('Importing a module script failed');

    if (!isChunkError) return;

    // Guard against infinite reload loops: only auto-reload once per session
    const alreadyAttempted = sessionStorage.getItem(ChunkErrorBoundary.SESSION_KEY);
    if (!alreadyAttempted && ChunkErrorBoundary.SHOULD_AUTO_RELOAD) {
      sessionStorage.setItem(ChunkErrorBoundary.SESSION_KEY, '1');
      this.setState({ reloading: true });
      // Hard-reload fetches fresh index.html and all new hashed chunks
      window.location.reload();
    }
  }

  handleManualReload = () => {
    sessionStorage.removeItem(ChunkErrorBoundary.SESSION_KEY);
    this.setState({ reloading: true });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-4 p-8 text-center bg-[var(--background-color)] text-[var(--text-color)]">
        {this.state.reloading ? (
          <>
            <div className="w-8 h-8 rounded-full border-2 border-current border-t-transparent animate-spin opacity-60" />
            <p className="text-sm opacity-60">Updating…</p>
          </>
        ) : (
          <>
            <p className="text-base font-semibold">A new version is available.</p>
            <p className="text-sm opacity-60">Please reload to continue.</p>
            <button
              onClick={this.handleManualReload}
              className="mt-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-white text-black hover:bg-gray-100 dark:bg-white dark:text-black transition-all"
            >
              Reload
            </button>
          </>
        )}
      </div>
    );
  }
}

export default ChunkErrorBoundary;
