import { LatLngExpression, Map } from 'leaflet'
import { useEffect, useMemo, useState } from 'react'

import { AppConfig } from './lib/AppConfig'
import { PlacesClusterType, PlacesType } from './lib/Places'
import { decodeGeoHash } from './lib/helper/geocoder';
import { Category } from './lib/MarkerCategories';
import useMapContext from './useMapContext';

interface useMapDataValues {
  locations?: (any)[];
  map?: Map
  viewportWidth?: number
  viewportHeight?: number
}

interface allMarkerPosValues {
  minZoom: number
  centerPos: LatLngExpression
}

const useMarkerData = ({ locations, map, viewportWidth, viewportHeight }: useMapDataValues) => {
  const [allMarkersBoundCenter, setAllMarkersBoundCenter] = useState<allMarkerPosValues>({
    minZoom: AppConfig.initialZoom,//AppConfig.minZoom > 5 ? AppConfig.minZoom - 5 : AppConfig.minZoom,
    centerPos: AppConfig.baseCenterAvax,
  })
  const { leafletLib } = useMapContext()
 
  // get bounds of all markers
  const allMarkerBounds = useMemo(() => {
    if (!locations || !leafletLib) return undefined

    const coordsSum: LatLngExpression[] = []
    locations.forEach(item => {
      let position: LatLngExpression = decodeGeoHash(item)
  
      coordsSum.push(position)
    })

    return leafletLib.latLngBounds(coordsSum)
  }, [leafletLib, locations])

  const clustersByCategory = useMemo(() => {
    if (!locations) return undefined

    const groupedLocations = locations.reduce<PlacesClusterType>((acc, location) => {
      
    const key =  Category.USER;

      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(location)
      return acc
    }, {})

    const mappedClusters = Object.keys(groupedLocations).map(key => ({
      category: Number(key),
      markers: groupedLocations[key],
    }))

    return  mappedClusters
  }, [locations])

 

  useEffect(() => {
    // Eğer allMarkerBounds veya map geçerli değilse işlemi sonlandır
    if (!allMarkerBounds || !map || !viewportWidth || !viewportHeight) {
      return;
    }
  
  
    try {
      // `allMarkerBounds.isValid()` ile geçerli olup olmadığını kontrol et
      if (!allMarkerBounds.isValid()) {
        console.log("Invalid allMarkerBounds:", allMarkerBounds);
        return; // Geçersiz sınır verisi ile devam etme
      }
  
      // `map` nesnesinin geçerli olduğuna emin ol
      if (!map) {
        console.error("Map is not available");
        return;
      }
  
      map.invalidateSize(); // Harita boyutlarını güncelleme
  
      // Zoom seviyesini hesapla
      const zoom = map.getBoundsZoom(allMarkerBounds);
      // Harita merkezini hesapla
      const center = allMarkerBounds.getCenter();
  
      /*
      setAllMarkersBoundCenter({
        minZoom: zoom,
        centerPos: [center.lat, center.lng],
      });
      */
    } catch (error) {
      console.error("Error in map or bounds handling:", error);
    }
  }, [allMarkerBounds, map,viewportWidth, viewportHeight]);

  return { clustersByCategory, allMarkersBoundCenter }
}

export default useMarkerData
