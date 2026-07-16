import React from 'react'
import { createRoot } from 'react-dom/client'
import AppRoot from '@/entry/AppRoot'
import '@/index.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element #root was not found')
}

createRoot(rootElement).render(
  <React.StrictMode>
    <AppRoot />
  </React.StrictMode>
)
