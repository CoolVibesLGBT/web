import React, { Suspense, useEffect } from 'react'
import App from '@/App'
import Providers from './Providers'
import SplashScreen from '@/components/ui/SplashScreen'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { applicationName } from '@/appSettings'

const normalizePath = (path: string) => {
  if (!path) return '/'
  return path !== '/' && path.endsWith('/') ? path.slice(0, -1) : path
}

const isSplashPreviewPath = () =>
  typeof window !== 'undefined' && normalizePath(window.location.pathname) === '/splash'

const SplashPreviewRoot = () => {
  useEffect(() => {
    if (typeof document === 'undefined') return

    document.title = `Splash Preview | ${applicationName}`

    let robotsMeta = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta')
      robotsMeta.name = 'robots'
      document.head.appendChild(robotsMeta)
    }
    robotsMeta.content = 'noindex,nofollow'
  }, [])

  return (
    <ThemeProvider>
      <SplashScreen autoDismiss={false} animate={true} />
    </ThemeProvider>
  )
}

const AppRoot = () => {
  if (isSplashPreviewPath()) {
    return <SplashPreviewRoot />
  }

  return (
    <Providers>
      <Suspense fallback={null}>
        <App />
      </Suspense>
    </Providers>
  )
}

export default AppRoot
