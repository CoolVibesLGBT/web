import { LatLngExpression } from 'leaflet'
import { LocateFixed, ZoomOut } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { AppConfig } from '../lib/AppConfig'
import { Category } from '../lib/MarkerCategories'

import { CustomMarker } from '../LeafletMarker'
import useMapContext from '../useMapContext'

export const ZoomOutButton = () => {
  const { map } = useMapContext()
  const [userPosition, setUserPosition] = useState<LatLngExpression | undefined>(undefined)

  const handleClick = useCallback(() => {
        map?.zoomOut()

  }, [])

  useEffect(() => {
    if (userPosition) {
      map?.flyTo(userPosition,undefined,{animate:false})
    }
  }, [map, userPosition])

  return (
    <>
      <button
    
        style={{ zIndex:1  }}
        className=" absolute top-[200px] right-3 p-2  "
        onClick={() => handleClick()}
      >
        <ZoomOut size={AppConfig.ui.mapIconSize} />
      </button>
    </>
  )
}
