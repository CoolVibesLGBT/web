import React, { useCallback, useMemo, useState } from 'react';
import { Marker as ReactMarker } from 'react-leaflet';

import { AppConfig } from '../lib/AppConfig';
import MarkerCategories from '../lib/MarkerCategories';
import { PlaceValues } from '../lib/Places';

import useMapContext from '../useMapContext';
import MarkerIconWrapper from './MarkerIconWrapper';

import LeafletDivIcon from '../LeafletDivIcon';
import LeafletPopup from '../LeafletPopup';
import { decodeGeoHash } from '../lib/helper/geocoder';
import { getSafeImageURL } from '../../../helpers/helpers';



export interface CustomMarkerProps {
  item: any
}

export const CustomMarker = ({ item }: CustomMarkerProps) => {
  const { map } = useMapContext();

    const [isModalOpen, setIsModalOpen] = useState(false);

    const markerCategory = useMemo(() => {
      return "ersan";
    }, [item]);

  const handlePopupClose = useCallback(() => {
    if (!map) return;
    map?.closePopup();
  }, [map]);


 
  const handleMarkerClick = useCallback(() => {
    if (!map) return;
   // const clampZoom = map.getZoom();// <  AppConfig.maxZoom ? 14 : 14;
   // map.setView(decodeGeoHash(place.geohash), clampZoom, { animate: false });
    //setIsModalOpen(true);
    
  }, [map]);



   const generateAlphaColorFromIndex = (index: bigint): string => {
    // Hash benzeri bir algoritma ile tutarlı bir renk üret
    const getChannel = (seed: bigint): number => {
      const sinValue = Math.sin(Number(seed % BigInt(Number.MAX_SAFE_INTEGER)));
      return (Math.abs(sinValue) * 256) % 256;
    };
  
    const r = Math.floor(getChannel(index * BigInt(123456)));
    const g = Math.floor(getChannel(index * BigInt(789101)));
    const b = Math.floor(getChannel(index * BigInt(112131)));
    const alpha = Math.floor(0.6 * 255); // 40% transparency
  
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}${alpha.toString(16).padStart(2, '0')}`;
  };

  return (
    <ReactMarker
      position={decodeGeoHash(item)}
      // @ts-ignore
      icon={LeafletDivIcon({
        source: (
          <MarkerIconWrapper
            item={{
              group: false,
              image: getSafeImageURL(item?.avatar,"icon"),
              data:item
            }}   
            color= {generateAlphaColorFromIndex(BigInt(item?.public_id))}  
            label={item?.username }   
          />
        ),
        anchor: [
          AppConfig.ui.markerIconSize / 2,
          AppConfig.ui.markerIconSize / 2,
        ],
      })}
      eventHandlers={{ click: handleMarkerClick }}
      autoPan={true}
      autoPanOnFocus={true}
    >
    <LeafletPopup
        autoPan={true}
        autoClose={true}
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        closeButton={true}
        item={item}
        handlePopupClose={handlePopupClose}
      />
    </ReactMarker>
  );
};
