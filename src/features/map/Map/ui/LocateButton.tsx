import { LocateFixed } from 'lucide-react';
import { useCallback } from 'react';
import useMapContext from '../useMapContext';
import { useAtom } from 'jotai';
import { globalState } from '../../../../state/nearby';

export const LocateButton = () => {
  const { map } = useMapContext();
  const [, setState] = useAtom(globalState);

  const handleClick = useCallback(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(position => {
        const coords: [number, number] = [position.coords.latitude, position.coords.longitude];

        // Update global state
        setState(prev => ({
          ...prev,
          currentUserMapPosition: coords
        }));

        // Move map
        map?.flyTo(coords, 14);
      }, (error) => {
        console.error("Geolocation error:", error);
      }, {
        enableHighAccuracy: true
      });
    }
  }, [map, setState]);

  return (
    <button
      className="p-3 rounded-xl transition-all hover:bg-black/5 dark:hover:bg-white/10 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white"
      onClick={handleClick}
      title="Locate me"
    >
      <LocateFixed size={20} />
    </button>
  );
};
