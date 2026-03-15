'use client'

import { BrowserRouter, StaticRouter } from 'react-router-dom'
import App from '@/App'
import '@/i18n'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { AppProvider } from '@/contexts/AppContext'
import { ToolbarContext } from '@/contexts/ToolbarContext'
import { SettingsContext } from '@/contexts/SettingsContext'
import { SocketProvider } from '@/contexts/SocketContext'
import { PushNotificationSetupContext } from '@/contexts/PushNotificationSetupContext'
import { SharedHistoryContext } from '@/contexts/SharedHistoryContext'

type AppShellProps = {
  initialUrl?: string
}

const resolveLocation = (initialUrl?: string) => {
  if (!initialUrl) return '/'
  try {
    const url = new URL(initialUrl)
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return '/'
  }
}

const AppShell = ({ initialUrl }: AppShellProps) => {
  const isServer = typeof window === 'undefined'
  const location = isServer ? resolveLocation(initialUrl) : undefined

  const appTree = (
    <SocketProvider>
      <SettingsContext>
        <SharedHistoryContext>
          <ToolbarContext>
            <ThemeProvider>
              <AppProvider>
                <AuthProvider>
                  <PushNotificationSetupContext />
                  <App />
                </AuthProvider>
              </AppProvider>
            </ThemeProvider>
          </ToolbarContext>
        </SharedHistoryContext>
      </SettingsContext>
    </SocketProvider>
  )

  return isServer ? (
    <StaticRouter location={location}>{appTree}</StaticRouter>
  ) : (
    <BrowserRouter>{appTree}</BrowserRouter>
  )
}

export default AppShell
