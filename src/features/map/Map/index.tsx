import { useEffect, useState } from 'react';

import { AppConfig } from './lib/AppConfig';
import LeafleftMapContextProvider from './LeafletMapContextProvider';
import useMapContext from './useMapContext';
import useMarkerData from './useMarkerData';
import { useResizeDetector } from 'react-resize-detector';

import { LeafletMapContainer } from './LeafletMapContainer';
import { MapControls } from './ui/MapControls';
import { CustomMarker } from './LeafletMarker';
import { globalState } from '../../../state/nearby';
import { useAtom } from 'jotai';
import { useAuth } from '../../../contexts/AuthContext';
import { useMapEvents } from 'react-leaflet';




const MapEvents = ({ onMapMoveEnd }: { onMapMoveEnd?: (lat: number, lng: number) => void }) => {
  useMapEvents({
    moveend: (e) => {
      const center = e.target.getCenter();
      if (onMapMoveEnd) {
        onMapMoveEnd(center.lat, center.lng);
      }
    },
  });
  return null;
};

const LeafletMapInner = ({ onMarkerClick, onMapMoveEnd }: { onMarkerClick?: (item: unknown) => void; onMapMoveEnd?: (lat: number, lng: number) => void }) => {
  const { map } = useMapContext();
  const [state, _setState] = useAtom(globalState);
  const { user } = useAuth();

  const [_windowHeight, setWindowHeight] = useState<number | null>(() =>
    typeof window !== 'undefined' ? window.innerHeight : null
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleResize = () => {
      setWindowHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const {
    width: viewportWidth,
    height: viewportHeight,
    ref: viewportRef,
  } = useResizeDetector({
    refreshMode: 'debounce',
    refreshRate: 500,
  });






  const { clustersByCategory, allMarkersBoundCenter } = useMarkerData({
    locations: state.nearbyUsers,
    map,
    viewportWidth,
    viewportHeight,
  });
  console.log(state.nearbyUsers)



  console.log("clustersByCategory", clustersByCategory)
  const isLoading = !map || !viewportWidth || !viewportHeight || clustersByCategory?.length == 0;




  return (
    <div
      className="w-full h-full overflow-hidden"
      ref={viewportRef}>

      <div
        className="rounded-lg h-full w-full transition-opacity">
        {allMarkersBoundCenter && clustersByCategory && clustersByCategory.length > 0 && (
          <LeafletMapContainer
            center={allMarkersBoundCenter.centerPos}
            zoom={allMarkersBoundCenter.minZoom}
            maxZoom={AppConfig.maxZoom}
            minZoom={AppConfig.minZoom}
            zoomAnimation={true}
            fadeAnimation={true}
          >
            {!isLoading ? (
              <>
                {/* Direct marker rendering without clustering */}
                {Object.values(clustersByCategory).flatMap((item) =>
                  item && item.markers && Array.isArray(item.markers)
                    ? item.markers.map((marker) =>
                      marker ? (
                        <CustomMarker
                          item={marker}
                          key={`markerItem-${marker.id || marker.public_id}`}
                          onClick={onMarkerClick}
                        />
                      ) : null
                    )
                    : []
                )}

                {/* Unified Map Controls Panel */}
                <MapControls
                  center={allMarkersBoundCenter.centerPos}
                  zoom={allMarkersBoundCenter.minZoom}
                />

                {/* User Location Marker */}
                {state.currentUserMapPosition && (
                  <CustomMarker
                    item={{
                      ...user,
                      location: {
                        latitude: state.currentUserMapPosition[0],
                        longitude: state.currentUserMapPosition[1]
                      }
                    }}
                    key="currentUserLocation"
                    onClick={onMarkerClick}
                  />
                )}

                <MapEvents onMapMoveEnd={onMapMoveEnd} />
              </>
            ) : (
              <></>
            )}
          </LeafletMapContainer>
        )}
      </div>





    </div>


  );
};

// pass through to get context in <MapInner>
const Map = ({ onMarkerClick, onMapMoveEnd }: { onMarkerClick?: (item: any) => void, onMapMoveEnd?: (lat: number, lng: number) => void }) => (
  <LeafleftMapContextProvider>
    <LeafletMapInner onMarkerClick={onMarkerClick} onMapMoveEnd={onMapMoveEnd} />
  </LeafleftMapContextProvider>
);

export default Map;
