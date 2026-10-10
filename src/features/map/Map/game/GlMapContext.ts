import { createContext, useContext } from 'react';
import type { Map as MaplibreMap } from 'maplibre-gl';

/** Alttaki gerçek MapLibre GL haritasını çocuklara iletir — GlMarker ve
 * kontroller bunu doğrudan okur. Kanıtlanmış referans mimarisiyle (Context +
 * deklaratif per-marker bileşen) birebir aynı desen. */
export const GlMapContext = createContext<MaplibreMap | null>(null);

export function useGlMap(): MaplibreMap | null {
  return useContext(GlMapContext);
}
