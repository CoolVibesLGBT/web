type VscodeExtensionConfig = {
  mode: 'vscode'
  placement?: 'sidebar' | 'panel'
  assetBaseUrl?: string
  serviceURL?: [string, string]
  socketURL?: [string, string]
  disableNotifications?: boolean
  disablePush?: boolean
  disableAnalytics?: boolean
}

const getWindowObject = () =>
  (typeof window !== 'undefined'
    ? window
    : undefined) as (Window & {
    __COOLVIBES_EXTENSION__?: VscodeExtensionConfig
  }) | undefined

export const getVscodeExtensionConfig = () => getWindowObject()?.__COOLVIBES_EXTENSION__

export const isRunningInVscode = () => Boolean(getVscodeExtensionConfig())

export const resolvePublicAssetUrl = (path: string) => {
  if (!path || !path.startsWith('/')) return path

  const assetBaseUrl = getVscodeExtensionConfig()?.assetBaseUrl
  if (!assetBaseUrl) return path

  return `${assetBaseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}

export const getRuntimeServiceURL = () => getVscodeExtensionConfig()?.serviceURL

export const getRuntimeSocketURL = () => getVscodeExtensionConfig()?.socketURL

export const canUseBrowserNotifications = () => {
  const config = getVscodeExtensionConfig()
  return !config?.disableNotifications
}

export const canUsePushNotifications = () => {
  const config = getVscodeExtensionConfig()
  return !config?.disablePush && canUseBrowserNotifications()
}

export const openExternalUrl = (url: string) => {
  if (typeof window === 'undefined') return

  if (isRunningInVscode()) {
    window.open(url, '_blank', 'noopener,noreferrer')
    return
  }

  window.location.href = url
}
