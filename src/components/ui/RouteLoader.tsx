import React from 'react'
import { useTheme } from '@/contexts/ThemeContext'

const RouteLoader = () => {
  const { theme } = useTheme()

  return (
    <div className="h-full w-full flex items-center justify-center bg-[var(--background-color)]">
      <div className="flex items-center gap-3 text-sm">
        <div
          className={`w-5 h-5 rounded-full border-2 border-t-transparent animate-spin ${
            theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
          }`}
        />
        <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          Loading…
        </span>
      </div>
    </div>
  )
}

export default RouteLoader
