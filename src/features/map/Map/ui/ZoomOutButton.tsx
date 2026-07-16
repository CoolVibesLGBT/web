import { ZoomOut } from 'lucide-react';
import { useCallback } from 'react';
import useMapContext from '../useMapContext';

export const ZoomOutButton = () => {
  const { map } = useMapContext();

  const handleClick = useCallback(() => {
    map?.zoomOut();
  }, [map]);

  return (
    <button
      className="p-3 rounded-xl transition-all hover:bg-black/5 dark:hover:bg-white/10 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white"
      onClick={handleClick}
    >
      <ZoomOut size={20} />
    </button>
  );
};
