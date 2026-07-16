import { ZoomIn } from 'lucide-react';
import { useCallback } from 'react';
import useMapContext from '../useMapContext';

export const ZoomInButton = () => {
  const { map } = useMapContext();

  const handleClick = useCallback(() => {
    map?.zoomIn();
  }, [map]);

  return (
    <button
      className="p-3 rounded-xl transition-all hover:bg-black/5 dark:hover:bg-white/10 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white"
      onClick={handleClick}
    >
      <ZoomIn size={20} />
    </button>
  );
};
