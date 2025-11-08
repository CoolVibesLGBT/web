import { LatLngExpression } from 'leaflet'
import { LocateFixed } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { AppConfig } from '../lib/AppConfig'
import { Category } from '../lib/MarkerCategories'

import { CustomMarker } from '../LeafletMarker'
import useMapContext from '../useMapContext'
import { useAuth } from '../../../contexts/AuthContext'



export const LocateButton = () => {
  const { map } = useMapContext()
  const [userPosition, setUserPosition] = useState<LatLngExpression | undefined>(undefined)
  const { user, isAuthenticated, logout } = useAuth();

  const handleClick = useCallback(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(position => {
        setUserPosition([position.coords.latitude, position.coords.longitude])
      })
    } else {
      setUserPosition(undefined)
    }
  }, [])

  useEffect(() => {
    if (userPosition) {
      map?.flyTo(userPosition)
    }
  }, [map, userPosition])

  useEffect(()=>{
    console.log("AuthUser",user)
  },[])

  return (
    <>
      <button
        
        style={{ zIndex: 400 }}
        className=" absolute top-[138px] right-3 p-2  "
        onClick={() => handleClick()}
      >
        <LocateFixed size={AppConfig.ui.mapIconSize} />
      </button>
      {userPosition && (
  <CustomMarker
    item={{
      user
    }}
  />
)}
    </>
  )
}
