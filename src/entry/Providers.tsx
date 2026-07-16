import React from 'react'
import '@/i18n'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { AppProvider } from '@/contexts/AppContext'
import { ToolbarContext } from '@/contexts/ToolbarContext'
import { SettingsContext } from '@/contexts/SettingsContext'
import { SocketProvider } from '@/contexts/SocketContext'
import { PushNotificationSetupContext } from '@/contexts/PushNotificationSetupContext'
import { SharedHistoryContext } from '@/contexts/SharedHistoryContext'

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <SocketProvider>
      <SettingsContext>
        <SharedHistoryContext>
          <ToolbarContext>
            <ThemeProvider>
              <AppProvider>
                <AuthProvider>
                  <PushNotificationSetupContext />
                  {children}
                </AuthProvider>
              </AppProvider>
            </ThemeProvider>
          </ToolbarContext>
        </SharedHistoryContext>
      </SettingsContext>
    </SocketProvider>
  )
}

export default Providers
