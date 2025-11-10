import { useEffect, useState } from 'react';

import MarkerCategories, { Category } from './lib/MarkerCategories';
import { AppConfig } from './lib/AppConfig';
import LeafleftMapContextProvider from './LeafletMapContextProvider';
import useMapContext from './useMapContext';
import useMarkerData from './useMarkerData';
import { useResizeDetector } from 'react-resize-detector';

import { LeafletMapContainer } from './LeafletMapContainer';
import { LocateButton } from './ui/LocateButton';
import { CenterButton } from './ui/CenterButton';
import { ZoomInButton } from './ui/ZoomInButton';
import { ZoomOutButton } from './ui/ZoomOutButton';
import { LeafletCluster } from './LeafletCluster';
import { CustomMarker } from './LeafletMarker';
import { globalState } from '../../state/nearby';
import { useAtom } from 'jotai';




const LeafletMapInner = () => {
  const { map } = useMapContext();
  const [state, setState] = useAtom(globalState);

  const [windowHeight, setWindowHeight] = useState<number | null>(() =>
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
      className="w-full h-[calc(100dvh-130px)] overflow-hidden"
      ref={viewportRef}>

      <div
        className="rounded-lg h-full w-full transition-opacity">
        {allMarkersBoundCenter && clustersByCategory &&  clustersByCategory.length > 0 && (
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
                {/* Diğer bileşenler */}
                {Object.values(clustersByCategory).map((item, index) => (
                  item && item.markers && Array.isArray(item.markers) ? (
                    <LeafletCluster
                      key={`cluster${item.category}${index}`}
                      icon={MarkerCategories[item.category as Category]?.icon}
                      color={MarkerCategories[item.category as Category]?.color}
                      chunkedLoading={true}
                    >
                      {item.markers.map((marker, markerIndex) =>
                        marker ? (
                          <CustomMarker
                            item={marker}
                            key={`markerItem${markerIndex}${marker.name}${marker.index}`}
                          />
                        ) : null
                      )}
                    </LeafletCluster>
                  ) : null
                ))}
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
const Map = () => (
  <LeafleftMapContextProvider>
    <LeafletMapInner />
  </LeafleftMapContextProvider>
);

export default Map;
