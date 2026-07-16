import type { LatLngExpression } from 'leaflet';
import { Shrink } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useMapEvents } from 'react-leaflet';
import useMapContext from '../useMapContext';

interface CenterButtonProps {
  center: LatLngExpression;
  zoom: number;
}

export const CenterButton = ({ center, zoom }: CenterButtonProps) => {
  const [isTouched, setIsTouched] = useState(false);
  const { map } = useMapContext();

  const touch = useCallback(() => {
    if (!isTouched && map) {
      setIsTouched(true);
    }
  }, [isTouched, map]);

  useMapEvents({
    move() {
      touch();
    },
    zoom() {
      touch();
    },
  });

  const handleClick = useCallback(() => {
    if (!isTouched || !map) return;

    map.flyTo(center, zoom);
    map.once('moveend', () => {
      setIsTouched(false);
    });
  }, [map, isTouched, zoom, center]);

  return (
    <button
      className={`p-3 rounded-xl transition-all ${isTouched
        ? 'hover:bg-black/5 dark:hover:bg-white/10 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white'
        : 'opacity-30 cursor-default text-black/40 dark:text-white/40'
        }`}
      onClick={handleClick}
    >
      <Shrink size={20} />
    </button>
  );
};
