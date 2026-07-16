/// <reference types="vite/client" />

declare global {
  interface Window {
    __COOLVIBES_EXTENSION__?: {
      mode: 'vscode'
      placement?: 'sidebar' | 'panel'
      assetBaseUrl?: string
      serviceURL?: [string, string]
      socketURL?: [string, string]
      disableNotifications?: boolean
      disablePush?: boolean
      disableAnalytics?: boolean
    }
  }
}

export {}
