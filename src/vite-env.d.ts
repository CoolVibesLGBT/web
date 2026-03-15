/// <reference types="vite/client" />

interface ImportMeta {
  readonly viteRsc: {
    loadModule: <T>(environment: 'rsc' | 'ssr' | 'client', name: string) => Promise<T>
    loadBootstrapScriptContent: (name: string) => Promise<string>
  }
}
