import React, { useCallback, useState } from 'react';
import { Marker as ReactMarker } from 'react-leaflet';


import useMapContext from '../useMapContext';
import useLeafletReady from '../useLeafletReady';
import MarkerIconWrapper from './MarkerIconWrapper';

import LeafletDivIcon from '../LeafletDivIcon';
import LeafletPopup from '../LeafletPopup';
import { decodeGeoHash } from '../lib/helper/geocoder';
import { useNavigate } from '@/router';



export interface CustomMarkerProps {
  item: any;
  onClick?: (item: any) => void;
}

export const CustomMarker = React.memo(({ item, onClick }: CustomMarkerProps) => {
  const { map } = useMapContext();
  const isLeafletReady = useLeafletReady();
  const navigate = useNavigate()

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePopupClose = useCallback(() => {
    if (!map) return;
    map?.closePopup();
  }, [map]);



  const handleMarkerClick = useCallback(() => {
    if (!map) return;
    const clampZoom = map.getZoom();// <  AppConfig.maxZoom ? 14 : 14;
    map.setView(decodeGeoHash(item), clampZoom, { animate: false });

    if (onClick) {
      onClick(item);
    } else {
      navigate(`/${item.username}`, { replace: true });
    }
  }, [map, item, onClick, navigate]);



  const generateSolidColorFromIndex = (_index: any): string => {
    // Hash benzeri bir algoritma ile tutarlı bir renk üret
    const getChannel = (seed: bigint): number => {
      const sinValue = Math.sin(Number(seed % BigInt(Number.MAX_SAFE_INTEGER)));
      return (Math.abs(sinValue) * 256) % 256;
    };

    const index = _index ? BigInt(_index) : BigInt(0);
    const r = Math.floor(getChannel(index * BigInt(123456)));
    const g = Math.floor(getChannel(index * BigInt(789101)));
    const b = Math.floor(getChannel(index * BigInt(112131)));

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  if (!isLeafletReady) {
    return null;
  }

  return (
    <ReactMarker
      position={decodeGeoHash(item)}
      // @ts-expect-error - LeafletDivIcon type not compatible with Leaflet Marker icon type
      icon={LeafletDivIcon({
        source: (
          <MarkerIconWrapper
            item={item}
            color={generateSolidColorFromIndex(item?.public_id)}
            label={item?.username}
          />
        ),
        anchor: [30, 78],
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
});
