import { MapOptions } from 'leaflet'
import { useEffect } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'

import useMapContext from './useMapContext'
import L from 'leaflet'
import { AppConfig } from './lib/AppConfig'

interface LeafletMapContainerProps extends MapOptions {
  children: JSX.Element | JSX.Element[]
}

export const LeafletMapContainer = ({ children, ...props }: LeafletMapContainerProps) => {
  const { setMap, setLeafletLib } = useMapContext()

  useEffect(() => {
    if (!setLeafletLib) return
    import('leaflet').then(leaflet => {
      setLeafletLib(leaflet)
    })
  }, [setLeafletLib])

  return (
    <MapContainer
    key={"map"}
      zoomControl={false} zoom={AppConfig.maxZoom} fadeAnimation={false} zoomAnimation={false}  maxBoundsViscosity={1.0} maxBounds={ [[-90, -180], [90, 180]]}
      ref={e => setMap && setMap(e || undefined)}
      className="h-full w-full text-white outline-0"
      {...props}
    >
 


 <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
    />
 
    


      {children}
    </MapContainer>
  )
}
