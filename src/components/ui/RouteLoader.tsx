import React from 'react'
import { useTheme } from '@/contexts/ThemeContext'

type RouteLoaderProps = {
  fullScreen?: boolean
}

const RouteLoader = ({ fullScreen = false }: RouteLoaderProps) => {
  const { theme } = useTheme()

  return (
    <div
      className={`flex items-center justify-center ${
        fullScreen ? 'fixed inset-0 z-[9999]' : 'relative h-full w-full py-10'
      }`}
    >
      <div
        className={`w-10 h-10 border-4 rounded-full animate-spin ${
          theme === 'dark'
            ? 'border-white/10 border-t-white'
            : 'border-gray-200 border-t-gray-800'
        }`}
      />
    </div>
  )
}

export default RouteLoader
