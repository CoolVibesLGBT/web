import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import { AppProvider } from './contexts/AppContext.tsx'
import { ToolbarContext } from './contexts/ToolbarContext.tsx'
import { SettingsContext } from './contexts/SettingsContext.tsx'
import './i18n'

import { SocketProvider } from './contexts/SocketContext.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
      <SocketProvider>
        <SettingsContext>
          <ToolbarContext>
            <ThemeProvider>
              <AppProvider>
                <AuthProvider>
                  <App />
                </AuthProvider>
              </AppProvider>
            </ThemeProvider>
          </ToolbarContext>
        </SettingsContext>
      </SocketProvider>
    </BrowserRouter>
)
