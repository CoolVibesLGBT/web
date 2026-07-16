import type { MapOptions } from 'leaflet'
import { useEffect } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'

import useMapContext from './useMapContext'
import { AppConfig } from './lib/AppConfig'
import { useTheme } from '../../../contexts/ThemeContext'

interface LeafletMapContainerProps extends MapOptions {
  children: React.ReactNode
}

export const LeafletMapContainer = ({ children, ...props }: LeafletMapContainerProps) => {
  const { setMap, setLeafletLib } = useMapContext()
  const { theme } = useTheme()

  useEffect(() => {
    if (!setLeafletLib) return
    import('leaflet').then(leaflet => {
      if (typeof window !== 'undefined' && !(window as any).L) {
        (window as any).L = leaflet
      }
      setLeafletLib(leaflet)
    })
  }, [setLeafletLib])

  const tileUrl = theme === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'

  return (
    <MapContainer
      key={theme} // Force re-render on theme change to update tiles smoothly
      zoomControl={false}
      zoom={AppConfig.maxZoom}
      fadeAnimation={true}
      zoomAnimation={true}
      maxBoundsViscosity={1.0}
      maxBounds={[[-90, -180], [90, 180]]}
      ref={e => setMap && setMap(e || undefined)}
      className="h-full w-full z-[0]"
      {...props}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url={tileUrl}
        subdomains='abcd'
        maxZoom={20}
      />
      {children}
    </MapContainer>
  )
}
