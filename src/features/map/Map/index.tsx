import { useAtom } from 'jotai';
import { globalState } from '../../../state/nearby';
import { getSafeImageURLEx, generateFallbackImage } from '../../../helpers/helpers';
import { decodeGeoHash } from './lib/helper/geocoder';
import GameMap, { type GameMarkerContent } from './game/GameMap';

interface MapProps {
  onMarkerClick?: (item: any) => void;
  onMapMoveEnd?: (lat: number, lng: number) => void;
  locations?: any[];
}

const getMarkerContent = (item: any): GameMarkerContent => ({
  imageUrl: getSafeImageURLEx(item?.public_id, item?.avatar, 'small') || generateFallbackImage(item?.public_id),
  label: item?.username,
  variant: 'pokestop',
});

const getMarkerId = (item: any): string => String(item?.public_id ?? item?.id ?? item?.username);

const getMarkerCoords = (item: any): [number, number] => {
  const [lat, lng] = decodeGeoHash(item) as [number, number];
  return [lat, lng];
};

const Map = ({ onMarkerClick, onMapMoveEnd, locations }: MapProps) => {
  const [state] = useAtom(globalState);
  const markerLocations = locations ?? state.nearbyUsers;

  return (
    <GameMap
      locations={markerLocations}
      getMarkerId={getMarkerId}
      getMarkerCoords={getMarkerCoords}
      getMarkerContent={getMarkerContent}
      onMarkerClick={onMarkerClick}
      onMapMoveEnd={onMapMoveEnd}
      playerPosition={state.currentUserMapPosition}
    />
  );
};

export default Map;
